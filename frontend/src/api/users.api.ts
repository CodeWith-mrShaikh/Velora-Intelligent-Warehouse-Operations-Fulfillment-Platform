import { apiClient } from './client';
import { User, PaginatedResponse, ApiResponse } from '../types';

export const getUsers = async (params?: any) => {
  const { data } = await apiClient.get<ApiResponse<PaginatedResponse<User>>>('/users', { params });
  return data.data;
};

export const createUser = async (payload: any) => {
  const { data } = await apiClient.post<ApiResponse<User>>('/users', payload);
  return data.data;
};

export const updateUser = async (id: string, payload: any) => {
  const { data } = await apiClient.patch<ApiResponse<User>>(`/users/${id}`, payload);
  return data.data;
};
