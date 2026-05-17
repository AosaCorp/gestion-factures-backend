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
const reminderRoutes = require('./routes/reminders');
const apiRoutes = require('./routes/api');
const logRoutes = require('./routes/logs');
const webhookRoutes = require('./routes/webhooks');
const backupRoutes = require('./routes/backup');

dotenv.config();

const app = express();

app.use(cors({
  origin: '*',
  credentials: true
}));
app.use(express.json());

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

app.use('/uploads', express.static('uploads'));
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
app.use('/api/reminders', reminderRoutes);
app.use('/api/v1', apiRoutes);  // Route API publique
app.use('/api/logs', logRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/backup', backupRoutes);

app.get('/', (req, res) => {
  res.send('API fonctionne');
});

// Route de test pour l'API publique
app.get('/api/test', (req, res) => {
  res.json({ message: 'API test OK' });
});

module.exports = app;