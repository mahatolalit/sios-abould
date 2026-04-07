import { Request, Response, NextFunction } from 'express';
import { db } from '../utils/db';

export const getUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const role = req.user!.role;
    if (role === 'USER') {
      res.status(403).json({ success: false, error: 'Forbidden' });
      return;
    }
    const users = await db.user.findMany({
      where: { deletedAt: null },
      select: { id: true, email: true, role: true },
      orderBy: { email: 'asc' },
    });
    res.json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
};
