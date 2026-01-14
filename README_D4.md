# 🎬 VERSION D4 - MODE SALLE DE BRIEFING

## Vue d'ensemble

D4 introduit le **Mode Salle de Briefing** (ou "Mode Réunion"), une interface vidéo avancée inspirée des interfaces de visioconférence professionnelles type Zoom.

### Concept clé
- **1 vidéo focus principale** (active speaker ou sélection manuelle)
- **Colonne de mini-vignettes** (autres participants, clic → swap)
- **UI jeu réduite** mais accessible en bas de l'écran

---

## 📂 Nouveaux fichiers D4

| Fichier | Rôle |
|---------|------|
| `video-mode-controller.js` | Machine à états centralisée - décide quel mode afficher |
| `video-briefing.css` | Styles premium du mode salle de briefing |
| `video-briefing-ui.js` | Gestion DOM/rendu du mode avancé |

---

## 🎯 Règles d'activation automatiques

### Seuil de joueurs
- **≥ 4 joueurs** avec visio active → mode avancé possible
- **< 4 joueurs** → mode inline uniquement (vignettes dans players-list)

### Phase de jeu (prioritaire)
| Phase | Mode vidéo |
|-------|------------|
| JOUR (discussion libre) | Inline |
| DÉBAT / VOTE | **Mode avancé** (auto sur PC) |
| NUIT | PiP (PC) ou inline (mobile) |
| ACTION PRIVÉE | Masqué |
| FIN DE PARTIE | Mode avancé |

### Mobile vs Desktop
- **PC** : Mode avancé s'active automatiquement si conditions remplies
- **Mobile** : Activation manuelle requise (bouton "Agrandir visio")

---

## 🖥️ Layout PC - Mode Briefing

```
┌──────────────────────────────────────────────┐
│ 🎥  JOUEUR FOCUS (active speaker)            │
│                                              │
│                                              │
│                                              │
│───────────────┬─────────────────────────────│
│ 🎥 🎥 🎥 🎥    │ UI JEU (réduite)             │
│ thumbnails    │ (vote, chat, boutons)        │
└───────────────┴─────────────────────────────┘
```

---

## 📱 Layout Mobile - Mode Briefing

```
┌─────────────────────┐
│ 🎥 JOUEUR FOCUS     │
│                     │
│                     │
│─────────────────────│
│ 🎥 🎥 🎥 🎥 🎥       │ ← swipe horizontal
└─────────────────────┘
```

---

## 🎙 Active Speaker

- Changement de focus automatique sur l'orateur
- **Délai de stabilisation** : 700ms (évite le clignotement)
- **Focus manuel** : clic sur vignette → bloque l'auto-switch pendant 12s
- Highlight visuel (glow + badge "PARLE")

---

## ⌨️ Contrôles

| Action | PC | Mobile |
|--------|-----|--------|
| Sortir du mode | ESC ou bouton ✕ | Bouton ✕ |
| Focus manuel | Clic vignette | Tap vignette |
| Changer de focus | - | Swipe horizontal |
| Activer le mode | Auto | Bouton "Agrandir visio" |

---

## 🧪 Tests à effectuer

### Test baseline (2 joueurs)
- Vérifier que le mode avancé ne s'active pas

### Test seuil (4+ joueurs)
- Phase DÉBAT/VOTE sur PC → mode avancé auto
- Mobile → bouton "Agrandir visio" visible

### Test active speaker
- Parler → focus automatique (avec délai)
- Clic vignette → focus manuel prioritaire

### Test mobile
- Aucune popup automatique
- Swipe horizontal fonctionnel
- Retour au jeu accessible

---

## 🔧 Architecture technique

### VideoModeController (cerveau)
États possibles :
- `OFF` : Pas de visio
- `INLINE` : Vignettes dans players-list
- `ADVANCED_FOCUS` : Mode briefing plein écran
- `PIP` : Picture-in-Picture (nuit)
- `HIDDEN` : Phases privées

### Events émis
```javascript
videoModeCtrl.on('modeChange', ({ mode, previousMode, phase }) => { ... });
videoModeCtrl.on('focusChange', ({ playerId, isManual }) => { ... });
videoModeCtrl.on('activeSpeakerChange', ({ playerId }) => { ... });
```

---

## 🎨 Thèmes

Le CSS supporte les 4 thèmes existants :
- **Default (Spatial)** : Couleurs cyan/vert néon
- **Werewolf** : Tons bruns/orangés
- **Wizard Academy** : Violet magique
- **Mythic Realms** : Vert nature

---

## 📋 Checklist de validation D4

- [ ] Mode avancé ne s'active jamais par hasard
- [ ] Activation automatique en DÉBAT/VOTE (PC)
- [ ] Activation manuelle sur MOBILE
- [ ] 1 vidéo focus visible (jamais 2 grandes)
- [ ] Active speaker = focus par défaut (avec délai)
- [ ] Clic vignette = swap focus
- [ ] Bouton "Retour au jeu" fonctionne
- [ ] ESC quitte le mode (PC)
- [ ] Mobile : swipe horizontal fonctionne
- [ ] Aucun écran noir / duplication

---

## 🚀 Prochaines étapes (D4.5 / D5)

- [ ] Mode stream/spectateur
- [ ] Réactions emoji (👍 ❤️ 🎉)
- [ ] Enregistrement de la session
- [ ] Statistiques de temps de parole

---

*D4 Briefing Mode - v1.0*
*Développé pour Infiltration Spatiale / Les Saboteurs*
