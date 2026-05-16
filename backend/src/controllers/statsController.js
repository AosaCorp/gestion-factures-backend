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
    
    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const year = date.getFullYear();
      const month = date.getMonth();
      
      const startDate = new Date(year, month, 1);
      const endDate = new Date(year, month + 1, 0, 23, 59, 59);
      
      const monthName = date.toLocaleString('fr-FR', { month: 'long' });
      months.push(`${monthName} ${year}`);
      
      const revenue = await Invoice.sum('total', {
        where: {
          status: 'paid',
          createdAt: { [Op.between]: [startDate, endDate] }
        }
      }) || 0;
      revenues.push(revenue);
      
      const paid = await Payment.sum('amount', {
        where: {
          createdAt: { [Op.between]: [startDate, endDate] }
        }
      }) || 0;
      paidAmounts.push(paid);
      
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
    
    const formattedClients = [];
    for (const item of topClients) {
      if (item.client) {
        const count = await Invoice.count({
          where: { clientId: item.client.id, status: 'paid' }
        });
        formattedClients.push({
          id: item.client.id,
          name: item.client.name,
          email: item.client.email,
          phone: item.client.phone,
          totalSpent: parseFloat(item.dataValues.totalSpent) || 0,
          invoicesCount: count
        });
      }
    }
    
    res.json(formattedClients);
  } catch (error) {
    console.error('Erreur topClients:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

/**
 * Prévision des ventes
 */
exports.getSalesForecast = async (req, res) => {
  try {
    const months = [];
    const historical = [];
    
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
    
    const last3MonthsAvg = historical.slice(-3).reduce((a, b) => a + b, 0) / 3;
    
    const forecast = [];
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
      averageGrowth: historical.slice(-3).reduce((a, b) => a + b, 0) / (historical.slice(-6).reduce((a, b) => a + b, 0) || 1) * 100
    });
  } catch (error) {
    console.error('Erreur salesForecast:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

/**
 * Taux de conversion
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
      target: 75
    });
  } catch (error) {
    console.error('Erreur conversionRate:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

/**
 * Croissance globale
 */
exports.getGrowthStats = async (req, res) => {
  try {
    const period = req.query.period || 'month';
    
    let startDate, endDatePeriod, previousStartDate;
    const now = new Date();
    endDatePeriod = new Date();
    
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
 * Export des statistiques en PDF (version avec jspdf)
 */
exports.exportStatsPDF = async (req, res) => {
  try {
    const { generateStatsPDF } = require('../utils/pdfExportService');
    const { Op } = require('sequelize');
    
    // 1. Récupérer les données de croissance
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    const previousStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endDatePeriod = new Date();
    
    const currentRevenue = await Invoice.sum('total', {
      where: { status: 'paid', createdAt: { [Op.between]: [startDate, endDatePeriod] } }
    }) || 0;
    const previousRevenue = await Invoice.sum('total', {
      where: { status: 'paid', createdAt: { [Op.between]: [previousStartDate, startDate] } }
    }) || 0;
    const revenueGrowth = previousRevenue === 0 ? (currentRevenue > 0 ? 100 : 0) : ((currentRevenue - previousRevenue) / previousRevenue) * 100;
    
    const currentInvoices = await Invoice.count({ where: { createdAt: { [Op.between]: [startDate, endDatePeriod] } } });
    const previousInvoices = await Invoice.count({ where: { createdAt: { [Op.between]: [previousStartDate, startDate] } } });
    const invoicesGrowth = previousInvoices === 0 ? (currentInvoices > 0 ? 100 : 0) : ((currentInvoices - previousInvoices) / previousInvoices) * 100;
    
    const currentClients = await Client.count({ where: { createdAt: { [Op.between]: [startDate, endDatePeriod] } } });
    const previousClients = await Client.count({ where: { createdAt: { [Op.between]: [previousStartDate, startDate] } } });
    const clientsGrowth = previousClients === 0 ? (currentClients > 0 ? 100 : 0) : ((currentClients - previousClients) / previousClients) * 100;
    
    // 2. Récupérer le taux de conversion
    const totalInvoices = await Invoice.count();
    const paidInvoices = await Invoice.count({ where: { status: 'paid' } });
    const draftInvoices = await Invoice.count({ where: { status: 'draft' } });
    const cancelledInvoices = await Invoice.count({ where: { status: 'cancelled' } });
    
    // 3. Récupérer les top clients
    const topClientsRaw = await Invoice.findAll({
      attributes: ['clientId', [sequelize.fn('SUM', sequelize.col('total')), 'totalSpent']],
      where: { status: 'paid' },
      include: [{ model: Client, as: 'client', attributes: ['id', 'name'] }],
      group: ['clientId', 'client.id'],
      order: [[sequelize.literal('totalSpent'), 'DESC']],
      limit: 10
    });
    
    const topClients = [];
    for (const item of topClientsRaw) {
      if (item.client) {
        topClients.push({
          name: item.client.name,
          totalSpent: parseFloat(item.dataValues.totalSpent) || 0
        });
      }
    }
    
    // 4. Générer le PDF
    const pdfBuffer = await generateStatsPDF({
      revenue: { current: currentRevenue, previous: previousRevenue, growth: revenueGrowth },
      invoices: { current: currentInvoices, previous: previousInvoices, growth: invoicesGrowth },
      clients: { current: currentClients, previous: previousClients, growth: clientsGrowth },
      conversion: { totalInvoices, paidInvoices, draftInvoices, cancelledInvoices, conversionRate: (paidInvoices / totalInvoices) * 100 },
      topClients
    });
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=rapport-statistiques.pdf');
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Erreur exportStatsPDF:', error);
    res.status(500).json({ message: 'Erreur export PDF: ' + error.message });
  }
};