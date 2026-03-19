import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { clientService, Client } from '../services/clientService';
import toast from 'react-hot-toast';

const ClientForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [formData, setFormData] = useState<Partial<Client>>({
    name: '',
    email: '',
    phone: '',
    address: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEdit) {
      fetchClient();
    }
  }, [isEdit]);

  const fetchClient = async () => {
    try {
      setLoading(true);
      const data = await clientService.getById(parseInt(id!));
      setFormData(data);
    } catch (err) {
      setError('Erreur lors du chargement du client');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isEdit) {
        await clientService.update(parseInt(id!), formData);
        toast.success('Client modifié avec succès');
      } else {
        await clientService.create(formData as Omit<Client, 'id' | 'createdAt' | 'updatedAt'>);
        toast.success('Client créé avec succès');
      }
      navigate('/clients');
    } catch (err) {
      console.error(err);
      setError('Erreur lors de l\'enregistrement');
      toast.error('Erreur lors de l\'enregistrement');
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEdit) return <div>Chargement...</div>;

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">{isEdit ? 'Modifier' : 'Créer'} un client</h1>
      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
      <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Nom *</label>
          <input
            type="text"
            name="name"
            value={formData.name || ''}
            onChange={handleChange}
            required
            className="w-full border border-gray-300 rounded-md p-2"
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
          <input
            type="email"
            name="email"
            value={formData.email || ''}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md p-2"
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Téléphone</label>
          <input
            type="tel"
            name="phone"
            value={formData.phone || ''}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md p-2"
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Adresse</label>
          <textarea
            name="address"
            value={formData.address || ''}
            onChange={handleChange}
            rows={3}
            className="w-full border border-gray-300 rounded-md p-2"
          />
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Enregistrement...' : 'Enregistrer'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/clients')}
            className="bg-gray-600 text-white px-6 py-2 rounded hover:bg-gray-700"
          >
            Annuler
          </button>
        </div>
      </form>
    </div>
  );
};

export default ClientForm;