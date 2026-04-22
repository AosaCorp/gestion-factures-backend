const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Fonction utilitaire pour formater les montants en FCFA
const formatAmount = (amount) => {
  return amount.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' FCFA';
};

const generateInvoicePDF = (invoice, client, items, payments, company) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const buffers = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {
      const pdfData = Buffer.concat(buffers);
      resolve(pdfData);
    });

    // ========== EN-TÊTE ==========
    let currentY = 50;

    // Logo (haut gauche)
    if (company && company.logo) {
      try {
        // company.logo contient le chemin relatif (ex: "uploads/logo-xxx.png")
        const logoPath = path.join(__dirname, '../../', company.logo);
        if (fs.existsSync(logoPath)) {
          doc.image(logoPath, 50, currentY, { width: 60 });
        } else {
          console.warn('Logo introuvable:', logoPath);
        }
      } catch (err) {
        console.error('Erreur chargement logo:', err);
      }
    }

    // Titre FACTURE (centré)
    doc.font('Helvetica-Bold').fontSize(24).text('FACTURE', 0, currentY, { align: 'center' });

    // Informations facture (haut droite)
    const rightX = 450;
    doc.font('Helvetica').fontSize(10);
    doc.text(`N° FACT: ${invoice.number}`, rightX, currentY, { align: 'right' });
    doc.text(`Date: ${new Date(invoice.createdAt).toLocaleDateString('fr-FR')}`, rightX, currentY + 15, { align: 'right' });

    currentY += 60;

    // ========== BLOC CLIENT ==========
    doc.font('Helvetica-Bold').fontSize(12).text('Client:', 50, currentY);
    currentY += 20;
    doc.font('Helvetica').fontSize(10);
    doc.text(`Nom: ${client.name}`, 50, currentY);
    if (client.email) doc.text(`Email: ${client.email}`, 50, currentY + 15);
    if (client.phone) doc.text(`Tél: ${client.phone}`, 50, currentY + 30);
    if (client.address) doc.text(`Adresse: ${client.address}`, 50, currentY + 45);
    currentY += 70;

    // ========== TABLEAU DES ARTICLES ==========
    doc.font('Helvetica-Bold').fontSize(12).text('Détails', 50, currentY);
    currentY += 20;

    // En-têtes du tableau
    const colArticle = 50;
    const colDesc = 150;
    const colQty = 300;
    const colPrice = 350;
    const colTax = 400;
    const colTotal = 470;

    doc.font('Helvetica-Bold').fontSize(10);
    doc.text('Article', colArticle, currentY);
    doc.text('Description', colDesc, currentY);
    doc.text('Qté', colQty, currentY);
    doc.text('P.U.', colPrice, currentY);
    doc.text('TVA%', colTax, currentY);
    doc.text('Total', colTotal, currentY);
    currentY += 15;

    // Ligne de séparation
    doc.moveTo(50, currentY).lineTo(550, currentY).stroke();
    currentY += 10;

    // Lignes des articles
    doc.font('Helvetica').fontSize(9);
    items.forEach(item => {
      doc.text(item.description || 'Produit', colArticle, currentY);
      doc.text(item.quantity.toString(), colQty, currentY);
      doc.text(formatAmount(item.unitPrice), colPrice, currentY);
      doc.text(item.taxRate + '%', colTax, currentY);
      doc.text(formatAmount(item.total), colTotal, currentY);
      currentY += 20;
    });

    // Ligne de séparation
    doc.moveTo(50, currentY).lineTo(550, currentY).stroke();
    currentY += 15;

    // ========== TOTAUX (alignés à droite) ==========
    const totalsX = 400;
    doc.font('Helvetica').fontSize(10);
    doc.text(`Sous-total: ${formatAmount(invoice.subtotal)}`, totalsX, currentY, { align: 'right' });
    currentY += 20;
    doc.text(`TVA: ${formatAmount(invoice.taxTotal)}`, totalsX, currentY, { align: 'right' });
    currentY += 25;
    doc.font('Helvetica-Bold').fontSize(12);
    doc.text(`TOTAL: ${formatAmount(invoice.total)}`, totalsX, currentY, { align: 'right' });
    currentY += 40;

    // ========== TABLEAU DES PAIEMENTS ==========
    if (payments && payments.length > 0) {
      doc.font('Helvetica-Bold').fontSize(12).text('Paiements effectués', 50, currentY);
      currentY += 20;

      const colDate = 50;
      const colAmount = 180;
      const colMethod = 300;
      const colReceiver = 420;

      doc.font('Helvetica-Bold').fontSize(10);
      doc.text('Date', colDate, currentY);
      doc.text('Montant', colAmount, currentY);
      doc.text('Méthode', colMethod, currentY);
      doc.text('Reçu par', colReceiver, currentY);
      currentY += 15;
      doc.moveTo(50, currentY).lineTo(550, currentY).stroke();
      currentY += 10;

      doc.font('Helvetica').fontSize(9);
      payments.forEach(pmt => {
        doc.text(new Date(pmt.createdAt).toLocaleDateString('fr-FR'), colDate, currentY);
        doc.text(formatAmount(pmt.amount), colAmount, currentY);
        let methodLabel = '';
        if (pmt.method === 'cash') methodLabel = 'Espèces';
        else if (pmt.method === 'orange_money') methodLabel = 'Orange Money';
        else if (pmt.method === 'mtn_money') methodLabel = 'MTN Money';
        else methodLabel = pmt.method;
        doc.text(methodLabel, colMethod, currentY);
        doc.text(pmt.receiver ? pmt.receiver.name : '', colReceiver, currentY);
        currentY += 20;
      });
      currentY += 10;
    }

    // ========== PIED DE PAGE ==========
    doc.font('Helvetica').fontSize(10);
    doc.text('Merci de votre confiance !', 0, 750, { align: 'center' });

    doc.end();
  });
};

module.exports = { generateInvoicePDF };