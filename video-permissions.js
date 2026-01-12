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
  'END_STATS',         // ✅ Fallback
  'END'
,
  'GAME_OVER'
];

/**
 * Phases où SEULS certains rôles peuvent avoir caméra + micro
 * Format: { phase: [roles autorisés] }
 */
/**
 * Phases de nuit silencieuses: personne ne parle ni n'apparaît en vidéo
 * (évite d'identifier les rôles: chaméléon, docteur, radar...)
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
    // ✅ Nuits silencieuses: tout le monde OFF (même le rôle actif)
    if (SILENT_NIGHT_PHASES.has(phase)) {
      return {
        video: false,
        audio: false,
        reason: 'Nuit silencieuse'
      };
    }

    // ✅ NIGHT_AI_AGENT strict: uniquement le duo (IA + lié vivant) se voit / s'entend
    if (phase === 'NIGHT_AI_AGENT') {
      if (player.linkedTo) {
        const partner = allPlayers.get(player.linkedTo);
        if (partner && partner.status === 'alive') {
          return {
            video: true,
            audio: true,
            reason: 'Duo IA + lié (canal privé)'
          };
        }
      }
      // Sinon: personne ne parle / n'apparaît (y compris l'IA si pas de duo valide)
      return {
        video: false,
        audio: false,
        reason: 'Canal IA indisponible'
      };
    }

    // ✅ Autres phases restreintes par rôle (ex: saboteurs)
    const allowedRoles = ROLE_RESTRICTED_PHASES[phase];
    const hasPermission = allowedRoles.includes(player.role);

    return {
      video: hasPermission,
      audio: hasPermission,
      reason: hasPermission ? `Canal privé: ${player.role}` : 'Phase privée'
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
function calculateRoomPermissions(phase, players, roomMeta = {}) {
  // roomMeta: { roomCode, night } - optionnel
  const permissions = {};
  const night = roomMeta.night || 1;

  // Helper: set perms for a player
  const setP = (pid, opts) => {
    permissions[pid] = Object.assign({
      canSeeVideo: false,
      canSendVideo: false,
      canSendAudio: false,
      canSeeAudio: false,
      channel: "main" // main | sabo | ai
    }, opts || {});
  };

  // Build role maps
  const all = Array.from(players.values ? players.values() : players);
  const alive = all.filter(p => p && p.status === "alive");
  const saboteurs = alive.filter(p => p.role === "saboteur").map(p => p.playerId);
  const ai = alive.find(p => p.role === "ai_agent")?.playerId || null;

  // Default: everyone in main
  for (const p of all) {
    if (!p) continue;
    setP(p.playerId, { channel: "main" });
  }

  // FULL phases: everyone cam+mic ON (main)
  if (FULL_VIDEO_PHASES.includes(phase)) {
    for (const p of all) {
      if (!p) continue;
      setP(p.playerId, {
        canSeeVideo: true,
        canSendVideo: true,
        canSendAudio: true,
        canSeeAudio: true,
        channel: "main"
      });
    }
    return permissions;
  }

  // SILENT phases: everyone OFF
  if (NO_VIDEO_PHASES.includes(phase)) {
    for (const p of all) {
      if (!p) continue;
      setP(p.playerId, {
        canSeeVideo: false,
        canSendVideo: false,
        canSendAudio: false,
        canSeeAudio: false,
        channel: "main"
      });
    }
    return permissions;
  }

  // Phase spécifique: saboteurs -> room privée, les autres totalement OFF
  if (phase === "NIGHT_SABOTEURS") {
    for (const p of all) {
      if (!p) continue;
      const isSabo = p.role === "saboteur" && p.status === "alive";
      if (isSabo) {
        setP(p.playerId, {
          canSeeVideo: true,
          canSendVideo: true,
          canSendAudio: true,
          canSeeAudio: true,
          channel: "sabo",
          roomSuffix: `${roomMeta.roomCode || ""}-sabo`.replace(/^-/,"")
        });
      } else {
        setP(p.playerId, {
          canSeeVideo: false,
          canSendVideo: false,
          canSendAudio: false,
          canSeeAudio: false,
          channel: "main"
        });
      }
    }
    return permissions;
  }

  // Phase IA choix: tout le monde silencieux (IA agit via UI)
  if (phase === "NIGHT_AI_AGENT") {
    for (const p of all) {
      if (!p) continue;
      setP(p.playerId, {
        canSeeVideo: false,
        canSendVideo: false,
        canSendAudio: false,
        canSeeAudio: false,
        channel: "main"
      });
    }
    return permissions;
  }

  // Phase IA échange (privé): IA + partenaire -> room AI, autres OFF.
  if (phase === "NIGHT_AI_EXCHANGE") {
    const partnerId = roomMeta.aiPartnerId || null;
    const aiId = ai;
    for (const p of all) {
      if (!p) continue;
      const isPair = p.status === "alive" && (p.playerId === aiId || p.playerId === partnerId);
      if (isPair) {
        setP(p.playerId, {
          canSeeVideo: true,
          canSendVideo: true,
          canSendAudio: true,
          canSeeAudio: true,
          channel: "ai",
          roomSuffix: `${roomMeta.roomCode || ""}-ai-${night}`.replace(/^-/,"")
        });
      } else {
        // Si le partenaire est un saboteur, les autres saboteurs restent sur leur room saboteurs (mais muets ici)
        setP(p.playerId, {
          canSeeVideo: false,
          canSendVideo: false,
          canSendAudio: false,
          canSeeAudio: false,
          channel: (p.role === "saboteur" && p.status === "alive") ? "sabo" : "main"
        });
      }
    }
    return permissions;
  }

  // Phase radar / doctor / chameleon : silencieux total (évite identification)
  if (["NIGHT_RADAR","NIGHT_DOCTOR","NIGHT_CHAMELEON"].includes(phase)) {
    for (const p of all) {
      if (!p) continue;
      setP(p.playerId, {
        canSeeVideo: false,
        canSendVideo: false,
        canSendAudio: false,
        canSeeAudio: false,
        channel: (p.role === "saboteur" && p.status === "alive") ? "sabo" : "main"
      });
    }
    return permissions;
  }

  // Default fallback: cam/mic off
  for (const p of all) {
    if (!p) continue;
    setP(p.playerId, {
      canSeeVideo: false,
      canSendVideo: false,
      canSendAudio: false,
      canSeeAudio: false,
      channel: "main"
    });
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
    return "😴 Nuit silencieuse (caméra + micro OFF)";
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
