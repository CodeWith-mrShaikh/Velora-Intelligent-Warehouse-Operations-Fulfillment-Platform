import prisma from '../utils/db';
import { PaginationParams, buildPaginatedResponse, getPrismaSkip } from '../utils/pagination';
import { NotFoundError, DuplicateError } from '../utils/errors';

export class ProductService {
  static async getAll(params: PaginationParams) {
    const skip = getPrismaSkip(params.page, params.limit);
    
    let where = { status: { not: 'INACTIVE' } } as any;
    if (params.search) {
      where = {
        ...where,
        OR: [
          { name: { contains: params.search } },
          { sku: { contains: params.search } },
          { barcode: { contains: params.search } }
        ]
      };
    }

    const [total, products] = await prisma.$transaction([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        skip,
        take: params.limit,
        orderBy: params.sort ? { [params.sort]: params.order } : { createdAt: 'desc' },
        include: {
          inventories: true
        }
      })
    ]);

    const transformedProducts = products.map(p => {
      const totalQuantity = p.inventories.reduce((sum, inv) => sum + inv.onHandQuantity, 0);
      return {
        ...p,
        totalQuantity,
        totalStock: totalQuantity,
        price: Number(p.unitPrice)
      };
    });

    return buildPaginatedResponse(transformedProducts, total, params);
  }

  static async getById(id: string) {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        inventories: {
          include: {
            bin: {
              include: {
                row: {
                  include: {
                    warehouse: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!product) {
      throw new NotFoundError('Product not found');
    }

    const totalQuantity = product.inventories.reduce((sum, inv) => sum + inv.onHandQuantity, 0);
    return {
      ...product,
      totalQuantity,
      totalStock: totalQuantity,
      price: Number(product.unitPrice),
      inventories: product.inventories.map((inv: any) => ({
        ...inv,
        quantity: inv.onHandQuantity,
        reserved: inv.reservedQuantity,
        available: inv.onHandQuantity - inv.reservedQuantity,
        availableQuantity: inv.onHandQuantity - inv.reservedQuantity
      }))
    };
  }

  static async create(data: { sku: string; barcode?: string; name: string; description?: string; category?: string; unitPrice: number; reorderLevel?: number }) {
    const existing = await prisma.product.findFirst({
      where: {
        OR: [
          { sku: data.sku },
          ...(data.barcode ? [{ barcode: data.barcode }] : [])
        ]
      }
    });

    if (existing) {
      throw new DuplicateError('Product with this SKU or barcode already exists');
    }

    return prisma.product.create({
      data
    });
  }

  static async update(id: string, data: Partial<{ sku: string; barcode: string; name: string; description: string; category: string; unitPrice: number; reorderLevel: number }>) {
    await this.getById(id);
    return prisma.product.update({
      where: { id },
      data
    });
  }

  static async search(query: string) {
    return prisma.product.findMany({
      where: {
        status: { not: 'INACTIVE' },
        OR: [
          { name: { contains: query } },
          { sku: { contains: query } },
          { barcode: { contains: query } }
        ]
      },
      include: {
        inventories: {
          include: {
            bin: {
              include: {
                row: {
                  include: {
                    warehouse: true
                  }
                }
              }
            }
          }
        }
      }
    });
  }

  static async delete(id: string) {
    await this.getById(id);
    return prisma.product.update({
      where: { id },
      data: { status: 'INACTIVE' }
    });
  }
}
