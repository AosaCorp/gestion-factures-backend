const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const { getCompany, updateCompany, uploadLogo } = require('../controllers/companyController');
const multer = require('multer');
const path = require('path');

// Configuration de multer pour l'upload de logo
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'logo-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

const router = express.Router();

router.use(protect);

router.route('/')
  .get(authorize('admin'), getCompany)
  .put(authorize('admin'), updateCompany);

router.post('/logo', authorize('admin'), upload.single('logo'), uploadLogo);

module.exports = router;