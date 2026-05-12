import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { clientService, Client } from '../services/clientService';
import { useAuth } from '../contexts/AuthContext';
import { useOffline } from '../contexts/OfflineContext';
import { useDataCache } from '../contexts/DataCacheContext';
import toast from 'react-hot-toast';
import { FiSearch, FiDownload, FiEye, FiEdit, FiTrash2 } from 'react-icons/fi';
import debounce from 'lodash/debounce';
import { exportToCSV } from '../services/exportService';

const Clients: React.FC = () => {
  const { user } = useAuth();
  const { isOffline } = useOffline();
  const { cachedClients, refreshCache, isLoadingCache } = useDataCache();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const limit = 10;

  const fetchClients = useCallback(async () => {
    if (!navigator.onLine) {
      if (cachedClients.length > 0) {
        setClients(cachedClients);
        setTotalPages(Math.ceil(cachedClients.length / limit));
        setError('');
      } else {
        setError('Mode hors ligne - Aucune donnée client en cache');
      }
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await clientService.getPaginated(page, limit, search);
      setClients(response.data);
      setTotalPages(response.totalPages);
      setError('');
      if (response.data.length > 0) {
        const allClients = await clientService.getAll();
        localStorage.setItem('cached_clients', JSON.stringify(allClients));
      }
    } catch (error) {
      console.error('Erreur chargement clients', error);
      if (cachedClients.length > 0) {
        setClients(cachedClients);
        setError('Données du cache (hors ligne)');
      } else {
        setError('Erreur lors du chargement des clients');
      }
    } finally {
      setLoading(false);
    }
  }, [page, search, cachedClients]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  useEffect(() => {
    if (navigator.onLine) {
      refreshCache();
    }
  }, [navigator.onLine]);

  const debouncedSearch = useCallback(
    debounce((value: string) => {
      setSearch(value);
      setPage(1);
    }, 500),
    []
  );

  const handleDelete = async (id: number) => {
    if (window.confirm('Supprimer ce client ?')) {
      try {
        await clientService.delete(id);
        toast.success('Client supprimé');
        fetchClients();
        refreshCache();
      } catch (error) {
        toast.error('Erreur lors de la suppression');
      }
    }
  };

  const handleExport = async () => {
    try {
      const allClients = await clientService.getAll();
      const dataForExport = allClients.map(c => ({
        Nom: c.name,
        Email: c.email || '',
        Téléphone: c.phone || '',
        Adresse: c.address || '',
        'Date création': new Date(c.createdAt).toLocaleDateString('fr-FR')
      }));
      await exportToCSV(dataForExport, 'clients');
      toast.success('Export réussi');
    } catch (error: any) {
      toast.error(error.message || 'Erreur export');
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR');
  };

  return (
    <div className="p-4 md:p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">Clients</h1>
        {user?.role === 'admin' && (
          <Link to="/clients/new" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            + Nouveau
          </Link>
        )}
      </div>

      {isOffline && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-2 rounded mb-4 text-sm">
          📱 Mode hors ligne - Affichage des données en cache
        </div>
      )}

      {error && (
        <div className={`px-4 py-2 rounded mb-4 text-sm ${error.includes('hors ligne') ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[180px]">
            <input
              type="text"
              placeholder="Rechercher par nom, email..."
              onChange={(e) => debouncedSearch(e.target.value)}
              className="w-full border border-gray-300 rounded-md pl-10 pr-4 py-2 text-sm"
            />
            <FiSearch className="absolute left-3 top-3 text-gray-400" />
          </div>
          <button onClick={handleExport} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex items-center gap-1 text-sm">
            <FiDownload /> CSV
          </button>
        </div>
      </div>

      {loading || isLoadingCache ? (
        <p className="text-center py-10">Chargement...</p>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className="min-w-[800px] w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left">Code</th>
                  <th className="px-4 py-2 text-left">Nom</th>
                  <th className="px-4 py-2 text-left">Email</th>
                  <th className="px-4 py-2 text-left">Téléphone</th>
                  <th className="px-4 py-2 text-left">Adresse</th>
                  <th className="px-4 py-2 text-left">Inscription</th>
                  <th className="px-4 py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {clients.map(client => (
                  <tr key={client.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 font-mono">CLI{client.id}</td>
                    <td className="px-4 py-2 font-medium">{client.name}</td>
                    <td className="px-4 py-2">{client.email || '-'}</td>
                    <td className="px-4 py-2">{client.phone || '-'}</td>
                    <td className="px-4 py-2">{client.address || '-'}</td>
                    <td className="px-4 py-2">{formatDate(client.createdAt)}</td>
                    <td className="px-4 py-2">
                      <div className="flex gap-2">
                        <Link to={`/clients/${client.id}`} title="Voir" className="text-indigo-600 hover:text-indigo-800">
                          <FiEye className="w-5 h-5" />
                        </Link>
                        {user?.role === 'admin' && (
                          <>
                            <Link to={`/clients/edit/${client.id}`} title="Modifier" className="text-yellow-600 hover:text-yellow-800">
                              <FiEdit className="w-5 h-5" />
                            </Link>
                            <button onClick={() => handleDelete(client.id)} title="Supprimer" className="text-red-600 hover:text-red-800">
                              <FiTrash2 className="w-5 h-5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {totalPages > 1 && (
            <div className="flex justify-center mt-4 gap-2 text-sm">
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
          )}
        </>
      )}
    </div>
  );
};

export default Clients;