const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { User } = require('./models');

let io;

/**
 * Initialise le serveur Socket.IO
 */
const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
      credentials: true
    },
    pingTimeout: 60000,
    pingInterval: 25000
  });

  // Middleware d'authentification Socket.IO
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Non authentifié'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findByPk(decoded.id);
      
      if (!user) {
        return next(new Error('Utilisateur non trouvé'));
      }

      socket.user = user;
      next();
    } catch (error) {
      console.error('Erreur auth socket:', error);
      next(new Error('Token invalide'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Client connecté: ${socket.id} - Utilisateur: ${socket.user?.name}`);

    // Rejoindre une room spécifique à l'utilisateur
    socket.join(`user_${socket.user.id}`);

    socket.on('disconnect', () => {
      console.log(`🔌 Client déconnecté: ${socket.id}`);
    });

    socket.on('error', (error) => {
      console.error('Erreur socket:', error);
    });
  });

  return io;
};

/**
 * Émet un événement à un utilisateur spécifique
 */
const emitToUser = (userId, event, data) => {
  if (io) {
    io.to(`user_${userId}`).emit(event, data);
  }
};

/**
 * Émet un événement à tous les utilisateurs connectés
 */
const emitToAll = (event, data) => {
  if (io) {
    io.emit(event, data);
  }
};

/**
 * Met à jour les métriques en temps réel
 */
const updateMetrics = async (userId, metrics) => {
  emitToUser(userId, 'metrics_update', metrics);
};

module.exports = { initSocket, emitToUser, emitToAll, updateMetrics };