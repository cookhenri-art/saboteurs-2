# Image Assets - Infiltration Spatiale

Ce dossier doit contenir les fichiers images suivants. Les fichiers ne sont pas inclus dans le dépôt pour réduire la taille.

## Structure des dossiers

```
images/
├── README.md (ce fichier)
├── default/          # Thème spatial (par défaut)
│   ├── logo-spatial.png
│   └── bg-space.jpg
├── werewolf/         # Thème loups-garous
│   ├── logo-werewolf.png
│   └── bg-village.jpg
├── wizard-academy/   # Thème école de magie
│   ├── logo-wizard.png
│   └── bg-academy.jpg
└── mythic-realms/    # Thème fantasy
    ├── logo-realm.png
    └── bg-realm.jpg
```

## Fichiers requis

### Thème Default (Spatial)
- `default/logo-spatial.png` - Logo principal (PNG transparent recommandé, ~400x400px)
- `default/bg-space.jpg` - Fond d'écran spatial (JPG, 1920x1080px ou plus)

### Thème Werewolf
- `werewolf/logo-werewolf.png` - Logo loups-garous
- `werewolf/bg-village.jpg` - Fond village médiéval

### Thème Wizard Academy
- `wizard-academy/logo-wizard.png` - Logo école de magie
- `wizard-academy/bg-academy.jpg` - Fond château/académie

### Thème Mythic Realms
- `mythic-realms/logo-realm.png` - Logo fantasy
- `mythic-realms/bg-realm.jpg` - Fond royaume fantastique

## Spécifications techniques

### Logos
- Format : PNG avec transparence
- Dimensions recommandées : 400x400px minimum
- Poids : < 200 KB
- Usage : Affiché en haut de l'interface

### Backgrounds
- Format : JPG (ou WebP pour optimisation)
- Dimensions : 1920x1080px minimum (Full HD)
- Poids : < 500 KB (compression recommandée)
- Usage : Fond d'écran de l'interface

## Notes

- Les images ne sont pas obligatoires pour que le jeu fonctionne
- Si une image est manquante, l'interface utilisera des couleurs de fond via CSS
- Vous pouvez générer des images avec des outils comme :
  - Midjourney / DALL-E / Stable Diffusion (IA)
  - Photoshop / GIMP (manuel)
  - Sites de ressources libres : Unsplash, Pexels, Pixabay
- Assurez-vous d'avoir les droits sur les images utilisées
- Les thèmes sont sélectionnables par l'hôte avant le lancement de la partie
