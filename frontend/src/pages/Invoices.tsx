import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { invoiceService, Invoice } from '../services/invoiceService';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { FiSearch, FiFilter, FiDownload, FiEye, FiEdit, FiTrash2 } from 'react-icons/fi';
import debounce from 'lodash/debounce';
import Papa from 'papaparse';
import api from '../services/api';

const Invoices: React.FC = () => {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
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

  const fetchInvoices = useCallback(async () => {
    try {
      setLoading(true);
      const response = await invoiceService.getPaginated(page, limit, search, statusFilter);
      setInvoices(response.data);
      setTotalPages(response.totalPages);
    } catch (error) {
      console.error('Erreur chargement factures', error);
      toast.error('Erreur lors du chargement');
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
    } catch (error) {
      console.error('Erreur chargement stats', error);
    }
  }, []);

  useEffect(() => {
    fetchInvoices();
    fetchStats();
  }, [fetchInvoices, fetchStats]);

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
    return <span className={`px-2 py-1 rounded text-xs font-medium ${colors[status as keyof typeof colors]}`}>{labels[status as keyof typeof labels]}</span>;
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

  const handleExport = async () => {
    try {
      const allInvoices = await invoiceService.getAll();
      const dataForExport = allInvoices.map(inv => ({
        numero: inv.number,
        client: inv.client?.name || 'N/A',
        code_client: inv.client ? `CLI${inv.client.id}` : '',
        date: new Date(inv.createdAt).toLocaleDateString('fr-FR'),
        montant_ht: inv.subtotal.toFixed(2),
        tva: inv.taxTotal.toFixed(2),
        total_ttc: inv.total.toFixed(2),
        paye: inv.Payments?.reduce((sum, p) => sum + p.amount, 0).toFixed(2) || 0,
        statut: inv.status === 'draft' ? 'En attente' : inv.status === 'paid' ? 'Payée' : 'Annulée',
        date_paiement: inv.paidAt ? new Date(inv.paidAt).toLocaleDateString('fr-FR') : ''
      }));
      const csv = Papa.unparse(dataForExport);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.href = url;
      link.setAttribute('download', 'factures.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('Export réussi');
    } catch (error) {
      console.error('Erreur export', error);
      toast.error('Erreur lors de l\'export');
    }
  };

  const getPaidAmount = (invoice: Invoice) => {
    return invoice.Payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
  };
  
 const handleDownloadPdf = async (id: number) => {
  try {
    const blob = await invoiceService.getPdf(id);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `facture-${id}.pdf`;
    a.click();
  } catch (error) {
    toast.error('Erreur téléchargement PDF');
  }
};

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-3xl font-bold mb-6">Gestion des factures</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Total factures</p>
          <p className="text-2xl font-bold">{stats.totalInvoices}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Total encaissé</p>
          <p className="text-2xl font-bold">{stats.totalPaid.toLocaleString()} FCFA</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Total impayé</p>
          <p className="text-2xl font-bold">{stats.totalUnpaid.toLocaleString()} FCFA</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Montant moyen</p>
          <p className="text-2xl font-bold">{stats.averageAmount.toLocaleString()} FCFA</p>
        </div>
      </div>

      {/* Filtres et actions */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              placeholder="Rechercher par n° facture, client..."
              onChange={(e) => debouncedSearch(e.target.value)}
              className="w-full border border-gray-300 rounded-md pl-10 pr-4 py-2"
            />
            <FiSearch className="absolute left-3 top-3 text-gray-400" />
          </div>
          <div className="flex items-center gap-2">
            <FiFilter className="text-gray-500" />
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="">Tous les statuts</option>
              <option value="draft">En attente</option>
              <option value="paid">Payée</option>
              <option value="cancelled">Annulée</option>
            </select>
          </div>
          <button
            onClick={handleExport}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex items-center ml-auto"
          >
            <FiDownload className="mr-2" /> Exporter CSV
          </button>
          {(user?.role === 'cashier' || user?.role === 'admin') && (
            <Link to="/invoices/new" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
              Nouvelle facture
            </Link>
          )}
        </div>
      </div>

      {/* Tableau */}
      {loading ? (
        <p>Chargement...</p>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">N° Facture</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Montant</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payé</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {invoices.map((invoice) => {
                  const paid = getPaidAmount(invoice);
                  return (
                    <tr key={invoice.id}>
                      <td className="px-6 py-4 whitespace-nowrap font-mono">{invoice.number}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{invoice.client?.name || 'N/A'}</div>
                        <div className="text-sm text-gray-500">CLI{invoice.client?.id || ''}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{new Date(invoice.createdAt).toLocaleDateString('fr-FR')} {new Date(invoice.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{invoice.total.toLocaleString()} FCFA</td>
                      <td className="px-6 py-4 whitespace-nowrap">{paid.toLocaleString()} FCFA</td>
                      <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(invoice.status)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
  <Link to={`/invoices/${invoice.id}`} className="text-indigo-600 hover:text-indigo-900 mr-3" title="Voir">
    <FiEye className="inline" />
  </Link>
  <button
    onClick={() => handleDownloadPdf(invoice.id)}
    className="text-purple-600 hover:text-purple-900 mr-3"
    title="Télécharger PDF"
  >
    <FiDownload className="inline" />
  </button>
  {invoice.status === 'draft' && (user?.role === 'cashier' || user?.role === 'admin') && (
    <Link to={`/invoices/edit/${invoice.id}`} className="text-yellow-600 hover:text-yellow-900 mr-3" title="Modifier">
      <FiEdit className="inline" />
    </Link>
  )}
  {invoice.status === 'draft' && user?.role === 'admin' && (
    <button onClick={() => handleCancel(invoice.id)} className="text-red-600 hover:text-red-900" title="Annuler">
      <FiTrash2 className="inline" />
    </button>
  )}
</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex justify-center mt-4 space-x-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
            >
              Précédent
            </button>
            <span className="px-3 py-1">Page {page} / {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
            >
              Suivant
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default Invoices;