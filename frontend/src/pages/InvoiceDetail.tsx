import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { invoiceService, paymentService, Invoice, Payment } from '../services/invoiceService';
import { clientService, Client } from '../services/clientService';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { FiDownload } from 'react-icons/fi';

const InvoiceDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'orange_money' | 'mtn_money'>('cash');
  const [transactionId, setTransactionId] = useState('');
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  useEffect(() => {
    if (id) fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const inv = await invoiceService.getById(parseInt(id!));
      setInvoice(inv);
      if (inv.clientId) {
        const cli = await clientService.getById(inv.clientId);
        setClient(cli);
      }
      const pays = await paymentService.getByInvoice(parseInt(id!));
      setPayments(pays);
    } catch (error) {
      console.error('Erreur chargement détail facture', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await paymentService.create({
        invoiceId: parseInt(id!),
        amount: paymentAmount,
        method: paymentMethod,
        transactionId: transactionId || undefined
      });
      setShowPaymentForm(false);
      setPaymentAmount(0);
      setTransactionId('');
      fetchData();
      toast.success('Paiement enregistré');
    } catch (error: any) {
      console.error('Erreur paiement', error);
      const message = error.response?.data?.message || 'Erreur lors du paiement';
      toast.error(message);
    }
  };

  const handleDownloadPdf = async () => {
    try {
      const blob = await invoiceService.getPdf(parseInt(id!));
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `facture-${invoice?.number}.pdf`;
      a.click();
    } catch (error) {
      console.error('Erreur téléchargement PDF', error);
      toast.error('Erreur lors du téléchargement');
    }
  };

  if (loading) return <div className="p-6">Chargement...</div>;
  if (!invoice) return <div className="p-6">Facture non trouvée</div>;

  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const remaining = invoice.total - totalPaid;

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Facture {invoice.number}</h1>
        <div>
          <button
            onClick={handleDownloadPdf}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 mr-2 flex items-center"
          >
            <FiDownload className="mr-2" /> PDF
          </button>
          <button
            onClick={() => navigate(-1)}
            className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
          >
            Retour
          </button>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Informations client</h2>
        {client && (
          <div className="space-y-2">
            <p><span className="font-medium">Nom:</span> {client.name}</p>
            {client.email && <p><span className="font-medium">Email:</span> {client.email}</p>}
            {client.phone && <p><span className="font-medium">Tél:</span> {client.phone}</p>}
            {client.address && <p><span className="font-medium">Adresse:</span> {client.address}</p>}
          </div>
        )}
      </div>

      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Articles</h2>
        <table className="min-w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2">Description</th>
              <th className="text-right py-2">Qté</th>
              <th className="text-right py-2">Prix unitaire</th>
              <th className="text-right py-2">TVA %</th>
              <th className="text-right py-2">Total TTC</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item, idx) => (
              <tr key={idx} className="border-b">
                <td className="py-2">{item.description || 'Produit'}</td>
                <td className="text-right py-2">{item.quantity}</td>
                <td className="text-right py-2">{item.unitPrice?.toLocaleString()} F</td>
                <td className="text-right py-2">{item.taxRate}%</td>
                <td className="text-right py-2">{item.total?.toLocaleString()} F</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={4} className="text-right font-medium py-2">Sous-total HT</td>
              <td className="text-right py-2">{invoice.subtotal.toLocaleString()} F</td>
            </tr>
            <tr>
              <td colSpan={4} className="text-right font-medium py-2">TVA</td>
              <td className="text-right py-2">{invoice.taxTotal.toLocaleString()} F</td>
            </tr>
            <tr>
              <td colSpan={4} className="text-right font-bold py-2">TOTAL TTC</td>
              <td className="text-right font-bold py-2">{invoice.total.toLocaleString()} F</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Paiements</h2>
        {payments.length > 0 ? (
          <table className="min-w-full mb-4">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Date</th>
                <th className="text-right py-2">Montant</th>
                <th className="text-left py-2">Méthode</th>
                <th className="text-left py-2">Transaction</th>
                <th className="text-left py-2">Reçu par</th>
              </tr>
            </thead>
            <tbody>
              {payments.map(p => (
                <tr key={p.id} className="border-b">
                  <td className="py-2">{new Date(p.createdAt).toLocaleDateString()}</td>
                  <td className="text-right py-2">{p.amount.toLocaleString()} F</td>
                  <td className="py-2">
                    {p.method === 'cash' ? 'Espèces' : p.method === 'orange_money' ? 'Orange Money' : 'MTN Money'}
                  </td>
                  <td className="py-2">{p.transactionId || '-'}</td>
                  <td className="py-2">{p.receiver?.name || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="mb-4">Aucun paiement enregistré.</p>
        )}

        <div className="flex justify-between items-center">
          <div>
            <p><span className="font-medium">Total payé:</span> {totalPaid.toLocaleString()} F</p>
            <p><span className="font-medium">Reste à payer:</span> {remaining.toLocaleString()} F</p>
          </div>
          {invoice.status === 'draft' && remaining > 0 && (user?.role === 'cashier' || user?.role === 'admin') && (
            <button
              onClick={() => setShowPaymentForm(!showPaymentForm)}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              {showPaymentForm ? 'Annuler' : 'Ajouter un paiement'}
            </button>
          )}
        </div>

        {showPaymentForm && (
          <form onSubmit={handlePayment} className="mt-4 border-t pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Montant *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  max={remaining}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(parseFloat(e.target.value))}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Méthode *</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => {
                    setPaymentMethod(e.target.value as any);
                    setTransactionId(''); // reset transaction id
                  }}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                >
                  <option value="cash">Espèces</option>
                  <option value="orange_money">Orange Money</option>
                  <option value="mtn_money">MTN Money</option>
                </select>
              </div>
              {(paymentMethod === 'orange_money' || paymentMethod === 'mtn_money') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Numéro de transaction *</label>
                  <input
                    type="text"
                    required
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                    placeholder="Ex: OM123456789"
                  />
                </div>
              )}
            </div>
            <button
              type="submit"
              className="mt-4 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Enregistrer le paiement
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default InvoiceDetail;