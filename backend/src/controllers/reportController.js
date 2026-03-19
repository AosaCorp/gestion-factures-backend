const { Invoice, Client, Product, Payment } = require('../models');
const { Op } = require('sequelize');

// Rapport des ventes par période
exports.getSalesReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const where = {};
    if (startDate && endDate) {
      where.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    } else {
      // 30 derniers jours par défaut
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      where.createdAt = { [Op.gte]: thirtyDaysAgo };
    }
    const invoices = await Invoice.findAll({
      where,
      include: [
        { model: Client, as: 'client', attributes: ['id', 'name'] },
        { model: Payment, attributes: ['amount', 'method', 'createdAt'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    const totalRevenue = invoices.reduce((sum, inv) => sum + parseFloat(inv.total), 0);
    const totalPaid = invoices.reduce((sum, inv) => sum + (inv.Payments ? inv.Payments.reduce((s, p) => s + parseFloat(p.amount), 0) : 0), 0);
    const paidCount = invoices.filter(inv => inv.status === 'paid').length;
    const draftCount = invoices.filter(inv => inv.status === 'draft').length;
    const cancelledCount = invoices.filter(inv => inv.status === 'cancelled').length;

    // Regroupement par date
    const salesByDate = {};
    invoices.forEach(inv => {
      const date = inv.createdAt.toISOString().split('T')[0];
      if (!salesByDate[date]) {
        salesByDate[date] = { date, revenue: 0, paid: 0, count: 0 };
      }
      salesByDate[date].revenue += parseFloat(inv.total);
      salesByDate[date].paid += inv.Payments ? inv.Payments.reduce((s, p) => s + parseFloat(p.amount), 0) : 0;
      salesByDate[date].count += 1;
    });

    const sortedSales = Object.values(salesByDate).sort((a, b) => a.date.localeCompare(b.date));

    res.json({
      invoices,
      totalRevenue,
      totalPaid,
      paidCount,
      draftCount,
      cancelledCount,
      count: invoices.length,
      salesByDate: sortedSales
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Rapport des produits les plus vendus (simplifié)
exports.getTopProducts = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const invoices = await Invoice.findAll({
      where: { status: 'paid' }
    });
    const productMap = {};
    invoices.forEach(inv => {
      (inv.items || []).forEach(item => {
        const key = item.description || `Produit ${item.productId}`;
        if (!productMap[key]) {
          productMap[key] = { name: key, quantity: 0, revenue: 0, count: 0 };
        }
        productMap[key].quantity += item.quantity;
        productMap[key].revenue += item.total;
        productMap[key].count += 1;
      });
    });
    const products = Object.values(productMap).sort((a, b) => b.revenue - a.revenue).slice(0, limit);
    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Rapport des clients (top clients)
exports.getClientsReport = async (req, res) => {
  try {
    const { limit = 10, startDate, endDate } = req.query;
    const whereInvoice = {};
    if (startDate && endDate) {
      whereInvoice.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }
    const invoices = await Invoice.findAll({
      where: whereInvoice,
      include: [
        { model: Client, as: 'client', attributes: ['id', 'name'] },
        { model: Payment }
      ]
    });
    const clientMap = new Map();
    invoices.forEach(inv => {
      if (!inv.client) return;
      const clientId = inv.client.id;
      if (!clientMap.has(clientId)) {
        clientMap.set(clientId, {
          id: clientId,
          name: inv.client.name,
          code: `CLI${clientId}`,
          invoicesCount: 0,
          totalSpent: 0,
          totalPaid: 0,
          lastInvoiceDate: inv.createdAt
        });
      }
      const c = clientMap.get(clientId);
      c.invoicesCount++;
      c.totalSpent += parseFloat(inv.total);
      const paid = inv.Payments ? inv.Payments.reduce((sum, p) => sum + parseFloat(p.amount), 0) : 0;
      c.totalPaid += paid;
      if (inv.createdAt > c.lastInvoiceDate) c.lastInvoiceDate = inv.createdAt;
    });
    const clientStats = Array.from(clientMap.values())
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, parseInt(limit));
    res.json(clientStats);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Rapport des paiements par méthode
exports.getPaymentsReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const where = {};
    if (startDate && endDate) {
      where.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }
    const payments = await Payment.findAll({
      where,
      include: [{ model: Invoice, include: [{ model: Client, as: 'client' }] }],
      order: [['createdAt', 'DESC']]
    });

    const byMethod = {
      cash: { total: 0, count: 0 },
      orange_money: { total: 0, count: 0 },
      mtn_money: { total: 0, count: 0 }
    };
    payments.forEach(p => {
      if (byMethod[p.method]) {
        byMethod[p.method].total += parseFloat(p.amount);
        byMethod[p.method].count += 1;
      }
    });
    res.json({
      payments,
      byMethod,
      total: payments.reduce((sum, p) => sum + parseFloat(p.amount), 0),
      count: payments.length
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};