/**
 * Service d'export PDF pour les statistiques
 * Utilise jspdf et jspdf-autotable
 */

// Fonction pour formater les montants
const formatAmount = (amount) => {
  if (isNaN(amount) || amount === undefined || amount === null) return '0 FCFA';
  return amount.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + ' FCFA';
};

/**
 * Génère un PDF de rapport statistique
 * @param {Object} data - Les données statistiques
 * @returns {Buffer} - Buffer du PDF
 */
const generateStatsPDF = async (data) => {
  // Importer jspdf dynamiquement pour éviter les erreurs d'import
  const jsPDF = (await import('jspdf')).default;
  const autoTable = (await import('jspdf-autotable')).default;
  
  const {
    revenue = { current: 0, previous: 0, growth: 0 },
    invoices = { current: 0, previous: 0, growth: 0 },
    clients = { current: 0, previous: 0, growth: 0 },
    conversion = { totalInvoices: 0, paidInvoices: 0, draftInvoices: 0, cancelledInvoices: 0, conversionRate: 0, target: 75 },
    topClients = []
  } = data;
  
  const doc = new jsPDF();
  let y = 20;
  
  // Titre
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Rapport Statistique', 14, y);
  y += 15;
  
  // Date
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Généré le: ${new Date().toLocaleDateString('fr-FR')}`, 14, y);
  y += 20;
  
  // Section Croissance
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Croissance', 14, y);
  y += 10;
  
  autoTable(doc, {
    startY: y,
    head: [['Indicateur', 'Période actuelle', 'Période précédente', 'Évolution']],
    body: [
      ['Chiffre d\'affaires', formatAmount(revenue.current), formatAmount(revenue.previous), revenue.growth.toFixed(1) + '%'],
      ['Factures', invoices.current, invoices.previous, invoices.growth.toFixed(1) + '%'],
      ['Clients', clients.current, clients.previous, clients.growth.toFixed(1) + '%']
    ],
    theme: 'striped',
    headStyles: { fillColor: [59, 130, 246], textColor: [255, 255, 255] },
    styles: { fontSize: 10 }
  });
  
  y = doc.lastAutoTable.finalY + 15;
  
  // Section Taux de conversion
  doc.text('Taux de conversion', 14, y);
  y += 10;
  
  const totalInv = conversion.totalInvoices || 1;
  autoTable(doc, {
    startY: y,
    head: [['Statut', 'Nombre', 'Pourcentage']],
    body: [
      ['Payées', conversion.paidInvoices || 0, ((conversion.paidInvoices / totalInv) * 100).toFixed(1) + '%'],
      ['En attente', conversion.draftInvoices || 0, ((conversion.draftInvoices / totalInv) * 100).toFixed(1) + '%'],
      ['Annulées', conversion.cancelledInvoices || 0, ((conversion.cancelledInvoices / totalInv) * 100).toFixed(1) + '%']
    ],
    theme: 'striped',
    headStyles: { fillColor: [59, 130, 246], textColor: [255, 255, 255] },
    styles: { fontSize: 10 }
  });
  
  y = doc.lastAutoTable.finalY + 15;
  
  // Section Top clients
  if (topClients.length > 0) {
    doc.text('Top clients', 14, y);
    y += 10;
    
    autoTable(doc, {
      startY: y,
      head: [['Client', 'Total dépensé']],
      body: topClients.slice(0, 10).map(c => [c.name, formatAmount(c.totalSpent)]),
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246], textColor: [255, 255, 255] },
      styles: { fontSize: 10 }
    });
    
    y = doc.lastAutoTable.finalY + 15;
  }
  
  // Pied de page
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.text('Rapport généré par l\'application Gestion Factures Association', 14, doc.internal.pageSize.height - 10);
  
  return Buffer.from(doc.output('arraybuffer'));
};

module.exports = { generateStatsPDF };