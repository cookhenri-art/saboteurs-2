/* =========================================================
   D4 BRIEFING MODE - Inline video thumbnails per player (Daily CallObject)
   - NO Daily floating UI
   - Attach video tracks into .player-video-slot[data-player-id]
   - Re-attach if players list re-renders
   - Active speaker highlight (.is-speaking on .player-item)
   - D4: Integration with VideoModeController and BriefingUI
========================================================= */
(function () {
  "use strict";

  const DEBUG = false;

  const peerToPlayerId = new Map();  // session_id/peerId -> playerId
  const videoTracks = new Map();     // playerId -> MediaStreamTrack
  const videoEls = new Map();        // playerId -> <video>
  let currentSpeaking = null;
  let bound = false;

  function log(...args) { if (DEBUG) console.log("[VideoTracks]", ...args); }

  // D4: Export registry for external access
  window.VideoTracksRegistry = {
    getAll: () => new Map(videoTracks),
    get: (playerId) => videoTracks.get(playerId),
    has: (playerId) => videoTracks.has(playerId)
  };

  function parsePlayerIdFromUserName(userName) {
    if (!userName) return "";
    const idx = userName.lastIndexOf("#");
    if (idx === -1) return "";
    return userName.slice(idx + 1).trim();
  }

  function getLocalPlayerId() {
    // Prefer lastKnownState, then window.playerId (debug), then empty
    const st = window.lastKnownState;
    return st?.you?.playerId || window.playerId || "";
  }

  function getSlot(playerId) {
    if (!playerId) return null;
    // Current client.js uses: <div class="player-video-slot" data-player-id="...">
    return document.querySelector(`.player-video-slot[data-player-id="${CSS.escape(playerId)}"]`);
  }

  function getPlayerRow(playerId) {
    if (!playerId) return null;
    return document.querySelector(`.player-item[data-player-id="${CSS.escape(playerId)}"]`);
  }

  function ensureVideoEl(playerId, isLocal) {
    if (videoEls.has(playerId)) return videoEls.get(playerId);
    const v = document.createElement("video");
    v.autoplay = true;
    v.playsInline = true;
    v.muted = !!isLocal; // avoid echo
    v.setAttribute("webkit-playsinline", "true");
    v.style.width = "100%";
    v.style.height = "100%";
    v.style.objectFit = "cover";
    v.style.borderRadius = "8px";
    videoEls.set(playerId, v);
    return v;
  }

  function attachTrackToPlayer(playerId, track, isLocal) {
    if (!playerId || !track) return;
    const slot = getSlot(playerId);
    if (!slot) return;

    const v = ensureVideoEl(playerId, isLocal);
    const stream = new MediaStream([track]);
    try { v.srcObject = stream; } catch { v.src = URL.createObjectURL(stream); }

    if (!slot.contains(v)) {
      slot.innerHTML = "";
      slot.appendChild(v);
    }
  }

  function reattachAll() {
    for (const [pid, track] of videoTracks.entries()) {
      attachTrackToPlayer(pid, track, pid === getLocalPlayerId());
    }
    // restore speaking highlight
    if (currentSpeaking) {
      const row = getPlayerRow(currentSpeaking);
      if (row) row.classList.add("is-speaking");
    }
  }

  function setSpeaking(playerId) {
    // clear previous
    document.querySelectorAll(".player-item.is-speaking").forEach(el => el.classList.remove("is-speaking"));
    currentSpeaking = playerId || null;
    if (!currentSpeaking) return;
    const row = getPlayerRow(currentSpeaking);
    if (row) row.classList.add("is-speaking");
  }

  function bindToCallObject(callObject) {
    if (!callObject || bound) return;
    bound = true;

    log("Binding to callObject");

    callObject.on("participant-joined", (ev) => {
      const p = ev?.participant;
      const peerKey = p?.session_id || p?.peerId || p?.id || "";
      const pid = parsePlayerIdFromUserName(p?.user_name);
      if (peerKey && pid) peerToPlayerId.set(peerKey, pid);
    });

    callObject.on("participant-updated", (ev) => {
      const p = ev?.participant;
      const peerKey = p?.session_id || p?.peerId || p?.id || "";
      const pid = parsePlayerIdFromUserName(p?.user_name);
      if (peerKey && pid) peerToPlayerId.set(peerKey, pid);
    });

    callObject.on("track-started", (ev) => {
      if (ev?.track?.kind !== "video") return;
      const p = ev?.participant;
      const isLocal = !!p?.local;

      const peerKey = p?.session_id || p?.peerId || p?.id || "";
      const pid =
        (isLocal ? getLocalPlayerId() : "") ||
        peerToPlayerId.get(peerKey) ||
        parsePlayerIdFromUserName(p?.user_name) ||
        "";

      if (!pid) return;

      videoTracks.set(pid, ev.track);
      attachTrackToPlayer(pid, ev.track, isLocal);
      
      // D4: Notifier le Briefing UI
      if (window.VideoBriefingUI) {
        window.VideoBriefingUI.onTrackStarted(pid, ev.track);
      }
    });

    callObject.on("track-stopped", (ev) => {
      if (ev?.track?.kind !== "video") return;
      const p = ev?.participant;
      const peerKey = p?.session_id || p?.peerId || p?.id || "";
      const pid = peerToPlayerId.get(peerKey) || parsePlayerIdFromUserName(p?.user_name) || "";
      if (!pid) return;

      videoTracks.delete(pid);
      const slot = getSlot(pid);
      if (slot) slot.innerHTML = "";
      
      // D4: Notifier le Briefing UI
      if (window.VideoBriefingUI) {
        window.VideoBriefingUI.onTrackStopped(pid);
      }
    });

    callObject.on("active-speaker-change", (ev) => {
      const peerId = ev?.peerId || ev?.activeSpeaker?.peerId || "";
      const pid = peerToPlayerId.get(peerId) || "";
      setSpeaking(pid);
      
      // D4: Notifier le VideoModeController
      if (window.videoModeCtrl && pid) {
        window.videoModeCtrl.setActiveSpeaker(pid);
      }
    });

    // Observe rerenders of players list
    const list = document.querySelector("#playersList") || document.querySelector(".players-list") || null;
    if (list && window.MutationObserver) {
      const obs = new MutationObserver(() => reattachAll());
      obs.observe(list, { childList: true, subtree: true });
    }

    // Initial reattach after a short delay (slots may appear after bind)
    setTimeout(reattachAll, 600);
    setTimeout(reattachAll, 1500);
  }

  function waitForCallObject() {
    const co = window.dailyVideo && window.dailyVideo.callObject;
    if (co) {
      bindToCallObject(co);
      return;
    }
    setTimeout(waitForCallObject, 300);
  }

  function mountButton() {
    // Keep existing UI button if present; only add fallback on mobile
    const existing = document.querySelector("#videoToggleButton");
    if (existing) return;

    // Fallback button bottom-left (mobile friendly)
    const btn = document.createElement("button");
    btn.id = "videoToggleButton";
    btn.textContent = "🎥 Activer la visio";
    btn.style.cssText = `
      position: fixed;
      left: 14px;
      bottom: 14px;
      z-index: 2147483647;
      padding: 10px 12px;
      border-radius: 12px;
      border: 1px solid rgba(255,255,255,0.18);
      background: rgba(0,0,0,0.55);
      color: #fff;
      font-size: 14px;
      cursor: pointer;
      backdrop-filter: blur(8px);
    `;
    document.body.appendChild(btn);

    btn.onclick = () => {
      if (window.VideoIntegration && typeof window.VideoIntegration.requestVideoStart === "function") {
        window.VideoIntegration.requestVideoStart();
        btn.textContent = "🎥 Visio demandée…";
        setTimeout(() => { btn.textContent = "🎥 Visio activée"; }, 1200);
      } else {
        console.warn("[VideoTracks] VideoIntegration API not ready yet");
      }
    };
  }

  // Boot
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      mountButton();
      waitForCallObject();
    });
  } else {
    mountButton();
    waitForCallObject();
  }
})();
