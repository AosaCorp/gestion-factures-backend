const { Client } = require('../models');
const { Op } = require('sequelize');

exports.getClients = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', sort = 'createdAt', order = 'DESC' } = req.query;
    const offset = (page - 1) * limit;
    const where = {};
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { phone: { [Op.like]: `%${search}%` } }
      ];
    }
    const { count, rows } = await Client.findAndCountAll({
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

exports.getAllClients = async (req, res) => {
  try {
    const clients = await Client.findAll({
      order: [['createdAt', 'DESC']]
    });
    res.json(clients);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

exports.getClientById = async (req, res) => {
  try {
    const client = await Client.findByPk(req.params.id);
    if (!client) return res.status(404).json({ message: 'Client non trouvé' });
    res.json(client);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

exports.createClient = async (req, res) => {
  try {
    const client = await Client.create(req.body);
    res.status(201).json(client);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

exports.updateClient = async (req, res) => {
  try {
    const client = await Client.findByPk(req.params.id);
    if (!client) return res.status(404).json({ message: 'Client non trouvé' });
    await client.update(req.body);
    res.json(client);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

exports.deleteClient = async (req, res) => {
  try {
    const client = await Client.findByPk(req.params.id);
    if (!client) return res.status(404).json({ message: 'Client non trouvé' });
    await client.destroy();
    res.json({ message: 'Client supprimé' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};