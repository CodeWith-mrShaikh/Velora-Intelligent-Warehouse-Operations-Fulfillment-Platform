import { z, AnyZodObject } from 'zod';
import { Request, Response, NextFunction } from 'express';

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(6)
  })
});

export const createProductSchema = z.object({
  body: z.object({
    sku: z.string().min(1),
    barcode: z.string().optional(),
    name: z.string().min(1),
    description: z.string().optional(),
    category: z.string().optional(),
    unitPrice: z.number().min(0),
    reorderLevel: z.number().min(0).optional()
  })
});

export const updateProductSchema = z.object({
  body: createProductSchema.shape.body.partial()
});

export const inwardSchema = z.object({
  body: z.object({
    productId: z.string().min(1),
    binId: z.string().min(1),
    quantity: z.number().positive(),
    reason: z.string().optional(),
    idempotencyKey: z.string().optional()
  })
});

export const outwardSchema = z.object({
  body: z.object({
    productId: z.string().min(1),
    binId: z.string().min(1),
    quantity: z.number().positive(),
    reason: z.string().optional(),
    idempotencyKey: z.string().optional()
  })
});

export const transferSchema = z.object({
  body: z.object({
    productId: z.string().min(1),
    sourceBinId: z.string().min(1),
    destinationBinId: z.string().min(1),
    quantity: z.number().positive(),
    reason: z.string().optional(),
    idempotencyKey: z.string().optional()
  })
});

export const adjustmentSchema = z.object({
  body: z.object({
    productId: z.string().min(1),
    binId: z.string().min(1),
    quantity: z.number(), // can be negative
    reason: z.string().min(1) // required
  })
});

export const createOrderSchema = z.object({
  body: z.object({
    customerReference: z.string().optional(),
    customerRef: z.string().optional(),
    items: z.array(z.object({
      sku: z.string().optional(),
      productId: z.string().optional(),
      quantity: z.number().positive()
    })).min(1)
  })
});

export const pickOrderSchema = z.object({
  body: z.object({
    items: z.array(z.object({
      orderItemId: z.string().min(1),
      quantity: z.number().positive()
    })).optional()
  }).optional().default({})
});

export const createWarehouseSchema = z.object({
  body: z.object({
    code: z.string().min(1),
    name: z.string().min(1),
    address: z.string().optional(),
    location: z.string().optional()
  })
});

export const createRowSchema = z.object({
  body: z.object({
    warehouseId: z.string().min(1),
    code: z.string().min(1),
    name: z.string().optional(),
    description: z.string().optional()
  })
});

export const createBinSchema = z.object({
  body: z.object({
    rowId: z.string().min(1),
    code: z.string().min(1),
    capacity: z.number().positive()
  })
});

export const createUserSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(6),
    name: z.string().min(1),
    role: z.enum(['ADMIN', 'WAREHOUSE_MANAGER', 'STAFF', 'PICKER'])
  })
});

export const updateUserSchema = z.object({
  body: createUserSchema.shape.body.partial().omit({ password: true })
});

export const validate = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      next(error);
    }
  };
};
