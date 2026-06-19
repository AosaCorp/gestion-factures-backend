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

// Configuration CORS - Autoriser toutes les origines en développement
// et les domaines connus en production
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5001',
  'https://gestion-factures-frontend.vercel.app',
  'https://gestion-factures-frontend-three.vercel.app',
  // Ajouter dynamiquement l'URL Vercel (variable d'environnement)
  process.env.FRONTEND_URL,
  process.env.VERCEL_URL
].filter(Boolean);

// Ajouter toutes les URLs Vercel (wildcard pour les sous-domaines)
const vercelPattern = /^https:\/\/gestion-factures-frontend-[a-z0-9]+-aosacorp-c9df9049\.vercel\.app$/;

app.use(cors({
  origin: function (origin, callback) {
    // Permettre les requêtes sans origine (comme les apps mobiles)
    if (!origin) return callback(null, true);
    
    // Vérifier si l'origine est autorisée
    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    }
    
    // Vérifier si l'origine correspond au pattern Vercel
    if (vercelPattern.test(origin)) {
      return callback(null, true);
    }
    
    // En développement, tout autoriser
    if (process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    
    console.log(`❌ CORS bloqué: ${origin}`);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-Requested-With']
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