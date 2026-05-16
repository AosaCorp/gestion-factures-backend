import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import { FiCopy, FiTrash2, FiKey, FiCheck } from 'react-icons/fi';

interface ApiKey {
  id: number;
  name: string;
  key?: string;
  status: 'active' | 'disabled' | 'expired';
  lastUsedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
}

const ApiKeys: React.FC = () => {
  const { user } = useAuth();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewKeyForm, setShowNewKeyForm] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyExpiresDays, setNewKeyExpiresDays] = useState(365);
  const [newGeneratedKey, setNewGeneratedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchApiKeys();
  }, []);

  const fetchApiKeys = async () => {
    try {
      // Correction: utiliser la bonne URL (sans /api supplémentaire)
      const response = await api.get('/v1/keys');
      setApiKeys(response.data);
    } catch (error: any) {
      console.error('Erreur chargement clés API', error);
      if (error.response?.status === 404) {
        toast.error('Route API non trouvée. Vérifiez la configuration du backend.');
      } else {
        toast.error('Erreur lors du chargement des clés API');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateKey = async () => {
    if (!newKeyName.trim()) {
      toast.error('Veuillez entrer un nom pour la clé');
      return;
    }

    try {
      // Correction: utiliser la bonne URL (sans /api supplémentaire)
      const response = await api.post('/v1/keys', {
        name: newKeyName,
        expiresInDays: newKeyExpiresDays
      });
      
      setNewGeneratedKey(response.data.key);
      setNewKeyName('');
      setShowNewKeyForm(false);
      fetchApiKeys();
      toast.success('Clé API créée avec succès');
    } catch (error: any) {
      console.error('Erreur création clé', error);
      if (error.response?.status === 401) {
        toast.error('Non autorisé. Vérifiez votre session.');
      } else if (error.response?.status === 403) {
        toast.error('Permission refusée. Seuls les administrateurs peuvent créer des clés.');
      } else {
        toast.error(error.response?.data?.error || 'Erreur lors de la création');
      }
    }
  };

  const handleRevokeKey = async (id: number, name: string) => {
    if (window.confirm(`Révoquer la clé "${name}" ? Cette action est irréversible.`)) {
      try {
        await api.post(`/v1/keys/${id}/revoke`);
        toast.success('Clé révoquée');
        fetchApiKeys();
      } catch (error) {
        toast.error('Erreur lors de la révocation');
      }
    }
  };

  const handleDeleteKey = async (id: number, name: string) => {
    if (window.confirm(`Supprimer définitivement la clé "${name}" ?`)) {
      try {
        await api.delete(`/v1/keys/${id}`);
        toast.success('Clé supprimée');
        fetchApiKeys();
      } catch (error) {
        toast.error('Erreur lors de la suppression');
      }
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
    toast.success('Clé copiée dans le presse-papier');
  };

  if (user?.role !== 'admin') {
    return (
      <div className="p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          Accès non autorisé. Seuls les administrateurs peuvent gérer les clés API.
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">Clés API</h1>
        <button
          onClick={() => setShowNewKeyForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center gap-2"
        >
          <FiKey /> Nouvelle clé
        </button>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h2 className="font-semibold text-blue-800 mb-2">📖 Documentation API</h2>
        <p className="text-sm text-blue-700 mb-2">
          L'API publique permet à vos applications de communiquer avec le système de facturation.
        </p>
        <div className="bg-white rounded p-3 text-sm font-mono">
          <div>Base URL: <span className="text-blue-600">https://gestion-factures-backend-mvdn.onrender.com/api/v1</span></div>
          <div className="mt-2">Authentification: <span className="text-green-600">X-API-Key: votre_clé_api</span></div>
        </div>
        <div className="mt-3 text-sm">
          <p className="font-medium">Endpoints disponibles :</p>
          <ul className="list-disc list-inside text-xs space-y-1 mt-1">
            <li><code className="bg-gray-100 px-1 rounded">GET /clients</code> - Liste des clients</li>
            <li><code className="bg-gray-100 px-1 rounded">GET /products</code> - Liste des produits</li>
            <li><code className="bg-gray-100 px-1 rounded">GET /invoices</code> - Liste des factures</li>
            <li><code className="bg-gray-100 px-1 rounded">POST /invoices</code> - Créer une facture</li>
            <li><code className="bg-gray-100 px-1 rounded">GET /stats</code> - Statistiques</li>
          </ul>
        </div>
      </div>

      {showNewKeyForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-semibold mb-4">Créer une nouvelle clé API</h2>
            {newGeneratedKey ? (
              <div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                  <p className="text-green-800 font-medium mb-2">✅ Clé générée avec succès !</p>
                  <p className="text-sm text-gray-600 mb-2">Copiez cette clé maintenant. Elle ne sera plus jamais affichée.</p>
                  <div className="flex items-center gap-2 bg-gray-100 p-3 rounded">
                    <code className="text-sm font-mono break-all flex-1">{newGeneratedKey}</code>
                    <button
                      onClick={() => copyToClipboard(newGeneratedKey)}
                      className="p-2 hover:bg-gray-200 rounded"
                      title="Copier"
                    >
                      {copied ? <FiCheck className="text-green-600" /> : <FiCopy />}
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => setNewGeneratedKey(null)}
                  className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
                >
                  Fermer
                </button>
              </div>
            ) : (
              <>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Nom de la clé</label>
                  <input
                    type="text"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    placeholder="Ex: Mon application mobile"
                    className="w-full border rounded-md p-2"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Validité</label>
                  <select
                    value={newKeyExpiresDays}
                    onChange={(e) => setNewKeyExpiresDays(parseInt(e.target.value))}
                    className="w-full border rounded-md p-2"
                  >
                    <option value={30}>30 jours</option>
                    <option value={90}>90 jours</option>
                    <option value={180}>180 jours</option>
                    <option value={365}>1 an</option>
                    <option value={0}>Jamais (non recommandé)</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleCreateKey}
                    className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
                  >
                    Générer
                  </button>
                  <button
                    onClick={() => setShowNewKeyForm(false)}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 rounded hover:bg-gray-400"
                  >
                    Annuler
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-center py-10">Chargement...</p>
      ) : apiKeys.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <FiKey className="text-gray-400 text-4xl mx-auto mb-3" />
          <p className="text-gray-500">Aucune clé API créée</p>
          <p className="text-sm text-gray-400 mt-1">Créez une clé pour permettre à des applications externes d'accéder à l'API</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nom</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Créée le</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dernière utilisation</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {apiKeys.map((key) => (
                <tr key={key.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">{key.name}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      key.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {key.status === 'active' ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                  <td className="px-6 py-4">{new Date(key.createdAt).toLocaleDateString('fr-FR')}</td>
                  <td className="px-6 py-4">{key.lastUsedAt ? new Date(key.lastUsedAt).toLocaleDateString('fr-FR') : 'Jamais'}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleRevokeKey(key.id, key.name)}
                        className="text-yellow-600 hover:text-yellow-800"
                        title="Révoquer"
                      >
                        <FiKey />
                      </button>
                      <button
                        onClick={() => handleDeleteKey(key.id, key.name)}
                        className="text-red-600 hover:text-red-800"
                        title="Supprimer"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ApiKeys;