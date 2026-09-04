import prisma from '../utils/db';
import { PaginationParams, buildPaginatedResponse, getPrismaSkip } from '../utils/pagination';

export class AuditService {
  static async getAll(params: PaginationParams & { action?: string; entityType?: string; userId?: string }) {
    const skip = getPrismaSkip(params.page, params.limit);
    
    let where: any = {};
    if (params.action) where.action = params.action;
    if (params.entityType) where.entityType = params.entityType;
    if (params.userId) where.userId = params.userId;

    const [total, logs] = await prisma.$transaction([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        skip,
        take: params.limit,
        orderBy: params.sort ? { [params.sort]: params.order } : { createdAt: 'desc' },
        include: {
          user: { select: { email: true, name: true } }
        }
      })
    ]);

    const formattedLogs = logs.map(l => ({
      ...l,
      details: l.afterData || l.beforeData || ''
    }));

    return buildPaginatedResponse(formattedLogs, total, params);
  }

  static async create(data: { action: string; entityType: string; entityId: string; userId: string; beforeData?: string; afterData?: string }) {
    return prisma.auditLog.create({
      data: {
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId,
        userId: data.userId,
        beforeData: data.beforeData,
        afterData: data.afterData
      }
    });
  }
}
