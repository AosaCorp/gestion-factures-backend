import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const { login, twoFactorPending, verifyTwoFactor } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    console.log('Submitting login with', { email, password, twoFactorPending });
    try {
      if (twoFactorPending) {
        await verifyTwoFactor(code);
        console.log('2FA success');
        navigate('/');
      } else {
        await login(email, password);
        console.log('Login success');
        navigate('/');
      }
    } catch (err: any) {
      console.error('Erreur détaillée:', err);
      setError(err.message || 'Erreur de connexion');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded shadow-md w-96">
        <img src="/logo.png" alt="Logo" className="h-16 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-6 text-center">Connexion</h2>
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          {!twoFactorPending ? (
            <>
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
            </>
          ) : (
            <div className="mb-4">
              <label className="block text-gray-700">Code 2FA</label>
              <input
                type="text"
                className="w-full border px-3 py-2 rounded"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
              />
            </div>
          )}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
          >
            {twoFactorPending ? 'Vérifier' : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;