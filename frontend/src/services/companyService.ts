import api from './api';

export interface Company {
  id: number;
  name: string;
  address: string;
  phone: string;
  email: string;
  taxId: string;
  taxRate: number;   // ← ajout
  logo: string;
}

export const companyService = {
  get: async (): Promise<Company> => {
    const response = await api.get('/company');
    return response.data;
  },
  update: async (data: Partial<Company>): Promise<Company> => {
    const response = await api.put('/company', data);
    return response.data;
  },
  uploadLogo: async (file: File): Promise<{ message: string; logo: string }> => {
    const formData = new FormData();
    formData.append('logo', file);
    const response = await api.post('/company/logo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  }
};