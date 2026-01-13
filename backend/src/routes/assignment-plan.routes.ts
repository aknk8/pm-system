import { Router } from 'express';
import { getAssignmentPlans, createAssignmentPlan, updateAssignmentPlan, deleteAssignmentPlan } from '../controllers/assignment-plan.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticate);
router.get('/', getAssignmentPlans);
router.post('/', createAssignmentPlan);
router.put('/:id', updateAssignmentPlan);
router.delete('/:id', deleteAssignmentPlan);

export default router;
