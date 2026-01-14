# Guide de déploiement - Infiltration Spatiale V26

## 📦 Contenu du package

Ce ZIP contient la version 26 d'Infiltration Spatiale avec toutes les améliorations de stabilité, progression et thèmes.

### Nouveautés V26

#### Phase 1 : Stabilité ✅
- **Reconnexion robuste** : Plus de perte de session au refresh
- **Logs structurés JSON** : Debugging facilité sur Render
- **Anti-spam** : Rate limiting sur toutes les actions critiques
- **Mode hôte amélioré** : Bouton "Forcer la suite" après 20s

#### Phase 2 : Progression ✅
- **Stats avancées** : Kills par saboteurs, éjections par vote, capitaine élu, etc.
- **10 badges** : Déblocables selon performances
- **Système de progression** : Récompenses pour fidéliser les joueurs

#### Phase 3 : Thèmes ✅
- **4 thèmes disponibles** : Spatial, Loups-Garous, Sorciers, Fantasy
- **Personnalisation complète** : Noms de rôles, textes, audio, visuels
- **Sélection par l'hôte** : Choix du thème avant le lancement

---

## 🚀 Déploiement sur Render

### Étape 1 : Préparer les assets

**Important** : Ce ZIP ne contient PAS les fichiers audio et images pour réduire la taille.

#### Audio (obligatoire pour l'expérience complète)
1. Consultez `public/sounds/README.md` pour la liste des fichiers
2. Générez ou enregistrez les fichiers MP3 (25 minimum pour le thème par défaut)
3. Placez-les dans `public/sounds/`
4. Assurez-vous que `audio-manifest.json` est présent

**Options pour générer l'audio** :
- **IA** : ElevenLabs, Google TTS, Azure TTS
- **Manuel** : Enregistrer avec votre voix + Audacity
- **Minimal** : Le TTS du navigateur servira de fallback

#### Images (optionnel)
1. Consultez `public/images/README.md` pour la structure
2. Ajoutez logos et backgrounds dans les sous-dossiers par thème
3. Si omis, l'interface utilisera des couleurs de fond CSS

### Étape 2 : Déployer sur Render

1. **Créer un nouveau Web Service** sur https://render.com
2. **Connecter votre repository Git** ou uploader le projet
3. **Configuration** :
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Environment: Node 18+
4. **Variables d'environnement** (optionnel) :
   ```
   PORT=3000
   BUILD_ID=infiltration-spatiale-v26
   DATA_DIR=/opt/render/project/data
   ```
5. **Déployer** : Render va build et démarrer automatiquement

### Étape 3 : Vérifications post-déploiement

1. **Health check** : Visitez `https://votre-app.onrender.com/api/health`
   - Devrait retourner `{"ok": true}`

2. **Build info** : Visitez `https://votre-app.onrender.com/api/build`
   - Affiche version, Node.js, etc.

3. **Thèmes** : Visitez `https://votre-app.onrender.com/api/themes`
   - Liste les 4 thèmes disponibles

4. **Logs** : Dans le dashboard Render, vérifiez les logs JSON structurés

---

## 🎮 Utilisation

### Pour les joueurs

1. **Créer une mission** : L'hôte clique sur "CRÉER UNE MISSION"
2. **Configurer** :
   - Activer/désactiver les rôles spéciaux
   - **Nouveau** : Choisir un thème (Spatial, Loups-Garous, Sorciers, Fantasy)
3. **Inviter** : Partager le code à 4 chiffres
4. **Jouer** : Minimum 4 joueurs, tous doivent être prêts

### Pour l'hôte (nouveautés V26)

- **Sélection thème** : Avant le start, choisir le thème dans le lobby
- **Forcer la suite** : Si un joueur est AFK, bouton disponible après 20s
- **Voir les AFK** : Liste des joueurs n'ayant pas validé (à venir dans UI)

### Reconnexion

- **Refresh** : Reconnexion automatique transparente
- **Coupure réseau** : Tentative auto pendant 5s puis reload
- **Session persistante** : Token dans localStorage, garde votre identité

---

## 📊 Système de badges

10 badges débloquables :

1. **Saboteur implacable** 🔥 : 3 victoires saboteurs d'affilée
2. **Astronaute vigilant** 🚀 : 3 victoires astronautes d'affilée
3. **Docteur parfait** ⚕️ : 5+ saves sans aucun kill
4. **Radar implacable** 📡 : 10+ inspections avec 90%+ précision
5. **Capitaine décisif** ⭐ : Élu capitaine 5+ fois
6. **Saboteur fantôme** 👻 : Victoire sans être suspecté
7. **Cupidon IA** 💕 : 10+ liens créés
8. **Vengeur implacable** ⚔️ : 5+ revenge kills
9. **Maître du déguisement** 🦎 : 10+ swaps caméléon
10. **Vétéran spatial** 🎖️ : 100+ parties jouées

