import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useRealtimeMetrics } from '../hooks/useRealtimeMetrics';
import api from '../services/api';
import { 
  FiUsers, FiFileText, FiCreditCard, FiAlertCircle, 
  FiTrendingUp, FiPieChart, FiBarChart2, FiCalendar,
  FiWifi, FiWifiOff
} from 'react-icons/fi';
import { 
  Line, Bar, Doughnut, Radar 
} from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import toast from 'react-hot-toast';
import StockAlertWidget from '../components/widgets/StockAlertWidget';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface DashboardStats {
  clients: number;
  invoices: number;
  payments: number;
  totalRevenue: number;
  totalPaid: number;
  unpaid: number;
  pendingInvoices: number;
  topProducts: Array<{ name: string; price: number; quantity?: number }>;
  recentActivities: Array<{
    id: number;
    type: 'invoice' | 'payment';
    amount: number;
    clientName: string;
    method?: string;
    date: string;
  }>;
  latestInvoices: Array<{
    id: number;
    number: string;
    clientName: string;
    date: string;
    total: number;
    status: string;
  }>;
  salesByDate: Array<{ date: string; revenue: number; paid: number }>;
  paymentMethods: { cash: number; orange_money: number; mtn_money: number };
  monthlyGrowth: number;
  weeklyTrend: Array<{ day: string; count: number; amount: number }>;
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { metrics: realtimeMetrics, isRealtime, lastRefresh, loading: metricsLoading, error: metricsError } = useRealtimeMetrics();
  const [stats, setStats] = useState<DashboardStats>({
    clients: 0,
    invoices: 0,
    payments: 0,
    totalRevenue: 0,
    totalPaid: 0,
    unpaid: 0,
    pendingInvoices: 0,
    topProducts: [],
    recentActivities: [],
    latestInvoices: [],
    salesByDate: [],
    paymentMethods: { cash: 0, orange_money: 0, mtn_money: 0 },
    monthlyGrowth: 0,
    weeklyTrend: []
  });
  const [loading, setLoading] = useState(true);
  const [chartPeriod, setChartPeriod] = useState<'week' | 'month' | 'year'>('month');
  const [loadTimeout, setLoadTimeout] = useState(false);

  // Timeout de secours pour éviter le chargement infini (10 secondes)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (loading && !realtimeMetrics && stats.clients === 0) {
        console.log('⚠️ Timeout de chargement (10s), arrêt du loading');
        setLoadTimeout(true);
        setLoading(false);
        toast.error('Le chargement prend trop de temps. Vérifiez votre connexion.');
      }
    }, 10000);

    return () => clearTimeout(timeoutId);
  }, [loading, realtimeMetrics, stats.clients]);

  // Utiliser les métriques en temps réel pour les KPI
  const displayStats = realtimeMetrics ? {
    ...stats,
    clients: realtimeMetrics.clients,
    invoices: realtimeMetrics.invoices,
    payments: realtimeMetrics.payments,
    totalRevenue: realtimeMetrics.totalRevenue,
    totalPaid: realtimeMetrics.totalPayments,
    unpaid: realtimeMetrics.unpaid
  } : stats;

  useEffect(() => {
    fetchDashboardData();
  }, [chartPeriod]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setLoadTimeout(false);
      const [
        statsRes,
        invoicesRes,
        paymentsRes,
        productsRes,
        salesReportRes,
        paymentsReportRes
      ] = await Promise.all([
        api.get('/stats'),
        api.get('/invoices', { params: { limit: 5, sort: 'createdAt', order: 'DESC' } }),
        api.get('/payments', { params: { limit: 5, sort: 'createdAt', order: 'DESC' } }),
        api.get('/products', { params: { limit: 5, sort: 'createdAt', order: 'DESC' } }),
        api.get('/reports/sales', { params: { period: chartPeriod } }),
        api.get('/reports/payments')
      ]);

      const statsData = statsRes.data;
      const invoices = invoicesRes.data.data || invoicesRes.data;
      const payments = paymentsRes.data.data || paymentsRes.data;
      const products = productsRes.data.data || productsRes.data;
      const salesReport = salesReportRes.data;

      const salesByDate = (salesReport.salesByDate || []).map((d: any) => ({
        date: d.date,
        revenue: parseFloat(d.revenue) || 0,
        paid: parseFloat(d.paid) || 0,
      }));
      
      let monthlyGrowth = 0;
      if (salesByDate.length >= 2) {
        const currentMonth = salesByDate.slice(-30).reduce((sum: number, d: any) => sum + d.revenue, 0);
        const previousMonth = salesByDate.slice(-60, -30).reduce((sum: number, d: any) => sum + d.revenue, 0);
        monthlyGrowth = previousMonth > 0 ? ((currentMonth - previousMonth) / previousMonth) * 100 : 0;
      }

      const weeklyTrend = salesByDate.slice(-7).map((d: any, i: number) => ({
        day: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'][i % 7],
        count: 1,
        amount: d.revenue
      }));

      const byMethod = paymentsReportRes.data.byMethod || { cash: { total: 0 }, orange_money: { total: 0 }, mtn_money: { total: 0 } };
      const cashTotal = parseFloat(byMethod.cash?.total) || 0;
      const orangeTotal = parseFloat(byMethod.orange_money?.total) || 0;
      const mtnTotal = parseFloat(byMethod.mtn_money?.total) || 0;

      const topProducts = products.slice(0, 5).map((p: any) => ({
        name: p.name,
        price: parseFloat(p.price) || 0,
      }));

      const recentActivities = [
        ...invoices.map((inv: any) => ({
          id: inv.id,
          type: 'invoice' as const,
          amount: parseFloat(inv.total) || 0,
          clientName: inv.client?.name || 'Client',
          date: inv.createdAt,
        })),
        ...payments.map((p: any) => ({
          id: p.id,
          type: 'payment' as const,
          amount: parseFloat(p.amount) || 0,
          clientName: p.Invoice?.client?.name || 'Client',
          method: p.method,
          date: p.createdAt,
        })),
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

      const latestInvoices = invoices.map((inv: any) => ({
        id: inv.id,
        number: inv.number,
        clientName: inv.client?.name || 'N/A',
        date: inv.createdAt,
        total: parseFloat(inv.total) || 0,
        status: inv.status,
      }));

      setStats({
        clients: statsData.clients || 0,
        invoices: statsData.invoices || 0,
        payments: statsData.payments || 0,
        totalRevenue: statsData.totalRevenue || 0,
        totalPaid: statsData.totalPayments || 0,
        unpaid: statsData.totalUnpaid || 0,
        pendingInvoices: statsData.draftInvoices || 0,
        topProducts,
        recentActivities,
        latestInvoices,
        salesByDate,
        paymentMethods: { cash: cashTotal, orange_money: orangeTotal, mtn_money: mtnTotal },
        monthlyGrowth,
        weeklyTrend
      });
    } catch (error) {
      console.error('Erreur chargement dashboard', error);
      toast.error('Erreur de chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const evolutionChartData = {
    labels: stats.salesByDate.map((d) => d.date),
    datasets: [
      {
        label: 'Chiffre d\'affaires',
        data: stats.salesByDate.map((d) => d.revenue),
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#3b82f6',
        pointBorderColor: '#fff',
        pointRadius: 4,
        pointHoverRadius: 6,
      },
      {
        label: 'Encaissements',
        data: stats.salesByDate.map((d) => d.paid),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#10b981',
        pointBorderColor: '#fff',
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  const paymentChartData = {
    labels: ['Espèces', 'Orange Money', 'MTN Money'],
    datasets: [
      {
        data: [stats.paymentMethods.cash, stats.paymentMethods.orange_money, stats.paymentMethods.mtn_money],
        backgroundColor: ['#10b981', '#f59e0b', '#3b82f6'],
        borderColor: '#fff',
        borderWidth: 2,
        hoverOffset: 10,
      },
    ],
  };

  const radarChartData = {
    labels: ['Factures', 'Paiements', 'Clients', 'CA', 'Encaissé', 'Produits'],
    datasets: [
      {
        label: 'Performance',
        data: [
          displayStats.invoices,
          displayStats.payments,
          displayStats.clients,
          Math.min(100, (displayStats.totalRevenue / 1000000) * 100),
          Math.min(100, (displayStats.totalPaid / 1000000) * 100),
          stats.topProducts.length * 20,
        ],
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        borderColor: '#3b82f6',
        borderWidth: 2,
        pointBackgroundColor: '#3b82f6',
        pointBorderColor: '#fff',
        pointHoverRadius: 8,
      },
    ],
  };

  const trendChartData = {
    labels: stats.weeklyTrend.map((d) => d.day),
    datasets: [
      {
        label: 'Montant (FCFA)',
        data: stats.weeklyTrend.map((d) => d.amount),
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderRadius: 8,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' as const },
      tooltip: { mode: 'index' as const, intersect: false },
    },
    scales: {
      y: { 
        beginAtZero: true, 
        ticks: { 
          callback: (value: any) => value.toLocaleString() + ' F',
          color: '#9ca3af'
        },
        grid: { color: 'rgba(156, 163, 175, 0.2)' }
      },
      x: {
        ticks: { color: '#9ca3af' },
        grid: { color: 'rgba(156, 163, 175, 0.2)' }
      }
    }
  };

  // Gestion des erreurs et fallback
  if (metricsError && !realtimeMetrics) {
    console.error('Erreur métriques:', metricsError);
  }

  // État de chargement avec timeout
  if ((loading || (metricsLoading && !realtimeMetrics && stats.clients === 0)) && !loadTimeout) {
    return (
      <div className="flex flex-col justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-400">Chargement du tableau de bord...</p>
        {metricsError && (
          <p className="mt-2 text-sm text-red-500">⚠️ {metricsError}</p>
        )}
        <p className="mt-2 text-xs text-gray-400">Si le chargement prend trop de temps, vérifiez votre connexion</p>
      </div>
    );
  }

  // Si timeout dépassé, afficher un message d'erreur
  if (loadTimeout && stats.clients === 0) {
    return (
      <div className="flex flex-col justify-center items-center h-96">
        <div className="text-center">
          <FiWifiOff className="text-gray-400 text-5xl mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">Problème de connexion</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Impossible de charger les données. Vérifiez votre connexion internet.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 bg-gray-50 dark:bg-dark-bg min-h-screen">
      {/* En-tête avec indicateur temps réel */}
      <div className="mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Bonjour, {user?.name}</h1>
            <p className="text-gray-600 dark:text-gray-400">Résumé de votre activité</p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-2">
              {isRealtime ? (
                <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                  <FiWifi className="w-3 h-3" /> Temps réel
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs text-gray-400">
                  <FiWifiOff className="w-3 h-3" /> Hors ligne
                </span>
              )}
            </div>
            {lastRefresh && (
              <span className="text-xs text-gray-400">
                Dernière mise à jour: {lastRefresh.toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* KPI Cards avec métriques en temps réel */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
        <div className="bg-white dark:bg-dark-card rounded-xl shadow p-4 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <FiUsers className="text-blue-500 text-2xl" />
            <span className="text-xs text-gray-400 dark:text-gray-500">Clients</span>
          </div>
          <p className="text-2xl font-bold mt-2 text-gray-900 dark:text-white">{displayStats.clients}</p>
        </div>
        
        <div className="bg-white dark:bg-dark-card rounded-xl shadow p-4 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <FiFileText className="text-green-500 text-2xl" />
            <span className="text-xs text-gray-400 dark:text-gray-500">Factures</span>
          </div>
          <p className="text-2xl font-bold mt-2 text-gray-900 dark:text-white">{displayStats.invoices}</p>
          {realtimeMetrics?.trends?.newInvoices !== undefined && realtimeMetrics.trends.newInvoices > 0 && (
            <p className="text-xs text-green-600 mt-1">+{realtimeMetrics.trends.newInvoices} dernière heure</p>
          )}
        </div>
        
        <div className="bg-white dark:bg-dark-card rounded-xl shadow p-4 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <FiCreditCard className="text-yellow-500 text-2xl" />
            <span className="text-xs text-gray-400 dark:text-gray-500">Paiements</span>
          </div>
          <p className="text-2xl font-bold mt-2 text-gray-900 dark:text-white">{displayStats.payments}</p>
          {realtimeMetrics?.trends?.newPayments !== undefined && realtimeMetrics.trends.newPayments > 0 && (
            <p className="text-xs text-green-600 mt-1">+{realtimeMetrics.trends.newPayments} dernière heure</p>
          )}
        </div>
        
        <div className="bg-white dark:bg-dark-card rounded-xl shadow p-4 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <FiTrendingUp className="text-purple-500 text-2xl" />
            <span className="text-xs text-gray-400 dark:text-gray-500">CA total</span>
          </div>
          <p className="text-xl font-bold mt-2 text-gray-900 dark:text-white">{displayStats.totalRevenue.toLocaleString()} F</p>
          {realtimeMetrics?.trends?.newRevenue !== undefined && realtimeMetrics.trends.newRevenue > 0 && (
            <p className="text-xs text-green-600 mt-1">+{realtimeMetrics.trends.newRevenue.toLocaleString()} F (heure)</p>
          )}
        </div>
        
        <div className="bg-white dark:bg-dark-card rounded-xl shadow p-4 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <FiPieChart className="text-indigo-500 text-2xl" />
            <span className="text-xs text-gray-400 dark:text-gray-500">Encaissé</span>
          </div>
          <p className="text-xl font-bold mt-2 text-gray-900 dark:text-white">{displayStats.totalPaid.toLocaleString()} F</p>
        </div>
        
        <div className="bg-white dark:bg-dark-card rounded-xl shadow p-4 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <FiAlertCircle className="text-red-500 text-2xl" />
            <span className="text-xs text-gray-400 dark:text-gray-500">Impayés</span>
          </div>
          <p className="text-xl font-bold mt-2 text-gray-900 dark:text-white">{displayStats.unpaid.toLocaleString()} F</p>
        </div>
      </div>

      {/* Filtre période */}
      <div className="flex justify-end gap-2 mb-4">
        <button 
          onClick={() => setChartPeriod('week')}
          className={`px-3 py-1 rounded text-sm ${chartPeriod === 'week' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
        >
          <FiCalendar className="inline mr-1" size={14} /> Semaine
        </button>
        <button 
          onClick={() => setChartPeriod('month')}
          className={`px-3 py-1 rounded text-sm ${chartPeriod === 'month' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
        >
          Mois
        </button>
        <button 
          onClick={() => setChartPeriod('year')}
          className={`px-3 py-1 rounded text-sm ${chartPeriod === 'year' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
        >
          Année
        </button>
      </div>

      {/* Graphiques principaux */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white dark:bg-dark-card rounded-xl shadow p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Évolution du chiffre d'affaires</h2>
            <FiBarChart2 className="text-gray-400 dark:text-gray-500" />
          </div>
          <div style={{ height: '280px' }}>
            {stats.salesByDate.length ? (
              <Line data={evolutionChartData} options={chartOptions} />
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-20">Aucune donnée disponible</p>
            )}
          </div>
          {stats.monthlyGrowth !== 0 && (
            <div className="mt-3 text-center">
              <span className={`text-sm ${stats.monthlyGrowth >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {stats.monthlyGrowth >= 0 ? '↑' : '↓'} {Math.abs(stats.monthlyGrowth).toFixed(1)}% par rapport au mois dernier
              </span>
            </div>
          )}
        </div>
        
        <div className="bg-white dark:bg-dark-card rounded-xl shadow p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Répartition des paiements</h2>
            <FiPieChart className="text-gray-400 dark:text-gray-500" />
          </div>
          <div style={{ height: '280px' }}>
            {stats.paymentMethods.cash + stats.paymentMethods.orange_money + stats.paymentMethods.mtn_money > 0 ? (
              <Doughnut data={paymentChartData} options={{ responsive: true, maintainAspectRatio: false }} />
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-20">Aucun paiement enregistré</p>
            )}
          </div>
        </div>
      </div>

      {/* Graphiques secondaires */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white dark:bg-dark-card rounded-xl shadow p-4">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Performance globale</h2>
          <div style={{ height: '250px' }}>
            <Radar data={radarChartData} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
        </div>
        
        <div className="bg-white dark:bg-dark-card rounded-xl shadow p-4">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Tendance de la semaine</h2>
          <div style={{ height: '250px' }}>
            {stats.weeklyTrend.some(d => d.amount > 0) ? (
              <Bar data={trendChartData} options={chartOptions} />
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-20">Aucune donnée cette semaine</p>
            )}
          </div>
        </div>
      </div>

      {/* Alertes, Top produits et Stock */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="bg-white dark:bg-dark-card rounded-xl shadow p-4">
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-3 text-gray-900 dark:text-white">
            <FiAlertCircle className="text-red-500" /> Alertes
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-red-50 dark:bg-red-900/30 rounded-lg">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">{displayStats.unpaid.toLocaleString()} FCFA d'impayés</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Sur toutes les factures</p>
              </div>
              <Link to="/invoices?status=draft" className="text-blue-600 dark:text-blue-400 text-sm hover:underline">Voir</Link>
            </div>
            <div className="flex justify-between items-center p-3 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">{stats.pendingInvoices} factures en attente</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">À traiter</p>
              </div>
              <Link to="/invoices?status=draft" className="text-blue-600 dark:text-blue-400 text-sm hover:underline">Voir</Link>
            </div>
          </div>
        </div>
        
        <StockAlertWidget />
      </div>

      {/* Top produits */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="bg-white dark:bg-dark-card rounded-xl shadow p-4 lg:col-span-2">
          <h2 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">🏆 Top produits</h2>
          {stats.topProducts.length ? (
            <div className="space-y-2">
              {stats.topProducts.map((product, idx) => (
                <div key={idx} className="flex justify-between items-center p-3 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className={`w-6 h-6 flex items-center justify-center rounded-full ${
                      idx === 0 ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300' : 
                      idx === 1 ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300' : 
                      'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                    } text-sm font-bold`}>
                      {idx + 1}
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">{product.name}</span>
                  </div>
                  <span className="font-bold text-blue-600 dark:text-blue-400">{product.price.toLocaleString()} FCFA</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-10">Aucun produit</p>
          )}
        </div>
      </div>

      {/* Dernières factures */}
      <div className="bg-white dark:bg-dark-card rounded-xl shadow p-4">
        <h2 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">📄 Dernières factures</h2>
        <div className="overflow-x-auto">
          <table className="min-w-[640px] w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="p-3 text-left text-gray-700 dark:text-gray-300">N°</th>
                <th className="p-3 text-left text-gray-700 dark:text-gray-300">Client</th>
                <th className="p-3 text-left text-gray-700 dark:text-gray-300">Date</th>
                <th className="p-3 text-right text-gray-700 dark:text-gray-300">Montant</th>
                <th className="p-3 text-left text-gray-700 dark:text-gray-300">Statut</th>
                <th className="p-3 text-left text-gray-700 dark:text-gray-300">Action</th>
              </tr>
            </thead>
            <tbody>
              {stats.latestInvoices.map((inv) => (
                <tr key={inv.id} className="border-t dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="p-3 font-mono font-medium text-gray-900 dark:text-white">{inv.number}</td>
                  <td className="p-3 text-gray-600 dark:text-gray-400">{inv.clientName}</td>
                  <td className="p-3 text-gray-600 dark:text-gray-400">{new Date(inv.date).toLocaleDateString('fr-FR')}</td>
                  <td className="p-3 text-right font-medium text-gray-900 dark:text-white">{inv.total.toLocaleString()} FCFA</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      inv.status === 'paid' ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' :
                      inv.status === 'draft' ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200' : 
                      'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                    }`}>
                      {inv.status === 'paid' ? 'Payée' : inv.status === 'draft' ? 'En attente' : 'Annulée'}
                    </span>
                  </td>
                  <td className="p-3">
                    <Link to={`/invoices/${inv.id}`} className="text-blue-600 dark:text-blue-400 text-sm hover:underline">
                      Voir →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 text-right">
          <Link to="/invoices" className="text-blue-600 dark:text-blue-400 text-sm hover:underline">Voir toutes les factures →</Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;