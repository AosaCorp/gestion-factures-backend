import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.association.factures',
  appName: 'GestionFacturesAsso',
  webDir: 'frontend/dist',  // ← chemin corrigé
  bundledWebRuntime: false,
  server: {
    androidScheme: 'https'
  }
};

export default config;