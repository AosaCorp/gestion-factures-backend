import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';
import Papa from 'papaparse';

export const exportToCSV = async (data: any[], _filename: string) => {
  try {
    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    if (Capacitor.isNativePlatform()) {
      await Browser.open({ url });
    } else {
      window.open(url, '_blank');
    }

    URL.revokeObjectURL(url);
    return true;
  } catch (error) {
    console.error('Erreur export CSV:', error);
    // Fallback
    const fallbackUrl = URL.createObjectURL(new Blob([Papa.unparse(data)], { type: 'text/csv' }));
    window.open(fallbackUrl, '_blank');
    throw error;
  }
};