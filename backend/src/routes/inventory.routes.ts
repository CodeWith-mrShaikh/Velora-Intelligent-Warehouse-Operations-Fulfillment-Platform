import { Router } from 'express';
import { InventoryController } from '../controllers/inventory.controller';
import { validate, inwardSchema, outwardSchema, transferSchema, adjustmentSchema } from '../validators';
import { idempotencyMiddleware } from '../middleware/idempotency.middleware';
import { authorize } from '../middleware/rbac.middleware';
import { Role } from '../types';

const router = Router();

router.get('/', InventoryController.getAll);
router.get('/search', InventoryController.search);
router.post('/inward', authorize(Role.ADMIN, Role.WAREHOUSE_MANAGER, Role.STAFF), idempotencyMiddleware, validate(inwardSchema), InventoryController.inward);
router.post('/outward', authorize(Role.ADMIN, Role.WAREHOUSE_MANAGER, Role.STAFF), idempotencyMiddleware, validate(outwardSchema), InventoryController.outward);
router.post('/transfer', authorize(Role.ADMIN, Role.WAREHOUSE_MANAGER, Role.STAFF), idempotencyMiddleware, validate(transferSchema), InventoryController.transfer);
router.post('/adjust', authorize(Role.ADMIN, Role.WAREHOUSE_MANAGER), validate(adjustmentSchema), InventoryController.adjust);

export default router;
