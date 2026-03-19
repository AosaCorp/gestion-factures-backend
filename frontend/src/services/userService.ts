import api from './api';

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  twoFactorEnabled?: boolean;
  lastLogin?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const userService = {
  getAll: async (): Promise<User[]> => {
    const response = await api.get('/users');
    return response.data;
  },
  getById: async (id: number): Promise<User> => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },
  create: async (data: Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'lastLogin'>): Promise<User> => {
    const response = await api.post('/users', data);
    return response.data;
  },
  update: async (id: number, data: Partial<User>): Promise<User> => {
    const response = await api.put(`/users/${id}`, data);
    return response.data;
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/users/${id}`);
  },
  enable2FA: async (id: number): Promise<{ secret: string; qrcode: string; message: string }> => {
    const response = await api.post(`/users/${id}/enable-2fa`);
    return response.data;
  },
  disable2FA: async (id: number): Promise<{ message: string }> => {
    const response = await api.post(`/users/${id}/disable-2fa`);
    return response.data;
  }
};