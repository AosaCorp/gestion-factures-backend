#!/bin/bash

PASSWORD="android"

echo "🔑 Signature avec SHA256..."

APK_DEBUG=$(find android/app/build/outputs/apk -name "*.apk" 2>/dev/null | head -1)

if [ -z "$APK_DEBUG" ]; then
    echo "❌ APK non trouvé"
    exit 1
fi

echo "📦 APK: $APK_DEBUG"

# Signer avec SHA256
jarsigner -verbose \
    -sigalg SHA256withRSA \
    -digestalg SHA256 \
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
    
    # Vérifier avec verbose
    echo "🔍 Vérification..."
    jarsigner -verify -verbose "$APK_SIGNED" | grep "jar verified"
else
    echo "❌ Échec de la signature"
fi