import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { clientService, Client } from '../services/clientService';
import { invoiceService } from '../services/invoiceService';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { FiSearch, FiDownload, FiEye, FiEdit, FiTrash2 } from 'react-icons/fi';
import debounce from 'lodash/debounce';
import { exportToCSV } from '../services/exportService';

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
      const filtered = data.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        (c.email && c.email.toLowerCase().includes(search.toLowerCase())) ||
        (c.phone && c.phone.includes(search))
      );
      setTotalPages(Math.ceil(filtered.length / limit));
      const start = (page - 1) * limit;
      setClients(filtered.slice(start, start + limit));
    } catch (error) {
      console.error(error);
      toast.error('Erreur chargement clients');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  const fetchStats = useCallback(async () => {
    try {
      const invoices = await invoiceService.getAll();
      const map = new Map();
      invoices.forEach(inv => {
        if (inv.clientId) {
          const current = map.get(inv.clientId) || { totalSpent: 0, invoiceCount: 0 };
          map.set(inv.clientId, {
            totalSpent: current.totalSpent + inv.total,
            invoiceCount: current.invoiceCount + 1,
          });
        }
      });
      setClientStats(map);
    } catch (error) {
      console.error(error);
    }
  }, []);

  useEffect(() => {
    fetchClients();
    fetchStats();
  }, [fetchClients, fetchStats]);

  const debouncedSearch = useCallback(debounce((value: string) => { setSearch(value); setPage(1); }, 500), []);

  const handleDelete = async (id: number) => {
    if (!window.confirm('Supprimer ce client ?')) return;
    try {
      await clientService.delete(id);
      toast.success('Client supprimé');
      fetchClients();
      fetchStats();
    } catch (error) {
      toast.error('Erreur suppression');
    }
  };

  const handleExport = async () => {
    try {
      const all = await clientService.getAll();
      const data = all.map(c => ({
        'Code client': `CLI${c.id}`,
        'Nom': c.name,
        'Email': c.email || '',
        'Téléphone': c.phone || '',
        'Adresse': c.address || '',
        'Date inscription': new Date(c.createdAt).toLocaleDateString('fr-FR'),
      }));
      await exportToCSV(data, 'clients');
      toast.success('Export réussi');
    } catch (error) {
      toast.error('Erreur export');
    }
  };

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
        <h1 className="text-2xl font-bold">Clients</h1>
        <div className="flex flex-wrap gap-2">
          <button onClick={handleExport} className="bg-green-600 text-white px-3 py-1 rounded flex items-center gap-1 text-sm">
            <FiDownload /> CSV
          </button>
          {(user?.role === 'cashier' || user?.role === 'admin') && (
            <Link to="/clients/new" className="bg-blue-600 text-white px-3 py-1 rounded text-sm">+ Nouveau</Link>
          )}
        </div>
      </div>

      <div className="mb-4">
        <div className="relative max-w-md">
          <input
            type="text"
            placeholder="Rechercher..."
            onChange={(e) => debouncedSearch(e.target.value)}
            className="w-full border rounded-md pl-10 pr-4 py-2"
          />
          <FiSearch className="absolute left-3 top-3 text-gray-400" />
        </div>
      </div>

      {loading ? (
        <p>Chargement...</p>
      ) : (
        <>
          <div className="overflow-x-auto bg-white rounded-lg shadow">
            <table className="min-w-[800px] w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-2 text-left">Code</th>
                  <th className="p-2 text-left">Nom</th>
                  <th className="p-2 text-left">Email</th>
                  <th className="p-2 text-left">Tél.</th>
                  <th className="p-2 text-right">Total achats</th>
                  <th className="p-2 text-left">Inscription</th>
                  <th className="p-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {clients.map(client => {
                  const stats = clientStats.get(client.id) || { totalSpent: 0 };
                  return (
                    <tr key={client.id} className="border-t">
                      <td className="p-2">CLI{client.id}</td>
                      <td className="p-2 font-medium">{client.name}</td>
                      <td className="p-2">{client.email || '-'}</td>
                      <td className="p-2">{client.phone || '-'}</td>
                      <td className="p-2 text-right">{stats.totalSpent.toLocaleString()} FCFA</td>
                      <td className="p-2">{new Date(client.createdAt).toLocaleDateString()}</td>
                      <td className="p-2 flex gap-2">
                        <Link to={`/clients/${client.id}`} title="Voir"><FiEye className="text-indigo-600" /></Link>
                        {(user?.role === 'cashier' || user?.role === 'admin') && (
                          <>
                            <Link to={`/clients/edit/${client.id}`} title="Modifier"><FiEdit className="text-yellow-600" /></Link>
                            <button onClick={() => handleDelete(client.id)} title="Supprimer"><FiTrash2 className="text-red-600" /></button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex justify-center mt-4 gap-2">
            <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1} className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50">Précédent</button>
            <span className="px-3 py-1">Page {page} / {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page === totalPages} className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50">Suivant</button>
          </div>
        </>
      )}
    </div>
  );
};

export default Clients;