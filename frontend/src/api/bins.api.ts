import { apiClient } from './client';
import { Bin, ApiResponse } from '../types';

export const getBins = async () => {
  const { data } = await apiClient.get<ApiResponse<Bin[]>>('/bins');
  return data.data;
};

export const getBin = async (id: string) => {
  const { data } = await apiClient.get<ApiResponse<Bin>>(`/bins/${id}`);
  return data.data;
};

export const updateBin = async (id: string, data: { capacity?: number; status?: string }) => {
  const { data: res } = await apiClient.patch<ApiResponse<Bin>>(`/bins/${id}`, data);
  return res.data;
};
