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

    // UI: état mobile-friendly persistant (position / taille / dock / visibilité)
    this.uiStateKey = "saboteur.dailyVideo.uiState.v1";
    this.uiState = {
      visible: true,
      minimized: false,
      // dock: tl,tr,bl,br,l,r,t,b,bc,tc ou null
      dock: null,
      left: null,
      top: null,
      width: null,
      height: null,
      // bubble position when hidden
      bubbleDock: "br",
      bubbleLeft: null,
      bubbleTop: null
    };

    // Gestures
    this._pointerDrag = { active: false, pointerId: null, startX: 0, startY: 0, startLeft: 0, startTop: 0 };
    this._pinch = { active: false, startDist: 0, startW: 0, startH: 0 };

    this.camButton = null;
    this.micButton = null;

    // Permissions venant du serveur (autorisations de la phase)
    this.allowed = { video: true, audio: true, reason: "init" };

    // Préférences utilisateur (quand il a le droit). null = pas d'override
    this.userPref = { video: null, audio: null };

    this.isMobile = window.innerWidth < 768;

    // D4: Mode headless forcé par défaut pour utiliser notre propre UI (Salle de Briefing)
    // La fenêtre Daily native ne doit JAMAIS s'afficher - on utilise video-tracks.js + video-briefing-ui.js
    // Pour réactiver l'ancienne UI Daily, ajouter ?legacyDaily=1 dans l'URL
    const params = new URLSearchParams(window.location.search || "");
    this.headless = params.get("legacyDaily") !== "1"; // D4: headless par défaut

    // Safe area (iOS notch etc.)
    this.safeInset = { top: 0, right: 0, bottom: 0, left: 0 };

    // Pour remettre le volume remote quand on "deafen"
    this._remoteVolumes = new Map();
    this._isDeafened = false;

    // Load persisted UI state early
    this.loadUIState();

    // Keep layout sane on viewport changes
    window.addEventListener("resize", () => {
      this.isMobile = window.innerWidth < 768;

      // ne pas basculer automatiquement en headless sur resize
      this.applyUIState({ reason: "resize" });
    });
  }

  // ---------------- persistence ----------------

  loadUIState() {
    try {
      const raw = localStorage.getItem(this.uiStateKey);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        this.uiState = { ...this.uiState, ...parsed };
      }
    } catch {}
  }

  saveUIState() {
    try {
      localStorage.setItem(this.uiStateKey, JSON.stringify(this.uiState));
    } catch {}
  }

  getViewportRect() {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const m = 10;
    return {
      left: this.safeInset.left + m,
      top: this.safeInset.top + m,
      right: vw - this.safeInset.right - m,
      bottom: vh - this.safeInset.bottom - m,
      width: vw - this.safeInset.left - this.safeInset.right - m * 2,
      height: vh - this.safeInset.top - this.safeInset.bottom - m * 2
    };
  }

  clampToViewport(left, top, width, height) {
    const vp = this.getViewportRect();
    const maxLeft = Math.max(vp.left, vp.right - width);
    const maxTop = Math.max(vp.top, vp.bottom - height);
    const nextLeft = Math.min(Math.max(left, vp.left), maxLeft);
    const nextTop = Math.min(Math.max(top, vp.top), maxTop);
    return { left: nextLeft, top: nextTop };
  }

  getSafeInsets() {
    // Read CSS env(safe-area-inset-*) via computed style
    const probe = document.createElement("div");
    probe.style.cssText = `
      position: fixed;
      inset: 0;
      padding: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);
      pointer-events: none;
      visibility: hidden;
    `;
    document.body.appendChild(probe);
    const cs = getComputedStyle(probe);
    const px = (v) => {
      const n = parseFloat((v || "0").toString().replace("px", ""));
      return Number.isFinite(n) ? n : 0;
    };
    const top = px(cs.paddingTop);
    const right = px(cs.paddingRight);
    const bottom = px(cs.paddingBottom);
    const left = px(cs.paddingLeft);
    probe.remove();
    this.safeInset = { top, right, bottom, left };
  }

  // ---------------- critical UI avoidance ----------------

  getCriticalRects() {
    // Heuristics: host force advance button, any controls in #controls, any element marked data-critical="true"
    const els = [];
    const force = document.getElementById("forceAdvanceBtn");
    if (force && force.offsetParent !== null) els.push(force);

    const controls = document.getElementById("controls");
    if (controls && controls.offsetParent !== null) {
      // buttons / selects inside controls
      els.push(...controls.querySelectorAll("button, select, input"));
    }

    const marked = document.querySelectorAll('[data-critical="true"]');
    els.push(...marked);

    // De-duplicate
    const uniq = Array.from(new Set(els));
    return uniq
      .filter((el) => el && el.getBoundingClientRect)
      .map((el) => el.getBoundingClientRect())
      .filter((r) => r.width > 0 && r.height > 0);
  }

  rectsOverlap(a, b) {
    const x1 = Math.max(a.left, b.left);
    const y1 = Math.max(a.top, b.top);
    const x2 = Math.min(a.right, b.right);
    const y2 = Math.min(a.bottom, b.bottom);
    return x2 > x1 && y2 > y1;
  }

  hasCriticalOverlap(containerRect) {
    const critical = this.getCriticalRects();
    return critical.some((r) => this.rectsOverlap(containerRect, r));
  }

  // ---------------- docking ----------------

  getDockCandidates(width, height) {
    const vp = this.getViewportRect();
    const L = vp.left;
    const T = vp.top;
    const R = vp.right - width;
    const B = vp.bottom - height;
    const Cx = vp.left + (vp.width - width) / 2;
    const Cy = vp.top + (vp.height - height) / 2;
    return {
      tl: { left: L, top: T },
      tr: { left: R, top: T },
      bl: { left: L, top: B },
      br: { left: R, top: B },
      l: { left: L, top: Cy },
      r: { left: R, top: Cy },
      t: { left: Cx, top: T },
      b: { left: Cx, top: B },
      bc: { left: Cx, top: B },
      tc: { left: Cx, top: T }
    };
  }

  pickBestDock(currentLeft, currentTop, width, height) {
    const cand = this.getDockCandidates(width, height);
    const order = ["br", "bl", "tr", "tl", "r", "l", "b", "t", "bc", "tc"];

    // Find nearest by euclidean distance, but avoid critical overlaps.
    const scored = order.map((k) => {
      const p = cand[k];
      const dx = p.left - currentLeft;
      const dy = p.top - currentTop;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const rect = { left: p.left, top: p.top, right: p.left + width, bottom: p.top + height };
      const overlap = this.hasCriticalOverlap(rect);
      return { k, p, dist, overlap };
    });

    scored.sort((a, b) => {
      // prefer non-overlap, then distance
      if (a.overlap !== b.overlap) return a.overlap ? 1 : -1;
      return a.dist - b.dist;
    });
    return scored[0];
  }

  applyDock(dockKey, width, height) {
    if (!this.container) return;
    const cand = this.getDockCandidates(width, height);
    const p = cand[dockKey] || cand.br;
    this.setPositionAndSize(p.left, p.top, width, height);
    this.uiState.dock = dockKey;
    this.saveUIState();
  }

  setPositionAndSize(left, top, width, height) {
    if (!this.container) return;
    const vp = this.getViewportRect();
    const minW = this.isMobile ? 220 : 320;
    const minH = this.isMobile ? 240 : 360;
    const maxW = Math.min(vp.width, this.isMobile ? 360 : 520);
    const maxH = Math.min(vp.height, this.isMobile ? 520 : 760);
    const w = Math.min(Math.max(width, minW), maxW);
    const h = Math.min(Math.max(height, minH), maxH);
    const clamped = this.clampToViewport(left, top, w, h);

    this.container.style.right = "auto";
    this.container.style.left = clamped.left + "px";
    this.container.style.top = clamped.top + "px";
    this.container.style.width = w + "px";
    this.container.style.height = h + "px";

    this.uiState.left = clamped.left;
    this.uiState.top = clamped.top;
    this.uiState.width = w;
    this.uiState.height = h;
  }

  applyUIState({ reason } = { reason: "" }) {
    // Called after container is created or when viewport changes
    if (!this.container) return;

    // Ensure safe insets are current (especially on iOS orientation changes)
    try { this.getSafeInsets(); } catch {}

    const vp = this.getViewportRect();

    // Size defaults / fallback
    const def = this.isMobile
      ? { w: 300, h: 420, dock: "br" }
      : { w: 420, h: 650, dock: "tr" };

    const w = this.uiState.width || def.w;
    const h = this.uiState.height || def.h;

    // Position logic: prefer dock, else saved left/top, else default dock
    let left = this.uiState.left;
    let top = this.uiState.top;

    if (this.uiState.dock) {
      const p = this.getDockCandidates(w, h)[this.uiState.dock] || this.getDockCandidates(w, h)[def.dock];
      left = p.left;
      top = p.top;
    } else if (left == null || top == null) {
      const p = this.getDockCandidates(w, h)[def.dock];
      left = p.left;
      top = p.top;
      this.uiState.dock = def.dock;
    }

    // Clamp to viewport
    const clamped = this.clampToViewport(left, top, w, h);
    this.setPositionAndSize(clamped.left, clamped.top, w, h);

    // Avoid covering critical UI on load/resize (best-effort)
    const rect = this.container.getBoundingClientRect();
    if (this.hasCriticalOverlap(rect)) {
      const best = this.pickBestDock(rect.left, rect.top, rect.width, rect.height);
      if (best) {
        this.uiState.dock = best.k;
        this.setPositionAndSize(best.p.left, best.p.top, rect.width, rect.height);
      }
    }

    // Visible/minimized
    if (this.uiState.visible) {
      this.container.style.setProperty("display", "flex", "important");
      if (this.launcher) this.launcher.style.display = "none";
    } else {
      this.container.style.setProperty("display", "none", "important");
      if (this.launcher) this.launcher.style.display = "block";
    }

    if (this.grid) {
      const shouldHide = !!this.uiState.minimized;
      this.grid.style.display = shouldHide ? "none" : "block";
      this.container.classList.toggle("minimized", shouldHide);
    }

    // Keep within viewport (defensive)
    const r2 = this.container.getBoundingClientRect();
    const cl2 = this.clampToViewport(r2.left, r2.top, r2.width, r2.height);
    if (cl2.left !== r2.left || cl2.top !== r2.top) {
      this.setPositionAndSize(cl2.left, cl2.top, r2.width, r2.height);
    }

    this.saveUIState();
  }

  // ---------------- UI ----------------

  initContainer() {
    if (this.container) return;

    this.loadUIState();

    this.container = document.createElement("div");
    this.container.id = "dailyVideoContainer";
    this.container.className = "daily-video-container";

    // Resolve safe insets once body exists
    this.getSafeInsets();

    // Taille de base (comme la V0-0): stable et garantit que le header reste accessible.
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
      resize: ${this.isMobile ? "none" : "both"};
      overflow: hidden;
      touch-action: none;
`;
    // D3: headless = conteneur invisible (on garde l'iframe Daily pour les tracks, mais aucune UI flottante)
    if (this.headless) {
      this.container.style.setProperty("display", "block", "important");
      this.container.style.setProperty("opacity", "0", "important");
      this.container.style.setProperty("pointer-events", "none", "important");
      this.container.style.setProperty("width", "1px", "important");
      this.container.style.setProperty("height", "1px", "important");
      this.container.style.setProperty("left", "0", "important");
      this.container.style.setProperty("top", "0", "important");
      this.container.style.setProperty("transform", "translate(-200%, -200%)", "important");
      this.container.style.setProperty("z-index", "-1", "important");
      this.container.setAttribute("aria-hidden", "true");
    }

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

    // V9.3.8: Écran "Phase privée" (masqué par défaut)
    this.privatePhaseScreen = document.createElement("div");
    this.privatePhaseScreen.id = "privatePhaseScreen";
    this.privatePhaseScreen.style.cssText = `
      display: none;
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: #000;
      z-index: 1000;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: #fff;
      text-align: center;
      padding: 20px;
    `;
    this.privatePhaseScreen.innerHTML = `
      <div style="font-size: 4rem; margin-bottom: 20px;">🌙</div>
      <div style="font-size: 1.5rem; font-weight: bold; margin-bottom: 10px;">Phase privée</div>
      <div style="font-size: 1rem; opacity: 0.7;">Caméra et micro désactivés</div>
    `;

    // Ensure it is actually in the DOM and above the iframe
    this.grid.appendChild(this.privatePhaseScreen);

    document.body.appendChild(this.container);

    // UI: bouton lanceur (si on ferme la fenêtre)
    this.ensureLauncher();

    // Restore initial position / size (and visibility) once in DOM
    this.restoreUIAfterMount();

    // UI: drag & drop + pinch on header (mobile-friendly)
    this.setupHeaderGestures(header);

    // When viewport changes (rotation, keyboard), keep window visible and clamped
    window.addEventListener("resize", () => {
      this.getSafeInsets();
      this.reflowIntoViewport();
    });

    console.log("[DailyUI] Container injected (v5.2-ui).");
  }

  restoreUIAfterMount() {
    const vp = this.getViewportRect();

    // Defaults
    const defaultW = this.isMobile ? 320 : 420;
    const defaultH = this.isMobile ? 460 : 650;
    const w = Number.isFinite(this.uiState.width) ? this.uiState.width : defaultW;
    const h = Number.isFinite(this.uiState.height) ? this.uiState.height : defaultH;

    // If dock stored: apply dock
    if (this.uiState.dock) {
      this.applyDock(this.uiState.dock, w, h);
    } else if (Number.isFinite(this.uiState.left) && Number.isFinite(this.uiState.top)) {
      this.setPositionAndSize(this.uiState.left, this.uiState.top, w, h);
      this.saveUIState();
    } else {
      // pick a sane default dock that avoids critical buttons
      const best = this.pickBestDock(vp.right - w, vp.bottom - h, w, h);
      this.applyDock(best.k, w, h);
    }

    // restore minimized / visibility
    if (this.uiState.minimized) {
      this.grid.style.display = "none";
    }
    if (this.uiState.visible === false) {
      this.hideWindow(false);
    }
  }

  reflowIntoViewport() {
    if (!this.container) return;
    const rect = this.container.getBoundingClientRect();
    const clamped = this.clampToViewport(rect.left, rect.top, rect.width, rect.height);
    this.setPositionAndSize(clamped.left, clamped.top, rect.width, rect.height);
    // If overlapping critical UI after reflow, snap away
    const nextRect = this.container.getBoundingClientRect();
    if (this.hasCriticalOverlap(nextRect)) {
      const best = this.pickBestDock(nextRect.left, nextRect.top, nextRect.width, nextRect.height);
      this.applyDock(best.k, nextRect.width, nextRect.height);
    }
    this.saveUIState();
  }

  setupHeaderGestures(header) {
    if (!header) return;

    // Pointer-based drag (works for mouse + touch)
    const onPointerDown = (ev) => {
      if (ev.target && ev.target.tagName === "BUTTON") return;
      // Ignore right click
      if (ev.pointerType === "mouse" && ev.button !== 0) return;

      this._pointerDrag.active = true;
      this._pointerDrag.pointerId = ev.pointerId;
      this._pointerDrag.startX = ev.clientX;
      this._pointerDrag.startY = ev.clientY;
      const rect = this.container.getBoundingClientRect();
      this._pointerDrag.startLeft = rect.left;
      this._pointerDrag.startTop = rect.top;
      this.uiState.dock = null; // leaving dock mode
      this.container.style.right = "auto";
      try { header.setPointerCapture(ev.pointerId); } catch {}
      ev.preventDefault?.();
    };

    const onPointerMove = (ev) => {
      if (!this._pointerDrag.active) return;
      if (this._pointerDrag.pointerId !== ev.pointerId) return;

      const dx = ev.clientX - this._pointerDrag.startX;
      const dy = ev.clientY - this._pointerDrag.startY;

      const rect = this.container.getBoundingClientRect();
      const nextLeft = this._pointerDrag.startLeft + dx;
      const nextTop = this._pointerDrag.startTop + dy;
      this.setPositionAndSize(nextLeft, nextTop, rect.width, rect.height);
      ev.preventDefault?.();
    };

    const onPointerUp = (ev) => {
      if (!this._pointerDrag.active) return;
      if (this._pointerDrag.pointerId !== ev.pointerId) return;
      this._pointerDrag.active = false;
      this._pointerDrag.pointerId = null;

      // Snap to best dock after drag end
      const rect = this.container.getBoundingClientRect();
      const best = this.pickBestDock(rect.left, rect.top, rect.width, rect.height);
      this.applyDock(best.k, rect.width, rect.height);
      this.saveUIState();
    };

    header.addEventListener("pointerdown", onPointerDown);
    header.addEventListener("pointermove", onPointerMove);
    header.addEventListener("pointerup", onPointerUp);
    header.addEventListener("pointercancel", onPointerUp);

    // Pinch-to-zoom (optional): only on touch, only on header
    header.addEventListener(
      "touchstart",
      (ev) => {
        if (ev.touches?.length === 2) {
          const t1 = ev.touches[0];
          const t2 = ev.touches[1];
          const dx = t2.clientX - t1.clientX;
          const dy = t2.clientY - t1.clientY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const rect = this.container.getBoundingClientRect();
          this._pinch = { active: true, startDist: dist, startW: rect.width, startH: rect.height };
          this.uiState.dock = null;
          ev.preventDefault?.();
        }
      },
      { passive: false }
    );
    header.addEventListener(
      "touchmove",
      (ev) => {
        if (!this._pinch.active || ev.touches?.length !== 2) return;
        const t1 = ev.touches[0];
        const t2 = ev.touches[1];
        const dx = t2.clientX - t1.clientX;
        const dy = t2.clientY - t1.clientY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const scale = dist / (this._pinch.startDist || dist);
        const rect = this.container.getBoundingClientRect();
        const nextW = this._pinch.startW * scale;
        const nextH = this._pinch.startH * scale;
        this.setPositionAndSize(rect.left, rect.top, nextW, nextH);
        ev.preventDefault?.();
      },
      { passive: false }
    );
    header.addEventListener(
      "touchend",
      () => {
        if (!this._pinch.active) return;
        this._pinch.active = false;
        const rect = this.container.getBoundingClientRect();
        const best = this.pickBestDock(rect.left, rect.top, rect.width, rect.height);
        this.applyDock(best.k, rect.width, rect.height);
        this.saveUIState();
      },
      { passive: true }
    );
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

  // --------------- Daily join / lifecycle ----------------

  async joinRoom(roomUrl, userName, permissions = { video: true, audio: true }) {
    // D4: En mode headless, on n'initialise PAS le container UI Daily
    if (!this.headless) {
      this.initContainer();
      this.showWindow();
    }
    
    console.log('[DailyUI] joinRoom called, headless:', this.headless);
    
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
      this.callObject = null;
    }

    // D4: Utiliser CallObject (headless) au lieu de Frame pour contrôle total
    // Le Frame crée une UI Daily visible - le CallObject est purement API
    if (this.headless) {
      // Mode D4: CallObject headless
      this.callFrame = window.DailyIframe.createCallObject({
        dailyConfig: {
          experimentalChromeVideoMuteLightOff: true
        }
      });
      // Exposer pour video-tracks.js
      this.callObject = this.callFrame;
    } else {
      // Mode legacy: Frame avec UI Daily
      this.callFrame = window.DailyIframe.createFrame(this.grid, {
        iframeStyle: { width: "100%", height: "100%", border: "none" },
        showLeaveButton: false,
        showFullscreenButton: false
      });
    }

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
      if (!this.headless) this.container?.style.setProperty("display", "flex", "important");
      this.updateStatus("Connexion à la réunion…");
    });

    this.callFrame.on("joined-meeting", async () => {
      if (!this.headless) this.container?.style.setProperty("display", "flex", "important");
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
    if (this.headless) return;

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
      touch-action: none;
    `;

    // Bubble drag + snap too
    const bubbleDrag = { active: false, pointerId: null, startX: 0, startY: 0, startLeft: 0, startTop: 0 };

    const setBubblePos = (left, top) => {
      const vp = this.getViewportRect();
      const w = 52;
      const h = 52;
      const clamped = this.clampToViewport(left, top, w, h);
      btn.style.left = clamped.left + "px";
      btn.style.top = clamped.top + "px";
      btn.style.right = "auto";
      btn.style.bottom = "auto";
      this.uiState.bubbleLeft = clamped.left;
      this.uiState.bubbleTop = clamped.top;
    };

    const bubbleCandidates = () => {
      const vp = this.getViewportRect();
      const w = 52;
      const h = 52;
      const L = vp.left;
      const T = vp.top;
      const R = vp.right - w;
      const B = vp.bottom - h;
      return {
        tl: { left: L, top: T },
        tr: { left: R, top: T },
        bl: { left: L, top: B },
        br: { left: R, top: B },
        r: { left: R, top: vp.top + (vp.height - h) / 2 },
        l: { left: L, top: vp.top + (vp.height - h) / 2 },
        b: { left: vp.left + (vp.width - w) / 2, top: B },
        t: { left: vp.left + (vp.width - w) / 2, top: T }
      };
    };

    const snapBubble = () => {
      const rect = btn.getBoundingClientRect();
      const cand = bubbleCandidates();
      const order = ["br", "bl", "tr", "tl", "r", "l", "b", "t"];
      let best = { k: "br", dist: Infinity };
      for (const k of order) {
        const p = cand[k];
        const dx = p.left - rect.left;
        const dy = p.top - rect.top;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < best.dist) best = { k, dist: d, p };
      }
      setBubblePos(best.p.left, best.p.top);
      this.uiState.bubbleDock = best.k;
      this.saveUIState();
    };

    const onBubbleDown = (ev) => {
      if (ev.pointerType === "mouse" && ev.button !== 0) return;
      bubbleDrag.active = true;
      bubbleDrag.pointerId = ev.pointerId;
      bubbleDrag.startX = ev.clientX;
      bubbleDrag.startY = ev.clientY;
      const rect = btn.getBoundingClientRect();
      bubbleDrag.startLeft = rect.left;
      bubbleDrag.startTop = rect.top;
      try { btn.setPointerCapture(ev.pointerId); } catch {}
      ev.preventDefault?.();
    };
    const onBubbleMove = (ev) => {
      if (!bubbleDrag.active || bubbleDrag.pointerId !== ev.pointerId) return;
      const dx = ev.clientX - bubbleDrag.startX;
      const dy = ev.clientY - bubbleDrag.startY;
      setBubblePos(bubbleDrag.startLeft + dx, bubbleDrag.startTop + dy);
      ev.preventDefault?.();
    };
    const onBubbleUp = (ev) => {
      if (!bubbleDrag.active || bubbleDrag.pointerId !== ev.pointerId) return;
      bubbleDrag.active = false;
      bubbleDrag.pointerId = null;
      snapBubble();
    };

    btn.addEventListener("pointerdown", onBubbleDown);
    btn.addEventListener("pointermove", onBubbleMove);
    btn.addEventListener("pointerup", onBubbleUp);
    btn.addEventListener("pointercancel", onBubbleUp);

    btn.onclick = (ev) => {
      // If we dragged significantly, ignore click
      if (bubbleDrag.active) return;
      this.showWindow();
      ev.preventDefault?.();
    };

    // IMPORTANT: append first so getBoundingClientRect() is correct (sinon snap => (0,0) => coin haut-gauche)
    document.body.appendChild(btn);

    // Restore bubble position
    const cand = bubbleCandidates();
    const p = cand[this.uiState.bubbleDock] || cand.br;
    const bx = Number.isFinite(this.uiState.bubbleLeft) ? this.uiState.bubbleLeft : p.left;
    const by = Number.isFinite(this.uiState.bubbleTop) ? this.uiState.bubbleTop : p.top;
    setBubblePos(bx, by);
    snapBubble();
    this.launcher = btn;
  }

  showWindow() {
    if (!this.container) return;
    this.container.style.setProperty("display", "flex", "important");
    if (this.launcher) this.launcher.style.display = "none";
    this.uiState.visible = true;
    this.saveUIState();
    // After showing, ensure it doesn't cover critical UI
    setTimeout(() => this.reflowIntoViewport(), 0);
  }

  hideWindow(save = true) {
    if (!this.container) return;
    this.container.style.setProperty("display", "none", "important");
    this.ensureLauncher();
    if (this.launcher) this.launcher.style.display = "block";
    this.uiState.visible = false;
    if (save) this.saveUIState();
  }

  toggleMinimize() {
    if (!this.grid) return;
    const hidden = this.grid.style.display === "none";
    this.grid.style.display = hidden ? "block" : "none";
    this.uiState.minimized = !hidden;
    this.saveUIState();
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

    // V32: Si le joueur n'a pas les crédits vidéo, désactiver complètement micro/caméra
    const canBroadcast = window.canBroadcastVideo !== false; // true par défaut si non défini
    if (!canBroadcast) {
      this.allowed.video = false;
      this.allowed.audio = false;
      this.allowed.reason = "Crée un compte pour diffuser";
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
      // V32: Ne pas deafen si c'est juste un problème de crédits (le joueur peut écouter)
      if (canBroadcast) {
        await this.deafenRemotes(true);
      }
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
    if (!canBroadcast) this.updateStatus("👀 Mode spectateur");
    else if (!this.allowed.video && this.allowed.audio) this.updateStatus("🎧 Audio only");
    else if (this.allowed.video && this.allowed.audio) this.updateStatus("✅ Vidéo + audio");
    else if (!this.allowed.video && !this.allowed.audio) this.updateStatus("😴 Phase privée");


    // V9.3.8: Afficher écran "Phase privée" si aucune permission
    if (this.privatePhaseScreen) {
      if (!this.allowed.video && !this.allowed.audio) {
        this.privatePhaseScreen.style.display = "flex";
        this.grid.style.display = "none"; // Masquer la grille vidéo
      } else {
        this.privatePhaseScreen.style.display = "none";
        this.grid.style.display = "block"; // Afficher la grille vidéo
      }
    }
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