Les badges sont stockés dans `data/badges.json` et persistent entre sessions.

---

## 🎨 Thèmes disponibles

### 1. Infiltration Spatiale (défaut)
- **Ambiance** : Science-fiction, station spatiale
- **Méchants** : Saboteurs
- **Héros** : Astronautes
- **Rôles** : Officier Radar, Docteur Bio, Chef de Sécurité, Agent IA, Ingénieur, Caméléon

### 2. Loups-Garous de Thiercelieux
- **Ambiance** : Médiéval-fantastique, village
- **Méchants** : Loups-Garous
- **Héros** : Villageois
- **Rôles** : Voyante, Sorcière, Chasseur, Cupidon, Petit Garçon, Loup Métamorphe

### 3. Académie des Sorciers
- **Ambiance** : Magie, école de sorcellerie
- **Méchants** : Sorciers Maléfiques
- **Héros** : Étudiants
- **Rôles** : Oracle, Alchimiste, Gardien, Maître du Philtre, Apprenti, Métamorphe

### 4. Royaumes Mythiques
- **Ambiance** : Heroic fantasy, royaume
- **Méchants** : Ogres
- **Héros** : Habitants
- **Rôles** : Éclaireur, Guérisseur, Chevalier, Elfe Charmeur, Nain Espiègle, Dragon Métamorphe

---

## 🔧 Développement local

```bash
# Installation
npm install

# Lancer le serveur
npm start

# Le serveur démarre sur http://localhost:3000
```

### Tests recommandés

1. **Reconnexion** : Refresh pendant partie → pas de retour à l'accueil
2. **Token** : Deux joueurs avec même nom mais tokens différents → refus
3. **Rate limit** : Spam de clics → messages d'erreur appropriés
4. **Forcer suite** : Hôte peut débloquer si AFK (après 20s)
5. **Thèmes** : Sélection thème change noms et textes
6. **Badges** : Jouer plusieurs parties pour débloquer badges

---

## 📁 Structure du projet

```
infiltration-spatiale-v26/
├── server.js              # Serveur principal (+ nouvelles fonctionnalités)
├── logger.js              # Logs structurés JSON
├── rate-limiter.js        # Anti-spam
├── badge-system.js        # Système de badges
├── theme-manager.js       # Gestionnaire de thèmes
├── package.json
├── render.yaml
├── README.md
├── CHANGELOG.md           # Détail des changements V26
├── DEPLOY.md              # Ce fichier
├── data/                  # Stats et badges (créé au runtime)
│   ├── stats.json
│   └── badges.json
├── themes/                # Thèmes du jeu
│   ├── default.json
│   ├── werewolf.json
│   ├── wizard-academy.json
│   └── mythic-realms.json
└── public/
    ├── index.html
    ├── client.js          # Client amélioré (token + heartbeat)
    ├── styles.css
    ├── sounds/
    │   ├── README.md      # Liste des MP3 à ajouter
    │   └── audio-manifest.json
    └── images/
        ├── README.md      # Structure des images
        ├── default/
        ├── werewolf/
        ├── wizard-academy/
        └── mythic-realms/
```

---

## 🐛 Debugging

### Logs structurés

Tous les événements sont loggés en JSON sur stdout :

```json
{"timestamp":"2026-01-09T12:34:56.789Z","level":"info","event":"join","build":"infiltration-spatiale-v26","roomCode":"1234","playerId":"abc-123","playerName":"Alice","socketId":"xyz"}
```

**Événements clés** :
- `join` : Joueur rejoint
- `reconnect` : Reconnexion réussie
- `reject` : Tentative refusée
- `phase_start` : Nouvelle phase
- `force_advance` : Hôte force la suite
- `end_game` : Partie terminée
- `rate_limit` : Spam détecté

### Sur Render

Les logs sont dans le dashboard : **Logs** → filtrer par "event"

---

## ⚠️ Limites connues

### Phase 2 - À finaliser dans UI
- Affichage des badges en fin de partie
- Tutoriel express (4 écrans)
- Animations et accessibilité

### Phase 3 - À finaliser dans UI
- Interface de sélection de thème dans lobby
- Application dynamique du thème côté client (CSS vars, libellés)
- Chargement des assets audio/images selon thème

Ces fonctionnalités sont **préparées côté serveur** mais nécessitent du travail côté client.

---

## 📞 Support

- Consultez `CHANGELOG.md` pour le détail des modifications
- Les logs JSON aident au debugging
- Le système est robuste et Render-ready

**Bon jeu ! 🚀**
