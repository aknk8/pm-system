import { Router } from 'express';
import {
  getEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getCostHistory,
  addCostHistory
} from '../controllers/employee.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', getEmployees);
router.get('/:id', getEmployeeById);
router.post('/', authorize('admin', 'manager'), createEmployee);
router.put('/:id', authorize('admin', 'manager'), updateEmployee);
router.delete('/:id', authorize('admin'), deleteEmployee);
router.get('/:id/cost-history', getCostHistory);
router.post('/:id/cost-history', authorize('admin', 'manager'), addCostHistory);

export default router;
