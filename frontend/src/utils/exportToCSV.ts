import Papa from 'papaparse';

/**
 * Télécharge un tableau de données au format CSV
 * @param data - Tableau d'objets à exporter
 * @param filename - Nom du fichier (sans extension)
 * @param columns - (Optionnel) Liste des colonnes à inclure et leur ordre
 */
export const exportToCSV = <T extends Record<string, any>>(
  data: T[],
  filename: string,
  columns?: (keyof T)[]
) => {
  if (!data || data.length === 0) {
    alert('Aucune donnée à exporter');
    return;
  }

  // Si des colonnes sont spécifiées, on filtre les données
  let processedData = data;
  if (columns) {
    processedData = data.map(item => {
      const newItem: Partial<T> = {};
      columns.forEach(col => {
        newItem[col] = item[col];
      });
      return newItem as T;
    });
  }

  const csv = Papa.unparse(processedData, {
    delimiter: ';', // pour Excel (utilise ; comme séparateur)
    quotes: true,    // entoure les champs de guillemets
  });

  // Créer un blob et télécharger
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' }); // \uFEFF pour UTF-8 BOM (Excel)
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.href = url;
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};