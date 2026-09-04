import { apiClient } from './client';
import { Warehouse, WarehouseRow, PaginatedResponse, ApiResponse } from '../types';

export const getWarehouses = async (params?: any) => {
  const { data } = await apiClient.get<ApiResponse<PaginatedResponse<Warehouse>>>('/warehouses', { params });
  return data.data;
};

export const getWarehouse = async (id: string) => {
  const { data } = await apiClient.get<ApiResponse<Warehouse>>(`/warehouses/${id}`);
  return data.data;
};

export const getWarehouseRows = async (warehouseId: string) => {
  const { data } = await apiClient.get<ApiResponse<WarehouseRow[]>>(`/warehouses/${warehouseId}/rows`);
  return data.data;
};
