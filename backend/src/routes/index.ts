import { Router } from 'express';
import authRoutes from './auth.routes';
import productRoutes from './product.routes';
import inventoryRoutes from './inventory.routes';
import orderRoutes from './order.routes';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/rbac.middleware';
import { HealthController } from '../controllers/health.controller';
import { WarehouseController } from '../controllers/warehouse.controller';
import { RowController } from '../controllers/row.controller';
import { BinController } from '../controllers/bin.controller';
import { MovementController } from '../controllers/movement.controller';
import { AuditController } from '../controllers/audit.controller';
import { DashboardController } from '../controllers/dashboard.controller';
import { ReportController } from '../controllers/report.controller';
import { UserController } from '../controllers/user.controller';
import { validate, createWarehouseSchema, createRowSchema, createBinSchema, createUserSchema, updateUserSchema } from '../validators';
import { Role } from '../types';

const router = Router();

// Public routes
router.get('/health', HealthController.check);
router.get('/health/ready', HealthController.ready);
router.use('/auth', authRoutes);

// Authenticated routes
router.use(authenticate);

// Domain routes
router.use('/products', productRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/orders', orderRoutes);

// Warehouses
const warehouseRouter = Router();
warehouseRouter.get('/', WarehouseController.getAll);
warehouseRouter.get('/:id', WarehouseController.getById);
warehouseRouter.post('/', authorize(Role.ADMIN), validate(createWarehouseSchema), WarehouseController.create);
warehouseRouter.patch('/:id', authorize(Role.ADMIN), WarehouseController.update);
warehouseRouter.get('/:id/rows', WarehouseController.getRows);
router.use('/warehouses', warehouseRouter);

// Rows
const rowRouter = Router();
rowRouter.get('/:id', RowController.getById);
rowRouter.post('/', authorize(Role.ADMIN, Role.WAREHOUSE_MANAGER), validate(createRowSchema), RowController.create);
rowRouter.patch('/:id', authorize(Role.ADMIN, Role.WAREHOUSE_MANAGER), RowController.update);
rowRouter.get('/:id/bins', RowController.getBins);
router.use('/rows', rowRouter);

// Bins
const binRouter = Router();
binRouter.get('/', BinController.getAll);
binRouter.get('/:id', BinController.getById);
binRouter.post('/', authorize(Role.ADMIN, Role.WAREHOUSE_MANAGER), validate(createBinSchema), BinController.create);
binRouter.patch('/:id', authorize(Role.ADMIN, Role.WAREHOUSE_MANAGER), BinController.update);
router.use('/bins', binRouter);

// Movements
router.get('/movements', MovementController.getAll);

// Audit
router.get('/audit-logs', authorize(Role.ADMIN, Role.WAREHOUSE_MANAGER), AuditController.getAll);

// Dashboard
const dashboardRouter = Router();
dashboardRouter.get('/summary', DashboardController.getSummary);
dashboardRouter.get('/row-stock', DashboardController.getRowStock);
dashboardRouter.get('/low-stock', DashboardController.getLowStock);
dashboardRouter.get('/bin-utilization', DashboardController.getBinUtilization);
router.use('/dashboard', dashboardRouter);

// Reports
const reportRouter = Router();
reportRouter.get('/inventory', ReportController.getInventory);
reportRouter.get('/low-stock', ReportController.getLowStock);
reportRouter.get('/movements', ReportController.getMovements);
reportRouter.get('/orders', ReportController.getOrders);
reportRouter.get('/bin-utilization', ReportController.getBinUtilization);
router.use('/reports', reportRouter);

// Users
const userRouter = Router();
userRouter.use(authorize(Role.ADMIN));
userRouter.get('/', UserController.getAll);
userRouter.get('/:id', UserController.getById);
userRouter.post('/', validate(createUserSchema), UserController.create);
userRouter.patch('/:id', validate(updateUserSchema), UserController.update);
router.use('/users', userRouter);

export default router;
