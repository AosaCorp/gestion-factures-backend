import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { OfflineProvider } from './contexts/OfflineContext';
import { DataCacheProvider } from './contexts/DataCacheContext';
import { WebSocketProvider } from './contexts/WebSocketContext';
import Layout from './components/Layout';
import OfflineBanner from './components/OfflineBanner';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import ClientForm from './pages/ClientForm';
import ClientDetail from './pages/ClientDetail';
import Products from './pages/Products';
import ProductForm from './pages/ProductForm';
import ProductDetail from './pages/ProductDetail';
import Invoices from './pages/Invoices';
import InvoiceDetail from './pages/InvoiceDetail';
import InvoiceForm from './pages/InvoiceForm';
import Users from './pages/Users';
import UserForm from './pages/UserForm';
import UserDetail from './pages/UserDetail';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import ApiKeys from './pages/ApiKeys';
import AuditLogs from './pages/AuditLogs';
import Webhooks from './pages/Webhooks';
import Backup from './pages/Backup';
import RateLimitConfig from './pages/RateLimitConfig';
import ApiDocs from './pages/ApiDocs';
import DashboardConfig from './pages/DashboardConfig';
import Notifications from './pages/Notifications';
import StockAlerts from './pages/StockAlerts';
import ThemeDemo from './pages/ThemeDemo';
import Monitoring from './pages/Monitoring';

const PrivateRoute = ({ children }: { children: React.ReactElement }) => { 
  const { token, loading } = useAuth();
  if (loading) return <div>Chargement...</div>;
  return token ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <OfflineProvider>
          <DataCacheProvider>
            <BrowserRouter>
            <WebSocketProvider>
              <Toaster position="top-right" />
              <OfflineBanner />
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/" element={<PrivateRoute><Layout><Dashboard /></Layout></PrivateRoute>} />
                <Route path="/clients" element={<PrivateRoute><Layout><Clients /></Layout></PrivateRoute>} />
                <Route path="/clients/new" element={<PrivateRoute><Layout><ClientForm /></Layout></PrivateRoute>} />
                <Route path="/clients/:id" element={<PrivateRoute><Layout><ClientDetail /></Layout></PrivateRoute>} />
                <Route path="/clients/edit/:id" element={<PrivateRoute><Layout><ClientForm /></Layout></PrivateRoute>} />
                <Route path="/products" element={<PrivateRoute><Layout><Products /></Layout></PrivateRoute>} />
                <Route path="/products/new" element={<PrivateRoute><Layout><ProductForm /></Layout></PrivateRoute>} />
                <Route path="/products/:id" element={<PrivateRoute><Layout><ProductDetail /></Layout></PrivateRoute>} />
                <Route path="/products/edit/:id" element={<PrivateRoute><Layout><ProductForm /></Layout></PrivateRoute>} />
                <Route path="/invoices" element={<PrivateRoute><Layout><Invoices /></Layout></PrivateRoute>} />
                <Route path="/invoices/new" element={<PrivateRoute><Layout><InvoiceForm /></Layout></PrivateRoute>} />
                <Route path="/invoices/:id" element={<PrivateRoute><Layout><InvoiceDetail /></Layout></PrivateRoute>} />
                <Route path="/invoices/edit/:id" element={<PrivateRoute><Layout><InvoiceForm /></Layout></PrivateRoute>} />
                <Route path="/users" element={<PrivateRoute><Layout><Users /></Layout></PrivateRoute>} />
                <Route path="/users/new" element={<PrivateRoute><Layout><UserForm /></Layout></PrivateRoute>} />
                <Route path="/users/:id" element={<PrivateRoute><Layout><UserDetail /></Layout></PrivateRoute>} />
                <Route path="/users/edit/:id" element={<PrivateRoute><Layout><UserForm /></Layout></PrivateRoute>} />
                <Route path="/reports" element={<PrivateRoute><Layout><Reports /></Layout></PrivateRoute>} />
                <Route path="/settings" element={<PrivateRoute><Layout><Settings /></Layout></PrivateRoute>} />
                <Route path="/api-keys" element={<PrivateRoute><Layout><ApiKeys /></Layout></PrivateRoute>} />
                <Route path="/audit-logs" element={<PrivateRoute><Layout><AuditLogs /></Layout></PrivateRoute>} />
                <Route path="/webhooks" element={<PrivateRoute><Layout><Webhooks /></Layout></PrivateRoute>} />
                <Route path="/backup" element={<PrivateRoute><Layout><Backup /></Layout></PrivateRoute>} />
                <Route path="/rate-limit" element={<PrivateRoute><Layout><RateLimitConfig /></Layout></PrivateRoute>} />
                <Route path="/api-docs" element={<PrivateRoute><Layout><ApiDocs /></Layout></PrivateRoute>} />
                <Route path="/dashboard-config" element={<PrivateRoute><Layout><DashboardConfig /></Layout></PrivateRoute>} />
                <Route path="/notifications" element={<PrivateRoute><Layout><Notifications /></Layout></PrivateRoute>} />
                <Route path="/stock-alerts" element={<PrivateRoute><Layout><StockAlerts /></Layout></PrivateRoute>} />
                <Route path="/theme-demo" element={<PrivateRoute><Layout><ThemeDemo /></Layout></PrivateRoute>} />
                <Route path="/monitoring" element={<PrivateRoute><Layout><Monitoring /></Layout></PrivateRoute>} />
              </Routes>
              </WebSocketProvider>
            </BrowserRouter>
          </DataCacheProvider>
        </OfflineProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;