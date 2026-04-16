import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import Papa from 'papaparse';

export const exportToCSV = async (data: any[], baseFilename: string) => {
  try {
    if (!data || data.length === 0) {
      throw new Error('Aucune donnée à exporter');
    }
    const csv = Papa.unparse(data);
    const timestamp = Date.now();
    const fileName = `${baseFilename}_${timestamp}.csv`;
    // Écriture dans le dossier privé de l'application
    await Filesystem.writeFile({
      path: fileName,
      data: csv,
      directory: Directory.Data,
    });
    const uri = await Filesystem.getUri({
      path: fileName,
      directory: Directory.Data,
    });
    await Share.share({
      title: 'Export CSV',
      text: `Fichier ${baseFilename}.csv`,
      url: uri.uri,
    });
    return true;
  } catch (error: any) {
    console.error('Erreur export CSV:', error);
    throw new Error(error.message || 'Erreur lors de l\'export');
  }
};