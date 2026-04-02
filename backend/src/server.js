const app = require('./app');
const sequelize = require('./config/database');
const { User } = require('./models');
const fs = require('fs');
const path = require('path');

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

sequelize.sync({ alter: true })
  .then(async () => {
    console.log('✅ Base de données synchronisée');
    await createAdminIfNotExists();
  })
  .catch(err => console.error('❌ Erreur synchro DB:', err));

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Serveur démarré sur le port ${PORT} (IPv4)`);
});

server.on('error', (err) => {
  console.error('❌ Erreur serveur:', err);
  if (err.code === 'EADDRINUSE') {
    console.error(`Le port ${PORT} est déjà utilisé. Arrêtez l'autre processus ou changez de port.`);
    process.exit(1);
  }
});