/**
 * Video Permissions Manager
 * Gère l'activation/désactivation des caméras selon les phases du jeu
 */

/**
 * Phases où TOUS les joueurs peuvent avoir caméra + micro
 */
const FULL_VIDEO_PHASES = [
  'LOBBY',
  'MANUAL_ROLE_PICK',
  'ROLE_REVEAL',
  'CAPTAIN_CANDIDACY',
  'CAPTAIN_VOTE',
  'NIGHT_RESULTS',      // ✅ Résultats de la nuit - Échanges entre joueurs
  'DAY_WAKE',           // ✅ Réveil - Discussion des résultats
  'DAY_CAPTAIN_TRANSFER',
  'DAY_RESULTS',        // ✅ Résultats du vote - Voir les réactions
    'END_STATS_OUTRO',   // ✅ Stats/Outro: discussion libre
  'END_STATS',         // ✅ (fallback si phase existe)
  'END'
  'END_VICTORY',
  'END_SCREEN',
  'GAME_OVER',
  'GAME_END',
];

/**
 * Phases où SEULS certains rôles peuvent avoir caméra + micro
 * Format: { phase: [roles autorisés] }
 */
/**
 * Phases de nuit où le rôle actif doit rester silencieux (caméra + micro OFF)
 * But: ne pas trahir son identité (chaméléon, docteur, radar...)
 */
const SILENT_NIGHT_PHASES = new Set([
  'NIGHT_CHAMELEON',
  'NIGHT_DOCTOR',
  'NIGHT_RADAR'
]);

const ROLE_RESTRICTED_PHASES = {
  'NIGHT_SABOTEURS': ['saboteur'],
  'NIGHT_AI_AGENT': ['ai_agent'],  // Les amoureux se voient
  'NIGHT_CHAMELEON': ['chameleon'],
  'NIGHT_RADAR': ['radar_officer'],
  'NIGHT_DOCTOR': ['doctor']
};

/**
 * Phases où PERSONNE ne doit avoir la caméra (discussions audio seulement)
 */
const CAMERA_OFF_PHASES = [
  'DAY_VOTE',           // Vote secret
  'DAY_TIEBREAK',       // Décision du capitaine
  'NIGHT_START',        // Tout le monde dort
  'REVENGE'             // Chef sécurité choisit seul
];

/**
 * Détermine si un joueur peut activer sa caméra selon la phase et son rôle
 * @param {string} phase - Phase actuelle du jeu
 * @param {object} player - Objet joueur avec { role, status, linkedTo }
 * @param {Map} allPlayers - Map de tous les joueurs (pour vérifier les liens)
 * @returns {object} - { video: boolean, audio: boolean, reason: string }
 */
