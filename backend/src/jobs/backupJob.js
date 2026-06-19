const backupService = require('../services/backupService');
const externalBackupService = require('../services/externalBackupService');

/**
 * Programmation des sauvegardes automatiques
 * Sauvegarde à 2h00 et 14h00 chaque jour
 */
const scheduleBackupJob = () => {
  const now = new Date();
  
  // Calculer le prochain horaire (2h00 ou 14h00)
  const nextBackup = new Date();
  nextBackup.setHours(2, 0, 0, 0);
  
  if (now > nextBackup) {
    nextBackup.setHours(14, 0, 0, 0);
    if (now > nextBackup) {
      nextBackup.setDate(nextBackup.getDate() + 1);
      nextBackup.setHours(2, 0, 0, 0);
    }
  }
  
  const delay = nextBackup - now;
  console.log(`⏰ Prochaine sauvegarde programmée dans ${Math.round(delay / 1000 / 60)} minutes (${nextBackup.toLocaleString()})`);
  
  setTimeout(async () => {
    await runBackupWithExternal();
    
    // Programmer la prochaine sauvegarde (toutes les 12 heures)
    setInterval(async () => {
      await runBackupWithExternal();
    }, 12 * 60 * 60 * 1000);
  }, delay);
};

/**
 * Exécute une sauvegarde avec upload externe
 */
const runBackupWithExternal = async () => {
  console.log(`[${new Date().toISOString()}] 🔄 Début sauvegarde externe...`);
  
  try {
    // 1. Créer la sauvegarde locale
    const backup = await backupService.autoBackup();
    
    if (!backup) {
      console.log('❌ Échec de la sauvegarde locale');
      return null;
    }
    
    // 2. Upload vers Google Drive
    if (process.env.ENABLE_EXTERNAL_BACKUP === 'true') {
      console.log(`📤 Upload vers Google Drive: ${backup.filename}`);
      const result = await externalBackupService.uploadBackupToDrive(backup.path, backup.filename);
      
      if (result) {
        console.log(`✅ Sauvegarde externe terminée: ${result.name}`);
      } else {
        console.log('⚠️ Échec upload externe');
      }
    }
    
    return backup;
  } catch (error) {
    console.error(`❌ Erreur sauvegarde externe:`, error);
    return null;
  }
};

/**
 * Exécute une sauvegarde immédiate
 */
const runBackupNow = async () => {
  return await backupService.autoBackup();
};

module.exports = { scheduleBackupJob, runBackupNow, runBackupWithExternal };