const app = require('./app');
const { User } = require('./models');
const bcrypt = require('bcrypt');

const PORT = process.env.PORT || 5001;

const createAdminIfNotExists = async () => {
  try {
    const admin = await User.findOne({ where: { role: 'admin' } });
    if (!admin) {
      await User.create({
        name: 'Admin',
        email: 'admin@example.com',
        password: 'admin123',
        role: 'admin'
      });
      console.log('✅ Admin créé par défaut');
    }
  } catch (error) {
    console.error('❌ Erreur création admin:', error);
  }
};

app.listen(PORT, '0.0.0.0', async () => {
  console.log(`✅ Serveur démarré sur le port ${PORT} (IPv4)`);
  await createAdminIfNotExists();
});