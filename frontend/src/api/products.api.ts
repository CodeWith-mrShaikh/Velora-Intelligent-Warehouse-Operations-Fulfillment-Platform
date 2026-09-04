import { apiClient } from './client';
import { Product, PaginatedResponse, ApiResponse } from '../types';

export const getProducts = async (params?: any) => {
  const { data } = await apiClient.get<ApiResponse<PaginatedResponse<Product>>>('/products', { params });
  return data.data;
};

export const getProduct = async (id: string) => {
  const { data } = await apiClient.get<ApiResponse<Product>>(`/products/${id}`);
  return data.data;
};

export const createProduct = async (product: Partial<Product>) => {
  const { data } = await apiClient.post<ApiResponse<Product>>('/products', product);
  return data.data;
};

export const updateProduct = async (id: string, product: Partial<Product>) => {
  const { data } = await apiClient.patch<ApiResponse<Product>>(`/products/${id}`, product);
  return data.data;
};

export const deleteProduct = async (id: string) => {
  const { data } = await apiClient.delete<ApiResponse<void>>(`/products/${id}`);
  return data.data;
};
