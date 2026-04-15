import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import Papa from 'papaparse';

export const exportToCSV = async (data: any[], filename: string) => {
  try {
    if (!data || data.length === 0) {
      throw new Error('Aucune donnée à exporter');
    }
    const csv = Papa.unparse(data);
    const fileName = `${filename}.csv`;
    const result = await Filesystem.writeFile({
      path: fileName,
      data: csv,
      directory: Directory.Cache, // ← Changement clé
    });
    await Share.share({
      title: 'Export CSV',
      text: `Fichier ${fileName}`,
      url: result.uri,
    });
    return true;
  } catch (error: any) {
    console.error('Erreur export CSV:', error);
    throw new Error(error.message || 'Erreur lors de l\'export');
  }
};