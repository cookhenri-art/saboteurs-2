/**
 * Daily.co Video Component - Client Side
 * v5 (PERMISSIONS)
 *
 * Objectifs:
 * - Fournir les méthodes attendues par video-integration-client.js :
 *    joinRoom(), updatePermissions(), toggleMinimize(), leave(), destroy()
 * - Forcer ON/OFF caméra et micro selon state.videoPermissions (par phase/role)
 * - Empêcher l’utilisateur de réactiver un média quand la phase l’interdit
 * - Optionnel: quand audio=false => "deafen" (volume remote à 0) pour éviter d'entendre
 *
 * Remarque: la logique de "qui a le droit" est côté serveur (video-permissions.js).
 */

class DailyVideoManager {
  constructor() {
    this.__version = "v5.2-ui";

    this.callFrame = null;
    this.container = null;
    this.grid = null;
    this.statusMessage = null;
    this.overlay = null;

    // UI: bouton lanceur (quand on ferme la fenêtre)
    this.launcher = null;
    this._drag = { active: false, startX: 0, startY: 0, startTop: 0, startLeft: 0 };

    // UI state persistence (position/taille/dock/minimisé/masqué)
    this._uiKey = null;
    this._uiState = null;
    this._resizeObserver = null;
    this._saveTimer = null;

    this.camButton = null;
    this.micButton = null;

    // Permissions venant du serveur (autorisations de la phase)
    this.allowed = { video: true, audio: true, reason: "init" };

    // Préférences utilisateur (quand il a le droit). null = pas d'override
    this.userPref = { video: null, audio: null };

    this.isMobile = window.innerWidth < 768;

    // Pour remettre le volume remote quand on "deafen"
    this._remoteVolumes = new Map();
    this._isDeafened = false;
  }

  // ---------------- UI ----------------

