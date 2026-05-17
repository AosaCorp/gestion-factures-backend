const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const logger = require('../middleware/logger');
const {
  createBackup,
  listBackups,
  downloadBackup,
  restoreBackup,
  deleteBackup,
  cleanBackups
} = require('../controllers/backupController');

const router = express.Router();

// Toutes les routes nécessitent une authentification et le rôle admin
router.use(protect);
router.use(authorize('admin'));

router.post('/', logger('CREATE_BACKUP'), createBackup);
router.get('/', listBackups);
router.get('/download/:filename', downloadBackup);
router.post('/restore', logger('RESTORE_BACKUP'), restoreBackup);
router.delete('/:filename', logger('DELETE_BACKUP'), deleteBackup);
router.delete('/clean/all', logger('CLEAN_BACKUPS'), cleanBackups);

module.exports = router;