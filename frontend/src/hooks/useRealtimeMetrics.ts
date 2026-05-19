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

  // Chargement initial via API
  useEffect(() => {
    const fetchInitialMetrics = async () => {
      try {
        const response = await api.get('/stats');
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
      } catch (error) {
        console.error('Erreur chargement métriques initiales:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialMetrics();
  }, []);

  // Mise à jour via WebSocket
  useEffect(() => {
    if (wsMetrics) {
      setMetrics(wsMetrics);
      setLastRefresh(new Date());
    }
  }, [wsMetrics]);

  return {
    metrics,
    loading,
    isRealtime: isConnected,
    lastRefresh,
    lastUpdate
  };
};