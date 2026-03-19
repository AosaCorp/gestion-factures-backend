import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { userService, User } from '../services/userService';
import toast from 'react-hot-toast';

const UserForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [formData, setFormData] = useState<Partial<User>>({
    name: '',
    email: '',
    role: 'cashier',
  });
  const [password, setPassword] = useState(''); // champ séparé
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEdit) {
      fetchUser();
    }
  }, [isEdit]);

  const fetchUser = async () => {
    try {
      setLoading(true);
      const data = await userService.getById(parseInt(id!));
      // Ne pas récupérer le mot de passe
      setFormData(data);
    } catch (err) {
      setError('Erreur lors du chargement');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isEdit) {
        await userService.update(parseInt(id!), formData);
        toast.success('Utilisateur modifié');
      } else {
        // Pour la création, on envoie aussi le mot de passe (hors interface User)
        await userService.create({ ...formData, password } as any);
        toast.success('Utilisateur créé');
      }
      navigate('/users');
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Erreur enregistrement');
      toast.error('Erreur');
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEdit) return <div>Chargement...</div>;

  return (
    <div className="container mx-auto px-4 py-6 max-w-lg">
      <h1 className="text-2xl font-bold mb-6">{isEdit ? 'Modifier' : 'Créer'} un utilisateur</h1>
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
          <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
          <input
            type="email"
            name="email"
            value={formData.email || ''}
            onChange={handleChange}
            required
            className="w-full border border-gray-300 rounded-md p-2"
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Rôle</label>
          <select
            name="role"
            value={formData.role || 'cashier'}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md p-2"
          >
            <option value="cashier">Caissier</option>
            <option value="manager">Gestionnaire</option>
            <option value="admin">Administrateur</option>
          </select>
        </div>
        {!isEdit && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Mot de passe *</label>
            <input
              type="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full border border-gray-300 rounded-md p-2"
            />
          </div>
        )}
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
            onClick={() => navigate('/users')}
            className="bg-gray-600 text-white px-6 py-2 rounded hover:bg-gray-700"
          >
            Annuler
          </button>
        </div>
      </form>
    </div>
  );
};

export default UserForm;