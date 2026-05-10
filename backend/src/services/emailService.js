// backend/src/services/emailService.js
const https = require('https');

// Formatage des montants
const formatMontant = (montant) => {
  if (isNaN(montant) || montant === undefined || montant === null) return '0 FCFA';
  return montant.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' FCFA';
};

/**
 * Envoie une facture par email via l'API REST Brevo
 * (Contourne le blocage SMTP de Render)
 */
const sendInvoiceEmail = async (invoice, client, pdfBuffer, company = null) => {
  const companyName = company?.name || 'Notre association';
  const fromEmail = process.env.BREVO_SENDER_EMAIL || process.env.COMPANY_EMAIL || 'noreply@association.com';
  const apiKey = process.env.BREVO_API_KEY;
  
  if (!apiKey) {
    console.error('❌ BREVO_API_KEY non configurée');
    throw new Error('Configuration email manquante');
  }
  
  // Convertir le PDF en base64
  const pdfBase64 = pdfBuffer.toString('base64');
  
  const subject = `Facture ${invoice.number} - ${companyName}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Facture ${invoice.number}</title>
      <style>
        body { font-family: Arial, sans-serif; color: #333; line-height: 1.6; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; border-bottom: 2px solid #3b82f6; padding-bottom: 15px; margin-bottom: 20px; }
        .header h1 { color: #3b82f6; margin: 0; }
        .invoice-details { background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0; }
        .invoice-details table { width: 100%; }
        .invoice-details td { padding: 5px 0; }
        .total { font-size: 18px; font-weight: bold; color: #3b82f6; }
        .footer { text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 15px; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${companyName}</h1>
          ${company?.address ? `<p>${company.address}</p>` : ''}
          ${company?.phone ? `<p>Tél: ${company.phone}</p>` : ''}
        </div>
        
        <p>Bonjour <strong>${client.name}</strong>,</p>
        <p>Veuillez trouver ci-joint la facture <strong>${invoice.number}</strong>.</p>
        
        <div class="invoice-details">
          <table>
            <tr><td><strong>N° Facture:</strong></td><td>${invoice.number}</td></tr>
            <tr><td><strong>Date:</strong></td><td>${new Date(invoice.createdAt).toLocaleDateString('fr-FR')}</td></tr>
            <tr><td><strong>Montant HT:</strong></td><td>${formatMontant(invoice.subtotal)}</td></tr>
            <tr><td><strong>TVA (19,25%):</strong></td><td>${formatMontant(invoice.taxTotal)}</td></tr>
            <tr><td><strong>Total TTC:</strong></td><td><strong class="total">${formatMontant(invoice.total)}</strong></td></tr>
          </table>
        </div>
        
        <div class="footer">
          <p>${companyName} - ${fromEmail}</p>
          <p>Ce message est généré automatiquement.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  // Construction de la requête API Brevo
  const postData = JSON.stringify({
    sender: {
      name: companyName,
      email: fromEmail
    },
    to: [{
      email: client.email,
      name: client.name
    }],
    subject: subject,
    htmlContent: html,
    attachment: [
      {
        name: `facture-${invoice.number}.pdf`,
        content: pdfBase64
      }
    ]
  });
  
  const options = {
    hostname: 'api.brevo.com',
    path: '/v3/smtp/email',
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'api-key': apiKey,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    },
    timeout: 30000
  };
  
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 201 || res.statusCode === 200) {
          console.log('✅ Email envoyé via Brevo API à', client.email);
          resolve({ success: true, messageId: res.headers['x-message-id'] });
        } else {
          console.error('❌ Erreur Brevo API:', res.statusCode, responseData);
          reject(new Error(`Brevo API error: ${res.statusCode}`));
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('❌ Erreur envoi email:', error.message);
      reject(new Error(`Erreur d'envoi: ${error.message}`));
    });
    
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Timeout de la requête'));
    });
    
    req.write(postData);
    req.end();
  });
};

module.exports = { sendInvoiceEmail };