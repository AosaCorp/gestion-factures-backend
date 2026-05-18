const { Parser } = require('json2csv');
const fs = require('fs');
const path = require('path');

/**
 * Formate la date pour l'affichage
 */
const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleString('fr-FR');
};

/**
 * Exporte les logs au format CSV
 */
const exportLogsToCSV = (logs) => {
  const fields = [
    { label: 'Date', value: 'date' },
    { label: 'Action', value: 'action' },
    { label: 'Entité', value: 'entityType' },
    { label: 'ID Entité', value: 'entityId' },
    { label: 'Utilisateur', value: 'userName' },
    { label: 'IP', value: 'ip' },
    { label: 'Détails', value: 'detailsStr' }
  ];
  
  const formattedLogs = logs.map(log => ({
    date: formatDate(log.createdAt),
    action: log.action,
    entityType: log.entityType || '-',
    entityId: log.entityId || '-',
    userName: log.user?.name || 'Système',
    ip: log.ip || '-',
    detailsStr: log.details ? JSON.stringify(log.details).substring(0, 500) : '-'
  }));
  
  const parser = new Parser({ fields });
  return parser.parse(formattedLogs);
};

/**
 * Exporte les logs au format JSON
 */
const exportLogsToJSON = (logs) => {
  const formattedLogs = logs.map(log => ({
    date: formatDate(log.createdAt),
    action: log.action,
    entityType: log.entityType,
    entityId: log.entityId,
    user: log.user?.name || 'Système',
    userId: log.userId,
    ip: log.ip,
    details: log.details,
    createdAt: log.createdAt
  }));
  
  return JSON.stringify(formattedLogs, null, 2);
};

/**
 * Exporte les logs au format HTML (pour PDF)
 */
const exportLogsToHTML = (logs, stats = null) => {
  const formattedLogs = logs.map(log => `
    <tr>
      <td>${formatDate(log.createdAt)}</td>
      <td>${log.action}</td>
      <td>${log.entityType || '-'}</td>
      <td>${log.entityId || '-'}</td>
      <td>${log.user?.name || 'Système'}</td>
      <td>${log.ip || '-'}</td>
    </tr>
  `).join('');
  
  const statsHtml = stats ? `
    <div class="stats">
      <h3>Statistiques</h3>
      <p>Total des logs: ${stats.total}</p>
      <p>Logs aujourd'hui: ${stats.todayCount}</p>
      <p>Actions les plus fréquentes: ${stats.actions?.slice(0, 3).map((a: any) => `${a.action} (${a.count})`).join(', ') || '-'}</p>
    </div>
  ` : '';
  
  return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Export des logs d'audit</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        h1 { color: #3b82f6; text-align: center; }
        .header { text-align: center; margin-bottom: 30px; }
        .date { text-align: center; color: #666; margin-bottom: 20px; }
        .stats { background: #f0fdf4; padding: 15px; border-radius: 8px; margin-bottom: 30px; border-left: 4px solid #22c55e; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th { background-color: #3b82f6; color: white; padding: 10px; text-align: left; }
        td { padding: 8px; border-bottom: 1px solid #ddd; }
        tr:hover { background-color: #f5f5f5; }
        .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #999; border-top: 1px solid #ddd; padding-top: 20px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Export des logs d'audit</h1>
    </div>
    <div class="date">
        Généré le: ${new Date().toLocaleString('fr-FR')}
    </div>
    ${statsHtml}
    <h2>Liste des logs</h2>
    <table>
        <thead>
            <tr>
                <th>Date</th><th>Action</th><th>Entité</th><th>ID</th><th>Utilisateur</th><th>IP</th>
            </tr>
        </thead>
        <tbody>
            ${formattedLogs || '<tr><td colspan="6" style="text-align:center">Aucun log trouvé</td></tr>'}
        </tbody>
    </table>
    <div class="footer">
        Rapport généré par l'application Gestion Factures Association
    </div>
</body>
</html>`;
};

module.exports = {
  exportLogsToCSV,
  exportLogsToJSON,
  exportLogsToHTML
};