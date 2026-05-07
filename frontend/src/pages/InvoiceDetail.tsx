import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { invoiceService, paymentService, Invoice, Payment } from '../services/invoiceService';
import { clientService, Client } from '../services/clientService';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { FiDownload, FiMail } from 'react-icons/fi';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { isCapacitor } from '../utils/platform';

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
  const [sendingEmail, setSendingEmail] = useState(false);

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
    if (!invoice) return;
    try {
      const blob = await invoiceService.getPdf(invoice.id);
      if (isCapacitor()) {
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = async () => {
          const base64 = (reader.result as string).split(',')[1];
          const fileName = `facture-${invoice.number}.pdf`;
          await Filesystem.writeFile({ path: fileName, data: base64, directory: Directory.Cache });
          const uri = await Filesystem.getUri({ path: fileName, directory: Directory.Cache });
          await Share.share({ title: 'Facture', text: `Facture ${invoice.number}`, url: uri.uri });
          toast.success('PDF prêt à être partagé');
        };
        reader.onerror = () => toast.error('Erreur lecture PDF');
      } else {
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        URL.revokeObjectURL(url);
        toast.success('PDF ouvert dans un nouvel onglet');
      }
    } catch (error) {
      console.error('Erreur téléchargement PDF', error);
      toast.error('Erreur lors du téléchargement');
    }
  };

  const handleSendEmail = async () => {
    if (!invoice) return;
    if (!client?.email) {
      toast.error('Le client n\'a pas d\'adresse email');
      return;
    }
    
    setSendingEmail(true);
    try {
      await invoiceService.sendEmail(invoice.id);
      toast.success(`Facture envoyée par email à ${client.email}`);
    } catch (error: any) {
      console.error('Erreur envoi email', error);
      toast.error(error.response?.data?.message || 'Erreur lors de l\'envoi');
    } finally {
      setSendingEmail(false);
    }
  };

  // Formatage de la TVA avec virgule
  const formatTaxRate = (rate: number) => {
    return rate.toFixed(2).replace('.', ',') + ' %';
  };

  if (loading) return <div className="p-6 text-center">Chargement...</div>;
  if (!invoice) return <div className="p-6 text-center text-red-600">Facture non trouvée</div>;

  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const remaining = invoice.total - totalPaid;

  return (
    <div className="px-4 py-6 max-w-5xl mx-auto">
      {/* En-tête avec boutons */}
      <div className="flex flex-wrap justify-between items-center mb-6 gap-2">
        <h1 className="text-2xl font-bold">Facture {invoice.number}</h1>
        <div className="flex gap-2">
          <button
            onClick={handleDownloadPdf}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex items-center gap-2"
          >
            <FiDownload /> PDF
          </button>
          <button
            onClick={handleSendEmail}
            disabled={sendingEmail || !client?.email}
            className={`px-4 py-2 rounded flex items-center gap-2 ${
              !client?.email 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700'
            } text-white`}
            title={!client?.email ? "Client sans adresse email" : "Envoyer par email"}
          >
            <FiMail /> {sendingEmail ? 'Envoi...' : 'Email'}
          </button>
          <button
            onClick={() => navigate(-1)}
            className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
          >
            Retour
          </button>
        </div>
      </div>

      {/* Informations client */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4 border-b pb-2">Informations client</h2>
        {client ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <p><span className="font-medium">Nom:</span> {client.name}</p>
            {client.email && <p><span className="font-medium">Email:</span> {client.email}</p>}
            {client.phone && <p><span className="font-medium">Tél:</span> {client.phone}</p>}
            {client.address && <p><span className="font-medium">Adresse:</span> {client.address}</p>}
          </div>
        ) : (
          <p>Client non trouvé</p>
        )}
      </div>

      {/* Articles */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4 border-b pb-2">Articles</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left py-3 px-2">Article</th>
                <th className="text-left py-3 px-2">Description</th>
                <th className="text-right py-3 px-2">Qté</th>
                <th className="text-right py-3 px-2">Prix unitaire</th>
                <th className="text-right py-3 px-2">TVA %</th>
                <th className="text-right py-3 px-2">Total TTC</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, idx) => (
                <tr key={idx} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-2 font-medium">
                    {item.productName || 'Produit'}
                  </td>
                  <td className="py-3 px-2 text-gray-600">
                    {item.productDescription || item.description || '-'}
                  </td>
                  <td className="text-right py-3 px-2">
                    {item.quantity}
                  </td>
                  <td className="text-right py-3 px-2">
                    {item.unitPrice?.toLocaleString()} FCFA
                  </td>
                  <td className="text-right py-3 px-2">
                    {formatTaxRate(item.taxRate || 19.25)}
                  </td>
                  <td className="text-right py-3 px-2 font-medium">
                    {item.total?.toLocaleString()} FCFA
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t-2 border-gray-300 bg-gray-50">
              <tr>
                <td colSpan={5} className="text-right py-3 px-2 font-medium">
                  Sous-total HT
                </td>
                <td className="text-right py-3 px-2">
                  {invoice.subtotal.toLocaleString()} FCFA
                </td>
              </tr>
              <tr>
                <td colSpan={5} className="text-right py-3 px-2 font-medium">
                  TVA
                </td>
                <td className="text-right py-3 px-2">
                  {invoice.taxTotal.toLocaleString()} FCFA
                </td>
              </tr>
              <tr className="bg-blue-50">
                <td colSpan={5} className="text-right py-3 px-2 font-bold text-lg">
                  TOTAL TTC
                </td>
                <td className="text-right py-3 px-2 font-bold text-lg text-blue-600">
                  {invoice.total.toLocaleString()} FCFA
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Paiements */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4 border-b pb-2">Paiements</h2>
        
        {payments.length > 0 ? (
          <div className="overflow-x-auto mb-4">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left py-2 px-2">Date</th>
                  <th className="text-right py-2 px-2">Montant</th>
                  <th className="text-left py-2 px-2">Méthode</th>
                  <th className="text-left py-2 px-2">Transaction</th>
                  <th className="text-left py-2 px-2">Reçu par</th>
                </tr>
              </thead>
              <tbody>
                {payments.map(p => (
                  <tr key={p.id} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-2">
                      {new Date(p.createdAt).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="text-right py-2 px-2">
                      {p.amount.toLocaleString()} FCFA
                    </td>
                    <td className="py-2 px-2">
                      {p.method === 'cash' ? 'Espèces' : 
                       p.method === 'orange_money' ? 'Orange Money' : 'MTN Money'}
                    </td>
                    <td className="py-2 px-2">{p.transactionId || '-'}</td>
                    <td className="py-2 px-2">{p.receiver?.name || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mb-4 text-gray-500">Aucun paiement enregistré.</p>
        )}

        <div className="flex flex-wrap justify-between items-center border-t pt-4">
          <div>
            <p className="text-sm">
              <span className="font-medium">Total payé:</span>{' '}
              <span className="text-green-600">{totalPaid.toLocaleString()} FCFA</span>
            </p>
            <p className="text-sm">
              <span className="font-medium">Reste à payer:</span>{' '}
              <span className={`${remaining > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {remaining.toLocaleString()} FCFA
              </span>
            </p>
          </div>
          {invoice.status === 'draft' && remaining > 0 && 
           (user?.role === 'cashier' || user?.role === 'admin') && (
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Montant *
                </label>
                <input
                  type="number"
                  step="1"
                  required
                  max={remaining}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(parseFloat(e.target.value))}
                  className="w-full border border-gray-300 rounded-md p-2"
                />
                <p className="text-xs text-gray-500 mt-1">Maximum: {remaining.toLocaleString()} FCFA</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Méthode *
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => {
                    setPaymentMethod(e.target.value as any);
                    setTransactionId('');
                  }}
                  className="w-full border border-gray-300 rounded-md p-2"
                >
                  <option value="cash">Espèces</option>
                  <option value="orange_money">Orange Money</option>
                  <option value="mtn_money">MTN Money</option>
                </select>
              </div>
              {(paymentMethod === 'orange_money' || paymentMethod === 'mtn_money') && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Numéro de transaction *
                  </label>
                  <input
                    type="text"
                    required
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    className="w-full border border-gray-300 rounded-md p-2"
                    placeholder="Ex: OM123456789"
                  />
                </div>
              )}
            </div>
            <div className="mt-4 flex gap-2">
              <button
                type="submit"
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                Enregistrer le paiement
              </button>
              <button
                type="button"
                onClick={() => setShowPaymentForm(false)}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                Annuler
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default InvoiceDetail;