import { Router } from 'express';
import { OrderController } from '../controllers/order.controller';
import { validate, createOrderSchema, pickOrderSchema } from '../validators';
import { authorize } from '../middleware/rbac.middleware';
import { Role } from '../types';

const router = Router();

router.get('/', OrderController.getAll);
router.get('/:id', OrderController.getById);
router.post('/', authorize(Role.ADMIN, Role.WAREHOUSE_MANAGER), validate(createOrderSchema), OrderController.create);
router.post('/:id/allocate', authorize(Role.ADMIN, Role.WAREHOUSE_MANAGER), OrderController.allocate);
router.post('/:id/reserve', authorize(Role.ADMIN, Role.WAREHOUSE_MANAGER), OrderController.reserve);
router.post('/:id/release', authorize(Role.ADMIN, Role.WAREHOUSE_MANAGER), OrderController.release);
router.post('/:id/pick', authorize(Role.ADMIN, Role.WAREHOUSE_MANAGER, Role.STAFF, Role.PICKER), validate(pickOrderSchema), OrderController.pick);
router.post('/:id/complete', authorize(Role.ADMIN, Role.WAREHOUSE_MANAGER, Role.STAFF), OrderController.complete);
router.post('/:id/cancel', authorize(Role.ADMIN, Role.WAREHOUSE_MANAGER), OrderController.cancel);

export default router;
