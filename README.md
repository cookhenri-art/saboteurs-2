# Infiltration Spatiale - V26

**Jeu multijoueur de déduction sociale en temps réel** inspiré des loups-garous.

Version 26 avec reconnexion robuste, badges de progression et système de thèmes.

## 🚀 Nouveautés V26

### Stabilité maximale
- ✅ **Reconnexion robuste** : Token persistant, pas de perte de session
- ✅ **Logs structurés JSON** : Debugging facilité
- ✅ **Anti-spam** : Rate limiting sur toutes les actions
- ✅ **Mode hôte** : Forcer la suite si joueur AFK

### Progression
- ✅ **10 badges** : Récompenses selon performances
- ✅ **Stats avancées** : Kills, éjections, capitaine, etc.

### Thèmes
- ✅ **4 univers** : Spatial, Loups-Garous, Sorciers, Fantasy
- ✅ **Personnalisation** : Noms, textes, audio, visuels

## 📦 Installation

```bash
npm install
npm start
```

Ouvrir : http://localhost:3000

⚠️ **Ne pas** ouvrir `public/index.html` directement (besoin du serveur Socket.IO).

## 🌐 Déploiement Render

Ce projet est Render-ready. Consultez **DEPLOY.md** pour le guide complet.

Configuration automatique avec `render.yaml` :
- Build: `npm install`
- Start: `npm start`
- Disque persistant: `/var/data`

## 📖 Documentation

- **CHANGELOG.md** : Détail des modifications V26
- **DEPLOY.md** : Guide de déploiement et utilisation
- **public/sounds/README.md** : Liste des fichiers audio requis
- **public/images/README.md** : Structure des images

## 🎮 Comment jouer

1. L'hôte crée une mission et choisit un thème
2. Les joueurs rejoignent avec le code à 4 chiffres (minimum 4 joueurs)
3. Tous doivent être prêts
4. Le jeu alterne phases de nuit (actions secrètes) et de jour (votes)
5. But : Astronautes éliminent saboteurs, ou saboteurs éliminent astronautes

## 🏆 Système de badges

10 badges débloquables pour récompenser les performances :
- Saboteur implacable 🔥, Docteur parfait ⚕️, Radar implacable 📡
- Capitaine décisif ⭐, Vengeur implacable ⚔️, Vétéran spatial 🎖️
- Saboteur fantôme 👻, Cupidon IA 💕, Maître du déguisement 🦎, Astronaute vigilant 🚀

## 🎨 Thèmes

4 thèmes sélectionnables par l'hôte :
- **Infiltration Spatiale** (défaut) : Station spatiale, saboteurs vs astronautes
- **Loups-Garous** : Village médiéval, loups vs villageois
- **Académie des Sorciers** : École de magie, sorciers maléfiques vs étudiants
- **Royaumes Mythiques** : Fantasy, ogres vs habitants

## 🔒 Sécurité & Stabilité

- Rate limiting anti-spam (3 tentatives join/10s, 5 créations/min, etc.)
- Token persistant pour reconnexion (localStorage)
- Heartbeat système (ping 30s)
- Logs structurés JSON pour monitoring
- Validation serveur stricte avec réponses {ok, message}

## 📊 Logs & Monitoring

Tous les événements sont loggés en JSON une ligne :
```json
{"timestamp":"2026-01-09T12:00:00Z","level":"info","event":"join","build":"infiltration-spatiale-v26","roomCode":"1234","playerId":"abc","socketId":"xyz"}
```

Événements clés : join, reconnect, reject, phase_start, phase_ack, vote, end_game, force_advance, rate_limit

## 🔧 Configuration

Le jeu fonctionne sans configuration. Variables optionnelles :
- `PORT` : Port du serveur (défaut: 3000)
- `BUILD_ID` : Identifiant de build (défaut: infiltration-spatiale-v26)
- `DATA_DIR` : Dossier pour stats/badges (défaut: ./data)

## 📱 Compatibilité

- ✅ Node.js 18+
- ✅ Mobile (iOS/Android)
- ✅ Desktop (Chrome, Firefox, Safari, Edge)
- ✅ Reconnexion robuste (refresh, micro-coupures)
- ✅ Responsive design

## 🎯 Architecture

```
infiltration-spatiale-v26/
├── server.js              # Serveur principal avec nouvelles fonctionnalités
├── logger.js              # Logs structurés JSON
├── rate-limiter.js        # Anti-spam
├── badge-system.js        # Système de badges
├── theme-manager.js       # Gestionnaire de thèmes
├── themes/                # 4 thèmes JSON
│   ├── default.json
│   ├── werewolf.json
│   ├── wizard-academy.json
│   └── mythic-realms.json
├── public/
│   ├── client.js          # Client avec token + heartbeat
│   ├── sounds/            # Audio (README + manifest)
│   └── images/            # Images par thème (README)
└── data/                  # Stats et badges (runtime)
```

## 🚧 Travail restant (UI)

Phase 2 & 3 - À finaliser côté interface :
- Interface de sélection de thème dans lobby
- Affichage des badges en fin de partie
- Tutoriel express (4 écrans)
- Animations et accessibilité
- Application dynamique du thème (CSS vars, libellés)

**Les systèmes serveur sont prêts**, il reste l'intégration UI client.

## 📄 Licence

Projet éducatif - Usage libre

---

**Bon jeu ! 🚀**
