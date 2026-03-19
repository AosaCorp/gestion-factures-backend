import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { userService, User } from '../services/userService';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const UserDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    if (id) fetchUser();
  }, [id]);

  const fetchUser = async () => {
    try {
      setLoading(true);
      const data = await userService.getById(parseInt(id!));
      setUser(data);
    } catch (err) {
      setError('Erreur chargement');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Supprimer cet utilisateur ?')) return;
    try {
      await userService.delete(parseInt(id!));
      toast.success('Utilisateur supprimé');
      navigate('/users');
    } catch (err) {
      toast.error('Erreur suppression');
    }
  };

  const handleEnable2FA = async () => {
    try {
      const result = await userService.enable2FA(parseInt(id!));
      setQrCode(result.qrcode);
      setShowQR(true);
      toast.success('2FA activé. Le QR code est affiché ci-dessous.');
      fetchUser(); // recharger pour mettre à jour le statut
    } catch (err) {
      toast.error('Erreur lors de l\'activation du 2FA');
    }
  };

  const handleDisable2FA = async () => {
    if (!window.confirm('Désactiver le 2FA pour cet utilisateur ?')) return;
    try {
      await userService.disable2FA(parseInt(id!));
      toast.success('2FA désactivé');
      setQrCode(null);
      setShowQR(false);
      fetchUser();
    } catch (err) {
      toast.error('Erreur lors de la désactivation');
    }
  };

  if (loading) return <div className="flex justify-center items-center h-64">Chargement...</div>;
  if (error) return <div className="text-red-600">{error}</div>;
  if (!user) return <div>Utilisateur non trouvé</div>;

  const isAdmin = currentUser?.role === 'admin';
  const isSelf = currentUser?.id === user.id;
  const canModify = isAdmin && !isSelf; // Admin ne peut modifier que les autres utilisateurs

  const roleLabels: Record<string, string> = {
    admin: 'Administrateur',
    cashier: 'Caissière',
    manager: 'Gestionnaire'
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-3xl">
      <div className="mb-4">
        <button onClick={() => navigate(-1)} className="text-blue-600 hover:underline">
          &larr; Retour
        </button>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold mb-4">{user.name}</h1>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium">{user.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Rôle</p>
              <p className="font-medium">{roleLabels[user.role] || user.role}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">2FA activé</p>
              <p className="font-medium">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.twoFactorEnabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                  {user.twoFactorEnabled ? 'Activé' : 'Désactivé'}
                </span>
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Dernière connexion</p>
              <p className="font-medium">{user.lastLogin ? new Date(user.lastLogin).toLocaleString('fr-FR') : 'Jamais'}</p>
            </div>
          </div>

          <div>
            <p className="text-sm text-gray-500">Date de création</p>
            <p className="font-medium">{user.createdAt ? new Date(user.createdAt).toLocaleString('fr-FR') : ''}</p>
          </div>

          {/* Section 2FA pour les administrateurs (hors eux-mêmes) */}
          {canModify && (
            <div className="border-t pt-4 mt-4">
              <h2 className="text-lg font-semibold mb-2">Gestion de l'authentification à deux facteurs (2FA)</h2>
              <div className="flex flex-wrap gap-2">
                {!user.twoFactorEnabled && (
                  <button
                    onClick={handleEnable2FA}
                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                  >
                    Activer le 2FA
                  </button>
                )}
                {user.twoFactorEnabled && (
                  <button
                    onClick={handleDisable2FA}
                    className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                  >
                    Désactiver le 2FA
                  </button>
                )}
              </div>

              {/* Affichage du QR code après activation */}
              {showQR && qrCode && (
                <div className="mt-4 p-4 border border-gray-200 rounded bg-gray-50">
                  <h3 className="font-medium mb-2">QR code à scanner avec Google Authenticator ou équivalent</h3>
                  <img src={qrCode} alt="QR Code 2FA" className="mx-auto max-w-xs" />
                  <p className="text-sm text-gray-600 mt-2">
                    Ce QR code doit être scanné par l'utilisateur avec son application d'authentification.
                    Il ne sera plus affiché après avoir quitté cette page.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Message si c'est son propre compte */}
          {isAdmin && isSelf && (
            <div className="border-t pt-4 mt-4 text-sm text-gray-600">
              Vous consultez votre propre compte. La gestion du 2FA pour vous-même se fait dans les paramètres de votre compte (à venir).
            </div>
          )}

          {/* Boutons d'actions générales (modifier/supprimer) */}
          {canModify && (
            <div className="flex flex-wrap gap-2 border-t pt-4 mt-4">
              <Link
                to={`/users/edit/${user.id}`}
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

export default UserDetail;