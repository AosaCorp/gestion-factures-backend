const backupService = require('../services/backupService');

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
    await backupService.autoBackup();
    
    // Programmer la prochaine sauvegarde (toutes les 12 heures)
    setInterval(async () => {
      await backupService.autoBackup();
    }, 12 * 60 * 60 * 1000);
  }, delay);
};

/**
 * Exécute une sauvegarde immédiate
 */
const runBackupNow = async () => {
  return await backupService.autoBackup();
};

module.exports = { scheduleBackupJob, runBackupNow };