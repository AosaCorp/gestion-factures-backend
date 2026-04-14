import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
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

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, invoicesRes, paymentsRes, productsRes, salesReportRes, paymentsReportRes] =
        await Promise.all([
          api.get('/stats'),
          api.get('/invoices', { params: { limit: 5, sort: 'createdAt', order: 'DESC' } }),
          api.get('/payments', { params: { limit: 5, sort: 'createdAt', order: 'DESC' } }),
          api.get('/products', { params: { limit: 5, sort: 'createdAt', order: 'DESC' } }),
          api.get('/reports/sales'),
          api.get('/reports/payments'),
        ]);

      const statsData = statsRes.data;
      const invoices = invoicesRes.data.data || invoicesRes.data;
      const payments = paymentsRes.data.data || paymentsRes.data;
      const products = productsRes.data.data || productsRes.data;
      const salesReport = salesReportRes.data;
      const paymentsReport = paymentsReportRes.data;

      const byMethod = paymentsReport.byMethod || { cash: { total: 0 }, orange_money: { total: 0 }, mtn_money: { total: 0 } };
      const cashTotal = parseFloat(byMethod.cash?.total) || 0;
      const orangeTotal = parseFloat(byMethod.orange_money?.total) || 0;
      const mtnTotal = parseFloat(byMethod.mtn_money?.total) || 0;

      let salesByDate = (salesReport.salesByDate || []).map((d: any) => ({
        date: d.date,
        revenue: parseFloat(d.revenue) || 0,
        paid: parseFloat(d.paid) || 0,
      }));
      if (salesByDate.length > 30) salesByDate = salesByDate.slice(-30);

      const topProducts = products.slice(0, 5).map((p: any) => ({
        name: p.name,
        price: parseFloat(p.price) || 0,
      }));

      const recentActivities = [
        ...invoices.map((inv: any) => ({
          id: inv.id,
          type: 'invoice' as const,
          description: `Nouvelle facture ${inv.number}`,
          amount: parseFloat(inv.total) || 0,
          clientName: inv.client?.name || 'Client',
          date: inv.createdAt,
        })),
        ...payments.map((p: any) => ({
          id: p.id,
          type: 'payment' as const,
          description: `Paiement reçu`,
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
      });
    } catch (error) {
      console.error('Erreur chargement dashboard', error);
      toast.error('Erreur de chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const evolutionChartData = {
    labels: stats?.salesByDate.map((d: any) => d.date) || [],
    datasets: [
      {
        label: 'Chiffre d\'affaires',
        data: stats?.salesByDate.map((d: any) => d.revenue) || [],
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        tension: 0.4,
      },
      {
        label: 'Encaissements',
        data: stats?.salesByDate.map((d: any) => d.paid) || [],
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.5)',
        tension: 0.4,
      },
    ],
  };

  const paymentChartData = {
    labels: ['Espèces', 'Orange Money', 'MTN Money'],
    datasets: [
      {
        data: [stats?.paymentMethods.cash || 0, stats?.paymentMethods.orange_money || 0, stats?.paymentMethods.mtn_money || 0],
        backgroundColor: ['#10b981', '#f59e0b', '#3b82f6'],
      },
    ],
  };

  if (loading)
    return <div className="flex justify-center items-center h-64">Chargement du tableau de bord...</div>;
  if (!stats) return <div className="p-4 text-red-600">Impossible de charger les données.</div>;

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">Bonjour, {user?.name}</h1>
        <p className="text-gray-600">Résumé de votre activité</p>
      </div>

      {/* KPI en grille responsive */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4 flex items-center space-x-3">
          <FiUsers className="text-blue-500 text-2xl" />
          <div>
            <p className="text-sm text-gray-500">Clients</p>
            <p className="text-xl font-bold">{stats.clients}</p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 flex items-center space-x-3">
          <FiFileText className="text-green-500 text-2xl" />
          <div>
            <p className="text-sm text-gray-500">Factures</p>
            <p className="text-xl font-bold">{stats.invoices}</p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 flex items-center space-x-3">
          <FiCreditCard className="text-yellow-500 text-2xl" />
          <div>
            <p className="text-sm text-gray-500">Paiements</p>
            <p className="text-xl font-bold">{stats.payments}</p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 flex items-center space-x-3">
          <FiAlertCircle className="text-red-500 text-2xl" />
          <div>
            <p className="text-sm text-gray-500">Impayés</p>
            <p className="text-xl font-bold">{stats.unpaid.toLocaleString()} FCFA</p>
          </div>
        </div>
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-2">Évolution du chiffre d'affaires</h2>
          {stats.salesByDate.length ? (
            <div style={{ height: '250px' }}>
              <Line data={evolutionChartData} options={{ responsive: true, maintainAspectRatio: false }} />
            </div>
          ) : (
            <p className="text-gray-500 text-center py-10">Aucune donnée</p>
          )}
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-2">Répartition des paiements</h2>
          {stats.paymentMethods.cash + stats.paymentMethods.orange_money + stats.paymentMethods.mtn_money > 0 ? (
            <div style={{ height: '250px' }}>
              <Pie data={paymentChartData} options={{ responsive: true, maintainAspectRatio: false }} />
            </div>
          ) : (
            <p className="text-gray-500 text-center py-10">Aucun paiement</p>
          )}
        </div>
      </div>

      {/* Alertes et top produits */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-3">
            <FiAlertCircle className="text-red-500" /> Alertes
          </h2>
          <div className="space-y-2">
            <div className="flex justify-between items-center p-2 bg-red-50 rounded">
              <span>{stats.unpaid.toLocaleString()} FCFA d'impayés</span>
              <Link to="/invoices?status=draft" className="text-blue-600 text-sm">Voir</Link>
            </div>
            <div className="flex justify-between items-center p-2 bg-yellow-50 rounded">
              <span>{stats.pendingInvoices} factures en attente</span>
              <Link to="/invoices?status=draft" className="text-blue-600 text-sm">Voir</Link>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 lg:col-span-2">
          <h2 className="text-lg font-semibold mb-3">Top produits</h2>
          {stats.topProducts.length ? (
            <div className="space-y-2">
              {stats.topProducts.map((p, idx) => (
                <div key={idx} className="flex justify-between items-center p-2 border-b">
                  <span>{idx+1}. {p.name}</span>
                  <span className="font-bold">{p.price.toLocaleString()} FCFA</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center">Aucun produit</p>
          )}
        </div>
      </div>

      {/* Dernières factures */}
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="text-lg font-semibold mb-3">Dernières factures</h2>
        <div className="overflow-x-auto">
          <table className="min-w-[640px] w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 text-left">N°</th>
                <th className="p-2 text-left">Client</th>
                <th className="p-2 text-left">Date</th>
                <th className="p-2 text-right">Montant</th>
                <th className="p-2 text-left">Statut</th>
                <th className="p-2 text-left">Action</th>
              </tr>
            </thead>
            <tbody>
              {stats.latestInvoices.map((inv) => (
                <tr key={inv.id} className="border-t">
                  <td className="p-2">{inv.number}</td>
                  <td className="p-2">{inv.clientName}</td>
                  <td className="p-2">{new Date(inv.date).toLocaleDateString('fr-FR')}</td>
                  <td className="p-2 text-right">{inv.total.toLocaleString()} FCFA</td>
                  <td className="p-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      inv.status === 'paid' ? 'bg-green-100 text-green-800' : inv.status === 'draft' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {inv.status === 'paid' ? 'Payée' : inv.status === 'draft' ? 'En attente' : 'Annulée'}
                    </span>
                  </td>
                  <td className="p-2">
                    <Link to={`/invoices/${inv.id}`} className="text-blue-600 text-sm">Voir</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 text-right">
          <Link to="/invoices" className="text-blue-600 text-sm">Voir toutes →</Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;