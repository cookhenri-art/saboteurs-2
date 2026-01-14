# 📘 GUIDE COMPLET - Infiltration Spatiale V26

## 🎯 Vue d'Ensemble

**Infiltration Spatiale V26** est un jeu multijoueur de social deduction (type Loup-Garou) avec 4 thèmes complets et un système de chargement dynamique des assets audio/images.

**Version** : V26-COMPLETE  
**Date** : 2026-01-09  
**Status** : ✅ Production Ready

---

## 📁 STRUCTURE DU PROJET

```
infiltration-spatiale-v26/
├── server.js                    # Serveur Node.js principal
├── theme-manager.js             # Gestion des thèmes
├── badge-system.js              # Système de badges
├── rate-limiter.js              # Rate limiting
├── logger.js                    # Logging
├── package.json                 # Dépendances
├── render.yaml                  # Config Render.com
│
├── themes/                      # ⭐ Thèmes JSON
│   ├── default.json            # Thème Spatial
│   ├── werewolf.json           # Thème Loups-Garous
│   ├── wizard-academy.json     # Thème Académie
│   └── mythic-realms.json      # Thème Royaumes
│
├── data/                        # Données de jeu
│
└── public/                      # Assets frontend
    ├── index.html              # Page HTML
    ├── client.js               # Client JavaScript
    ├── styles.css              # Styles CSS
    │
    ├── sounds/                 # 🔊 AUDIO PAR THÈME
    │   ├── audio-manifest.json # Manifeste (ne pas modifier)
    │   ├── default/            # 23 MP3 spatial
    │   ├── werewolf/           # 23 MP3 loups
    │   ├── wizard-academy/     # 23 MP3 académie
    │   └── mythic-realms/      # 23 MP3 royaumes
    │
    └── images/                 # 🖼️ IMAGES PAR THÈME
        ├── default/            # Thème Spatial
        │   ├── roles/          # 9 icônes de rôles
        │   └── ... (17 images total)
        ├── werewolf/
        │   └── roles/
        ├── wizard-academy/
        │   └── roles/
        └── mythic-realms/
            └── roles/
```

---

## 🎨 ORGANISATION DES ASSETS (IMPORTANT !)

### Principe Clé : **MÊMES NOMS PARTOUT**

Tous les fichiers ont **exactement le même nom** dans chaque thème.  
Seul le **contenu** change selon le thème !

### Exemple :

```
/sounds/default/INTRO_LOBBY.mp3      → Voix spatial
/sounds/werewolf/INTRO_LOBBY.mp3    → Voix village (MÊME NOM !)
/sounds/wizard-academy/INTRO_LOBBY.mp3 → Voix académie (MÊME NOM !)
```

```
/images/default/logo-spatial.png     → Logo vaisseau
/images/werewolf/logo-spatial.png    → Logo loup (MÊME NOM !)
/images/wizard-academy/logo-spatial.png → Logo sorcier (MÊME NOM !)
```

**Le code charge automatiquement depuis le bon dossier selon le thème actif !**

---

## 📋 LISTE COMPLÈTE DES FICHIERS PAR THÈME

### 🔊 AUDIO (23 fichiers MP3 par thème)

**Emplacement** : `/public/sounds/{themeId}/`

```
CHAMELEON_SLEEP.mp3
CHAMELEON_WAKE.mp3
CHECK_ROLE.mp3
DOCTOR_SLEEP.mp3
DOCTOR_WAKE.mp3
ELECTION_CHIEF.mp3
END_SCREEN_SONG.mp3
GENERIC_MAIN.mp3
IA_SLEEP.mp3
IA_WAKE.mp3
INTRO_LOBBY.mp3
OUTRO.mp3
RADAR_OFFICER_SLEEP.mp3
RADAR_OFFICER_WAKE.mp3
SABOTEURS_SLEEP.mp3
SABOTEURS_VOTE.mp3
SABOTEURS_WAKE.mp3
SECURITY_REVENGE.mp3
STATION_SLEEP.mp3
STATION_WAKE_HEAVY.mp3
STATION_WAKE_LIGHT.mp3
VOTE_ANNONCE.mp3
WAITING_LOOP.mp3
```

### 🖼️ IMAGES (17 fichiers par thème)

**Emplacement** : `/public/images/{themeId}/`

#### Logo & Background (2 fichiers)
```
logo-spatial.png              # Logo du thème (PNG avec transparence)
bg-space.jpg                  # Fond de page (JPG 1920x1080)
```

#### Images de Phases (4 fichiers)
```
cockpit.png                   # Lobby, élection capitaine
vote-jour.png                 # Phases de jour
vote-nuit.png                 # Phases de nuit
ejection.png                  # Quand il y a des morts
```

