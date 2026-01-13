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
    // simple guard: uuid-ish or at least length
    if (maybe.length < 6) return "";
    return maybe;
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

  function bindToDailyApi(api) {
    if (!api || bound) return;
    bound = true;

    log("Binding to Daily api");

    // Helper: attach any already-available tracks (important if we bind after join)
    const attachExisting = () => {
      try {
        const partsObj = api.participants && api.participants();
        if (!partsObj) return;
        const parts = Object.values(partsObj);
        for (const p of parts) {
          if (!p) continue;
          const peerKey = p?.session_id || p?.peerId || p?.id || "";
          const pid = parsePlayerIdFromUserName(p?.user_name) || "";
          if (peerKey && pid) peerToPlayerId.set(peerKey, pid);

          const trackObj = p?.tracks?.video || null;
          const track = trackObj?.persistentTrack || trackObj?.track || null;
          if (track && track.kind === "video") {
            attachTrackToPlayer(pid, track, !!p?.local);
          }
        }
      } catch (e) {
        console.warn("[VideoTracks] attachExisting failed", e);
      }
    };

    api.on("participant-joined", (ev) => {
      const p = ev?.participant;
      const peerKey = p?.session_id || p?.peerId || p?.id || "";
      const pid = parsePlayerIdFromUserName(p?.user_name);
      if (peerKey && pid) peerToPlayerId.set(peerKey, pid);

      // If video already present in participant object, attach it
      const trackObj = p?.tracks?.video || null;
      const track = trackObj?.persistentTrack || trackObj?.track || null;
      if (track && track.kind === "video") attachTrackToPlayer(pid, track, !!p?.local);
    });

    api.on("participant-updated", (ev) => {
      const p = ev?.participant;
      const peerKey = p?.session_id || p?.peerId || p?.id || "";
      const pid = parsePlayerIdFromUserName(p?.user_name);
      if (peerKey && pid) peerToPlayerId.set(peerKey, pid);

      const trackObj = p?.tracks?.video || null;
      const track = trackObj?.persistentTrack || trackObj?.track || null;
      if (track && track.kind === "video") {
        attachTrackToPlayer(pid, track, !!p?.local);
      }
    });

    api.on("participant-left", (ev) => {
      const p = ev?.participant;
      const peerKey = p?.session_id || p?.peerId || p?.id || "";
      const pid = peerToPlayerId.get(peerKey);
      if (pid) {
        peerToPlayerId.delete(peerKey);
        detachPlayer(pid);
      }
    });

    api.on("track-started", (ev) => {
      const t = ev?.track;
      if (!t || t.kind !== "video") return;
      const p = ev?.participant;
      const peerKey = p?.session_id || p?.peerId || p?.id || "";
      const pid = peerToPlayerId.get(peerKey) || parsePlayerIdFromUserName(p?.user_name) || "";
      if (!pid) return;
      peerToPlayerId.set(peerKey, pid);
      attachTrackToPlayer(pid, t, !!p?.local);
    });

    api.on("track-stopped", (ev) => {
      const t = ev?.track;
      if (!t || t.kind !== "video") return;
      const p = ev?.participant;
      const peerKey = p?.session_id || p?.peerId || p?.id || "";
      const pid = peerToPlayerId.get(peerKey) || parsePlayerIdFromUserName(p?.user_name) || "";
      if (pid) detachPlayer(pid);
    });

    api.on("active-speaker-change", (ev) => {
      const peerId = ev?.peerId || ev?.activeSpeaker?.peerId || "";
      const pid = peerToPlayerId.get(peerId) || "";
      setSpeaking(pid);
    });

    // Re-attach on players list re-render
    const list = document.querySelector("#playersList") || document.querySelector(".players-list") || null;
    if (list && window.MutationObserver) {
      const obs = new MutationObserver(() => {
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

    // Critical: if we bound after join, attach existing tracks now (and again shortly after)
    attachExisting();
    setTimeout(attachExisting, 800);
  }

  function waitForDailyApi() {
    const dv = window.dailyVideo;
    const api = dv && (dv.callObject || dv.callFrame);
    if (api && api.on && api.participants) {
      bindToDailyApi(api);
      return;
    }
    setTimeout(waitForDailyApi, 500);
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
      waitForDailyApi();
    });
  } else {
    mountButton();
    waitForDailyApi();
  }
})();
