const app = require('./app');
const sequelize = require('./config/database');
const { User } = require('./models');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

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

// ========== KEEP-ALIVE POUR RENDER (ÉVITE LA VEILLE) ==========
// Envoie une requête au serveur toutes les 14 minutes pour le maintenir actif
const SERVER_URL = process.env.RENDER_URL || 'https://gestion-factures-backend-mvdn.onrender.com';

const keepAlive = () => {
  // Utiliser http ou https selon l'URL
  const protocol = SERVER_URL.startsWith('https') ? https : http;
  
  const request = protocol.get(SERVER_URL, (res) => {
    console.log(`💓 Keep-alive ping: ${res.statusCode} - ${new Date().toLocaleTimeString()}`);
    res.resume(); // Consommer la réponse pour éviter de garder la connexion ouverte
  });
  
  request.on('error', (err) => {
    console.log(`💓 Keep-alive erreur: ${err.message}`);
  });
  
  request.end();
};

// Démarrer le keep-alive uniquement en production (sur Render)
if (process.env.NODE_ENV === 'production' && SERVER_URL) {
  console.log('🔄 Keep-alive activé - Ping toutes les 14 minutes');
  
  // Premier ping après 1 minute
  setTimeout(keepAlive, 60000);
  
  // Puis toutes les 14 minutes (840000 ms)
  setInterval(keepAlive, 14 * 60 * 1000);
} else {
  console.log('ℹ️ Keep-alive désactivé (environnement développement)');
}
// ============================================================

sequelize.sync()
  .then(async () => {
    console.log('✅ Base de données synchronisée');
    await createAdminIfNotExists();
  })
  .catch(err => console.error('❌ Erreur synchro DB:', err));

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Serveur démarré sur le port ${PORT} (IPv4)`);
  if (process.env.NODE_ENV === 'production') {
    console.log(`💓 Keep-alive pingera ${SERVER_URL} toutes les 14 minutes`);
  }
});

server.on('error', (err) => {
  console.error('❌ Erreur serveur:', err);
  if (err.code === 'EADDRINUSE') {
    console.error(`Le port ${PORT} est déjà utilisé. Arrêtez l'autre processus ou changez de port.`);
    process.exit(1);
  }
});

// Gestion de l'arrêt propre
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM reçu, arrêt du serveur...');
  server.close(() => {
    console.log('✅ Serveur arrêté');
    process.exit(0);
  });
});