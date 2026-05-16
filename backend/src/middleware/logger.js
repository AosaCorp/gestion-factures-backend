const logger = (action) => {
  return async (req, res, next) => {
    // Log en console uniquement pour le suivi
    const userId = req.user?.id || 'non authentifié';
    console.log(`[${new Date().toISOString()}] ${action} - Utilisateur: ${userId} - ${req.method} ${req.url}`);
    next();
  };
};

module.exports = logger;