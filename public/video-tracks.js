/* =========================================================
   D2.2 — Daily Tracks inline dans Players List (mobile-safe)
   - Un bouton d'activation (gesture requis sur mobile)
   - Joins la room Daily via l'API du serveur (source de vérité)
   - Attache les tracks vidéo dans les slots de la players-list
   - Non destructif: ne touche pas à DailyVideo (iframe) existant
   ========================================================= */

(function () {
  if (window.DAILY_TRACKS_LOADED) return;
  window.DAILY_TRACKS_LOADED = true;

  const STORAGE = {
    playerId: "is_playerId",
    name: "is_name",
    room: "is_roomCode",
    enabled: "is_daily_tracks_enabled"
  };

  let callObject = null;
  let started = false;

  // Track cache: playerId -> MediaStreamTrack
  const videoTracks = new Map();
  // Daily peer/session -> playerId mapping
  const peerToPlayerId = new Map();

  function getRoomCode() {
    try {
      const fromStore = localStorage.getItem(STORAGE.room);
      if (fromStore) return String(fromStore).trim();
    } catch {}
    // fallback query param
    try {
      const url = new URL(window.location.href);
      const q = url.searchParams.get("room") || url.searchParams.get("roomCode");
      if (q) return String(q).trim();
    } catch {}
    return "";
  }

  function getPlayerId() {
    try {
      const v = sessionStorage.getItem(STORAGE.playerId) || localStorage.getItem(STORAGE.playerId);
      if (v) return String(v);
    } catch {}
    return "";
  }

  function getPlayerName() {
    try {
      const v = sessionStorage.getItem(STORAGE.name) || localStorage.getItem(STORAGE.name);
      if (v) return String(v);
    } catch {}
    return "player";
  }

  function parsePlayerIdFromUserName(userName) {
    // Format: "name#<uuid>" (notre convention)
    if (!userName) return "";
    const s = String(userName);
    const m = s.match(/#([0-9a-fA-F-]{16,})$/);
    return m ? m[1] : "";
  }

  async function fetchRoomUrl(roomCode) {
    if (!roomCode) throw new Error("roomCode manquant");

    // 1) essayer l'endpoint info (si la room existe déjà)
    try {
      const r = await fetch(`/api/video/room-info/${encodeURIComponent(roomCode)}`, { cache: "no-store" });
      if (r.ok) {
        const j = await r.json();
        if (j && j.ok && j.roomUrl) return j.roomUrl;
      }
    } catch {}

    // 2) sinon créer / récupérer via create-room
    const r2 = await fetch(`/api/video/create-room/${encodeURIComponent(roomCode)}`, { cache: "no-store" });
    const j2 = await r2.json().catch(() => ({}));
    if (!r2.ok || !j2 || !j2.ok || !j2.roomUrl) {
      throw new Error(j2?.error || `Impossible de récupérer l'URL Daily (HTTP ${r2.status})`);
    }
    return j2.roomUrl;
  }

  function ensureSlotsObserver() {
    const host = document.getElementById("playersList");
    if (!host || host.__dtObserverBound) return;
    host.__dtObserverBound = true;

    const obs = new MutationObserver(() => {
      // Re-attach cached videos after re-render
      reattachAll();
    });
    obs.observe(host, { childList: true, subtree: true });
  }

  function getSlot(playerId) {
    if (!playerId) return null;
    return document.querySelector(`.player-video-slot[data-player-id="${CSS.escape(playerId)}"]`);
  }

  function attachTrackToSlot(playerId, track) {
    const slot = getSlot(playerId);
    if (!slot) return;

    let video = slot.querySelector("video");
    if (!video) {
      video = document.createElement("video");
      video.autoplay = true;
      video.playsInline = true;
      video.muted = true; // éviter l'écho (on ne gère ici que la vidéo)
      slot.appendChild(video);
    }

    const stream = new MediaStream();
    stream.addTrack(track);
    video.srcObject = stream;
  }

  function reattachAll() {
    for (const [playerId, track] of videoTracks.entries()) {
      attachTrackToSlot(playerId, track);
    }
  }

  function setSpeaking(playerId) {
    document.querySelectorAll(".player-item.dt-speaking").forEach(el => el.classList.remove("dt-speaking"));
    if (!playerId) return;
    const row = document.querySelector(`.player-item[data-player-id="${CSS.escape(playerId)}"]`);
    if (row) row.classList.add("dt-speaking");
  }

  async function start() {
    if (started) return;
    started = true;

    const roomCode = getRoomCode();
    const roomUrl = await fetchRoomUrl(roomCode);

    ensureSlotsObserver();

    if (!callObject) callObject = Daily.createCallObject();

    callObject.on("track-started", (ev) => {
      if (ev?.track?.kind !== "video") return;

      const pid =
        (ev?.participant?.local ? getPlayerId() : "") ||
        parsePlayerIdFromUserName(ev?.participant?.user_name) ||
        "";

      const peerKey = ev?.participant?.session_id || ev?.participant?.peerId || ev?.participant?.id || "";
      if (peerKey && pid) peerToPlayerId.set(peerKey, pid);

      if (pid) {
        videoTracks.set(pid, ev.track);
        attachTrackToSlot(pid, ev.track);
      }
    });

    callObject.on("track-stopped", (ev) => {
      if (ev?.track?.kind !== "video") return;
      const peerKey = ev?.participant?.session_id || ev?.participant?.peerId || ev?.participant?.id || "";
      const pid = peerToPlayerId.get(peerKey) || parsePlayerIdFromUserName(ev?.participant?.user_name) || "";
      if (pid) {
        videoTracks.delete(pid);
        const slot = getSlot(pid);
        if (slot) slot.innerHTML = "";
      }
    });

    callObject.on("active-speaker-change", (ev) => {
      // daily-js callObject returns { peerId } for active speaker
      const peerId = ev?.peerId || ev?.activeSpeaker?.peerId || "";
      const pid = peerToPlayerId.get(peerId) || "";
      setSpeaking(pid);
    });

    const userName = `${getPlayerName()}#${getPlayerId() || "unknown"}`;

    await callObject.join({
      url: roomUrl,
      userName
    });

    // Persist user intent (for next reload)
    try { localStorage.setItem(STORAGE.enabled, "1"); } catch {}

    // attach whatever is already cached (in case UI rendered after join)
    reattachAll();
  }

  async function stop() {
    started = false;
    try { localStorage.removeItem(STORAGE.enabled); } catch {}
    setSpeaking("");

    if (callObject) {
      try { await callObject.leave(); } catch {}
      try { callObject.destroy(); } catch {}
      callObject = null;
    }
    videoTracks.clear();
    peerToPlayerId.clear();
  }

  function mountButton() {
    const btn = document.createElement("button");
    btn.id = "daily-tracks-btn";
    btn.textContent = "🎥 Activer la visio (expérimental)";
    btn.onclick = async () => {
      // Toggle (pratique en test)
      if (started) {
        btn.textContent = "🎥 Activer la visio (expérimental)";
        await stop();
      } else {
        btn.textContent = "⏳ Connexion visio…";
        try {
          await start();
          btn.textContent = "🎥 Visio active (cliquer pour arrêter)";
        } catch (e) {
          console.error("[DailyTracks] start failed:", e);
          btn.textContent = "🎥 Activer la visio (expérimental)";
          started = false;
          alert(`Visio impossible : ${e?.message || e}`);
        }
      }
    };
    document.body.appendChild(btn);

    // Auto-restart si l'utilisateur avait activé avant (desktop only)
    try {
      const enabled = localStorage.getItem(STORAGE.enabled) === "1";
      const isMobile = (() => {
        try { if (window.matchMedia && window.matchMedia("(max-width: 767px)").matches) return true; } catch {}
        return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent || "");
      })();
      if (enabled && !isMobile) {
        // On laisse l'UI se rendre puis on tente un start.
        setTimeout(() => btn.click(), 800);
      }
    } catch {}
  }

  window.addEventListener("DOMContentLoaded", mountButton);
})();
