import { Router } from 'express';
import { getPlaybooks, createPlaybook, deletePlaybook } from '../controllers/playbook.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/', getPlaybooks);
router.post('/', createPlaybook);
router.delete('/:id', deletePlaybook);

export default router;
