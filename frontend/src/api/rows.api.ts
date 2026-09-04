import { apiClient } from './client';
import { WarehouseRow, Bin, ApiResponse } from '../types';

export const getRow = async (id: string) => {
  const { data } = await apiClient.get<ApiResponse<WarehouseRow>>(`/rows/${id}`);
  return data.data;
};

export const getRowBins = async (rowId: string) => {
  const { data } = await apiClient.get<ApiResponse<Bin[]>>(`/rows/${rowId}/bins`);
  return data.data;
};
