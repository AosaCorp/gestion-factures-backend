import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { clientService, Client } from '../services/clientService';
import { productService, Product } from '../services/productService';
import { invoiceService } from '../services/invoiceService';
import toast from 'react-hot-toast';

interface InvoiceItem {
  productId: number;
  quantity: number;
}

const InvoiceForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = !!id;
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<number | ''>('');
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
    if (isEdit) {
      fetchInvoice();
    }
  }, [isEdit]);

  const fetchData = async () => {
    try {
      const [clientsData, productsData] = await Promise.all([
        clientService.getAll(),
        productService.getAll()
      ]);
      setClients(clientsData);
      setProducts(productsData);
    } catch (error) {
      console.error('Erreur chargement données', error);
      toast.error('Erreur lors du chargement des données');
    }
  };

  const fetchInvoice = async () => {
    try {
      const data = await invoiceService.getById(parseInt(id!));
      setSelectedClientId(data.clientId);
      const formItems = data.items.map(item => ({
        productId: item.productId,
        quantity: item.quantity
      }));
      setItems(formItems);
    } catch (error) {
      toast.error('Erreur chargement facture');
    }
  };

  const addItem = () => {
    setItems([...items, { productId: 0, quantity: 1 }]);
  };

  const updateItem = (index: number, field: keyof InvoiceItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedClientId) {
      setError('Veuillez sélectionner un client');
      return;
    }
    if (items.length === 0) {
      setError('Ajoutez au moins un article');
      return;
    }
    for (const item of items) {
      if (!item.productId) {
        setError('Veuillez sélectionner un produit pour chaque ligne');
        return;
      }
    }

    setLoading(true);
    try {
      if (isEdit) {
        // La modification n'est pas encore implémentée côté backend
        toast.error('La modification de facture n\'est pas encore disponible');
        // Si vous implémentez plus tard, appelez invoiceService.update(id, data)
      } else {
        await invoiceService.create({
          clientId: selectedClientId as number,
          items: items.map(item => ({ productId: item.productId, quantity: item.quantity }))
        });
        toast.success('Facture créée avec succès');
        navigate('/invoices');
      }
    } catch (error) {
      console.error('Erreur création facture', error);
      setError('Erreur lors de la création');
      toast.error('Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h1 className="text-2xl font-bold mb-6">{isEdit ? 'Modifier' : 'Nouvelle'} facture</h1>
      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
      <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Client *</label>
          <select
            value={selectedClientId}
            onChange={(e) => setSelectedClientId(e.target.value ? parseInt(e.target.value) : '' as any)}
            required
            className="w-full border border-gray-300 rounded-md p-2"
          >
            <option value="">Sélectionnez un client</option>
            {clients.map(client => (
              <option key={client.id} value={client.id}>{client.name}</option>
            ))}
          </select>
        </div>

        <h2 className="text-lg font-semibold mb-2">Articles</h2>
        {items.map((item, index) => (
          <div key={index} className="flex gap-2 mb-2 items-end">
            <div className="flex-1">
              <label className="block text-xs text-gray-600">Produit</label>
              <select
                value={item.productId}
                onChange={(e) => updateItem(index, 'productId', parseInt(e.target.value))}
                className="w-full border border-gray-300 rounded-md p-2"
              >
                <option value="">Choisir</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name} - {p.price} FCFA</option>
                ))}
              </select>
            </div>
            <div className="w-24">
              <label className="block text-xs text-gray-600">Quantité</label>
              <input
                type="number"
                min="1"
                value={item.quantity}
                onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                className="w-full border border-gray-300 rounded-md p-2"
              />
            </div>
            <button type="button" onClick={() => removeItem(index)} className="bg-red-500 text-white px-3 py-2 rounded">×</button>
          </div>
        ))}

        <button type="button" onClick={addItem} className="mt-2 bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700">
          + Ajouter un article
        </button>

        <div className="mt-6 flex gap-2">
          <button type="submit" disabled={loading} className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50">
            {loading ? 'Enregistrement...' : (isEdit ? 'Modifier' : 'Créer')}
          </button>
          <button type="button" onClick={() => navigate(-1)} className="bg-gray-600 text-white px-6 py-2 rounded hover:bg-gray-700">
            Annuler
          </button>
        </div>
      </form>
    </>
  );
};

export default InvoiceForm;