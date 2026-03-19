import api from './api';

export interface Product {
  id: number;
  name: string;
  description?: string;
  price: number;
  taxRate: number;
  type: 'product' | 'service';
  stock: number;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
}

export interface ProductStats {
  totalProducts: number;
  productsCount: number;
  servicesCount: number;
  totalValue: number;
  totalValueTTC: number;
}

export const productService = {
  getPaginated: async (page = 1, limit = 10, search = '', type = ''): Promise<PaginatedResponse<Product>> => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    if (search) params.append('search', search);
    if (type) params.append('type', type);
    const response = await api.get(`/products?${params.toString()}`);
    return response.data;
  },
  getAll: async (): Promise<Product[]> => {
    const response = await api.get('/products/all');
    return response.data;
  },
  getById: async (id: number): Promise<Product> => {
    const response = await api.get(`/products/${id}`);
    return response.data;
  },
  create: async (data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> => {
    const response = await api.post('/products', data);
    return response.data;
  },
  update: async (id: number, data: Partial<Product>): Promise<Product> => {
    const response = await api.put(`/products/${id}`, data);
    return response.data;
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/products/${id}`);
  },
  getStats: async (): Promise<ProductStats> => {
    const response = await api.get('/products/stats');
    return response.data;
  }
};