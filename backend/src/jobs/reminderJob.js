const reminderService = require('../services/reminderService');
const sequelize = require('../config/database');

/**
 * Job de vérification et envoi des rappels
 * À exécuter quotidiennement
 */
const runReminderJob = async () => {
  console.log(`[${new Date().toISOString()}] 🔔 Démarrage du job de rappels...`);
  
  try {
    // 1. Vérifier et créer les nouveaux rappels
    const created = await reminderService.checkAndCreateReminders();
    console.log(`📝 ${created.length} nouveau(x) rappel(s) créé(s)`);
    
    // 2. Envoyer les rappels en attente
    const results = await reminderService.sendPendingReminders();
    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;
    console.log(`📧 ${successCount} rappel(s) envoyé(s), ${failCount} échec(s)`);
    
    console.log(`[${new Date().toISOString()}] ✅ Job de rappels terminé`);
  } catch (error) {
    console.error(`❌ Erreur job rappels:`, error);
  }
};

// Exporter pour utilisation dans server.js
module.exports = { runReminderJob };