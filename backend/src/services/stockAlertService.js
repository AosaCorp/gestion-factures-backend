const { Product, User, sequelize } = require('../models');
const { Op } = require('sequelize');

/**
 * Vérifie tous les produits et retourne ceux dont le stock est bas
 */
const checkLowStock = async () => {
  try {
    const lowStockProducts = await Product.findAll({
      where: {
        stock: { [Op.lt]: sequelize.col('minStock') },
        type: 'product'
      },
      order: [['stock', 'ASC']]
    });
    
    return lowStockProducts.map(p => ({
      id: p.id,
      name: p.name,
      stock: p.stock,
      minStock: p.minStock,
      category: p.category,
      price: p.price
    }));
  } catch (error) {
    console.error('Erreur vérification stock:', error);
    return [];
  }
};

/**
 * Récupère les statistiques des alertes de stock
 */
const getStockAlertStats = async () => {
  try {
    const totalProducts = await Product.count({ where: { type: 'product' } });
    const lowStockCount = await Product.count({
      where: {
        stock: { [Op.lt]: sequelize.col('minStock') },
        type: 'product'
      }
    });
    const outOfStockCount = await Product.count({
      where: {
        stock: 0,
        type: 'product'
      }
    });
    const criticalCount = await Product.count({
      where: {
        stock: { [Op.lt]: 3 },
        type: 'product'
      }
    });
    
    return {
      totalProducts,
      lowStockCount,
      outOfStockCount,
      criticalCount,
      healthPercent: totalProducts > 0 ? ((totalProducts - lowStockCount) / totalProducts) * 100 : 100
    };
  } catch (error) {
    console.error('Erreur stats stock:', error);
    return { totalProducts: 0, lowStockCount: 0, outOfStockCount: 0, criticalCount: 0, healthPercent: 100 };
  }
};

/**
 * Met à jour le seuil d'alerte d'un produit
 */
const updateMinStock = async (productId, minStock) => {
  try {
    const product = await Product.findByPk(productId);
    if (!product) {
      throw new Error('Produit non trouvé');
    }
    
    await product.update({ minStock });
    return product;
  } catch (error) {
    console.error('Erreur mise à jour seuil:', error);
    throw error;
  }
};

/**
 * Réinitialise le flag d'alerte (après envoi de notification)
 */
const resetAlertFlag = async (productId) => {
  try {
    const product = await Product.findByPk(productId);
    if (product) {
      await product.update({ alertSent: false });
    }
  } catch (error) {
    console.error('Erreur réinitialisation alerte:', error);
  }
};

module.exports = {
  checkLowStock,
  getStockAlertStats,
  updateMinStock,
  resetAlertFlag
};