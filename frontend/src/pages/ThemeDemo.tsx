import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { FiSun, FiMoon, FiMonitor } from 'react-icons/fi';

const ThemeDemo: React.FC = () => {
  const { theme, toggleTheme, setTheme } = useTheme();

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Aperçu du thème</h1>
      
      {/* Statut actuel */}
      <div className="bg-white dark:bg-dark-card rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
          Thème actuel: {theme === 'light' ? 'Clair ☀️' : 'Sombre 🌙'}
        </h2>
        
        <div className="flex flex-wrap gap-3">
          <button
            onClick={toggleTheme}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
          >
            {theme === 'light' ? <FiMoon /> : <FiSun />}
            Basculer en mode {theme === 'light' ? 'sombre' : 'clair'}
          </button>
          
          <button
            onClick={() => setTheme('light')}
            className={`px-4 py-2 rounded flex items-center gap-2 ${theme === 'light' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
          >
            <FiSun /> Clair
          </button>
          
          <button
            onClick={() => setTheme('dark')}
            className={`px-4 py-2 rounded flex items-center gap-2 ${theme === 'dark' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
          >
            <FiMoon /> Sombre
          </button>
          
          <button
            onClick={() => {
              if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                setTheme('dark');
              } else {
                setTheme('light');
              }
            }}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600 flex items-center gap-2"
          >
            <FiMonitor /> Système
          </button>
        </div>
      </div>

      {/* Grille de démonstration */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white dark:bg-dark-card rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Carte 1</h3>
          <p className="text-gray-600 dark:text-gray-400">Ceci est un exemple de texte dans une carte.</p>
          <button className="mt-4 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">
            Bouton d'action
          </button>
        </div>
        
        <div className="bg-white dark:bg-dark-card rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Carte 2</h3>
          <p className="text-gray-600 dark:text-gray-400">Les couleurs s'adaptent automatiquement au thème.</p>
          <div className="mt-4 flex gap-2">
            <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full text-xs">Succès</span>
            <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded-full text-xs">Attention</span>
            <span className="px-2 py-1 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-full text-xs">Erreur</span>
          </div>
        </div>
      </div>

      {/* Tableau de démonstration */}
      <div className="bg-white dark:bg-dark-card rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Nom</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            <tr className="hover:bg-gray-50 dark:hover:bg-gray-800">
              <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">Jean Dupont</td>
              <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">jean@example.com</td>
              <td className="px-6 py-4">
                <span className="px-2 py-1 text-xs rounded-full bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">Actif</span>
              </td>
            </tr>
            <tr className="hover:bg-gray-50 dark:hover:bg-gray-800">
              <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">Marie Martin</td>
              <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">marie@example.com</td>
              <td className="px-6 py-4">
                <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200">En attente</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
        <p>Le thème est sauvegardé dans votre navigateur et persiste entre les sessions.</p>
      </div>
    </div>
  );
};

export default ThemeDemo;