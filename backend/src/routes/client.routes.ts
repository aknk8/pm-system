import { Router } from 'express';
import {
  getClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient
} from '../controllers/client.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', getClients);
router.get('/:id', getClientById);
router.post('/', authorize('admin', 'manager'), createClient);
router.put('/:id', authorize('admin', 'manager'), updateClient);
router.delete('/:id', authorize('admin', 'manager'), deleteClient);

export default router;
