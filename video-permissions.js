/**
 * Video Permissions Manager
 * V9.1 FINAL – based on V8.1 (API intact)
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
  'NIGHT_RESULTS',
  'DAY_WAKE',
  'DAY_CAPTAIN_TRANSFER',
  'DAY_RESULTS',
  'END_STATS_OUTRO',
  'END_STATS',
  'END',
  'GAME_OVER'
];

/**
 * Phases de nuit silencieuses
 */
const SILENT_NIGHT_PHASES = new Set([
  'NIGHT_CHAMELEON',
  'NIGHT_DOCTOR',
  'NIGHT_RADAR'
]);

/**
 * Phases restreintes par rôle
 */
const ROLE_RESTRICTED_PHASES = {
  'NIGHT_SABOTEURS': ['saboteur'],
  'NIGHT_AI_AGENT': ['ai_agent'],
  'NIGHT_AI_EXCHANGE': ['ai_agent'], // V9: géré spécialement
  'NIGHT_CHAMELEON': ['chameleon'],
  'NIGHT_RADAR': ['radar_officer'],
  'NIGHT_DOCTOR': ['doctor']
};

/**
 * Phases caméra OFF
 */
const CAMERA_OFF_PHASES = [
  'DAY_VOTE',
  'DAY_TIEBREAK',
  'NIGHT_START',
  'REVENGE'
];

/**
 * Permissions par joueur
 */
function getPlayerVideoPermissions(phase, player, allPlayers = new Map()) {
  // 🚫 Joueur déconnecté
  if (player.status === 'left') {
    return { video: false, audio: false, reason: 'Joueur déconnecté' };
  }

  // ☠️ Joueur mort
  if (player.status === 'dead') {
    if (['GAME_OVER','END_STATS','END_STATS_OUTRO','END'].includes(phase)) {
      return { video: true, audio: true, reason: 'Fin de partie (morts autorisés)' };
    }
    return { video: false, audio: false, reason: 'Joueur éliminé' };
  }

  // 🎥 Caméra OFF
  if (CAMERA_OFF_PHASES.includes(phase)) {
    return { video: false, audio: true, reason: `Phase ${phase}: caméra OFF` };
  }

  // 🌍 Phase publique
  if (FULL_VIDEO_PHASES.includes(phase)) {
    return { video: true, audio: true, reason: 'Phase publique' };
  }

  // 🔒 Phases restreintes
  if (ROLE_RESTRICTED_PHASES[phase]) {
    if (SILENT_NIGHT_PHASES.has(phase)) {
      return { video: false, audio: false, reason: 'Nuit silencieuse' };
    }

    // 🤖 IA EXCHANGE (IA + lié uniquement)
    if (phase === 'NIGHT_AI_EXCHANGE') {
      const ia = Array.from(allPlayers.values()).find(
        p => p.role === 'ai_agent' && p.status === 'alive'
      );
      if (ia && (player.playerId === ia.playerId || player.playerId === ia.linkedTo)) {
        return { video: true, audio: true, reason: 'Échange IA privé' };
      }
      return { video: false, audio: false, reason: 'Canal IA privé' };
    }

    // 🤖 IA AGENT
    if (phase === 'NIGHT_AI_AGENT') {
      if (player.linkedTo) {
        const partner = allPlayers.get(player.linkedTo);
        if (partner && partner.status === 'alive') {
          return { video: true, audio: true, reason: 'Duo IA + lié' };
        }
      }
      return { video: false, audio: false, reason: 'Canal IA indisponible' };
    }

    const allowed = ROLE_RESTRICTED_PHASES[phase].includes(player.role);
    return {
      video: allowed,
      audio: allowed,
      reason: allowed ? `Canal privé ${player.role}` : 'Phase privée'
    };
  }

  return { video: true, audio: true, reason: 'Phase standard' };
}

/**
 * Permissions de room (API V8.1)
 */
function calculateRoomPermissions(phase, players) {
  const permissions = {};
  for (const [id, player] of players.entries()) {
    permissions[id] = getPlayerVideoPermissions(phase, player, players);
  }
  return permissions;
}

/**
 * Message UI
 */
function getPhaseVideoMessage(phase) {
  if (CAMERA_OFF_PHASES.includes(phase)) return "📹 Caméras désactivées pour cette phase";
  if (SILENT_NIGHT_PHASES.has(phase)) return "😴 Nuit silencieuse (caméra + micro OFF)";
  if (ROLE_RESTRICTED_PHASES[phase]) return "📹 Caméras actives uniquement pour certains rôles";
  if (FULL_VIDEO_PHASES.includes(phase)) return "📹 Caméras et micros actifs pour tous";
  return "📹 Permissions vidéo standards";
}

/**
 * Optimisation updates
 */
function shouldUpdatePermissions(oldPhase, newPhase) {
  if (oldPhase === newPhase) return false;
  return getPhaseCategory(oldPhase) !== getPhaseCategory(newPhase);
}

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