  initContainer() {
    if (this.container) return;

    // Key is per room when available, otherwise global.
    const roomCode = (window.state && window.state.roomCode) ? window.state.roomCode : "global";
    this._uiKey = `dailyVideoUI:v1:${roomCode}`;
    this._uiState = this._loadUIState();

    this.container = document.createElement("div");
    this.container.id = "dailyVideoContainer";
    this.container.className = "daily-video-container";

    const containerWidth = this.isMobile ? "320px" : "420px";
    const containerHeight = this.isMobile ? "460px" : "650px";

    this.container.style.cssText = `
      position: fixed;
      top: 80px;
      right: 20px;
      width: ${containerWidth};
      height: ${containerHeight};
            min-width: 260px;
      min-height: 320px;
background: rgba(10, 14, 39, 0.95);
      border: 2px solid var(--neon-cyan, #00ffff);
      border-radius: 12px;
      overflow: hidden;
      z-index: 2147483647;
      display: none;
      flex-direction: column;
      box-shadow: 0 8px 32px rgba(0, 255, 255, 0.3);
      pointer-events: auto;
          resize: both;
      overflow: hidden;
`;

    const header = document.createElement("div");
    header.className = "daily-header";
    header.style.cssText = `
      padding: 10px 12px;
      background: rgba(0, 0, 0, 0.55);
      border-bottom: 1px solid rgba(0, 255, 255, 0.25);
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex: 0 0 auto;
      gap: 8px;
          cursor: move;
      touch-action: none;
`;

    const title = document.createElement("span");
    title.textContent = "📹 Visioconférence";
    title.style.cssText = `
      color: var(--neon-cyan, #00ffff);
      font-weight: 800;
      font-size: 13px;
      white-space: nowrap;
    `;

    const controls = document.createElement("div");
    controls.style.cssText = "display:flex; gap:8px; align-items:center;";

    // Dock controls
    const dockLeftBtn = this.createControlButton("⟸", "Dock à gauche");
    dockLeftBtn.onclick = () => this.setDock("left");

    const dockRightBtn = this.createControlButton("⟹", "Dock à droite");
    dockRightBtn.onclick = () => this.setDock("right");

    const dockBottomBtn = this.createControlButton("⟱", "Dock en bas");
    dockBottomBtn.onclick = () => this.setDock("bottom");

    const resetDockBtn = this.createControlButton("⤢", "Réinitialiser position");
    resetDockBtn.onclick = () => this.resetDock();

    this.camButton = this.createControlButton("📹", "Caméra");
    this.camButton.onclick = () => this.toggleCamera();

    this.micButton = this.createControlButton("🎤", "Micro");
    this.micButton.onclick = () => this.toggleMicrophone();

    const minimizeBtn = this.createControlButton("−", "Minimiser");
    minimizeBtn.onclick = () => this.toggleMinimize();

    const closeBtn = this.createControlButton("✕", "Masquer");
    closeBtn.onclick = () => this.hideWindow();

    controls.appendChild(this.camButton);
    controls.appendChild(this.micButton);
    controls.appendChild(dockLeftBtn);
    controls.appendChild(dockRightBtn);
    controls.appendChild(dockBottomBtn);
    controls.appendChild(resetDockBtn);
    controls.appendChild(minimizeBtn);
    controls.appendChild(closeBtn);

    header.appendChild(title);
    header.appendChild(controls);

    this.grid = document.createElement("div");
    this.grid.className = "daily-grid";
    this.grid.style.cssText = `
      position: relative;
      flex: 1 1 auto;
      display: block;
      width: 100%;
      height: 100%;
      overflow: hidden;
      background: rgba(0,0,0,0.15);
    `;

    // Overlay "sleep" quand audio=false & video=false (phase restreinte)
    this.overlay = document.createElement("div");
    this.overlay.id = "dailyOverlay";
    this.overlay.style.cssText = `
      position: absolute;
      inset: 0;
      display: none;
      align-items: center;
      justify-content: center;
      flex-direction: column;
      gap: 10px;
      background: rgba(0,0,0,0.70);
      color: #fff;
      font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
      z-index: 2;
      text-align: center;
      padding: 18px;
    `;
    this.overlay.innerHTML = `
      <div style="font-size:18px; font-weight:900;">😴 Phase privée</div>
      <div id="dailyOverlayReason" style="opacity:0.9; font-size:13px; line-height:1.3;"></div>
      <div style="opacity:0.7; font-size:12px;">Caméra & micro désactivés pour toi</div>
    `;

    this.grid.appendChild(this.overlay);

    this.statusMessage = document.createElement("div");
    this.statusMessage.className = "daily-status";
    this.statusMessage.style.cssText = `
      padding: 8px 10px;
      text-align: center;
      font-size: 12px;
      color: var(--neon-orange, #ff6b35);
      background: rgba(0, 0, 0, 0.35);
      border-top: 1px solid rgba(0, 255, 255, 0.18);
      flex: 0 0 auto;
    `;
    this.statusMessage.textContent = "En attente…";

    this.container.appendChild(header);
    this.container.appendChild(this.grid);
    this.container.appendChild(this.statusMessage);

    document.body.appendChild(this.container);

    // UI: bouton lanceur (si on ferme la fenêtre)
    this.ensureLauncher();

    // Restore persisted UI state (pos/size/dock/minimized/hidden)
    this._applyUIState();

    // Persist size changes (css resize: both)
    this._startResizeObserver();

    // UI: drag & drop via le header (déplacement de la fenêtre)
    const onDown = (ev) => {
      // ne pas déclencher si clic sur un bouton
      if (ev.target && ev.target.tagName === "BUTTON") return;

      this._drag.active = true;
      const pt = (ev.touches && ev.touches[0]) ? ev.touches[0] : ev;

      this._drag.startX = pt.clientX;
      this._drag.startY = pt.clientY;

      const rect = this.container.getBoundingClientRect();
      this._drag.startTop = rect.top;
      this._drag.startLeft = rect.left;

      // passer en mode left/top (désactive right)
      this.container.style.right = "auto";
      this.container.style.left = rect.left + "px";
      this.container.style.top = rect.top + "px";

      ev.preventDefault?.();
    };

    const onMove = (ev) => {
      if (!this._drag.active) return;
      const pt = (ev.touches && ev.touches[0]) ? ev.touches[0] : ev;

      const dx = pt.clientX - this._drag.startX;
      const dy = pt.clientY - this._drag.startY;

      const nextLeft = Math.max(0, this._drag.startLeft + dx);
      const nextTop = Math.max(0, this._drag.startTop + dy);

      this.container.style.left = nextLeft + "px";
      this.container.style.top = nextTop + "px";
      ev.preventDefault?.();
    };

    const onUp = () => {
      this._drag.active = false;

      // Snap-to-dock when close to edges + persist position
      this._snapDock();
      this._scheduleSave();
    };

    header.addEventListener("mousedown", onDown);
    header.addEventListener("touchstart", onDown, { passive: false });
    window.addEventListener("mousemove", onMove);
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchend", onUp);

    console.log("[DailyUI] Container injected (v5.2-ui).");
  }

