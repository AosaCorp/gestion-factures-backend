const { Webhook } = require('../models');
const { triggerWebhooks } = require('../services/webhookService');

// Récupérer tous les webhooks
exports.getWebhooks = async (req, res) => {
  try {
    const webhooks = await Webhook.findAll({
      order: [['createdAt', 'DESC']]
    });
    res.json(webhooks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Récupérer un webhook par ID
exports.getWebhookById = async (req, res) => {
  try {
    const webhook = await Webhook.findByPk(req.params.id);
    if (!webhook) {
      return res.status(404).json({ error: 'Webhook non trouvé' });
    }
    res.json(webhook);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Créer un webhook
exports.createWebhook = async (req, res) => {
  try {
    const { name, url, secret, events } = req.body;
    
    if (!name || !url) {
      return res.status(400).json({ error: 'Nom et URL requis' });
    }
    
    const webhook = await Webhook.create({
      name,
      url,
      secret,
      events: events || [
        'invoice.created',
        'invoice.paid',
        'payment.received',
        'client.created'
      ],
      status: 'active'
    });
    
    res.status(201).json(webhook);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Mettre à jour un webhook
exports.updateWebhook = async (req, res) => {
  try {
    const webhook = await Webhook.findByPk(req.params.id);
    if (!webhook) {
      return res.status(404).json({ error: 'Webhook non trouvé' });
    }
    
    await webhook.update(req.body);
    res.json(webhook);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Supprimer un webhook
exports.deleteWebhook = async (req, res) => {
  try {
    const webhook = await Webhook.findByPk(req.params.id);
    if (!webhook) {
      return res.status(404).json({ error: 'Webhook non trouvé' });
    }
    
    await webhook.destroy();
    res.json({ message: 'Webhook supprimé' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Tester un webhook
exports.testWebhook = async (req, res) => {
  try {
    const { id } = req.params;
    const webhook = await Webhook.findByPk(id);
    
    if (!webhook) {
      return res.status(404).json({ error: 'Webhook non trouvé' });
    }
    
    const testPayload = {
      event: 'test',
      timestamp: new Date().toISOString(),
      data: { message: 'Ceci est un test de webhook' }
    };
    
    const { sendWebhookRequest } = require('../services/webhookService');
    const result = await sendWebhookRequest(webhook.url, testPayload, webhook.secret);
    
    res.json({ success: true, result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors du test', details: error.error || error.message });
  }
};

// Récupérer les événements disponibles
exports.getAvailableEvents = async (req, res) => {
  const events = [
    { value: 'invoice.created', label: '📄 Création de facture' },
    { value: 'invoice.paid', label: '💰 Facture payée' },
    { value: 'invoice.cancelled', label: '❌ Facture annulée' },
    { value: 'payment.received', label: '💵 Paiement reçu' },
    { value: 'client.created', label: '👤 Client créé' },
    { value: 'client.updated', label: '✏️ Client modifié' },
    { value: 'product.created', label: '📦 Produit créé' },
    { value: 'product.updated', label: '🔧 Produit modifié' }
  ];
  res.json(events);
};