import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { productService } from '../services/productService';
import type { Product } from '../services/productService';
import toast from 'react-hot-toast';

const ProductForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    description: '',
    price: 0,
    taxRate: 19.25
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEdit) {
      fetchProduct();
    }
  }, [isEdit]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const data = await productService.getById(parseInt(id!));
      setFormData(data);
    } catch (err) {
      setError('Erreur lors du chargement du produit');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isEdit) {
        await productService.update(parseInt(id!), formData);
        toast.success('Produit modifié avec succès');
      } else {
        await productService.create(formData as Omit<Product, 'id' | 'createdAt' | 'updatedAt'>);
        toast.success('Produit créé avec succès');
      }
      navigate('/products');
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
      <h1 className="text-2xl font-bold mb-6">{isEdit ? 'Modifier' : 'Créer'} un produit</h1>
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
          <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
          <textarea
            name="description"
            value={formData.description || ''}
            onChange={handleChange}
            rows={3}
            className="w-full border border-gray-300 rounded-md p-2"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Prix HT (FCFA) *</label>
            <input
              type="number"
              name="price"
              value={formData.price || 0}
              onChange={handleChange}
              min="0"
              step="0.01"
              required
              className="w-full border border-gray-300 rounded-md p-2"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">TVA (%)</label>
            <input
              type="number"
              name="taxRate"
              value={formData.taxRate || 19.25}
              onChange={handleChange}
              min="0"
              max="100"
              step="0.01"
              className="w-full border border-gray-300 rounded-md p-2"
            />
          </div>
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
            onClick={() => navigate('/products')}
            className="bg-gray-600 text-white px-6 py-2 rounded hover:bg-gray-700"
          >
            Annuler
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProductForm;