const { User } = require('../models');

exports.seedAdmin = async (req, res) => {
  try {
    const adminExists = await User.findOne({ where: { role: 'admin' } });
    if (adminExists) {
      return res.status(400).json({ message: 'Un admin existe déjà' });
    }
    await User.create({
      name: 'Admin',
      email: 'admin@example.com',
      password: 'admin123',
      role: 'admin'
    });
    res.json({ message: 'Admin créé avec succès' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};