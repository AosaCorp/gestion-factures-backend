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
      {/* Barre de navigation horizontale avec défilement si nécessaire */}
      <header className="bg-white shadow-md sticky top-0 z-10">
        <div className="flex items-center justify-between px-4 py-2">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <img src="/logo.png" alt="Logo" className="h-8 w-auto" />
            <span className="font-bold text-gray-800 hidden sm:inline">Gestion Factures</span>
          </div>

          {/* Menu défilable horizontalement */}
          <nav className="flex-1 overflow-x-auto whitespace-nowrap scrollbar-hide px-2">
            <ul className="flex items-center space-x-4 text-sm">
              <li><Link to="/" className="flex items-center text-gray-700 hover:text-blue-600"><FiHome className="mr-1" /> Dashboard</Link></li>
              <li><Link to="/clients" className="flex items-center text-gray-700 hover:text-blue-600"><FiUsers className="mr-1" /> Clients</Link></li>
              <li><Link to="/products" className="flex items-center text-gray-700 hover:text-blue-600"><FiPackage className="mr-1" /> Produits</Link></li>
              <li><Link to="/invoices" className="flex items-center text-gray-700 hover:text-blue-600"><FiFileText className="mr-1" /> Factures</Link></li>
              {canViewReports && (
                <li><Link to="/reports" className="flex items-center text-gray-700 hover:text-blue-600"><FiBarChart2 className="mr-1" /> Rapports</Link></li>
              )}
              {isAdmin && (
                <>
                  <li><Link to="/users" className="flex items-center text-gray-700 hover:text-blue-600"><FiUser className="mr-1" /> Utilisateurs</Link></li>
                  <li><Link to="/settings" className="flex items-center text-gray-700 hover:text-blue-600"><FiSettings className="mr-1" /> Paramètres</Link></li>
                </>
              )}
            </ul>
          </nav>

          {/* Utilisateur + déconnexion */}
          <div className="flex items-center space-x-3 text-sm">
            <span className="hidden sm:inline text-gray-600">{user?.name} ({user?.role})</span>
            <button onClick={handleLogout} className="text-gray-700 hover:text-red-600" title="Déconnexion">
              <FiLogOut size={20} />
            </button>
          </div>
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