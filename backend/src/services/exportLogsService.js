const { Parser } = require('json2csv');

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
    userName: (log.user && log.user.name) ? log.user.name : 'Système',
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
    user: (log.user && log.user.name) ? log.user.name : 'Système',
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
const exportLogsToHTML = (logs, stats) => {
  var formattedLogs = '';
  for (var i = 0; i < logs.length; i++) {
    var log = logs[i];
    formattedLogs += `
    <tr>
      <td>${formatDate(log.createdAt)}</td>
      <td>${log.action}</td>
      <td>${log.entityType || '-'}</td>
      <td>${log.entityId || '-'}</td>
      <td>${(log.user && log.user.name) ? log.user.name : 'Système'}</td>
      <td>${log.ip || '-'}</td>
    </table>
    `;
  }
  
  var statsHtml = '';
  if (stats) {
    var topActions = '';
    if (stats.actions && stats.actions.length > 0) {
      var actionCounts = [];
      for (var j = 0; j < Math.min(3, stats.actions.length); j++) {
        var a = stats.actions[j];
        actionCounts.push(a.action + ' (' + a.count + ')');
      }
      topActions = actionCounts.join(', ');
    }
    
    statsHtml = `
      <div class="stats">
        <h3>Statistiques</h3>
        <p>Total des logs: ${stats.total || 0}</p>
        <p>Logs aujourd'hui: ${stats.todayCount || 0}</p>
        <p>Actions les plus fréquentes: ${topActions || '-'}</p>
      </div>
    `;
  }
  
  return '<!DOCTYPE html>\n' +
'<html>\n' +
'<head>\n' +
'    <meta charset="UTF-8">\n' +
'    <title>Export des logs d\'audit</title>\n' +
'    <style>\n' +
'        body { font-family: Arial, sans-serif; margin: 40px; }\n' +
'        h1 { color: #3b82f6; text-align: center; }\n' +
'        .header { text-align: center; margin-bottom: 30px; }\n' +
'        .date { text-align: center; color: #666; margin-bottom: 20px; }\n' +
'        .stats { background: #f0fdf4; padding: 15px; border-radius: 8px; margin-bottom: 30px; border-left: 4px solid #22c55e; }\n' +
'        table { width: 100%; border-collapse: collapse; margin-top: 20px; }\n' +
'        th { background-color: #3b82f6; color: white; padding: 10px; text-align: left; }\n' +
'        td { padding: 8px; border-bottom: 1px solid #ddd; }\n' +
'        tr:hover { background-color: #f5f5f5; }\n' +
'        .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #999; border-top: 1px solid #ddd; padding-top: 20px; }\n' +
'    </style>\n' +
'</head>\n' +
'<body>\n' +
'    <div class="header">\n' +
'        <h1>Export des logs d\'audit</h1>\n' +
'    </div>\n' +
'    <div class="date">\n' +
'        Généré le: ' + new Date().toLocaleString('fr-FR') + '\n' +
'    </div>\n' +
'    ' + statsHtml + '\n' +
'    <h2>Liste des logs</h2>\n' +
'    <table>\n' +
'        <thead>\n' +
'            <tr>\n' +
'                <th>Date</th><th>Action</th><th>Entité</th><th>ID</th><th>Utilisateur</th><th>IP</th>\n' +
'            </tr>\n' +
'        </thead>\n' +
'        <tbody>\n' +
'            ' + (formattedLogs || '<tr><td colspan="6" style="text-align:center">Aucun log trouvé</td></tr>') + '\n' +
'        </tbody>\n' +
'    </table>\n' +
'    <div class="footer">\n' +
'        Rapport généré par l\'application Gestion Factures Association\n' +
'    </div>\n' +
'</body>\n' +
'</html>';
};

module.exports = {
  exportLogsToCSV,
  exportLogsToJSON,
  exportLogsToHTML
};