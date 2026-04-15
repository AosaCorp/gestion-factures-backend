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
      const filtered = data.filter(u => 
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())
      );
      setTotalPages(Math.ceil(filtered.length / limit));
      const start = (page - 1) * limit;
      setUsers(filtered.slice(start, start + limit));
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
    return date.toLocaleDateString('fr-FR') + ' ' + date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
        <h1 className="text-2xl font-bold">Gestion des utilisateurs</h1>
        {currentUser?.role === 'admin' && (
          <Link to="/users/new" className="bg-blue-600 text-white px-3 py-1 rounded text-sm">Nouvel utilisateur</Link>
        )}
      </div>

      <div className="mb-4">
        <div className="relative max-w-md">
          <input
            type="text"
            placeholder="Rechercher par nom, email..."
            onChange={handleSearchChange}
            className="w-full border rounded-md pl-10 pr-4 py-2 text-sm"
          />
          <FiSearch className="absolute left-3 top-3 text-gray-400" />
        </div>
      </div>

      {loading ? (
        <p>Chargement...</p>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className="min-w-[800px] w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left">Utilisateur</th>
                  <th className="px-4 py-2 text-left">Rôle</th>
                  <th className="px-4 py-2 text-left">2FA</th>
                  <th className="px-4 py-2 text-left">Dernière connexion</th>
                  <th className="px-4 py-2 text-left">Date création</th>
                  <th className="px-4 py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.map(u => (
                  <tr key={u.id}>
                    <td className="px-4 py-2">
                      <div className="font-medium">{u.name}</div>
                      <div className="text-xs text-gray-500">{u.email}</div>
                    </td>
                    <td className="px-4 py-2">{getRoleLabel(u.role)}</td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${u.twoFactorEnabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {u.twoFactorEnabled ? 'Activé' : 'Désactivé'}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-xs">{formatDate(u.lastLogin)}</td>
                    <td className="px-4 py-2 text-xs">{formatDate(u.createdAt)}</td>
                    <td className="px-4 py-2">
                      <div className="flex gap-2">
                        <Link to={`/users/${u.id}`} title="Voir" className="text-indigo-600"><FiEye className="w-5 h-5" /></Link>
                        {currentUser?.role === 'admin' && u.id !== currentUser.id && (
                          <>
                            <Link to={`/users/edit/${u.id}`} title="Modifier" className="text-yellow-600"><FiEdit className="w-5 h-5" /></Link>
                            <button onClick={() => handleDelete(u.id)} title="Supprimer" className="text-red-600"><FiTrash2 className="w-5 h-5" /></button>
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

export default Users;