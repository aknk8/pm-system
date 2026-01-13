import { Router } from 'express';
import { getMonthlyCosts, createMonthlyCost, updateMonthlyCost, deleteMonthlyCost } from '../controllers/monthly-cost.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticate);
router.get('/', getMonthlyCosts);
router.post('/', createMonthlyCost);
router.put('/:id', updateMonthlyCost);
router.delete('/:id', deleteMonthlyCost);

export default router;
