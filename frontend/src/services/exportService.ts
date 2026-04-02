import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import Papa from 'papaparse';

export const exportToCSV = async (data: any[], filename: string) => {
  try {
    const csv = Papa.unparse(data);
    const fileName = `${filename}.csv`;
    const result = await Filesystem.writeFile({
      path: fileName,
      data: csv,
      directory: Directory.Documents,
    });
    await Share.share({
      title: 'Export CSV',
      text: `Fichier ${fileName}`,
      url: result.uri,
    });
    return true;
  } catch (error) {
    console.error('Erreur export CSV:', error);
    throw error;
  }
};