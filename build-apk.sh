#!/bin/bash
set -e
echo "🔨 Build frontend..."
cd frontend
npm run build
cd ..

# Vérifier si la plateforme android existe, sinon l'ajouter
if [ ! -d "android" ]; then
    echo "➕ Ajout de la plateforme Android..."
    npx cap add android
fi

echo "🔄 Sync Capacitor..."
npx cap sync android

echo "📦 Génération APK..."
cd android
./gradlew assembleDebug

echo "✅ APK généré : android/app/build/outputs/apk/debug/app-debug.apk"