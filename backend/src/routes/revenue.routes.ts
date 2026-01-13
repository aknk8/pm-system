import { Router } from 'express';
import { getRevenues, createRevenue, updateRevenue, deleteRevenue } from '../controllers/revenue.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticate);
router.get('/', getRevenues);
router.post('/', createRevenue);
router.put('/:id', updateRevenue);
router.delete('/:id', deleteRevenue);

export default router;
