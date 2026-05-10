// backend/src/services/emailService.js
const nodemailer = require('nodemailer');

// Configuration du transporteur email
const createTransporter = () => {
  // Configuration pour Brevo (gratuit, 300 emails/mois)
  if (process.env.EMAIL_SERVICE === 'brevo') {
    console.log('📧 Configuration Brevo (SMTP)');
    return nodemailer.createTransport({
      host: 'smtp-relay.brevo.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.BREVO_API_KEY,
        pass: process.env.BREVO_API_KEY
      }
    });
  }
  
  // Configuration pour Gmail (UNIQUEMENT en local)
  if (process.env.EMAIL_SERVICE === 'gmail' && process.env.NODE_ENV !== 'production') {
    console.log('📧 Configuration Gmail (local uniquement)');
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  }
  
  // Mode simulation (développement)
  console.log('⚠️ MODE SIMULATION : Les emails seront affichés dans la console.');
  return {
    sendMail: (mailOptions) => {
      console.log('📧 EMAIL SIMULÉ');
      console.log('   To:', mailOptions.to);
      console.log('   Subject:', mailOptions.subject);
      console.log('   Attachments:', mailOptions.attachments?.length || 0);
      return Promise.resolve({ messageId: 'simulated-' + Date.now() });
    }
  };
};

const transporter = createTransporter();

// Formatage des montants
const formatMontant = (montant) => {
  if (isNaN(montant)) return '0 FCFA';
  return montant.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' FCFA';
};

/**
 * Envoie une facture par email
 */
const sendInvoiceEmail = async (invoice, client, pdfBuffer, company = null) => {
  const companyName = company?.name || 'Notre association';
  const fromEmail = process.env.BREVO_SENDER_EMAIL || process.env.COMPANY_EMAIL || 'noreply@association.com';
  
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
    console.log('✅ Email envoyé à', client.email);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Erreur envoi email:', error.message);
    throw new Error(`Erreur d'envoi: ${error.message}`);
  }
};

module.exports = { sendInvoiceEmail };