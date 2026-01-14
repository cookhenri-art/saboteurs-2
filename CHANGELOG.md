# CHANGELOG - Infiltration Spatiale V26

## Version 26 (2026-01-09)

### 🔒 PHASE 1 - STABILITÉ (Priorité absolue)

#### S1 - Reconnexion robuste avec token
- ✅ Système de `playerToken` (UUID persistant dans localStorage)
- ✅ Association token ↔ playerId dans chaque room
- ✅ Vérification anti-doublon : refus si nom déjà pris avec token différent
- ✅ Heartbeat système (ping toutes les 30s pour maintenir la session vivante)
- ✅ `lastSeenAt` + garbage collection automatique
- ✅ Reconnexion transparente sur refresh et micro-coupures
- ✅ Pas de retour intempestif à l'écran d'accueil

#### S2 - Logs structurés JSON
- ✅ Logger unique `logger.js` avec format JSON une ligne
- ✅ Tous les logs incluent : timestamp, build, roomCode, phase, player, socketId
- ✅ Événements loggés : join, leave, reject, reconnect, phase_start, phase_ack, action, vote, resolve_night, end_game, force_advance, error
- ✅ Logs exploitables sur Render pour debugging

#### S3 - Validation serveur stricte + anti-spam
- ✅ Rate limiter `rate-limiter.js` avec limites par événement
- ✅ Limites configurées : joinRoom (3/10s), createRoom (5/min), ack (30/5s), vote (10/3s), actions (10/3s), heartbeat (120/min), forceAdvance (3/10s)
- ✅ Réponses systématiques `{ok: true/false, message}`
- ✅ Déverrouillage UI côté client si `{ok: false}`
- ✅ Garbage collection périodique du rate limiter

#### S4 - Mode hôte amélioré
- ✅ Bouton "Forcer la suite" (uniquement après 20s)
- ✅ Affichage des joueurs n'ayant pas validé la phase (à implémenter côté UI)
- ✅ Timer depuis début de phase (à implémenter côté UI)
- ✅ Confirmation modal (à implémenter côté UI)
- ✅ Comportement safe selon la phase (auto-ack)
- ✅ Logs structurés `force_advance`

### 🎮 PHASE 2 - FUN / PROGRESSION

#### F1 - Stats avancées
- ✅ `ejectedBySaboteurs` : compteur de kills nuit par saboteurs
- ✅ `ejectedByVote` : compteur d'éjections par vote du jour
- ✅ `captainElected` : nombre de fois élu capitaine
- ✅ `aiAgentLinks` : nombre de liens Agent IA créés
- ✅ `matchHistory` : historique des 20 dernières parties (pour calculs badges)

