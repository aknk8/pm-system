import { Router } from 'express';
import { getProjectProfit, getPMProfit, getClientRevenue } from '../controllers/report.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticate);
router.get('/projects/:id/profit', getProjectProfit);
router.get('/pm/:employee_id/profit', getPMProfit);
router.get('/clients/:id/revenue', getClientRevenue);

export default router;
