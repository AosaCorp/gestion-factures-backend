import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { productService, Product } from '../services/productService';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { FiSearch, FiDownload, FiEdit, FiTrash2, FiEye } from 'react-icons/fi';
import debounce from 'lodash/debounce';
import Papa from 'papaparse';

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
        'Prix TTC': Math.round(p.price * (1 + p.taxRate/100)),
        'Date création': new Date(p.createdAt).toLocaleDateString('fr-FR')
      }));
      const csv = Papa.unparse(dataForExport);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.href = url;
      link.setAttribute('download', 'produits.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('Export réussi');
    } catch (error) {
      console.error('Erreur export', error);
      toast.error('Erreur lors de l\'export');
    }
  };

  const filteredProducts = products.filter(p => {
    if (typeFilter === 'product') return p.description !== 'service';
    if (typeFilter === 'service') return p.description === 'service';
    return true;
  });

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-3xl font-bold mb-6">Gestion des produits</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Total produits</p>
          <p className="text-2xl font-bold">{stats.totalProducts}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Produits</p>
          <p className="text-2xl font-bold">{stats.productCount}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Services</p>
          <p className="text-2xl font-bold">{stats.serviceCount}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Valeur totale</p>
          <p className="text-2xl font-bold">{stats.totalValue.toLocaleString()} FCFA</p>
        </div>
      </div>

      {/* Filtres et actions */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              placeholder="Rechercher par nom, description..."
              onChange={handleSearchChange}
              className="w-full border border-gray-300 rounded-md pl-10 pr-4 py-2"
            />
            <FiSearch className="absolute left-3 top-3 text-gray-400" />
          </div>
          <div className="flex items-center gap-2">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="all">Tous les types</option>
              <option value="product">Produits</option>
              <option value="service">Services</option>
            </select>
          </div>
          <button
            onClick={handleExport}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex items-center ml-auto"
          >
            <FiDownload className="mr-2" /> Exporter CSV
          </button>
          {user?.role === 'admin' && (
            <Link to="/products/new" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
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
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nom</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prix unitaire</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">TVA (%)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prix TTC</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date création</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProducts.map(product => (
                  <tr key={product.id}>
                    <td className="px-6 py-4 whitespace-nowrap">{product.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{product.description || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                        {product.description === 'service' ? 'Service' : 'Produit'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{product.price.toLocaleString()} FCFA</td>
                    <td className="px-6 py-4 whitespace-nowrap">{product.taxRate}%</td>
                    <td className="px-6 py-4 whitespace-nowrap">{Math.round(product.price * (1 + product.taxRate/100)).toLocaleString()} FCFA</td>
                    <td className="px-6 py-4 whitespace-nowrap">{new Date(product.createdAt).toLocaleDateString('fr-FR')}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Link to={`/products/${product.id}`} className="text-indigo-600 hover:text-indigo-900 mr-3" title="Voir">
                        <FiEye className="inline" />
                      </Link>
                      {user?.role === 'admin' && (
                        <>
                          <Link to={`/products/edit/${product.id}`} className="text-yellow-600 hover:text-yellow-900 mr-3" title="Modifier">
                            <FiEdit className="inline" />
                          </Link>
                          <button onClick={() => handleDelete(product.id)} className="text-red-600 hover:text-red-900" title="Supprimer">
                            <FiTrash2 className="inline" />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex justify-center mt-4 space-x-2">
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
        </>
      )}
    </div>
  );
};

export default Products;