  createControlButton(label, title) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = label;
    btn.title = title;
    btn.style.cssText = `
      background: rgba(0, 255, 255, 0.10);
      border: 1px solid rgba(0, 255, 255, 0.28);
      border-radius: 8px;
      padding: 6px 10px;
      cursor: pointer;
      font-size: 16px;
      transition: transform 0.12s ease, background 0.12s ease, opacity 0.12s ease;
      color: #fff;
    `;
    btn.onmouseenter = () => (btn.style.transform = "scale(1.06)");
    btn.onmouseleave = () => (btn.style.transform = "scale(1)");
    return btn;
  }

  updateStatus(message) {
    if (this.statusMessage) this.statusMessage.textContent = message;
  }

  // ---------------- UI state persistence ----------------

  _loadUIState() {
    if (!this._uiKey) return null;
    try {
      const raw = localStorage.getItem(this._uiKey);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : null;
    } catch {
      return null;
    }
  }

  _scheduleSave() {
    if (!this._uiKey) return;
    if (this._saveTimer) clearTimeout(this._saveTimer);
    this._saveTimer = setTimeout(() => {
      this._saveTimer = null;
      this._saveUIState();
    }, 150);
  }

  _saveUIState() {
    if (!this._uiKey || !this.container) return;
    try {
      const rect = this.container.getBoundingClientRect();
      const style = window.getComputedStyle(this.container);
      const dock = this._uiState?.dock || "free";
      const hidden = this._uiState?.hidden || false;
      const minimized = this._uiState?.minimized || false;

      const state = {
        dock,
        hidden,
        minimized,
        // store size always
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        // store positional anchors
        top: style.top && style.top !== "auto" ? Math.round(parseFloat(style.top)) : null,
        left: style.left && style.left !== "auto" ? Math.round(parseFloat(style.left)) : null,
        right: style.right && style.right !== "auto" ? Math.round(parseFloat(style.right)) : null,
        bottom: style.bottom && style.bottom !== "auto" ? Math.round(parseFloat(style.bottom)) : null
      };

      this._uiState = state;
      localStorage.setItem(this._uiKey, JSON.stringify(state));
    } catch {
      // ignore
    }
  }

  _applyUIState() {
    if (!this.container) return;
    const s = this._uiState;
    if (!s) return;

    // size
    if (s.width) this.container.style.width = `${s.width}px`;
    if (s.height) this.container.style.height = `${s.height}px`;

    // position
    if (s.dock && s.dock !== "free") {
      this.setDock(s.dock, { silent: true });
    } else {
      // restore free pos
      if (s.top != null) this.container.style.top = `${s.top}px`;
      if (s.left != null) {
        this.container.style.left = `${s.left}px`;
        this.container.style.right = "auto";
      } else if (s.right != null) {
        this.container.style.right = `${s.right}px`;
        this.container.style.left = "auto";
      }
      if (s.bottom != null) this.container.style.bottom = `${s.bottom}px`;
    }

    // minimized
    if (this.grid) this.grid.style.display = s.minimized ? "none" : "block";

    // hidden
    if (s.hidden) {
      this.container.style.setProperty("display", "none", "important");
      this.ensureLauncher();
      if (this.launcher) this.launcher.style.display = "block";
    }
  }

  _startResizeObserver() {
    if (!this.container || this._resizeObserver) return;
    this._resizeObserver = new ResizeObserver(() => {
      this._scheduleSave();
    });
    this._resizeObserver.observe(this.container);
  }

  setDock(where, { silent = false } = {}) {
    if (!this.container) return;
    const c = this.container;

    // reset anchors
    c.style.left = "auto";
    c.style.right = "auto";
    c.style.top = "auto";
    c.style.bottom = "auto";

    if (where === "left") {
      c.style.left = "20px";
      c.style.top = "80px";
    } else if (where === "right") {
      c.style.right = "20px";
      c.style.top = "80px";
    } else if (where === "bottom") {
      c.style.left = "20px";
      c.style.right = "20px";
      c.style.bottom = "20px";
      c.style.top = "auto";
      // keep height reasonable on bottom dock for desktop
      if (!this.isMobile && (!this._uiState || !this._uiState.height)) {
        c.style.height = "420px";
      }
    } else {
      // free
      c.style.top = "80px";
      c.style.right = "20px";
    }

    this._uiState = { ...(this._uiState || {}), dock: where };
    if (!silent) this._scheduleSave();
  }

  resetDock() {
    if (!this.container) return;
    this._uiState = { ...(this._uiState || {}), dock: "free" };
    // default position
    this.container.style.right = "20px";
    this.container.style.top = "80px";
    this.container.style.left = "auto";
    this.container.style.bottom = "auto";
    this._scheduleSave();
  }

  _snapDock() {
    if (!this.container) return;
    const rect = this.container.getBoundingClientRect();
    const margin = 28;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const nearLeft = rect.left <= margin;
    const nearRight = (vw - rect.right) <= margin;
    const nearBottom = (vh - rect.bottom) <= margin;

    if (nearBottom) return this.setDock("bottom");
    if (nearLeft) return this.setDock("left");
    if (nearRight) return this.setDock("right");

    // otherwise free
    this._uiState = { ...(this._uiState || {}), dock: "free" };
    this._scheduleSave();
  }

  // --------------- Daily join / lifecycle ----------------

  async joinRoom(roomUrl, userName, permissions = { video: true, audio: true }) {
    this.initContainer();
    this.showWindow();
    this.updateStatus("Connexion…");

    // Reset prefs at (re)join
    this.userPref = { video: null, audio: null };
    this.allowed = { ...permissions };

    if (!window.DailyIframe) {
      await this.loadDailyScript();
    }

    // Recreate frame
    if (this.callFrame) {
      try { await this.callFrame.destroy(); } catch {}
      this.callFrame = null;
    }

    this.callFrame = window.DailyIframe.createFrame(this.grid, {
      iframeStyle: { width: "100%", height: "100%", border: "none" },
      showLeaveButton: false,
      showFullscreenButton: false
    });

    this.setupEventListeners();

    // Apply permissions BEFORE join (startVideoOff/startAudioOff) + enforce after
    const startVideoOff = !permissions.video;
    const startAudioOff = !permissions.audio;

    await this.callFrame.join({
      url: roomUrl,
      userName,
      startVideoOff,
      startAudioOff
    });

    this.updateStatus("✅ Connecté");

    // Enforce state after join
    await this.applyPermissions(permissions, { phaseChanged: true });

    await this.updateButtonStates();

    console.log("[DailyUI] Joined room (v5).");
  }

  loadDailyScript() {
    return new Promise((resolve, reject) => {
      if (window.DailyIframe) return resolve();
      const script = document.createElement("script");
      script.src = "https://unpkg.com/@daily-co/daily-js";
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  setupEventListeners() {
    if (!this.callFrame) return;

    this.callFrame.on("joining-meeting", () => {
      this.container?.style.setProperty("display", "flex", "important");
      this.updateStatus("Connexion à la réunion…");
    });

    this.callFrame.on("joined-meeting", async () => {
      this.container?.style.setProperty("display", "flex", "important");
      this.updateStatus("✅ Connecté");
      await this.updateButtonStates();
    });

    this.callFrame.on("left-meeting", () => {
      this.updateStatus("Déconnecté");
    });

    this.callFrame.on("error", (error) => {
      console.error("[Daily] error event:", error);
      this.updateStatus("❌ Erreur vidéo");
    });

    // Quand des participants arrivent/partent, si on est en mode "deafen",
    // on réapplique le volume.
    const reapplyDeafen = async () => {
      if (this._isDeafened) await this.deafenRemotes(true);
    };
    this.callFrame.on("participant-joined", reapplyDeafen);
    this.callFrame.on("participant-updated", reapplyDeafen);
  }

  async leave() {
    if (!this.callFrame) return;
    try {
      await this.callFrame.leave();
    } catch (e) {
      console.error("[Daily] leave error:", e);
    }
    this.container?.style.setProperty("display", "none", "important");
  }

  async destroy() {
    if (!this.callFrame) return;
    try {
      await this.callFrame.destroy();
    } catch (e) {
      console.error("[Daily] destroy error:", e);
    }
    this.callFrame = null;
    this.container?.style.setProperty("display", "none", "important");
  }


  ensureLauncher() {
    if (this.launcher) return;

    const btn = document.createElement("button");
    btn.id = "dailyVideoLauncher";
    btn.type = "button";
    btn.textContent = "📹";
    btn.title = "Ré-ouvrir la visioconférence";
    btn.style.cssText = `
      position: fixed;
      bottom: 18px;
      right: 18px;
      width: 52px;
      height: 52px;
      border-radius: 999px;
      border: 2px solid rgba(0, 255, 255, 0.35);
      background: rgba(0, 0, 0, 0.55);
      color: #fff;
      font-size: 22px;
      cursor: pointer;
      z-index: 2147483647;
      display: none;
      box-shadow: 0 8px 22px rgba(0, 255, 255, 0.22);
    `;

    btn.onclick = () => this.showWindow();
    document.body.appendChild(btn);
    this.launcher = btn;
  }

  showWindow() {
    if (!this.container) return;
    this.container.style.setProperty("display", "flex", "important");
    if (this.launcher) this.launcher.style.display = "none";

    // Persist
    this._uiState = { ...(this._uiState || {}), hidden: false };
    this._scheduleSave();
  }

  hideWindow() {
    if (!this.container) return;
    this.container.style.setProperty("display", "none", "important");
    this.ensureLauncher();
    if (this.launcher) this.launcher.style.display = "block";

    // Persist
    this._uiState = { ...(this._uiState || {}), hidden: true };
    this._scheduleSave();
  }

  toggleMinimize() {
    if (!this.grid) return;
    const hidden = this.grid.style.display === "none";
    this.grid.style.display = hidden ? "block" : "none";

    // Persist
    this._uiState = { ...(this._uiState || {}), minimized: !hidden };
    this._scheduleSave();
  }

  // ---------------- Permissions handling ----------------

  /**
   * API attendue par video-integration-client.js
   * permissions: { video:boolean, audio:boolean, reason?:string }
   */
  async updatePermissions(permissions) {
    if (!permissions || !this.callFrame) return;
    // On considère que si l'objet change, c'est un changement de phase/role => reset overrides
    await this.applyPermissions(permissions, { phaseChanged: true });
  }

  async applyPermissions(permissions, { phaseChanged } = { phaseChanged: false }) {
    this.allowed = {
      video: !!permissions.video,
      audio: !!permissions.audio,
      reason: permissions.reason || ""
    };

    // Si la phase change, on remet les overrides utilisateur à zéro,
    // afin que les nouvelles règles s'appliquent directement.
    if (phaseChanged) {
      this.userPref = { video: null, audio: null };
    }

    // UI lock/unlock
    this.setButtonEnabled(this.camButton, this.allowed.video, this.allowed.video ? "" : "Caméra interdite: " + (this.allowed.reason || "phase"));
    this.setButtonEnabled(this.micButton, this.allowed.audio, this.allowed.audio ? "" : "Micro interdit: " + (this.allowed.reason || "phase"));

    // Overlay quand on n'a droit à rien
    const shouldOverlay = !this.allowed.video && !this.allowed.audio;
    this.setOverlay(shouldOverlay, this.allowed.reason);

    // ENFORCE: si interdit -> forcer OFF
    if (!this.allowed.video) {
      try { await this.callFrame.setLocalVideo(false); } catch (e) { console.warn("setLocalVideo(false) failed", e); }
    }
    if (!this.allowed.audio) {
      try { await this.callFrame.setLocalAudio(false); } catch (e) { console.warn("setLocalAudio(false) failed", e); }
      await this.deafenRemotes(true);
    } else {
      await this.deafenRemotes(false);
    }

    // Si autorisé, on applique l'état voulu (override utilisateur ou "ON" par défaut)
    if (this.allowed.video) {
      const desiredVideo = (this.userPref.video !== null) ? this.userPref.video : true;
      try { await this.callFrame.setLocalVideo(desiredVideo); } catch (e) { console.warn("setLocalVideo(desired) failed", e); }
    }
    if (this.allowed.audio) {
      const desiredAudio = (this.userPref.audio !== null) ? this.userPref.audio : true;
      try { await this.callFrame.setLocalAudio(desiredAudio); } catch (e) { console.warn("setLocalAudio(desired) failed", e); }
    }

    // Message de statut (optionnel)
    if (!this.allowed.video && this.allowed.audio) this.updateStatus("🎧 Audio only");
    if (this.allowed.video && this.allowed.audio) this.updateStatus("✅ Vidéo + audio");
    if (!this.allowed.video && !this.allowed.audio) this.updateStatus("😴 Phase privée");

    await this.updateButtonStates();
  }

  setButtonEnabled(btn, enabled, titleWhenDisabled = "") {
    if (!btn) return;
    btn.disabled = !enabled;
    btn.style.opacity = enabled ? "1" : "0.35";
    btn.style.cursor = enabled ? "pointer" : "not-allowed";
    btn.title = enabled ? btn.title.replace(/^⛔\s*/, "") : ("⛔ " + titleWhenDisabled);
  }

  setOverlay(show, reason) {
    if (!this.overlay) return;
    this.overlay.style.display = show ? "flex" : "none";
    const reasonEl = this.overlay.querySelector("#dailyOverlayReason");
    if (reasonEl) reasonEl.textContent = reason || "";
  }

  async deafenRemotes(on) {
    if (!this.callFrame) return;

    // Daily API: setParticipantVolume(participantId, volume)
    // (best-effort, catch si non supporté)
    const participants = (typeof this.callFrame.participants === "function")
      ? this.callFrame.participants()
      : null;

    if (!participants) return;

    const me = participants.local || participants.localParticipant;
    const myId = me?.session_id || me?.sessionId || me?.participantId;

    const setVol = async (pid, vol) => {
      if (typeof this.callFrame.setParticipantVolume === "function") {
        await this.callFrame.setParticipantVolume(pid, vol);
      }
    };

    try {
      if (on) {
        this._isDeafened = true;
        for (const [id, p] of Object.entries(participants)) {
          if (id === "local" || id === "localParticipant") continue;
          const pid = p?.session_id || p?.sessionId || id;
          if (pid === myId) continue;
          // store current volume if we can read it (often not available)
          this._remoteVolumes.set(pid, 1);
          await setVol(pid, 0);
        }
      } else {
        if (!this._isDeafened) return;
        this._isDeafened = false;
        for (const [pid] of this._remoteVolumes.entries()) {
          await setVol(pid, 1);
        }
        this._remoteVolumes.clear();
      }
    } catch (e) {
      // If Daily doesn't support it, just ignore
      console.warn("[Daily] deafenRemotes not supported:", e);
    }
  }

  // -------------- user toggles (only when allowed) ----------------

  async toggleCamera() {
    if (!this.callFrame) return;

    if (!this.allowed.video) {
      this.updateStatus("⚠️ Caméra interdite pour cette phase");
      return;
    }
    try {
      const current = await this.callFrame.localVideo();
      const next = !current;
      this.userPref.video = next; // store override
      await this.callFrame.setLocalVideo(next);
      await this.updateButtonStates();
    } catch (e) {
      console.error("[Daily] toggleCamera error:", e);
    }
  }

  async toggleMicrophone() {
    if (!this.callFrame) return;

    if (!this.allowed.audio) {
      this.updateStatus("⚠️ Micro interdit pour cette phase");
      return;
    }
    try {
      const current = await this.callFrame.localAudio();
      const next = !current;
      this.userPref.audio = next; // store override
      await this.callFrame.setLocalAudio(next);
      await this.updateButtonStates();
    } catch (e) {
      console.error("[Daily] toggleMicrophone error:", e);
    }
  }

  async updateButtonStates() {
    if (!this.callFrame || !this.camButton || !this.micButton) return;

    try {
      const videoOn = await this.callFrame.localVideo();
      const audioOn = await this.callFrame.localAudio();

      // Camera
      this.camButton.style.background = videoOn ? "rgba(0, 255, 255, 0.18)" : "rgba(255, 0, 0, 0.18)";
      this.camButton.style.borderColor = videoOn ? "rgba(0, 255, 255, 0.35)" : "rgba(255, 0, 0, 0.35)";

      // Mic
      this.micButton.style.background = audioOn ? "rgba(0, 255, 255, 0.18)" : "rgba(255, 0, 0, 0.18)";
      this.micButton.style.borderColor = audioOn ? "rgba(0, 255, 255, 0.35)" : "rgba(255, 0, 0, 0.35)";
    } catch (e) {
      // ignore
    }
  }
}

window.dailyVideo = new DailyVideoManager();
console.log("[DailyUI] dailyVideo manager ready ✅", window.dailyVideo.__version);
