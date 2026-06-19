const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
const { authenticate } = require('google-auth-library');

// Charger les credentials du compte de service
let auth = null;
let drive = null;

/**
 * Initialise le client Google Drive
 */
const initDriveClient = () => {
  try {
    const credentialsPath = process.env.GOOGLE_DRIVE_CREDENTIALS || './credentials.json';
    
    if (!fs.existsSync(credentialsPath)) {
      console.log('⚠️ Fichier credentials Google Drive non trouvé');
      return false;
    }
    
    const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
    
    auth = new google.auth.GoogleAuth({
      credentials: credentials,
      scopes: ['https://www.googleapis.com/auth/drive.file'],
    });
    
    drive = google.drive({ version: 'v3', auth });
    console.log('✅ Google Drive initialisé');
    return true;
  } catch (error) {
    console.error('❌ Erreur initialisation Google Drive:', error.message);
    return false;
  }
};

/**
 * Upload une sauvegarde sur Google Drive
 */
const uploadBackupToDrive = async (filePath, fileName) => {
  try {
    if (!drive) {
      const init = initDriveClient();
      if (!init) return null;
    }
    
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
    
    if (!folderId) {
      console.log('⚠️ GOOGLE_DRIVE_FOLDER_ID non défini');
      return null;
    }
    
    // Vérifier si le fichier existe
    if (!fs.existsSync(filePath)) {
      console.log(`❌ Fichier non trouvé: ${filePath}`);
      return null;
    }
    
    // Rechercher si un fichier avec le même nom existe
    const existingFiles = await drive.files.list({
      q: `name='${fileName}' and '${folderId}' in parents and trashed=false`,
      fields: 'files(id, name)',
    });
    
    // Supprimer l'ancien fichier s'il existe (pour garder une seule sauvegarde récente)
    for (const file of existingFiles.data.files) {
      await drive.files.delete({ fileId: file.id });
      console.log(`🗑️ Ancien fichier supprimé: ${file.name}`);
    }
    
    // Upload du nouveau fichier
    const fileMetadata = {
      name: fileName,
      parents: [folderId],
    };
    
    const media = {
      mimeType: 'application/gzip',
      body: fs.createReadStream(filePath),
    };
    
    const response = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id, name, webViewLink',
    });
    
    console.log(`✅ Fichier uploadé sur Google Drive: ${response.data.name} (ID: ${response.data.id})`);
    return response.data;
  } catch (error) {
    console.error('❌ Erreur upload Google Drive:', error.message);
    return null;
  }
};

/**
 * Liste les sauvegardes sur Google Drive
 */
const listBackupsOnDrive = async () => {
  try {
    if (!drive) {
      const init = initDriveClient();
      if (!init) return [];
    }
    
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
    
    if (!folderId) {
      return [];
    }
    
    const response = await drive.files.list({
      q: `'${folderId}' in parents and trashed=false`,
      fields: 'files(id, name, createdTime, size)',
      orderBy: 'createdTime desc',
    });
    
    return response.data.files.map(file => ({
      id: file.id,
      name: file.name,
      createdTime: file.createdTime,
      size: file.size ? parseInt(file.size) : 0,
    }));
  } catch (error) {
    console.error('Erreur listing Google Drive:', error.message);
    return [];
  }
};

/**
 * Supprime une sauvegarde sur Google Drive
 */
const deleteBackupFromDrive = async (fileId) => {
  try {
    if (!drive) {
      const init = initDriveClient();
      if (!init) return false;
    }
    
    await drive.files.delete({ fileId });
    console.log(`🗑️ Fichier supprimé de Google Drive: ${fileId}`);
    return true;
  } catch (error) {
    console.error('❌ Erreur suppression Google Drive:', error.message);
    return false;
  }
};

module.exports = {
  initDriveClient,
  uploadBackupToDrive,
  listBackupsOnDrive,
  deleteBackupFromDrive,
};