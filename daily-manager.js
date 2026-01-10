/**
 * Daily.co Video Manager
 * Gère les rooms vidéo pour Infiltration Spatiale
 */

const logger = require('./logger');

class DailyManager {
  constructor() {
    this.apiKey = process.env.DAILY_API_KEY || null;
    this.apiUrl = 'https://api.daily.co/v1';
    this.rooms = new Map(); // roomCode -> { dailyRoomName, dailyRoomUrl, expiresAt }
  }

  /**
   * Crée une room Daily.co pour une partie
   * @param {string} roomCode - Code de la room du jeu
   * @returns {Promise<{roomUrl: string, roomName: string}>}
   */
  async createVideoRoom(roomCode) {
    try {
      // En mode FREE (sans API key), on utilise les rooms temporaires
      if (!this.apiKey) {
        logger.info(`[Daily] Creating FREE temporary room for ${roomCode}`);
        
        // Les rooms temporaires Daily.co sont au format: https://DOMAIN.daily.co/ROOM_NAME
        // On utilise le domaine public de Daily
        const roomName = `infiltration-${roomCode}-${Date.now()}`;
        const roomUrl = `https://${roomName}.daily.co`;
        
        const roomData = {
          dailyRoomName: roomName,
          dailyRoomUrl: roomUrl,
          expiresAt: Date.now() + (4 * 60 * 60 * 1000) // 4 heures
        };
        
        this.rooms.set(roomCode, roomData);
        
        logger.info(`[Daily] FREE room created: ${roomUrl}`);
        
        return {
          roomUrl: roomUrl,
          roomName: roomName,
          isFreeRoom: true
        };
      }

      // Mode avec API key (pour configuration avancée)
      const response = await fetch(`${this.apiUrl}/rooms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          name: `infiltration-${roomCode}`,
          privacy: 'private',
          properties: {
            max_participants: 13,
            enable_chat: false,
            enable_knocking: false,
            enable_screenshare: false,
            enable_recording: false,
            start_video_off: false,
            start_audio_off: false,
            exp: Math.floor(Date.now() / 1000) + (4 * 60 * 60) // 4 heures
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Daily API error: ${response.status}`);
      }

      const data = await response.json();
      
      const roomData = {
        dailyRoomName: data.name,
        dailyRoomUrl: data.url,
        expiresAt: Date.now() + (4 * 60 * 60 * 1000)
      };
      
      this.rooms.set(roomCode, roomData);
      
      logger.info(`[Daily] Room created with API: ${data.url}`);
      
      return {
        roomUrl: data.url,
        roomName: data.name,
        isFreeRoom: false
      };
      
    } catch (error) {
      logger.error('[Daily] Error creating room:', error);
      throw error;
    }
  }

  /**
   * Récupère les infos d'une room vidéo existante
   * @param {string} roomCode - Code de la room du jeu
   * @returns {object|null}
   */
  getVideoRoom(roomCode) {
    const room = this.rooms.get(roomCode);
    if (!room) return null;
    
    // Vérifier si la room n'a pas expiré
    if (Date.now() > room.expiresAt) {
      this.rooms.delete(roomCode);
      return null;
    }
    
    return room;
  }

  /**
   * Supprime une room vidéo
   * @param {string} roomCode - Code de la room du jeu
   */
  async deleteVideoRoom(roomCode) {
    const room = this.rooms.get(roomCode);
    if (!room) return;

    try {
      // Si on a une API key et que ce n'est pas une free room, supprimer via l'API
      if (this.apiKey && !room.dailyRoomName.includes('.daily.co')) {
        await fetch(`${this.apiUrl}/rooms/${room.dailyRoomName}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`
          }
        });
        logger.info(`[Daily] Room deleted via API: ${room.dailyRoomName}`);
      }
      
      this.rooms.delete(roomCode);
      logger.info(`[Daily] Room removed from cache: ${roomCode}`);
      
    } catch (error) {
      logger.error('[Daily] Error deleting room:', error);
      // Supprimer quand même du cache local
      this.rooms.delete(roomCode);
    }
  }

  /**
   * Nettoie les rooms expirées
   */
  cleanupExpiredRooms() {
    const now = Date.now();
    for (const [roomCode, room] of this.rooms.entries()) {
      if (now > room.expiresAt) {
        this.deleteVideoRoom(roomCode);
      }
    }
  }
}

// Instance singleton
const dailyManager = new DailyManager();

// Nettoyage automatique toutes les heures
setInterval(() => {
  dailyManager.cleanupExpiredRooms();
}, 60 * 60 * 1000);

module.exports = dailyManager;
