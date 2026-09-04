import { apiClient } from './client';
import { User, ApiResponse } from '../types';

export const login = async (credentials: any) => {
  const { data } = await apiClient.post<ApiResponse<{ token: string; user: User }>>('/auth/login', credentials);
  return data.data;
};
