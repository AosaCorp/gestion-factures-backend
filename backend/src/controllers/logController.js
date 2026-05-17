const { Log, User } = require('../models');
const { Op } = require('sequelize');

/**
 * Récupérer tous les logs avec pagination et filtres
 */
exports.getLogs = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      action, 
      entityType, 
      userId, 
      startDate, 
      endDate,
      search 
    } = req.query;
    
    const offset = (page - 1) * limit;
    const where = {};
    
    if (action) where.action = action;
    if (entityType) where.entityType = entityType;
    if (userId) where.userId = parseInt(userId);
    
    if (startDate && endDate) {
      where.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }
    
    if (search) {
      where[Op.or] = [
        { action: { [Op.like]: `%${search}%` } },
        { entityType: { [Op.like]: `%${search}%` } }
      ];
    }
    
    const { count, rows } = await Log.findAndCountAll({
      where,
      include: [
        { model: User, as: 'user', attributes: ['id', 'name', 'email'] }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });
    
    res.json({
      data: rows,
      total: count,
      page: parseInt(page),
      totalPages: Math.ceil(count / limit)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Récupérer les statistiques des logs
 */
exports.getLogStats = async (req, res) => {
  try {
    const total = await Log.count();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayCount = await Log.count({
      where: { createdAt: { [Op.gte]: today } }
    });
    
    // Actions les plus fréquentes
    const actions = await Log.findAll({
      attributes: ['action', [sequelize.fn('COUNT', sequelize.col('action')), 'count']],
      group: ['action'],
      order: [[sequelize.literal('count'), 'DESC']],
      limit: 10
    });
    
    // Types d'entités
    const entities = await Log.findAll({
      attributes: ['entityType', [sequelize.fn('COUNT', sequelize.col('entityType')), 'count']],
      where: { entityType: { [Op.not]: null } },
      group: ['entityType'],
      order: [[sequelize.literal('count'), 'DESC']],
      limit: 10
    });
    
    res.json({
      total,
      todayCount,
      actions,
      entities
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Supprimer les logs (admin uniquement)
 */
exports.deleteLog = async (req, res) => {
  try {
    const log = await Log.findByPk(req.params.id);
    if (!log) {
      return res.status(404).json({ error: 'Log non trouvé' });
    }
    await log.destroy();
    res.json({ message: 'Log supprimé' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Nettoyer les logs (supprimer les logs de plus de X jours)
 */
exports.cleanLogs = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(days));
    
    const deleted = await Log.destroy({
      where: { createdAt: { [Op.lt]: cutoffDate } }
    });
    
    res.json({ message: `${deleted} logs supprimés` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};