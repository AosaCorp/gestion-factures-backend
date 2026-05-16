const { Reminder, Invoice } = require('../models');
const reminderService = require('../services/reminderService');

/**
 * Récupère tous les rappels
 */
exports.getAllReminders = async (req, res) => {
  try {
    const reminders = await Reminder.findAll({
      include: [{ model: Invoice, as: 'invoice', attributes: ['id', 'number', 'total', 'status'] }],
      order: [['createdAt', 'DESC']]
    });
    res.json(reminders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

/**
 * Récupère les rappels d'une facture spécifique
 */
exports.getRemindersByInvoice = async (req, res) => {
  try {
    const reminders = await Reminder.findAll({
      where: { invoiceId: req.params.invoiceId },
      include: [{ model: Invoice, as: 'invoice', attributes: ['id', 'number', 'total', 'status'] }],
      order: [['createdAt', 'DESC']]
    });
    res.json(reminders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

/**
 * Lance manuellement la vérification des rappels
 */
exports.runReminderCheck = async (req, res) => {
  try {
    const created = await reminderService.checkAndCreateReminders();
    res.json({ 
      message: `Vérification terminée`, 
      created: created.length,
      reminders: created 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

/**
 * Lance manuellement l'envoi des rappels en attente
 */
exports.runReminderSend = async (req, res) => {
  try {
    const results = await reminderService.sendPendingReminders();
    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;
    res.json({ 
      message: `Envoi terminé`, 
      success: successCount,
      failed: failCount,
      results 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

/**
 * Obtient les statistiques des rappels
 */
exports.getReminderStats = async (req, res) => {
  try {
    const stats = await reminderService.getReminderStats();
    res.json(stats);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

/**
 * Supprime un rappel
 */
exports.deleteReminder = async (req, res) => {
  try {
    const reminder = await Reminder.findByPk(req.params.id);
    if (!reminder) {
      return res.status(404).json({ message: 'Rappel non trouvé' });
    }
    await reminder.destroy();
    res.json({ message: 'Rappel supprimé' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};