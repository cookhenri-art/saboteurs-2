/**
 * Rate limiter pour Socket.IO
 * Empêche le spam et les double-actions
 */

const logger = require('./logger');

class RateLimiter {
  constructor() {
    // Map: socketId -> Map(event -> array of timestamps)
    this.history = new Map();
    
    // Limites par événement (nombre max / fenêtre temporelle en ms)
    this.limits = {
      joinRoom: { max: 3, window: 10000 },        // 3 tentatives / 10s
      createRoom: { max: 5, window: 60000 },      // 5 créations / 1min
      ack: { max: 30, window: 5000 },             // 30 acks / 5s (pour éviter spam clics)
      vote: { max: 10, window: 3000 },            // 10 votes / 3s
      action: { max: 10, window: 3000 },          // 10 actions / 3s
      candidacy: { max: 5, window: 5000 },        // 5 candidatures / 5s
      pickRole: { max: 10, window: 5000 },        // 10 sélections rôle / 5s
      heartbeat: { max: 120, window: 60000 },     // 120 heartbeats / 1min (2/s max)
      forceAdvance: { max: 3, window: 10000 }     // 3 force advance / 10s
    };
  }
  
  /**
   * Vérifie si une action est permise
   * @returns {boolean} true si autorisé, false si rate limited
   */
  check(socketId, event, playerId = null) {
    const limit = this.limits[event];
    if (!limit) return true; // Pas de limite définie = autorisé
    
    const now = Date.now();
    
    // Initialiser l'historique pour ce socket si nécessaire
    if (!this.history.has(socketId)) {
      this.history.set(socketId, new Map());
    }
    
    const socketHistory = this.history.get(socketId);
    
    // Récupérer l'historique pour cet événement
    if (!socketHistory.has(event)) {
      socketHistory.set(event, []);
    }
    
    const eventHistory = socketHistory.get(event);
    
    // Nettoyer les timestamps trop anciens
    const cutoff = now - limit.window;
    while (eventHistory.length > 0 && eventHistory[0] < cutoff) {
      eventHistory.shift();
    }
    
    // Vérifier si la limite est atteinte
    if (eventHistory.length >= limit.max) {
      logger.rateLimit(event, socketId, playerId);
      return false;
    }
    
    // Enregistrer ce nouvel événement
    eventHistory.push(now);
    return true;
  }
  
  /**
   * Nettoie l'historique d'un socket (appelé à la déconnexion)
   */
  cleanup(socketId) {
    this.history.delete(socketId);
  }
  
  /**
   * Garbage collection périodique (nettoie les vieux historiques)
   */
  gc() {
    const now = Date.now();
    const maxWindow = Math.max(...Object.values(this.limits).map(l => l.window));
    const cutoff = now - maxWindow * 2; // Garder 2x la fenêtre max
    
    for (const [socketId, socketHistory] of this.history.entries()) {
      for (const [event, timestamps] of socketHistory.entries()) {
        // Nettoyer les timestamps trop anciens
        const filtered = timestamps.filter(t => t > cutoff);
        if (filtered.length === 0) {
          socketHistory.delete(event);
        } else {
          socketHistory.set(event, filtered);
        }
      }
      
      // Si plus aucun événement pour ce socket, le supprimer
      if (socketHistory.size === 0) {
        this.history.delete(socketId);
      }
    }
  }
}

module.exports = RateLimiter;
