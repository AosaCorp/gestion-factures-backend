const { Company } = require('../models');
const path = require('path');
const fs = require('fs');

exports.getCompany = async (req, res) => {
  try {
    let company = await Company.findOne();
    if (!company) {
      company = await Company.create({});
    }
    res.json(company);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

exports.updateCompany = async (req, res) => {
  try {
    let company = await Company.findOne();
    if (!company) {
      company = await Company.create(req.body);
    } else {
      await company.update(req.body);
    }
    res.json(company);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

exports.uploadLogo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Aucun fichier envoyé' });
    }
    
     // Vérifier que le dossier uploads existe
    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    
    const filePath = req.file.path;
    let company = await Company.findOne();
    if (!company) {
      company = await Company.create({ logo: filePath });
    } else {
      if (company.logo && fs.existsSync(company.logo)) {
        fs.unlinkSync(company.logo);
      }
      company.logo = filePath;
      await company.save();
    }
    res.json({ message: 'Logo uploadé avec succès', logo: filePath });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};