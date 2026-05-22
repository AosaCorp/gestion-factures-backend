import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { Toaster } from 'react-hot-toast';

/**
 * Enregistre le Service Worker avec gestion des erreurs
 */
const registerServiceWorker = async () => {
  if (!('serviceWorker' in navigator)) {
    console.log('⚠️ Service Worker non supporté');
    return;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js');
    console.log('✅ Service Worker enregistré:', registration.scope);

    // Attendre que le Service Worker soit actif
    if (registration.active) {
      console.log('✅ Service Worker actif');
    }

    // Vérifier les mises à jour silencieusement (sans notification intrusive)
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('🔄 Nouvelle version disponible');
            // Mettre à jour silencieusement sans rafraîchir la page
            // L'utilisateur verra les changements au prochain rafraîchissement
          }
        });
      }
    });

    // Vérifier les mises à jour périodiquement (toutes les heures)
    setInterval(() => {
      registration.update().catch(err => console.log('Erreur vérification mise à jour:', err));
    }, 60 * 60 * 1000);

  } catch (error) {
    console.error('❌ Erreur enregistrement Service Worker:', error);
  }
};

// Enregistrer le Service Worker au démarrage
registerServiceWorker();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
    <Toaster position="top-right" />
  </React.StrictMode>
);