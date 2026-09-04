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
