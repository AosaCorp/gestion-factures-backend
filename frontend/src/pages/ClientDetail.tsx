import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { clientService, Client } from '../services/clientService';

const ClientDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) fetchClient();
  }, [id]);

  const fetchClient = async () => {
    try {
      const data = await clientService.getById(parseInt(id!));
      setClient(data);
    } catch (error) {
      console.error('Erreur chargement client', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-6">Chargement...</div>;
  if (!client) return <div className="p-6">Client non trouvé</div>;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Détail du client</h1>
      <div className="bg-white shadow rounded-lg p-6">
        <p><strong>Nom:</strong> {client.name}</p>
        <p><strong>Email:</strong> {client.email || '-'}</p>
        <p><strong>Téléphone:</strong> {client.phone || '-'}</p>
        <p><strong>Adresse:</strong> {client.address || '-'}</p>
        <button onClick={() => navigate(-1)} className="mt-4 bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700">
          Retour
        </button>
      </div>
    </div>
  );
};

export default ClientDetail;