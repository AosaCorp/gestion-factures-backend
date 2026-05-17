const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const sequelize = require('../config/database');

const execAsync = promisify(exec);
const BACKUP_DIR = path.join(process.cwd(), 'backups');

// Créer le dossier backups s'il n'existe pas
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

/**
 * Formate la date pour les noms de fichiers
 */
const getBackupFileName = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `backup_${year}-${month}-${day}_${hours}-${minutes}.sqlite`;
};

/**
 * Crée une sauvegarde de la base de données SQLite
 */
const createBackup = async () => {
  try {
    const dbPath = sequelize.options.storage;
    const backupName = getBackupFileName();
    const backupPath = path.join(BACKUP_DIR, backupName);
    
    // Copier le fichier de base de données
    fs.copyFileSync(dbPath, backupPath);
    
    // Compresser le backup
    await execAsync(`gzip -c "${backupPath}" > "${backupPath}.gz"`);
    fs.unlinkSync(backupPath);
    
    const stats = fs.statSync(`${backupPath}.gz`);
    
    console.log(`✅ Sauvegarde créée: ${backupName}.gz (${(stats.size / 1024).toFixed(2)} KB)`);
    
    return {
      success: true,
      filename: `${backupName}.gz`,
      size: stats.size,
      path: `${backupPath}.gz`,
      createdAt: new Date()
    };
  } catch (error) {
    console.error('❌ Erreur sauvegarde:', error);
    throw error;
  }
};

/**
 * Liste toutes les sauvegardes disponibles
 */
const listBackups = async () => {
  try {
    const files = fs.readdirSync(BACKUP_DIR);
    const backups = files
      .filter(f => f.endsWith('.gz'))
      .map(filename => {
        const filePath = path.join(BACKUP_DIR, filename);
        const stats = fs.statSync(filePath);
        return {
          filename,
          size: stats.size,
          createdAt: stats.birthtime,
          path: filePath
        };
      })
      .sort((a, b) => b.createdAt - a.createdAt);
    
    return backups;
  } catch (error) {
    console.error('Erreur liste backups:', error);
    return [];
  }
};

/**
 * Restaure une sauvegarde
 */
const restoreBackup = async (filename) => {
  try {
    const backupPath = path.join(BACKUP_DIR, filename);
    if (!fs.existsSync(backupPath)) {
      throw new Error('Sauvegarde non trouvée');
    }
    
    const dbPath = sequelize.options.storage;
    
    // Décompresser le backup
    await execAsync(`gunzip -c "${backupPath}" > "${dbPath}.temp"`);
    
    // Remplacer la base de données
    fs.copyFileSync(`${dbPath}.temp`, dbPath);
    fs.unlinkSync(`${dbPath}.temp`);
    
    console.log(`✅ Base de données restaurée depuis ${filename}`);
    
    return { success: true, message: 'Base de données restaurée avec succès' };
  } catch (error) {
    console.error('❌ Erreur restauration:', error);
    throw error;
  }
};

/**
 * Supprime les anciennes sauvegardes (garde les 10 plus récentes)
 */
const cleanOldBackups = async (keepCount = 10) => {
  try {
    const backups = await listBackups();
    if (backups.length <= keepCount) return 0;
    
    const toDelete = backups.slice(keepCount);
    for (const backup of toDelete) {
      fs.unlinkSync(backup.path);
      console.log(`🗑️ Ancienne sauvegarde supprimée: ${backup.filename}`);
    }
    
    return toDelete.length;
  } catch (error) {
    console.error('Erreur nettoyage backups:', error);
    return 0;
  }
};

/**
 * Sauvegarde automatique (création + nettoyage)
 */
const autoBackup = async () => {
  console.log(`[${new Date().toISOString()}] 🔄 Début sauvegarde automatique...`);
  try {
    const backup = await createBackup();
    const deleted = await cleanOldBackups(10);
    console.log(`[${new Date().toISOString()}] ✅ Sauvegarde terminée: ${backup.filename} (${deleted} anciennes supprimées)`);
    return backup;
  } catch (error) {
    console.error(`[${new Date().toISOString()}] ❌ Sauvegarde échouée:`, error);
    return null;
  }
};

module.exports = {
  createBackup,
  listBackups,
  restoreBackup,
  cleanOldBackups,
  autoBackup,
  BACKUP_DIR
};