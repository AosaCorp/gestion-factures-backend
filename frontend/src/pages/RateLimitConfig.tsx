import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import { FiShield, FiSave, FiRefreshCw } from 'react-icons/fi';

interface RateLimitConfig {
  id: number;
  name: string;
  windowMs: number;
  max: number;
  enabled: boolean;
  description: string;
}

const RateLimitConfigPage: React.FC = () => {
  const { user } = useAuth();
  const [configs, setConfigs] = useState<RateLimitConfig[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<number | null>(null);

  useEffect(() => {
    fetchConfigs();
    fetchStats();
  }, []);

  const fetchConfigs = async () => {
    try {
      const response = await api.get('/rate-limit');
      setConfigs(response.data);
    } catch (error) {
      console.error('Erreur chargement configs', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/rate-limit/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Erreur chargement stats', error);
    }
  };

  const handleUpdate = async (id: number, windowMs: number, max: number, enabled: boolean) => {
    setSaving(id);
    try {
      await api.put(`/rate-limit/${id}`, { windowMs, max, enabled });
      toast.success('Configuration mise à jour');
      fetchConfigs();
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setSaving(null);
    }
  };

  const formatWindow = (ms: number): string => {
    const minutes = ms / 1000 / 60;
    if (minutes >= 60) {
      return `${minutes / 60} heure(s)`;
    }
    if (minutes >= 1) {
      return `${minutes} minute(s)`;
    }
    return `${ms / 1000} seconde(s)`;
  };

  if (user?.role !== 'admin') {
    return (
      <div className="p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          Accès non autorisé. Seuls les administrateurs peuvent configurer le rate limiting.
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
          <FiShield className="text-blue-600" /> Rate Limiting
        </h1>
        <button
          onClick={() => { fetchConfigs(); fetchStats(); }}
          className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 flex items-center gap-2"
        >
          <FiRefreshCw /> Rafraîchir
        </button>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h2 className="font-semibold text-blue-800 mb-2">🛡️ Protection anti-abus</h2>
        <p className="text-sm text-blue-700">
          Le rate limiting protège votre API contre les attaques par force brute et les requêtes excessives.
          Chaque limite est configurable individuellement.
        </p>
      </div>

      {/* Statistiques */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Limites actives</p>
            <p className="text-2xl font-bold">{stats.limits?.length || 0}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Protection</p>
            <p className="text-2xl font-bold text-green-600">Active</p>
          </div>
        </div>
      )}

      {/* Liste des configurations */}
      {loading ? (
        <p className="text-center py-10">Chargement...</p>
      ) : (
        <div className="space-y-4">
          {stats?.limits?.map((limit: any, index: number) => (
            <div key={index} className="bg-white rounded-lg shadow p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-lg">{limit.name}</h3>
                  <p className="text-sm text-gray-500">
                    Fenêtre: {limit.window} | Max: {limit.max} requêtes
                  </p>
                </div>
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                  Actif
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: '75%' }} />
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Protection contre les abus et les attaques DDoS
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Documentation */}
      <div className="mt-8 bg-gray-50 rounded-lg p-4">
        <h3 className="font-semibold mb-2">📖 En-têtes de réponse</h3>
        <div className="text-sm text-gray-600 space-y-1">
          <p><code className="bg-gray-200 px-1 rounded">X-RateLimit-Limit</code> - Nombre maximum de requêtes</p>
          <p><code className="bg-gray-200 px-1 rounded">X-RateLimit-Remaining</code> - Requêtes restantes</p>
          <p><code className="bg-gray-200 px-1 rounded">X-RateLimit-Reset</code> - Temps avant réinitialisation</p>
          <p><code className="bg-gray-200 px-1 rounded">Retry-After</code> - Temps d'attente recommandé</p>
        </div>
      </div>
    </div>
  );
};

export default RateLimitConfigPage;