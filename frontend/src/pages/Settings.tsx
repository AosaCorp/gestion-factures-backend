import React, { useState, useEffect } from 'react';
import { companyService, Company } from '../services/companyService';
import { userService } from '../services/userService';
import { clientService } from '../services/clientService';
import { invoiceService } from '../services/invoiceService';
import api from '../services/api';
import toast from 'react-hot-toast';

type TabType = 'general' | 'financial' | 'logo' | 'system';

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('general');
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [systemInfo, setSystemInfo] = useState<any>({
    users: 0,
    clients: 0,
    invoices: 0,
    totalRevenue: 0,
    uptime: 'En ligne',
    memory: '25.81 MB',
    dbSize: '80 KB'
  });

  useEffect(() => {
    fetchCompany();
    fetchSystemInfo();
  }, []);

  const fetchCompany = async () => {
    try {
      const data = await companyService.get();
      setCompany(data);
      if (data.logo) {
        setLogoPreview(`http://127.0.0.1:5001/${data.logo}`);
      }
    } catch (error) {
      toast.error('Erreur chargement');
    } finally {
      setLoading(false);
    }
  };

  const fetchSystemInfo = async () => {
    try {
      const users = await userService.getAll();
      const clients = await clientService.getAll();
      const invoices = await invoiceService.getAll();
      const statsResponse = await api.get('/stats');
      const stats = statsResponse.data;

      setSystemInfo({
        users: users.length,
        clients: clients.length,
        invoices: invoices.length,
        totalRevenue: stats.totalRevenue || 0,
        uptime: 'En ligne',
        memory: '25.81 MB',
        dbSize: '80 KB'
      });
    } catch (error) {
      console.error('Erreur chargement infos système', error);
      toast.error('Erreur lors du chargement des informations système');
    }
  };

  const handleGeneralChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCompany(prev => prev ? { ...prev, [name]: value } : null);
  };

  const handleFinancialChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCompany(prev => prev ? { ...prev, [name]: value } : null);
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Le fichier ne doit pas dépasser 5MB');
        return;
      }
      if (!file.type.match(/image\/(jpeg|png|gif)/)) {
        toast.error('Format accepté: JPG, PNG, GIF');
        return;
      }
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleGeneralSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company) return;
    try {
      await companyService.update(company);
      toast.success('Informations générales mises à jour');
    } catch (error) {
      toast.error('Erreur mise à jour');
    }
  };

  const handleFinancialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company) return;
    try {
      await companyService.update(company);
      toast.success('Paramètres financiers mis à jour');
    } catch (error) {
      toast.error('Erreur mise à jour');
    }
  };

  const handleLogoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!logoFile) {
      toast.error('Veuillez sélectionner un fichier');
      return;
    }
    try {
      await companyService.uploadLogo(logoFile);
      toast.success('Logo mis à jour');
      fetchCompany();
    } catch (error) {
      toast.error('Erreur upload');
    }
  };

  if (loading) return <div className="flex justify-center items-center h-64">Chargement...</div>;

  const renderGeneralTab = () => (
    <form onSubmit={handleGeneralSubmit} className="space-y-6">
      <h2 className="text-xl font-semibold mb-4">Informations de l'association</h2>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Nom de l'association</label>
        <input
          type="text"
          name="name"
          value={company?.name || ''}
          onChange={handleGeneralChange}
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Mon Association"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Adresse</label>
        <textarea
          name="address"
          value={company?.address || ''}
          onChange={handleGeneralChange}
          rows={3}
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Yaoundé, Cameroun"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Téléphone</label>
          <input
            type="tel"
            name="phone"
            value={company?.phone || ''}
            onChange={handleGeneralChange}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="+237 6XX XXX XXX"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
          <input
            type="email"
            name="email"
            value={company?.email || ''}
            onChange={handleGeneralChange}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="contact@association.com"
          />
        </div>
      </div>
      <div className="pt-4">
        <button
          type="submit"
          className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Enregistrer les modifications
        </button>
      </div>
    </form>
  );

  const renderFinancialTab = () => (
    <form onSubmit={handleFinancialSubmit} className="space-y-6">
      <h2 className="text-xl font-semibold mb-4">Paramètres financiers</h2>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Taux de TVA (%)</label>
        <input
          type="number"
          name="taxRate"
          value={company?.taxRate || 19.25}
          onChange={handleFinancialChange}
          step="0.01"
          min="0"
          max="100"
          className="w-32 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <p className="text-sm text-gray-500 mt-1">Taux de TVA par défaut pour les produits</p>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Devise</label>
        <div className="flex items-center space-x-2">
          <span className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-md">XAF</span>
          <span className="text-sm text-gray-500">La devise ne peut pas être modifiée</span>
        </div>
      </div>
      <div className="pt-4">
        <button
          type="submit"
          className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Enregistrer les modifications
        </button>
      </div>
    </form>
  );

  const renderLogoTab = () => (
    <form onSubmit={handleLogoSubmit} className="space-y-6">
      <h2 className="text-xl font-semibold mb-4">Logo de l'association</h2>
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
        {logoPreview ? (
          <div className="mb-4">
            <img src={logoPreview} alt="Logo preview" className="max-h-48 mx-auto object-contain" />
          </div>
        ) : (
          <div className="text-gray-500 mb-4">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        <input
          type="file"
          id="logo-upload"
          accept="image/jpeg,image/png,image/gif"
          onChange={handleLogoChange}
          className="hidden"
        />
        <label
          htmlFor="logo-upload"
          className="cursor-pointer inline-block bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Choisir un fichier
        </label>
        <p className="text-sm text-gray-500 mt-2">Formats acceptés: JPG, PNG, GIF (max 5MB)</p>
      </div>
      {logoFile && (
        <div className="pt-4">
          <button
            type="submit"
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Uploader le logo
          </button>
        </div>
      )}
    </form>
  );

  const renderSystemTab = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold mb-4">Informations système</h2>
      <div className="bg-gray-50 rounded-lg p-6">
        <div className="space-y-4">
          <div className="flex justify-between items-center border-b pb-2">
            <span className="font-medium">Serveur</span>
            <span className="text-gray-600">Node.js v23.6.1</span>
          </div>
          <div className="flex justify-between items-center border-b pb-2">
            <span className="font-medium">Statistiques</span>
            <span className="text-gray-600">{systemInfo.users} utilisateurs, {systemInfo.clients} clients, {systemInfo.invoices} factures</span>
          </div>
          <div className="flex justify-between items-center border-b pb-2">
            <span className="font-medium">Temps de fonctionnement</span>
            <span className="text-gray-600">{systemInfo.uptime}</span>
          </div>
          <div className="flex justify-between items-center border-b pb-2">
            <span className="font-medium">Mémoire utilisée</span>
            <span className="text-gray-600">{systemInfo.memory}</span>
          </div>
          <div className="flex justify-between items-center pb-2">
            <span className="font-medium">Base de données</span>
            <span className="text-gray-600">SQLite 3 ({systemInfo.dbSize})</span>
          </div>
        </div>
      </div>
      <div className="pt-4">
        <button
          onClick={() => window.location.reload()}
          className="bg-gray-600 text-white px-6 py-2 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
        >
          Actualiser
        </button>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Paramètres</h1>
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          {(['general', 'financial', 'logo', 'system'] as TabType[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2 px-1 border-b-2 font-medium text-sm capitalize ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab === 'general' ? 'Général' : tab === 'financial' ? 'Financier' : tab === 'logo' ? 'Logo' : 'Système'}
            </button>
          ))}
        </nav>
      </div>
      <div className="bg-white rounded-lg shadow p-6">
        {activeTab === 'general' && renderGeneralTab()}
        {activeTab === 'financial' && renderFinancialTab()}
        {activeTab === 'logo' && renderLogoTab()}
        {activeTab === 'system' && renderSystemTab()}
      </div>
    </div>
  );
};

export default Settings;