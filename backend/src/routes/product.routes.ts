import { Router } from 'express';
import { ProductController } from '../controllers/product.controller';
import { validate, createProductSchema, updateProductSchema } from '../validators';
import { authorize } from '../middleware/rbac.middleware';
import { Role } from '../types';

const router = Router();

router.get('/', ProductController.getAll);
router.get('/:id', ProductController.getById);
router.post('/', authorize(Role.ADMIN, Role.WAREHOUSE_MANAGER), validate(createProductSchema), ProductController.create);
router.patch('/:id', authorize(Role.ADMIN, Role.WAREHOUSE_MANAGER), validate(updateProductSchema), ProductController.update);
router.delete('/:id', authorize(Role.ADMIN, Role.WAREHOUSE_MANAGER), ProductController.delete);

export default router;
