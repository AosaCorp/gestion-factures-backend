/**
 * @swagger
 * tags:
 *   name: Clients
 *   description: Gestion des clients
 */

/**
 * @swagger
 * /api/clients:
 *   get:
 *     summary: Récupère la liste des clients
 *     tags: [Clients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *         description: Numéro de la page
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *         description: Nombre d'éléments par page
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Recherche par nom, email ou téléphone
 *     responses:
 *       200:
 *         description: Liste des clients
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data: { type: array, items: { $ref: '#/components/schemas/Client' } }
 *                 total: { type: integer }
 *                 page: { type: integer }
 *                 totalPages: { type: integer }
 *       401:
 *         description: Non authentifié
 *       500:
 *         description: Erreur serveur
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */

/**
 * @swagger
 * /api/clients:
 *   post:
 *     summary: Crée un nouveau client
 *     tags: [Clients]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string, example: "Jean Dupont" }
 *               email: { type: string, example: "jean@example.com" }
 *               phone: { type: string, example: "+237 6XX XXX XXX" }
 *               address: { type: string, example: "Yaoundé, Cameroun" }
 *     responses:
 *       201:
 *         description: Client créé
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Client' }
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non authentifié
 *       500:
 *         description: Erreur serveur
 */

/**
 * @swagger
 * /api/clients/{id}:
 *   get:
 *     summary: Récupère un client par son ID
 *     tags: [Clients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *         description: ID du client
 *     responses:
 *       200:
 *         description: Client trouvé
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Client' }
 *       404:
 *         description: Client non trouvé
 *       401:
 *         description: Non authentifié
 *       500:
 *         description: Erreur serveur
 */

/**
 * @swagger
 * /api/clients/{id}:
 *   put:
 *     summary: Modifie un client
 *     tags: [Clients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               email: { type: string }
 *               phone: { type: string }
 *               address: { type: string }
 *     responses:
 *       200:
 *         description: Client modifié
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Client' }
 *       404:
 *         description: Client non trouvé
 *       401:
 *         description: Non authentifié
 *       500:
 *         description: Erreur serveur
 */

/**
 * @swagger
 * /api/clients/{id}:
 *   delete:
 *     summary: Supprime un client
 *     tags: [Clients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Client supprimé
 *       404:
 *         description: Client non trouvé
 *       401:
 *         description: Non authentifié
 *       500:
 *         description: Erreur serveur
 */


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