import api from './api';

export const reportService = {
  getSalesReport: async (startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const response = await api.get(`/reports/sales?${params.toString()}`);
    return response.data;
  },
  getTopProducts: async (limit = 10, startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    params.append('limit', limit.toString());
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const response = await api.get(`/reports/top-products?${params.toString()}`);
    return response.data;
  },
  getClientsReport: async (limit = 10, startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    params.append('limit', limit.toString());
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const response = await api.get(`/reports/clients?${params.toString()}`);
    return response.data;
  },
  getPaymentsReport: async (startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const response = await api.get(`/reports/payments?${params.toString()}`);
    return response.data;
  }
};