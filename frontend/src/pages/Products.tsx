import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { productService, Product } from '../services/productService';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { FiSearch, FiDownload, FiEye, FiEdit, FiTrash2 } from 'react-icons/fi';
import debounce from 'lodash/debounce';
import { exportToCSV } from '../services/exportService';

const Products: React.FC = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
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
    try {
      setLoading(true);
      const response = await productService.getPaginated(page, limit, search);
      setProducts(response.data);
      setTotalPages(response.totalPages);
    } catch (error) {
      console.error('Erreur chargement produits', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  const fetchStats = useCallback(async () => {
    try {
      const allProducts = await productService.getAll();
      const productsCount = allProducts.length;
      const productTypeCount = allProducts.filter(p => p.description !== 'service').length;
      const serviceCount = allProducts.filter(p => p.description === 'service').length;
      const totalValue = allProducts.reduce((sum, p) => sum + p.price, 0);
      setStats({
        totalProducts: productsCount,
        productCount: productTypeCount,
        serviceCount,
        totalValue
      });
    } catch (error) {
      console.error('Erreur chargement stats', error);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
    fetchStats();
  }, [fetchProducts, fetchStats]);

  const debouncedSearch = useCallback(
    debounce((value: string) => {
      setSearch(value);
      setPage(1);
    }, 500),
    []
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    debouncedSearch(e.target.value);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Supprimer ce produit ?')) {
      try {
        await productService.delete(id);
        toast.success('Produit supprimé');
        fetchProducts();
        fetchStats();
      } catch (error) {
        console.error('Erreur suppression', error);
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
      Type: p.description === 'service' ? 'Service' : 'Produit',
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
    if (typeFilter === 'product') return p.description !== 'service';
    if (typeFilter === 'service') return p.description === 'service';
    return true;
  });

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-2xl md:text-3xl font-bold mb-6">Gestion des produits</h1>

      {/* KPI Cards */}
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
          <p className="text-lg md:text-2xl font-bold">{stats.totalValue.toLocaleString()} FCFA</p>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[180px]">
            <input
              type="text"
              placeholder="Rechercher..."
              onChange={handleSearchChange}
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
          {user?.role === 'admin' && (
            <Link to="/products/new" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm">
              Nouveau produit
            </Link>
          )}
        </div>
      </div>

      {/* Tableau */}
      {loading ? (
        <p>Chargement...</p>
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
                {filteredProducts.map(product => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2">{product.name}</td>
                    <td className="px-4 py-2">{product.description || '-'}</td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${product.description === 'service' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                        {product.description === 'service' ? 'Service' : 'Produit'}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right">{product.price.toLocaleString()} F</td>
                    <td className="px-4 py-2 text-right">{product.taxRate}%</td>
                    <td className="px-4 py-2 text-right">{Math.round(product.price * (1 + product.taxRate/100)).toLocaleString()} F</td>
                    <td className="px-4 py-2">{new Date(product.createdAt).toLocaleDateString('fr-FR')}</td>
                    <td className="px-4 py-2">
                      <div className="flex gap-2">
                        <Link to={`/products/${product.id}`} title="Voir" className="text-indigo-600"><FiEye className="w-5 h-5" /></Link>
                        {user?.role === 'admin' && (
                          <>
                            <Link to={`/products/edit/${product.id}`} title="Modifier" className="text-yellow-600"><FiEdit className="w-5 h-5" /></Link>
                            <button onClick={() => handleDelete(product.id)} title="Supprimer" className="text-red-600"><FiTrash2 className="w-5 h-5" /></button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-center mt-4 gap-2 text-sm">
            <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1} className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50">Précédent</button>
            <span className="px-3 py-1">Page {page} / {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page === totalPages} className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50">Suivant</button>
          </div>
        </>
      )}
    </div>
  );
};

export default Products;