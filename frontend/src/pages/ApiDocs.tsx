import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { FiExternalLink, FiFileText, FiKey, FiShield } from 'react-icons/fi';

const ApiDocs: React.FC = () => {
  const { user } = useAuth();
  const [apiUrl, setApiUrl] = useState('');

  useEffect(() => {
    // Récupérer l'URL de l'API depuis l'environnement ou l'URL courante
    const backendUrl = import.meta.env.VITE_API_URL || 'https://gestion-factures-backend-mvdn.onrender.com';
    setApiUrl(backendUrl);
  }, []);

  const openSwaggerUI = () => {
    window.open(`${apiUrl}/api-docs`, '_blank');
  };

  const openSwaggerJson = () => {
    window.open(`${apiUrl}/api-docs.json`, '_blank');
  };

  if (user?.role !== 'admin') {
    return (
      <div className="p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          Accès non autorisé. Seuls les administrateurs peuvent accéder à la documentation API.
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
          <FiFileText className="text-blue-600" /> Documentation API
        </h1>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h2 className="font-semibold text-blue-800 mb-2">📚 Documentation interactive</h2>
        <p className="text-sm text-blue-700 mb-4">
          Swagger UI permet d'explorer et de tester interactivement toutes les routes de l'API.
        </p>
        <div className="flex gap-3">
          <button
            onClick={openSwaggerUI}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center gap-2"
          >
            <FiExternalLink /> Ouvrir Swagger UI
          </button>
          <button
            onClick={openSwaggerJson}
            className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 flex items-center gap-2"
          >
            <FiFileText /> Voir spécification JSON
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Authentification */}
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
            <FiKey className="text-yellow-600" /> Authentification
          </h3>
          <div className="space-y-3 text-sm">
            <div>
              <p className="font-medium text-gray-700">JWT Token (API interne)</p>
              <code className="block bg-gray-100 p-2 rounded text-xs mt-1">
                Authorization: Bearer &lt;votre_token_jwt&gt;
              </code>
            </div>
            <div>
              <p className="font-medium text-gray-700">Clé API (API publique)</p>
              <code className="block bg-gray-100 p-2 rounded text-xs mt-1">
                X-API-Key: &lt;votre_clé_api&gt;
              </code>
            </div>
          </div>
        </div>

        {/* Rate Limiting */}
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
            <FiShield className="text-green-600" /> Rate Limiting
          </h3>
          <div className="space-y-2 text-sm">
            <p><span className="font-medium">API générale:</span> 100 requêtes / 15 minutes</p>
            <p><span className="font-medium">Authentification:</span> 5 tentatives / 15 minutes</p>
            <p><span className="font-medium">API publique:</span> 30 requêtes / minute</p>
            <p><span className="font-medium">Webhooks:</span> 100 requêtes / heure</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <h3 className="font-semibold text-lg p-4 border-b">📖 Endpoints disponibles</h3>
        <div className="divide-y divide-gray-200">
          <div className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded text-xs font-mono">GET</span>
              <code className="text-sm">/api/clients</code>
            </div>
            <p className="text-sm text-gray-600 ml-2">Récupère la liste des clients (paginé, avec recherche)</p>
          </div>
          <div className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs font-mono">POST</span>
              <code className="text-sm">/api/clients</code>
            </div>
            <p className="text-sm text-gray-600 ml-2">Crée un nouveau client</p>
          </div>
          <div className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded text-xs font-mono">GET</span>
              <code className="text-sm">/api/products</code>
            </div>
            <p className="text-sm text-gray-600 ml-2">Récupère la liste des produits</p>
          </div>
          <div className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded text-xs font-mono">GET</span>
              <code className="text-sm">/api/invoices</code>
            </div>
            <p className="text-sm text-gray-600 ml-2">Récupère la liste des factures</p>
          </div>
          <div className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs font-mono">POST</span>
              <code className="text-sm">/api/invoices</code>
            </div>
            <p className="text-sm text-gray-600 ml-2">Crée une nouvelle facture</p>
          </div>
          <div className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded text-xs font-mono">GET</span>
              <code className="text-sm">/api/stats</code>
            </div>
            <p className="text-sm text-gray-600 ml-2">Récupère les statistiques globales</p>
          </div>
          <div className="p-4 bg-gray-50">
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-orange-100 text-orange-800 px-2 py-0.5 rounded text-xs font-mono">API Publique</span>
              <code className="text-sm">/api/v1/*</code>
            </div>
            <p className="text-sm text-gray-600 ml-2">Tous les endpoints préfixés par /api/v1/ nécessitent une clé API</p>
          </div>
        </div>
      </div>

      <div className="mt-6 text-center text-sm text-gray-500">
        <p>La documentation complète est disponible via Swagger UI.</p>
        <p className="mt-1">Cliquez sur "Ouvrir Swagger UI" pour tester les endpoints interactivement.</p>
      </div>
    </div>
  );
};

export default ApiDocs;