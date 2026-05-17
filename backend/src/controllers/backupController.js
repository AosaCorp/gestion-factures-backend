const backupService = require('../services/backupService');
const fs = require('fs');

/**
 * Crée une sauvegarde manuelle
 */
exports.createBackup = async (req, res) => {
  try {
    const backup = await backupService.createBackup();
    res.json({
      success: true,
      message: 'Sauvegarde créée avec succès',
      backup
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors de la création de la sauvegarde' });
  }
};

/**
 * Liste toutes les sauvegardes
 */
exports.listBackups = async (req, res) => {
  try {
    const backups = await backupService.listBackups();
    res.json({ success: true, backups });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors de la récupération des sauvegardes' });
  }
};

/**
 * Télécharge une sauvegarde
 */
exports.downloadBackup = async (req, res) => {
  try {
    const { filename } = req.params;
    const backupPath = require('path').join(backupService.BACKUP_DIR, filename);
    
    if (!fs.existsSync(backupPath)) {
      return res.status(404).json({ error: 'Sauvegarde non trouvée' });
    }
    
    res.download(backupPath, filename);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors du téléchargement' });
  }
};

/**
 * Restaure une sauvegarde
 */
exports.restoreBackup = async (req, res) => {
  try {
    const { filename } = req.body;
    if (!filename) {
      return res.status(400).json({ error: 'Nom du fichier requis' });
    }
    
    await backupService.restoreBackup(filename);
    res.json({ success: true, message: 'Base de données restaurée. Redémarrage nécessaire.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors de la restauration' });
  }
};

/**
 * Supprime une sauvegarde
 */
exports.deleteBackup = async (req, res) => {
  try {
    const { filename } = req.params;
    const backupPath = require('path').join(backupService.BACKUP_DIR, filename);
    
    if (!fs.existsSync(backupPath)) {
      return res.status(404).json({ error: 'Sauvegarde non trouvée' });
    }
    
    fs.unlinkSync(backupPath);
    res.json({ success: true, message: 'Sauvegarde supprimée' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors de la suppression' });
  }
};

/**
 * Nettoyer les anciennes sauvegardes
 */
exports.cleanBackups = async (req, res) => {
  try {
    const { keep = 10 } = req.query;
    const deleted = await backupService.cleanOldBackups(parseInt(keep));
    res.json({ success: true, message: `${deleted} sauvegarde(s) supprimée(s)` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors du nettoyage' });
  }
};