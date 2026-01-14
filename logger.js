/**
 * Logger structuré JSON pour Infiltration Spatiale
 * Tous les événements sont loggés en JSON (une ligne par événement)
 * pour exploitation sur Render et debugging.
 */

const BUILD_ID = process.env.BUILD_ID || "infiltration-spatiale-v26";

/**
 * Écrit un log structuré JSON sur stdout
 * @param {string} level - debug, info, warn, error
 * @param {string} event - nom de l'événement (join, leave, phase_start, etc.)
 * @param {object} payload - données contextuelles
 */
function log(level, event, payload = {}) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    event,
    build: BUILD_ID,
    ...payload
  };
  
  // Écrire en JSON compact (une ligne)
  console.log(JSON.stringify(entry));
}

// Méthodes de convenance
const logger = {
  debug: (event, payload) => log("debug", event, payload),
  info: (event, payload) => log("info", event, payload),
  warn: (event, payload) => log("warn", event, payload),
  error: (event, payload) => log("error", event, payload),
  
  // Événements spécifiques du jeu
  join: (roomCode, playerId, playerName, socketId) => 
    log("info", "join", { roomCode, playerId, playerName, socketId }),
  
  leave: (roomCode, playerId, playerName, reason) => 
    log("info", "leave", { roomCode, playerId, playerName, reason }),
  
  reject: (roomCode, reason, details = {}) => 
    log("warn", "reject", { roomCode, reason, ...details }),
  
  reconnect: (roomCode, playerId, playerName, oldSocketId, newSocketId) => 
    log("info", "reconnect", { roomCode, playerId, playerName, oldSocketId, newSocketId }),
  
  phaseStart: (roomCode, phase, day, night, playersAlive) => 
    log("info", "phase_start", { roomCode, phase, day, night, playersAlive }),
  
  phaseAck: (roomCode, phase, playerId, ackProgress) => 
    log("debug", "phase_ack", { roomCode, phase, playerId, ackProgress }),
  
  action: (roomCode, phase, playerId, actionType, target = null) => 
    log("info", "action", { roomCode, phase, playerId, actionType, target }),
  
  vote: (roomCode, playerId, votedFor) => 
    log("info", "vote", { roomCode, playerId, votedFor }),
  
  resolveNight: (roomCode, night, saboteurTarget, doctorAction, deaths) => 
    log("info", "resolve_night", { roomCode, night, saboteurTarget, doctorAction, deaths }),
  
  endGame: (roomCode, winner, duration, playerCount) => 
    log("info", "end_game", { roomCode, winner, duration, playerCount }),
  
  forceAdvance: (roomCode, phase, hostId, pendingPlayers) => 
    log("warn", "force_advance", { roomCode, phase, hostId, pendingPlayers }),
  
  rateLimit: (event, socketId, playerId = null) => 
    log("warn", "rate_limit", { event, socketId, playerId }),
  
  heartbeat: (playerId, roomCode, lastSeen) => 
    log("debug", "heartbeat", { playerId, roomCode, lastSeen })
};

module.exports = logger;
