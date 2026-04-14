import axios from 'axios';

// Utilise la variable d’environnement, sinon fallback localhost
const baseURL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL + '/api'
  : 'http://localhost:5001/api';

console.log('🌍 API Base URL:', baseURL);

const api = axios.create({
  baseURL,
  timeout: 15000, // 15 secondes
});

// Intercepteur pour ajouter le token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log('🌐 Requête:', config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercepteur pour gérer les erreurs
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('❌ Erreur API:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default api;