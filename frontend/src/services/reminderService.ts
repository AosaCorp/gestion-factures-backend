import api from './api';

export interface Reminder {
  id: number;
  invoiceId: number;
  reminderType: 'first' | 'second' | 'third' | 'final';
  status: 'pending' | 'sent' | 'failed';
  scheduledDate: string;
  sentDate: string | null;
  errorMessage: string | null;
  createdAt: string;
  Invoice?: {
    id: number;
    number: string;
    total: number;
    status: string;
  };
}

export interface ReminderStats {
  total: number;
  sent: number;
  pending: number;
  failed: number;
  byType: {
    first: number;
    second: number;
    third: number;
    final: number;
  };
}

export const reminderService = {
  getAll: async (): Promise<Reminder[]> => {
    const response = await api.get('/reminders');
    return response.data;
  },

  getByInvoice: async (invoiceId: number): Promise<Reminder[]> => {
    const response = await api.get(`/reminders/invoice/${invoiceId}`);
    return response.data;
  },

  getStats: async (): Promise<ReminderStats> => {
    const response = await api.get('/reminders/stats');
    return response.data;
  },

  runCheck: async (): Promise<{ message: string; created: number }> => {
    const response = await api.post('/reminders/check');
    return response.data;
  },

  runSend: async (): Promise<{ message: string; success: number; failed: number }> => {
    const response = await api.post('/reminders/send');
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/reminders/${id}`);
  }
};