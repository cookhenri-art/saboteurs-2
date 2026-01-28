// ============================================================================
// MATCHMAKING CLIENT - V35 NEW UI
// Gestion des rooms publiques et matchmaking
// ============================================================================

const Matchmaking = {
  // État
  publicRooms: [],
  stats: { chatRooms: 0, videoRooms: 0, totalPlayers: 0 },
  refreshInterval: null,
  userAccountType: 'guest',
  initialized: false,
  
  // ============================================================================
  // INITIALISATION
  // ============================================================================
  
  init() {
    if (this.initialized) return;
    this.initialized = true;
    
    this.startAutoRefresh();
    this.refreshRooms();
    this.refreshStats();
    console.log('[Matchmaking] Initialized');
  },
  
  // ============================================================================
  // API CALLS
  // ============================================================================
  
  async refreshRooms() {
    try {
      const token = localStorage.getItem('saboteur_token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      
      const response = await fetch('/api/rooms/public', { headers });
      const data = await response.json();
      
      if (data.ok) {
        this.publicRooms = data.rooms;
        this.userAccountType = data.userAccountType;
        this.renderRoomsList();
        this.updateRoomsCount();
      }
    } catch (e) {
      console.error('[Matchmaking] Error refreshing rooms:', e);
    }
  },
  
  async refreshStats() {
    try {
      const response = await fetch('/api/rooms/stats');
      const data = await response.json();
      
      if (data.ok) {
        this.stats = data;
        this.renderStats();
      }
    } catch (e) {
      console.error('[Matchmaking] Error refreshing stats:', e);
    }
  },
  
  async joinRandomRoom(roomType = 'any', themeId = null) {
    try {
      const token = localStorage.getItem('saboteur_token');
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      };
      
      const response = await fetch('/api/rooms/join-random', {
        method: 'POST',
        headers,
        body: JSON.stringify({ roomType, themeId })
      });
      
      const data = await response.json();
      
      if (data.ok) {
        this.joinRoom(data.roomCode);
      } else {
        if (data.error === 'noRoomAvailable') {
          this.showNotification(this.t('noRoomAvailable'), 'info');
        } else {
          this.showNotification(data.message || 'Erreur', 'error');
        }
      }
    } catch (e) {
      console.error('[Matchmaking] Error joining random room:', e);
      this.showNotification('Erreur de connexion', 'error');
    }
  },
  
  // ============================================================================
  // ROOM ACTIONS
  // ============================================================================
  
  joinRoom(roomCode) {
    const theme = localStorage.getItem('saboteur_theme') || 'default';
    window.location.href = `/game.html?room=${roomCode}&theme=${theme}`;
  },
  
  // ============================================================================
  // UI RENDERING
  // ============================================================================
  
  updateRoomsCount() {
    const countEl = document.getElementById('roomsCount');
    if (countEl) {
      countEl.textContent = `(${this.publicRooms.length})`;
    }
  },
  
  renderRoomsList() {
    const container = document.getElementById('publicRoomsList');
    if (!container) return;
    
    if (this.publicRooms.length === 0) {
      container.innerHTML = `
        <div class="no-rooms-message">
          <p>😴 ${this.t('noRooms')}</p>
          <p style="font-size:0.9em;opacity:0.7;">${this.t('beFirst')}</p>
        </div>
      `;
      return;
    }
    
    const roomsHTML = this.publicRooms.map(room => this.renderRoomCard(room)).join('');
    container.innerHTML = roomsHTML;
  },
  
  renderRoomCard(room) {
    const isFull = room.playerCount >= room.maxPlayers;
    const roomTypeIcon = room.roomType === 'chat' ? '💬' : '🎥';
    const roomTypeLabel = room.roomType === 'chat' ? 'Chat' : 'Vidéo';
    
    // Commentaire optionnel
    const commentHTML = room.comment ? `
      <div class="room-comment">"${this.escapeHtml(room.comment)}"</div>
    ` : '';
    
    return `
      <div class="room-card ${isFull ? 'room-full' : ''}" data-room-code="${room.code}">
        <div class="room-card-top">
          <div class="room-card-left">
            <span class="room-theme-icon">${room.themeIcon || '🎮'}</span>
            <div class="room-info">
              <div class="room-name">${this.escapeHtml(room.name)}</div>
              <div class="room-meta">
                <span class="room-type-badge ${room.roomType}">${roomTypeIcon} ${roomTypeLabel}</span>
                <span>• ${this.t('host')}: ${this.escapeHtml(room.hostName)}</span>
              </div>
            </div>
          </div>
          <div class="room-card-right">
            <span class="room-players ${isFull ? 'full' : ''}">👥 ${room.playerCount}/${room.maxPlayers}</span>
            <button onclick="Matchmaking.joinRoom('${room.code}')" class="btn-join-room" ${isFull ? 'disabled' : ''}>
              ${isFull ? this.t('full') : this.t('join')}
            </button>
          </div>
        </div>
        ${commentHTML}
      </div>
    `;
  },
  
  renderStats() {
    const container = document.getElementById('matchmakingStats');
    if (!container) return;
    
    container.innerHTML = `
      <span>🎥 ${this.stats.videoRooms} ${this.t('videoRooms')}</span>
      <span>💬 ${this.stats.chatRooms} ${this.t('chatRooms')}</span>
      <span>👥 ${this.stats.totalPlayers} ${this.t('playersOnline')}</span>
    `;
  },
  
  // ============================================================================
  // UTILITIES
  // ============================================================================
  
  startAutoRefresh() {
    // Rafraîchir toutes les 10 secondes
    this.refreshInterval = setInterval(() => {
      this.refreshRooms();
      this.refreshStats();
    }, 10000);
  },
  
  stopAutoRefresh() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  },
  
  isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) 
      || window.innerWidth <= 768;
  },
  
  showNotification(message, type = 'info') {
    // Utiliser showError/showSuccess existants si disponibles
    if (type === 'error' && typeof showError === 'function') {
      showError(message);
      return;
    }
    if (type === 'success' && typeof showSuccess === 'function') {
      showSuccess(message);
      return;
    }
    
    // Fallback: toast simple
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      padding: 12px 24px;
      border-radius: 8px;
      background: ${type === 'error' ? '#ff4444' : type === 'warning' ? '#ffaa00' : '#00aaff'};
      color: white;
      z-index: 10000;
      font-weight: bold;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  },
  
  escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  },
  
  t(key) {
    // Utiliser le système de traduction TRANSLATIONS existant
    if (typeof TRANSLATIONS !== 'undefined' && typeof getCurrentLanguage === 'function') {
      const lang = getCurrentLanguage();
      const val = TRANSLATIONS.index?.matchmaking?.[key]?.[lang] || 
                  TRANSLATIONS.index?.matchmaking?.[key]?.fr;
      if (val) return val;
    }
    
    // Fallback français
    const fallbacks = {
      title: '🌐 Rooms publiques',
      publicRoomsTitle: '🌐 ROOMS PUBLIQUES',
      playPublic: '🌐 JOUER EN ROOM PUBLIQUE',
      privateGame: 'Partie privée avec code',
      back: 'Retour',
      createYourRoom: '➕ Créer ta room',
      videoRoom: 'Vidéo',
      chatRoom: 'Chat only',
      commentPlaceholder: 'Message pour les joueurs (optionnel)',
      createMyRoom: '🚀 Créer ma room',
      waitingRooms: '📋 Rooms en attente',
      loading: 'Chargement...',
      noRooms: 'Aucune room publique disponible',
      beFirst: 'Sois le premier à en créer une !',
      host: 'Hôte',
      join: 'Rejoindre',
      full: 'Pleine',
      videoRooms: 'rooms vidéo',
      chatRooms: 'rooms chat',
      playersOnline: 'joueurs en ligne',
      noRoomAvailable: 'Aucune room disponible. Crée la tienne !',
      gameStarting: 'La partie va commencer !',
      roomFullStarting: 'La room est pleine',
      needsVerified: 'Compte vérifié requis',
      newHost: 'est le nouvel hôte'
    };
    
    return fallbacks[key] || key;
  }
};

// Export
window.Matchmaking = Matchmaking;
