import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
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

const PrivateRoute = ({ children }: { children: React.ReactElement }) => { 
  const { token, loading } = useAuth();
  if (loading) return <div>Chargement...</div>;
  return token ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" />
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
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;