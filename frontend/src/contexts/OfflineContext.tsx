import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import toast from 'react-hot-toast';

interface OfflineContextType {
  isOnline: boolean;
  isOffline: boolean;
  pendingSync: boolean;
  setPendingSync: (value: boolean) => void;
  savePendingAction: (action: any) => void;
  syncPendingActions: () => Promise<void>;
  pendingActionsCount: number;
}

const OfflineContext = createContext<OfflineContextType | undefined>(undefined);

export const useOffline = () => {
  const context = useContext(OfflineContext);
  if (!context) {
    throw new Error('useOffline must be used within an OfflineProvider');
  }
  return context;
};

interface PendingAction {
  id: string;
  type: string;
  data: any;
  timestamp: number;
}

export const OfflineProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingSync, setPendingSync] = useState(false);
  const [pendingActions, setPendingActions] = useState<PendingAction[]>([]);

  // Charger les actions en attente
  useEffect(() => {
    const saved = localStorage.getItem('pendingActions');
    if (saved) {
      try {
        const actions = JSON.parse(saved);
        setPendingActions(actions);
        if (actions.length > 0) setPendingSync(true);
      } catch (e) {
        console.error('Erreur chargement actions:', e);
      }
    }
  }, []);

  // Sauvegarder les actions
  useEffect(() => {
    if (pendingActions.length > 0) {
      localStorage.setItem('pendingActions', JSON.stringify(pendingActions));
      setPendingSync(true);
    } else {
      localStorage.removeItem('pendingActions');
      setPendingSync(false);
    }
  }, [pendingActions]);

  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true);
      toast.success('Connexion rétablie', { icon: '🌐' });
      await syncPendingActions();
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      toast.error('Mode hors ligne', { icon: '📱' });
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [pendingActions]);
  
  const savePendingAction = (action: any) => {
    const newAction: PendingAction = {
      id: Date.now().toString(),
      ...action,
      timestamp: Date.now()
    };
    setPendingActions(prev => [...prev, newAction]);
    toast.success('Action sauvegardée - sera synchronisée plus tard', { icon: '💾' });
  };
  
  const syncPendingActions = async () => {
    if (pendingActions.length === 0) return;
    
    setPendingSync(true);
    const token = localStorage.getItem('token');
    const actionsToSync = [...pendingActions];
    let successCount = 0;
    
    for (const action of actionsToSync) {
      try {
        // Traiter selon le type d'action
        if (action.type === 'CREATE_CLIENT') {
          await fetch('http://localhost:5001/api/clients', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': token ? `Bearer ${token}` : ''
            },
            body: JSON.stringify(action.data)
          });
          successCount++;
        } else if (action.type === 'UPDATE_CLIENT') {
          await fetch(`http://localhost:5001/api/clients/${action.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': token ? `Bearer ${token}` : ''
            },
            body: JSON.stringify(action.data)
          });
          successCount++;
        }
      } catch (error) {
        console.error('Erreur synchronisation:', error);
      }
    }
    
    if (successCount > 0) {
      setPendingActions(prev => prev.filter(a => !actionsToSync.includes(a)));
      toast.success(`${successCount} action(s) synchronisée(s)`);
    }
    
    setPendingSync(false);
  };
  
  return (
    <OfflineContext.Provider
      value={{
        isOnline,
        isOffline: !isOnline,
        pendingSync,
        setPendingSync,
        savePendingAction,
        syncPendingActions,
        pendingActionsCount: pendingActions.length
      }}
    >
      {children}
    </OfflineContext.Provider>
  );
};