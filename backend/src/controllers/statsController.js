const { Client, Product, Invoice, Payment, User, sequelize } = require('../models');
const { Op } = require('sequelize');

// Statistiques de base (existantes)
exports.getStats = async (req, res) => {
  try {
    const clientsCount = await Client.count();
    const productsCount = await Product.count();
    const invoicesCount = await Invoice.count();
    const paymentsCount = await Payment.count();

    const totalRevenue = await Invoice.sum('total', { where: { status: 'paid' } }) || 0;
    const totalPayments = await Payment.sum('amount') || 0;
    const draftInvoices = await Invoice.count({ where: { status: 'draft' } });
    const paidInvoices = await Invoice.count({ where: { status: 'paid' } });
    const cancelledInvoices = await Invoice.count({ where: { status: 'cancelled' } });

    const allInvoices = await Invoice.findAll({ attributes: ['total'] });
    const sumTotal = allInvoices.reduce((acc, inv) => acc + parseFloat(inv.total), 0);
    const averageInvoice = allInvoices.length > 0 ? sumTotal / allInvoices.length : 0;

    const totalAllInvoices = await Invoice.sum('total') || 0;
    const totalUnpaid = totalAllInvoices - totalPayments;

    res.json({
      clients: clientsCount,
      products: productsCount,
      invoices: invoicesCount,
      payments: paymentsCount,
      totalRevenue,
      totalPayments,
      draftInvoices,
      paidInvoices,
      cancelledInvoices,
      averageInvoice,
      totalUnpaid
    });
  } catch (error) {
    console.error('Erreur stats:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// ========== NOUVELLES STATISTIQUES AVANCÉES ==========

/**
 * Statistiques mensuelles des 12 derniers mois
 */
exports.getMonthlyStats = async (req, res) => {
  try {
    const months = [];
    const revenues = [];
    const paidAmounts = [];
    const invoiceCounts = [];
    
    // 12 derniers mois
    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const year = date.getFullYear();
      const month = date.getMonth();
      
      const startDate = new Date(year, month, 1);
      const endDate = new Date(year, month + 1, 0, 23, 59, 59);
      
      const monthName = date.toLocaleString('fr-FR', { month: 'long' });
      months.push(`${monthName} ${year}`);
      
      // Total des ventes (factures payées)
      const revenue = await Invoice.sum('total', {
        where: {
          status: 'paid',
          createdAt: { [Op.between]: [startDate, endDate] }
        }
      }) || 0;
      revenues.push(revenue);
      
      // Total encaissé (paiements)
      const paid = await Payment.sum('amount', {
        where: {
          createdAt: { [Op.between]: [startDate, endDate] }
        }
      }) || 0;
      paidAmounts.push(paid);
      
      // Nombre de factures
      const count = await Invoice.count({
        where: {
          createdAt: { [Op.between]: [startDate, endDate] }
        }
      });
      invoiceCounts.push(count);
    }
    
    res.json({
      months,
      revenues,
      paidAmounts,
      invoiceCounts
    });
  } catch (error) {
    console.error('Erreur monthlyStats:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

/**
 * Top clients (meilleurs clients par montant dépensé)
 */
exports.getTopClients = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    const topClients = await Invoice.findAll({
      attributes: [
        'clientId',
        [sequelize.fn('SUM', sequelize.col('total')), 'totalSpent']
      ],
      where: { status: 'paid' },
      include: [
        { model: Client, as: 'client', attributes: ['id', 'name', 'email', 'phone'] }
      ],
      group: ['clientId', 'client.id'],
      order: [[sequelize.literal('totalSpent'), 'DESC']],
      limit: limit
    });
    
    const formattedClients = topClients.map(item => ({
      id: item.client.id,
      name: item.client.name,
      email: item.client.email,
      phone: item.client.phone,
      totalSpent: parseFloat(item.dataValues.totalSpent) || 0,
      invoicesCount: 0 // À calculer séparément si besoin
    }));
    
    // Ajouter le nombre de factures pour chaque client
    for (const client of formattedClients) {
      const count = await Invoice.count({
        where: { clientId: client.id, status: 'paid' }
      });
      client.invoicesCount = count;
    }
    
    res.json(formattedClients);
  } catch (error) {
    console.error('Erreur topClients:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

/**
 * Prévision des ventes (basée sur la moyenne des 3 derniers mois)
 */
exports.getSalesForecast = async (req, res) => {
  try {
    const months = [];
    const historical = [];
    const forecast = [];
    
    // Récupérer les 6 derniers mois
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const year = date.getFullYear();
      const month = date.getMonth();
      
      const startDate = new Date(year, month, 1);
      const endDate = new Date(year, month + 1, 0, 23, 59, 59);
      
      const monthName = date.toLocaleString('fr-FR', { month: 'short' });
      months.push(`${monthName} ${year}`);
      
      const revenue = await Invoice.sum('total', {
        where: {
          status: 'paid',
          createdAt: { [Op.between]: [startDate, endDate] }
        }
      }) || 0;
      historical.push(revenue);
    }
    
    // Calculer la prévision (moyenne des 3 derniers mois)
    const last3MonthsAvg = historical.slice(-3).reduce((a, b) => a + b, 0) / 3;
    
    // Générer les 3 prochains mois
    for (let i = 1; i <= 3; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() + i);
      const monthName = date.toLocaleString('fr-FR', { month: 'short' });
      forecast.push({
        month: `${monthName} ${date.getFullYear()}`,
        predicted: Math.round(last3MonthsAvg),
        optimistic: Math.round(last3MonthsAvg * 1.2),
        pessimistic: Math.round(last3MonthsAvg * 0.8)
      });
    }
    
    res.json({
      months: months.slice(-6),
      historical: historical.slice(-6),
      forecast,
      averageGrowth: historical.slice(-3).reduce((a, b) => a + b, 0) / historical.slice(-6).reduce((a, b) => a + b, 0) * 100
    });
  } catch (error) {
    console.error('Erreur salesForecast:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

/**
 * Taux de conversion (factures payées vs émises)
 */
exports.getConversionRate = async (req, res) => {
  try {
    const totalInvoices = await Invoice.count();
    const paidInvoices = await Invoice.count({ where: { status: 'paid' } });
    const draftInvoices = await Invoice.count({ where: { status: 'draft' } });
    const cancelledInvoices = await Invoice.count({ where: { status: 'cancelled' } });
    
    const conversionRate = totalInvoices > 0 ? (paidInvoices / totalInvoices) * 100 : 0;
    
    res.json({
      totalInvoices,
      paidInvoices,
      draftInvoices,
      cancelledInvoices,
      conversionRate: Math.round(conversionRate * 10) / 10,
      target: 75 // Objectif de conversion à 75%
    });
  } catch (error) {
    console.error('Erreur conversionRate:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

/**
 * Croissance globale (évolution sur la période)
 */
exports.getGrowthStats = async (req, res) => {
  try {
    const period = req.query.period || 'month'; // month, quarter, year
    
    let startDate, endDate, previousStartDate;
    const now = new Date();
    
    if (period === 'month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      previousStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    } else if (period === 'quarter') {
      const quarter = Math.floor(now.getMonth() / 3);
      startDate = new Date(now.getFullYear(), quarter * 3, 1);
      previousStartDate = new Date(now.getFullYear(), (quarter - 1) * 3, 1);
    } else {
      startDate = new Date(now.getFullYear(), 0, 1);
      previousStartDate = new Date(now.getFullYear() - 1, 0, 1);
    }
    
    const endDatePeriod = new Date();
    
    // Période actuelle
    const currentRevenue = await Invoice.sum('total', {
      where: {
        status: 'paid',
        createdAt: { [Op.between]: [startDate, endDatePeriod] }
      }
    }) || 0;
    
    const currentInvoices = await Invoice.count({
      where: { createdAt: { [Op.between]: [startDate, endDatePeriod] } }
    });
    
    const currentClients = await Client.count({
      where: { createdAt: { [Op.between]: [startDate, endDatePeriod] } }
    });
    
    // Période précédente
    const previousRevenue = await Invoice.sum('total', {
      where: {
        status: 'paid',
        createdAt: { [Op.between]: [previousStartDate, startDate] }
      }
    }) || 0;
    
    const previousInvoices = await Invoice.count({
      where: { createdAt: { [Op.between]: [previousStartDate, startDate] } }
    });
    
    const previousClients = await Client.count({
      where: { createdAt: { [Op.between]: [previousStartDate, startDate] } }
    });
    
    const calculateGrowth = (current, previous) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };
    
    res.json({
      period,
      revenue: {
        current: currentRevenue,
        previous: previousRevenue,
        growth: calculateGrowth(currentRevenue, previousRevenue)
      },
      invoices: {
        current: currentInvoices,
        previous: previousInvoices,
        growth: calculateGrowth(currentInvoices, previousInvoices)
      },
      clients: {
        current: currentClients,
        previous: previousClients,
        growth: calculateGrowth(currentClients, previousClients)
      }
    });
  } catch (error) {
    console.error('Erreur growthStats:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

/**
 * Export des statistiques en PDF
 */
exports.exportStatsPDF = async (req, res) => {
  try {
    const jsPDF = require('jspdf');
    const autoTable = require('jspdf-autotable');
    
    // Récupérer les données
    const monthlyStats = await exports.getMonthlyStats({}, { json: () => {} });
    const monthlyData = monthlyStats._events ? monthlyStats : monthlyStats;
    
    // Récupérer les top clients
    const topClientsReq = { query: { limit: 5 } };
    let topClients = [];
    try {
      const clientsResult = await exports.getTopClients(topClientsReq, { json: (data) => data });
      topClients = clientsResult || [];
    } catch (err) {
      console.error('Erreur top clients:', err);
    }
    
    // Récupérer le taux de conversion
    let conversionRate = { totalInvoices: 0, paidInvoices: 0, draftInvoices: 0, cancelledInvoices: 0, conversionRate: 0, target: 75 };
    try {
      const conversionResult = await exports.getConversionRate({}, { json: (data) => data });
      conversionRate = conversionResult || conversionRate;
    } catch (err) {
      console.error('Erreur conversion:', err);
    }
    
    // Récupérer la croissance
    let growthStats = { revenue: { current: 0, previous: 0, growth: 0 }, invoices: { current: 0, previous: 0, growth: 0 }, clients: { current: 0, previous: 0, growth: 0 } };
    try {
      const growthReq = { query: { period: 'month' } };
      const growthResult = await exports.getGrowthStats(growthReq, { json: (data) => data });
      growthStats = growthResult || growthStats;
    } catch (err) {
      console.error('Erreur croissance:', err);
    }
    
    const doc = new jsPDF.jsPDF ? new jsPDF.jsPDF() : new jsPDF();
    let y = 20;
    
    doc.setFontSize(18);
    doc.text('Rapport Statistique', 14, y);
    y += 15;
    
    doc.setFontSize(12);
    doc.text(`Généré le: ${new Date().toLocaleDateString('fr-FR')}`, 14, y);
    y += 20;
    
    // Croissance
    doc.setFontSize(14);
    doc.text('Croissance', 14, y);
    y += 10;
    
    autoTable.default(doc, {
      startY: y,
      head: [['Indicateur', 'Période actuelle', 'Période précédente', 'Évolution']],
      body: [
        ['Chiffre d\'affaires', `${(growthStats.revenue.current || 0).toLocaleString()} F`, `${(growthStats.revenue.previous || 0).toLocaleString()} F`, `${(growthStats.revenue.growth || 0).toFixed(1)}%`],
        ['Factures', growthStats.invoices.current || 0, growthStats.invoices.previous || 0, `${(growthStats.invoices.growth || 0).toFixed(1)}%`],
        ['Clients', growthStats.clients.current || 0, growthStats.clients.previous || 0, `${(growthStats.clients.growth || 0).toFixed(1)}%`]
      ]
    });
    
    y = doc.lastAutoTable.finalY + 15;
    
    // Taux de conversion
    doc.text('Taux de conversion', 14, y);
    y += 10;
    
    const totalInv = conversionRate.totalInvoices || 1;
    autoTable.default(doc, {
      startY: y,
      head: [['Statut', 'Nombre', 'Pourcentage']],
      body: [
        ['Payées', conversionRate.paidInvoices || 0, `${((conversionRate.paidInvoices / totalInv) * 100).toFixed(1)}%`],
        ['En attente', conversionRate.draftInvoices || 0, `${((conversionRate.draftInvoices / totalInv) * 100).toFixed(1)}%`],
        ['Annulées', conversionRate.cancelledInvoices || 0, `${((conversionRate.cancelledInvoices / totalInv) * 100).toFixed(1)}%`]
      ]
    });
    
    y = doc.lastAutoTable.finalY + 15;
    
    // Top clients
    if (topClients.length > 0) {
      doc.text('Top clients', 14, y);
      y += 10;
      
      autoTable.default(doc, {
        startY: y,
        head: [['Client', 'Total dépensé', 'Factures']],
        body: topClients.slice(0, 5).map(c => [
          c.name,
          `${(c.totalSpent || 0).toLocaleString()} F`,
          c.invoicesCount || 0
        ])
      });
    }
    
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=rapport-statistiques.pdf');
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Erreur exportStatsPDF:', error);
    res.status(500).json({ message: 'Erreur export PDF: ' + error.message });
  }
};