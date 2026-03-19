import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { productService, Product } from '../services/productService';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const data = await productService.getById(parseInt(id!));
      setProduct(data);
    } catch (err) {
      setError('Erreur chargement');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Supprimer ce produit ?')) return;
    try {
      await productService.delete(parseInt(id!));
      toast.success('Produit supprimé');
      navigate('/products');
    } catch (err) {
      toast.error('Erreur suppression');
    }
  };

  if (loading) return <div className="flex justify-center items-center h-64">Chargement...</div>;
  if (error) return <div className="text-red-600">{error}</div>;
  if (!product) return <div>Produit non trouvé</div>;

  const isAdmin = user?.role === 'admin';

  return (
    <div className="container mx-auto px-4 py-6 max-w-3xl">
      <div className="mb-4">
        <button onClick={() => navigate(-1)} className="text-blue-600 hover:underline">
          &larr; Retour
        </button>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold mb-4">{product.name}</h1>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Description</p>
              <p className="font-medium">{product.description || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Prix HT</p>
              <p className="font-medium">{product.price.toLocaleString()} FCFA</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">TVA</p>
              <p className="font-medium">{product.taxRate}%</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Prix TTC</p>
              <p className="font-medium">{Math.round(product.price * (1 + product.taxRate/100)).toLocaleString()} FCFA</p>
            </div>
          </div>

          <div>
            <p className="text-sm text-gray-500">Date de création</p>
            <p className="font-medium">{product.createdAt ? new Date(product.createdAt).toLocaleString('fr-FR') : ''}</p>
          </div>

          {isAdmin && (
            <div className="flex flex-wrap gap-2 border-t pt-4 mt-4">
              <Link
                to={`/products/edit/${product.id}`}
                className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700"
              >
                Modifier
              </Link>
              <button
                onClick={handleDelete}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              >
                Supprimer
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;