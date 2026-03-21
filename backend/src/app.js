const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const sequelize = require('./config/database');
const authRoutes = require('./routes/auth');
const clientRoutes = require('./routes/clients');
const productRoutes = require('./routes/products');
const invoiceRoutes = require('./routes/invoices');
const paymentRoutes = require('./routes/payments');
const statsRoutes = require('./routes/stats');
const userRoutes = require('./routes/users');
const reportRoutes = require('./routes/reports');
const companyRoutes = require('./routes/company');
const systemRoutes = require('./routes/system');
const seedRoutes = require('./routes/seed');

dotenv.config();

const app = express();

// Configuration CORS plus permissive pour le déploiement
app.use(cors({
  origin: '*', // En production, vous pouvez restreindre à votre domaine
  credentials: true
}));

app.use(express.json());

// Middleware de log
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Servir les fichiers statiques (uploads)
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/products', productRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/users', userRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/company', companyRoutes);
app.use('/api/system', systemRoutes);
app.use('/api/seed', seedRoutes);

app.get('/', (req, res) => {
  res.send('API fonctionne');
});

// Synchronisation de la base de données
sequelize.sync({ alter: true })
  .then(() => console.log('✅ Base de données synchronisée'))
  .catch(err => console.error('❌ Erreur synchro DB:', err));

module.exports = app;