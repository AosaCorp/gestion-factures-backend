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
const rateLimitRoutes = require('./routes/rateLimit');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const dashboardRoutes = require('./routes/dashboard');
const pushRoutes = require('./routes/push');
const stockAlertRoutes = require('./routes/stockAlerts');
const monitoringRoutes = require('./routes/monitoring');
const { performanceMonitor, monitoringHeaders } = require('./middleware/monitoring');

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

// Appliquer le monitoring à toutes les routes
app.use(monitoringHeaders);
app.use(performanceMonitor);

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
app.use('/api/v1', apiRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/backup', backupRoutes);
app.use('/api/rate-limit', rateLimitRoutes);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/push', pushRoutes);
app.use('/api/stock-alerts', stockAlertRoutes);
app.use('/api/monitoring', monitoringRoutes);

app.get('/', (req, res) => {
  res.send('API fonctionne');
});

app.get('/api/test', (req, res) => {
  res.json({ message: 'API test OK' });
});

// Route JSON de la spécification Swagger
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

module.exports = app;