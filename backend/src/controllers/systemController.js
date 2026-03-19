const os = require('os');
const fs = require('fs');
const path = require('path');
const { User, Client, Invoice } = require('../models');

exports.getSystemInfo = async (req, res) => {
  try {
    const usersCount = await User.count();
    const clientsCount = await Client.count();
    const invoicesCount = await Invoice.count();

    const dbPath = path.join(__dirname, '../../database.sqlite');
    let dbSize = 'N/A';
    if (fs.existsSync(dbPath)) {
      const stats = fs.statSync(dbPath);
      dbSize = (stats.size / 1024).toFixed(2) + ' KB';
    }

    const memoryUsage = process.memoryUsage();
    const memoryUsed = (memoryUsage.rss / 1024 / 1024).toFixed(2) + ' MB';

    const uptimeSeconds = process.uptime();
    const hours = Math.floor(uptimeSeconds / 3600);
    const minutes = Math.floor((uptimeSeconds % 3600) / 60);
    const uptime = `${hours}h ${minutes}m ${Math.floor(uptimeSeconds % 60)}s`;

    res.json({
      nodeVersion: process.version,
      users: usersCount,
      clients: clientsCount,
      invoices: invoicesCount,
      uptime,
      memory: memoryUsed,
      dbSize,
      dbType: 'SQLite 3'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};