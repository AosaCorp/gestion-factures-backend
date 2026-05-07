import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import Papa from 'papaparse';
import { isCapacitor } from '../utils/platform';

/**
 * Exporte des données au format CSV
 * @param data - Tableau d'objets à exporter
 * @param baseFilename - Nom de base du fichier (sans extension)
 * @returns Promise<boolean>
 */
export const exportToCSV = async (data: any[], baseFilename: string) => {
  try {
    if (!data || data.length === 0) {
      throw new Error('Aucune donnée à exporter');
    }

    // Formater les données pour enlever les slash et les espaces incorrects
    const formattedData = data.map(row => {
      const newRow: any = {};
      for (const [key, value] of Object.entries(row)) {
        if (typeof value === 'string') {
          // Supprimer les slash et les espaces multiples
          let cleanedValue = value.replace(/\s*\/\s*/g, ' ');
          cleanedValue = cleanedValue.replace(/\s+/g, ' ');
          newRow[key] = cleanedValue.trim();
        } else {
          newRow[key] = value;
        }
      }
      return newRow;
    });

    // Générer le CSV (avec BOM pour les caractères français)
    const csv = Papa.unparse(formattedData);
    const timestamp = Date.now();
    const fileName = `${baseFilename}_${timestamp}.csv`;

    if (isCapacitor()) {
      // Pour Capacitor (mobile) : encoder en base64
      const base64Data = btoa(unescape(encodeURIComponent(csv)));
      await Filesystem.writeFile({
        path: fileName,
        data: base64Data,
        directory: Directory.Cache,
        recursive: true
      });
      const uri = await Filesystem.getUri({ path: fileName, directory: Directory.Cache });
      await Share.share({
        title: 'Export CSV',
        text: `Fichier ${baseFilename}.csv`,
        url: uri.uri
      });
    } else {
      // Pour le web : téléchargement direct
      const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }

    return true;
  } catch (error: any) {
    console.error('Erreur export CSV:', error);
    throw new Error(error.message || 'Erreur lors de l\'export');
  }
};