#### Images de Victoire (2 fichiers)
```
victory-saboteurs.png         # Écran de fin - méchants gagnent
victory-astronauts.png        # Écran de fin - gentils gagnent
```

#### Icônes de Rôles (9 fichiers dans `/roles/`)
```
astronaute.png                # Rôle innocent de base
saboteur.png                  # Rôle méchant principal
docteur.png                   # Rôle avec potions
chef-securite.png             # Rôle avec vengeance
liaison-ia.png                # Rôle qui lie deux joueurs
radar.png                     # Rôle qui inspecte
ingenieur.png                 # Rôle observateur
cameleon.png                  # Rôle qui échange
capitaine.png                 # Badge de capitaine
```

---

## 📊 RÉCAPITULATIF

| Élément | Par Thème | × 4 Thèmes | Total |
|---------|-----------|------------|-------|
| Audio MP3 | 23 | × 4 | **92 fichiers** |
| Images | 17 | × 4 | **68 fichiers** |
| **TOTAL** | **40** | **× 4** | **160 fichiers** |

---

## 🚀 INSTALLATION ET DÉMARRAGE

### Prérequis
- Node.js 14+ installé
- npm installé

### Installation
```bash
cd infiltration-spatiale-v26
npm install
```

### Démarrage
```bash
npm start
```

### Accès
- Local : `http://localhost:3000`
- Le port peut être configuré via la variable `PORT`

---

## 🎮 UTILISATION

### Créer une Partie
1. Entrer un pseudo (2-20 caractères)
2. Cliquer sur "CRÉER UNE MISSION"
3. Code de partie généré (4 chiffres)
4. Partager le code aux joueurs

### Rejoindre une Partie
1. Entrer un pseudo
2. Cliquer sur "REJOINDRE"
3. Entrer le code à 4 chiffres

### Changer le Thème (Host uniquement)
1. Dans le lobby, avant le démarrage
2. Sélectionner un thème
3. Le thème s'applique pour tous les joueurs
4. Une fois lancé, le thème est verrouillé

---

## 🎨 WORKFLOW DE CRÉATION DES ASSETS

### Phase 1 : Structure
```bash
# Les dossiers sont déjà créés dans le projet
# Vérifier avec :
ls public/sounds/
ls public/images/
```

### Phase 2 : Thème Default (Priorité)
```
1. Créer les 23 MP3 dans sounds/default/
2. Créer les 17 images dans images/default/ (+ 9 dans roles/)
3. Tester le jeu avec npm start
```

### Phase 3 : Dupliquer
```bash
# Copier vers les autres thèmes
cp sounds/default/* sounds/werewolf/
cp -r images/default/* images/werewolf/

cp sounds/default/* sounds/wizard-academy/
cp -r images/default/* images/wizard-academy/

cp sounds/default/* sounds/mythic-realms/
cp -r images/default/* images/mythic-realms/
```

### Phase 4 : Personnaliser
```
4. Remplacer progressivement les fichiers par thème
5. Garder les mêmes noms de fichiers !
6. Seul le contenu change
```

---

## 🎯 ADAPTATION PAR THÈME

### Thème Default (Spatial)
```
Style : Futuriste, sci-fi, néon bleu/cyan
Audio : Voix robotiques, ambiance spatiale
Images : Vaisseaux, étoiles, cockpit, astronautes
```

### Thème Werewolf (Loups-Garous)
```
Style : Médiéval sombre, gothique
Audio : Voix narrateur, ambiance village
Images : Village, forêt, loup, villageois
Rôles adaptés :
- astronaute.png → Villageois
- saboteur.png → Loup-Garou
- docteur.png → Sorcière
- radar.png → Voyante
- capitaine.png → Maire
```

### Thème Wizard Academy (Académie)
```
Style : Magique, violet/or, académique
Audio : Voix mystique, musique académie
Images : Château, livres, sorciers
Rôles adaptés :
- astronaute.png → Étudiant
- saboteur.png → Sorcier Maléfique
- docteur.png → Alchimiste
- radar.png → Oracle
- capitaine.png → Directeur
```

### Thème Mythic Realms (Royaumes)
```
Style : Fantasy épique, orange/or
Audio : Voix épique, musique royaume
Images : Royaume, montagnes, château
Rôles adaptés :
- astronaute.png → Habitant
- saboteur.png → Ogre
- docteur.png → Guérisseur
- radar.png → Éclaireur
- capitaine.png → Régent
```

---

## 🔧 FONCTIONNEMENT TECHNIQUE

