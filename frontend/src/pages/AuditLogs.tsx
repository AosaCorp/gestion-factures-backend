import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import { 
  FiFilter, FiCalendar, FiTrash2, FiRefreshCw, 
  FiDownload, FiFileText, FiFile, FiCode 
} from 'react-icons/fi';

interface Log {
  id: number;
  action: string;
  entityType: string;
  entityId: number;
  details: any;
  ip: string;
  userAgent: string;
  userId: number;
  createdAt: string;
  user?: { id: number; name: string; email: string };
}

const AuditLogs: React.FC = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [exporting, setExporting] = useState<'csv' | 'json' | 'html' | null>(null);
  const [filters, setFilters] = useState({
    action: '',
    entityType: '',
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    fetchLogs();
    fetchStats();
  }, [page, filters]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', '50');
      if (filters.action) params.append('action', filters.action);
      if (filters.entityType) params.append('entityType', filters.entityType);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      
      const response = await api.get(`/logs?${params.toString()}`);
      setLogs(response.data.data);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      console.error('Erreur chargement logs', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/logs/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Erreur chargement stats', error);
    }
  };

  const handleCleanLogs = async () => {
    const days = prompt('Supprimer les logs de plus de combien de jours ?', '30');
    if (days && confirm(`Supprimer les logs de plus de ${days} jours ?`)) {
      try {
        await api.delete(`/logs/clean?days=${days}`);
        toast.success('Logs nettoyés');
        fetchLogs();
        fetchStats();
      } catch (error) {
        toast.error('Erreur lors du nettoyage');
      }
    }
  };

  const handleDeleteLog = async (id: number) => {
    if (confirm('Supprimer ce log ?')) {
      try {
        await api.delete(`/logs/${id}`);
        toast.success('Log supprimé');
        fetchLogs();
        fetchStats();
      } catch (error) {
        toast.error('Erreur lors de la suppression');
      }
    }
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      CREATE_CLIENT: '➕ Création client',
      UPDATE_CLIENT: '✏️ Modification client',
      DELETE_CLIENT: '🗑️ Suppression client',
      CREATE_PRODUCT: '➕ Création produit',
      UPDATE_PRODUCT: '✏️ Modification produit',
      DELETE_PRODUCT: '🗑️ Suppression produit',
      CREATE_INVOICE: '📄 Création facture',
      UPDATE_INVOICE: '✏️ Modification facture',
      CANCEL_INVOICE: '❌ Annulation facture',
      CREATE_PAYMENT: '💵 Paiement',
      LOGIN: '🔑 Connexion',
      LOGOUT: '🚪 Déconnexion'
    };
    return labels[action] || action;
  };
  
  const handleExport = async (format: 'csv' | 'json' | 'html') => {
    setExporting(format);
    try {
      const params = new URLSearchParams();
      if (filters.action) params.append('action', filters.action);
      if (filters.entityType) params.append('entityType', filters.entityType);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      
      const response = await api.get(`/logs/export/${format}?${params.toString()}`, {
        responseType: 'blob'
      });
      
      // Créer un lien de téléchargement
      const url = window.URL.createObjectURL(response.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `logs_audit.${format === 'csv' ? 'csv' : format === 'json' ? 'json' : 'html'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast.success(`Export ${format.toUpperCase()} réussi`);
    } catch (error) {
      console.error('Erreur export', error);
      toast.error('Erreur lors de l\'export');
    } finally {
      setExporting(null);
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          Accès non autorisé. Seuls les administrateurs peuvent consulter les logs.
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      <div className="flex justify-between items-center mb-6 flex-wrap gap-2">
        <h1 className="text-2xl md:text-3xl font-bold">Journal d'audit</h1>
        <div className="flex gap-2">
          <div className="relative group">
            <button className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex items-center gap-2">
              <FiDownload /> Export
            </button>
            <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg hidden group-hover:block z-10">
              <button
                onClick={() => handleExport('csv')}
                disabled={exporting === 'csv'}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 rounded-t-lg flex items-center gap-2 disabled:opacity-50"
              >
                <FiFileText /> CSV
              </button>
              <button
                onClick={() => handleExport('json')}
                disabled={exporting === 'json'}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2 disabled:opacity-50"
              >
                <FiCode /> JSON
              </button>
              <button
                onClick={() => handleExport('html')}
                disabled={exporting === 'html'}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 rounded-b-lg flex items-center gap-2 disabled:opacity-50"
              >
                <FiFile /> HTML
              </button>
            </div>
          </div>
          <button
            onClick={handleCleanLogs}
            className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700 flex items-center gap-2"
          >
            <FiTrash2 /> Nettoyer
          </button>
          <button
            onClick={() => { fetchLogs(); fetchStats(); }}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center gap-2"
          >
            <FiRefreshCw /> Rafraîchir
          </button>
        </div>
      </div>

      {/* Statistiques */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Total logs</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Aujourd'hui</p>
            <p className="text-2xl font-bold">{stats.todayCount}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 col-span-2">
            <p className="text-sm text-gray-500 mb-2">Actions fréquentes</p>
            <div className="flex flex-wrap gap-2">
              {stats.actions?.slice(0, 3).map((a: any) => (
                <span key={a.action} className="text-xs bg-gray-100 px-2 py-1 rounded">
                  {getActionLabel(a.action)} ({a.count})
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Filtres */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-sm font-medium mb-1">Action</label>
            <select
              value={filters.action}
              onChange={(e) => setFilters({ ...filters, action: e.target.value })}
              className="border rounded-md p-2 text-sm"
            >
              <option value="">Toutes</option>
              <option value="CREATE_CLIENT">Création client</option>
              <option value="UPDATE_CLIENT">Modification client</option>
              <option value="DELETE_CLIENT">Suppression client</option>
              <option value="CREATE_INVOICE">Création facture</option>
              <option value="CREATE_PAYMENT">Paiement</option>
              <option value="LOGIN">Connexion</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Entité</label>
            <select
              value={filters.entityType}
              onChange={(e) => setFilters({ ...filters, entityType: e.target.value })}
              className="border rounded-md p-2 text-sm"
            >
              <option value="">Toutes</option>
              <option value="client">Client</option>
              <option value="product">Produit</option>
              <option value="invoice">Facture</option>
              <option value="payment">Paiement</option>
              <option value="user">Utilisateur</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Date début</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              className="border rounded-md p-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Date fin</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              className="border rounded-md p-2 text-sm"
            />
          </div>
          <button
            onClick={() => setFilters({ action: '', entityType: '', startDate: '', endDate: '' })}
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
          >
            Réinitialiser
          </button>
        </div>
      </div>

      {/* Tableau des logs */}
      {loading ? (
        <p className="text-center py-10">Chargement...</p>
      ) : logs.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500">Aucun log trouvé</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left">Date/heure</th>
                  <th className="px-4 py-3 text-left">Action</th>
                  <th className="px-4 py-3 text-left">Entité</th>
                  <th className="px-4 py-3 text-left">Utilisateur</th>
                  <th className="px-4 py-3 text-left">IP</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString('fr-FR')}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {getActionLabel(log.action)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {log.entityType} #{log.entityId}
                    </td>
                    <td className="px-4 py-3">
                      {log.user?.name || 'Système'}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">
                      {log.ip || '-'}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleDeleteLog(log.id)}
                        className="text-red-600 hover:text-red-800"
                        title="Supprimer"
                      >
                        <FiTrash2 />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {totalPages > 1 && (
            <div className="flex justify-center mt-4 gap-2">
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

export default AuditLogs;