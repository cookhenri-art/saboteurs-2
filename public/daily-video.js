/**
 * Daily.co Video Component - Client Side
 * Interface de visioconférence en mosaïque avec gestion des permissions
 */

class DailyVideoManager {
  constructor() {
    this.callFrame = null;
    this.participants = new Map();
    this.container = null;
    this.isInitialized = false;
    this.localPermissions = { video: true, audio: true };
    this.isMobile = window.innerWidth < 768;
  }

  /**
   * Initialise le conteneur vidéo dans le DOM
   */
  initContainer() {
    if (this.container) return;

    // Créer le conteneur principal
    this.container = document.createElement('div');
    this.container.id = 'dailyVideoContainer';
    this.container.className = 'daily-video-container';
    this.container.style.cssText = `
      position: fixed;
      top: 80px;
      right: 20px;
      width: ${this.isMobile ? '300px' : '400px'};
      max-height: ${this.isMobile ? '400px' : '600px'};
      background: rgba(10, 14, 39, 0.95);
      border: 2px solid var(--neon-cyan, #00ffff);
      border-radius: 12px;
      overflow: hidden;
      z-index: 9998;
      display: none;
      flex-direction: column;
      box-shadow: 0 8px 32px rgba(0, 255, 255, 0.3);
    `;

    // Header avec contrôles
    const header = document.createElement('div');
    header.className = 'daily-header';
    header.style.cssText = `
      padding: 10px 15px;
      background: rgba(0, 0, 0, 0.5);
      border-bottom: 1px solid rgba(0, 255, 255, 0.3);
      display: flex;
      justify-content: space-between;
      align-items: center;
    `;

    const title = document.createElement('span');
    title.textContent = '📹 Visioconférence';
    title.style.cssText = `
      color: var(--neon-cyan, #00ffff);
      font-weight: 700;
      font-size: 14px;
    `;

    const controls = document.createElement('div');
    controls.style.cssText = 'display: flex; gap: 8px;';

    // Bouton toggle caméra
    this.camButton = this.createControlButton('📹', 'Caméra');
    this.camButton.onclick = () => this.toggleCamera();

    // Bouton toggle micro
    this.micButton = this.createControlButton('🎤', 'Micro');
    this.micButton.onclick = () => this.toggleMicrophone();

    // Bouton minimiser
    const minimizeBtn = this.createControlButton('−', 'Minimiser');
    minimizeBtn.onclick = () => this.toggleMinimize();

    // Bouton fermer complètement
    const closeBtn = this.createControlButton('✕', 'Fermer la vidéo');
    closeBtn.onclick = () => {
      if (confirm('Voulez-vous vraiment quitter la vidéo ? Vous pourrez la réactiver depuis les paramètres.')) {
        this.container.style.display = 'none';
      }
    };
    closeBtn.style.color = '#ff6b6b'; // Rouge pour la fermeture

    controls.appendChild(this.camButton);
    controls.appendChild(this.micButton);
    controls.appendChild(minimizeBtn);
    controls.appendChild(closeBtn);

    header.appendChild(title);
    header.appendChild(controls);

    // Grille de participants
    this.grid = document.createElement('div');
    this.grid.className = 'daily-grid';
    this.grid.style.cssText = `
      flex: 1;
      display: grid;
      gap: 4px;
      padding: 8px;
      overflow-y: auto;
      max-height: ${this.isMobile ? '350px' : '540px'};
    `;

    // Message d'état
    this.statusMessage = document.createElement('div');
    this.statusMessage.className = 'daily-status';
    this.statusMessage.style.cssText = `
      padding: 8px;
      text-align: center;
      font-size: 12px;
      color: var(--neon-orange, #ff6b35);
      background: rgba(0, 0, 0, 0.3);
      border-top: 1px solid rgba(0, 255, 255, 0.2);
    `;

    this.container.appendChild(header);
    this.container.appendChild(this.grid);
    this.container.appendChild(this.statusMessage);

    document.body.appendChild(this.container);
  }

  /**
   * Crée un bouton de contrôle
   */
  createControlButton(emoji, title) {
    const btn = document.createElement('button');
    btn.textContent = emoji;
    btn.title = title;
    btn.style.cssText = `
      background: rgba(0, 255, 255, 0.1);
      border: 1px solid rgba(0, 255, 255, 0.3);
      border-radius: 6px;
      padding: 6px 10px;
      cursor: pointer;
      font-size: 16px;
      transition: all 0.2s;
    `;
    btn.onmouseenter = () => {
      btn.style.background = 'rgba(0, 255, 255, 0.2)';
      btn.style.transform = 'scale(1.1)';
    };
    btn.onmouseleave = () => {
      btn.style.background = 'rgba(0, 255, 255, 0.1)';
      btn.style.transform = 'scale(1)';
    };
    return btn;
  }

  /**
   * Rejoint une room Daily.co
   */
  async joinRoom(roomUrl, userName, permissions = { video: true, audio: true }) {
    try {
      this.initContainer();
      this.localPermissions = permissions;

      // Charger le SDK Daily.co si pas encore fait
      if (!window.DailyIframe) {
        await this.loadDailyScript();
      }

      // Créer le call frame
      this.callFrame = window.DailyIframe.createFrame(this.grid, {
        iframeStyle: {
          width: '100%',
          height: '100%',
          border: 'none'
        },
        showLeaveButton: false,
        showFullscreenButton: false
      });

      // Écouter les événements
      this.setupEventListeners();

      // Rejoindre la room
      await this.callFrame.join({
        url: roomUrl,
        userName: userName,
        startVideoOff: !permissions.video,
        startAudioOff: !permissions.audio
      });

      this.container.style.display = 'flex';
      this.updateStatus('Connecté à la visio');
      this.updateGridLayout();

      console.log('[Daily] Joined room:', roomUrl);
    } catch (error) {
      console.error('[Daily] Join error:', error);
      this.updateStatus('❌ Erreur de connexion');
    }
  }

