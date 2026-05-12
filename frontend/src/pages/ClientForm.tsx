import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { clientService, Client } from '../services/clientService';
import { useAuth } from '../contexts/AuthContext';
import { useOffline } from '../contexts/OfflineContext';
import toast from 'react-hot-toast';

const ClientForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isOffline, savePendingAction } = useOffline();
  const isEdit = !!id;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  });

  useEffect(() => {
    if (isEdit) {
      fetchClient();
    }
  }, [id]);

  const fetchClient = async () => {
    try {
      setLoading(true);
      const data = await clientService.getById(parseInt(id!));
      setFormData({
        name: data.name,
        email: data.email || '',
        phone: data.phone || '',
        address: data.address || ''
      });
    } catch (err) {
      setError('Erreur chargement client');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!formData.name.trim()) {
      setError('Le nom est requis');
      setLoading(false);
      return;
    }

    // Mode hors ligne : sauvegarder l'action
    if (isOffline || !navigator.onLine) {
      const pendingAction = {
        type: isEdit ? 'UPDATE_CLIENT' : 'CREATE_CLIENT',
        id: isEdit ? parseInt(id!) : undefined,
        data: formData,
        timestamp: Date.now()
      };
      savePendingAction(pendingAction);
      toast.success(isEdit ? 'Client modifié (sera synchronisé)' : 'Client créé (sera synchronisé)');
      navigate('/clients');
      return;
    }

    try {
      if (isEdit) {
        await clientService.update(parseInt(id!), formData);
        toast.success('Client modifié avec succès');
      } else {
        await clientService.create(formData);
        toast.success('Client créé avec succès');
      }
      navigate('/clients');
    } catch (err: any) {
      console.error('Erreur', err);
      setError(err.response?.data?.message || 'Erreur lors de l\'enregistrement');
      toast.error('Erreur lors de l\'enregistrement');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  if (loading && isEdit) return <div className="text-center py-10">Chargement...</div>;

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">{isEdit ? 'Modifier' : 'Nouveau'} client</h1>
      
      {isOffline && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4 flex items-center gap-2">
          <span>📱</span> Mode hors ligne - Les données seront synchronisées automatiquement
        </div>
      )}
      
      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
      
      <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md p-2"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md p-2"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md p-2"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              rows={2}
              className="w-full border border-gray-300 rounded-md p-2"
            />
          </div>
          
          <div className="flex gap-2 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Enregistrement...' : (isEdit ? 'Modifier' : 'Créer')}
            </button>
            <button
              type="button"
              onClick={() => navigate('/clients')}
              className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600"
            >
              Annuler
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ClientForm;