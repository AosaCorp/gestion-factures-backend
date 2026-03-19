const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const { User } = require('../models');

const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

// @desc    Inscription d'un utilisateur (admin seulement)
// @route   POST /api/auth/register
// @access  Private/Admin
const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'Cet email est déjà utilisé' });
    }
    const user = await User.create({ name, email, password, role });
    res.status(201).json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    });
  } catch (error) {
    console.error('❌ Erreur register:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// @desc    Connexion utilisateur
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  console.log('➡️  login route atteinte avec body:', req.body);
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email et mot de passe requis' });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      console.log('❌ Utilisateur non trouvé pour:', email);
      return res.status(401).json({ message: 'Identifiants incorrects' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('❌ Mot de passe incorrect pour:', email);
      return res.status(401).json({ message: 'Identifiants incorrects' });
    }

    if (user.twoFactorEnabled) {
      const tempToken = jwt.sign(
        { id: user.id, twoFactorPending: true },
        process.env.JWT_SECRET,
        { expiresIn: '5m' }
      );
      console.log('✅ 2FA requis, tempToken généré');
      return res.json({ twoFactorRequired: true, tempToken });
    }

    // Mettre à jour la dernière connexion
    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user.id, user.role);
    console.log('✅ Login réussi pour:', email);
    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('❌ Erreur login:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

const verifyTwoFactor = async (req, res) => {
  try {
    const { tempToken, token } = req.body;
    const decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
    if (!decoded.twoFactorPending) {
      return res.status(400).json({ message: 'Token invalide' });
    }
    const user = await User.findByPk(decoded.id);
    if (!user || !user.twoFactorEnabled) {
      return res.status(401).json({ message: 'Utilisateur non trouvé ou 2FA non activé' });
    }

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token
    });
    if (!verified) {
      return res.status(401).json({ message: 'Code 2FA invalide' });
    }

    // Mettre à jour la dernière connexion
    user.lastLogin = new Date();
    await user.save();

    const jwtToken = generateToken(user.id, user.role);
    res.json({
      token: jwtToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('❌ Erreur verify2FA:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// @desc    Activer 2FA (pour l'utilisateur connecté)
// @route   POST /api/auth/enable-2fa
// @access  Private
const enableTwoFactor = async (req, res) => {
  try {
    const user = req.user;
    const secret = speakeasy.generateSecret({ length: 20 });
    user.twoFactorSecret = secret.base32;
    user.twoFactorEnabled = true;
    await user.save();

    qrcode.toDataURL(secret.otpauth_url, (err, data_url) => {
      if (err) {
        return res.status(500).json({ message: 'Erreur génération QR code' });
      }
      res.json({ secret: secret.base32, qrcode: data_url });
    });
  } catch (error) {
    console.error('❌ Erreur enable2FA:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// @desc    Changer le mot de passe
// @route   POST /api/auth/change-password
// @access  Private
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findByPk(req.user.id);
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Mot de passe actuel incorrect' });
    }
    user.password = newPassword; // sera hashé par le hook
    await user.save();
    res.json({ message: 'Mot de passe modifié avec succès' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// @desc    Récupérer l'utilisateur connecté
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password', 'twoFactorSecret'] }
    });
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

module.exports = {
  register,
  login,
  verifyTwoFactor,
  enableTwoFactor,
  changePassword,
  getMe
};