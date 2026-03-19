const sequelize = require('./config/database');
const { User } = require('./models');

async function seed() {
  await sequelize.sync({ force: true });
  await User.create({
    name: 'Admin',
    email: 'admin@example.com',
    password: 'admin123',
    role: 'admin'
  });
  console.log('✅ Admin créé');
  process.exit();
}

seed();