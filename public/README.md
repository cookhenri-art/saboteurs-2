# Infiltration Spatiale (Render-ready)

Jeu multijoueur temps réel (Express + Socket.IO) — **sans bots** — jouable en local et déployable sur Render.

## Lancer en local

```bash
npm install
npm start
```

Ouvrir: http://localhost:3000

⚠️ Important : **ne pas** ouvrir `public/index.html` en double-cliquant (mode `file://`).
Le jeu a besoin du serveur Socket.IO.

## Déploiement Render (zéro effort)

Ce projet est prêt pour Render :
- Web Service Node
- Port automatique (`PORT`)
- Front statique servi depuis `/public`
- Stats persistées sur disque Render

### Option 1 — Avec `render.yaml` (recommandé)
1. Crée un nouveau service Render depuis ce repo/zip.
2. Render détecte `render.yaml` et configure :
   - `npm install` (build)
   - `npm start` (start)
   - disque persistant monté sur `/var/data`
   - variable `DATA_DIR=/var/data`

### Option 2 — Configuration manuelle
- **Build Command** : `npm install`
- **Start Command** : `npm start`
- **Environment Variable** : `DATA_DIR=/var/data`
- **Disque persistant** : mount `/var/data` (1GB suffit)

## Identité / multi-onglets (obligatoire)

- Chaque onglet = un joueur (identité par `sessionStorage`)
- Un `playerId` unique est généré automatiquement (UUID).
- **F5/refresh ne fait jamais quitter** : reconnexion silencieuse automatique.

## Déconnexion / Quitter (règle 30 secondes)

- Un refresh rapide ne spamme pas les autres.
- Si un joueur n'est pas revenu après 30 secondes : il est retiré des joueurs actifs (considéré sorti).
- Les ACK/quorums se recalculent automatiquement.
- Si on passe sous 4 joueurs actifs : la partie est interrompue.

## Audio (règle absolue)

- Aucun chevauchement.
- À chaque changement de phase : arrêt immédiat du son en cours.
- Les MP3 sont auto-mappés par noms de fichiers (dans `/public/sounds`).
- Si un MP3 manque : fallback TTS (voix navigateur).

## Transmission du capitaine (règle)

Si le capitaine est mort avant le vote du jour :
- Une phase “Transmission du capitaine” s'ouvre.
- Le capitaine mort choisit un nouveau capitaine **sans connaître son rôle**.
- **Fallback** si le capitaine mort est indisponible (déconnecté/parti) : choix aléatoire parmi les vivants.

## Persistance des stats

Stats cumulées **par NOM** (pas par navigateur), stockées dans :
- `${DATA_DIR}/stats.json` (Render) ou `./data/stats.json` (local)

## Notes / hypothèses raisonnables

- Les rôles spéciaux sont à 0/1 occurrence (toggle par l'hôte dans le lobby).
- Le nombre de saboteurs est automatique :
  - 0–6 joueurs : 1 saboteur
  - 7–11 joueurs : 2 saboteurs
  - 12+ joueurs : 3 saboteurs
- Le mode “manuel” (cartes physiques) est prévu : dans ce cas le serveur ne force pas l'attribution, et chaque joueur peut sélectionner son rôle avant la confirmation.