#### F2 - Badges progression
- ✅ Système de badges persistant `badge-system.js`
- ✅ 10 badges implémentés :
  - Saboteur implacable (3 victoires saboteurs d'affilée)
  - Astronaute vigilant (3 victoires astronautes d'affilée)
  - Docteur parfait (5+ saves sans kill)
  - Radar implacable (10+ inspections, 90%+ précision)
  - Capitaine décisif (5+ élections)
  - Saboteur fantôme (victoire sans suspicion)
  - Cupidon IA (10+ liens)
  - Vengeur implacable (5+ revenge kills)
  - Maître du déguisement (10+ swaps caméléon)
  - Vétéran spatial (100+ parties)
- ✅ Affichage des badges gagnés en fin de partie (à implémenter côté UI)
- ✅ Badges visibles dans stats détaillées (à implémenter côté UI)

#### F3 - Tutoriel express
- ⏳ Modal skippable avec "ne plus afficher" (à implémenter)
- ⏳ 4 écrans max avec icônes (à implémenter)
- ⏳ Accessible depuis home + bouton dans règles (à implémenter)

#### F4 - Animations + accessibilité
- ⏳ Animations légères (fade/slide) (à implémenter)
- ⏳ Respect de prefers-reduced-motion (à implémenter)
- ⏳ Mode compact auto <420px (à implémenter)
- ⏳ Bouton plein écran optionnel (à implémenter)
- ⏳ Accessibilité : contraste, taille texte, focus (à implémenter)

### 🎨 PHASE 3 - THÈMES / SKINS

#### T1 - Architecture thèmes
- ✅ Dossier `/themes/` avec fichiers JSON
- ✅ 4 thèmes créés :
  - `default.json` : Infiltration Spatiale (original)
  - `werewolf.json` : Loups-Garous de Thiercelieux
  - `wizard-academy.json` : Académie des Sorciers
  - `mythic-realms.json` : Royaumes Mythiques
- ✅ Gestionnaire de thèmes `theme-manager.js`
- ✅ Chaque thème contient : noms rôles, descriptions, textes phases, mapping audio, cssVars, images

#### T2 - Sélection thème par l'hôte
- ✅ Événement socket `setTheme` (uniquement hôte, avant start)
- ✅ Serveur stocke `room.themeId`
- ✅ API `/api/themes` pour liste des thèmes
- ⏳ UI de sélection thème dans lobby (à implémenter)
- ⏳ Application thème côté client (libellés, assets, CSS vars) (à implémenter)

#### Mapping des rôles par thème
- ✅ **Werewolf** : Loups-Garous, Villageois, Voyante, Sorcière, Chasseur, Cupidon, Petit Garçon, Loup Métamorphe
- ✅ **Wizard Academy** : Sorciers Maléfiques, Étudiants, Oracle, Alchimiste, Gardien du Château, Maître du Philtre, Apprenti Sorcier, Métamorphe
- ✅ **Mythic Realms** : Ogres, Habitants, Éclaireur, Guérisseur, Chevalier, Elfe Charmeur, Nain Espiègle, Dragon Métamorphe

---

## Fichiers modifiés

### Nouveaux fichiers
- `logger.js` - Logger structuré JSON
- `rate-limiter.js` - Système de rate limiting
- `badge-system.js` - Système de badges
- `theme-manager.js` - Gestionnaire de thèmes
- `themes/default.json` - Thème spatial
- `themes/werewolf.json` - Thème loups-garous
- `themes/wizard-academy.json` - Thème sorciers
- `themes/mythic-realms.json` - Thème fantasy
- `public/sounds/README.md` - Documentation des assets audio
- `public/images/README.md` - Documentation des assets images
- `CHANGELOG.md` - Ce fichier

### Fichiers modifiés
- `server.js` :
  - Import des nouveaux modules (logger, rate-limiter, badges, themes)
  - Amélioration de `newRoom()` avec playerTokens, themeId, phaseStartTime
  - Amélioration de `setPhase()` avec logs structurés
  - Amélioration de `ensurePlayerStats()` avec nouvelles métriques
  - Amélioration de `joinRoomCommon()` avec playerToken et heartbeat
  - Nouveaux événements socket : `heartbeat`, `setTheme`, `forceAdvance`
  - Rate limiting sur tous les événements critiques
  - Logs structurés partout

- `public/client.js` :
  - Ajout système `playerToken` (localStorage persistant)
  - Système heartbeat (ping 30s)
  - Amélioration reconnexion avec playerToken
  - Gestion déconnexion améliorée
  - playerToken envoyé dans createRoom, joinRoom, reconnectRoom

- `package.json` :
  - Aucune nouvelle dépendance (vanilla JS)

---

## Assets à fournir

### Sons (public/sounds/)
Voir `public/sounds/README.md` pour la liste complète.
Minimum 25 fichiers MP3 pour le thème par défaut.

### Images (public/images/)
Voir `public/images/README.md` pour la structure.
Fichiers par thème dans sous-dossiers :
- default/ (logo + background)
- werewolf/ (logo + background)
- wizard-academy/ (logo + background)
- mythic-realms/ (logo + background)

---

## Tests recommandés

### Stabilité
- ✅ Refresh pendant une partie → reconnexion transparente
- ✅ Coupure réseau 5s → reconnexion auto
- ✅ Deux joueurs même nom → refus avec token différent
- ✅ Spam de clics → rate limiting actif
- ✅ AFK pendant phase → hôte peut forcer

### Fonctionnalités
- ⏳ Badges débloqués après parties
- ⏳ Stats avancées calculées correctement
- ⏳ Sélection thème par hôte
- ⏳ Affichage correct des noms de rôles selon thème

### Performance
- ✅ Logs JSON exploitables sur Render
- ✅ Garbage collection rate limiter fonctionne
- ✅ Heartbeat maintient les sessions

---

## Notes de déploiement

1. Copier les fichiers audio MP3 dans `public/sounds/`
2. Copier les fichiers images dans `public/images/[theme]/`
3. Vérifier que `audio-manifest.json` existe
4. `npm install && npm start`
5. Le serveur est Render-ready

## Compatibilité

- ✅ Node.js >= 18
- ✅ Mobile iOS/Android
- ✅ Desktop (Chrome, Firefox, Safari, Edge)
- ✅ Reconnexion robuste
- ✅ Rate limiting actif
