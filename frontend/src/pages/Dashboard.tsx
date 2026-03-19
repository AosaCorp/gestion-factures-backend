import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
//import { FiUsers, FiFileText, FiCreditCard, FiAlertCircle, FiPlus } from 'react-icons/fi';
import { FiUsers, FiFileText, FiCreditCard, FiAlertCircle } from 'react-icons/fi';
import { Line, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import toast from 'react-hot-toast';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface DashboardStats {
  clients: number;
  invoices: number;
  payments: number;
  totalRevenue: number;
  totalPaid: number;
  unpaid: number;
  pendingInvoices: number;
  topProducts: Array<{ name: string; quantity?: number; revenue?: number; price: number }>;
  recentActivities: Array<{
    id: number;
    type: 'invoice' | 'payment';
    description: string;
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
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
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
    paymentMethods: { cash: 0, orange_money: 0, mtn_money: 0 }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [
        statsRes,
        invoicesRes,
        paymentsRes,
        productsRes,
         // clientsRes,   ← commenter ou supprimer
        salesReportRes,
        paymentsReportRes
      ] = await Promise.all([
        api.get('/stats'),
        api.get('/invoices', { params: { limit: 5, sort: 'createdAt', order: 'DESC' } }),
        api.get('/payments', { params: { limit: 5, sort: 'createdAt', order: 'DESC' } }),
        api.get('/products', { params: { limit: 5, sort: 'createdAt', order: 'DESC' } }),
        // api.get('/clients', { params: { limit: 5, sort: 'createdAt', order: 'DESC' } }), // si inutile
        api.get('/reports/sales'),
        api.get('/reports/payments')
      ]);

      console.log('Stats:', statsRes.data);
      console.log('Payments report:', paymentsReportRes.data);
      console.log('Sales report:', salesReportRes.data);

      const statsData = statsRes.data;
      const invoices = invoicesRes.data.data || invoicesRes.data;
      const payments = paymentsRes.data.data || paymentsRes.data;
      const products = productsRes.data.data || productsRes.data;
      const salesReport = salesReportRes.data;
      const paymentsReport = paymentsReportRes.data;

      // Nettoyage des données
      const byMethod = paymentsReport.byMethod || { cash: { total: 0 }, orange_money: { total: 0 }, mtn_money: { total: 0 } };

      // Forcer les totaux à être des nombres
      const cashTotal = parseFloat(byMethod.cash?.total) || 0;
      const orangeTotal = parseFloat(byMethod.orange_money?.total) || 0;
      const mtnTotal = parseFloat(byMethod.mtn_money?.total) || 0;

      // Traitement des ventes par date
      let salesByDate = (salesReport.salesByDate || []).map((d: any) => ({
        date: d.date,
        revenue: parseFloat(d.revenue) || 0,
        paid: parseFloat(d.paid) || 0
      }));

      // Si trop de points, on peut les regrouper ou limiter (par exemple 30 derniers jours)
      if (salesByDate.length > 30) {
        salesByDate = salesByDate.slice(-30);
      }

      // Top produits (on utilise les produits récents comme fallback)
      const topProducts = products.slice(0, 5).map((p: any) => ({
        name: p.name,
        price: parseFloat(p.price) || 0
      }));

      // Activités récentes combinées
      const recentActivities = [
        ...invoices.map((inv: any) => ({
          id: inv.id,
          type: 'invoice' as const,
          description: `Nouvelle facture ${inv.number}`,
          amount: parseFloat(inv.total) || 0,
          clientName: inv.client?.name || 'Client',
          date: inv.createdAt
        })),
        ...payments.map((p: any) => ({
          id: p.id,
          type: 'payment' as const,
          description: `Paiement reçu`,
          amount: parseFloat(p.amount) || 0,
          clientName: p.Invoice?.client?.name || 'Client',
          method: p.method,
          date: p.createdAt
        }))
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

      const latestInvoices = invoices.map((inv: any) => ({
        id: inv.id,
        number: inv.number,
        clientName: inv.client?.name || 'N/A',
        date: inv.createdAt,
        total: parseFloat(inv.total) || 0,
        status: inv.status
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
        paymentMethods: {
          cash: cashTotal,
          orange_money: orangeTotal,
          mtn_money: mtnTotal
        }
      });
    } catch (error) {
      console.error('Erreur chargement dashboard', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR') + ' ' + date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  // Préparation des données pour le graphique d'évolution
  const evolutionChartData = {
    labels: stats.salesByDate.map(d => d.date),
    datasets: [
      {
        label: 'Chiffre d\'affaires',
        data: stats.salesByDate.map(d => d.revenue),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        tension: 0.4,
        pointRadius: 4,
      },
      {
        label: 'Encaissements',
        data: stats.salesByDate.map(d => d.paid),
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.5)',
        tension: 0.4,
        pointRadius: 4,
      }
    ]
  };

  const paymentChartData = {
    labels: ['Espèces', 'Orange Money', 'MTN Money'],
    datasets: [
      {
        data: [
          stats.paymentMethods.cash,
          stats.paymentMethods.orange_money,
          stats.paymentMethods.mtn_money
        ],
        backgroundColor: ['#10b981', '#f59e0b', '#3b82f6'],
        borderColor: ['#0b8a5c', '#d97706', '#2563eb'],
        borderWidth: 1,
      }
    ]
  };

  // Options pour le graphique linéaire
  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value: any) {
            return value.toLocaleString() + ' FCFA';
          }
        }
      }
    },
    plugins: {
      tooltip: {
        callbacks: {
          label: function(context: any) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            label += context.parsed.y.toLocaleString() + ' FCFA';
            return label;
          }
        }
      }
    }
  };

  // Options pour le pie chart
  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const value = context.parsed;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
            return `${context.label}: ${value.toLocaleString()} FCFA (${percentage}%)`;
          }
        }
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p>Chargement du tableau de bord...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Bonjour, {user?.name}</h1>
        <p className="text-gray-600">Voici un résumé de votre activité aujourd'hui</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-6 flex items-center">
          <FiUsers className="text-blue-500 text-3xl mr-4" />
          <div>
            <p className="text-sm text-gray-500">Clients</p>
            <p className="text-2xl font-bold">{stats.clients}</p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6 flex items-center">
          <FiFileText className="text-green-500 text-3xl mr-4" />
          <div>
            <p className="text-sm text-gray-500">Factures</p>
            <p className="text-2xl font-bold">{stats.invoices}</p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6 flex items-center">
          <FiCreditCard className="text-yellow-500 text-3xl mr-4" />
          <div>
            <p className="text-sm text-gray-500">Paiements</p>
            <p className="text-2xl font-bold">{stats.payments}</p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6 flex items-center">
          <FiAlertCircle className="text-red-500 text-3xl mr-4" />
          <div>
            <p className="text-sm text-gray-500">Impayés</p>
            <p className="text-2xl font-bold">{stats.unpaid.toLocaleString()} FCFA</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Évolution du chiffre d'affaires</h2>
          {stats.salesByDate.length > 0 ? (
            <div style={{ height: '300px' }}>
              <Line data={evolutionChartData} options={lineOptions} />
            </div>
          ) : (
            <p className="text-gray-500 text-center py-10">Aucune donnée disponible</p>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Répartition des paiements</h2>
          {stats.paymentMethods.cash + stats.paymentMethods.orange_money + stats.paymentMethods.mtn_money > 0 ? (
            <div style={{ height: '300px' }}>
              <Pie data={paymentChartData} options={pieOptions} />
            </div>
          ) : (
            <p className="text-gray-500 text-center py-10">Aucun paiement enregistré</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <FiAlertCircle className="text-red-500 mr-2" /> Alertes
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-red-50 rounded">
              <span className="text-sm font-medium">{stats.unpaid.toLocaleString()} FCFA d'impayés</span>
              <Link to="/invoices?status=draft" className="text-blue-600 hover:underline text-sm">Voir</Link>
            </div>
            <div className="flex justify-between items-center p-3 bg-yellow-50 rounded">
              <span className="text-sm font-medium">{stats.pendingInvoices} factures en attente</span>
              <Link to="/invoices?status=draft" className="text-blue-600 hover:underline text-sm">Voir</Link>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 lg:col-span-2">
          <h2 className="text-lg font-semibold mb-4">Top produits</h2>
          {stats.topProducts.length > 0 ? (
            <div className="space-y-3">
              {stats.topProducts.map((product, index) => (
                <div key={index} className="flex justify-between items-center p-2 hover:bg-gray-50 rounded">
                  <div className="flex items-center">
                    <span className="w-6 text-gray-500">{index + 1}.</span>
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-xs text-gray-500">produit</p>
                    </div>
                  </div>
                  <p className="font-semibold">{product.price.toLocaleString()} FCFA</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">Aucun produit</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Activités récentes</h2>
          <div className="space-y-4">
            {stats.recentActivities.map(activity => (
              <div key={`${activity.type}-${activity.id}`} className="border-l-4 pl-3 py-1" style={{ borderColor: activity.type === 'invoice' ? '#3b82f6' : '#10b981' }}>
                <p className="text-sm font-medium">
                  {activity.type === 'invoice' ? 'Nouvelle facture' : 'Paiement reçu'}
                </p>
                <p className="text-xs text-gray-600">
                  {activity.clientName} - {activity.amount.toLocaleString()} FCFA
                  {activity.method && ` (${activity.method === 'cash' ? 'espèces' : activity.method === 'orange_money' ? 'Orange Money' : 'MTN Money'})`}
                </p>
                <p className="text-xs text-gray-400">{formatDate(activity.date)}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 lg:col-span-3">
          <h2 className="text-lg font-semibold mb-4">Dernières factures</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">N° Facture</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Montant</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stats.latestInvoices.map(inv => (
                  <tr key={inv.id}>
                    <td className="px-4 py-3 whitespace-nowrap font-mono text-sm">{inv.number}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{inv.clientName}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{new Date(inv.date).toLocaleDateString('fr-FR')}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{inv.total.toLocaleString()} FCFA</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        inv.status === 'paid' ? 'bg-green-100 text-green-800' :
                        inv.status === 'draft' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {inv.status === 'paid' ? 'Payée' : inv.status === 'draft' ? 'En attente' : 'Annulée'}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Link to={`/invoices/${inv.id}`} className="text-blue-600 hover:underline text-sm">Voir</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 text-right">
            <Link to="/invoices" className="text-blue-600 hover:underline text-sm">Voir toutes les factures →</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;