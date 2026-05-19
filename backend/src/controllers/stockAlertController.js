const stockAlertService = require('../services/stockAlertService');
const { Product } = require('../models');
const { Op } = require('sequelize');

/**
 * Récupère les produits en stock bas
 */
exports.getLowStockProducts = async (req, res) => {
  try {
    const lowStock = await stockAlertService.checkLowStock();
    res.json({ success: true, products: lowStock, count: lowStock.length });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Récupère les statistiques des alertes
 */
exports.getStockStats = async (req, res) => {
  try {
    const stats = await stockAlertService.getStockAlertStats();
    res.json(stats);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Met à jour le seuil d'alerte d'un produit
 */
exports.updateMinStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { minStock } = req.body;
    
    const product = await stockAlertService.updateMinStock(id, minStock);
    res.json({ success: true, product });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Récupère tous les produits avec leur statut de stock
 */
exports.getAllProductsStock = async (req, res) => {
  try {
    const products = await Product.findAll({
      where: { type: 'product' },
      attributes: ['id', 'name', 'stock', 'minStock', 'category', 'price'],
      order: [['stock', 'ASC']]
    });
    
    const productsWithStatus = products.map(p => ({
      ...p.toJSON(),
      status: p.stock === 0 ? 'rupture' :
              p.stock < p.minStock ? 'alerte' :
              p.stock < p.minStock * 2 ? 'attention' : 'ok'
    }));
    
    res.json({ success: true, products: productsWithStatus });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Met à jour le stock d'un produit (après vente)
 */
exports.updateStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { stock } = req.body;
    
    const product = await Product.findByPk(id);
    if (!product) {
      return res.status(404).json({ error: 'Produit non trouvé' });
    }
    
    await product.update({ stock });
    
    // Vérifier si une alerte doit être envoyée
    if (stock < product.minStock) {
      // Déclencher une notification
      console.log(`⚠️ Stock bas pour ${product.name}: ${stock} restant(s)`);
    }
    
    res.json({ success: true, product });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};