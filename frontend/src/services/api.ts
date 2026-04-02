import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL + '/api'
  : 'http://localhost:5001/api';

console.log('🌍 API Base URL:', baseURL);

const api = axios.create({
  baseURL,
  timeout: 10000,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    const url = config.url || '';
    const base = config.baseURL || '';
    console.log('🌐 Requête:', config.method?.toUpperCase(), url, '→', base + url);
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => {
    console.log('✅ Réponse:', response.status);
    return response;
  },
  (error) => {
    console.error('❌ Erreur réseau:', error.message);
    return Promise.reject(error);
  }
);

export default api;