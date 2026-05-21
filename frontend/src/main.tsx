import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { Toaster } from 'react-hot-toast';

// Enregistrement du service worker pour PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('✅ Service Worker enregistré:', registration);
        
        // Vérifier les mises à jour
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('🔄 Nouvelle version disponible');
                // Afficher une notification discrète au lieu d'une popup intrusive
                const notification = document.createElement('div');
                notification.className = 'fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 cursor-pointer hover:bg-blue-700';
                notification.innerHTML = '🔄 Nouvelle version disponible. Cliquez pour mettre à jour.';
                notification.onclick = () => {
                  window.location.reload();
                };
                document.body.appendChild(notification);
                setTimeout(() => notification.remove(), 10000);
              }
            });
          }
        });
      })
      .catch(error => {
        console.log('❌ Erreur Service Worker:', error);
      });
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
    <Toaster position="top-right" />
  </React.StrictMode>
);