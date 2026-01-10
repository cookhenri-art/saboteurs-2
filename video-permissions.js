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
  'END'
];

/**
 * Phases où SEULS certains rôles peuvent avoir caméra + micro
 * Format: { phase: [roles autorisés] }
 */
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
