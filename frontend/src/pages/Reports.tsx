import React, { useState, useEffect } from 'react';
import { reportService } from '../services/reportService';
import { companyService } from '../services/companyService';
import { productService } from '../services/productService';
import toast from 'react-hot-toast';
import { FiDownload, FiRefreshCw } from 'react-icons/fi';
import { Line, Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import api from '../services/api';
import { exportToCSV } from '../services/exportService';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

type ReportType = 'sales' | 'products' | 'clients' | 'payments';

const Reports: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ReportType>('sales');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [salesData, setSalesData] = useState<any>(null);
  const [productsData, setProductsData] = useState<any[]>([]);
  const [clientsData, setClientsData] = useState<any[]>([]);
  const [paymentsData, setPaymentsData] = useState<any>(null);
  const [company, setCompany] = useState<any>(null);
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');

  useEffect(() => {
    fetchCompany();
  }, []);

  useEffect(() => {
    if (activeTab === 'sales') fetchSalesReport();
    if (activeTab === 'products') fetchProductsReport();
    if (activeTab === 'clients') fetchClientsReport();
    if (activeTab === 'payments') fetchPaymentsReport();
  }, [activeTab, startDate, endDate]);

  const fetchCompany = async () => {
    try {
      const data = await companyService.get();
      setCompany(data);
    } catch (error) {
      console.error('Erreur chargement entreprise', error);
    }
  };

  const fetchSalesReport = async () => {
    setLoading(true);
    try {
      const data = await reportService.getSalesReport(startDate, endDate);
      setSalesData(data);
    } catch (error) {
      toast.error('Erreur chargement rapport ventes');
    } finally {
      setLoading(false);
    }
  };

  const fetchProductsReport = async () => {
    setLoading(true);
    try {
      const data = await productService.getAll();
      setProductsData(data);
    } catch (error) {
      toast.error('Erreur chargement rapport produits');
    } finally {
      setLoading(false);
    }
  };

  const fetchClientsReport = async () => {
    setLoading(true);
    try {
      const data = await reportService.getClientsReport(10, startDate, endDate);
      setClientsData(data);
    } catch (error) {
      toast.error('Erreur chargement rapport clients');
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentsReport = async () => {
    setLoading(true);
    try {
      const data = await reportService.getPaymentsReport(startDate, endDate);
      setPaymentsData(data);
    } catch (error) {
      toast.error('Erreur chargement rapport paiements');
    } finally {
      setLoading(false);
    }
  };

  // ========== Export CSV ==========
  const handleExportCSV = async () => {
    let data: any[] = [];
    let filename = 'rapport';
    if (activeTab === 'sales' && salesData?.invoices) {
      data = salesData.invoices.map((inv: any) => ({
        Numéro: inv.number,
        Client: inv.client?.name || '',
        Date: new Date(inv.createdAt).toLocaleDateString('fr-FR'),
        Total: inv.total,
        Statut: inv.status === 'draft' ? 'En attente' : inv.status === 'paid' ? 'Payée' : 'Annulée',
      }));
      filename = 'ventes';
    } else if (activeTab === 'products' && productsData.length) {
      data = productsData.map((p: any) => ({
        Nom: p.name,
        Description: p.description || '',
        'Prix HT': p.price,
        'TVA (%)': p.taxRate,
        'Prix TTC': Math.round(p.price * (1 + p.taxRate / 100)),
      }));
      filename = 'produits';
    } else if (activeTab === 'clients' && clientsData.length) {
      data = clientsData.map((c: any) => ({
        Client: c.name,
        Code: c.code,
        Factures: c.invoicesCount,
        'Total achats': c.totalSpent,
        Payé: c.totalPaid,
        'Dernier achat': c.lastInvoiceDate ? new Date(c.lastInvoiceDate).toLocaleDateString('fr-FR') : '',
      }));
      filename = 'clients';
    } else if (activeTab === 'payments' && paymentsData?.payments) {
      data = paymentsData.payments.map((p: any) => ({
        Date: new Date(p.createdAt).toLocaleDateString('fr-FR'),
        Montant: p.amount,
        Méthode: p.method === 'cash' ? 'Espèces' : p.method === 'orange_money' ? 'Orange Money' : 'MTN Money',
        Facture: p.Invoice?.number || '',
      }));
      filename = 'paiements';
    }

    if (data.length === 0) {
      toast.error('Aucune donnée à exporter');
      return;
    }

    try {
      await exportToCSV(data, filename);
      toast.success('Export CSV réussi');
    } catch (error: any) {
      toast.error(error.message || 'Erreur export CSV');
    }
  };

  // ========== Export PDF ==========
  const handleExportPDF = async () => {
    if (!company) {
      toast.error('Informations entreprise non chargées');
      return;
    }

    const doc = new jsPDF();
    let y = 20;

    if (company.logo) {
      try {
        const base = api.defaults.baseURL?.replace('/api', '') || '';
        const logoUrl = `${base}/uploads/${company.logo}`;
        const logoImg = await fetch(logoUrl).then(res => res.blob());
        const reader = new FileReader();
        reader.readAsDataURL(logoImg);
        await new Promise((resolve) => { reader.onload = resolve; });
        const base64Logo = reader.result as string;
        doc.addImage(base64Logo, 'PNG', 10, y, 30, 30);
        doc.setFontSize(10);
        doc.text(company.name || '', 50, y + 10);
        if (company.address) doc.text(company.address, 50, y + 20);
        if (company.phone) doc.text(`Tél: ${company.phone}`, 50, y + 30);
        if (company.email) doc.text(`Email: ${company.email}`, 50, y + 40);
        y += 50;
      } catch (error) {
        console.error('Erreur chargement logo', error);
        y = 30;
      }
    } else {
      y = 30;
    }

    doc.setFontSize(16);
    doc.text(`Rapport - ${activeTab === 'sales' ? 'Ventes' : activeTab === 'products' ? 'Produits' : activeTab === 'clients' ? 'Clients' : 'Paiements'}`, 14, y);
    y += 10;
    doc.setFontSize(10);
    doc.text(`Période: ${startDate || 'début'} - ${endDate || 'fin'}`, 14, y);
    y += 10;

    if (activeTab === 'sales' && salesData) {
      doc.text(`Total des ventes: ${salesData.totalRevenue} FCFA`, 14, y);
      y += 10;
      doc.text(`Payées: ${salesData.paidCount}`, 14, y);
      y += 10;
      doc.text(`Brouillons: ${salesData.draftCount}`, 14, y);
      y += 10;
      doc.text(`Annulées: ${salesData.cancelledCount}`, 14, y);
      y += 10;
      const tableColumn = ["N° Facture", "Client", "Date", "Total", "Statut"];
      const tableRows = salesData.invoices.map((inv: any) => [
        inv.number,
        inv.client?.name || 'N/A',
        new Date(inv.createdAt).toLocaleDateString('fr-FR'),
        inv.total + ' FCFA',
        inv.status === 'draft' ? 'Brouillon' : inv.status === 'paid' ? 'Payée' : 'Annulée'
      ]);
      autoTable(doc, { head: [tableColumn], body: tableRows, startY: y });
    } else if (activeTab === 'products' && productsData.length > 0) {
      const tableColumn = ["Produit", "Prix HT", "TVA", "Prix TTC"];
      const tableRows = productsData.map((p: any) => [
        p.name,
        p.price + ' FCFA',
        p.taxRate + '%',
        Math.round(p.price * (1 + p.taxRate / 100)).toLocaleString() + ' FCFA'
      ]);
      autoTable(doc, { head: [tableColumn], body: tableRows, startY: y });
    } else if (activeTab === 'clients' && clientsData.length > 0) {
      const tableColumn = ["Client", "Code", "Factures", "Total achats", "Payé", "Dernier achat"];
      const tableRows = clientsData.map((c: any) => [
        c.name,
        c.code,
        c.invoicesCount,
        c.totalSpent + ' FCFA',
        c.totalPaid + ' FCFA',
        c.lastInvoiceDate ? new Date(c.lastInvoiceDate).toLocaleDateString('fr-FR') : ''
      ]);
      autoTable(doc, { head: [tableColumn], body: tableRows, startY: y });
    } else if (activeTab === 'payments' && paymentsData?.payments) {
      const tableColumn = ["Date", "Montant", "Méthode", "Facture"];
      const tableRows = paymentsData.payments.map((p: any) => [
        new Date(p.createdAt).toLocaleDateString('fr-FR'),
        p.amount + ' FCFA',
        p.method === 'cash' ? 'Espèces' : p.method === 'orange_money' ? 'Orange Money' : 'MTN Money',
        p.Invoice?.number || ''
      ]);
      autoTable(doc, { head: [tableColumn], body: tableRows, startY: y });
    } else {
      toast.error('Aucune donnée à exporter');
      return;
    }

    const pdfData = doc.output('blob');
    const reader = new FileReader();
    reader.readAsDataURL(pdfData);
    reader.onloadend = async () => {
      const base64 = (reader.result as string).split(',')[1];
      const fileName = `rapport_${activeTab}_${Date.now()}.pdf`;
      try {
        await Filesystem.writeFile({
          path: fileName,
          data: base64,
          directory: Directory.Data,
        });
        const uri = await Filesystem.getUri({ path: fileName, directory: Directory.Data });
        await Share.share({
          title: 'Export PDF',
          text: `Fichier rapport_${activeTab}.pdf`,
          url: uri.uri,
        });
        toast.success('Export PDF réussi');
      } catch (error) {
        console.error('Erreur sauvegarde PDF', error);
        toast.error('Erreur lors de l\'export PDF');
      }
    };
    reader.onerror = () => toast.error('Erreur génération PDF');
  };

  // ========== Rendu des onglets ==========
  const renderSalesTab = () => {
    if (!salesData) return <p>Aucune donnée</p>;
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded shadow"><p className="text-sm text-gray-500">Chiffre d'affaires</p><p className="text-2xl font-bold">{salesData.totalRevenue?.toLocaleString() || 0} FCFA</p></div>
          <div className="bg-white p-4 rounded shadow"><p className="text-sm text-gray-500">Encaissé</p><p className="text-2xl font-bold">{salesData.totalPaid?.toLocaleString() || 0} FCFA</p></div>
          <div className="bg-white p-4 rounded shadow"><p className="text-sm text-gray-500">Factures</p><p className="text-2xl font-bold">{salesData.count || 0}</p></div>
          <div className="bg-white p-4 rounded shadow"><p className="text-sm text-gray-500">Clients</p><p className="text-2xl font-bold">{salesData.invoices ? new Set(salesData.invoices.map((i: any) => i.client?.id)).size : 0}</p></div>
        </div>
        <div className="flex justify-end gap-2">
          <button onClick={() => setChartType('line')} className={`px-3 py-1 rounded ${chartType === 'line' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>Courbe</button>
          <button onClick={() => setChartType('bar')} className={`px-3 py-1 rounded ${chartType === 'bar' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>Barres</button>
        </div>
        {salesData.salesByDate && salesData.salesByDate.length > 0 && (
          <div className="bg-white p-4 rounded shadow">
            {chartType === 'line' ? (
              <Line data={{ labels: salesData.salesByDate.map((d: any) => d.date), datasets: [{ label: 'Chiffre d\'affaires', data: salesData.salesByDate.map((d: any) => d.revenue), borderColor: 'rgb(59, 130, 246)', backgroundColor: 'rgba(59, 130, 246, 0.5)' }, { label: 'Encaissé', data: salesData.salesByDate.map((d: any) => d.paid), borderColor: 'rgb(16, 185, 129)', backgroundColor: 'rgba(16, 185, 129, 0.5)' }] }} options={{ responsive: true }} />
            ) : (
              <Bar data={{ labels: salesData.salesByDate.map((d: any) => d.date), datasets: [{ label: 'Chiffre d\'affaires', data: salesData.salesByDate.map((d: any) => d.revenue), backgroundColor: 'rgba(59, 130, 246, 0.8)' }, { label: 'Encaissé', data: salesData.salesByDate.map((d: any) => d.paid), backgroundColor: 'rgba(16, 185, 129, 0.8)' }] }} options={{ responsive: true }} />
            )}
          </div>
        )}
        {salesData.invoices && (
          <div className="bg-white rounded shadow overflow-x-auto">
            <table className="min-w-[800px] md:min-w-full w-full text-sm md:text-base">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Factures</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Clients</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">HT</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">TVA</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">TTC</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Encaissé</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {salesData.invoices.map((inv: any) => (
                  <tr key={inv.id}>
                    <td className="px-6 py-4 whitespace-nowrap">{new Date(inv.createdAt).toLocaleDateString('fr-FR')}</td>
                    <td className="px-6 py-4 whitespace-nowrap">1</td>
                    <td className="px-6 py-4 whitespace-nowrap">1</td>
                    <td className="px-6 py-4 whitespace-nowrap">{inv.subtotal.toLocaleString()} FCFA</td>
                    <td className="px-6 py-4 whitespace-nowrap">{inv.taxTotal.toLocaleString()} FCFA</td>
                    <td className="px-6 py-4 whitespace-nowrap">{inv.total.toLocaleString()} FCFA</td>
                    <td className="px-6 py-4 whitespace-nowrap">{inv.Payments?.reduce((sum: number, p: any) => sum + p.amount, 0).toLocaleString() || 0} FCFA</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  const renderProductsTab = () => {
    if (productsData.length === 0) return <p className="text-center py-10">Aucun produit trouvé</p>;
    return (
      <div className="bg-white rounded shadow overflow-x-auto">
        <table className="min-w-[600px] w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left">Nom</th>
              <th className="px-4 py-2 text-left">Description</th>
              <th className="px-4 py-2 text-right">Prix HT</th>
              <th className="px-4 py-2 text-right">TVA</th>
              <th className="px-4 py-2 text-right">Prix TTC</th>
            </tr>
          </thead>
          <tbody>
            {productsData.map((p, idx) => (
              <tr key={idx} className="border-t">
                <td className="px-4 py-2">{p.name}</td>
                <td className="px-4 py-2">{p.description || '-'}</td>
                <td className="px-4 py-2 text-right">{p.price.toLocaleString()} FCFA</td>
                <td className="px-4 py-2 text-right">{p.taxRate}%</td>
                <td className="px-4 py-2 text-right">{Math.round(p.price * (1 + p.taxRate / 100)).toLocaleString()} FCFA</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderClientsTab = () => {
    if (clientsData.length === 0) return <p className="text-center py-10">Aucun client trouvé</p>;
    return (
      <div className="bg-white rounded shadow overflow-x-auto">
        <table className="min-w-[800px] w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left">Client</th>
              <th className="px-4 py-2 text-left">Code</th>
              <th className="px-4 py-2 text-right">Factures</th>
              <th className="px-4 py-2 text-right">Total achats</th>
              <th className="px-4 py-2 text-right">Payé</th>
              <th className="px-4 py-2 text-left">Dernier achat</th>
            </tr>
          </thead>
          <tbody>
            {clientsData.map((c) => (
              <tr key={c.id} className="border-t">
                <td className="px-4 py-2">{c.name}</td>
                <td className="px-4 py-2">{c.code}</td>
                <td className="px-4 py-2 text-right">{c.invoicesCount}</td>
                <td className="px-4 py-2 text-right">{c.totalSpent.toLocaleString()} FCFA</td>
                <td className="px-4 py-2 text-right">{c.totalPaid.toLocaleString()} FCFA</td>
                <td className="px-4 py-2">{c.lastInvoiceDate ? new Date(c.lastInvoiceDate).toLocaleString('fr-FR') : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderPaymentsTab = () => {
    if (!paymentsData) return <p className="text-center py-10">Aucune donnée de paiement</p>;
    const totalMethods = paymentsData.byMethod?.cash?.total + paymentsData.byMethod?.orange_money?.total + paymentsData.byMethod?.mtn_money?.total || 0;
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded shadow"><p className="text-sm text-gray-500">Total encaissé</p><p className="text-2xl font-bold">{paymentsData.total?.toLocaleString() || 0} FCFA</p></div>
          <div className="bg-white p-4 rounded shadow"><p className="text-sm text-gray-500">Espèces</p><p className="text-2xl font-bold">{paymentsData.byMethod?.cash?.total?.toLocaleString() || 0} FCFA</p></div>
          <div className="bg-white p-4 rounded shadow"><p className="text-sm text-gray-500">Orange Money</p><p className="text-2xl font-bold">{paymentsData.byMethod?.orange_money?.total?.toLocaleString() || 0} FCFA</p></div>
          <div className="bg-white p-4 rounded shadow"><p className="text-sm text-gray-500">MTN Money</p><p className="text-2xl font-bold">{paymentsData.byMethod?.mtn_money?.total?.toLocaleString() || 0} FCFA</p></div>
        </div>
        {totalMethods > 0 && (
          <div className="bg-white p-4 rounded shadow">
            <Pie data={{ labels: ['Espèces', 'Orange Money', 'MTN Money'], datasets: [{ data: [paymentsData.byMethod.cash.total, paymentsData.byMethod.orange_money.total, paymentsData.byMethod.mtn_money.total], backgroundColor: ['#10b981', '#f59e0b', '#3b82f6'] }] }} options={{ responsive: true }} />
          </div>
        )}
        {paymentsData.payments && paymentsData.payments.length > 0 && (
          <div className="bg-white rounded shadow overflow-x-auto">
            <table className="min-w-[800px] w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left">Date</th>
                  <th className="px-4 py-2 text-left">Mode</th>
                  <th className="px-4 py-2 text-right">Montant</th>
                  <th className="px-4 py-2 text-left">Facture</th>
                </tr>
              </thead>
              <tbody>
                {paymentsData.payments.map((p: any) => (
                  <tr key={p.id} className="border-t">
                    <td className="px-4 py-2">{new Date(p.createdAt).toLocaleDateString('fr-FR')}</td>
                    <td className="px-4 py-2">{p.method === 'cash' ? 'Espèces' : p.method === 'orange_money' ? 'Orange Money' : 'MTN Money'}</td>
                    <td className="px-4 py-2 text-right">{p.amount.toLocaleString()} FCFA</td>
                    <td className="px-4 py-2">{p.Invoice?.number || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-2xl md:text-3xl font-bold mb-6">Rapports et analyses</h1>

      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="border rounded px-3 py-2 text-sm" />
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="border rounded px-3 py-2 text-sm" />
          <button onClick={() => { if (activeTab === 'sales') fetchSalesReport(); if (activeTab === 'products') fetchProductsReport(); if (activeTab === 'clients') fetchClientsReport(); if (activeTab === 'payments') fetchPaymentsReport(); }} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center gap-1 text-sm"><FiRefreshCw className="mr-1" /> Actualiser</button>
          <div className="flex gap-2 ml-auto">
            <button onClick={handleExportCSV} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex items-center gap-1 text-sm"><FiDownload className="mr-1" /> Excel</button>
            <button onClick={handleExportPDF} className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 flex items-center gap-1 text-sm"><FiDownload className="mr-1" /> PDF</button>
          </div>
        </div>
      </div>

      <div className="border-b border-gray-200 mb-6">
        <nav className="flex flex-wrap gap-4">
          {(['sales', 'products', 'clients', 'payments'] as ReportType[]).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`py-2 px-1 border-b-2 font-medium text-sm capitalize ${activeTab === tab ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              {tab === 'sales' ? 'Ventes' : tab === 'products' ? 'Produits' : tab === 'clients' ? 'Clients' : 'Paiements'}
            </button>
          ))}
        </nav>
      </div>

      {loading && <div className="text-center py-10">Chargement...</div>}
      {!loading && (
        <div className="bg-white rounded-lg shadow p-4 md:p-6">
          {activeTab === 'sales' && renderSalesTab()}
          {activeTab === 'products' && renderProductsTab()}
          {activeTab === 'clients' && renderClientsTab()}
          {activeTab === 'payments' && renderPaymentsTab()}
        </div>
      )}
    </div>
  );
};

export default Reports;