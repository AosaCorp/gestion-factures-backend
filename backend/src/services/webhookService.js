const crypto = require('crypto');
const https = require('https');
const http = require('http');
const { Webhook } = require('../models');

/**
 * Génère une signature HMAC pour sécuriser le webhook
 */
const generateSignature = (payload, secret) => {
  if (!secret) return null;
  return crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');
};

/**
 * Envoie une requête webhook à une URL
 */
const sendWebhookRequest = (url, payload, secret = null) => {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const parsedUrl = new URL(url);
    
    const signature = generateSignature(payload, secret);
    
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Gestion-Factures-Webhook/1.0'
      },
      timeout: 10000
    };
    
    if (signature) {
      options.headers['X-Webhook-Signature'] = signature;
    }
    
    const req = protocol.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ success: true, statusCode: res.statusCode, data });
        } else {
          reject({ success: false, statusCode: res.statusCode, data });
        }
      });
    });
    
    req.on('error', (error) => {
      reject({ success: false, error: error.message });
    });
    
    req.on('timeout', () => {
      req.destroy();
      reject({ success: false, error: 'Timeout' });
    });
    
    req.write(JSON.stringify(payload));
    req.end();
  });
};

/**
 * Déclenche les webhooks pour un événement donné
 */
const triggerWebhooks = async (event, data) => {
  try {
    // Récupérer les webhooks actifs pour cet événement
    const webhooks = await Webhook.findAll({
      where: { status: 'active' }
    });
    
    const matchingWebhooks = webhooks.filter(w => 
      w.events && w.events.includes(event)
    );
    
    if (matchingWebhooks.length === 0) {
      console.log(`📡 Aucun webhook configuré pour l'événement: ${event}`);
      return [];
    }
    
    const payload = {
      event,
      timestamp: new Date().toISOString(),
      data
    };
    
    const results = [];
    
    for (const webhook of matchingWebhooks) {
      try {
        console.log(`📡 Envoi webhook ${webhook.name} pour ${event}`);
        
        const result = await sendWebhookRequest(webhook.url, payload, webhook.secret);
        
        // Mettre à jour le webhook
        await webhook.update({
          lastTriggeredAt: new Date(),
          lastError: null,
          retryCount: 0,
          status: 'active'
        });
        
        results.push({
          webhook: webhook.name,
          success: true,
          statusCode: result.statusCode
        });
        
        console.log(`✅ Webhook ${webhook.name} envoyé avec succès`);
      } catch (error) {
        console.error(`❌ Erreur webhook ${webhook.name}:`, error);
        
        const newRetryCount = webhook.retryCount + 1;
        const newStatus = newRetryCount >= 5 ? 'failed' : 'active';
        
        await webhook.update({
          lastError: error.error || error.message,
          retryCount: newRetryCount,
          status: newStatus
        });
        
        results.push({
          webhook: webhook.name,
          success: false,
          error: error.error || error.message
        });
      }
    }
    
    return results;
  } catch (error) {
    console.error('Erreur déclenchement webhooks:', error);
    return [];
  }
};

module.exports = { triggerWebhooks, sendWebhookRequest };