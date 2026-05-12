import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useOffline } from '../contexts/OfflineContext';
import { FiWifiOff, FiWifi } from 'react-icons/fi';
import toast from 'react-hot-toast';

const Login: React.FC = () => {
  const [email, setEmail] = useState('admin@example.com');
  const [password, setPassword] = useState('admin123');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const { login, twoFactorPending, verifyTwoFactor } = useAuth();
  const { isOffline, savePendingAction } = useOffline();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Si hors ligne, on ne peut pas se connecter
    if (isOffline || !navigator.onLine) {
      // Vérifier si un token existe déjà dans localStorage
      const existingToken = localStorage.getItem('token');
      if (existingToken) {
        // Rediriger vers le dashboard si déjà connecté
        navigate('/');
        return;
      }
      setError('Mode hors ligne - Impossible de se connecter. Veuillez vous connecter une première fois en ligne.');
      return;
    }
    
    try {
      if (twoFactorPending) {
        await verifyTwoFactor(code);
        navigate('/');
      } else {
        await login(email, password);
        navigate('/');
      }
    } catch (err: any) {
      console.error('Erreur détaillée:', err);
      setError(err.message || 'Erreur de connexion');
    }
  };

  // Vérifier si déjà connecté
  const isAlreadyLoggedIn = !!localStorage.getItem('token');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded shadow-md w-96">
        <img src="/logo.png" alt="Logo" className="h-16 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-6 text-center">Connexion</h2>
        
        {isAlreadyLoggedIn && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-2 rounded mb-4 text-sm">
            ✅ Vous êtes déjà connecté. <button onClick={() => navigate('/')} className="underline">Accéder au tableau de bord</button>
          </div>
        )}
        
        <div className={`mb-4 p-2 rounded text-center text-sm flex items-center justify-center gap-2 ${
          isOffline ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
        }`}>
          {isOffline ? <FiWifiOff /> : <FiWifi />}
          {isOffline ? 'Mode hors ligne actif' : 'Connecté à internet'}
        </div>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 text-sm">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700">Email</label>
            <input
              type="email"
              className="w-full border px-3 py-2 rounded"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">Mot de passe</label>
            <input
              type="password"
              className="w-full border px-3 py-2 rounded"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 py-2 rounded text-white transition-colors"
          >
            Se connecter
          </button>
        </form>
        
        {isOffline && (
          <p className="text-center text-yellow-600 text-xs mt-4">
            💡 Connectez-vous une première fois en ligne pour utiliser l'application hors ligne
          </p>
        )}
      </div>
    </div>
  );
};

export default Login;