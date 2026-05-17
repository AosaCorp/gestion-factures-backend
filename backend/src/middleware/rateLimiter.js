const rateLimit = require('express-rate-limit');

// Configuration par défaut
const defaultConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requêtes par fenêtre
  message: {
    error: 'Trop de requêtes, veuillez réessayer plus tard.',
    retryAfter: 'Réessayez dans 15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false
};

// Rate limiter pour l'API générale
const apiLimiter = rateLimit({
  ...defaultConfig,
  keyGenerator: (req) => {
    // Utiliser l'IP ou l'ID utilisateur si connecté
    return req.user?.id || req.ip;
  },
  skip: (req) => {
    // Exclure certaines routes de la limitation
    const excludePaths = ['/api/health', '/api/metrics'];
    return excludePaths.includes(req.path);
  }
});

// Rate limiter strict (pour les routes sensibles)
const strictLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 20, // 20 requêtes par heure
  message: {
    error: 'Trop de tentatives, veuillez réessayer dans une heure.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Rate limiter pour les routes d'authentification (login)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 tentatives de connexion
  skipSuccessfulRequests: true, // Ne pas compter les connexions réussies
  message: {
    error: 'Trop de tentatives de connexion. Compte temporairement bloqué.'
  }
});

// Rate limiter pour les routes API publiques
const publicApiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requêtes par minute
  keyGenerator: (req) => req.ip,
  message: {
    error: 'Trop de requêtes API. Limite: 30 par minute.'
  }
});

// Rate limiter pour les webhooks (limite stricte)
const webhookLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 100, // 100 webhooks par heure
  message: {
    error: 'Trop de webhooks créés. Limite: 100 par heure.'
  }
});

module.exports = {
  apiLimiter,
  strictLimiter,
  authLimiter,
  publicApiLimiter,
  webhookLimiter
};