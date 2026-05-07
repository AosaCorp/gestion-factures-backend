const nodemailer = require('nodemailer');

// Configuration du transporteur email
const createTransporter = () => {
  // Pour Gmail (recommandé pour les tests)
  if (process.env.EMAIL_SERVICE === 'gmail') {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  }
  
  // Pour SendGrid ou autre service SMTP
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
  
  // Configuration par défaut (pour test - emails visibles dans la console)
  return {
    sendMail: (mailOptions) => {
      console.log('📧 EMAIL SIMULÉ (aucun transport configuré)');
      console.log('   To:', mailOptions.to);
      console.log('   Subject:', mailOptions.subject);
      console.log('   Body:', mailOptions.html?.substring(0, 200) + '...');
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
 * @returns {Promise}
 */
const sendInvoiceEmail = async (invoice, client, pdfBuffer, company = null) => {
  const companyName = company?.name || 'Notre entreprise';
  const companyEmail = company?.email || process.env.COMPANY_EMAIL || 'factures@entreprise.com';
  
  const subject = `Facture ${invoice.number} de ${companyName}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; color: #333; line-height: 1.6; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; border-bottom: 2px solid #3b82f6; padding-bottom: 15px; margin-bottom: 20px; }
        .header h1 { color: #3b82f6; margin: 0; }
        .content { margin-bottom: 30px; }
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
        
        <div class="content">
          <p>Bonjour <strong>${client.name}</strong>,</p>
          <p>Nous vous remercions pour votre confiance. Veuillez trouver ci-joint la facture <strong>${invoice.number}</strong>.</p>
          
          <div class="invoice-details">
            <table>
              <tr><td><strong>N° Facture:</strong></td><td>${invoice.number}</td></tr>
              <tr><td><strong>Date d'émission:</strong></td><td>${new Date(invoice.createdAt).toLocaleDateString('fr-FR')}</td></tr>
              <tr><td><strong>Montant HT:</strong></td><td>${invoice.subtotal.toLocaleString()} FCFA</td></tr>
              <tr><td><strong>TVA (19,25%):</strong></td><td>${invoice.taxTotal.toLocaleString()} FCFA</td></tr>
              <tr><td><strong class="total">Total TTC:</strong></td><td><strong class="total">${invoice.total.toLocaleString()} FCFA</strong></td></tr>
            </table>
          </div>
          
          <p>Le règlement est à effectuer selon les modalités convenues.</p>
          <p>Ce document fait office de facture légale.</p>
        </div>
        
        <div class="footer">
          <p>${companyName} - ${company?.email || companyEmail}</p>
          <p>Ce message est généré automatiquement, merci de ne pas y répondre.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  const mailOptions = {
    from: `"${companyName}" <${companyEmail}>`,
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