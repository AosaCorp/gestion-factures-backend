import api from './api';

export const systemService = {
  getInfo: async () => {
    const response = await api.get('/system');
    return response.data;
  }
};