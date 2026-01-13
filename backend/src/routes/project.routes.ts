import { Router } from 'express';
import { getProjects, getProjectById, createProject, updateProject, deleteProject } from '../controllers/project.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticate);
router.get('/', getProjects);
router.get('/:id', getProjectById);
router.post('/', authorize('admin', 'manager'), createProject);
router.put('/:id', authorize('admin', 'manager'), updateProject);
router.delete('/:id', authorize('admin'), deleteProject);

export default router;
