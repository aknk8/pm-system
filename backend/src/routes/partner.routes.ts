import { Router } from 'express';
import {
  getPartners,
  getPartnerById,
  createPartner,
  updatePartner,
  deletePartner
} from '../controllers/partner.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', getPartners);
router.get('/:id', getPartnerById);
router.post('/', authorize('admin', 'manager'), createPartner);
router.put('/:id', authorize('admin', 'manager'), updatePartner);
router.delete('/:id', authorize('admin'), deletePartner);

export default router;
