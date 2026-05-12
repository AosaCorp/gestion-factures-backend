import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import toast from 'react-hot-toast';

interface OfflineContextType {
  isOnline: boolean;
  isOffline: boolean;
  pendingSync: boolean;
  setPendingSync: (value: boolean) => void;
  savePendingAction: (action: any) => void;
  syncPendingActions: () => Promise<void>;
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
  url: string;
  method: string;
  data?: any;
  timestamp: number;
}

interface OfflineProviderProps {
  children: ReactNode;
}

export const OfflineProvider: React.FC<OfflineProviderProps> = ({ children }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingSync, setPendingSync] = useState(false);
  const [pendingActions, setPendingActions] = useState<PendingAction[]>([]);

  // Charger les actions en attente au démarrage
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

  // Sauvegarder les actions dans localStorage
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
      toast.success('Connexion rétablie');
      await syncPendingActions();
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      toast.error('Mode hors ligne actif. Les modifications seront sauvegardées.');
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
      ...action,
      id: Date.now().toString(),
      timestamp: Date.now()
    };
    setPendingActions(prev => [...prev, newAction]);
    toast('Action sauvegardée pour synchronisation ultérieure', { icon: '📱' });
  };
  
  const syncPendingActions = async () => {
    if (pendingActions.length === 0) return;
    
    setPendingSync(true);
    const token = localStorage.getItem('token');
    const actionsToSync = [...pendingActions];
    const successIds: string[] = [];
    
    for (const action of actionsToSync) {
      try {
        const response = await fetch(action.url, {
          method: action.method,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : ''
          },
          body: action.data ? JSON.stringify(action.data) : undefined
        });
        
        if (response.ok) {
          successIds.push(action.id);
        }
      } catch (error) {
        console.error('Erreur synchronisation:', error);
      }
    }
    
    if (successIds.length > 0) {
      setPendingActions(prev => prev.filter(a => !successIds.includes(a.id)));
      toast.success(`${successIds.length} action(s) synchronisée(s)`);
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
      }}
    >
      {children}
    </OfflineContext.Provider>
  );
};