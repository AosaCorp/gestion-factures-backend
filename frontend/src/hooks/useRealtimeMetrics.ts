import { useState, useEffect } from 'react';
import { useWebSocket } from '../contexts/WebSocketContext';
import api from '../services/api';

interface Metrics {
  clients: number;
  invoices: number;
  payments: number;
  totalRevenue: number;
  totalPayments: number;
  unpaid: number;
  trends: {
    newInvoices: number;
    newPayments: number;
    newRevenue: number;
  };
  timestamp: string;
}

export const useRealtimeMetrics = () => {
  const { metrics: wsMetrics, isConnected, lastUpdate } = useWebSocket();
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Chargement initial via API
  useEffect(() => {
    const fetchInitialMetrics = async () => {
      try {
        setError(null);
        const response = await api.get('/stats');
        console.log('Métriques initiales chargées:', response.data);
        setMetrics({
          clients: response.data.clients || 0,
          invoices: response.data.invoices || 0,
          payments: response.data.payments || 0,
          totalRevenue: response.data.totalRevenue || 0,
          totalPayments: response.data.totalPayments || 0,
          unpaid: response.data.totalUnpaid || 0,
          trends: { newInvoices: 0, newPayments: 0, newRevenue: 0 },
          timestamp: new Date().toISOString()
        });
        setLastRefresh(new Date());
      } catch (error: any) {
        console.error('Erreur chargement métriques initiales:', error);
        setError(error.message || 'Erreur de chargement');
      } finally {
        setLoading(false);
      }
    };

    fetchInitialMetrics();
  }, []);

  // Mise à jour via WebSocket
  useEffect(() => {
    if (wsMetrics) {
      console.log('Mise à jour des métriques via WebSocket:', wsMetrics);
      setMetrics(wsMetrics);
      setLastRefresh(new Date());
      setError(null);
    }
  }, [wsMetrics]);

  return {
    metrics,
    loading,
    isRealtime: isConnected,
    lastRefresh,
    lastUpdate,
    error
  };
};