import axios from 'axios';

const api = axios.create({
  baseURL: 'https://gestion-factures-backend-4joy.onrender.com/api', // ← votre IP locale (vérifiée)
  timeout: 10000,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Sécurisation de l'affichage (correction des erreurs TypeScript)
    const url = config.url || '';
    const baseURL = config.baseURL || '';
    console.log('🌐 Requête:', config.method?.toUpperCase(), url, '→', baseURL + url);
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