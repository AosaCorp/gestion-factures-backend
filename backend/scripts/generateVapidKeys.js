const webpush = require('web-push');

// Générer les clés VAPID
const vapidKeys = webpush.generateVAPIDKeys();

console.log('=== CLÉS VAPID POUR NOTIFICATIONS PUSH ===');
console.log('');
console.log('Public Key:');
console.log(vapidKeys.publicKey);
console.log('');
console.log('Private Key:');
console.log(vapidKeys.privateKey);
console.log('');
console.log('Ajoutez ces clés à votre fichier .env :');
console.log(`VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`);