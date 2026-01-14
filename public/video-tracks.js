/* =========================================================
   D4 BRIEFING MODE - Inline video thumbnails per player (Daily CallObject)
   - NO Daily floating UI
   - Attach video tracks into .player-video-slot[data-player-id]
   - Attach audio tracks for conference sound
   - Re-attach if players list re-renders
   - Active speaker highlight (.is-speaking on .player-item)
   - D4: Integration with VideoModeController and BriefingUI
   - D4 v5.4: Manual mute state preservation
========================================================= */
(function () {
  "use strict";

  const DEBUG = true; // D4: enable debug logs

  const peerToPlayerId = new Map();  // session_id/peerId -> playerId
  const videoTracks = new Map();     // playerId -> MediaStreamTrack
  const audioTracks = new Map();     // playerId -> MediaStreamTrack
  const videoEls = new Map();        // playerId -> <video>
  const audioEls = new Map();        // playerId -> <audio>
  let currentSpeaking = null;
  let bound = false;
  
  // D4 v5.4: État manuel du mute (prioritaire sur les permissions serveur)
  let userMutedAudio = false;  // L'utilisateur a manuellement coupé son micro
  let userMutedVideo = false;  // L'utilisateur a manuellement coupé sa caméra
  let lastManualMuteTime = 0;  // Timestamp du dernier mute manuel

  function log(...args) { if (DEBUG) console.log("[VideoTracks]", ...args); }

  // D4 v5.4: Exposer les fonctions de contrôle manuel
  window.VideoTracksRegistry = {
    getAll: () => new Map(videoTracks),
    get: (playerId) => videoTracks.get(playerId),
    has: (playerId) => videoTracks.has(playerId),
    getAudio: (playerId) => audioTracks.get(playerId),
    // Nouvelles fonctions pour le mute manuel
    setUserMutedAudio: (muted) => {
      userMutedAudio = muted;
      lastManualMuteTime = Date.now();
      log("User manually set audio mute:", muted);
    },
    setUserMutedVideo: (muted) => {
      userMutedVideo = muted;
      lastManualMuteTime = Date.now();
      log("User manually set video mute:", muted);
    },
    getUserMutedAudio: () => userMutedAudio,
    getUserMutedVideo: () => userMutedVideo,
    // Réinitialiser le mute manuel (pour les changements de phase importants)
    resetManualMute: () => {
      userMutedAudio = false;
      userMutedVideo = false;
      lastManualMuteTime = 0;
      log("Manual mute state reset");
    }
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
    
    // Vérifier si on est dans le gameScreen (pas le lobby)
    const lobbyScreen = document.getElementById('lobbyScreen');
    const gameScreen = document.getElementById('gameScreen');
    const isInGame = gameScreen && gameScreen.style.display !== 'none';
    const isInLobby = lobbyScreen && lobbyScreen.style.display !== 'none';
    
    log("getSlot check:", playerId.slice(0,8), "isInGame:", isInGame, "isInLobby:", isInLobby);
    
    // Si on est dans le gameScreen, utiliser les slots du gameScreen
    if (isInGame && !isInLobby) {
      return ensureGameScreenSlot(playerId);
    }
    
    // Sinon chercher dans la players-list (lobby)
    let slot = document.querySelector(`.player-video-slot[data-player-id="${CSS.escape(playerId)}"]`);
    if (slot) {
      const rect = slot.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        return slot;
      }
      // Slot existe mais invisible - utiliser gameScreen
      log("Lobby slot invisible, using game slot");
      return ensureGameScreenSlot(playerId);
    }
    
    // Fallback: créer dans gameScreen
    return ensureGameScreenSlot(playerId);
  }
  
  // D4: Créer les slots vidéo dans le gameScreen quand le lobby est caché
  function ensureGameScreenSlot(playerId) {
    if (!playerId) return null;
    
    // D4 v5.4: Ne pas créer la barre si le mode SPLIT est actif
    const controller = window.VideoModeController;
    const currentMode = controller?.getState?.()?.currentMode;
    if (currentMode === 'SPLIT') {
      // En mode SPLIT, cacher la barre inline si elle existe
      const existingBar = document.getElementById('inlineVideoBar');
      if (existingBar) {
        existingBar.style.display = 'none';
      }
      return null; // Ne pas créer de slot - le SPLIT gère les vidéos
    }
    
    // Chercher ou créer le conteneur de vignettes dans le gameScreen
    let container = document.getElementById('inlineVideoBar');
    if (!container) {
      container = document.createElement('div');
      container.id = 'inlineVideoBar';
      container.style.cssText = `
        display: flex !important;
        gap: 8px;
        flex-wrap: wrap;
        padding: 10px;
        background: rgba(0, 20, 40, 0.8);
        border: 2px solid rgba(0, 255, 255, 0.4);
        border-radius: 12px;
        margin-bottom: 12px;
        min-height: 70px;
        align-items: center;
      `;
      
      // D4 v5.4: Ajouter les boutons de contrôle mic/cam
      const controlsDiv = document.createElement('div');
      controlsDiv.id = 'inlineVideoControls';
      controlsDiv.style.cssText = `
        display: flex;
        gap: 6px;
        margin-right: 10px;
        padding-right: 10px;
        border-right: 1px solid rgba(0, 255, 255, 0.3);
      `;
      
      // Bouton micro
      const micBtn = document.createElement('button');
      micBtn.id = 'inlineMicBtn';
      micBtn.textContent = '🎤';
      micBtn.title = 'Couper le micro';
      micBtn.style.cssText = `
        width: 36px;
        height: 36px;
        border-radius: 50%;
        border: 2px solid rgba(0, 255, 255, 0.5);
        background: rgba(0, 100, 100, 0.5);
        color: #fff;
        font-size: 1rem;
        cursor: pointer;
        transition: all 0.2s;
      `;
      micBtn.onclick = () => toggleInlineMic(micBtn);
      
      // Bouton caméra
      const camBtn = document.createElement('button');
      camBtn.id = 'inlineCamBtn';
      camBtn.textContent = '📹';
      camBtn.title = 'Couper la caméra';
      camBtn.style.cssText = `
        width: 36px;
        height: 36px;
        border-radius: 50%;
        border: 2px solid rgba(0, 255, 255, 0.5);
        background: rgba(0, 100, 100, 0.5);
        color: #fff;
        font-size: 1rem;
        cursor: pointer;
        transition: all 0.2s;
      `;
      camBtn.onclick = () => toggleInlineCam(camBtn);
      
      controlsDiv.appendChild(micBtn);
      controlsDiv.appendChild(camBtn);
      container.appendChild(controlsDiv);
      
      // Insérer dans gameScreen (forcer même si display pas vérifié)
      const gameScreen = document.getElementById('gameScreen');
      if (gameScreen) {
        const controlPanel = gameScreen.querySelector('.control-panel');
        if (controlPanel) {
          controlPanel.insertBefore(container, controlPanel.firstChild);
          log("Created inline video bar with controls in gameScreen ✅");
        } else {
          // Fallback: insérer directement dans gameScreen
          gameScreen.insertBefore(container, gameScreen.firstChild);
          log("Created inline video bar (fallback) ✅");
        }
      } else {
        log("ERROR: gameScreen not found!");
        return null;
      }
    } else {
      // S'assurer que la barre est visible (au cas où elle aurait été cachée en mode SPLIT)
      container.style.display = 'flex';
    }
    }
    
    // Vérifier que le container est bien dans le DOM
    if (!document.body.contains(container)) {
      log("Container not in DOM, reinserting...");
      const gameScreen = document.getElementById('gameScreen');
      if (gameScreen) {
        const controlPanel = gameScreen.querySelector('.control-panel');
        if (controlPanel) {
          controlPanel.insertBefore(container, controlPanel.firstChild);
        } else {
          gameScreen.insertBefore(container, gameScreen.firstChild);
        }
      }
    }
    
    // Chercher le slot existant dans le container
    let slot = container.querySelector(`.player-video-slot[data-player-id="${CSS.escape(playerId)}"]`);
    if (slot) return slot;
    
    // Créer le slot
    slot = document.createElement('div');
    slot.className = 'player-video-slot game-slot';
    slot.dataset.playerId = playerId;
    slot.style.cssText = `
      width: 80px !important;
      height: 60px !important;
      min-width: 80px !important;
      min-height: 60px !important;
      background: rgba(0, 30, 60, 0.9) !important;
      border: 2px solid rgba(0, 255, 255, 0.5) !important;
      border-radius: 8px !important;
      overflow: hidden !important;
      position: relative !important;
      display: block !important;
    `;
    
    // Ajouter le nom du joueur
    const nameLabel = document.createElement('div');
    nameLabel.className = 'slot-name';
    nameLabel.style.cssText = `
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      padding: 2px 4px;
      background: rgba(0, 0, 0, 0.7);
      color: #fff;
      font-size: 0.65rem;
      text-align: center;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      z-index: 1;
    `;
    
    // Trouver le nom du joueur
    const state = window.lastKnownState;
    const player = state?.players?.find(p => p.playerId === playerId);
    nameLabel.textContent = player?.name || playerId.slice(0, 6);
    
    slot.appendChild(nameLabel);
    container.appendChild(slot);
    
    log("Created game slot for:", playerId, player?.name);
    return slot;
  }

  function getPlayerRow(playerId) {
    if (!playerId) return null;
    return document.querySelector(`.player-item[data-player-id="${CSS.escape(playerId)}"]`);
  }

  function ensureVideoEl(playerId, isLocal) {
    if (videoEls.has(playerId)) return videoEls.get(playerId);
    const v = document.createElement("video");
    v.className = "player-video"; // D4: Classe pour le CSS
    v.autoplay = true;
    v.playsInline = true;
    v.muted = true; // ALWAYS muted - audio is handled separately
    v.setAttribute("webkit-playsinline", "true");
    // Styles inline en backup du CSS
    v.style.width = "100%";
    v.style.height = "100%";
    v.style.objectFit = "cover";
    v.style.display = "block";
    videoEls.set(playerId, v);
    return v;
  }

  // D4: Create audio element for a remote participant
  function ensureAudioEl(playerId) {
    if (audioEls.has(playerId)) return audioEls.get(playerId);
    const a = document.createElement("audio");
    a.autoplay = true;
    a.id = `d4-audio-${playerId}`;
    // Hidden but functional
    a.style.cssText = "position:absolute;left:-9999px;";
    document.body.appendChild(a);
    audioEls.set(playerId, a);
    log("Created audio element for:", playerId);
    return a;
  }

  function attachTrackToPlayer(playerId, track, isLocal) {
    if (!playerId || !track) return;
    const slot = getSlot(playerId);
    if (!slot) {
      log("No slot found for player:", playerId);
      // Debug: lister tous les slots disponibles
      const allSlots = document.querySelectorAll('.player-video-slot');
      log("Available slots:", allSlots.length, Array.from(allSlots).map(s => s.dataset.playerId));
      return;
    }

    const v = ensureVideoEl(playerId, isLocal);
    const stream = new MediaStream([track]);
    try { v.srcObject = stream; } catch { v.src = URL.createObjectURL(stream); }

    if (!slot.contains(v)) {
      slot.innerHTML = "";
      slot.appendChild(v);
    }
    
    // D4: Forcer les styles inline pour s'assurer de la visibilité
    slot.style.cssText = "width:64px!important;height:48px!important;min-width:64px!important;min-height:48px!important;display:block!important;background:#001830!important;border:2px solid #00ffff!important;border-radius:8px!important;overflow:hidden!important;";
    v.style.cssText = "width:100%!important;height:100%!important;object-fit:cover!important;display:block!important;";
    
    // D4: Debug - vérifier les dimensions du slot
    const rect = slot.getBoundingClientRect();
    log("Video attached to slot for:", playerId, "slot size:", rect.width + "x" + rect.height);
    
    // D4: Forcer le play
    v.play().catch(e => log("Video play error:", e));
  }

  // D4: Attach audio track for a remote participant
  function attachAudioTrack(playerId, track, isLocal) {
    if (!playerId || !track) return;
    
    // Don't play our own audio (echo)
    if (isLocal) {
      log("Skipping local audio for:", playerId);
      return;
    }
    
    const a = ensureAudioEl(playerId);
    const stream = new MediaStream([track]);
    try { 
      a.srcObject = stream;
      a.play().then(() => {
        log("Audio playing for:", playerId);
      }).catch(e => {
        log("Audio play error for", playerId, ":", e);
      });
    } catch (e) {
      log("Error attaching audio for", playerId, ":", e);
    }
  }

  function reattachAll() {
    log("Reattaching all tracks...");
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

    log("Binding to callObject ✅");

    callObject.on("participant-joined", (ev) => {
      const p = ev?.participant;
      const peerKey = p?.session_id || p?.peerId || p?.id || "";
      const pid = parsePlayerIdFromUserName(p?.user_name);
      log("participant-joined:", p?.user_name, "pid:", pid);
      if (peerKey && pid) peerToPlayerId.set(peerKey, pid);
    });

    callObject.on("participant-updated", (ev) => {
      const p = ev?.participant;
      const peerKey = p?.session_id || p?.peerId || p?.id || "";
      const pid = parsePlayerIdFromUserName(p?.user_name);
      if (peerKey && pid) peerToPlayerId.set(peerKey, pid);
    });

    callObject.on("track-started", (ev) => {
      const p = ev?.participant;
      const isLocal = !!p?.local;
      const peerKey = p?.session_id || p?.peerId || p?.id || "";
      const pid =
        (isLocal ? getLocalPlayerId() : "") ||
        peerToPlayerId.get(peerKey) ||
        parsePlayerIdFromUserName(p?.user_name) ||
        "";

      log("track-started:", ev?.track?.kind, "from", p?.user_name, "pid:", pid, "isLocal:", isLocal);

      if (!pid) return;

      if (ev?.track?.kind === "video") {
        videoTracks.set(pid, ev.track);
        attachTrackToPlayer(pid, ev.track, isLocal);
        
        // D4: Notifier le Briefing UI
        if (window.VideoBriefingUI) {
          window.VideoBriefingUI.onTrackStarted(pid, ev.track);
        }
      } else if (ev?.track?.kind === "audio") {
        // D4: Handle audio tracks
        audioTracks.set(pid, ev.track);
        attachAudioTrack(pid, ev.track, isLocal);
      }
    });

    callObject.on("track-stopped", (ev) => {
      const p = ev?.participant;
      const peerKey = p?.session_id || p?.peerId || p?.id || "";
      const pid = peerToPlayerId.get(peerKey) || parsePlayerIdFromUserName(p?.user_name) || "";
      
      log("track-stopped:", ev?.track?.kind, "from", p?.user_name, "pid:", pid);
      
      if (!pid) return;

      if (ev?.track?.kind === "video") {
        videoTracks.delete(pid);
        const slot = getSlot(pid);
        if (slot) slot.innerHTML = "";
        
        // D4: Notifier le Briefing UI
        if (window.VideoBriefingUI) {
          window.VideoBriefingUI.onTrackStopped(pid);
        }
      } else if (ev?.track?.kind === "audio") {
        audioTracks.delete(pid);
        const audioEl = audioEls.get(pid);
        if (audioEl) {
          audioEl.srcObject = null;
          audioEl.remove();
          audioEls.delete(pid);
        }
      }
    });

    callObject.on("active-speaker-change", (ev) => {
      const peerId = ev?.peerId || ev?.activeSpeaker?.peerId || "";
      const pid = peerToPlayerId.get(peerId) || "";
      log("active-speaker-change:", pid);
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
    setTimeout(reattachAll, 3000);
  }

  function waitForCallObject() {
    // D4: Check both callObject and callFrame (they're the same in headless mode)
    const co = window.dailyVideo && (window.dailyVideo.callObject || window.dailyVideo.callFrame);
    if (co) {
      log("Found callObject, binding...");
      bindToCallObject(co);
      return;
    }
    log("Waiting for callObject...");
    setTimeout(waitForCallObject, 500);
  }

  function mountButton() {
    // Keep existing UI button if present; only add fallback on mobile
    const existing = document.querySelector("#videoToggleButton");
    if (existing) return;

    // Fallback button bottom-left (mobile friendly)
    const btn = document.createElement("button");
    btn.id = "videoToggleButton";
    btn.textContent = "🎥 Visio activée";
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

  // D4 v5.4: Fonctions toggle pour les boutons de la barre inline
  async function toggleInlineMic(btn) {
    const callObj = window.dailyVideo?.callFrame || window.dailyVideo?.callObject;
    if (!callObj) {
      log('No callObject for inline mic toggle');
      return;
    }
    
    try {
      const currentState = await callObj.localAudio();
      const newState = !currentState;
      await callObj.setLocalAudio(newState);
      
      // Mémoriser le choix manuel
      userMutedAudio = !newState;
      if (window.VideoTracksRegistry?.setUserMutedAudio) {
        window.VideoTracksRegistry.setUserMutedAudio(userMutedAudio);
      }
      
      // Mettre à jour le bouton
      if (btn) {
        if (userMutedAudio) {
          btn.textContent = '🔇';
          btn.style.background = 'rgba(180, 50, 50, 0.7)';
          btn.title = 'Activer le micro';
        } else {
          btn.textContent = '🎤';
          btn.style.background = 'rgba(0, 100, 100, 0.5)';
          btn.title = 'Couper le micro';
        }
      }
      
      // Synchroniser avec le bouton du briefing UI si présent
      syncBriefingMicButton(userMutedAudio);
      
      log('Inline Microphone:', newState ? 'ON' : 'OFF');
    } catch (e) {
      log('Error toggling inline mic:', e);
    }
  }
  
  async function toggleInlineCam(btn) {
    const callObj = window.dailyVideo?.callFrame || window.dailyVideo?.callObject;
    if (!callObj) {
      log('No callObject for inline cam toggle');
      return;
    }
    
    try {
      const currentState = await callObj.localVideo();
      const newState = !currentState;
      await callObj.setLocalVideo(newState);
      
      // Mémoriser le choix manuel
      userMutedVideo = !newState;
      if (window.VideoTracksRegistry?.setUserMutedVideo) {
        window.VideoTracksRegistry.setUserMutedVideo(userMutedVideo);
      }
      
      // Mettre à jour le bouton
      if (btn) {
        if (userMutedVideo) {
          btn.textContent = '📷';
          btn.style.background = 'rgba(180, 50, 50, 0.7)';
          btn.title = 'Activer la caméra';
        } else {
          btn.textContent = '📹';
          btn.style.background = 'rgba(0, 100, 100, 0.5)';
          btn.title = 'Couper la caméra';
        }
      }
      
      // Synchroniser avec le bouton du briefing UI si présent
      syncBriefingCamButton(userMutedVideo);
      
      log('Inline Camera:', newState ? 'ON' : 'OFF');
    } catch (e) {
      log('Error toggling inline cam:', e);
    }
  }
  
  // Synchroniser l'état des boutons entre inline et briefing
  function syncBriefingMicButton(muted) {
    const briefingBtn = document.getElementById('briefingMicBtn');
    if (briefingBtn) {
      if (muted) {
        briefingBtn.textContent = '🔇';
        briefingBtn.classList.add('is-off');
      } else {
        briefingBtn.textContent = '🎤';
        briefingBtn.classList.remove('is-off');
      }
    }
  }
  
  function syncBriefingCamButton(off) {
    const briefingBtn = document.getElementById('briefingCamBtn');
    if (briefingBtn) {
      if (off) {
        briefingBtn.textContent = '📷';
        briefingBtn.classList.add('is-off');
      } else {
        briefingBtn.textContent = '📹';
        briefingBtn.classList.remove('is-off');
      }
    }
  }
  
  // D4 v5.4: Mettre à jour les boutons inline quand l'état change
  function updateInlineButtons() {
    const micBtn = document.getElementById('inlineMicBtn');
    const camBtn = document.getElementById('inlineCamBtn');
    
    if (micBtn) {
      if (userMutedAudio) {
        micBtn.textContent = '🔇';
        micBtn.style.background = 'rgba(180, 50, 50, 0.7)';
      } else {
        micBtn.textContent = '🎤';
        micBtn.style.background = 'rgba(0, 100, 100, 0.5)';
      }
    }
    
    if (camBtn) {
      if (userMutedVideo) {
        camBtn.textContent = '📷';
        camBtn.style.background = 'rgba(180, 50, 50, 0.7)';
      } else {
        camBtn.textContent = '📹';
        camBtn.style.background = 'rgba(0, 100, 100, 0.5)';
      }
    }
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
  
  log("Module loaded ✅");
})();
