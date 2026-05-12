import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { productService } from '../services/productService';
import { useAuth } from '../contexts/AuthContext';
import { useOffline } from '../contexts/OfflineContext';
import { useDataCache } from '../contexts/DataCacheContext';
import toast from 'react-hot-toast';

const ProductForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isOffline, savePendingAction } = useOffline();
  const { refreshCache } = useDataCache();
  const isEdit = !!id;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
    price: 0,
    taxRate: 19.25,
    type: 'product' as 'product' | 'service',
    stock: 0
  });

  useEffect(() => {
    if (isEdit && user?.role === 'admin') {
      fetchProduct();
    }
  }, [id, user]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const data = await productService.getById(parseInt(id!));
      setFormData({
        name: data.name,
        category: data.category || '',
        description: data.description || '',
        price: data.price,
        taxRate: data.taxRate,
        type: data.type,
        stock: data.stock
      });
    } catch (err) {
      setError('Erreur chargement du produit');
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
      setError('Le nom du produit est requis');
      setLoading(false);
      return;
    }
    if (formData.price <= 0) {
      setError('Le prix doit être supérieur à 0');
      setLoading(false);
      return;
    }

    // Mode hors ligne : sauvegarder l'action
    if (isOffline || !navigator.onLine) {
      const pendingAction = {
        type: isEdit ? 'UPDATE_PRODUCT' : 'CREATE_PRODUCT',
        id: isEdit ? parseInt(id!) : undefined,
        data: formData,
        timestamp: Date.now()
      };
      savePendingAction(pendingAction);
      toast.success(isEdit ? 'Produit modifié (sera synchronisé)' : 'Produit créé (sera synchronisé)');
      navigate('/products');
      return;
    }

    try {
      if (isEdit) {
        await productService.update(parseInt(id!), formData);
        toast.success('Produit modifié avec succès');
      } else {
        await productService.create(formData);
        toast.success('Produit créé avec succès');
      }
      await refreshCache();
      navigate('/products');
    } catch (err: any) {
      console.error('Erreur', err);
      const message = err.response?.data?.message || 'Erreur lors de l\'enregistrement';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'price' || name === 'taxRate' || name === 'stock' ? parseFloat(value) || 0 : value
    }));
  };

  if (user?.role !== 'admin') {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          Accès non autorisé. Seuls les administrateurs peuvent gérer les produits.
        </div>
      </div>
    );
  }

  if (loading && isEdit) {
    return <div className="flex justify-center items-center h-64">Chargement...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">
        {isEdit ? 'Modifier le produit' : 'Créer un produit'}
      </h1>

      {isOffline && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
          📱 Mode hors ligne - Le produit sera sauvegardé et synchronisé automatiquement
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nom du produit *
            </label>
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              placeholder="Ex: Casque Bluetooth"
              className="w-full border border-gray-300 rounded-md p-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Catégorie
            </label>
            <input
              type="text"
              name="category"
              value={formData.category}
              onChange={handleChange}
              placeholder="Ex: Informatique, Audio, Accessoires..."
              className="w-full border border-gray-300 rounded-md p-2"
            />
            <p className="text-xs text-gray-500 mt-1">
              La catégorie apparaîtra dans la colonne "Description" de la facture
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              placeholder="Description détaillée du produit..."
              className="w-full border border-gray-300 rounded-md p-2"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Prix HT (FCFA) *
              </label>
              <input
                type="number"
                name="price"
                required
                min="0"
                step="100"
                value={formData.price}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                TVA (%)
              </label>
              <input
                type="number"
                name="taxRate"
                step="0.01"
                min="0"
                max="100"
                value={formData.taxRate}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md p-2"
              />
              <p className="text-xs text-gray-500 mt-1">
                Taux standard: 19,25%
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md p-2"
              >
                <option value="product">Produit</option>
                <option value="service">Service</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stock
              </label>
              <input
                type="number"
                name="stock"
                min="0"
                value={formData.stock}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md p-2"
              />
            </div>
          </div>

          <div className="bg-gray-50 p-3 rounded-md">
            <p className="text-sm text-gray-600">
              <span className="font-medium">Prix TTC estimé :</span>{' '}
              {Math.round(formData.price * (1 + formData.taxRate / 100)).toLocaleString()} FCFA
            </p>
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
              onClick={() => navigate('/products')}
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

export default ProductForm;