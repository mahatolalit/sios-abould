import { Request, Response, NextFunction } from 'express';
import { TaskService } from '../services/task.service';

export const createTask = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const task = await TaskService.createTask({
      ...req.body,
      creatorId: userId
    });
    // This status triggers idempotency middleware
    res.status(201).json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
};

export const getTasks = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const role = req.user!.role;
    
    // Parse query
    const cursor = req.query.cursor ? parseInt(req.query.cursor as string) : undefined;
    const limit = parseInt(req.query.limit as string) || 10;

    const tasks = await TaskService.getTasks(userId, role, cursor, limit);
    
    const nextCursor = tasks.length > 0 ? tasks[tasks.length - 1].id : null;

    res.json({ success: true, data: tasks, nextCursor });
  } catch (error) {
    next(error);
  }
};

export const getTask = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const role = req.user!.role;
    const taskId = parseInt(req.params.id as string);

    const task = await TaskService.getTaskById(taskId, userId, role);
    res.json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
};

export const updateTaskStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const role = req.user!.role;
    const taskId = parseInt(req.params.id as string);
    const { status } = req.body;

    const updatedTask = await TaskService.updateTaskStatus(taskId, status, userId, role);
    res.json({ success: true, data: updatedTask });
  } catch (error) {
    next(error);
  }
};

export const deleteTask = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const role = req.user!.role;
    const taskId = parseInt(req.params.id as string);

    await TaskService.softDeleteTask(taskId, userId, role);
    res.json({ success: true, message: 'Task deleted successfully' });
  } catch (error) {
    next(error);
  }
};
