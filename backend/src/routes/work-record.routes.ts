import { Router } from 'express';
import { getWorkRecords, importWorkRecords, createWorkRecord, updateWorkRecord, deleteWorkRecord } from '../controllers/work-record.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticate);
router.get('/', getWorkRecords);
router.post('/import', importWorkRecords);
router.post('/', createWorkRecord);
router.put('/:id', updateWorkRecord);
router.delete('/:id', deleteWorkRecord);

export default router;
