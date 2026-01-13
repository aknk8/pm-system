import { Router } from 'express';
import { getSummary, getPMRanking, getAlerts } from '../controllers/dashboard.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticate);
router.get('/summary', getSummary);
router.get('/pm-ranking', getPMRanking);
router.get('/alerts', getAlerts);

export default router;
