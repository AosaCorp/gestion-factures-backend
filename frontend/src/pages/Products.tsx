import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { productService, Product } from '../services/productService';
import { useAuth } from '../contexts/AuthContext';
import { useOffline } from '../contexts/OfflineContext';
import { useDataCache } from '../contexts/DataCacheContext';
import toast from 'react-hot-toast';
import { FiSearch, FiDownload, FiEye, FiEdit, FiTrash2 } from 'react-icons/fi';
import debounce from 'lodash/debounce';
import { exportToCSV } from '../services/exportService';

const Products: React.FC = () => {
  const { user } = useAuth();
  const { isOffline } = useOffline();
  const { cachedProducts, refreshCache, isLoadingCache } = useDataCache();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'product' | 'service'>('all');
  const limit = 10;
  const [stats, setStats] = useState({
    totalProducts: 0,
    productCount: 0,
    serviceCount: 0,
    totalValue: 0
  });

  const fetchProducts = useCallback(async () => {
    if (!navigator.onLine) {
      if (cachedProducts.length > 0) {
        setProducts(cachedProducts);
        setTotalPages(Math.ceil(cachedProducts.length / limit));
        setError('');
      } else {
        setError('Mode hors ligne - Aucune donnée produit en cache');
      }
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await productService.getPaginated(page, limit, search);
      setProducts(response.data);
      setTotalPages(response.totalPages);
      setError('');
      if (response.data.length > 0) {
        const allProducts = await productService.getAll();
        localStorage.setItem('cached_products', JSON.stringify(allProducts));
      }
    } catch (error) {
      console.error('Erreur chargement produits', error);
      if (cachedProducts.length > 0) {
        setProducts(cachedProducts);
        setError('Données du cache (hors ligne)');
      } else {
        setError('Erreur lors du chargement des produits');
      }
    } finally {
      setLoading(false);
    }
  }, [page, search, cachedProducts]);

  const fetchStats = useCallback(async () => {
    if (!navigator.onLine && cachedProducts.length > 0) {
      const productsCount = cachedProducts.filter(p => p.type !== 'service').length;
      const serviceCount = cachedProducts.filter(p => p.type === 'service').length;
      const totalValue = cachedProducts.reduce((sum, p) => sum + p.price, 0);
      setStats({
        totalProducts: cachedProducts.length,
        productCount: productsCount,
        serviceCount,
        totalValue
      });
      return;
    }

    try {
      const allProducts = await productService.getAll();
      const productsCount = allProducts.filter(p => p.type !== 'service').length;
      const serviceCount = allProducts.filter(p => p.type === 'service').length;
      const totalValue = allProducts.reduce((sum, p) => sum + p.price, 0);
      setStats({
        totalProducts: allProducts.length,
        productCount: productsCount,
        serviceCount,
        totalValue
      });
    } catch (error) {
      console.error('Erreur chargement stats', error);
    }
  }, [cachedProducts]);

  useEffect(() => {
    fetchProducts();
    fetchStats();
  }, [fetchProducts, fetchStats]);

  useEffect(() => {
    if (navigator.onLine) {
      refreshCache();
      fetchStats();
    }
  }, [navigator.onLine]);

  const debouncedSearch = useCallback(
    debounce((value: string) => {
      setSearch(value);
      setPage(1);
    }, 500),
    []
  );

  const handleDelete = async (id: number) => {
    if (window.confirm('Supprimer ce produit ?')) {
      try {
        await productService.delete(id);
        toast.success('Produit supprimé');
        fetchProducts();
        refreshCache();
        fetchStats();
      } catch (error) {
        toast.error('Erreur lors de la suppression');
      }
    }
  };

  const handleExport = async () => {
    try {
      const allProducts = await productService.getAll();
      const dataForExport = allProducts.map(p => ({
        Nom: p.name,
        Description: p.description || '',
        Type: p.type === 'service' ? 'Service' : 'Produit',
        'Prix HT': p.price,
        'TVA (%)': p.taxRate,
        'Prix TTC': Math.round(p.price * (1 + p.taxRate / 100)),
        'Date création': new Date(p.createdAt).toLocaleDateString('fr-FR'),
      }));
      await exportToCSV(dataForExport, 'produits');
      toast.success('Export réussi');
    } catch (error: any) {
      toast.error(error.message || 'Erreur export');
    }
  };

  const filteredProducts = products.filter(p => {
    if (typeFilter === 'product') return p.type !== 'service';
    if (typeFilter === 'service') return p.type === 'service';
    return true;
  });

  const formatAmount = (amount: number) => {
    return amount.toLocaleString('fr-FR') + ' FCFA';
  };

  const formatTaxRate = (rate: number) => {
    return rate.toString().replace('.', ',');
  };

  return (
    <div className="p-4 md:p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">Gestion des produits</h1>
        {user?.role === 'admin' && (
          <Link to="/products/new" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            Nouveau produit
          </Link>
        )}
      </div>

      {isOffline && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-2 rounded mb-4 text-sm">
          📱 Mode hors ligne - Affichage des données en cache
        </div>
      )}

      {error && (
        <div className={`px-4 py-2 rounded mb-4 text-sm ${error.includes('hors ligne') ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-3 md:p-4">
          <p className="text-xs md:text-sm text-gray-500">Total produits</p>
          <p className="text-lg md:text-2xl font-bold">{stats.totalProducts}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-3 md:p-4">
          <p className="text-xs md:text-sm text-gray-500">Produits</p>
          <p className="text-lg md:text-2xl font-bold">{stats.productCount}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-3 md:p-4">
          <p className="text-xs md:text-sm text-gray-500">Services</p>
          <p className="text-lg md:text-2xl font-bold">{stats.serviceCount}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-3 md:p-4">
          <p className="text-xs md:text-sm text-gray-500">Valeur totale</p>
          <p className="text-lg md:text-2xl font-bold">{formatAmount(stats.totalValue)}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[180px]">
            <input
              type="text"
              placeholder="Rechercher..."
              onChange={(e) => debouncedSearch(e.target.value)}
              className="w-full border border-gray-300 rounded-md pl-10 pr-4 py-2 text-sm"
            />
            <FiSearch className="absolute left-3 top-3 text-gray-400" />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="all">Tous les types</option>
            <option value="product">Produits</option>
            <option value="service">Services</option>
          </select>
          <button onClick={handleExport} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex items-center gap-1 text-sm">
            <FiDownload /> CSV
          </button>
        </div>
      </div>

      {loading || isLoadingCache ? (
        <p className="text-center py-10">Chargement...</p>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className="min-w-[800px] w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left">Nom</th>
                  <th className="px-4 py-2 text-left">Description</th>
                  <th className="px-4 py-2 text-left">Type</th>
                  <th className="px-4 py-2 text-right">Prix HT</th>
                  <th className="px-4 py-2 text-right">TVA%</th>
                  <th className="px-4 py-2 text-right">Prix TTC</th>
                  <th className="px-4 py-2 text-left">Date création</th>
                  <th className="px-4 py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredProducts.map(product => {
                  const priceTTC = Math.round(product.price * (1 + product.taxRate / 100));
                  return (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 font-medium">{product.name}</td>
                      <td className="px-4 py-2">{product.description || '-'}</td>
                      <td className="px-4 py-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${product.type === 'service' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                          {product.type === 'service' ? 'Service' : 'Produit'}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-right">{formatAmount(product.price)}</td>
                      <td className="px-4 py-2 text-right">{formatTaxRate(product.taxRate)}%</td>
                      <td className="px-4 py-2 text-right">{formatAmount(priceTTC)}</td>
                      <td className="px-4 py-2">{new Date(product.createdAt).toLocaleDateString('fr-FR')}</td>
                      <td className="px-4 py-2">
                        <div className="flex gap-2">
                          <Link to={`/products/${product.id}`} title="Voir" className="text-indigo-600 hover:text-indigo-800">
                            <FiEye className="w-5 h-5" />
                          </Link>
                          {user?.role === 'admin' && (
                            <>
                              <Link to={`/products/edit/${product.id}`} title="Modifier" className="text-yellow-600 hover:text-yellow-800">
                                <FiEdit className="w-5 h-5" />
                              </Link>
                              <button onClick={() => handleDelete(product.id)} title="Supprimer" className="text-red-600 hover:text-red-800">
                                <FiTrash2 className="w-5 h-5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          {totalPages > 1 && (
            <div className="flex justify-center mt-4 gap-2 text-sm">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
              >
                Précédent
              </button>
              <span className="px-3 py-1">Page {page} / {totalPages}</span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
              >
                Suivant
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Products;