### Chargement Automatique des Assets

#### Audio
```javascript
Thème actif = "werewolf"
Code demande : "INTRO_LOBBY"

Système résout :
→ /sounds/werewolf/INTRO_LOBBY.mp3  ✅
```

#### Images
```javascript
Thème actif = "werewolf"
Code demande : logo

Système charge :
→ /images/werewolf/logo-spatial.png  ✅
```

#### Images de Rôles
```javascript
Thème actif = "werewolf"
Joueur a le rôle "saboteur"

Système charge :
→ /images/werewolf/roles/saboteur.png  ✅
(Affiche le loup-garou)
```

### Fallback Automatique
Si un fichier manque, le jeu continue sans crash.

---

## 📝 SPÉCIFICATIONS TECHNIQUES

### Audio MP3
- **Format** : MP3
- **Bitrate** : 128-192 kbps
- **Durée** : 3-10s (sauf boucles et musiques)
- **Poids** : < 500 KB
- **Volume** : Normalisé à -3 dB

### Images PNG/JPG
- **Logos** : PNG 400x400px avec transparence
- **Backgrounds** : JPG 1920x1080px
- **Images phases** : PNG 1920x1080px
- **Icônes rôles** : PNG 128x128 ou 256x256 avec transparence
- **Poids** : < 500 KB par fichier

---

## ⚠️ POINTS IMPORTANTS

1. **Noms de fichiers** : EXACTEMENT comme indiqué (sensible à la casse)
2. **Mêmes noms partout** : Tous les thèmes utilisent les mêmes noms
3. **Structure respectée** : Dossiers /roles/ dans chaque thème
4. **Pas de modification du manifeste** : `audio-manifest.json` ne change pas
5. **Thèmes JSON** : Ne pas modifier la structure des JSON dans `/themes/`

---

## 📚 FICHIERS DE CONFIGURATION

### themes/default.json
Définit le thème spatial avec :
- Noms des rôles en français
- Titres des phases
- CSS variables
- Clés audio
- Noms des fichiers images

### public/sounds/audio-manifest.json
Mappe les clés audio vers les fichiers MP3.  
**Ne pas modifier ce fichier !**

---

## 🎊 CHECKLIST DE VALIDATION

### Pour chaque thème :

#### ✅ Audio (23 fichiers)
```
[ ] Tous les MP3 présents dans sounds/{themeId}/
[ ] Noms identiques aux autres thèmes
[ ] Format MP3 valide
```

#### ✅ Images (17 fichiers)
```
[ ] Logo et background présents
[ ] 4 images de phases présentes
[ ] 2 images de victoire présentes
[ ] 9 icônes de rôles dans /roles/
[ ] Noms identiques aux autres thèmes
```

#### ✅ Test
```
[ ] npm start fonctionne
[ ] Aucune erreur 404 dans la console
[ ] Thème s'affiche correctement
[ ] Sons se jouent correctement
```

---

## 🚀 DÉPLOIEMENT

### Sur Render.com
1. Connecter le repo GitHub
2. Render détecte automatiquement `render.yaml`
3. Le service démarre avec `npm start`
4. Uploader les assets via FTP ou Git LFS

### Variables d'Environnement
```
PORT=3000              # Port du serveur
NODE_ENV=production    # Mode production
```

---

## 🐛 DÉPANNAGE

### Erreur : "Cannot find module"
```bash
npm install
```

### Sons ne se jouent pas
- Vérifier que les fichiers MP3 existent
- Vérifier la console browser (F12)
- Cliquer sur la page (déverrouiller l'autoplay)

### Images ne s'affichent pas
- Vérifier que les fichiers existent
- Vérifier les noms de fichiers (casse sensible)
- Vérifier la console browser (404 = fichier manquant)

### Thème ne change pas
- Seul l'hôte peut changer le thème
- Uniquement en lobby (avant démarrage)
- Rafraîchir la page (F5)

---

## 📞 SUPPORT

Pour toute question :
- Vérifier ce guide en premier
- Consulter le CHANGELOG.md
- Vérifier la console browser (F12)

---

## 🎉 RÉSUMÉ RAPIDE

**Pour commencer :**
1. Installer : `npm install`
2. Créer les assets pour `default/` (40 fichiers)
3. Tester : `npm start`
4. Copier vers les autres thèmes
5. Personnaliser progressivement

**Structure clé :**
- Mêmes noms partout
- 23 MP3 + 17 images par thème
- Code charge automatiquement selon le thème actif

**Le jeu est prêt ! Il n'attend que tes assets ! 🎨🎵🚀**
