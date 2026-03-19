import api from './api';
import { Client } from './clientService';

export interface InvoiceItem {
  productId: number;
  quantity: number;
  description?: string;
  unitPrice?: number;
  taxRate?: number;
  subtotal?: number;
  taxAmount?: number;
  total?: number;
}

export interface Payment {
  id: number;
  invoiceId: number;
  amount: number;
  method: 'cash' | 'orange_money' | 'mtn_money';
  transactionId?: string;
  receiver?: { id: number; name: string };
  createdAt: string;
}

export interface Invoice {
  id: number;
  number: string;
  clientId: number;
  client?: Client;
  items: InvoiceItem[];
  subtotal: number;
  taxTotal: number;
  total: number;
  status: 'draft' | 'paid' | 'cancelled';
  createdAt: string;
  paidAt?: string;
  createdBy?: number;
  createdByUser?: { id: number; name: string };
  Payments?: Payment[];
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
}

export const invoiceService = {
  getPaginated: async (page = 1, limit = 10, search = '', status = ''): Promise<PaginatedResponse<Invoice>> => {
    let url = `/invoices?page=${page}&limit=${limit}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    if (status) url += `&status=${encodeURIComponent(status)}`;
    const response = await api.get(url);
    return response.data;
  },
  getAll: async (): Promise<Invoice[]> => {
    const response = await api.get('/invoices/all');
    return response.data;
  },
  getById: async (id: number): Promise<Invoice> => {
    const response = await api.get(`/invoices/${id}`);
    return response.data;
  },
  create: async (data: { clientId: number; items: { productId: number; quantity: number }[] }): Promise<Invoice> => {
    const response = await api.post('/invoices', data);
    return response.data;
  },
  cancel: async (id: number): Promise<void> => {
    await api.delete(`/invoices/${id}`);
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/invoices/${id}`);
  },
  getPdf: async (id: number): Promise<Blob> => {
    const response = await api.get(`/invoices/${id}/pdf`, { responseType: 'blob' });
    return response.data;
  }
};

export const paymentService = {
  create: async (data: { 
    invoiceId: number; 
    amount: number; 
    method: string; 
    transactionId?: string;
    phoneNumber?: string;
  }): Promise<Payment> => {
    const response = await api.post('/payments', data);
    return response.data;
  },
  getByInvoice: async (invoiceId: number): Promise<Payment[]> => {
    const response = await api.get(`/payments/invoice/${invoiceId}`);
    return response.data;
  }
};