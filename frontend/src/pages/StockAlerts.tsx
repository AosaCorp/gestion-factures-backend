import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import { FiAlertTriangle, FiEdit2, FiSave, FiRefreshCw, FiPackage, FiTrendingUp } from 'react-icons/fi';

interface ProductStock {
  id: number;
  name: string;
  stock: number;
  minStock: number;
  category: string;
  price: number;
  status: 'rupture' | 'alerte' | 'attention' | 'ok';
}

const StockAlerts: React.FC = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<ProductStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState<number>(0);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [productsRes, statsRes] = await Promise.all([
        api.get('/stock-alerts/all'),
        api.get('/stock-alerts/stats')
      ]);
      setProducts(productsRes.data.products);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Erreur chargement', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateMinStock = async (id: number, minStock: number) => {
    try {
      await api.put(`/stock-alerts/${id}/min-stock`, { minStock });
      toast.success('Seuil d\'alerte mis à jour');
      fetchData();
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    }
    setEditingId(null);
  };

  const handleUpdateStock = async (id: number, stock: number) => {
    try {
      await api.put(`/stock-alerts/${id}/stock`, { stock });
      toast.success('Stock mis à jour');
      fetchData();
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'rupture':
        return <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs">Rupture</span>;
      case 'alerte':
        return <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs">Stock bas</span>;
      case 'attention':
        return <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs">Attention</span>;
      default:
        return <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">OK</span>;
    }
  };

  if (loading) {
    return <div className="text-center py-10">Chargement...</div>;
  }

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
          <FiPackage className="text-blue-600" /> Gestion des stocks
        </h1>
        <button onClick={fetchData} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center gap-2">
          <FiRefreshCw /> Rafraîchir
        </button>
      </div>

      {/* Statistiques */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <p className="text-sm text-gray-500">Total produits</p>
            <p className="text-2xl font-bold">{stats.totalProducts}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <p className="text-sm text-gray-500">Stock bas</p>
            <p className="text-2xl font-bold text-orange-600">{stats.lowStockCount}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <p className="text-sm text-gray-500">Rupture</p>
            <p className="text-2xl font-bold text-red-600">{stats.outOfStockCount}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <p className="text-sm text-gray-500">Critique (&lt;3)</p>
            <p className="text-2xl font-bold text-red-500">{stats.criticalCount}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <p className="text-sm text-gray-500">Santé stock</p>
            <p className="text-2xl font-bold text-green-600">{Math.round(stats.healthPercent)}%</p>
          </div>
        </div>
      )}

      {/* Tableau des produits */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Produit</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Catégorie</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Stock actuel</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Seuil alerte</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium">{product.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{product.category || '-'}</td>
                  <td className="px-6 py-4 text-right">
                    <input
                      type="number"
                      value={product.stock}
                      onChange={(e) => {
                        const newStock = parseInt(e.target.value);
                        setProducts(products.map(p => p.id === product.id ? { ...p, stock: newStock } : p));
                      }}
                      onBlur={() => handleUpdateStock(product.id, product.stock)}
                      className="w-20 text-right border rounded px-2 py-1"
                      min="0"
                    />
                  </td>
                  <td className="px-6 py-4 text-right">
                    {editingId === product.id ? (
                      <div className="flex items-center justify-end gap-2">
                        <input
                          type="number"
                          value={editValue}
                          onChange={(e) => setEditValue(parseInt(e.target.value))}
                          className="w-16 text-right border rounded px-2 py-1"
                          min="0"
                        />
                        <button
                          onClick={() => handleUpdateMinStock(product.id, editValue)}
                          className="text-green-600 hover:text-green-800"
                        >
                          <FiSave />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-2">
                        <span className="font-mono">{product.minStock}</span>
                        <button
                          onClick={() => {
                            setEditingId(product.id);
                            setEditValue(product.minStock);
                          }}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <FiEdit2 size={14} />
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">{getStatusBadge(product.status)}</td>
                  <td className="px-6 py-4">
                    <button className="text-blue-600 hover:text-blue-800 text-sm">
                      <FiTrendingUp /> Approvisionner
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Message si aucun produit */}
      {products.length === 0 && (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <FiPackage className="text-gray-400 text-4xl mx-auto mb-3" />
          <p className="text-gray-500">Aucun produit trouvé</p>
          <p className="text-sm text-gray-400 mt-1">Ajoutez des produits pour commencer à gérer les stocks</p>
        </div>
      )}
    </div>
  );
};

export default StockAlerts;