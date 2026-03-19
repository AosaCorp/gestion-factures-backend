import React, { createContext, useState, useContext, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  twoFactorPending: boolean;
  verifyTwoFactor: (code: string) => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [twoFactorPending, setTwoFactorPending] = useState(false);
  const [tempToken, setTempToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Charger l'utilisateur si un token existe
  useEffect(() => {
    const loadUser = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const response = await api.get('/auth/me');
        setUser(response.data);
      } catch (error) {
        console.error('Erreur chargement utilisateur', error);
        localStorage.removeItem('token');
        setToken(null);
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, [token]);

  const login = async (email: string, password: string) => {
    try {
      console.log('Login appel avec', email, password);
      const response = await api.post('/auth/login', { email, password });
      console.log('Réponse brute:', response.data);
      if (response.data.twoFactorRequired) {
        setTwoFactorPending(true);
        setTempToken(response.data.tempToken);
        toast('Code 2FA requis', { icon: '🔐' });
      } else {
        localStorage.setItem('token', response.data.token);
        setToken(response.data.token);
        setUser(response.data.user);
        toast.success('Connexion réussie');
      }
    } catch (error: any) {
      console.error('Erreur dans login:', error);
      const message = error.response?.data?.message || 'Erreur de connexion';
      toast.error(message);
      throw new Error(message);
    }
  };

  const verifyTwoFactor = async (code: string) => {
    try {
      const response = await api.post('/auth/verify-2fa', { tempToken, token: code });
      localStorage.setItem('token', response.data.token);
      setToken(response.data.token);
      setUser(response.data.user);
      setTwoFactorPending(false);
      setTempToken(null);
      toast.success('Connexion réussie');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Code 2FA invalide';
      toast.error(message);
      throw new Error(message);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, twoFactorPending, verifyTwoFactor, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};