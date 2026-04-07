import { Request, Response, NextFunction } from 'express';
import { db } from '../utils/db';

export const getPlaybooks = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const playbooks = await db.playbook.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: playbooks });
  } catch (error) {
    next(error);
  }
};

export const createPlaybook = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const role = req.user!.role;
    if (role === 'USER') {
      res.status(403).json({ success: false, error: 'Forbidden: Only ADMIN or MANAGER can create playbooks' });
      return;
    }
    const { title, contentMarkdown, webhookUrl, triggerState } = req.body;
    if (!title || !contentMarkdown || !webhookUrl || !triggerState) {
      res.status(400).json({ success: false, error: 'Missing required fields: title, contentMarkdown, webhookUrl, triggerState' });
      return;
    }
    const validStates = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'];
    if (!validStates.includes(triggerState)) {
      res.status(400).json({ success: false, error: `triggerState must be one of: ${validStates.join(', ')}` });
      return;
    }
    const playbook = await db.playbook.create({
      data: { title, contentMarkdown, webhookUrl, triggerState },
    });
    res.status(201).json({ success: true, data: playbook });
  } catch (error) {
    next(error);
  }
};

export const deletePlaybook = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const role = req.user!.role;
    if (role !== 'ADMIN') {
      res.status(403).json({ success: false, error: 'Forbidden: Only ADMIN can delete playbooks' });
      return;
    }
    const id = parseInt(req.params.id as string);
    await db.playbook.update({ where: { id }, data: { deletedAt: new Date() } });
    res.json({ success: true, message: 'Playbook deleted' });
  } catch (error) {
    next(error);
  }
};
