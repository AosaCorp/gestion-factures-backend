import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { invoiceService, Invoice } from '../services/invoiceService';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { FiSearch, FiFilter, FiDownload, FiEye, FiEdit, FiTrash2, FiRefreshCw } from 'react-icons/fi';
import debounce from 'lodash/debounce';
import api from '../services/api';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { exportToCSV } from '../services/exportService';
import { isCapacitor } from '../utils/platform';

const Invoices: React.FC = () => {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const limit = 10;
  const [stats, setStats] = useState({
    totalInvoices: 0,
    totalPaid: 0,
    totalUnpaid: 0,
    averageAmount: 0
  });

  // Gestion du timeout de chargement
  useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => {
        setLoadingTimeout(true);
      }, 15000); // 15 secondes
      return () => clearTimeout(timer);
    } else {
      setLoadingTimeout(false);
    }
  }, [loading]);

  const fetchInvoices = useCallback(async () => {
    try {
      setLoading(true);
      setLoadingTimeout(false);
      const response = await invoiceService.getPaginated(page, limit, search, statusFilter);
      setInvoices(response.data);
      setTotalPages(response.totalPages);
    } catch (error: any) {
      console.error('Erreur chargement factures', error);
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        toast.error('Le serveur met trop de temps à répondre. Réessayez dans quelques instants.');
      } else {
        toast.error('Erreur lors du chargement des factures');
      }
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  const fetchStats = useCallback(async () => {
    try {
      const response = await api.get('/stats');
      const data = response.data;
      setStats({
        totalInvoices: data.invoices || 0,
        totalPaid: data.totalPayments || 0,
        totalUnpaid: data.totalUnpaid || 0,
        averageAmount: data.averageInvoice || 0
      });
    } catch (error: any) {
      console.error('Erreur chargement stats', error);
      if (error.code !== 'ECONNABORTED') {
        toast.error('Erreur lors du chargement des statistiques');
      }
    }
  }, []);

  useEffect(() => {
    fetchInvoices();
    fetchStats();
  }, [fetchInvoices, fetchStats]);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    setLoading(true);
    setLoadingTimeout(false);
    fetchInvoices();
    fetchStats();
  };

  const debouncedSearch = useCallback(
    debounce((value: string) => {
      setSearch(value);
      setPage(1);
    }, 500),
    []
  );

  const getStatusBadge = (status: string) => {
    const colors = {
      draft: 'bg-yellow-100 text-yellow-800',
      paid: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    const labels = { draft: 'En attente', paid: 'Payée', cancelled: 'Annulée' };
    return (
      <span className={`px-2 py-1 text-xs rounded-full ${colors[status as keyof typeof colors]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  const handleCancel = async (id: number) => {
    if (window.confirm('Annuler cette facture ?')) {
      try {
        await invoiceService.cancel(id);
        toast.success('Facture annulée');
        fetchInvoices();
        fetchStats();
      } catch (error) {
        toast.error('Erreur lors de l\'annulation');
      }
    }
  };

  const handleDownloadPdf = async (id: number) => {
    try {
      const blob = await invoiceService.getPdf(id);
      if (isCapacitor()) {
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = async () => {
          const base64 = (reader.result as string).split(',')[1];
          const fileName = `facture-${id}.pdf`;
          await Filesystem.writeFile({ path: fileName, data: base64, directory: Directory.Cache });
          const uri = await Filesystem.getUri({ path: fileName, directory: Directory.Cache });
          await Share.share({ title: 'Facture', text: `Facture ${id}`, url: uri.uri });
          toast.success('PDF prêt à être partagé');
        };
        reader.onerror = () => toast.error('Erreur lecture PDF');
      } else {
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        URL.revokeObjectURL(url);
        toast.success('PDF ouvert dans un nouvel onglet');
      }
    } catch (error) {
      console.error('Erreur téléchargement PDF', error);
      toast.error('Erreur lors du téléchargement');
    }
  };

  const handleExport = async () => {
    try {
      const allInvoices = await invoiceService.getAll();
      const dataForExport = allInvoices.map(inv => ({
        Numéro: inv.number,
        Client: inv.client?.name || 'N/A',
        Date: new Date(inv.createdAt).toLocaleDateString('fr-FR'),
        Montant_HT: inv.subtotal,
        TVA: inv.taxTotal,
        Total_TTC: inv.total,
        Payé: inv.Payments?.reduce((sum, p) => sum + p.amount, 0) || 0,
        Statut: inv.status === 'draft' ? 'En attente' : inv.status === 'paid' ? 'Payée' : 'Annulée',
      }));
      await exportToCSV(dataForExport, 'factures');
      toast.success('Export réussi');
    } catch (error: any) {
      toast.error(error.message || 'Erreur export');
    }
  };

  const getPaidAmount = (invoice: Invoice) => {
    return invoice.Payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
  };

  // Affichage du timeout
  if (loadingTimeout) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="text-center">
          <div className="bg-yellow-50 border border-yellow-400 rounded-lg p-6 max-w-md">
            <FiRefreshCw className="text-yellow-600 text-4xl mx-auto mb-4 animate-spin" />
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">Le serveur prend du temps à répondre</h3>
            <p className="text-sm text-yellow-700 mb-4">
              Le plan gratuit de Render met le serveur en veille après une période d'inactivité.
              La première requête peut prendre jusqu'à 50 secondes.
            </p>
            <button
              onClick={handleRetry}
              className="bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 mx-auto"
            >
              <FiRefreshCw /> Réessayer
            </button>
            <p className="text-xs text-gray-500 mt-4">
              Tentative de rechargement: {retryCount + 1}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-2xl md:text-3xl font-bold mb-6">Gestion des factures</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-3 md:p-4">
          <p className="text-xs md:text-sm text-gray-500">Total factures</p>
          <p className="text-lg md:text-2xl font-bold">{stats.totalInvoices}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-3 md:p-4">
          <p className="text-xs md:text-sm text-gray-500">Total encaissé</p>
          <p className="text-lg md:text-2xl font-bold">{stats.totalPaid.toLocaleString()} F</p>
        </div>
        <div className="bg-white rounded-lg shadow p-3 md:p-4">
          <p className="text-xs md:text-sm text-gray-500">Total impayé</p>
          <p className="text-lg md:text-2xl font-bold">{stats.totalUnpaid.toLocaleString()} F</p>
        </div>
        <div className="bg-white rounded-lg shadow p-3 md:p-4">
          <p className="text-xs md:text-sm text-gray-500">Montant moyen</p>
          <p className="text-lg md:text-2xl font-bold">{stats.averageAmount.toLocaleString()} F</p>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[180px]">
            <input
              type="text"
              placeholder="Rechercher n° facture, client..."
              onChange={(e) => debouncedSearch(e.target.value)}
              className="w-full border border-gray-300 rounded-md pl-10 pr-4 py-2 text-sm"
            />
            <FiSearch className="absolute left-3 top-3 text-gray-400" />
          </div>
          <div className="flex items-center gap-2">
            <FiFilter className="text-gray-500" />
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              <option value="">Tous</option>
              <option value="draft">En attente</option>
              <option value="paid">Payée</option>
              <option value="cancelled">Annulée</option>
            </select>
          </div>
          <button
            onClick={handleExport}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex items-center gap-1 text-sm"
          >
            <FiDownload /> CSV
          </button>
          {(user?.role === 'cashier' || user?.role === 'admin') && (
            <Link
              to="/invoices/new"
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm"
            >
              Nouvelle facture
            </Link>
          )}
        </div>
      </div>

      {/* Tableau */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Chargement des factures...</p>
          <p className="text-xs text-gray-400 mt-2">Le serveur peut prendre du temps (plan gratuit)</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className="min-w-[900px] md:min-w-full w-full text-sm md:text-base">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left">N° Facture</th>
                  <th className="px-4 py-3 text-left">Client</th>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-right">Montant</th>
                  <th className="px-4 py-3 text-right">Payé</th>
                  <th className="px-4 py-3 text-left">Statut</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {invoices.map(invoice => {
                  const paid = getPaidAmount(invoice);
                  return (
                    <tr key={invoice.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap font-mono text-sm">
                        {invoice.number}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium">{invoice.client?.name || 'N/A'}</div>
                        <div className="text-xs text-gray-500">CLI{invoice.client?.id || ''}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {new Date(invoice.createdAt).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right font-medium">
                        {invoice.total.toLocaleString()} FCFA
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        {paid.toLocaleString()} FCFA
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {getStatusBadge(invoice.status)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex gap-2">
                          <Link
                            to={`/invoices/${invoice.id}`}
                            title="Voir"
                            className="text-indigo-600 hover:text-indigo-800"
                          >
                            <FiEye className="w-5 h-5" />
                          </Link>
                          <button
                            onClick={() => handleDownloadPdf(invoice.id)}
                            title="PDF"
                            className="text-purple-600 hover:text-purple-800"
                          >
                            <FiDownload className="w-5 h-5" />
                          </button>
                          {invoice.status === 'draft' && (user?.role === 'cashier' || user?.role === 'admin') && (
                            <Link
                              to={`/invoices/edit/${invoice.id}`}
                              title="Modifier"
                              className="text-yellow-600 hover:text-yellow-800"
                            >
                              <FiEdit className="w-5 h-5" />
                            </Link>
                          )}
                          {invoice.status === 'draft' && user?.role === 'admin' && (
                            <button
                              onClick={() => handleCancel(invoice.id)}
                              title="Annuler"
                              className="text-red-600 hover:text-red-800"
                            >
                              <FiTrash2 className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-4 gap-2 text-sm">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50 hover:bg-gray-300"
              >
                Précédent
              </button>
              <span className="px-3 py-1">
                Page {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50 hover:bg-gray-300"
              >
                Suivant
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Invoices;