import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useOffline } from '../contexts/OfflineContext';
import { useTheme } from '../contexts/ThemeContext';
import ThemeToggle from './ThemeToggle';
import { 
  FiHome, FiUsers, FiPackage, FiFileText, FiLogOut, 
  FiSettings, FiBarChart2, FiUser, FiRefreshCw, FiKey, 
  FiActivity, FiLink, FiDatabase, FiShield, FiBookOpen, FiBell, FiGrid
} from 'react-icons/fi';
import toast from 'react-hot-toast';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const { isOffline, pendingActionsCount, syncPendingActions, pendingSync } = useOffline();
  const { theme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSync = async () => {
    if (pendingActionsCount === 0) {
      toast('Aucune donnée à synchroniser', { icon: '✅' });
      return;
    }
    toast.loading(`Synchronisation de ${pendingActionsCount} élément(s)...`, { id: 'sync' });
    await syncPendingActions();
    toast.success('Synchronisation terminée', { id: 'sync' });
  };

  const isAdmin = user?.role === 'admin';
  const isManager = user?.role === 'manager';
  const canViewReports = isAdmin || isManager;

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-dark-bg flex flex-col">
      {/* Barre de navigation fixe en haut */}
      <header className="bg-white dark:bg-dark-card shadow-md sticky top-0 z-10">
        <div className="flex items-center justify-between px-3 py-2">
          {/* Logo */}
          <div className="flex items-center shrink-0">
            <img src="/logo.png" alt="Logo" className="h-8 w-auto" />
          </div>

          {/* Menu défilable horizontalement */}
          <nav className="flex-1 overflow-x-auto whitespace-nowrap scrollbar-hide px-2">
            <ul className="flex items-center space-x-3 md:space-x-4">
              <li>
                <Link to="/" className="flex flex-col items-center md:flex-row text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 text-xs md:text-sm">
                  <FiHome className="text-lg md:mr-1" />
                  <span className="hidden md:inline">Dashboard</span>
                </Link>
              </li>
              <li>
                <Link to="/clients" className="flex flex-col items-center md:flex-row text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 text-xs md:text-sm">
                  <FiUsers className="text-lg md:mr-1" />
                  <span className="hidden md:inline">Clients</span>
                </Link>
              </li>
              <li>
                <Link to="/products" className="flex flex-col items-center md:flex-row text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 text-xs md:text-sm">
                  <FiPackage className="text-lg md:mr-1" />
                  <span className="hidden md:inline">Produits</span>
                </Link>
              </li>
              <li>
                <Link to="/invoices" className="flex flex-col items-center md:flex-row text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 text-xs md:text-sm">
                  <FiFileText className="text-lg md:mr-1" />
                  <span className="hidden md:inline">Factures</span>
                </Link>
              </li>
              {canViewReports && (
                <li>
                  <Link to="/reports" className="flex flex-col items-center md:flex-row text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 text-xs md:text-sm">
                    <FiBarChart2 className="text-lg md:mr-1" />
                    <span className="hidden md:inline">Rapports</span>
                  </Link>
                </li>
              )}
              {isAdmin && (
                <>
                  <li>
                    <Link to="/users" className="flex flex-col items-center md:flex-row text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 text-xs md:text-sm">
                      <FiUser className="text-lg md:mr-1" />
                      <span className="hidden md:inline">Utilisateurs</span>
                    </Link>
                  </li>
                  <li>
                    <Link to="/settings" className="flex flex-col items-center md:flex-row text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 text-xs md:text-sm">
                      <FiSettings className="text-lg md:mr-1" />
                      <span className="hidden md:inline">Paramètres</span>
                    </Link>
                  </li>
                  <li>
                    <Link to="/api-keys" className="flex flex-col items-center md:flex-row text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 text-xs md:text-sm">
                      <FiKey className="text-lg md:mr-1" />
                      <span className="hidden md:inline">API Keys</span>
                    </Link>
                  </li>
                  <li>
                    <Link to="/audit-logs" className="flex flex-col items-center md:flex-row text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 text-xs md:text-sm">
                      <FiActivity className="text-lg md:mr-1" />
                      <span className="hidden md:inline">Audit</span>
                    </Link>
                  </li>
                  <li>
                    <Link to="/webhooks" className="flex flex-col items-center md:flex-row text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 text-xs md:text-sm">
                      <FiLink className="text-lg md:mr-1" />
                      <span className="hidden md:inline">Webhooks</span>
                    </Link>
                  </li>
                  <li>
                    <Link to="/backup" className="flex flex-col items-center md:flex-row text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 text-xs md:text-sm">
                      <FiDatabase className="text-lg md:mr-1" />
                      <span className="hidden md:inline">Backup</span>
                    </Link>
                  </li>
                  <li>
                    <Link to="/rate-limit" className="flex flex-col items-center md:flex-row text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 text-xs md:text-sm">
                      <FiShield className="text-lg md:mr-1" />
                      <span className="hidden md:inline">Rate Limit</span>
                    </Link>
                  </li>
                  <li>
                    <Link to="/api-docs" className="flex flex-col items-center md:flex-row text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 text-xs md:text-sm">
                      <FiBookOpen className="text-lg md:mr-1" />
                      <span className="hidden md:inline">API Docs</span>
                    </Link>
                  </li>
                  <li>
                    <Link to="/dashboard-config" className="flex flex-col items-center md:flex-row text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 text-xs md:text-sm">
                      <FiGrid className="text-lg md:mr-1" />
                      <span className="hidden md:inline">Personnaliser</span>
                    </Link>
                  </li>
                  <li>
                    <Link to="/notifications" className="flex flex-col items-center md:flex-row text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 text-xs md:text-sm">
                      <FiBell className="text-lg md:mr-1" />
                      <span className="hidden md:inline">Notifications</span>
                    </Link>
                  </li>
                  <li>
                    <Link to="/stock-alerts" className="flex flex-col items-center md:flex-row text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 text-xs md:text-sm">
                      <FiPackage className="text-lg md:mr-1" />
                      <span className="hidden md:inline">Stocks</span>
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </nav>

          {/* Zone des actions : Thème + Synchronisation + Déconnexion */}
          <div className="flex items-center gap-2 shrink-0">
            <ThemeToggle />
            
            {/* Bouton de synchronisation */}
            {!isOffline && pendingActionsCount > 0 && (
              <button
                onClick={handleSync}
                disabled={pendingSync}
                className="flex items-center gap-1 bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1.5 rounded-lg text-sm transition-colors disabled:opacity-50"
                title={`${pendingActionsCount} action(s) en attente de synchronisation`}
              >
                <FiRefreshCw className={`${pendingSync ? 'animate-spin' : ''}`} size={16} />
                <span className="hidden sm:inline">Sync ({pendingActionsCount})</span>
              </button>
            )}

            {/* Indicateur hors ligne */}
            {isOffline && (
              <div className="flex items-center gap-1 bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300 px-2 py-1 rounded-lg text-xs">
                <FiRefreshCw className="opacity-50" size={12} />
                <span className="hidden sm:inline">Hors ligne</span>
              </div>
            )}

            {/* Déconnexion */}
            <button 
              onClick={handleLogout} 
              className="text-gray-700 hover:text-red-600 dark:text-gray-300 dark:hover:text-red-400" 
              title="Déconnexion"
            >
              <FiLogOut size={22} />
            </button>
          </div>
        </div>
      </header>

      {/* Bannière d'information hors ligne */}
      {isOffline && (
        <div className="bg-yellow-100 dark:bg-yellow-900 border-b border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-300 text-xs py-1 px-4 text-center">
          📱 Mode hors ligne - Les modifications seront synchronisées automatiquement au retour de la connexion
        </div>
      )}

      {/* Contenu principal */}
      <main className="flex-1 p-4 md:p-6">
        {children}
      </main>
    </div>
  );
};

export default Layout;