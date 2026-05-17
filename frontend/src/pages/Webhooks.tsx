import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import { FiPlus, FiTrash2, FiEdit2, FiSend, FiCheckCircle, FiXCircle } from 'react-icons/fi';

interface Webhook {
  id: number;
  name: string;
  url: string;
  secret?: string;
  events: string[];
  status: 'active' | 'inactive' | 'failed';
  lastTriggeredAt: string | null;
  lastError: string | null;
  createdAt: string;
}

interface Event {
  value: string;
  label: string;
}

const Webhooks: React.FC = () => {
  const { user } = useAuth();
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<Webhook | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    secret: '',
    events: ['invoice.created', 'invoice.paid', 'payment.received']
  });

  useEffect(() => {
    fetchWebhooks();
    fetchEvents();
  }, []);

  const fetchWebhooks = async () => {
    try {
      const response = await api.get('/webhooks');
      setWebhooks(response.data);
    } catch (error) {
      console.error('Erreur chargement webhooks', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const fetchEvents = async () => {
    try {
      const response = await api.get('/webhooks/events');
      setEvents(response.data);
    } catch (error) {
      console.error('Erreur chargement événements', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.url) {
      toast.error('Nom et URL requis');
      return;
    }
    
    try {
      if (editingWebhook) {
        await api.put(`/webhooks/${editingWebhook.id}`, formData);
        toast.success('Webhook modifié');
      } else {
        await api.post('/webhooks', formData);
        toast.success('Webhook créé');
      }
      setShowForm(false);
      setEditingWebhook(null);
      setFormData({ name: '', url: '', secret: '', events: ['invoice.created', 'invoice.paid', 'payment.received'] });
      fetchWebhooks();
    } catch (error) {
      console.error('Erreur sauvegarde', error);
      toast.error('Erreur lors de la sauvegarde');
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (confirm(`Supprimer le webhook "${name}" ?`)) {
      try {
        await api.delete(`/webhooks/${id}`);
        toast.success('Webhook supprimé');
        fetchWebhooks();
      } catch (error) {
        toast.error('Erreur lors de la suppression');
      }
    }
  };

  const handleTest = async (id: number, name: string) => {
    toast.loading(`Test de ${name}...`, { id: 'test' });
    try {
      await api.post(`/webhooks/${id}/test`);
      toast.success(`Webhook ${name} testé avec succès`, { id: 'test' });
    } catch (error: any) {
      toast.error(`Erreur: ${error.response?.data?.details || 'Échec du test'}`, { id: 'test' });
    }
  };

  const toggleEvent = (eventValue: string) => {
    setFormData(prev => ({
      ...prev,
      events: prev.events.includes(eventValue)
        ? prev.events.filter(e => e !== eventValue)
        : [...prev.events, eventValue]
    }));
  };

  const getEventLabel = (eventValue: string) => {
    const event = events.find(e => e.value === eventValue);
    return event ? event.label : eventValue;
  };

  const getStatusBadge = (status: string) => {
    if (status === 'active') return <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs flex items-center gap-1"><FiCheckCircle size={12} /> Actif</span>;
    if (status === 'inactive') return <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs flex items-center gap-1"><FiXCircle size={12} /> Inactif</span>;
    return <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs flex items-center gap-1"><FiXCircle size={12} /> Échec</span>;
  };

  if (user?.role !== 'admin') {
    return (
      <div className="p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          Accès non autorisé. Seuls les administrateurs peuvent gérer les webhooks.
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">Webhooks</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center gap-2"
        >
          <FiPlus /> Nouveau webhook
        </button>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h2 className="font-semibold text-blue-800 mb-2">📡 Qu'est-ce qu'un webhook ?</h2>
        <p className="text-sm text-blue-700">
          Les webhooks permettent d'envoyer des notifications en temps réel à vos applications externes 
          (Slack, Discord, serveur personnalisé) lors d'événements comme la création d'une facture ou un paiement.
        </p>
      </div>

      {/* Formulaire de création/modification */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">{editingWebhook ? 'Modifier' : 'Nouveau'} webhook</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nom *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Slack notifications"
                  className="w-full border rounded-md p-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">URL *</label>
                <input
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  placeholder="https://..."
                  className="w-full border rounded-md p-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Secret (optionnel)</label>
                <input
                  type="text"
                  value={formData.secret}
                  onChange={(e) => setFormData({ ...formData, secret: e.target.value })}
                  placeholder="Clé pour signer les requêtes"
                  className="w-full border rounded-md p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Événements</label>
                <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-3">
                  {events.map(event => (
                    <label key={event.value} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.events.includes(event.value)}
                        onChange={() => toggleEvent(event.value)}
                        className="rounded"
                      />
                      <span className="text-sm">{event.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 pt-4">
                <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
                  {editingWebhook ? 'Modifier' : 'Créer'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingWebhook(null);
                    setFormData({ name: '', url: '', secret: '', events: ['invoice.created', 'invoice.paid', 'payment.received'] });
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded hover:bg-gray-400"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Liste des webhooks */}
      {loading ? (
        <p className="text-center py-10">Chargement...</p>
      ) : webhooks.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500">Aucun webhook configuré</p>
          <p className="text-sm text-gray-400 mt-1">Créez un webhook pour recevoir des notifications externes</p>
        </div>
      ) : (
        <div className="space-y-4">
          {webhooks.map((webhook) => (
            <div key={webhook.id} className="bg-white rounded-lg shadow p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-lg">{webhook.name}</h3>
                    {getStatusBadge(webhook.status)}
                  </div>
                  <p className="text-sm text-gray-600 mb-1 break-all">
                    <span className="font-medium">URL:</span> {webhook.url}
                  </p>
                  <p className="text-sm text-gray-600 mb-2">
                    <span className="font-medium">Événements:</span>{' '}
                    {webhook.events.map(e => getEventLabel(e)).join(', ')}
                  </p>
                  {webhook.lastTriggeredAt && (
                    <p className="text-xs text-gray-400">
                      Dernier déclenchement: {new Date(webhook.lastTriggeredAt).toLocaleString('fr-FR')}
                    </p>
                  )}
                  {webhook.lastError && (
                    <p className="text-xs text-red-500 mt-1">
                      Erreur: {webhook.lastError}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleTest(webhook.id, webhook.name)}
                    className="text-blue-600 hover:text-blue-800 p-1"
                    title="Tester"
                  >
                    <FiSend />
                  </button>
                  <button
                    onClick={() => {
                      setEditingWebhook(webhook);
                      setFormData({
                        name: webhook.name,
                        url: webhook.url,
                        secret: webhook.secret || '',
                        events: webhook.events
                      });
                      setShowForm(true);
                    }}
                    className="text-yellow-600 hover:text-yellow-800 p-1"
                    title="Modifier"
                  >
                    <FiEdit2 />
                  </button>
                  <button
                    onClick={() => handleDelete(webhook.id, webhook.name)}
                    className="text-red-600 hover:text-red-800 p-1"
                    title="Supprimer"
                  >
                    <FiTrash2 />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Webhooks;