const { User } = require('../models');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');

// Récupérer tous les utilisateurs (admin seulement)
exports.getUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'name', 'email', 'role', 'twoFactorEnabled', 'lastLogin', 'createdAt', 'updatedAt']
    });
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Récupérer un utilisateur par ID
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: ['id', 'name', 'email', 'role', 'twoFactorEnabled', 'lastLogin', 'createdAt', 'updatedAt']
    });
    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Créer un utilisateur (admin seulement)
exports.createUser = async (req, res) => {
  try {
    const user = await User.create(req.body);
    const { password, ...userWithoutPassword } = user.toJSON();
    res.status(201).json(userWithoutPassword);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Mettre à jour un utilisateur (admin seulement)
exports.updateUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });
    await user.update(req.body);
    const { password, ...userWithoutPassword } = user.toJSON();
    res.json(userWithoutPassword);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Supprimer un utilisateur (admin seulement)
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });
    await user.destroy();
    res.json({ message: 'Utilisateur supprimé' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Activer le 2FA pour un utilisateur
exports.enable2FA = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    // Générer un nouveau secret
    const secret = speakeasy.generateSecret({ length: 20 });
    user.twoFactorSecret = secret.base32;
    user.twoFactorEnabled = true;
    await user.save();

    // Générer le QR code en base64
    qrcode.toDataURL(secret.otpauth_url, (err, data_url) => {
      if (err) {
        return res.status(500).json({ message: 'Erreur génération QR code' });
      }
      res.json({
        secret: secret.base32,
        qrcode: data_url,
        message: '2FA activé avec succès. Le QR code doit être scanné par l\'utilisateur.'
      });
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Désactiver le 2FA pour un utilisateur
exports.disable2FA = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    user.twoFactorSecret = null;
    user.twoFactorEnabled = false;
    await user.save();

    res.json({ message: '2FA désactivé avec succès' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};