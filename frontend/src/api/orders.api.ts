import { apiClient } from './client';
import { Order, PaginatedResponse, ApiResponse } from '../types';

export const getOrders = async (params?: any) => {
  const { data } = await apiClient.get<ApiResponse<PaginatedResponse<Order>>>('/orders', { params });
  return data.data;
};

export const getOrder = async (id: string) => {
  const { data } = await apiClient.get<ApiResponse<Order>>(`/orders/${id}`);
  return data.data;
};

export const createOrder = async (payload: any) => {
  const { data } = await apiClient.post<ApiResponse<Order>>('/orders', payload);
  return data.data;
};

export const allocateOrder = async (id: string) => {
  const { data } = await apiClient.post<ApiResponse<any>>(`/orders/${id}/allocate`);
  return data.data;
};

export const reserveOrder = async (id: string) => {
  const { data } = await apiClient.post<ApiResponse<any>>(`/orders/${id}/reserve`);
  return data.data;
};

export const releaseOrder = async (id: string) => {
  const { data } = await apiClient.post<ApiResponse<any>>(`/orders/${id}/release`);
  return data.data;
};

export const pickOrder = async (id: string) => {
  const { data } = await apiClient.post<ApiResponse<any>>(`/orders/${id}/pick`);
  return data.data;
};

export const completeOrder = async (id: string) => {
  const { data } = await apiClient.post<ApiResponse<any>>(`/orders/${id}/complete`);
  return data.data;
};

export const cancelOrder = async (id: string) => {
  const { data } = await apiClient.post<ApiResponse<any>>(`/orders/${id}/cancel`);
  return data.data;
};
