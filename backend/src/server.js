const app = require('./app');
const sequelize = require('./config/database');
const { User } = require('./models');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { scheduleBackupJob, runBackupNow } = require('./jobs/backupJob');
const { initSocket } = require('./socket');
const { startMetricsBroadcasting } = require('./services/metricsService');
const { updateMetricsWebSocket } = require('./middleware/monitoring');

const PORT = process.env.PORT || 5001;

// Créer le dossier uploads s'il n'existe pas
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log('✅ Dossier uploads créé');
}

async function createAdminIfNotExists() {
  try {
    const adminExists = await User.findOne({ where: { role: 'admin' } });
    if (!adminExists) {
      await User.create({
        name: 'Admin',
        email: 'admin@example.com',
        password: 'admin123',
        role: 'admin'
      });
      console.log('✅ Admin par défaut créé');
    } else {
      console.log('ℹ️ Admin déjà existant');
    }
  } catch (error) {
    console.error('❌ Erreur création admin:', error);
  }
}

// ========== JOB DE RAPPELS AUTOMATIQUES ==========
const scheduleReminderJob = () => {
  const { runReminderJob } = require('./jobs/reminderJob');
  
  const now = new Date();
  const eightAm = new Date();
  eightAm.setHours(8, 0, 0, 0);
  
  let delay = eightAm - now;
  if (delay < 0) {
    delay += 24 * 60 * 60 * 1000;
  }
  
  console.log(`⏰ Job rappels programmé dans ${Math.round(delay / 1000 / 60)} minutes`);
  
  setTimeout(() => {
    runReminderJob();
    setInterval(runReminderJob, 24 * 60 * 60 * 1000);
  }, delay);
};

// ========== CRÉATION DU SERVEUR HTTP ==========
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Serveur démarré sur le port ${PORT} (IPv4)`);
});

// ========== INITIALISATION WEBSOCKET (APRÈS LE SERVEUR) ==========
const io = initSocket(server);
console.log('🔌 WebSocket Server initialisé');

server.on('error', (err) => {
  console.error('❌ Erreur serveur:', err);
  if (err.code === 'EADDRINUSE') {
    console.error(`Le port ${PORT} est déjà utilisé. Arrêtez l'autre processus ou changez de port.`);
    process.exit(1);
  }
});

// Démarrer le monitoring WebSocket
updateMetricsWebSocket(io);

// ========== SYNCHRONISATION BASE DE DONNÉES ==========
sequelize.sync()
  .then(async () => {
    console.log('✅ Base de données synchronisée');
    await createAdminIfNotExists();
    
    if (process.env.NODE_ENV === 'production') {
      scheduleReminderJob();
    }
  })
  .catch(err => console.error('❌ Erreur synchro DB:', err));

// ========== JOBS ET SERVICES ==========
// Démarrer le job de sauvegarde (seulement en production)
if (process.env.NODE_ENV === 'production') {
  scheduleBackupJob();
}

// Démarrer le broadcasting des métriques (seulement en production)
if (process.env.NODE_ENV === 'production') {
  startMetricsBroadcasting(30000); // toutes les 30 secondes
}

// Option: créer une sauvegarde initiale au démarrage
setTimeout(async () => {
  await runBackupNow();
}, 60000); // 1 minute après le démarrage

// ========== KEEP-ALIVE POUR RENDER ==========
const SERVER_URL = process.env.RENDER_URL || 'https://gestion-factures-backend-mvdn.onrender.com';

const keepAlive = () => {
  const protocol = SERVER_URL.startsWith('https') ? https : http;
  
  const request = protocol.get(SERVER_URL, (res) => {
    console.log(`💓 Keep-alive ping: ${res.statusCode} - ${new Date().toLocaleTimeString()}`);
    res.resume();
  });
  
  request.on('error', (err) => {
    console.log(`💓 Keep-alive erreur: ${err.message}`);
  });
  
  request.end();
};

if (process.env.NODE_ENV === 'production' && SERVER_URL) {
  console.log('🔄 Keep-alive activé - Ping toutes les 14 minutes');
  setTimeout(keepAlive, 60000);
  setInterval(keepAlive, 14 * 60 * 1000);
} else {
  console.log('ℹ️ Keep-alive désactivé (environnement développement)');
}

// ========== GESTION ARRÊT PROPRE ==========
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM reçu, arrêt du serveur...');
  server.close(() => {
    console.log('✅ Serveur arrêté');
    process.exit(0);
  });
});