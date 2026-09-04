import { apiClient } from './client';

export const exportMovementsCsv = async (params?: any) => {
  const response = await apiClient.get('/reports/movements', {
    params,
    responseType: 'blob',
  });
  
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `movements_${new Date().toISOString()}.csv`);
  document.body.appendChild(link);
  link.click();
  link.remove();
};
