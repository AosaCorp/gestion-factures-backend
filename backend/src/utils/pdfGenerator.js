const PDFDocument = require('pdfkit');
const fs = require('fs');

const generateInvoicePDF = (invoice, client, items, payments, company) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const buffers = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {
      const pdfData = Buffer.concat(buffers);
      resolve(pdfData);
    });

    // En-tête avec logo et informations de l'entreprise
    let yPosition = 50;
    if (company && company.logo) {
      try {
        if (fs.existsSync(company.logo)) {
          doc.image(company.logo, 50, yPosition, { width: 50 });
        }
      } catch (err) {
        console.error('Erreur chargement logo:', err);
      }
      doc.fontSize(10).text(company.name || '', 400, yPosition, { align: 'right' });
      if (company.address) doc.text(company.address, 400, yPosition + 15, { align: 'right' });
      if (company.phone) doc.text(`Tél: ${company.phone}`, 400, yPosition + 30, { align: 'right' });
      if (company.email) doc.text(`Email: ${company.email}`, 400, yPosition + 45, { align: 'right' });
      if (company.taxId) doc.text(`N° fiscal: ${company.taxId}`, 400, yPosition + 60, { align: 'right' });
      yPosition += 80;
    } else {
      yPosition = 80;
    }

    doc.fontSize(20).text('FACTURE', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`N° ${invoice.number}`);
    doc.text(`Date: ${new Date(invoice.createdAt).toLocaleDateString('fr-FR')}`);
    doc.moveDown();

    doc.fontSize(14).text('Client:');
    doc.fontSize(12).text(client.name);
    if (client.email) doc.text(`Email: ${client.email}`);
    if (client.phone) doc.text(`Tél: ${client.phone}`);
    if (client.address) doc.text(`Adresse: ${client.address}`);
    doc.moveDown();

    doc.fontSize(14).text('Détails:');
    const tableTop = doc.y;
    const itemX = 50;
    const descX = 150;
    const qtyX = 300;
    const priceX = 350;
    const taxX = 400;
    const totalX = 470;

    doc.fontSize(10).text('Article', itemX, tableTop);
    doc.text('Description', descX, tableTop);
    doc.text('Qté', qtyX, tableTop);
    doc.text('P.U.', priceX, tableTop);
    doc.text('TVA%', taxX, tableTop);
    doc.text('Total', totalX, tableTop);

    let y = tableTop + 20;
    items.forEach(item => {
      doc.text(item.description || 'Produit', itemX, y);
      doc.text(item.quantity.toString(), qtyX, y);
      doc.text(item.unitPrice.toFixed(2) + ' F', priceX, y);
      doc.text(item.taxRate + '%', taxX, y);
      doc.text(item.total.toFixed(2) + ' F', totalX, y);
      y += 20;
    });

    y += 10;
    doc.text(`Sous-total: ${invoice.subtotal.toFixed(2)} F`, totalX - 100, y, { align: 'right' });
    y += 20;
    doc.text(`TVA: ${invoice.taxTotal.toFixed(2)} F`, totalX - 100, y, { align: 'right' });
    y += 20;
    doc.fontSize(12).text(`TOTAL: ${invoice.total.toFixed(2)} F`, totalX - 100, y, { align: 'right' });

    if (payments && payments.length > 0) {
      y += 40;
      doc.fontSize(14).text('Paiements effectués:');
      y += 20;
      doc.fontSize(10).text('Date', 50, y);
      doc.text('Montant', 150, y);
      doc.text('Méthode', 250, y);
      doc.text('Reçu par', 350, y);
      y += 20;
      payments.forEach(pmt => {
        doc.text(new Date(pmt.createdAt).toLocaleDateString(), 50, y);
        doc.text(pmt.amount.toFixed(2) + ' F', 150, y);
        doc.text(pmt.method, 250, y);
        doc.text(pmt.receiver ? pmt.receiver.name : '', 350, y);
        y += 20;
      });
    }

    doc.fontSize(10).text('Merci de votre confiance !', 50, 700, { align: 'center' });
    doc.end();
  });
};

module.exports = { generateInvoicePDF };