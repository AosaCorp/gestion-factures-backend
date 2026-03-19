import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { clientService, Client } from '../services/clientService';
import { invoiceService } from '../services/invoiceService';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { FiSearch, FiDownload, FiEye, FiEdit, FiTrash2 } from 'react-icons/fi';
import debounce from 'lodash/debounce';
import Papa from 'papaparse';

const Clients: React.FC = () => {
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [clientStats, setClientStats] = useState<Map<number, { totalSpent: number; invoiceCount: number }>>(new Map());
  const limit = 10;

  const fetchClients = useCallback(async () => {
    try {
      setLoading(true);
      const data = await clientService.getAll();
      // Filtrer par recherche
      const filtered = data.filter(c => 
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        (c.email && c.email.toLowerCase().includes(search.toLowerCase())) ||
        (c.phone && c.phone.includes(search))
      );
      // Pagination
      const start = (page - 1) * limit;
      const paginated = filtered.slice(start, start + limit);
      setClients(paginated);
      setTotalPages(Math.ceil(filtered.length / limit));
    } catch (error) {
      console.error('Erreur chargement clients', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  const fetchStats = useCallback(async () => {
    try {
      const invoices = await invoiceService.getAll();
      const statsMap = new Map<number, { totalSpent: number; invoiceCount: number }>();
      invoices.forEach(inv => {
        if (inv.clientId) {
          const current = statsMap.get(inv.clientId) || { totalSpent: 0, invoiceCount: 0 };
          statsMap.set(inv.clientId, {
            totalSpent: current.totalSpent + inv.total,
            invoiceCount: current.invoiceCount + 1
          });
        }
      });
      setClientStats(statsMap);
    } catch (error) {
      console.error('Erreur chargement statistiques clients', error);
    }
  }, []);

  useEffect(() => {
    fetchClients();
    fetchStats();
  }, [fetchClients, fetchStats]);

  const debouncedSearch = useCallback(
    debounce((value: string) => {
      setSearch(value);
      setPage(1);
    }, 500),
    []
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    debouncedSearch(e.target.value);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Supprimer ce client ?')) {
      try {
        await clientService.delete(id);
        toast.success('Client supprimé');
        fetchClients();
        fetchStats();
      } catch (error) {
        console.error('Erreur suppression', error);
        toast.error('Erreur lors de la suppression');
      }
    }
  };

  const handleExport = async () => {
    try {
      const allClients = await clientService.getAll();
      const dataForExport = allClients.map(c => {
        const stats = clientStats.get(c.id) || { totalSpent: 0, invoiceCount: 0 };
        return {
          'Code client': `CLI${c.id}`,
          'Nom & Prénom': c.name,
          'Email': c.email || '',
          'Téléphone': c.phone || '',
          'Total achats (FCFA)': stats.totalSpent,
          'Nombre factures': stats.invoiceCount,
          'Date inscription': new Date(c.createdAt).toLocaleDateString('fr-FR')
        };
      });
      const csv = Papa.unparse(dataForExport);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.href = url;
      link.setAttribute('download', 'clients.csv');
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

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-3xl font-bold mb-6">Gestion des clients</h1>

      {/* Barre de recherche et boutons */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              placeholder="Rechercher par nom, email, téléphone..."
              onChange={handleSearchChange}
              className="w-full border border-gray-300 rounded-md pl-10 pr-4 py-2"
            />
            <FiSearch className="absolute left-3 top-3 text-gray-400" />
          </div>
          <button
            onClick={handleExport}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex items-center ml-auto"
          >
            <FiDownload className="mr-2" /> Exporter CSV
          </button>
          {(user?.role === 'cashier' || user?.role === 'admin') && (
            <Link to="/clients/new" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
              Nouveau client
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code client</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nom & Prénom</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Téléphone</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total achats</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date inscription</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {clients.map(client => {
                  const stats = clientStats.get(client.id) || { totalSpent: 0, invoiceCount: 0 };
                  return (
                    <tr key={client.id}>
                      <td className="px-6 py-4 whitespace-nowrap font-mono text-sm">CLI{client.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap font-medium">{client.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{client.email || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{client.phone || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{stats.totalSpent.toLocaleString()} FCFA</td>
                      <td className="px-6 py-4 whitespace-nowrap">{new Date(client.createdAt).toLocaleDateString('fr-FR')}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Link to={`/clients/${client.id}`} className="text-indigo-600 hover:text-indigo-900 mr-3" title="Voir">
                          <FiEye className="inline" />
                        </Link>
                        {(user?.role === 'cashier' || user?.role === 'admin') && (
                          <>
                            <Link to={`/clients/edit/${client.id}`} className="text-yellow-600 hover:text-yellow-900 mr-3" title="Modifier">
                              <FiEdit className="inline" />
                            </Link>
                            <button onClick={() => handleDelete(client.id)} className="text-red-600 hover:text-red-900" title="Supprimer">
                              <FiTrash2 className="inline" />
                            </button>
                          </>
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

export default Clients;