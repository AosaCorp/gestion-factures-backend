import { Browser } from '@capacitor/browser';
import Papa from 'papaparse';

export const exportToCSV = async (data: any[], _filename: string) => {
  try {
    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    await Browser.open({ url });
    URL.revokeObjectURL(url);
    return true;
  } catch (error) {
    console.error('Erreur export CSV:', error);
    throw error;
  }
};