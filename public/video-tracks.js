/* =========================================================
   D3 - Video Tracks Inline (Headless Daily CallFrame)
   - Aucune UI Daily flottante
   - Vignettes par joueur dans la players-list
   - Highlight active speaker (classe .is-speaking)
   - Bouton d'activation (gesture mobile) -> délègue à window.VideoIntegration.requestVideoStart()
========================================================= */

(function () {
  "use strict";

  const DEBUG = false;

  const peerToPlayerId = new Map();      // session_id/peerId -> playerId
  const playerToVideoEl = new Map();     // playerId -> <video>
  let currentSpeaking = null;
  let bound = false;

  function log(...args) { if (DEBUG) console.log("[VideoTracks]", ...args); }

  function parsePlayerIdFromUserName(userName) {
    if (!userName) return "";
    const idx = userName.lastIndexOf("#");
    if (idx === -1) return "";
    const maybe = userName.slice(idx + 1).trim();
    // Accept any non-empty id after '#'.
    // (Some deployments use short ids; we only guard against empty.)
    if (!maybe) return "";
    return maybe;
  }

  function resolvePlayerId(participant) {
    // 1) Preferred: id encoded as "Name#<playerId>"
    const pid = parsePlayerIdFromUserName(participant?.user_name);
    if (pid && getPlayerRow(pid)) return pid;

    // 2) Fallback: match by base name against lastKnownState.players
    // Useful if someone joined with a wrong id (e.g. socket id) but names are unique.
    const raw = (participant?.user_name || "").trim();
    const base = raw.includes("#") ? raw.split("#")[0].trim() : raw;
    if (!base) return "";

    const st = window.lastKnownState;
    const players = st?.players || [];
    const match = players.find(p => (p?.name || "").trim() === base);
    const fallbackId = match?.playerId || "";
    if (fallbackId && getPlayerRow(fallbackId)) return fallbackId;
    return "";
  }

  function getPlayerRow(playerId) {
    if (!playerId) return null;
    return document.querySelector(`.player-item[data-player-id="${CSS.escape(playerId)}"]`);
  }

  function getSlot(playerId) {
    const row = getPlayerRow(playerId);
    if (!row) return null;
    return row.querySelector(".player-video-slot") || null;
  }

  function ensureVideoEl(playerId, isLocal) {
    let v = playerToVideoEl.get(playerId);
    if (v) return v;

    v = document.createElement("video");
    v.autoplay = true;
    v.playsInline = true;
    v.muted = !!isLocal; // évite feedback local
    v.setAttribute("muted", v.muted ? "" : null);
    v.className = "player-video";

    playerToVideoEl.set(playerId, v);
    return v;
  }

  function attachTrackToPlayer(playerId, track, isLocal) {
    if (!playerId || !track) return;
    const slot = getSlot(playerId);
    if (!slot) return;

    const v = ensureVideoEl(playerId, isLocal);
    const stream = new MediaStream([track]);
    try {
      v.srcObject = stream;
    } catch (e) {
      // fallback for very old browsers
      v.src = URL.createObjectURL(stream);
    }

    if (!slot.contains(v)) {
      slot.innerHTML = "";
      slot.appendChild(v);
    }
  }

  function detachPlayer(playerId) {
    const v = playerToVideoEl.get(playerId);
    if (v) {
      try { v.srcObject = null; } catch {}
      if (v.parentNode) v.parentNode.removeChild(v);
      playerToVideoEl.delete(playerId);
    }
    const row = getPlayerRow(playerId);
    if (row) row.classList.remove("is-speaking");
  }

  function setSpeaking(playerId) {
    if (currentSpeaking === playerId) return;
    if (currentSpeaking) {
      const prev = getPlayerRow(currentSpeaking);
      if (prev) prev.classList.remove("is-speaking");
    }
    currentSpeaking = playerId || null;
    if (currentSpeaking) {
      const row = getPlayerRow(currentSpeaking);
      if (row) row.classList.add("is-speaking");
    }
  }

  function bindToCallFrame(callFrame) {
    if (!callFrame || bound) return;
    bound = true;

    log("Binding to callFrame");

    callFrame.on("participant-joined", (ev) => {
      const p = ev?.participant;
      const peerKey = p?.session_id || p?.peerId || p?.id || "";
      const pid = resolvePlayerId(p);
      if (peerKey && pid) peerToPlayerId.set(peerKey, pid);
    });

    callFrame.on("participant-updated", (ev) => {
      const p = ev?.participant;
      const peerKey = p?.session_id || p?.peerId || p?.id || "";
      const pid = resolvePlayerId(p);
      if (peerKey && pid) peerToPlayerId.set(peerKey, pid);
    });

    callFrame.on("participant-left", (ev) => {
      const p = ev?.participant;
      const peerKey = p?.session_id || p?.peerId || p?.id || "";
      const pid = peerToPlayerId.get(peerKey);
      if (pid) {
        peerToPlayerId.delete(peerKey);
        detachPlayer(pid);
      }
    });

    callFrame.on("track-started", (ev) => {
      if (ev?.track?.kind !== "video") return;
      const p = ev?.participant;
      const peerKey = p?.session_id || p?.peerId || p?.id || "";
      const pid = peerToPlayerId.get(peerKey) || resolvePlayerId(p) || "";
      if (!pid) return;
      peerToPlayerId.set(peerKey, pid);
      const isLocal = !!p?.local;
      attachTrackToPlayer(pid, ev.track, isLocal);
    });

    callFrame.on("track-stopped", (ev) => {
      if (ev?.track?.kind !== "video") return;
      const p = ev?.participant;
      const peerKey = p?.session_id || p?.peerId || p?.id || "";
      const pid = peerToPlayerId.get(peerKey) || resolvePlayerId(p) || "";
      if (pid) detachPlayer(pid);
    });

    callFrame.on("active-speaker-change", (ev) => {
      const peerId = ev?.peerId || ev?.activeSpeaker?.peerId || "";
      const pid = peerToPlayerId.get(peerId) || "";
      setSpeaking(pid);
    });

    // Re-attach on players list re-render
    const list = document.querySelector("#playersList") || document.querySelector(".players-list") || null;
    if (list && window.MutationObserver) {
      const obs = new MutationObserver(() => {
        // re-append existing videos into new slots
        for (const [pid, v] of playerToVideoEl.entries()) {
          const slot = getSlot(pid);
          if (slot && !slot.contains(v)) {
            slot.innerHTML = "";
            slot.appendChild(v);
          }
        }
        if (currentSpeaking) {
          const row = getPlayerRow(currentSpeaking);
          if (row) row.classList.add("is-speaking");
        }
      });
      obs.observe(list, { childList: true, subtree: true });
    }

    // Expose helpers
    window.VideoTracks = window.VideoTracks || {};
    window.VideoTracks.getVideoElForPlayer = (playerId) => playerToVideoEl.get(playerId) || null;
  }

  function waitForCallFrame() {
    const cf = window.dailyVideo && window.dailyVideo.callFrame;
    if (cf) {
      bindToCallFrame(cf);
      return;
    }
    setTimeout(waitForCallFrame, 500);
  }

  function mountButton() {
    // If an older button exists, keep it
    let btn = document.getElementById("daily-tracks-btn");
    if (!btn) {
      btn = document.createElement("button");
      btn.id = "daily-tracks-btn";
      btn.type = "button";
      btn.textContent = "🎥 Activer la visio";
      btn.style.cssText = `
        position: fixed;
        left: 18px;
        bottom: 18px;
        z-index: 9999;
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
    } else {
      btn.textContent = "🎥 Activer la visio";
    }

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
      waitForCallFrame();
    });
  } else {
    mountButton();
    waitForCallFrame();
  }
})();
