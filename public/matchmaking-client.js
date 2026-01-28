// ============================================================================
// MATCHMAKING CLIENT - V35
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
  
  createPublicRoom(options = {}) {
    const {
      roomName = '',
      themeId = 'default',
      roomType = 'video'
    } = options;
    
    const theme = localStorage.getItem('saboteur_theme') || themeId;
    const params = new URLSearchParams({
      theme,
      public: 'true',
      roomName: roomName || '',
      roomType,
      isMobile: this.isMobile() ? 'true' : 'false'
    });
    
    window.location.href = `/game.html?${params.toString()}`;
  },
  
  // ============================================================================
  // UI RENDERING
  // ============================================================================
  
  renderRoomsList() {
    const container = document.getElementById('publicRoomsList');
    if (!container) return;
    
    if (this.publicRooms.length === 0) {
      container.innerHTML = `
        <div class="no-rooms-message">
          <p>${this.t('noRooms')}</p>
          <button onclick="Matchmaking.showCreatePublicRoomModal()" class="btn-quick-join btn-create" style="margin-top:10px;">
            ${this.t('createPublic')}
          </button>
        </div>
      `;
      return;
    }
    
    const roomsHTML = this.publicRooms.map(room => this.renderRoomCard(room)).join('');
    container.innerHTML = `<div class="rooms-grid">${roomsHTML}</div>`;
  },
  
  renderRoomCard(room) {
    const isFull = room.playerCount >= room.maxPlayers;
    const roomTypeIcon = room.roomType === 'chat' ? '💬' : '🎥';
    
    return `
      <div class="room-card ${isFull ? 'room-full' : ''}" data-room-code="${room.code}">
        <div class="room-card-left">
          <span class="room-theme-icon">${room.themeIcon || '🎮'}</span>
          <div class="room-info">
            <div class="room-name">${this.escapeHtml(room.name)}</div>
            <div class="room-meta">
              <span class="room-type-badge ${room.roomType}">${roomTypeIcon}</span>
              <span>${room.themeName || room.themeId}</span>
              <span>• ${this.t('host')}: ${this.escapeHtml(room.hostName)}</span>
            </div>
          </div>
        </div>
        <span class="room-players ${isFull ? 'full' : ''}">👥 ${room.playerCount}/${room.maxPlayers}</span>
        <button onclick="Matchmaking.joinRoom('${room.code}')" class="btn-join-room" ${isFull ? 'disabled' : ''}>
          ${isFull ? this.t('full') : this.t('join')}
        </button>
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
  
  showCountdown(seconds, reason) {
    const overlay = document.createElement('div');
    overlay.className = 'countdown-overlay';
    overlay.id = 'autoStartCountdown';
    overlay.innerHTML = `
      <div class="countdown-box">
        <h3>${this.t('gameStarting')}</h3>
        <div class="countdown-number">${seconds}</div>
        <p>${reason === 'roomFull' ? this.t('roomFullStarting') : ''}</p>
      </div>
    `;
    document.body.appendChild(overlay);
    
    let remaining = seconds;
    const interval = setInterval(() => {
      remaining--;
      const numEl = overlay.querySelector('.countdown-number');
      if (numEl) numEl.textContent = remaining;
      if (remaining <= 0) {
        clearInterval(interval);
        overlay.remove();
      }
    }, 1000);
  },
  
  showCreatePublicRoomModal() {
    // Vérifier si compte vérifié
    const user = JSON.parse(localStorage.getItem('saboteur_user') || 'null');
    if (!user || !user.emailVerified) {
      this.showNotification(this.t('needsVerified'), 'warning');
      return;
    }
    
    const modal = document.createElement('div');
    modal.className = 'countdown-overlay';
    modal.id = 'createPublicRoomModal';
    
    const themes = this.getAccessibleThemes();
    const themesOptions = themes.map(t => 
      `<option value="${t.id}">${t.icon} ${t.name}</option>`
    ).join('');
    
    modal.innerHTML = `
      <div class="create-room-modal">
        <h3>${this.t('createPublic')}</h3>
        
        <div style="margin-bottom:15px;">
          <label style="display:block;margin-bottom:5px;color:rgba(255,255,255,0.7);">${this.t('roomName')}</label>
          <input type="text" id="publicRoomName" placeholder="${this.t('roomNamePlaceholder')}" maxlength="30" 
                 style="width:100%;padding:10px;background:rgba(0,0,0,0.4);border:1px solid rgba(255,255,255,0.2);border-radius:6px;color:white;">
        </div>
        
        <div style="margin-bottom:15px;">
          <label style="display:block;margin-bottom:5px;color:rgba(255,255,255,0.7);">${this.t('theme')}</label>
          <select id="publicRoomTheme" style="width:100%;padding:10px;background:rgba(0,0,0,0.4);border:1px solid rgba(255,255,255,0.2);border-radius:6px;color:white;">
            ${themesOptions}
          </select>
        </div>
        
        <div style="margin-bottom:20px;">
          <label style="display:block;margin-bottom:5px;color:rgba(255,255,255,0.7);">${this.t('roomType')}</label>
          <div class="room-type-selector">
            <button type="button" class="room-type-btn active" data-type="video">${this.t('videoRoom')}</button>
            <button type="button" class="room-type-btn" data-type="chat">${this.t('chatRoom')}</button>
          </div>
        </div>
        
        <div style="display:flex;gap:10px;justify-content:flex-end;">
          <button onclick="Matchmaking.closeModal('createPublicRoomModal')" 
                  style="padding:10px 20px;background:transparent;border:1px solid rgba(255,255,255,0.3);border-radius:6px;color:white;cursor:pointer;">
            ${this.t('cancel')}
          </button>
          <button onclick="Matchmaking.submitCreatePublicRoom()" 
                  style="padding:10px 20px;background:var(--neon-main,#00ffff);border:none;border-radius:6px;color:#000;font-weight:bold;cursor:pointer;">
            ${this.t('create')}
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Event listeners pour les boutons de type
    modal.querySelectorAll('.room-type-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        modal.querySelectorAll('.room-type-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });
    
    // Fermer en cliquant dehors
    modal.addEventListener('click', (e) => {
      if (e.target === modal) this.closeModal('createPublicRoomModal');
    });
  },
  
  submitCreatePublicRoom() {
    const name = document.getElementById('publicRoomName')?.value.trim() || '';
    const themeId = document.getElementById('publicRoomTheme')?.value || 'default';
    const roomTypeBtn = document.querySelector('#createPublicRoomModal .room-type-btn.active');
    const roomType = roomTypeBtn?.dataset.type || 'video';
    
    this.closeModal('createPublicRoomModal');
    
    this.createPublicRoom({
      roomName: name,
      themeId,
      roomType
    });
  },
  
  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.remove();
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
  
  getAccessibleThemes() {
    const allThemes = [
      { id: 'default', name: 'Infiltration Spatiale', icon: '🚀', premium: false },
      { id: 'werewolf', name: 'Loups-Garous', icon: '🐺', premium: false },
      { id: 'wizard-academy', name: 'Académie des Sorciers', icon: '🧙', premium: true },
      { id: 'mythic-realms', name: 'Royaumes Mythiques', icon: '⚔️', premium: true }
    ];
    
    const premiumTypes = ['subscriber', 'pack', 'family', 'admin'];
    const hasPremium = premiumTypes.includes(this.userAccountType);
    
    return allThemes.filter(t => !t.premium || hasPremium);
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
      quickJoinVideo: '🎥 Vidéo',
      quickJoinChat: '💬 Chat',
      createRoom: '➕ Créer',
      loading: 'Chargement...',
      orPrivate: 'ou partie privée',
      noRooms: 'Aucune room publique',
      createPublic: 'Créer une room publique',
      host: 'Hôte',
      join: 'Rejoindre',
      full: 'Pleine',
      videoRooms: 'rooms vidéo',
      chatRooms: 'rooms chat',
      playersOnline: 'joueurs',
      roomName: 'Nom de la room',
      roomNamePlaceholder: 'Ex: Partie entre amis',
      theme: 'Thème',
      roomType: 'Type de room',
      videoRoom: '🎥 Vidéo',
      chatRoom: '💬 Chat uniquement',
      create: 'Créer',
      cancel: 'Annuler',
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
