import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  FiHome, FiUsers, FiPackage, FiFileText, FiLogOut, 
  FiSettings, FiBarChart2, FiUser 
} from 'react-icons/fi';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isAdmin = user?.role === 'admin';
  const isManager = user?.role === 'manager';
  const canViewReports = isAdmin || isManager;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Barre de navigation fixe en haut */}
      <header className="bg-white shadow-md sticky top-0 z-10">
        <div className="flex items-center justify-between px-3 py-2">
          {/* Logo (optionnel sur mobile) */}
          <div className="flex items-center shrink-0">
            <img src="/logo.png" alt="Logo" className="h-8 w-auto" />
          </div>

          {/* Menu défilable horizontalement : sur très petit écran, cacher les textes */}
          <nav className="flex-1 overflow-x-auto whitespace-nowrap scrollbar-hide px-2">
            <ul className="flex items-center space-x-3 md:space-x-4">
              <li>
                <Link to="/" className="flex flex-col items-center md:flex-row text-gray-700 hover:text-blue-600 text-xs md:text-sm">
                  <FiHome className="text-lg md:mr-1" />
                  <span className="hidden md:inline">Dashboard</span>
                </Link>
              </li>
              <li>
                <Link to="/clients" className="flex flex-col items-center md:flex-row text-gray-700 hover:text-blue-600 text-xs md:text-sm">
                  <FiUsers className="text-lg md:mr-1" />
                  <span className="hidden md:inline">Clients</span>
                </Link>
              </li>
              <li>
                <Link to="/products" className="flex flex-col items-center md:flex-row text-gray-700 hover:text-blue-600 text-xs md:text-sm">
                  <FiPackage className="text-lg md:mr-1" />
                  <span className="hidden md:inline">Produits</span>
                </Link>
              </li>
              <li>
                <Link to="/invoices" className="flex flex-col items-center md:flex-row text-gray-700 hover:text-blue-600 text-xs md:text-sm">
                  <FiFileText className="text-lg md:mr-1" />
                  <span className="hidden md:inline">Factures</span>
                </Link>
              </li>
              {canViewReports && (
                <li>
                  <Link to="/reports" className="flex flex-col items-center md:flex-row text-gray-700 hover:text-blue-600 text-xs md:text-sm">
                    <FiBarChart2 className="text-lg md:mr-1" />
                    <span className="hidden md:inline">Rapports</span>
                  </Link>
                </li>
              )}
              {isAdmin && (
                <>
                  <li>
                    <Link to="/users" className="flex flex-col items-center md:flex-row text-gray-700 hover:text-blue-600 text-xs md:text-sm">
                      <FiUser className="text-lg md:mr-1" />
                      <span className="hidden md:inline">Utilisateurs</span>
                    </Link>
                  </li>
                  <li>
                    <Link to="/settings" className="flex flex-col items-center md:flex-row text-gray-700 hover:text-blue-600 text-xs md:text-sm">
                      <FiSettings className="text-lg md:mr-1" />
                      <span className="hidden md:inline">Paramètres</span>
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </nav>

          {/* Déconnexion (icône seulement) */}
          <button onClick={handleLogout} className="shrink-0 text-gray-700 hover:text-red-600 ml-2" title="Déconnexion">
            <FiLogOut size={22} />
          </button>
        </div>
      </header>

      {/* Contenu principal */}
      <main className="flex-1 p-4 md:p-6">
        {children}
      </main>
    </div>
  );
};

export default Layout;