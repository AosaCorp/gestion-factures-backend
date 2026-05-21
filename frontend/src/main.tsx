import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { Toaster } from 'react-hot-toast';

// Désactiver l'enregistrement du Service Worker en développement
const isDevelopment = import.meta.env.DEV;

if ('serviceWorker' in navigator && !isDevelopment) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('✅ Service Worker enregistré:', registration);
        
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('🔄 Nouvelle version disponible');
                // Ne pas afficher la popup automatiquement
              }
            });
          }
        });
      })
      .catch(error => {
        console.log('❌ Erreur Service Worker:', error);
      });
  });
} else if (isDevelopment) {
  console.log('ℹ️ Service Worker désactivé en développement');
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
    <Toaster position="top-right" />
  </React.StrictMode>
);