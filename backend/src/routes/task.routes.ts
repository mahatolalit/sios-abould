import { Router } from 'express';
import { createTask, getTasks, getTask, updateTaskStatus, deleteTask } from '../controllers/task.controller';
import { validateRequest } from '../middlewares/validate.middleware';
import { createTaskSchema, updateTaskStatusSchema, getTasksQuerySchema } from '../validations/task.schema';
import { authMiddleware } from '../middlewares/auth.middleware';
import { idempotencyMiddleware } from '../middlewares/idempotency.middleware';

const router = Router();

// All task routes require authentication
router.use(authMiddleware);

router.post('/', validateRequest(createTaskSchema), idempotencyMiddleware, createTask);
router.get('/', validateRequest(getTasksQuerySchema), getTasks);
router.get('/:id', getTask);
router.patch('/:id/status', validateRequest(updateTaskStatusSchema), updateTaskStatus);
router.delete('/:id', deleteTask);

export default router;
