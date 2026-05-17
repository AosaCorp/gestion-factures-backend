const { triggerWebhooks } = require('../services/webhookService');

/**
 * Middleware pour déclencher des webhooks après une action
 * @param {string} event - Nom de l'événement
 * @param {Function} getData - Fonction pour récupérer les données à envoyer
 */
const webhookTrigger = (event, getData) => {
  return async (req, res, next) => {
    // Sauvegarder la méthode originale
    const originalJson = res.json;
    
    // Surcharger res.json pour déclencher le webhook après la réponse
    res.json = function(data) {
      // Restaurer la méthode originale
      res.json = originalJson;
      
      // Déclencher le webhook après la réponse (ne bloque pas le client)
      setTimeout(async () => {
        try {
          const responseData = getData ? getData(req, data) : data;
          await triggerWebhooks(event, responseData);
        } catch (err) {
          console.error(`Erreur déclenchement webhook ${event}:`, err);
        }
      }, 0);
      
      return originalJson.call(this, data);
    };
    
    next();
  };
};

module.exports = webhookTrigger;