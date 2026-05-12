import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL + '/api'
  : 'http://localhost:5001/api';

console.log('🌍 API Base URL:', baseURL);

const api = axios.create({
  baseURL,
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  console.log('🌐 Requête:', config.method?.toUpperCase(), config.url);
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('❌ Erreur API:', error.response?.data || error.message);
    
    // Si hors ligne, sauvegarder l'action pour synchronisation ultérieure
    if (!navigator.onLine && error.config) {
      // Récupérer les actions existantes
      const existingActions = localStorage.getItem('pendingActions');
      let actions = existingActions ? JSON.parse(existingActions) : [];
      
      // Ajouter la nouvelle action
      actions.push({
        id: Date.now().toString(),
        url: (error.config.baseURL || '') + (error.config.url || ''),
        method: error.config.method?.toUpperCase() || 'GET',
        data: error.config.data ? JSON.parse(error.config.data) : undefined,
        timestamp: Date.now()
      });
      
      // Sauvegarder dans localStorage
      localStorage.setItem('pendingActions', JSON.stringify(actions));
      console.log('💾 Action sauvegardée pour synchronisation hors ligne');
    }
    
    return Promise.reject(error);
  }
);

export default api;