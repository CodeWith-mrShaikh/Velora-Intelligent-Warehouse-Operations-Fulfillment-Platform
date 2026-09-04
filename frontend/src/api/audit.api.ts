import { apiClient } from './client';
import { AuditLog, PaginatedResponse, ApiResponse } from '../types';

export const getAuditLogs = async (params?: any) => {
  const { data } = await apiClient.get<ApiResponse<PaginatedResponse<AuditLog>>>('/audit-logs', { params });
  return data.data;
};
