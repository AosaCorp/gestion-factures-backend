#!/bin/bash

# Chemins
APK_UNSIGNED="android/app/build/outputs/apk/debug/app-debug.apk"
APK_SIGNED="android/app/build/outputs/apk/release/app-release-signed.apk"
KEYSTORE="android/my-release-key.keystore"
ALIAS="my-key-alias"

# 🔑 REMPLACE PAR LE MOT DE PASSE QUE TU AS SAISI
STORE_PASS="TON_MOT_DE_PASSE_ICI"
KEY_PASS="TON_MOT_DE_PASSE_ICI"

# Vérifier que l'APK existe
if [ ! -f "$APK_UNSIGNED" ]; then
    echo "❌ APK non trouvé: $APK_UNSIGNED"
    exit 1
fi

# Vérifier que la clé existe
if [ ! -f "$KEYSTORE" ]; then
    echo "❌ Keystore non trouvé: $KEYSTORE"
    exit 1
fi

echo "🔑 Signature de l'APK..."

# Signer avec apksigner
apksigner sign \
    --ks "$KEYSTORE" \
    --ks-pass "pass:$STORE_PASS" \
    --key-pass "pass:$KEY_PASS" \
    --out "$APK_SIGNED" \
    "$APK_UNSIGNED"

if [ $? -eq 0 ]; then
    echo "✅ APK signé: $APK_SIGNED"
    
    # Vérifier la signature
    echo "🔍 Vérification de la signature..."
    apksigner verify "$APK_SIGNED"
else
    echo "❌ Erreur signature - Vérifie que STORE_PASS et KEY_PASS sont corrects"
    echo "💡 Pendant la génération du keystore, tu as saisi un mot de passe (2 fois)"
fi