/**
 * Daily.co Video Component - Client Side
 * FIX: mosaïque invisible -> container sans height => iframe à 0px de haut.
 * Ici on fixe une height + on met la zone iframe en block/100%.
 */

class DailyVideoManager {
  constructor() {
    this.callFrame = null;
    this.container = null;
    this.grid = null;
    this.statusMessage = null;
    this.camButton = null;
    this.micButton = null;
    this.localPermissions = { video: true, audio: true };
    this.isMobile = window.innerWidth < 768;
  }

  initContainer() {
    if (this.container) return;

    this.container = document.createElement('div');
    this.container.id = 'dailyVideoContainer';
    this.container.className = 'daily-video-container';

    const containerWidth = this.isMobile ? '300px' : '400px';
    const containerHeight = this.isMobile ? '420px' : '620px';

    this.container.style.cssText = `
      position: fixed;
      top: 80px;
      right: 20px;
      width: ${containerWidth};
      height: ${containerHeight};
      background: rgba(10, 14, 39, 0.95);
      border: 2px solid var(--neon-cyan, #00ffff);
      border-radius: 12px;
      overflow: hidden;
      z-index: 999999;
      display: none;
      flex-direction: column;
      box-shadow: 0 8px 32px rgba(0, 255, 255, 0.3);
    `;

    const header = document.createElement('div');
    header.className = 'daily-header';
    header.style.cssText = `
      padding: 10px 15px;
      background: rgba(0, 0, 0, 0.5);
      border-bottom: 1px solid rgba(0, 255, 255, 0.3);
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex: 0 0 auto;
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

    this.camButton = this.createControlButton('📹', 'Caméra');
    this.camButton.onclick = () => this.toggleCamera();

    this.micButton = this.createControlButton('🎤', 'Micro');
    this.micButton.onclick = () => this.toggleMicrophone();

    const minimizeBtn = this.createControlButton('−', 'Minimiser');
    minimizeBtn.onclick = () => this.toggleMinimize();

    const closeBtn = this.createControlButton('✕', 'Fermer la vidéo');
    closeBtn.onclick = () => {
      if (confirm('Voulez-vous vraiment quitter la vidéo ? Vous pourrez la réactiver depuis les paramètres.')) {
        this.container.style.display = 'none';
      }
    };
    closeBtn.style.color = '#ff6b6b';

    controls.appendChild(this.camButton);
    controls.appendChild(this.micButton);
    controls.appendChild(minimizeBtn);
    controls.appendChild(closeBtn);

    header.appendChild(title);
    header.appendChild(controls);

    // Zone iframe Daily (100% height/width)
    this.grid = document.createElement('div');
    this.grid.className = 'daily-grid';
    this.grid.style.cssText = `
      flex: 1 1 auto;
      display: block;
      width: 100%;
      height: 100%;
      overflow: hidden;
      background: rgba(0,0,0,0.15);
    `;

    this.statusMessage = document.createElement('div');
    this.statusMessage.className = 'daily-status';
    this.statusMessage.style.cssText = `
      padding: 8px;
      text-align: center;
      font-size: 12px;
      color: var(--neon-orange, #ff6b35);
      background: rgba(0, 0, 0, 0.3);
      border-top: 1px solid rgba(0, 255, 255, 0.2);
      flex: 0 0 auto;
    `;
    this.statusMessage.textContent = 'En attente…';

    this.container.appendChild(header);
    this.container.appendChild(this.grid);
    this.container.appendChild(this.statusMessage);

    document.body.appendChild(this.container);
  }

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

  async joinRoom(roomUrl, userName, permissions = { video: true, audio: true }) {
    try {
      this.initContainer();
      this.localPermissions = permissions;

      if (!window.DailyIframe) {
        await this.loadDailyScript();
      }

      this.callFrame = window.DailyIframe.createFrame(this.grid, {
        iframeStyle: { width: '100%', height: '100%', border: 'none' },
        showLeaveButton: false,
        showFullscreenButton: false
      });

      this.setupEventListeners();

      this.updateStatus('Connexion…');

      await this.callFrame.join({
        url: roomUrl,
        userName,
        startVideoOff: !permissions.video,
        startAudioOff: !permissions.audio
      });

      this.container.style.display = 'flex';
      this.updateStatus('✅ Connecté');
      console.log('[Daily] Joined room:', roomUrl);

      await this.updateButtonStates();
    } catch (error) {
      console.error('[Daily] Join error:', error);
      this.updateStatus('❌ Erreur de connexion');

      try {
        if (this.callFrame) await this.callFrame.destroy();
      } catch (_) {}
      this.callFrame = null;

      throw error; // IMPORTANT
    }
  }

  loadDailyScript() {
    return new Promise((resolve, reject) => {
      if (window.DailyIframe) return resolve();
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/@daily-co/daily-js';
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  setupEventListeners() {
    if (!this.callFrame) return;

    this.callFrame.on('joined-meeting', () => this.updateStatus('✅ Connecté'));
    this.callFrame.on('left-meeting', () => this.updateStatus('Déconnecté'));

    this.callFrame.on('error', (error) => {
      console.error('[Daily] Error:', error);
      this.updateStatus('❌ Erreur vidéo');
    });
  }

  async toggleCamera() {
    if (!this.callFrame || !this.localPermissions.video) {
      this.updateStatus('⚠️ Caméra désactivée pour cette phase');
      return;
    }
    try {
      const current = await this.callFrame.localVideo();
      await this.callFrame.setLocalVideo(!current);
      await this.updateButtonStates();
    } catch (e) {
      console.error('[Daily] Toggle camera error:', e);
    }
  }

  async toggleMicrophone() {
    if (!this.callFrame || !this.localPermissions.audio) {
      this.updateStatus('⚠️ Micro désactivé pour cette phase');
      return;
    }
    try {
      const current = await this.callFrame.localAudio();
      await this.callFrame.setLocalAudio(!current);
      await this.updateButtonStates();
    } catch (e) {
      console.error('[Daily] Toggle mic error:', e);
    }
  }

  async updateButtonStates() {
    if (!this.callFrame || !this.camButton || !this.micButton) return;
    const videoOn = await this.callFrame.localVideo();
    const audioOn = await this.callFrame.localAudio();

    this.camButton.style.opacity = videoOn ? '1' : '0.5';
    this.camButton.style.background = videoOn ? 'rgba(0, 255, 255, 0.2)' : 'rgba(255, 0, 0, 0.2)';

    this.micButton.style.opacity = audioOn ? '1' : '0.5';
    this.micButton.style.background = audioOn ? 'rgba(0, 255, 255, 0.2)' : 'rgba(255, 0, 0, 0.2)';
  }

  toggleMinimize() {
    if (!this.grid) return;
    const hidden = this.grid.style.display === 'none';
    this.grid.style.display = hidden ? 'block' : 'none';
  }

  updateStatus(message) {
    if (this.statusMessage) this.statusMessage.textContent = message;
  }

  async leave() {
    if (this.callFrame) {
      try {
        await this.callFrame.leave();
        await this.callFrame.destroy();
      } catch (e) {
        console.error('[Daily] Leave error:', e);
      } finally {
        this.callFrame = null;
      }
    }
    if (this.container) this.container.style.display = 'none';
    this.updateStatus('Déconnecté');
  }
}

window.dailyVideo = new DailyVideoManager();
