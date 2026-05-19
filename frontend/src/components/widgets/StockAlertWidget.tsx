import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { FiAlertTriangle, FiPackage, FiTrendingDown, FiRefreshCw } from 'react-icons/fi';
import { Link } from 'react-router-dom';

interface StockAlert {
  id: number;
  name: string;
  stock: number;
  minStock: number;
  category: string;
  price: number;
}

interface StockStats {
  totalProducts: number;
  lowStockCount: number;
  outOfStockCount: number;
  criticalCount: number;
  healthPercent: number;
}

const StockAlertWidget: React.FC = () => {
  const [lowStockProducts, setLowStockProducts] = useState<StockAlert[]>([]);
  const [stats, setStats] = useState<StockStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [lowRes, statsRes] = await Promise.all([
        api.get('/stock-alerts/low'),
        api.get('/stock-alerts/stats')
      ]);
      setLowStockProducts(lowRes.data.products);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Erreur chargement alertes stock', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (stock: number, minStock: number) => {
    if (stock === 0) return 'text-red-600 bg-red-50';
    if (stock < minStock) return 'text-orange-600 bg-orange-50';
    return 'text-green-600 bg-green-50';
  };

  const getStatusText = (stock: number, minStock: number) => {
    if (stock === 0) return 'Rupture';
    if (stock < minStock) return 'Stock bas';
    return 'OK';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow p-4">
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <FiPackage className="text-blue-600" /> Stock & Alertes
        </h2>
        <button onClick={fetchData} className="text-gray-400 hover:text-gray-600">
          <FiRefreshCw size={16} />
        </button>
      </div>

      {/* Statistiques */}
      {stats && (
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-green-50 rounded-lg p-2 text-center">
            <p className="text-xs text-gray-500">Produits</p>
            <p className="text-xl font-bold text-green-600">{stats.totalProducts}</p>
          </div>
          <div className="bg-orange-50 rounded-lg p-2 text-center">
            <p className="text-xs text-gray-500">Stock bas</p>
            <p className="text-xl font-bold text-orange-600">{stats.lowStockCount}</p>
          </div>
          <div className="bg-red-50 rounded-lg p-2 text-center">
            <p className="text-xs text-gray-500">Rupture</p>
            <p className="text-xl font-bold text-red-600">{stats.outOfStockCount}</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-2 text-center">
            <p className="text-xs text-gray-500">Santé stock</p>
            <p className="text-xl font-bold text-blue-600">{Math.round(stats.healthPercent)}%</p>
          </div>
        </div>
      )}

      {/* Liste des alertes */}
      {lowStockProducts.length === 0 ? (
        <div className="text-center py-6 text-gray-500">
          <FiTrendingDown className="text-3xl mx-auto mb-2 text-green-500" />
          <p className="text-sm">Aucun produit en stock bas</p>
          <p className="text-xs mt-1">Tous les stocks sont suffisants</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {lowStockProducts.slice(0, 5).map((product) => (
            <div key={product.id} className={`p-3 rounded-lg ${getStatusColor(product.stock, product.minStock)}`}>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <FiAlertTriangle className={product.stock === 0 ? 'text-red-500' : 'text-orange-500'} size={14} />
                    <span className="font-medium text-sm">{product.name}</span>
                  </div>
                  <p className="text-xs mt-1">
                    Stock: <strong className={product.stock === 0 ? 'text-red-600' : 'text-orange-600'}>{product.stock}</strong>
                    {' / '}Seuil: {product.minStock}
                  </p>
                </div>
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-white bg-opacity-50">
                  {getStatusText(product.stock, product.minStock)}
                </span>
              </div>
            </div>
          ))}
          {lowStockProducts.length > 5 && (
            <div className="text-center pt-2">
              <Link to="/stock-alerts" className="text-blue-600 text-sm hover:underline">
                Voir les {lowStockProducts.length} alertes →
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StockAlertWidget;