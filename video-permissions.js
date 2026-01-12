/**
 * VIDEO PERMISSIONS – V9.0.2 SAFE
 * Preserves V8.1 API (calculateRoomPermissions)
 */

// Public video phases
const FULL_VIDEO_PHASES = new Set([
  'ROLE_REVEAL',
  'DAY_WAKE',
  'DAY_DEBATE',
  'DAY_RESULTS',
  'NIGHT_RESULTS',
  'GAME_OVER',
  'END_STATS',
  'END_STATS_OUTRO',
  'END'
]);

// Silent phases
const SILENT_NIGHT_PHASES = new Set([
  'NIGHT_START',
  'NIGHT_RADAR',
  'NIGHT_CHAMELEON',
  'STATION_SLEEP'
]);

// End phases where dead players can talk
const END_TALK_PHASES = new Set([
  'GAME_OVER',
  'END_STATS',
  'END_STATS_OUTRO',
  'END'
]);

// Restricted by role
const ROLE_RESTRICTED_PHASES = {
  'NIGHT_SABOTEURS': ['saboteur'],
  'NIGHT_AI_AGENT': ['ai_agent'],
  'NIGHT_AI_EXCHANGE': ['ai_agent'], // handled specially
  'NIGHT_DOCTOR': ['doctor'],
  'NIGHT_RADAR': ['radar'],
  'NIGHT_CHAMELEON': ['chameleon']
};

function getPlayerVideoPermissions({ phase, player, allPlayers }) {
  if (!phase || !player) {
    return { video: false, audio: false, reason: 'Invalid state' };
  }

  if (player.status === 'left') {
    return { video: false, audio: false, reason: 'Player left' };
  }

  if (player.status === 'dead') {
    if (END_TALK_PHASES.has(phase)) {
      return { video: true, audio: true, reason: 'Endgame discussion (dead allowed)' };
    }
    return { video: false, audio: false, reason: 'Player dead' };
  }

  if (FULL_VIDEO_PHASES.has(phase)) {
    return { video: true, audio: true, reason: 'Public phase' };
  }

  if (SILENT_NIGHT_PHASES.has(phase)) {
    return { video: false, audio: false, reason: 'Silent night' };
  }

  if (ROLE_RESTRICTED_PHASES[phase]) {
    if (phase === 'NIGHT_AI_EXCHANGE') {
      const ia = Array.from(allPlayers.values()).find(
        p => p.role === 'ai_agent' && p.status === 'alive'
      );
      if (!ia || !ia.linkedTo) {
        return { video: false, audio: false, reason: 'No AI link' };
      }
      const partnerId = ia.linkedTo;
      const inDuo = player.playerId === ia.playerId || player.playerId === partnerId;
      return inDuo
        ? { video: true, audio: true, reason: 'AI exchange' }
        : { video: false, audio: false, reason: 'Private AI exchange' };
    }

    if (ROLE_RESTRICTED_PHASES[phase].includes(player.role)) {
      return { video: true, audio: true, reason: 'Role allowed' };
    }
    return { video: false, audio: false, reason: 'Private phase' };
  }

  return { video: false, audio: false, reason: 'Default off' };
}

// 🔒 API V8.1 preserved
function calculateRoomPermissions(phase, playersMap) {
  const permissions = {};
  for (const player of playersMap.values()) {
    permissions[player.playerId] = getPlayerVideoPermissions({
      phase,
      player,
      allPlayers: playersMap
    });
  }
  return permissions;
}

module.exports = {
  getPlayerVideoPermissions,
  calculateRoomPermissions
};