import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import Papa from 'papaparse';

// Détecte si l'application tourne dans Capacitor (mobile)
const isCapacitor = () => {
  return !!(window as any).Capacitor?.isNativePlatform();
};

export const exportToCSV = async (data: any[], baseFilename: string) => {
  try {
    if (!data || data.length === 0) {
      throw new Error('Aucune donnée à exporter');
    }
    const csv = Papa.unparse(data);
    const timestamp = Date.now();
    const fileName = `${baseFilename}_${timestamp}.csv`;

    if (isCapacitor()) {
      // Mode mobile (Capacitor) : écrire dans le cache et partager
      await Filesystem.writeFile({
        path: fileName,
        data: csv,
        directory: Directory.Cache,
      });
      const uri = await Filesystem.getUri({ path: fileName, directory: Directory.Cache });
      await Share.share({
        title: 'Export CSV',
        text: `Fichier ${baseFilename}.csv`,
        url: uri.uri,
      });
    } else {
      // Mode web : téléchargement classique
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
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