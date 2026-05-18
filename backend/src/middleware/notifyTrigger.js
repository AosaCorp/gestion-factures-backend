const pushService = require('../services/pushService');

/**
 * Déclenche une notification après une action
 */
const notifyTrigger = (event, getData) => {
  return async (req, res, next) => {
    const originalJson = res.json;
    
    res.json = function(data) {
      res.json = originalJson;
      
      setTimeout(async () => {
        try {
          let title = '';
          let body = '';
          let url = '/';
          
          switch (event) {
            case 'invoice_created':
              title = '📄 Nouvelle facture';
              body = `La facture ${data.number || data.id} a été créée`;
              url = `/invoices/${data.id}`;
              break;
            case 'invoice_paid':
              title = '💰 Paiement reçu';
              body = `La facture ${data.number || data.id} a été payée`;
              url = `/invoices/${data.id}`;
              break;
            case 'payment_received':
              title = '💵 Paiement enregistré';
              body = `Un paiement de ${data.amount} FCFA a été reçu`;
              url = `/invoices/${data.invoiceId}`;
              break;
            default:
              return;
          }
          
          await pushService.sendNotificationToUser(req.user.id, title, body, { url });
        } catch (err) {
          console.error('Erreur notification:', err);
        }
      }, 0);
      
      return originalJson.call(this, data);
    };
    
    next();
  };
};

module.exports = notifyTrigger;