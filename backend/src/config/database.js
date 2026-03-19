const { Sequelize } = require('sequelize');
const path = require('path');

const dataDir = process.env.NODE_ENV === 'production' 
  ? '/opt/render/project/src/backend/data' 
  : './';

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(dataDir, 'database.sqlite'),
  logging: false
});

module.exports = sequelize;