# Audio Assets - Infiltration Spatiale

Ce dossier doit contenir les fichiers audio MP3 suivants. Les fichiers ne sont pas inclus dans le dépôt pour réduire la taille.

## Fichiers requis pour le thème par défaut (Spatial)

### Ambiances principales
- `intro-lobby.mp3` - Musique d'accueil du lobby
- `station-sleep.mp3` - La station s'endort (nuit)
- `station-wake-light.mp3` - Réveil léger (pas de mort)
- `station-wake-heavy.mp3` - Réveil lourd (avec mort(s))
- `generic-main.mp3` - Musique générique
- `waiting-loop.mp3` - Boucle d'attente (pendant votes, etc.)

### Rôles - Réveils
- `chameleon-wake.mp3` - Caméléon se réveille
- `ia-wake.mp3` - Agent IA se réveille
- `radar-wake.mp3` - Officier radar se réveille
- `saboteurs-wake.mp3` - Saboteurs se réveillent
- `doctor-wake.mp3` - Docteur bio se réveille

### Rôles - Endormissements
- `chameleon-sleep.mp3` - Caméléon se rendort
- `ia-sleep.mp3` - Agent IA se rendort
- `radar-sleep.mp3` - Officier radar se rendort
- `saboteurs-sleep.mp3` - Saboteurs se rendorment
- `doctor-sleep.mp3` - Docteur bio se rendort

### Événements jour
- `election-chief.mp3` - Élection du capitaine
- `vote-annonce.mp3` - Annonce du vote d'éjection
- `security-revenge.mp3` - Vengeance du chef de sécurité

### Fin de partie
- `end-victory.mp3` - Sting de victoire court
- `end-stats-outro.mp3` - Musique pour les statistiques finales
- `end-screen-song.mp3` - Chanson de fin (optionnel)
- `outro.mp3` - Outro général (fallback)

### Utilitaires
- `check-role.mp3` - Prompt de vérification de rôle (après swap caméléon)

## Fichiers pour thème Werewolf (Loups-Garous)

Si vous activez le thème Werewolf, ajoutez aussi :
- `intro-village.mp3`
- `village-sleep.mp3`
- `village-wake-light.mp3`
- `village-wake-heavy.mp3`
- `werewolf-metamorph-wake.mp3`
- `werewolf-metamorph-sleep.mp3`
- `cupid-wake.mp3`
- `cupid-sleep.mp3`
- `seer-wake.mp3`
- `seer-sleep.mp3`
- `werewolves-wake.mp3`
- `werewolves-sleep.mp3`
- `witch-wake.mp3`
- `witch-sleep.mp3`
- `mayor-election.mp3`
- `hunter-revenge.mp3`

## Fichiers pour thème Wizard Academy (Sorciers)

Si vous activez le thème Wizard Academy, ajoutez :
- `intro-academy.mp3`
- `academy-sleep.mp3`
- `academy-wake-light.mp3`
- `academy-wake-heavy.mp3`
- `metamorph-wake.mp3`
- `metamorph-sleep.mp3`
- `philtre-wake.mp3`
- `philtre-sleep.mp3`
- `oracle-wake.mp3`
- `oracle-sleep.mp3`
- `dark-wizards-wake.mp3`
- `dark-wizards-sleep.mp3`
- `alchemist-wake.mp3`
- `alchemist-sleep.mp3`
- `director-election.mp3`
- `guardian-revenge.mp3`

## Fichiers pour thème Mythic Realms (Fantasy)

Si vous activez le thème Mythic Realms, ajoutez :
- `intro-realm.mp3`
- `realm-sleep.mp3`
- `realm-wake-light.mp3`
- `realm-wake-heavy.mp3`
- `dragon-wake.mp3`
- `dragon-sleep.mp3`
- `elf-wake.mp3`
- `elf-sleep.mp3`
- `scout-wake.mp3`
- `scout-sleep.mp3`
- `ogres-wake.mp3`
- `ogres-sleep.mp3`
- `healer-wake.mp3`
- `healer-sleep.mp3`
- `regent-election.mp3`
- `knight-revenge.mp3`

## Notes

- Format recommandé : MP3, 128-192 kbps
- Les fichiers sont mappés via `audio-manifest.json`
- Le système TTS (text-to-speech) servira de fallback si un fichier est manquant
- Vous pouvez utiliser des outils comme ElevenLabs, Google TTS, ou enregistrer vos propres voix
