/**
 * Daily.co Video Component - Client Side
 * v4 VERIF + DEBUG
 * Objectif: prouver que le bon fichier est bien chargé + rendre le bloc visible quoi qu'il arrive.
 *
 * Ajoute:
 *  - window.dailyVideo.__version = "v4"
 *  - Badge "VIDEO v4" visible à l'écran
 *  - Logs au chargement
 *  - Container affiché immédiatement
 */

(function(){
  // Badge visible pour confirmer le chargement
  try {
    const badge = document.createElement('div');
    badge.id = 'dailyPatchBadge';
    badge.textContent = 'VIDEO v4';
    badge.style.cssText = `
      position: fixed;
      left: 10px;
      bottom: 10px;
      z-index: 2147483647;
      background: rgba(255,0,0,0.85);
      color: #fff;
      font-weight: 900;
      padding: 6px 10px;
      border-radius: 10px;
      font-family: Arial, sans-serif;
      letter-spacing: 1px;
      box-shadow: 0 6px 18px rgba(0,0,0,0.35);
      pointer-events: none;
    `;
    document.body.appendChild(badge);
  } catch(e) {}

  console.log('[DailyUI] daily-video.js loaded ✅ (v4)');
})();

class DailyVideoManager {
  constructor() {
    this.__version = "v4";
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
      border: 3px solid rgba(255,0,0,0.9); /* v4 debug border */
      border-radius: 12px;
      overflow: hidden;
      z-index: 2147483647;
      display: none;
      flex-direction: column;
      box-shadow: 0 8px 32px rgba(0, 255, 255, 0.3);
      pointer-events: auto;
    `;

    const header = document.createElement('div');
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
    title.textContent = '📹 Visioconférence (v4)';
    title.style.cssText = `color: #fff; font-weight: 900; font-size: 13px;`;

    const controls = document.createElement('div');
    controls.style.cssText = 'display: flex; gap: 8px;';

    this.camButton = this.createControlButton('📹', 'Caméra');
    this.camButton.onclick = () => this.toggleCamera();

    this.micButton = this.createControlButton('🎤', 'Micro');
    this.micButton.onclick = () => this.toggleMicrophone();

    const closeBtn = this.createControlButton('✕', 'Masquer');
    closeBtn.onclick = () => this.container.style.setProperty('display', 'none', 'important');

    controls.appendChild(this.camButton);
    controls.appendChild(this.micButton);
    controls.appendChild(closeBtn);

    header.appendChild(title);
    header.appendChild(controls);

    this.grid = document.createElement('div');
    this.grid.style.cssText = `
      flex: 1 1 auto;
      display: block;
      width: 100%;
      height: 100%;
      overflow: hidden;
      background: rgba(0,0,0,0.15);
    `;

    this.statusMessage = document.createElement('div');
    this.statusMessage.style.cssText = `
      padding: 8px;
      text-align: center;
      font-size: 12px;
      color: #ffd54a;
      background: rgba(0, 0, 0, 0.3);
      border-top: 1px solid rgba(255,255,255,0.15);
      flex: 0 0 auto;
    `;
    this.statusMessage.textContent = 'En attente…';

    this.container.appendChild(header);
    this.container.appendChild(this.grid);
    this.container.appendChild(this.statusMessage);

    document.body.appendChild(this.container);

    console.log('[DailyUI] Container injected (v4).', this.container);
  }

  createControlButton(txt, title) {
    const btn = document.createElement('button');
    btn.textContent = txt;
    btn.title = title;
    btn.style.cssText = `
      background: rgba(255,255,255,0.12);
      border: 1px solid rgba(255,255,255,0.25);
      border-radius: 6px;
      padding: 6px 10px;
      cursor: pointer;
      font-size: 16px;
      color: #fff;
    `;
    return btn;
  }

  async joinRoom(roomUrl, userName, permissions = { video: true, audio: true }) {
    this.initContainer();
    this.localPermissions = permissions;

    // Afficher immédiatement
    this.container.style.setProperty('display', 'flex', 'important');
    this.updateStatus('Connexion…');

    try {
      if (!window.DailyIframe) {
        await this.loadDailyScript();
      }

      console.log('[DailyUI] Creating frame (v4)…', { roomUrl, userName, permissions });

      this.callFrame = window.DailyIframe.createFrame(this.grid, {
        iframeStyle: { width: '100%', height: '100%', border: 'none' },
        showLeaveButton: false,
        showFullscreenButton: false
      });

      this.setupEventListeners();

      setTimeout(() => {
        const iframe = this.grid.querySelector('iframe');
        console.log('[DailyUI] iframe present? (v4)', !!iframe, iframe);
      }, 200);

      await this.callFrame.join({
        url: roomUrl,
        userName,
        startVideoOff: !permissions.video,
        startAudioOff: !permissions.audio
      });

      console.log('[DailyUI] join() resolved (v4)');
      this.updateStatus('✅ Connecté');
      await this.updateButtonStates();
    } catch (e) {
      console.error('[DailyUI] joinRoom error (v4):', e);
      this.updateStatus('❌ Erreur joinRoom');
      throw e;
    }
  }

  loadDailyScript() {
    return new Promise((resolve, reject) => {
      if (window.DailyIframe) return resolve();
      const s = document.createElement('script');
      s.src = 'https://unpkg.com/@daily-co/daily-js';
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  setupEventListeners() {
    if (!this.callFrame) return;
    this.callFrame.on('joining-meeting', () => {
      console.log('[Daily] joining-meeting (v4)');
      this.container?.style.setProperty('display', 'flex', 'important');
      this.updateStatus('Connexion à la réunion…');
    });
    this.callFrame.on('joined-meeting', () => {
      console.log('[Daily] joined-meeting (v4)');
      this.container?.style.setProperty('display', 'flex', 'important');
      this.updateStatus('✅ Connecté');
    });
    this.callFrame.on('error', (err) => {
      console.error('[Daily] error event (v4):', err);
      this.updateStatus('❌ Erreur Daily');
    });
  }

  async toggleCamera() {
    if (!this.callFrame) return;
    const current = await this.callFrame.localVideo();
    await this.callFrame.setLocalVideo(!current);
    await this.updateButtonStates();
  }

  async toggleMicrophone() {
    if (!this.callFrame) return;
    const current = await this.callFrame.localAudio();
    await this.callFrame.setLocalAudio(!current);
    await this.updateButtonStates();
  }

  async updateButtonStates() {
    if (!this.callFrame || !this.camButton || !this.micButton) return;
    const videoOn = await this.callFrame.localVideo();
    const audioOn = await this.callFrame.localAudio();
    this.camButton.style.opacity = videoOn ? '1' : '0.5';
    this.micButton.style.opacity = audioOn ? '1' : '0.5';
  }

  updateStatus(msg) {
    if (this.statusMessage) this.statusMessage.textContent = msg;
  }
}

window.dailyVideo = new DailyVideoManager();
console.log('[DailyUI] dailyVideo manager ready ✅', window.dailyVideo);
