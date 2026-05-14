const QRCode = require('qrcode');

/**
 * Génère un QR Code sous forme de buffer (PNG)
 * @param {string} text - Le texte à encoder dans le QR Code
 * @param {Object} options - Options de génération
 * @returns {Promise<Buffer>} - Buffer contenant l'image PNG
 */
const generateQRCodeBuffer = async (text, options = {}) => {
  const defaultOptions = {
    errorCorrectionLevel: 'H',
    type: 'png',
    margin: 1,
    scale: 8,
    width: 150,
    color: {
      dark: '#000000',
      light: '#FFFFFF'
    }
  };
  
  const finalOptions = { ...defaultOptions, ...options };
  
  try {
    const buffer = await QRCode.toBuffer(text, finalOptions);
    return buffer;
  } catch (error) {
    console.error('Erreur génération QR Code:', error);
    throw new Error('Erreur lors de la génération du QR Code');
  }
};

/**
 * Génère un QR Code pour une facture
 * @param {Object} invoice - L'objet facture
 * @param {string} baseUrl - L'URL de base du frontend
 * @returns {Promise<Buffer>} - Buffer contenant l'image PNG
 */
const generateInvoiceQRCode = async (invoice, baseUrl = null) => {
  const frontendUrl = baseUrl || process.env.FRONTEND_URL || 'https://gestion-factures-frontend.onrender.com';
  
  // URL de la page de détail de la facture
  const invoiceUrl = `${frontendUrl}/invoices/${invoice.id}`;
  
  // Informations supplémentaires pour le paiement (optionnel)
  const paymentInfo = {
    invoiceNumber: invoice.number,
    amount: invoice.total,
    currency: 'XAF',
    reference: `FACT-${invoice.id}`
  };
  
  // Encoder les informations dans le QR Code
  const qrData = JSON.stringify({
    url: invoiceUrl,
    ...paymentInfo
  });
  
  return generateQRCodeBuffer(qrData);
};

/**
 * Génère un QR Code pour le paiement mobile (Orange Money / MTN Money)
 * @param {Object} invoice - L'objet facture
 * @param {string} phoneNumber - Numéro de téléphone du client
 * @returns {Promise<Buffer>} - Buffer contenant l'image PNG
 */
const generatePaymentQRCode = async (invoice, phoneNumber) => {
  // Format de paiement mobile (à adapter selon l'API réelle)
  const paymentData = {
    merchantId: process.env.MERCHANT_ID || 'ASSOC001',
    amount: invoice.total,
    currency: 'XAF',
    phoneNumber: phoneNumber,
    reference: invoice.number,
    description: `Paiement facture ${invoice.number}`
  };
  
  const qrData = JSON.stringify(paymentData);
  return generateQRCodeBuffer(qrData);
};

module.exports = {
  generateQRCodeBuffer,
  generateInvoiceQRCode,
  generatePaymentQRCode
};