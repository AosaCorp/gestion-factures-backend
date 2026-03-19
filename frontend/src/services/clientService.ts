import api from './api';

export interface Client {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
}

export const clientService = {
  getPaginated: async (page = 1, limit = 10, search = ''): Promise<PaginatedResponse<Client>> => {
    const response = await api.get(`/clients?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`);
    return response.data;
  },
  getAll: async (): Promise<Client[]> => {
    const response = await api.get('/clients/all');
    return response.data;
  },
  getById: async (id: number): Promise<Client> => {
    const response = await api.get(`/clients/${id}`);
    return response.data;
  },
  create: async (data: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>): Promise<Client> => {
    const response = await api.post('/clients', data);
    return response.data;
  },
  update: async (id: number, data: Partial<Client>): Promise<Client> => {
    const response = await api.put(`/clients/${id}`, data);
    return response.data;
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/clients/${id}`);
  }
};