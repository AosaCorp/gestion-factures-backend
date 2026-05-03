const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const formatAmount = (amount) => {
  const num = parseFloat(amount);
  if (isNaN(num)) return '0 FCFA';
  let formatted = num.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  formatted = formatted.replace(/\u202F/g, ' ');
  return formatted + ' FCFA';
};

const formatInvoiceNumber = (number) => {
  if (!number) return 'FAC-0000-0000';
  const match = number.match(/FACT-(\d{2})(\d{2})(\d{2})-(\d+)/);
  if (match) {
    const year = '20' + match[1];
    const month = match[2];
    const day = match[3];
    const counter = match[4];
    return `FAC-${year}-${month}${day}-${counter.padStart(4, '0')}`;
  }
  if (number.startsWith('FAC-')) return number;
  return number;
};

const generateInvoicePDF = (invoice, client, items, payments, company) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const buffers = [];
      
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      
      let currentY = 50;
      
      // Logo
      if (company && company.logo) {
        try {
          const possiblePaths = [
            path.join(__dirname, '../../', company.logo),
            path.join(__dirname, '../uploads', path.basename(company.logo)),
            path.join(process.cwd(), 'uploads', path.basename(company.logo)),
            path.join('/opt/render/project/src/backend/uploads', path.basename(company.logo))
          ];
          
          let logoPath = null;
          for (const p of possiblePaths) {
            if (fs.existsSync(p)) {
              logoPath = p;
              break;
            }
          }
          
          if (logoPath && fs.existsSync(logoPath)) {
            doc.image(logoPath, 50, currentY, { width: 60 });
          }
        } catch (err) {
          console.error('Erreur chargement logo:', err.message);
        }
      }
      
      // En-tête
      doc.font('Helvetica-Bold').fontSize(20);
      doc.text('FACTURE', 0, currentY, { align: 'center' });
      currentY += 30;
      
      doc.font('Helvetica-Bold').fontSize(12);
      doc.text(`N° ${formatInvoiceNumber(invoice.number)}`, 0, currentY, { align: 'center' });
      currentY += 20;
      
      doc.font('Helvetica').fontSize(10);
      const emissionDate = invoice.createdAt ? new Date(invoice.createdAt) : new Date();
      doc.text(`Date d'émission : ${emissionDate.toLocaleDateString('fr-FR')}`, 0, currentY, { align: 'center' });
      currentY += 40;
      
      // Client
      doc.font('Helvetica-Bold').fontSize(12);
      doc.text('Client:', 50, currentY);
      currentY += 20;
      
      doc.font('Helvetica').fontSize(10);
      doc.text(`Nom: ${client.name || ''}`, 50, currentY);
      currentY += 15;
      if (client.email) doc.text(`Email: ${client.email}`, 50, currentY);
      currentY += 15;
      if (client.phone) doc.text(`Tél: ${client.phone}`, 50, currentY);
      currentY += 15;
      if (client.address) doc.text(`Adresse: ${client.address}`, 50, currentY);
      currentY += 40;
      
      // Tableau
      doc.font('Helvetica-Bold').fontSize(12);
      doc.text('Détails', 50, currentY);
      currentY += 25;
      
      const colArticle = 50;
      const colDesc = 150;
      const colQty = 280;
      const colPrice = 330;
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
      
      doc.moveTo(50, currentY).lineTo(550, currentY).stroke();
      currentY += 10;
      
      doc.font('Helvetica').fontSize(9);
      
      for (const item of items) {
        const articleName = item.productName || 'Produit';
        const description = item.productDescription || '';
        const quantity = item.quantity || 1;
        const unitPrice = parseFloat(item.unitPrice) || 0;
        const taxRate = parseFloat(item.taxRate) || 19.25;
        const totalItem = parseFloat(item.total) || 0;
        
        doc.text(articleName, colArticle, currentY);
        doc.text(description, colDesc, currentY);
        doc.text(quantity.toString(), colQty, currentY);
        // CORRECTION IMPORTANTE : Prix unitaire SEUL
        doc.text(formatAmount(unitPrice), colPrice, currentY);
        doc.text(taxRate.toFixed(2).replace('.', ',') + ' %', colTax, currentY);
        doc.text(formatAmount(totalItem), colTotal, currentY);
        
        currentY += 20;
        
        if (currentY > 700) {
          doc.addPage();
          currentY = 50;
        }
      }
      
      doc.moveTo(50, currentY).lineTo(550, currentY).stroke();
      currentY += 20;
      
      // Totaux
      const subtotal = parseFloat(invoice.subtotal) || 0;
      const taxTotal = parseFloat(invoice.taxTotal) || 0;
      const total = parseFloat(invoice.total) || 0;
      const taxRateLabel = subtotal > 0 ? ((taxTotal / subtotal) * 100).toFixed(2).replace('.', ',') : '19,25';
      
      doc.font('Helvetica').fontSize(10);
      doc.text(`Sous-total: ${formatAmount(subtotal)}`, 400, currentY, { align: 'right', width: 150 });
      currentY += 20;
      doc.text(`TVA (${taxRateLabel} %) : ${formatAmount(taxTotal)}`, 400, currentY, { align: 'right', width: 150 });
      currentY += 25;
      doc.font('Helvetica-Bold').fontSize(12);
      doc.text(`TOTAL : ${formatAmount(total)}`, 400, currentY, { align: 'right', width: 150 });
      currentY += 40;
      
      // Paiements
      if (payments && payments.length > 0) {
        doc.font('Helvetica-Bold').fontSize(12);
        doc.text('Paiements effectués', 50, currentY);
        currentY += 25;
        
        doc.font('Helvetica-Bold').fontSize(10);
        doc.text('Date', 50, currentY);
        doc.text('Montant', 180, currentY);
        doc.text('Méthode', 300, currentY);
        doc.text('Reçu par', 420, currentY);
        currentY += 15;
        
        doc.moveTo(50, currentY).lineTo(550, currentY).stroke();
        currentY += 10;
        
        doc.font('Helvetica').fontSize(9);
        for (const pmt of payments) {
          doc.text(new Date(pmt.createdAt).toLocaleDateString('fr-FR'), 50, currentY);
          doc.text(formatAmount(pmt.amount), 180, currentY);
          
          let methodLabel = '';
          if (pmt.method === 'cash') methodLabel = 'Espèces';
          else if (pmt.method === 'orange_money') methodLabel = 'Orange Money';
          else if (pmt.method === 'mtn_money') methodLabel = 'MTN Money';
          else methodLabel = pmt.method;
          doc.text(methodLabel, 300, currentY);
          doc.text(pmt.receiver ? pmt.receiver.name : '', 420, currentY);
          currentY += 20;
        }
        
        const totalPaid = payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
        const remaining = total - totalPaid;
        currentY += 10;
        doc.font('Helvetica-Bold').fontSize(10);
        doc.text(`Solde restant : ${remaining > 0 ? formatAmount(remaining) : '0 FCFA'}`, 400, currentY, { align: 'right', width: 150 });
        currentY += 30;
      }
      
      // Pied de page
      doc.font('Helvetica').fontSize(10);
      doc.text('Merci de votre confiance !', 0, 750, { align: 'center' });
      
      doc.end();
      
    } catch (err) {
      console.error('Erreur génération PDF:', err);
      reject(err);
    }
  });
};

module.exports = { generateInvoicePDF };