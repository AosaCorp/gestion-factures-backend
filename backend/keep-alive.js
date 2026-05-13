/**
 * Script keep-alive pour Render
 * Exécute un ping régulier sur l'API pour éviter la mise en veille
 * 
 * Utilisation: node keep-alive.js
 */

const https = require('https');
const http = require('http');

// Configuration
const API_URL = process.env.RENDER_URL || 'https://gestion-factures-backend-mvdn.onrender.com';
const PING_INTERVAL = 14 * 60 * 1000; // 14 minutes
const STARTUP_DELAY = 60 * 1000; // 1 minute

console.log(`🔄 Service Keep-Alive démarré`);
console.log(`   URL cible: ${API_URL}`);
console.log(`   Intervalle: ${PING_INTERVAL / 1000 / 60} minutes`);
console.log(`   Démarrage dans: ${STARTUP_DELAY / 1000} secondes`);

const ping = () => {
  const protocol = API_URL.startsWith('https') ? https : http;
  const startTime = Date.now();
  
  const request = protocol.get(API_URL, (response) => {
    const duration = Date.now() - startTime;
    console.log(`💓 [${new Date().toLocaleTimeString()}] Ping OK - Status: ${response.statusCode} - Durée: ${duration}ms`);
    response.resume(); // Consommer la réponse
  });
  
  request.on('error', (err) => {
    console.log(`❌ [${new Date().toLocaleTimeString()}] Ping échoué: ${err.message}`);
  });
  
  request.setTimeout(10000, () => {
    console.log(`⏰ [${new Date().toLocaleTimeString()}] Ping timeout (10s)`);
    request.destroy();
  });
  
  request.end();
};

// Premier ping après délai
setTimeout(() => {
  ping();
  // Puis ping régulier
  setInterval(ping, PING_INTERVAL);
}, STARTUP_DELAY);

// Gestion de l'arrêt
process.on('SIGINT', () => {
  console.log('\n🛑 Arrêt du service Keep-Alive...');
  process.exit(0);
});