import React from 'react';
import { useOffline } from '../contexts/OfflineContext';
import { useDataCache } from '../contexts/DataCacheContext';
import { FiWifiOff, FiWifi, FiRefreshCw, FiDatabase } from 'react-icons/fi';

const OfflineBanner: React.FC = () => {
  const { isOnline, pendingSync, setPendingSync, syncPendingActions } = useOffline();
  const { hasCache, refreshCache } = useDataCache();
  
  if (isOnline && !pendingSync) return null;
  
  return (
    <div className={`fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 rounded-lg shadow-lg p-4 ${
      isOnline ? 'bg-green-600' : 'bg-red-600'
    } text-white`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {isOnline ? <FiWifi className="text-xl" /> : <FiWifiOff className="text-xl" />}
          <div>
            <p className="font-medium">
              {isOnline ? 'Connexion rétablie' : 'Mode hors ligne'}
            </p>
            <p className="text-sm opacity-90">
              {isOnline 
                ? pendingSync 
                  ? 'Synchronisation en cours...' 
                  : 'Vous êtes de nouveau connecté'
                : hasCache 
                  ? 'Affichage des données en cache'
                  : 'Aucune donnée en cache. Connectez-vous en ligne d\'abord.'
              }
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {!isOnline && !hasCache && (
            <button 
              onClick={() => window.location.href = '/login'}
              className="bg-white text-red-600 px-3 py-1 rounded text-sm hover:bg-gray-100"
            >
              Connexion
            </button>
          )}
          {isOnline && pendingSync && (
            <button 
              onClick={() => syncPendingActions()}
              className="bg-white text-green-600 p-2 rounded-full hover:bg-gray-100"
            >
              <FiRefreshCw className="animate-spin" />
            </button>
          )}
          {isOnline && !pendingSync && hasCache && (
            <button 
              onClick={() => refreshCache()}
              className="bg-white text-green-600 p-2 rounded-full hover:bg-gray-100"
              title="Rafraîchir le cache"
            >
              <FiDatabase />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default OfflineBanner;