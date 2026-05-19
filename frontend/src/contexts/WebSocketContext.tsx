import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import io, { Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

interface WebSocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  metrics: any | null;
  lastUpdate: Date | null;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

interface WebSocketProviderProps {
  children: ReactNode;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children }) => {
  const { token } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [metrics, setMetrics] = useState<any | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    if (!token) {
      console.log('WebSocket: Pas de token, connexion ignorée');
      return;
    }

    // Utiliser l'URL du backend depuis l'environnement
    const apiUrl = import.meta.env.VITE_API_URL || 'https://gestion-factures-backend-mvdn.onrender.com';
    console.log('WebSocket: Connexion à', apiUrl);

    const newSocket = io(apiUrl, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000
    });

    newSocket.on('connect', () => {
      console.log('🔌 WebSocket connecté');
      setIsConnected(true);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('🔌 WebSocket déconnecté:', reason);
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Erreur WebSocket:', error.message);
      setIsConnected(false);
    });

    newSocket.on('metrics_update', (data) => {
      console.log('📊 Métriques reçues:', data);
      setMetrics(data);
      setLastUpdate(new Date());
    });

    setSocket(newSocket);

    return () => {
      console.log('WebSocket: Nettoyage');
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, [token]);

  return (
    <WebSocketContext.Provider value={{ socket, isConnected, metrics, lastUpdate }}>
      {children}
    </WebSocketContext.Provider>
  );
};