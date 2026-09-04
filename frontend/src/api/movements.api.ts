import { apiClient } from './client';
import { StockMovement, PaginatedResponse, ApiResponse } from '../types';

export const getMovements = async (params?: any) => {
  const { data } = await apiClient.get<ApiResponse<PaginatedResponse<StockMovement>>>('/movements', { params });
  return data.data;
};
