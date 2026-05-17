import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import { FiDownload, FiTrash2, FiRefreshCw, FiUpload, FiDatabase } from 'react-icons/fi';

interface Backup {
  filename: string;
  size: number;
  createdAt: string;
}

const Backup: React.FC = () => {
  const { user } = useAuth();
  const [backups, setBackups] = useState<Backup[]>([]);
  const [loading, setLoading] = useState(true);
  const [creatingBackup, setCreatingBackup] = useState(false);
  const [restoringBackup, setRestoringBackup] = useState<string | null>(null);

  useEffect(() => {
    fetchBackups();
  }, []);

  const fetchBackups = async () => {
    try {
      const response = await api.get('/backup');
      setBackups(response.data.backups);
    } catch (error) {
      console.error('Erreur chargement backups', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBackup = async () => {
    setCreatingBackup(true);
    try {
      const response = await api.post('/backup');
      toast.success(`Sauvegarde créée: ${response.data.backup.filename}`);
      fetchBackups();
    } catch (error) {
      toast.error('Erreur lors de la création de la sauvegarde');
    } finally {
      setCreatingBackup(false);
    }
  };

  const handleDownloadBackup = (filename: string) => {
    window.open(`${api.defaults.baseURL}/backup/download/${filename}`, '_blank');
  };

  const handleRestoreBackup = async (filename: string) => {
    if (!confirm(`Restaurer la sauvegarde "${filename}" ? Cette action remplacera toutes les données actuelles.`)) return;
    
    setRestoringBackup(filename);
    try {
      await api.post('/backup/restore', { filename });
      toast.success('Base de données restaurée. Veuillez redémarrer l\'application.');
      setTimeout(() => window.location.reload(), 3000);
    } catch (error) {
      toast.error('Erreur lors de la restauration');
    } finally {
      setRestoringBackup(null);
    }
  };

  const handleDeleteBackup = async (filename: string) => {
    if (!confirm(`Supprimer la sauvegarde "${filename}" ?`)) return;
    
    try {
      await api.delete(`/backup/${filename}`);
      toast.success('Sauvegarde supprimée');
      fetchBackups();
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  if (user?.role !== 'admin') {
    return (
      <div className="p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          Accès non autorisé. Seuls les administrateurs peuvent gérer les sauvegardes.
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">Sauvegarde de la base de données</h1>
        <button
          onClick={handleCreateBackup}
          disabled={creatingBackup}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
        >
          <FiDatabase /> {creatingBackup ? 'Création...' : 'Créer une sauvegarde'}
        </button>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <h2 className="font-semibold text-yellow-800 mb-2">💾 Sauvegarde automatique</h2>
        <p className="text-sm text-yellow-700">
          Les sauvegardes sont créées automatiquement à 2h00 et 14h00 chaque jour.
          Les 10 sauvegardes les plus récentes sont conservées.
        </p>
      </div>

      {loading ? (
        <p className="text-center py-10">Chargement...</p>
      ) : backups.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <FiDatabase className="text-gray-400 text-4xl mx-auto mb-3" />
          <p className="text-gray-500">Aucune sauvegarde disponible</p>
          <p className="text-sm text-gray-400 mt-1">Créez votre première sauvegarde</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fichier</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Taille</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {backups.map((backup) => (
                <tr key={backup.filename} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-mono text-sm">{backup.filename}</td>
                  <td className="px-6 py-4">{new Date(backup.createdAt).toLocaleString('fr-FR')}</td>
                  <td className="px-6 py-4">{formatSize(backup.size)}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleDownloadBackup(backup.filename)}
                        className="text-blue-600 hover:text-blue-800"
                        title="Télécharger"
                      >
                        <FiDownload />
                      </button>
                      <button
                        onClick={() => handleRestoreBackup(backup.filename)}
                        disabled={restoringBackup === backup.filename}
                        className="text-green-600 hover:text-green-800 disabled:opacity-50"
                        title="Restaurer"
                      >
                        <FiUpload />
                      </button>
                      <button
                        onClick={() => handleDeleteBackup(backup.filename)}
                        className="text-red-600 hover:text-red-800"
                        title="Supprimer"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Backup;