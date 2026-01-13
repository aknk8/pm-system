import { Router } from 'express';
import { getContracts, getContractById, createContract, updateContract, deleteContract } from '../controllers/contract.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticate);
router.get('/', getContracts);
router.get('/:id', getContractById);
router.post('/', authorize('admin', 'manager'), createContract);
router.put('/:id', authorize('admin', 'manager'), updateContract);
router.delete('/:id', authorize('admin'), deleteContract);

export default router;
