import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'E-Commerce Warehouse Inventory & Location Tracking System API',
      version: '1.0.0',
      description: `
Industry-Level Full-Stack Warehouse Management & Location Tracking API.
Features:
- Physical Warehouse Hierarchy (Warehouse -> Row -> Bin)
- Real-time Location Tracking & Bin-level Availability
- Order Lifecycle State Machine (Pending -> Allocated -> Reserved -> Picking -> Picked -> Completed)
- Single-Bin Optimal Allocation Algorithm
- Atomic Concurrency Protection & Idempotent Stock Movements
- Complete Append-Only Audit & Movement Ledgers
      `,
      contact: {
        name: 'Warehouse Logistics Engineering Team',
      },
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Local Development Server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Provide JWT token obtained from POST /api/auth/login',
        },
      },
      schemas: {
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', example: 'admin@example.com' },
            password: { type: 'string', example: 'admin123' },
          },
        },
        InwardRequest: {
          type: 'object',
          required: ['productId', 'binId', 'quantity'],
          properties: {
            productId: { type: 'string', example: 'prod_wm_001' },
            binId: { type: 'string', example: 'bin_a02_b03' },
            quantity: { type: 'integer', example: 25 },
            reason: { type: 'string', example: 'PO-10293 inbound shipment' },
            idempotencyKey: { type: 'string', example: 'idk_po10293_1' },
          },
        },
        TransferRequest: {
          type: 'object',
          required: ['productId', 'sourceBinId', 'destinationBinId', 'quantity'],
          properties: {
            productId: { type: 'string', example: 'prod_wm_001' },
            sourceBinId: { type: 'string', example: 'bin_a02_b03' },
            destinationBinId: { type: 'string', example: 'bin_a02_b26' },
            quantity: { type: 'integer', example: 10 },
            reason: { type: 'string', example: 'Aisle rebalancing' },
            idempotencyKey: { type: 'string', example: 'idk_trf_102' },
          },
        },
        AdjustmentRequest: {
          type: 'object',
          required: ['productId', 'binId', 'quantity', 'reason'],
          properties: {
            productId: { type: 'string', example: 'prod_wm_001' },
            binId: { type: 'string', example: 'bin_a02_b03' },
            quantity: { type: 'integer', example: -2, description: 'Negative for loss/write-off, positive for found stock' },
            reason: { type: 'string', example: 'Physical cycle count discrepancy' },
          },
        },
        CreateOrderRequest: {
          type: 'object',
          required: ['items'],
          properties: {
            customerReference: { type: 'string', example: 'CUST-88392' },
            items: {
              type: 'array',
              items: {
                type: 'object',
                required: ['sku', 'quantity'],
                properties: {
                  sku: { type: 'string', example: 'WM-001' },
                  quantity: { type: 'integer', example: 5 },
                },
              },
            },
          },
        },
        PickOrderRequest: {
          type: 'object',
          required: ['items'],
          properties: {
            items: {
              type: 'array',
              items: {
                type: 'object',
                required: ['orderItemId', 'quantity'],
                properties: {
                  orderItemId: { type: 'string', example: 'item_demo_1' },
                  quantity: { type: 'integer', example: 5 },
                },
              },
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
