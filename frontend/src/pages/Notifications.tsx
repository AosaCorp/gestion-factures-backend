import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import { FiBell, FiBellOff, FiSend, FiUsers } from 'react-icons/fi';

const Notifications: React.FC = () => {
  const { user } = useAuth();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [testTitle, setTestTitle] = useState('');
  const [testBody, setTestBody] = useState('');
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastBody, setBroadcastBody] = useState('');
  const [sendingTest, setSendingTest] = useState(false);
  const [sendingBroadcast, setSendingBroadcast] = useState(false);
  const [serviceWorkerReady, setServiceWorkerReady] = useState(false);

  useEffect(() => {
    checkSubscriptionStatus();
    fetchSubscriptions();
    registerServiceWorker();
  }, []);

  const registerServiceWorker = async () => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker enregistré:', registration);
        setServiceWorkerReady(true);
      } catch (error) {
        console.error('Erreur enregistrement SW:', error);
        toast.error('Impossible d\'enregistrer le service worker');
      }
    } else {
      toast.error('Les notifications push ne sont pas supportées par ce navigateur');
    }
  };

  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const subscribeToPush = async () => {
    if (!serviceWorkerReady) {
      toast.error('Service worker non prêt');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
      
      if (!vapidPublicKey) {
        toast.error('Clé VAPID non configurée');
        return;
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
      });

      // Envoyer l'abonnement au serveur
      await api.post('/push/subscribe', { subscription });
      
      setIsSubscribed(true);
      toast.success('Notifications activées !');
      fetchSubscriptions();
    } catch (error) {
      console.error('Erreur abonnement:', error);
      toast.error('Erreur lors de l\'activation des notifications');
    }
  };

  const unsubscribeFromPush = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        await subscription.unsubscribe();
        await api.post('/push/unsubscribe', { endpoint: subscription.endpoint });
      }
      
      setIsSubscribed(false);
      toast.success('Notifications désactivées');
      fetchSubscriptions();
    } catch (error) {
      console.error('Erreur désabonnement:', error);
      toast.error('Erreur lors de la désactivation');
    }
  };

  const checkSubscriptionStatus = async () => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        setIsSubscribed(!!subscription);
      } catch (error) {
        console.error('Erreur vérification statut:', error);
      }
    }
  };

  const fetchSubscriptions = async () => {
    try {
      const response = await api.get('/push/subscriptions');
      setSubscriptions(response.data);
    } catch (error) {
      console.error('Erreur chargement abonnements:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendTestNotification = async () => {
    setSendingTest(true);
    try {
      await api.post('/push/test', {
        title: testTitle || 'Test de notification',
        body: testBody || 'Ceci est une notification de test'
      });
      toast.success('Notification de test envoyée');
      setTestTitle('');
      setTestBody('');
    } catch (error) {
      toast.error('Erreur lors de l\'envoi');
    } finally {
      setSendingTest(false);
    }
  };

  const sendBroadcast = async () => {
    if (user?.role !== 'admin') {
      toast.error('Seuls les administrateurs peuvent envoyer des notifications à tous');
      return;
    }

    setSendingBroadcast(true);
    try {
      await api.post('/push/broadcast', {
        title: broadcastTitle || 'Information importante',
        body: broadcastBody || 'Nouvelle information disponible'
      });
      toast.success('Notification envoyée à tous les utilisateurs');
      setBroadcastTitle('');
      setBroadcastBody('');
    } catch (error) {
      toast.error('Erreur lors de l\'envoi');
    } finally {
      setSendingBroadcast(false);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
          <FiBell className="text-blue-600" /> Notifications push
        </h1>
        <button
          onClick={isSubscribed ? unsubscribeFromPush : subscribeToPush}
          className={`px-4 py-2 rounded flex items-center gap-2 ${
            isSubscribed 
              ? 'bg-red-600 hover:bg-red-700 text-white' 
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {isSubscribed ? <FiBellOff /> : <FiBell />}
          {isSubscribed ? 'Désactiver' : 'Activer'} les notifications
        </button>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h2 className="font-semibold text-blue-800 mb-2">🔔 Notifications en temps réel</h2>
        <p className="text-sm text-blue-700">
          Activez les notifications pour recevoir des alertes instantanées lors de la création de factures,
          des paiements reçus, des rappels d'impayés, et plus encore.
        </p>
      </div>

      {/* Statut */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${isSubscribed ? 'bg-green-500' : 'bg-gray-400'}`} />
          <span className="font-medium">
            Statut: {isSubscribed ? 'Notifications activées' : 'Notifications désactivées'}
          </span>
        </div>
        {subscriptions.length > 0 && (
          <p className="text-sm text-gray-500 mt-2">
            {subscriptions.length} appareil(s) connecté(s)
          </p>
        )}
      </div>

      {/* Test notification */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <h2 className="text-lg font-semibold mb-4">📱 Tester la notification</h2>
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Titre (optionnel)"
            value={testTitle}
            onChange={(e) => setTestTitle(e.target.value)}
            className="w-full border rounded-md p-2"
          />
          <textarea
            placeholder="Message (optionnel)"
            value={testBody}
            onChange={(e) => setTestBody(e.target.value)}
            rows={2}
            className="w-full border rounded-md p-2"
          />
          <button
            onClick={sendTestNotification}
            disabled={sendingTest || !isSubscribed}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex items-center gap-2 disabled:opacity-50"
          >
            <FiSend /> Envoyer une notification de test
          </button>
        </div>
      </div>

      {/* Broadcast (admin seulement) */}
      {user?.role === 'admin' && (
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <FiUsers /> Envoyer à tous les utilisateurs
          </h2>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Titre"
              value={broadcastTitle}
              onChange={(e) => setBroadcastTitle(e.target.value)}
              className="w-full border rounded-md p-2"
            />
            <textarea
              placeholder="Message"
              value={broadcastBody}
              onChange={(e) => setBroadcastBody(e.target.value)}
              rows={2}
              className="w-full border rounded-md p-2"
            />
            <button
              onClick={sendBroadcast}
              disabled={sendingBroadcast}
              className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 flex items-center gap-2 disabled:opacity-50"
            >
              <FiUsers /> Envoyer à tous
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notifications;