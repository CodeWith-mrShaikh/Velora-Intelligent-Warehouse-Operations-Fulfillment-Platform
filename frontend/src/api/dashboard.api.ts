import { apiClient } from './client';
import { DashboardSummary, RowStock, LowStockItem, BinUtilization, ApiResponse } from '../types';

export const getDashboardSummary = async () => {
  const { data } = await apiClient.get<ApiResponse<DashboardSummary>>('/dashboard/summary');
  return data.data;
};

export const getRowStock = async () => {
  const { data } = await apiClient.get<ApiResponse<RowStock[]>>('/dashboard/row-stock');
  return data.data;
};

export const getLowStock = async () => {
  const { data } = await apiClient.get<ApiResponse<LowStockItem[]>>('/dashboard/low-stock');
  return data.data;
};

export const getBinUtilization = async () => {
  const { data } = await apiClient.get<ApiResponse<BinUtilization[]>>('/dashboard/bin-utilization');
  return data.data;
};
