import { apiClient } from './client';
import { Inventory, PaginatedResponse, ApiResponse } from '../types';

export const getInventory = async (params?: any) => {
  const { data } = await apiClient.get<ApiResponse<PaginatedResponse<Inventory>>>('/inventory', { params });
  return data.data;
};

export const searchInventory = async (query: string) => {
  const { data } = await apiClient.get<ApiResponse<Inventory[]>>(`/inventory/search`, { params: { q: query } });
  return data.data;
};

export const inwardStock = async (payload: any) => {
  const { data } = await apiClient.post<ApiResponse<any>>('/inventory/inward', payload);
  return data.data;
};

export const outwardStock = async (payload: any) => {
  const { data } = await apiClient.post<ApiResponse<any>>('/inventory/outward', payload);
  return data.data;
};

export const transferStock = async (payload: any) => {
  const { data } = await apiClient.post<ApiResponse<any>>('/inventory/transfer', payload);
  return data.data;
};

export const adjustStock = async (payload: any) => {
  const { data } = await apiClient.post<ApiResponse<any>>('/inventory/adjust', payload);
  return data.data;
};
