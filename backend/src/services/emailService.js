// backend/src/services/emailService.js
const nodemailer = require('nodemailer');

// Configuration du transporteur email
const createTransporter = () => {
  // Configuration pour Brevo (recommandé pour Render)
  if (process.env.EMAIL_SERVICE === 'brevo') {
    return nodemailer.createTransport({
      host: 'smtp-relay.brevo.com',
      port: 587,
      secure: false, // STARTTLS
      auth: {
        user: process.env.BREVO_API_KEY, // Ta clé API est le nom d'utilisateur
        pass: process.env.BREVO_API_KEY  // Ta clé API est aussi le mot de passe
      }
    });
  }
  
  // Configuration pour SendGrid (en backup)
  if (process.env.EMAIL_SERVICE === 'sendgrid') {
    return nodemailer.createTransport({
      host: 'smtp.sendgrid.net',
      port: 587,
      secure: false,
      auth: {
        user: 'apikey',
        pass: process.env.SENDGRID_API_KEY
      }
    });
  }
  
  // Pour un serveur SMTP générique
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }
  
  // Configuration par défaut (pour développement - emails visibles dans la console)
  console.log('⚠️ Aucune configuration email trouvée. Les emails seront affichés dans la console.');
  return {
    sendMail: (mailOptions) => {
      console.log('📧 EMAIL SIMULÉ');
      console.log('   To:', mailOptions.to);
      console.log('   Subject:', mailOptions.subject);
      console.log('   Body aperçu:', mailOptions.html?.substring(0, 200) + '...');
      return Promise.resolve({ messageId: 'simulated-' + Date.now() });
    }
  };
};

const transporter = createTransporter();

/**
 * Envoie une facture par email
 * @param {Object} invoice - Objet facture
 * @param {Object} client - Objet client
 * @param {Buffer} pdfBuffer - Buffer du PDF
 * @param {Object} company - Informations de l'entreprise
 * @returns {Promise<{success: boolean, messageId: string}>}
 */
const sendInvoiceEmail = async (invoice, client, pdfBuffer, company = null) => {
  const companyName = company?.name || 'Notre entreprise';
  const fromEmail = company?.email || process.env.FROM_EMAIL || process.env.COMPANY_EMAIL || 'noreply@entreprise.com';
  
  const subject = `Facture ${invoice.number} - ${companyName}`;
  
  // Formatage des montants
  const formatMontant = (montant) => {
    return montant.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' FCFA';
  };
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Facture ${invoice.number}</title>
      <style>
        body { font-family: Arial, sans-serif; color: #333; line-height: 1.6; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; border-bottom: 2px solid #3b82f6; padding-bottom: 15px; margin-bottom: 20px; }
        .header h1 { color: #3b82f6; margin: 0; font-size: 24px; }
        .content { margin-bottom: 30px; }
        .invoice-details { background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0; }
        .invoice-details table { width: 100%; border-collapse: collapse; }
        .invoice-details td { padding: 8px 0; }
        .invoice-details tr td:first-child { font-weight: bold; width: 40%; }
        .total { font-size: 18px; font-weight: bold; color: #3b82f6; }
        .footer { text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 15px; margin-top: 20px; }
        .button { display: inline-block; background-color: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 15px; }
        .amount { font-weight: bold; color: #10b981; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${companyName}</h1>
          ${company?.address ? `<p>${company.address}</p>` : ''}
          ${company?.phone ? `<p>Tél: ${company.phone}</p>` : ''}
        </div>
        
        <div class="content">
          <p>Bonjour <strong>${client.name}</strong>,</p>
          <p>Nous vous remercions pour votre confiance. Veuillez trouver ci-joint la facture <strong>${invoice.number}</strong>.</p>
          
          <div class="invoice-details">
            <table>
              <tr>
                <td>N° Facture:</td>
                <td><strong>${invoice.number}</strong></td>
              </tr>
              <tr>
                <td>Date d'émission:</td>
                <td>${new Date(invoice.createdAt).toLocaleDateString('fr-FR')}</td>
              </tr>
              <tr>
                <td>Montant HT:</td>
                <td>${formatMontant(invoice.subtotal)}</td>
              </tr>
              <tr>
                <td>TVA (19,25%):</td>
                <td>${formatMontant(invoice.taxTotal)}</td>
              </tr>
              <tr style="border-top: 1px solid #ddd;">
                <td style="padding-top: 10px;"><strong>Total TTC:</strong></td>
                <td style="padding-top: 10px;"><strong class="total">${formatMontant(invoice.total)}</strong></td>
              </tr>
            </table>
          </div>
          
          <p><strong>Articles de la facture :</strong></p>
          <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
            <thead>
              <tr style="background-color: #f3f4f6;">
                <th style="padding: 8px; text-align: left;">Article</th>
                <th style="padding: 8px; text-align: center;">Qté</th>
                <th style="padding: 8px; text-align: right;">Prix unitaire</th>
                <th style="padding: 8px; text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${(invoice.items || []).map(item => `
                <tr style="border-bottom: 1px solid #e5e7eb;">
                  <td style="padding: 8px;">${item.productName || 'Produit'}</td>
                  <td style="padding: 8px; text-align: center;">${item.quantity}</td>
                  <td style="padding: 8px; text-align: right;">${formatMontant(item.unitPrice)}</td>
                  <td style="padding: 8px; text-align: right;">${formatMontant(item.total)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <p>Le règlement est à effectuer selon les modalités convenues.</p>
          <p>Ce document fait office de facture légale.</p>
        </div>
        
        <div class="footer">
          <p>${companyName} - ${fromEmail}</p>
          <p>Ce message est généré automatiquement, merci de ne pas y répondre.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  const mailOptions = {
    from: `"${companyName}" <${fromEmail}>`,
    to: client.email,
    subject: subject,
    html: html,
    attachments: [
      {
        filename: `facture-${invoice.number}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf'
      }
    ]
  };
  
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email envoyé à', client.email, 'ID:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Erreur envoi email:', error);
    throw new Error(`Erreur d'envoi: ${error.message}`);
  }
};

module.exports = { sendInvoiceEmail };