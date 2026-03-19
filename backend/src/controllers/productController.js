const { Product } = require('../models');
const { Op } = require('sequelize');

// Récupération paginée avec recherche et filtre par type
exports.getProducts = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', sort = 'createdAt', order = 'DESC' } = req.query;
    const offset = (page - 1) * limit;
    const where = {};
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } }
      ];
    }
    const { count, rows } = await Product.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [[sort, order]]
    });
    res.json({
      data: rows,
      total: count,
      page: parseInt(page),
      totalPages: Math.ceil(count / limit)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Récupérer tous les produits (pour exports)
exports.getAllProducts = async (req, res) => {
  try {
    const products = await Product.findAll({
      order: [['createdAt', 'DESC']]
    });
    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ message: 'Produit non trouvé' });
    res.json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

exports.createProduct = async (req, res) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ message: 'Produit non trouvé' });
    await product.update(req.body);
    res.json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ message: 'Produit non trouvé' });
    await product.destroy();
    res.json({ message: 'Produit supprimé' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Statistiques des produits
exports.getProductStats = async (req, res) => {
  try {
    const totalProducts = await Product.count();
    const productsCount = await Product.count({ where: { type: 'product' } });
    const servicesCount = await Product.count({ where: { type: 'service' } });
    const totalValue = await Product.sum('price') || 0; // somme des prix HT
    // Pour la valeur totale TTC (si vous voulez), il faudrait multiplier par (1+taxRate/100)
    const totalValueTTC = await Product.findAll().then(products => 
      products.reduce((acc, p) => acc + p.price * (1 + p.taxRate/100), 0)
    );
    res.json({
      totalProducts,
      productsCount,
      servicesCount,
      totalValue,
      totalValueTTC
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};