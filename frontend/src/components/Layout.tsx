import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FiHome, FiUsers, FiPackage, FiFileText, FiLogOut, FiSettings, FiBarChart2, FiUser } from 'react-icons/fi';

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
    <div className="min-h-screen bg-gray-100">
      {/* Barre de navigation horizontale */}
      <header className="bg-white shadow-md">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo et nom de l'application */}
            <div className="flex items-center space-x-2">
              <img src="/logo.png" alt="Logo" className="h-10 w-auto" />
              <span className="font-bold text-lg text-gray-800">Gestion Factures</span>
            </div>

            {/* Liens de navigation */}
            <nav className="flex items-center space-x-6">
              <Link to="/" className="flex items-center text-gray-700 hover:text-blue-600 transition-colors">
                <FiHome className="mr-1" /> Dashboard
              </Link>
              <Link to="/clients" className="flex items-center text-gray-700 hover:text-blue-600 transition-colors">
                <FiUsers className="mr-1" /> Clients
              </Link>
              <Link to="/products" className="flex items-center text-gray-700 hover:text-blue-600 transition-colors">
                <FiPackage className="mr-1" /> Produits
              </Link>
              <Link to="/invoices" className="flex items-center text-gray-700 hover:text-blue-600 transition-colors">
                <FiFileText className="mr-1" /> Factures
              </Link>
              {canViewReports && (
                <Link to="/reports" className="flex items-center text-gray-700 hover:text-blue-600 transition-colors">
                  <FiBarChart2 className="mr-1" /> Rapports
                </Link>
              )}
              {isAdmin && (
                <>
                  <Link to="/users" className="flex items-center text-gray-700 hover:text-blue-600 transition-colors">
                    <FiUser className="mr-1" /> Utilisateurs
                  </Link>
                  <Link to="/settings" className="flex items-center text-gray-700 hover:text-blue-600 transition-colors">
                    <FiSettings className="mr-1" /> Paramètres
                  </Link>
                </>
              )}
            </nav>

            {/* Informations utilisateur et déconnexion */}
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {user?.name} ({user?.role === 'admin' ? 'Admin' : user?.role === 'cashier' ? 'Caissier' : 'Gestionnaire'})
              </span>
              <button
                onClick={handleLogout}
                className="flex items-center text-gray-700 hover:text-red-600 transition-colors"
                title="Déconnexion"
              >
                <FiLogOut size={20} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Contenu principal */}
      <main className="container mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
};

export default Layout;