function getPlayerVideoPermissions(phase, player, allPlayers = new Map()) {
  // Si le joueur est mort ou a quitté → pas de caméra ni micro
  if (player.status === 'dead' || player.status === 'left') {
    return {
      video: false,
      audio: false,
      reason: 'Joueur éliminé ou déconnecté'
    };
  }


  // ---------------- V7: règles STRICTES (nuit / canaux privés) ----------------
  // Nuit Saboteurs: seuls les saboteurs voient/entendent entre eux
  if (phase === 'NIGHT_SABOTEURS') {
    const isSaboteur = player.role === 'saboteur';
    return {
      video: isSaboteur,
      audio: isSaboteur,
      reason: isSaboteur ? 'Canal saboteurs' : 'Endormi (nuit saboteurs)'
    };
  }

  // Nuit IA: IA + personne liée uniquement (canal privé)
  if (phase === 'NIGHT_AI_AGENT') {
    // Recherche de l'agent IA vivant
    let aiPlayer = null;
    for (const [, p] of allPlayers.entries()) {
      if (p.role === 'ai_agent' && p.status === 'alive') { aiPlayer = p; break; }
    }

    const aiLinkedId = aiPlayer && aiPlayer.linkedTo;
    const isAI = player.role === 'ai_agent';
    const isLinkedToAI =
      (aiPlayer && aiLinkedId && player.id === aiLinkedId) ||
      (player.linkedTo && aiPlayer && player.linkedTo === aiPlayer.id) ||
      (player.linkedTo && aiLinkedId && player.linkedTo === aiLinkedId);

    const partnerAlive =
      (isAI && aiLinkedId && allPlayers.get(aiLinkedId) && allPlayers.get(aiLinkedId).status === 'alive') ||
      (isLinkedToAI && aiPlayer && aiPlayer.status === 'alive');

    const allowed = (isAI || isLinkedToAI) && partnerAlive;

    return {
      video: allowed,
      audio: allowed,
      reason: allowed ? 'Canal IA (duo)' : 'Endormi (nuit IA)'
    };
  }

  // Nuits "silencieuses": chaméléon / docteur / radar
  // Le rôle agit via l'UI du jeu => caméra+micro OFF pour éviter d'être identifié.
  if (phase === 'NIGHT_CHAMELEON' || phase === 'NIGHT_DOCTOR' || phase === 'NIGHT_RADAR') {
    return {
      video: false,
      audio: false,
      reason: 'Rôle secret: phase silencieuse'
    };
  }

  // Phase avec caméra complètement désactivée
  if (CAMERA_OFF_PHASES.includes(phase)) {
    return {
      video: false,
      audio: true,  // Micro reste actif pour discuter
      reason: `Phase ${phase}: caméras désactivées`
    };
  }

  // Phase avec vidéo complète pour tous
  if (FULL_VIDEO_PHASES.includes(phase)) {
    return {
      video: true,
      audio: true,
      reason: 'Phase publique'
    };
  }

  // Phase restreinte par rôle
  if (ROLE_RESTRICTED_PHASES[phase]) {
    const allowedRoles = ROLE_RESTRICTED_PHASES[phase];
    const hasPermission = allowedRoles.includes(player.role);


    // ✅ Rôles "silencieux" pendant la nuit: même si le rôle est actif, caméra+micro restent OFF
    // (le joueur agit via l'UI du jeu, pas besoin de parler ni d'être vu)
    if (SILENT_NIGHT_PHASES.has(phase)) {
      return {
        video: false,
        audio: false,
        reason: `Rôle secret (silencieux): ${player.role}`
      };
    }
    // Cas spécial AI_AGENT: les deux amoureux se voient
    if (phase === 'NIGHT_AI_AGENT' && player.linkedTo) {
      const partner = allPlayers.get(player.linkedTo);
      if (partner && partner.status === 'alive') {
        return {
          video: true,
          audio: true,
          reason: 'Amoureux actifs'
        };
      }
    }

    return {
      video: hasPermission,
      audio: hasPermission,
      reason: hasPermission ? `Rôle actif: ${player.role}` : 'Rôle inactif cette phase'
    };
  }

  // Par défaut: vidéo et audio activés
  return {
    video: true,
    audio: true,
    reason: 'Phase standard'
  };
}

/**
 * Calcule les permissions pour tous les joueurs d'une room
 * @param {string} phase - Phase actuelle
 * @param {Map} players - Map des joueurs
 * @returns {object} - { playerId: { video, audio, reason } }
 */
function calculateRoomPermissions(phase, players) {
  const permissions = {};

  for (const [playerId, player] of players.entries()) {
    permissions[playerId] = getPlayerVideoPermissions(phase, player, players);
  }

  return permissions;
}

/**
 * Génère un message explicatif pour le changement de phase
 * @param {string} phase - Nouvelle phase
 * @returns {string} - Message à afficher
 */
function getPhaseVideoMessage(phase) {
  if (CAMERA_OFF_PHASES.includes(phase)) {
    return "📹 Caméras désactivées pour cette phase";
  }

  if (SILENT_NIGHT_PHASES.has(phase)) {
    return "😴 Phase secrète: tout le monde est silencieux";
  }

  if (ROLE_RESTRICTED_PHASES[phase]) {
    return "📹 Caméras actives uniquement pour certains rôles";
  }

  if (FULL_VIDEO_PHASES.includes(phase)) {
    return "📹 Caméras et micros actifs pour tous";
  }

  return "📹 Permissions vidéo standards";
}

/**
 * Vérifie si une phase nécessite un changement de permissions
 * @param {string} oldPhase - Ancienne phase
 * @param {string} newPhase - Nouvelle phase
 * @returns {boolean}
 */
function shouldUpdatePermissions(oldPhase, newPhase) {
  if (oldPhase === newPhase) return false;

  // Toujours mettre à jour si on change de catégorie
  const oldCategory = getPhaseCategory(oldPhase);
  const newCategory = getPhaseCategory(newPhase);

  return oldCategory !== newCategory;
}

/**
 * Détermine la catégorie d'une phase (pour optimiser les updates)
 * @param {string} phase
 * @returns {string}
 */
function getPhaseCategory(phase) {
  if (FULL_VIDEO_PHASES.includes(phase)) return 'FULL';
  if (CAMERA_OFF_PHASES.includes(phase)) return 'OFF';
  if (ROLE_RESTRICTED_PHASES[phase]) return 'RESTRICTED';
  return 'DEFAULT';
}

module.exports = {
  getPlayerVideoPermissions,
  calculateRoomPermissions,
  getPhaseVideoMessage,
  shouldUpdatePermissions,
  FULL_VIDEO_PHASES,
  ROLE_RESTRICTED_PHASES,
  CAMERA_OFF_PHASES
};
