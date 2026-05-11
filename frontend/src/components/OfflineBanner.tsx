import React from 'react';
import { useOffline } from '../contexts/OfflineContext';
import { FiWifiOff, FiWifi, FiRefreshCw } from 'react-icons/fi';

const OfflineBanner: React.FC = () => {
  const { isOnline, pendingSync, setPendingSync } = useOffline();
  
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
                : 'Les données sont en cache. Les modifications seront synchronisées plus tard.'
              }
            </p>
          </div>
        </div>
        {isOnline && pendingSync && (
          <button 
            onClick={() => setPendingSync(false)}
            className="bg-white text-green-600 p-2 rounded-full hover:bg-gray-100"
          >
            <FiRefreshCw className="animate-spin" />
          </button>
        )}
      </div>
    </div>
  );
};

export default OfflineBanner;