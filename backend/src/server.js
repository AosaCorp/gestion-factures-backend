const app = require('./app');
const sequelize = require('./config/database');
const { User } = require('./models');

const PORT = process.env.PORT || 5001;

// Fonction pour créer un admin par défaut si aucun n'existe
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

// Synchronisation de la base de données, puis création de l'admin
sequelize.sync({ alter: true })
  .then(async () => {
    console.log('✅ Base de données synchronisée');
    await createAdminIfNotExists(); // ← maintenant les tables existent
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