#!/bin/bash

PASSWORD="android"  # ← Change ici si tu as utilisé un autre mot de passe

echo "🔑 Signature avec jarsigner..."

APK_DEBUG=$(find android/app/build/outputs/apk -name "*.apk" 2>/dev/null | head -1)

if [ -z "$APK_DEBUG" ]; then
    echo "❌ APK non trouvé"
    exit 1
fi

echo "📦 APK: $APK_DEBUG"

jarsigner -verbose \
    -sigalg SHA1withRSA \
    -digestalg SHA1 \
    -keystore android/my-release-key.keystore \
    -storepass "$PASSWORD" \
    -keypass "$PASSWORD" \
    "$APK_DEBUG" \
    my-key-alias

if [ $? -eq 0 ]; then
    mkdir -p android/app/build/outputs/apk/release
    APK_SIGNED="android/app/build/outputs/apk/release/app-release-signed.apk"
    cp "$APK_DEBUG" "$APK_SIGNED"
    echo "✅ APK signé: $APK_SIGNED"
    
    # Vérifier
    jarsigner -verify "$APK_SIGNED"
else
    echo "❌ Échec - Mot de passe incorrect ?"
    echo "💡 Le mot de passe est celui saisi lors de keytool"
fi