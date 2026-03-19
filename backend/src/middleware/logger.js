const { Log } = require('../models');

const logger = (action) => {
  return async (req, res, next) => {
    try {
      const originalJson = res.json;
      res.json = function(data) {
        res.json = originalJson;
        Log.create({
          action,
          details: {
            body: req.body,
            params: req.params,
            query: req.query,
            response: data
          },
          ip: req.ip,
          userId: req.user?.id
        }).catch(err => console.error('Erreur lors du log:', err));
        return originalJson.call(this, data);
      };
      next();
    } catch (error) {
      console.error('Erreur dans le middleware logger:', error);
      next();
    }
  };
};

module.exports = logger;