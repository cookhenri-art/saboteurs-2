#!/bin/bash
# ============================================================
# Script de compression d'images PNG vers WebP
# ============================================================
# 
# PRÉREQUIS: Installer cwebp (Google WebP tools)
# - Windows: https://developers.google.com/speed/webp/download
# - Mac: brew install webp
# - Linux: sudo apt install webp
#
# USAGE: 
#   chmod +x compress-images.sh
#   ./compress-images.sh
#
# Ce script va:
# 1. Trouver tous les fichiers .png et .jpg dans public/images/
# 2. Les convertir en .webp avec qualité 85%
# 3. Afficher la réduction de taille
# ============================================================

echo "🖼️  Compression des images vers WebP..."
echo "========================================"

# Vérifier que cwebp est installé
if ! command -v cwebp &> /dev/null; then
    echo "❌ cwebp n'est pas installé!"
    echo ""
    echo "Installation:"
    echo "  - Mac: brew install webp"
    echo "  - Linux: sudo apt install webp"
    echo "  - Windows: télécharger depuis https://developers.google.com/speed/webp/download"
    exit 1
fi

# Répertoire des images
IMG_DIR="public/images"

if [ ! -d "$IMG_DIR" ]; then
    echo "❌ Répertoire $IMG_DIR non trouvé!"
    echo "   Exécute ce script depuis la racine du projet."
    exit 1
fi

# Compteurs
total=0
converted=0
saved_bytes=0

# Convertir les PNG
echo ""
echo "📁 Conversion des fichiers PNG..."
for file in $(find "$IMG_DIR" -name "*.png" -type f); do
    total=$((total + 1))
    webp_file="${file%.png}.webp"
    
    # Obtenir la taille originale
    original_size=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file" 2>/dev/null)
    
    # Convertir
    if cwebp -q 85 "$file" -o "$webp_file" -quiet; then
        new_size=$(stat -f%z "$webp_file" 2>/dev/null || stat -c%s "$webp_file" 2>/dev/null)
        saved=$((original_size - new_size))
        saved_bytes=$((saved_bytes + saved))
        converted=$((converted + 1))
        
        # Calculer le pourcentage
        if [ "$original_size" -gt 0 ]; then
            percent=$((100 - (new_size * 100 / original_size)))
            echo "  ✅ $(basename "$file") → $(basename "$webp_file") (-${percent}%)"
        fi
    else
        echo "  ❌ Échec: $file"
    fi
done

# Convertir les JPG
echo ""
echo "📁 Conversion des fichiers JPG..."
for file in $(find "$IMG_DIR" -name "*.jpg" -o -name "*.jpeg" -type f); do
    total=$((total + 1))
    webp_file="${file%.*}.webp"
    
    original_size=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file" 2>/dev/null)
    
    if cwebp -q 85 "$file" -o "$webp_file" -quiet; then
        new_size=$(stat -f%z "$webp_file" 2>/dev/null || stat -c%s "$webp_file" 2>/dev/null)
        saved=$((original_size - new_size))
        saved_bytes=$((saved_bytes + saved))
        converted=$((converted + 1))
        
        if [ "$original_size" -gt 0 ]; then
            percent=$((100 - (new_size * 100 / original_size)))
            echo "  ✅ $(basename "$file") → $(basename "$webp_file") (-${percent}%)"
        fi
    else
        echo "  ❌ Échec: $file"
    fi
done

# Résumé
echo ""
echo "========================================"
echo "📊 RÉSUMÉ"
echo "========================================"
echo "  Images traitées: $converted / $total"
echo "  Espace économisé: $((saved_bytes / 1024)) KB"
echo ""
echo "⚠️  N'OUBLIE PAS de mettre à jour les références dans:"
echo "    - public/styles.css (background-image: url(...))"
echo "    - public/client.js (chemins d'images)"
echo ""
echo "💡 Tu peux supprimer les anciens fichiers PNG/JPG après vérification."