  /**
   * Charge le SDK Daily.co dynamiquement
   */
  loadDailyScript() {
    return new Promise((resolve, reject) => {
      if (window.DailyIframe) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://unpkg.com/@daily-co/daily-js';
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  /**
   * Configure les listeners d'événements Daily
   */
  setupEventListeners() {
    if (!this.callFrame) return;

    this.callFrame.on('participant-joined', (event) => {
      console.log('[Daily] Participant joined:', event.participant);
      this.updateGridLayout();
    });

    this.callFrame.on('participant-left', (event) => {
      console.log('[Daily] Participant left:', event.participant);
      this.updateGridLayout();
    });

    this.callFrame.on('participant-updated', (event) => {
      this.updateGridLayout();
    });

    this.callFrame.on('error', (error) => {
      console.error('[Daily] Error:', error);
      this.updateStatus('❌ Erreur vidéo');
    });
  }

  /**
   * Met à jour la disposition de la grille selon le nombre de participants
   */
  async updateGridLayout() {
    if (!this.callFrame) return;

    const participants = await this.callFrame.participants();
    const count = Object.keys(participants).length;

    // Déterminer la grille selon le device et le nombre de participants
    const maxCols = this.isMobile ? 3 : 4;
    const maxRows = this.isMobile ? 3 : 4;
    
    let cols, rows;
    if (count <= 4) {
      cols = Math.min(2, count);
      rows = Math.ceil(count / 2);
    } else if (count <= 9) {
      cols = Math.min(3, count);
      rows = Math.ceil(count / 3);
    } else {
      cols = maxCols;
      rows = Math.ceil(count / cols);
    }

    this.grid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    this.grid.style.gridTemplateRows = `repeat(${Math.min(rows, maxRows)}, 1fr)`;
  }

  /**
   * Met à jour les permissions vidéo/audio
   */
  async updatePermissions(permissions) {
    if (!this.callFrame) return;

    this.localPermissions = permissions;

    try {
      // Activer/désactiver la caméra
      await this.callFrame.setLocalVideo(permissions.video);
      
      // Activer/désactiver le micro
      await this.callFrame.setLocalAudio(permissions.audio);

      // Mettre à jour l'UI des boutons
      this.updateButtonStates();

      // Message de statut
      if (!permissions.video && !permissions.audio) {
        this.updateStatus('🔇 Caméra et micro désactivés');
      } else if (!permissions.video) {
        this.updateStatus('📹 Caméra désactivée');
      } else if (!permissions.audio) {
        this.updateStatus('🔇 Micro désactivé');
      } else {
        this.updateStatus('✅ Caméra et micro actifs');
      }

      console.log('[Daily] Permissions updated:', permissions);
    } catch (error) {
      console.error('[Daily] Update permissions error:', error);
    }
  }

  /**
   * Toggle caméra
   */
  async toggleCamera() {
    if (!this.callFrame || !this.localPermissions.video) {
      this.updateStatus('⚠️ Caméra désactivée pour cette phase');
      return;
    }

    try {
      const currentState = await this.callFrame.localVideo();
      await this.callFrame.setLocalVideo(!currentState);
      this.updateButtonStates();
    } catch (error) {
      console.error('[Daily] Toggle camera error:', error);
    }
  }

  /**
   * Toggle micro
   */
  async toggleMicrophone() {
    if (!this.callFrame || !this.localPermissions.audio) {
      this.updateStatus('⚠️ Micro désactivé pour cette phase');
      return;
    }

    try {
      const currentState = await this.callFrame.localAudio();
      await this.callFrame.setLocalAudio(!currentState);
      this.updateButtonStates();
    } catch (error) {
      console.error('[Daily] Toggle mic error:', error);
    }
  }

  /**
   * Met à jour l'état visuel des boutons
   */
  async updateButtonStates() {
    if (!this.callFrame) return;

    const videoOn = await this.callFrame.localVideo();
    const audioOn = await this.callFrame.localAudio();

    this.camButton.style.opacity = videoOn ? '1' : '0.5';
    this.camButton.style.background = videoOn 
      ? 'rgba(0, 255, 255, 0.2)' 
      : 'rgba(255, 0, 0, 0.2)';

    this.micButton.style.opacity = audioOn ? '1' : '0.5';
    this.micButton.style.background = audioOn 
      ? 'rgba(0, 255, 255, 0.2)' 
      : 'rgba(255, 0, 0, 0.2)';
  }

  /**
   * Minimise/Maximise le conteneur vidéo
   */
  toggleMinimize() {
    const isMinimized = this.grid.style.display === 'none';
    this.grid.style.display = isMinimized ? 'grid' : 'none';
    this.statusMessage.style.display = isMinimized ? 'block' : 'block';
  }

  /**
   * Met à jour le message de statut
   */
  updateStatus(message) {
    if (this.statusMessage) {
      this.statusMessage.textContent = message;
    }
  }

  /**
   * Quitte la room et nettoie
   */
  async leave() {
    if (this.callFrame) {
      try {
        await this.callFrame.leave();
        await this.callFrame.destroy();
        this.callFrame = null;
      } catch (error) {
        console.error('[Daily] Leave error:', error);
      }
    }

    if (this.container) {
      this.container.style.display = 'none';
    }

    this.updateStatus('Déconnecté');
  }

  /**
   * Détruit complètement l'instance
   */
  destroy() {
    this.leave();
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
    this.container = null;
    this.participants.clear();
  }
}

// Instance globale
window.dailyVideo = new DailyVideoManager();
