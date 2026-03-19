import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { userService, User } from '../services/userService';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { FiSearch, FiEdit, FiTrash2, FiEye } from 'react-icons/fi';
import debounce from 'lodash/debounce';

const Users: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await userService.getAll();
      // Filtrer par recherche côté frontend (pour simplifier)
      const filtered = data.filter(u => 
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())
      );
      const start = (page - 1) * limit;
      const paginated = filtered.slice(start, start + limit);
      setUsers(paginated);
      setTotalPages(Math.ceil(filtered.length / limit));
    } catch (error) {
      toast.error('Erreur chargement');
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

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
    if (!window.confirm('Supprimer cet utilisateur ?')) return;
    try {
      await userService.delete(id);
      toast.success('Utilisateur supprimé');
      fetchUsers();
    } catch (error) {
      toast.error('Erreur suppression');
    }
  };

  const getRoleLabel = (role: string) => {
    const labels = { admin: 'Administrateur', cashier: 'Caissière', manager: 'Gestionnaire' };
    return labels[role as keyof typeof labels] || role;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Jamais';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR') + ' ' + date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Gestion des utilisateurs</h1>
        {currentUser?.role === 'admin' && (
          <Link to="/users/new" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            Nouvel utilisateur
          </Link>
        )}
      </div>

      {/* Barre de recherche */}
      <div className="mb-4 flex items-center">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Rechercher par nom, email..."
            onChange={handleSearchChange}
            className="w-full border border-gray-300 rounded-md pl-10 pr-4 py-2"
          />
          <FiSearch className="absolute left-3 top-3 text-gray-400" />
        </div>
      </div>

      {loading ? (
        <p>Chargement...</p>
      ) : (
        <>
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Utilisateur</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rôle</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">2FA</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dernière connexion</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date création</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map(u => (
                  <tr key={u.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{u.name}</div>
                      <div className="text-sm text-gray-500">{u.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{getRoleLabel(u.role)}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${u.twoFactorEnabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {u.twoFactorEnabled ? 'Activé' : 'Désactivé'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(u.lastLogin)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(u.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Link to={`/users/${u.id}`} className="text-indigo-600 hover:text-indigo-900 mr-3" title="Voir">
                        <FiEye className="inline" />
                      </Link>
                      {currentUser?.role === 'admin' && u.id !== currentUser.id && (
                        <>
                          <Link to={`/users/edit/${u.id}`} className="text-yellow-600 hover:text-yellow-900 mr-3" title="Modifier">
                            <FiEdit className="inline" />
                          </Link>
                          <button onClick={() => handleDelete(u.id)} className="text-red-600 hover:text-red-900" title="Supprimer">
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

export default Users;