import { db } from '../utils/db';
import { TaskStatus } from '@prisma/client';
import { WebhookService } from './webhook.service';

export class TaskService {
  // Allowed transitions Map
  private static allowedTransitions: Record<TaskStatus, TaskStatus[]> = {
    TODO: ['IN_PROGRESS'],
    IN_PROGRESS: ['IN_REVIEW', 'TODO'],
    IN_REVIEW: ['DONE', 'IN_PROGRESS'],
    DONE: []
  };

  static async createTask(data: { title: string; description?: string; assignedTo?: number; creatorId: number; playbookId?: number }) {
    return db.task.create({
      data: {
        title: data.title,
        description: data.description,
        assignedTo: data.assignedTo,
        creatorId: data.creatorId,
        playbookId: data.playbookId,
        status: 'TODO'
      }
    });
  }

  static async getTasks(userId: number, role: string, cursor?: number, limit: number = 10) {
    let whereClause: any = { deletedAt: null };

    // Data Isolation
    if (role === 'USER') {
      whereClause.assignedTo = userId;
    }
    // ADMIN and MANAGER see all tasks where deletedAt is null

    return db.task.findMany({
      take: limit,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      where: whereClause,
      orderBy: { id: 'asc' },
      include: {
        creator: { select: { id: true, email: true } },
        assignee: { select: { id: true, email: true } },
        playbook: { select: { id: true, title: true } }
      }
    });
  }

  static async getTaskById(taskId: number, userId: number, role: string) {
    const task = await db.task.findUnique({
      where: { id: taskId, deletedAt: null },
      include: {
        playbook: { select: { id: true, title: true, contentMarkdown: true } }
      }
    });

    if (!task) throw { status: 404, message: 'Task not found' };

    // Re-verify data isolation per requirements
    if (role === 'USER' && task.assignedTo !== userId) {
        throw { status: 403, message: 'Forbidden' };
    }

    return task;
  }

  static async updateTaskStatus(taskId: number, newStatus: TaskStatus, userId: number, role: string) {
    const task = await this.getTaskById(taskId, userId, role);

    const allowedNextStatuses = this.allowedTransitions[task.status];
    if (!allowedNextStatuses.includes(newStatus)) {
      throw { status: 400, message: `Invalid state transition from ${task.status} to ${newStatus}` };
    }

    const updatedTask = await db.task.update({
      where: { id: taskId },
      data: { status: newStatus },
      include: { playbook: true }
    });

    // Event-Driven Webhooks: Fire if triggered
    if (updatedTask.playbook && updatedTask.playbook.triggerState === newStatus) {
      // Fire async, do not await it so it blocks the response
      WebhookService.fireWebhook(updatedTask.playbook.webhookUrl, {
        taskId: updatedTask.id,
        title: updatedTask.title,
        newStatus: newStatus,
        playbookId: updatedTask.playbook.id,
      }).catch(console.error); // Catch any floating promises
    }

    // Omit sensitive playbook parts when returning to user
    const { playbook, ...rest } = updatedTask;
    return { ...rest, playbook: playbook ? { id: playbook.id, title: playbook.title } : null };
  }

  static async softDeleteTask(taskId: number, userId: number, role: string) {
    if (role === 'USER') {
      throw { status: 403, message: 'Forbidden: Cannot delete task' };
    }
    
    // Ensure it exists and caller has access
    await this.getTaskById(taskId, userId, role);

    return db.task.update({
      where: { id: taskId },
      data: { deletedAt: new Date() }
    });
  }
}
