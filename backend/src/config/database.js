const { Sequelize } = require('sequelize');
const path = require('path');

// En production (Render), on utilise le chemin du disk monté
// sinon, en local on utilise le dossier courant
const dataDir = process.env.NODE_ENV === 'production' 
  ? '/opt/render/project/src/backend/data' 
  : './';

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(dataDir, 'database.sqlite'),
  logging: false
});

module.exports = sequelize;