/* =========================================================
   D2.1 — Daily Tracks (module indépendant, SAFE)
   ========================================================= */

(function () {
  if (window.DAILY_TRACKS_LOADED) return;
  window.DAILY_TRACKS_LOADED = true;

  let callObject = null;
  let container = null;
  let started = false;

  const DAILY_DOMAIN = "https://les-saboteurs.daily.co";

  function createUI() {
    container = document.createElement("div");
    container.id = "daily-tracks-panel";
    container.innerHTML = `
      <div class="dt-header">
        <span>🎥 Visio (expérimental)</span>
        <button id="dt-close">✕</button>
      </div>
      <div class="dt-videos"></div>
    `;
    document.body.appendChild(container);

    document.getElementById("dt-close").onclick = stop;
  }

  function addVideo(peerId, track) {
    const videos = container.querySelector(".dt-videos");
    if (videos.querySelector(`[data-peer="${peerId}"]`)) return;

    const video = document.createElement("video");
    video.autoplay = true;
    video.playsInline = true;
    video.muted = peerId === "local";
    video.srcObject = new MediaStream([track]);
    video.dataset.peer = peerId;
    video.className = "dt-video";

    videos.appendChild(video);
  }

  function removeVideo(peerId) {
    const el = container.querySelector(`[data-peer="${peerId}"]`);
    if (el) el.remove();
  }

  async function start() {
    if (started) return;
    started = true;

    createUI();

    callObject = Daily.createCallObject();

    callObject.on("track-started", (ev) => {
      if (ev.track.kind === "video") {
        addVideo(ev.participant.local ? "local" : ev.participant.session_id, ev.track);
      }
    });

    callObject.on("track-stopped", (ev) => {
      removeVideo(ev.participant.session_id);
    });

    callObject.on("active-speaker-change", (ev) => {
      container.querySelectorAll(".dt-video").forEach(v => v.classList.remove("speaking"));
      if (!ev?.peerId) return;
      const el = container.querySelector(`[data-peer="${ev.peerId}"]`);
      if (el) el.classList.add("speaking");
    });

    await callObject.join({
      url: `${DAILY_DOMAIN}/${window.currentRoomCode || ""}`,
    });
  }

  async function stop() {
    started = false;
    if (callObject) {
      await callObject.leave();
      callObject.destroy();
      callObject = null;
    }
    if (container) container.remove();
  }

  // Bouton d’activation (mobile safe)
  window.addEventListener("DOMContentLoaded", () => {
    const btn = document.createElement("button");
    btn.id = "daily-tracks-btn";
    btn.textContent = "🎥 Activer la visio (expérimental)";
    btn.onclick = start;
    document.body.appendChild(btn);
  });

})();
