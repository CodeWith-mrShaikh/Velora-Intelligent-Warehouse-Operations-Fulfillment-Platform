import { PaginationParams, PaginatedResult } from '../types';
export type { PaginationParams, PaginatedResult };

export const parsePaginationParams = (query: any): PaginationParams => {
  const page = parseInt(query.page as string, 10) || 1;
  const limit = Math.min(parseInt(query.limit as string, 10) || 25, 100);
  return {
    page: page > 0 ? page : 1,
    limit: limit > 0 ? limit : 25,
    sort: query.sort as string,
    order: (query.order === 'desc' ? 'desc' : 'asc'),
    search: query.search as string
  };
};

export const buildPaginatedResponse = <T>(data: T[], total: number, params: PaginationParams): PaginatedResult<T> => {
  const totalPages = Math.ceil(total / params.limit);
  return {
    data,
    total,
    page: params.page,
    limit: params.limit,
    totalPages,
    meta: {
      total,
      page: params.page,
      limit: params.limit,
      totalPages
    }
  } as any;
};

export const getPrismaSkip = (page: number, limit: number): number => {
  return (page - 1) * limit;
};
