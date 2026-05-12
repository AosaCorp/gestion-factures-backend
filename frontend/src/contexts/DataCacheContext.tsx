import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

interface DataCacheContextType {
  cachedClients: any[];
  cachedProducts: any[];
  cachedInvoices: any[];
  isLoadingCache: boolean;
  refreshCache: () => Promise<void>;
  getCachedData: (key: string) => any;
  saveToCache: (key: string, data: any) => void;
  hasCache: boolean;
}

const DataCacheContext = createContext<DataCacheContextType | undefined>(undefined);

export const useDataCache = () => {
  const context = useContext(DataCacheContext);
  if (!context) {
    throw new Error('useDataCache must be used within a DataCacheProvider');
  }
  return context;
};

interface DataCacheProviderProps {
  children: ReactNode;
}

export const DataCacheProvider: React.FC<DataCacheProviderProps> = ({ children }) => {
  const [cachedClients, setCachedClients] = useState<any[]>([]);
  const [cachedProducts, setCachedProducts] = useState<any[]>([]);
  const [cachedInvoices, setCachedInvoices] = useState<any[]>([]);
  const [isLoadingCache, setIsLoadingCache] = useState(true);
  const [hasCache, setHasCache] = useState(false);

  // Charger le cache au démarrage
  useEffect(() => {
    loadFromCache();
  }, []);

  const loadFromCache = () => {
    try {
      const clients = localStorage.getItem('cached_clients');
      const products = localStorage.getItem('cached_products');
      const invoices = localStorage.getItem('cached_invoices');
      
      if (clients) {
        setCachedClients(JSON.parse(clients));
        setHasCache(true);
      }
      if (products) setCachedProducts(JSON.parse(products));
      if (invoices) setCachedInvoices(JSON.parse(invoices));
    } catch (error) {
      console.error('Erreur chargement cache:', error);
    } finally {
      setIsLoadingCache(false);
    }
  };

  const saveToCache = (key: string, data: any) => {
    try {
      localStorage.setItem(`cached_${key}`, JSON.stringify(data));
      if (key === 'clients') {
        setCachedClients(data);
        if (data.length > 0) setHasCache(true);
      }
      if (key === 'products') setCachedProducts(data);
      if (key === 'invoices') setCachedInvoices(data);
      console.log(`✅ Données ${key} mises en cache (${data.length} éléments)`);
    } catch (error) {
      console.error('Erreur sauvegarde cache:', error);
    }
  };

  const refreshCache = async () => {
    if (!navigator.onLine) {
      console.log('⚠️ Hors ligne - Impossible de rafraîchir le cache');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('⚠️ Non connecté - Impossible de rafraîchir le cache');
        return;
      }
      
      console.log('🔄 Rafraîchissement du cache...');
      
      const [clientsRes, productsRes, invoicesRes] = await Promise.all([
        api.get('/clients/all').catch(() => ({ data: [] })),
        api.get('/products/all').catch(() => ({ data: [] })),
        api.get('/invoices/all').catch(() => ({ data: [] }))
      ]);
      
      if (clientsRes.data) saveToCache('clients', clientsRes.data);
      if (productsRes.data) saveToCache('products', productsRes.data);
      if (invoicesRes.data) saveToCache('invoices', invoicesRes.data);
      
      toast.success('Cache mis à jour');
      console.log('✅ Cache rafraîchi avec succès');
    } catch (error) {
      console.error('Erreur rafraîchissement cache:', error);
    }
  };

  const getCachedData = (key: string) => {
    try {
      const data = localStorage.getItem(`cached_${key}`);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  };

  return (
    <DataCacheContext.Provider
      value={{
        cachedClients,
        cachedProducts,
        cachedInvoices,
        isLoadingCache,
        refreshCache,
        getCachedData,
        saveToCache,
        hasCache
      }}
    >
      {children}
    </DataCacheContext.Provider>
  );
};