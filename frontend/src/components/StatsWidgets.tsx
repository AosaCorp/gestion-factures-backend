import React, { useState, useEffect } from 'react';
import { 
  FiTrendingUp, FiTrendingDown, FiPieChart, 
  FiBarChart2, FiDownload, FiRefreshCw 
} from 'react-icons/fi';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useOffline } from '../contexts/OfflineContext';

interface MonthlyStats {
  months: string[];
  revenues: number[];
  paidAmounts: number[];
  invoiceCounts: number[];
}

interface TopClient {
  id: number;
  name: string;
  email: string;
  totalSpent: number;
  invoicesCount: number;
}

interface Forecast {
  month: string;
  predicted: number;
  optimistic: number;
  pessimistic: number;
}

interface ConversionRate {
  totalInvoices: number;
  paidInvoices: number;
  draftInvoices: number;
  cancelledInvoices: number;
  conversionRate: number;
  target: number;
}

interface GrowthStats {
  revenue: { current: number; previous: number; growth: number };
  invoices: { current: number; previous: number; growth: number };
  clients: { current: number; previous: number; growth: number };
}

const StatsWidgets: React.FC = () => {
  const { isOffline } = useOffline();
  const [loading, setLoading] = useState(true);
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats | null>(null);
  const [topClients, setTopClients] = useState<TopClient[]>([]);
  const [forecast, setForecast] = useState<Forecast[]>([]);
  const [conversionRate, setConversionRate] = useState<ConversionRate | null>(null);
  const [growthStats, setGrowthStats] = useState<GrowthStats | null>(null);
  const [activeChart, setActiveChart] = useState<'revenue' | 'paid'>('revenue');

  useEffect(() => {
    fetchAllStats();
  }, []);

  const fetchAllStats = async () => {
    if (isOffline) {
      toast.error('Mode hors ligne - Statistiques non disponibles');
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [monthlyRes, clientsRes, forecastRes, conversionRes, growthRes] = await Promise.all([
        api.get('/stats/monthly'),
        api.get('/stats/top-clients?limit=5'),
        api.get('/stats/forecast'),
        api.get('/stats/conversion'),
        api.get('/stats/growth?period=month')
      ]);

      setMonthlyStats(monthlyRes.data);
      setTopClients(clientsRes.data);
      setForecast(forecastRes.data.forecast);
      setConversionRate(conversionRes.data);
      setGrowthStats(growthRes.data);
    } catch (error) {
      console.error('Erreur chargement stats:', error);
      toast.error('Erreur lors du chargement des statistiques');
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async () => {
    try {
      const response = await api.get('/stats/export-pdf', { responseType: 'blob' });
      const url = URL.createObjectURL(response.data);
      window.open(url, '_blank');
      URL.revokeObjectURL(url);
      toast.success('PDF téléchargé');
    } catch (error) {
      toast.error('Erreur export PDF');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Graphique mensuel
  const monthlyChartData = {
    labels: monthlyStats?.months || [],
    datasets: [
      {
        label: 'Chiffre d\'affaires (FCFA)',
        data: monthlyStats?.revenues || [],
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Encaissements (FCFA)',
        data: monthlyStats?.paidAmounts || [],
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.4,
      }
    ]
  };

  // Graphique de prévision
  const forecastChartData = {
    labels: forecast.map(f => f.month),
    datasets: [
      {
        label: 'Prévision optimiste',
        data: forecast.map(f => f.optimistic),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderDash: [5, 5],
      },
      {
        label: 'Prévision moyenne',
        data: forecast.map(f => f.predicted),
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 2,
      },
      {
        label: 'Prévision pessimiste',
        data: forecast.map(f => f.pessimistic),
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderDash: [5, 5],
      }
    ]
  };

  // Graphique de conversion
  const conversionChartData = {
    labels: ['Payées', 'En attente', 'Annulées'],
    datasets: [{
      data: [
        conversionRate?.paidInvoices || 0,
        conversionRate?.draftInvoices || 0,
        conversionRate?.cancelledInvoices || 0
      ],
      backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
    }]
  };

  return (
    <div className="space-y-6">
      {/* En-tête avec bouton export */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Statistiques avancées</h2>
        <div className="flex gap-2">
          <button
            onClick={fetchAllStats}
            className="bg-gray-600 text-white px-3 py-1 rounded hover:bg-gray-700 flex items-center gap-1 text-sm"
          >
            <FiRefreshCw /> Rafraîchir
          </button>
          <button
            onClick={handleExportPDF}
            className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 flex items-center gap-1 text-sm"
          >
            <FiDownload /> Export PDF
          </button>
        </div>
      </div>

      {/* Cartes de croissance */}
      {growthStats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-500">Croissance CA</p>
                <p className="text-2xl font-bold">{growthStats.revenue.current.toLocaleString()} F</p>
              </div>
              <div className={`flex items-center gap-1 px-2 py-1 rounded text-sm ${growthStats.revenue.growth >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {growthStats.revenue.growth >= 0 ? <FiTrendingUp /> : <FiTrendingDown />}
                {Math.abs(growthStats.revenue.growth).toFixed(1)}%
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2">vs période précédente</p>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-500">Croissance factures</p>
                <p className="text-2xl font-bold">{growthStats.invoices.current}</p>
              </div>
              <div className={`flex items-center gap-1 px-2 py-1 rounded text-sm ${growthStats.invoices.growth >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {growthStats.invoices.growth >= 0 ? <FiTrendingUp /> : <FiTrendingDown />}
                {Math.abs(growthStats.invoices.growth).toFixed(1)}%
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2">vs période précédente</p>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-500">Nouveaux clients</p>
                <p className="text-2xl font-bold">{growthStats.clients.current}</p>
              </div>
              <div className={`flex items-center gap-1 px-2 py-1 rounded text-sm ${growthStats.clients.growth >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {growthStats.clients.growth >= 0 ? <FiTrendingUp /> : <FiTrendingDown />}
                {Math.abs(growthStats.clients.growth).toFixed(1)}%
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2">vs période précédente</p>
          </div>
        </div>
      )}

      {/* Graphique mensuel */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Évolution mensuelle</h3>
          <div className="flex gap-2">
            <button
              onClick={() => setActiveChart('revenue')}
              className={`px-3 py-1 rounded text-sm ${activeChart === 'revenue' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            >
              Chiffre d'affaires
            </button>
            <button
              onClick={() => setActiveChart('paid')}
              className={`px-3 py-1 rounded text-sm ${activeChart === 'paid' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            >
              Encaissements
            </button>
          </div>
        </div>
        <div style={{ height: '300px' }}>
          <Line data={monthlyChartData} options={{ responsive: true, maintainAspectRatio: false }} />
        </div>
      </div>

      {/* Prévisions */}
      {forecast.length > 0 && (
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-semibold mb-4">Prévisions des ventes (3 mois)</h3>
          <div style={{ height: '250px' }}>
            <Bar data={forecastChartData} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
        </div>
      )}

      {/* Top clients et taux de conversion */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top clients */}
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <FiBarChart2 /> Top clients
          </h3>
          {topClients.length > 0 ? (
            <div className="space-y-3">
              {topClients.map((client, idx) => (
                <div key={client.id} className="flex justify-between items-center p-3 border-b hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <span className={`w-6 h-6 flex items-center justify-center rounded-full ${idx === 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'} text-sm font-bold`}>
                      {idx + 1}
                    </span>
                    <div>
                      <p className="font-medium">{client.name}</p>
                      <p className="text-xs text-gray-500">{client.invoicesCount} factures</p>
                    </div>
                  </div>
                  <span className="font-bold text-blue-600">{client.totalSpent.toLocaleString()} F</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-10">Aucun client</p>
          )}
        </div>

        {/* Taux de conversion */}
        {conversionRate && (
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FiPieChart /> Taux de conversion
            </h3>
            <div style={{ height: '200px' }}>
              <Doughnut data={conversionChartData} options={{ responsive: true, maintainAspectRatio: false }} />
            </div>
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600">Taux de factures payées</p>
              <p className="text-3xl font-bold text-blue-600">{conversionRate.conversionRate}%</p>
              <p className="text-xs text-gray-400 mt-1">Objectif: {conversionRate.target}%</p>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  className="bg-blue-600 rounded-full h-2" 
                  style={{ width: `${Math.min(100, (conversionRate.conversionRate / conversionRate.target) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatsWidgets;