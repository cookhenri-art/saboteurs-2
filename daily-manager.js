/**
 * Daily.co Video Manager
 * Gère les rooms vidéo pour Infiltration Spatiale
 */

const logger = require('./logger');

class DailyManager {
  constructor() {
    this.apiKey = process.env.DAILY_API_KEY || null;
    this.apiUrl = 'https://api.daily.co/v1';
    this.rooms = new Map(); // roomCode -> { dailyRoomName, dailyRoomUrl, expiresAt, isFreeRoom }
    this.pendingCreates = new Map(); // roomCode -> Promise<{roomUrl, roomName, isFreeRoom, cached}>
  }

  /**
   * A) Anti "race condition" : une seule création à la fois par roomCode.
   * Retourne une room existante (cache mémoire) ou la crée.
   * @param {string} roomCode
   * @returns {Promise<{roomUrl: string, roomName: string, isFreeRoom: boolean, cached: boolean}>}
   */
  async getOrCreateVideoRoom(roomCode) {
    const cached = this.getVideoRoom(roomCode);
    if (cached) {
      return {
        roomUrl: cached.dailyRoomUrl,
        roomName: cached.dailyRoomName,
        isFreeRoom: !!cached.isFreeRoom,
        cached: true
      };
    }

    const pending = this.pendingCreates.get(roomCode);
    if (pending) return await pending;

    const p = (async () => {
      const created = await this.createVideoRoom(roomCode);
      return { ...created, cached: false };
    })().finally(() => {
      this.pendingCreates.delete(roomCode);
    });

    this.pendingCreates.set(roomCode, p);
    return await p;
  }

  /**
   * Crée une room Daily.co pour une partie
   * @param {string} roomCode - Code de la room du jeu
   * @returns {Promise<{roomUrl: string, roomName: string, isFreeRoom: boolean}>}
   */
  async createVideoRoom(roomCode) {
    try {
      // En mode FREE (sans API key), on utilise les rooms temporaires
      if (!this.apiKey) {
        logger.info(`[Daily] Creating FREE temporary room for ${roomCode}`);

        // NOTE: ce mode est "best effort" : sans API key, la gestion fine des rooms est limitée.
        const roomName = `infiltration-${roomCode}-${Date.now()}`;
        const roomUrl = `https://${roomName}.daily.co`;

        const roomData = {
          dailyRoomName: roomName,
          dailyRoomUrl: roomUrl,
          expiresAt: Date.now() + (4 * 60 * 60 * 1000), // 4 heures
          isFreeRoom: true
        };

        this.rooms.set(roomCode, roomData);

        logger.info(`[Daily] FREE room created: ${roomUrl}`);

        return {
          roomUrl,
          roomName,
          isFreeRoom: true
        };
      }

      // Mode avec API key (pour configuration avancée)
      const payload = {
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
      };

      const response = await fetch(`${this.apiUrl}/rooms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(payload)
      });

      // B) Log complet de l'erreur Daily (status + body) pour comprendre les 400
      if (!response.ok) {
        const bodyText = await response.text().catch(() => "");

        // C) Si la room existe déjà (après redéploiement / cache perdu / appels concurrents),
        // tenter de la récupérer via GET /rooms/:name au lieu de planter.
        const recovered = await this._tryRecoverExistingRoom(roomCode, response.status, bodyText);
        if (recovered) return recovered;

        throw new Error(`Daily API error: ${response.status} - ${bodyText || response.statusText || 'Unknown error'}`);
      }

      const data = await response.json();

      const roomData = {
        dailyRoomName: data.name,
        dailyRoomUrl: data.url,
        expiresAt: Date.now() + (4 * 60 * 60 * 1000),
        isFreeRoom: false
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
   * C) Récupérer une room existante si la création échoue car elle existe déjà.
   * @private
   * @param {string} roomCode
   * @param {number} status
   * @param {string} bodyText
   * @returns {Promise<{roomUrl: string, roomName: string, isFreeRoom: boolean} | null>}
   */
  async _tryRecoverExistingRoom(roomCode, status, bodyText) {
    // Sans API key, on ne peut pas récupérer proprement une room existante via l'API.
    if (!this.apiKey) return null;

    const msg = String(bodyText || '').toLowerCase();
    const looksLikeExists =
      status === 409 ||
      (status === 400 && (
        msg.includes('already') && msg.includes('exist')
      )) ||
      (status === 400 && msg.includes('already exists')) ||
      (status === 400 && msg.includes('name') && (msg.includes('taken') || msg.includes('exists'))) ||
      (status === 400 && msg.includes('room') && msg.includes('exist'));

    if (!looksLikeExists) return null;

    const roomName = `infiltration-${roomCode}`;

    try {
      const getResp = await fetch(`${this.apiUrl}/rooms/${encodeURIComponent(roomName)}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      if (!getResp.ok) {
        const getBody = await getResp.text().catch(() => "");
        logger.warn(`[Daily] Failed to fetch existing room ${roomName}: ${getResp.status} - ${getBody}`);
        return null;
      }

      const data = await getResp.json();

      const roomData = {
        dailyRoomName: data.name,
        dailyRoomUrl: data.url,
        expiresAt: Date.now() + (4 * 60 * 60 * 1000),
        isFreeRoom: false
      };

      this.rooms.set(roomCode, roomData);

      logger.info(`[Daily] Reusing existing room via API: ${data.url}`);

      return {
        roomUrl: data.url,
        roomName: data.name,
        isFreeRoom: false
      };
    } catch (e) {
      logger.warn(`[Daily] Error recovering existing room ${roomName}: ${e?.message || e}`);
      return null;
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
      // Si on a une API key et que ce n'est pas une room "free", supprimer via l'API
      if (this.apiKey && !room.isFreeRoom) {
        await fetch(`${this.apiUrl}/rooms/${encodeURIComponent(room.dailyRoomName)}`, {
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
