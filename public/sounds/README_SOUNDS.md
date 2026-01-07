# MP3 requis (noms de fichiers)

Place tes fichiers `.mp3` dans ce dossier **avec exactement ces noms** (majuscules/minuscules identiques).

> Si un MP3 est manquant, le jeu utilise un fallback **TTS** (voix synthèse) quand c’est pertinent, sinon silence.

## Ambiance / Lobby
- `GENERIC_MAIN.mp3` — accueil + lobby avant lancement
- `INTRO_LOBBY.mp3` — découverte des rôles (**la partie attend la fin de ce MP3** avant de passer aux candidatures capitaine)
- `ELECTION_CHIEF.mp3` — élection du Chef de station (candidats + vote + résultat)

## Nuit
- `STATION_SLEEP.mp3` — début de nuit
- `CHAMELEON_WAKE.mp3`
- `CHAMELEON_SLEEP.mp3`
- `RADAR_OFFICER_WAKE.mp3`
- `RADAR_OFFICER_SLEEP.mp3`
- `SABOTEURS_WAKE.mp3`
- `SABOTEURS_VOTE.mp3` — boucle pendant le vote des saboteurs
- `SABOTEURS_SLEEP.mp3`
- `DOCTOR_WAKE.mp3`
- `DOCTOR_SLEEP.mp3`

## Résultats de nuit (optionnel)
- `NIGHT_RESULTS_ANNOUNCE.mp3` — si présent, remplace le TTS “Joueurs X,Y...”

## Jour
- `STATION_WAKE_LIGHT.mp3` — réveil (si aucun mort pendant la nuit)
- `STATION_WAKE_HEAVY.mp3` — réveil (si au moins 1 mort pendant la nuit)
- `VOTE_ANNONCE.mp3` — annonce du vote de jour
- `WAITING_LOOP.mp3` — boucle pendant la collecte des votes de jour

## Spécial
- `SECURITY_REVENGE.mp3` — vengeance du Chef de sécurité

## Fin
- `END_SCREEN_SONG.mp3` — musique écran de fin
- `OUTRO.mp3` — joue automatiquement après END_SCREEN_SONG
