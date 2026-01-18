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

  // D6: Définir showMuteToast ici car video-tracks.js est chargé avant video-briefing-ui.js
  function showMuteToast(isMuted) {
    // Supprimer toast existant
    const existing = document.querySelector('.mute-toast');
    if (existing) existing.remove();
    
    const toast = document.createElement('div');
    toast.className = 'mute-toast';
    toast.textContent = isMuted ? '🔇 Micro coupé' : '🎤 Micro activé';
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: ${isMuted ? '#ff4444' : '#00cc88'};
      color: white;
      padding: 12px 24px;
      border-radius: 25px;
      font-weight: bold;
      z-index: 10000;
      animation: toastSlide 0.3s ease;
      box-shadow: 0 4px 15px rgba(0,0,0,0.3);
    `;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s';
      setTimeout(() => toast.remove(), 300);
    }, 2000);
  }
  // D6: Exposer globalement
  window.showMuteToast = showMuteToast;

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
    },
    // D5: Fonction de nettoyage global pour libérer les ressources
    cleanupUnusedResources: () => {
      cleanupUnusedMediaElements();
    },
    // D11: Fonction de réparation de l'affichage du lobby
    repairLobbyDisplay: () => {
      log("D11: Repairing lobby display...");
      
      // D11: Supprimer inlineVideoBar qui ne devrait pas exister dans le lobby
      const inlineBar = document.getElementById('inlineVideoBar');
      if (inlineBar) {
        log("D11: Removing inlineVideoBar during repair");
        inlineBar.remove();
      }
      
      const playersList = document.getElementById('playersList');
      if (playersList) {
        const state = window.lastKnownState;
        
        // D11 V17: D'abord, supprimer tous les éléments fantômes (sans playerId valide)
        playersList.querySelectorAll('.player-item').forEach(item => {
          const playerId = item.dataset?.playerId;
          if (!playerId) {
            log("D11 V17 repair: Removing phantom player-item (no playerId)");
            item.remove();
            return;
          }
          
          // D11 V17: Vérifier que ce playerId existe toujours dans la liste des joueurs
          const playerExists = state?.players?.some(p => p.playerId === playerId);
          if (!playerExists) {
            log("D11 V17 repair: Removing orphan player-item:", playerId.slice(0,8));
            item.remove();
          }
        });
        
        // D11: Supprimer les éléments orphelins (slots vidéo en dehors de player-left)
        playersList.querySelectorAll('.player-video-slot').forEach(slot => {
          const parent = slot.parentElement;
          if (!parent || !parent.classList.contains('player-left')) {
            log("D11: Removing orphan video slot");
            slot.remove();
          }
        });
        
        // D11: Forcer l'affichage des player-info
        playersList.querySelectorAll('.player-info').forEach(info => {
          info.style.display = 'flex';
          info.style.visibility = 'visible';
          info.style.opacity = '1';
          info.style.flexDirection = 'column';
          void info.offsetHeight;
        });
        playersList.querySelectorAll('.player-left').forEach(left => {
          left.style.display = 'flex';
          left.style.gap = '10px';
          left.style.alignItems = 'center';
          left.style.flexDirection = 'row';
          void left.offsetHeight;
        });
        playersList.querySelectorAll('.player-name').forEach(name => {
          name.style.display = 'flex';
          name.style.visibility = 'visible';
          void name.offsetHeight;
        });
        
        log("D11: Lobby display repaired, triggering video refresh");
      }
      
      // D11: Forcer le réattachement des vidéos via l'API publique
      if (window.VideoTracksRefresh) {
        setTimeout(() => window.VideoTracksRefresh(), 100);
      }
    },
    // D5: Stats pour debug
    getStats: () => ({
      videoTracks: videoTracks.size,
      audioTracks: audioTracks.size,
      videoEls: videoEls.size,
      audioEls: audioEls.size,
      peerMappings: peerToPlayerId.size
    })
  };
  
  // D5: Constante pour limiter le nombre de WebMediaPlayers
  const MAX_VIDEO_ELEMENTS = 12;
  const MAX_AUDIO_ELEMENTS = 15;
  
  // D5: Fonction de nettoyage des éléments média inutilisés
  function cleanupUnusedMediaElements() {
    const state = window.lastKnownState;
    if (!state || !state.players) return;
    
    // Liste des playerIds actifs (vivants et dans la room)
    const activePlayerIds = new Set(
      state.players
        .filter(p => p.status === 'alive' || p.alive !== false)
        .map(p => p.playerId)
    );
    
    log("🧹 Cleanup: active players:", activePlayerIds.size, "video elements:", videoEls.size);
    
    // Nettoyer les vidéos des joueurs qui ne sont plus actifs
    for (const [pid, videoEl] of videoEls.entries()) {
      if (!activePlayerIds.has(pid)) {
        log("🧹 Removing video element for inactive player:", pid);
        videoEl.srcObject = null;
        videoEl.load();
        if (videoEl.parentNode) {
          videoEl.parentNode.removeChild(videoEl);
        }
        videoEls.delete(pid);
        videoTracks.delete(pid);
      }
    }
    
    // Nettoyer les audios des joueurs qui ne sont plus actifs
    for (const [pid, audioEl] of audioEls.entries()) {
      if (!activePlayerIds.has(pid)) {
        log("🧹 Removing audio element for inactive player:", pid);
        audioEl.srcObject = null;
        audioEl.load();
        audioEl.remove();
        audioEls.delete(pid);
        audioTracks.delete(pid);
      }
    }
    
    // Si on dépasse encore la limite, garder seulement les N premiers
    if (videoEls.size > MAX_VIDEO_ELEMENTS) {
      log("⚠️ Too many video elements:", videoEls.size, "- limiting to", MAX_VIDEO_ELEMENTS);
      const entries = Array.from(videoEls.entries());
      const toRemove = entries.slice(MAX_VIDEO_ELEMENTS);
      for (const [pid, videoEl] of toRemove) {
        videoEl.srcObject = null;
        videoEl.load();
        if (videoEl.parentNode) {
          videoEl.parentNode.removeChild(videoEl);
        }
        videoEls.delete(pid);
        videoTracks.delete(pid);
        log("🧹 Force removed excess video:", pid);
      }
    }
    
    log("🧹 Cleanup complete. Videos:", videoEls.size, "Audios:", audioEls.size);
  }

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
    
    // D6 V2.1: Vérifier si le lobby est ACTIF
    const lobbyScreen = document.getElementById('lobbyScreen');
    const gameScreen = document.getElementById('gameScreen');
    const isLobbyActive = lobbyScreen && lobbyScreen.classList.contains('active');
    const isGameActive = gameScreen && gameScreen.classList.contains('active');
    
    log("getSlot check:", playerId.slice(0,8), "isLobbyActive:", isLobbyActive, "isGameActive:", isGameActive);
    
    // Si le lobby est actif, TOUJOURS utiliser les slots du lobby
    if (isLobbyActive) {
      // D6 V2.1: Supprimer inlineVideoBar quand on est dans le lobby
      const inlineBar = document.getElementById('inlineVideoBar');
      if (inlineBar) {
        log("Removing inlineVideoBar (we're in lobby)");
        inlineBar.remove();
      }
      
      // D6 V2.1: Chercher SEULEMENT dans le playersList du lobby
      const playersList = document.getElementById('playersList');
      if (playersList) {
        let slot = playersList.querySelector(`.player-video-slot[data-player-id="${CSS.escape(playerId)}"]`);
        if (slot) {
          log("Using lobby slot for:", playerId.slice(0,8));
          return slot;
        }
      }
      // Pas de slot trouvé - le joueur n'est peut-être pas encore dans la liste
      log("No lobby slot found for:", playerId.slice(0,8));
      return null;
    }
    
    // Si on est dans le gameScreen, utiliser les slots du gameScreen
    if (isGameActive) {
      return ensureGameScreenSlot(playerId);
    }
    
    // Fallback: chercher n'importe quel slot
    let slot = document.querySelector(`.player-video-slot[data-player-id="${CSS.escape(playerId)}"]`);
    if (slot) return slot;
    
    return null;
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
      
      // D6: Synchroniser l'état initial du bouton avec l'état réel du micro
      (async () => {
        const callObj = window.dailyVideo?.callFrame || window.dailyVideo?.callObject;
        if (callObj) {
          try {
            const isAudioOn = await callObj.localAudio();
            const isMuted = !isAudioOn;
            if (isMuted) {
              micBtn.textContent = '🔇';
              micBtn.style.background = 'rgba(180, 50, 50, 0.7)';
              micBtn.title = 'Activer le micro';
            }
          } catch (e) {
            log('Error syncing mic state:', e);
          }
        }
      })();
      
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
      
      // D6: Synchroniser l'état initial du bouton caméra
      (async () => {
        const callObj = window.dailyVideo?.callFrame || window.dailyVideo?.callObject;
        if (callObj) {
          try {
            const isVideoOn = await callObj.localVideo();
            const isCamOff = !isVideoOn;
            if (isCamOff) {
              camBtn.textContent = '🚫';
              camBtn.style.background = 'rgba(180, 50, 50, 0.7)';
              camBtn.title = 'Activer la caméra';
            }
          } catch (e) {
            log('Error syncing cam state:', e);
          }
        }
      })();
      
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
    
    // D5: Check si on approche de la limite de WebMediaPlayers
    if (videoEls.size >= MAX_VIDEO_ELEMENTS) {
      log("⚠️ Approaching video element limit, running cleanup...");
      cleanupUnusedMediaElements();
    }
    
    // Si toujours au-dessus de la limite après cleanup, ne pas créer
    if (videoEls.size >= MAX_VIDEO_ELEMENTS) {
      log("❌ Cannot create video element - limit reached:", MAX_VIDEO_ELEMENTS);
      return null;
    }
    
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
    log("📹 Created video element for:", playerId, "Total:", videoEls.size);
    return v;
  }

  // D4: Create audio element for a remote participant
  function ensureAudioEl(playerId) {
    if (audioEls.has(playerId)) return audioEls.get(playerId);
    
    // D5: Check limite audio
    if (audioEls.size >= MAX_AUDIO_ELEMENTS) {
      log("⚠️ Approaching audio element limit, running cleanup...");
      cleanupUnusedMediaElements();
    }
    
    if (audioEls.size >= MAX_AUDIO_ELEMENTS) {
      log("❌ Cannot create audio element - limit reached:", MAX_AUDIO_ELEMENTS);
      return null;
    }
    
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

  // D4 v5.5: Vérifier si on a le droit de voir/entendre ce joueur selon les permissions de phase
  function canReceiveFromPlayer(playerId) {
    const state = window.lastKnownState;
    if (!state) return true; // Par défaut, autoriser
    
    const myId = getLocalPlayerId();
    const phase = state.phase;
    
    // D4 v5.6: Vérifier d'abord si on est dans une phase privée où on n'est PAS concerné
    const privateStatus = getPrivatePhaseStatus(state, myId);
    
    if (privateStatus.isPrivate && !privateStatus.iAmInvolved) {
      // On est en phase privée et on n'est pas concerné - bloquer TOUT
      log("🔒 Private phase, I'm not involved, blocking:", playerId);
      return false;
    }
    
    if (privateStatus.isPrivate && privateStatus.iAmInvolved) {
      // On est en phase privée ET on est concerné - vérifier si l'autre est concerné
      if (!privateStatus.allowedPlayerIds.includes(playerId)) {
        log("🔒 Private phase, other player not in my group, blocking:", playerId);
        return false;
      }
    }
    
    // Vérifications classiques basées sur les permissions
    const myPermissions = state.videoPermissions?.[myId];
    const theirPermissions = state.videoPermissions?.[playerId];
    
    // Si pas de permissions définies, utiliser la logique de phase
    if (!myPermissions || !theirPermissions) return true;
    
    // Si je n'ai pas le droit d'avoir vidéo/audio, je suis en mode "isolé"
    if (!myPermissions.video && !myPermissions.audio) {
      log("🔒 I'm in silent mode (permissions), blocking receive from:", playerId);
      return false;
    }
    
    // Si l'autre n'a pas le droit d'émettre, ne pas le recevoir
    if (!theirPermissions.video && !theirPermissions.audio) {
      log("🔒 Player in silent mode (permissions), blocking receive:", playerId);
      return false;
    }
    
    return true;
  }
  
  // D4 v5.6: Déterminer le statut de phase privée
  function getPrivatePhaseStatus(state, myId) {
    const result = {
      isPrivate: false,
      iAmInvolved: false,
      allowedPlayerIds: [],
      message: ""
    };
    
    if (!state || !state.phase) return result;
    
    const phase = state.phase;
    const myPlayer = state.players?.find(p => p.playerId === myId);
    
    // NIGHT_AI_EXCHANGE : phase privée Agent IA + partenaire lié
    if (phase === 'NIGHT_AI_EXCHANGE') {
      result.isPrivate = true;
      // D11: Utiliser la traduction dynamique du rôle
      const aiAgentName = window.tRole ? window.tRole('ai_agent') : 'Agent IA';
      result.message = `🔒 Échange ${aiAgentName} privé en cours...`;
      
      // D4 v5.7: Utiliser phaseData qui contient iaId et partnerId
      const phaseData = state.phaseData || {};
      const iaId = phaseData.iaId;
      const partnerId = phaseData.partnerId;
      
      if (iaId && partnerId) {
        result.allowedPlayerIds = [iaId, partnerId];
        result.iAmInvolved = (myId === iaId || myId === partnerId);
        log("NIGHT_AI_EXCHANGE check: myId=", myId, "iaId=", iaId, "partnerId=", partnerId, "involved=", result.iAmInvolved);
      } else {
        // Fallback: chercher via linkedTo
        const iaPlayer = state.players?.find(p => p.role === 'ai_agent' && p.status === 'alive');
        if (iaPlayer) {
          const fallbackIaId = iaPlayer.playerId;
          const fallbackLinkedId = iaPlayer.linkedTo;
          result.allowedPlayerIds = [fallbackIaId, fallbackLinkedId].filter(Boolean);
          result.iAmInvolved = (myId === fallbackIaId || myId === fallbackLinkedId);
          log("NIGHT_AI_EXCHANGE fallback: myId=", myId, "iaId=", fallbackIaId, "linkedTo=", fallbackLinkedId, "involved=", result.iAmInvolved);
        }
        
        // Double fallback: vérifier si MOI j'ai linkedTo (le partenaire a aussi linkedTo)
        if (!result.iAmInvolved && myPlayer?.linkedTo) {
          result.iAmInvolved = true;
          result.allowedPlayerIds.push(myId);
          log("NIGHT_AI_EXCHANGE double fallback: I have linkedTo, so I'm involved");
        }
      }
      return result;
    }
    
    // NIGHT_SABOTEURS : phase privée saboteurs entre eux
    if (phase === 'NIGHT_SABOTEURS') {
      result.isPrivate = true;
      // D11: Utiliser la traduction dynamique
      const saboName = window.t ? window.t('saboteurs') : 'saboteurs';
      result.message = `🔒 Les ${saboName.toLowerCase()} communiquent...`;
      
      // D4 v5.7: Utiliser phaseData.actorIds
      const phaseData = state.phaseData || {};
      if (phaseData.actorIds && phaseData.actorIds.length > 0) {
        result.allowedPlayerIds = phaseData.actorIds;
        result.iAmInvolved = phaseData.actorIds.includes(myId);
        log("NIGHT_SABOTEURS check: myId=", myId, "actorIds=", phaseData.actorIds, "involved=", result.iAmInvolved);
      } else {
        // Fallback: chercher tous les saboteurs
        const saboteurs = state.players?.filter(p => p.role === 'saboteur' && p.status === 'alive') || [];
        result.allowedPlayerIds = saboteurs.map(p => p.playerId);
        result.iAmInvolved = myPlayer?.role === 'saboteur';
        log("NIGHT_SABOTEURS fallback: role check, involved=", result.iAmInvolved);
      }
      
      return result;
    }
    
    // NIGHT_AI_AGENT : Agent IA choisit (pas de visio pour les autres)
    if (phase === 'NIGHT_AI_AGENT') {
      result.isPrivate = true;
      // D11: Utiliser la traduction dynamique du rôle
      const aiAgentName = window.tRole ? window.tRole('ai_agent') : 'Agent IA';
      result.message = `🔒 ${aiAgentName} choisit son partenaire...`;
      
      const iaPlayer = state.players?.find(p => p.role === 'ai_agent' && p.status === 'alive');
      if (iaPlayer) {
        result.allowedPlayerIds = [iaPlayer.playerId];
        result.iAmInvolved = (myId === iaPlayer.playerId);
      }
      return result;
    }
    
    return result;
  }
  
  // D4 v5.6: Exposer le statut de phase privée pour l'UI
  window.getPrivatePhaseStatus = function() {
    const state = window.lastKnownState;
    const myId = getLocalPlayerId();
    return getPrivatePhaseStatus(state, myId);
  };

  function attachTrackToPlayer(playerId, track, isLocal) {
    if (!playerId || !track) return;
    
    // D4 v5.5: Vérifier les permissions avant d'attacher
    if (!isLocal && !canReceiveFromPlayer(playerId)) {
      log("🚫 Blocked video track from:", playerId, "(permissions)");
      return;
    }
    
    const slot = getSlot(playerId);
    if (!slot) {
      log("No slot found for player:", playerId);
      // Debug: lister tous les slots disponibles
      const allSlots = document.querySelectorAll('.player-video-slot');
      log("Available slots:", allSlots.length, Array.from(allSlots).map(s => s.dataset.playerId));
      return;
    }
    
    // D11: Vérifier que le slot est bien un conteneur dédié et pas le player-left
    if (slot.classList.contains('player-left')) {
      log("ERROR: slot is player-left, not video-slot!", playerId);
      return;
    }

    const v = ensureVideoEl(playerId, isLocal);
    const stream = new MediaStream([track]);
    try { v.srcObject = stream; } catch { v.src = URL.createObjectURL(stream); }

    if (!slot.contains(v)) {
      slot.innerHTML = "";
      slot.appendChild(v);
    }
    
    // D11: Après attachement, s'assurer que le sibling player-info est visible
    const playerLeft = slot.parentElement;
    if (playerLeft && playerLeft.classList.contains('player-left')) {
      const playerInfo = playerLeft.querySelector('.player-info');
      if (playerInfo) {
        playerInfo.style.display = 'flex';
        playerInfo.style.visibility = 'visible';
        playerInfo.style.opacity = '1';
      }
    }
    
    // D6: Vérifier si le joueur est mort via lastKnownState
    const state = window.lastKnownState;
    const player = state?.players?.find(p => p.playerId === playerId);
    const isEliminated = player?.status === 'dead' || player?.status === 'left';
    
    // D4: Forcer les styles inline pour s'assurer de la visibilité
    // D6: Ajouter grayscale SEULEMENT si joueur mort
    const grayFilter = isEliminated ? 'filter:grayscale(100%) brightness(0.5)!important;opacity:0.6!important;' : '';
    const borderColor = isEliminated ? '#666' : '#00ffff';
    slot.style.cssText = "width:64px!important;height:48px!important;min-width:64px!important;min-height:48px!important;display:block!important;background:#001830!important;border:2px solid " + borderColor + "!important;border-radius:8px!important;overflow:hidden!important;" + grayFilter;
    v.style.cssText = "width:100%!important;height:100%!important;object-fit:cover!important;display:block!important;" + grayFilter;
    
    // D4: Debug - vérifier les dimensions du slot
    const rect = slot.getBoundingClientRect();
    log("Video attached to slot for:", playerId, "slot size:", rect.width + "x" + rect.height, isEliminated ? "(ELIMINATED)" : "");
    
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
    
    // D4 v5.5: Vérifier les permissions avant d'attacher l'audio
    if (!canReceiveFromPlayer(playerId)) {
      log("🚫 Blocked audio track from:", playerId, "(permissions)");
      // S'assurer qu'on n'a pas d'audio résiduel
      const existingAudio = audioEls.get(playerId);
      if (existingAudio) {
        existingAudio.pause();
        existingAudio.srcObject = null;
      }
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

  // D11 V9: Debounce pour éviter les appels en cascade
  let reattachTimeout = null;
  let reattachPending = false;
  
  function reattachAllDebounced() {
    // D11 V10: Ne pas exécuter si renderLobby est en cours
    if (window._renderingLobby) {
      log("⏸️ Skipping reattach - renderLobby in progress");
      return;
    }
    
    if (reattachTimeout) {
      reattachPending = true;
      return;
    }
    
    reattachAllImmediate();
    
    reattachTimeout = setTimeout(() => {
      reattachTimeout = null;
      if (reattachPending && !window._renderingLobby) {
        reattachPending = false;
        reattachAllImmediate();
      }
    }, 200); // 200ms debounce
  }

  function reattachAllImmediate() {
    log("Reattaching all tracks...");
    const localId = getLocalPlayerId();
    const state = window.lastKnownState;
    
    // D11 V14: Récupérer les tracks directement depuis Daily.co (plus fiable que notre Map)
    const callObj = window.dailyVideo?.callFrame || window.dailyVideo?.callObject;
    if (callObj && typeof callObj.participants === 'function') {
      const participants = callObj.participants();
      for (const [sessionId, participant] of Object.entries(participants)) {
        if (participant.local) continue; // Skip local
        
        const pid = parsePlayerIdFromUserName(participant.user_name) || "";
        if (!pid) continue;
        
        // Récupérer la video track si disponible
        const videoTrack = participant.tracks?.video?.track;
        if (videoTrack && videoTrack.readyState === 'live') {
          if (!videoTracks.has(pid)) {
            log("D11 V14: Recovered video track from Daily for:", pid.slice(0,8));
          }
          videoTracks.set(pid, videoTrack);
        }
        
        // Récupérer la audio track si disponible
        const audioTrack = participant.tracks?.audio?.track;
        if (audioTrack && audioTrack.readyState === 'live') {
          if (!audioTracks.has(pid)) {
            log("D11 V14: Recovered audio track from Daily for:", pid.slice(0,8));
          }
          audioTracks.set(pid, audioTrack);
        }
        
        // Stocker le mapping peer -> playerId
        if (participant.session_id) {
          peerToPlayerId.set(participant.session_id, pid);
        }
      }
    }
    
    // D4 v5.6: Vérifier si on est en phase privée
    const privateStatus = getPrivatePhaseStatus(state, localId);
    updatePrivatePhaseOverlay(privateStatus);
    
    // Si on n'est pas concerné par la phase privée, bloquer tout
    if (privateStatus.isPrivate && !privateStatus.iAmInvolved) {
      log("🔒 Not involved in private phase - blocking all tracks");
      // Couper tous les audios
      for (const [pid, audioEl] of audioEls.entries()) {
        if (pid !== localId) {
          audioEl.pause();
          audioEl.srcObject = null;
        }
      }
      // Cacher toutes les vidéos (ne pas supprimer les éléments, juste les cacher)
      hideAllVideoSlots();
      return;
    }
    
    // Réattacher les vidéos (avec filtrage des permissions)
    for (const [pid, track] of videoTracks.entries()) {
      attachTrackToPlayer(pid, track, pid === localId);
    }
    
    // Réattacher les audios (avec filtrage des permissions)
    for (const [pid, track] of audioTracks.entries()) {
      attachAudioTrack(pid, track, pid === localId);
    }
    
    // Couper l'audio des joueurs qu'on ne doit pas entendre
    for (const [pid, audioEl] of audioEls.entries()) {
      if (pid !== localId && !canReceiveFromPlayer(pid)) {
        audioEl.pause();
        audioEl.srcObject = null;
        log("🔇 Muted audio from blocked player:", pid);
      }
    }
    
    // restore speaking highlight
    if (currentSpeaking) {
      const row = getPlayerRow(currentSpeaking);
      if (row) row.classList.add("is-speaking");
    }
    
    // D11: Forcer le repaint des éléments player-info dans le lobby après attachement des vidéos
    const lobbyScreen = document.getElementById('lobbyScreen');
    if (lobbyScreen && lobbyScreen.classList.contains('active')) {
      requestAnimationFrame(() => {
        const playersList = document.getElementById('playersList');
        if (playersList) {
          const state = window.lastKnownState;
          
          // D11 V17: D'abord, supprimer tous les éléments fantômes (sans playerId valide)
          playersList.querySelectorAll('.player-item').forEach(item => {
            const playerId = item.dataset?.playerId;
            if (!playerId) {
              log("D11 V17: Removing phantom player-item (no playerId)");
              item.remove();
              return;
            }
            
            // D11 V17: Vérifier que ce playerId existe toujours dans la liste des joueurs
            const playerExists = state?.players?.some(p => p.playerId === playerId);
            if (!playerExists) {
              log("D11 V17: Removing orphan player-item (player left):", playerId.slice(0,8));
              item.remove();
              return;
            }
          });
          
          // D11 V11: Vérifier et reconstruire les structures corrompues
          playersList.querySelectorAll('.player-item').forEach(item => {
            const playerId = item.dataset?.playerId;
            const left = item.querySelector('.player-left');
            const info = left?.querySelector('.player-info');
            const slot = left?.querySelector('.player-video-slot');
            const playerName = info?.querySelector('.player-name');
            
            // D11 V12: Vérifier aussi si le contenu est présent (pas juste la structure)
            const hasContent = playerName && playerName.textContent && playerName.textContent.trim().length > 0;
            
            // Si la structure est corrompue OU si le contenu est vide, reconstruire
            if (!left || !info || !slot || !hasContent) {
              log("D11 V12: Corrupted/empty structure detected for:", playerId?.slice(0,8), "hasLeft:", !!left, "hasInfo:", !!info, "hasSlot:", !!slot, "hasContent:", hasContent);
              
              // Sauvegarder la vidéo si elle existe
              const existingVideo = item.querySelector('video');
              
              // Récupérer les données du joueur
              const player = state?.players?.find(p => p.playerId === playerId);
              
              if (player) {
                // Reconstruire la structure
                item.innerHTML = '';
                
                const newLeft = document.createElement('div');
                newLeft.className = 'player-left';
                newLeft.style.cssText = 'display:flex !important; flex-direction:row !important; gap:10px; align-items:center; flex:1 1 auto;';
                
                const newSlot = document.createElement('div');
                newSlot.className = 'player-video-slot';
                newSlot.dataset.playerId = playerId;
                newSlot.style.cssText = 'flex-shrink:0; width:64px; height:48px; min-width:64px; min-height:48px;';
                
                // Restaurer la vidéo
                if (existingVideo) {
                  newSlot.appendChild(existingVideo);
                }
                
                const newInfo = document.createElement('div');
                newInfo.className = 'player-info';
                newInfo.style.cssText = 'display:flex !important; visibility:visible !important; flex-direction:column; gap:4px; flex:1 1 auto; min-width:80px;';
                
                const avatarEmoji = player.avatarEmoji || '👤';
                const badgeDisplay = player.badgeEmoji ? '<span style="margin-left:4px; font-size:0.9rem;">' + player.badgeEmoji + '</span>' : '';
                
                newInfo.innerHTML = 
                  '<div class="player-name" style="font-weight:700; font-size:1rem; color:white; display:flex; align-items:center;">' +
                  '<span style="font-size:1.3rem; margin-right:6px;">' + avatarEmoji + '</span>' + 
                  (player.name || 'Joueur') + badgeDisplay + '</div>' +
                  '<div class="player-badges" style="display:flex; flex-wrap:wrap; gap:4px;">' +
                  (player.isHost ? '<span class="pill ok">HÔTE</span>' : '') +
                  (player.connected ? '<span class="pill ok">EN LIGNE</span>' : '<span class="pill warn">RECONNEXION…</span>') +
                  '</div>';
                
                newLeft.appendChild(newSlot);
                newLeft.appendChild(newInfo);
                
                const newRight = document.createElement('div');
                newRight.className = 'player-right';
                newRight.innerHTML = player.ready ? '<span class="pill ok">PRÊT</span>' : '<span class="pill warn">PAS PRÊT</span>';
                
                item.appendChild(newLeft);
                item.appendChild(newRight);
                
                log("D11 V11: Structure rebuilt for:", player.name);
              } else {
                // D11 V17: Pas de player trouvé = élément orphelin à supprimer
                log("D11 V17: Removing corrupted item without player data:", playerId?.slice(0,8));
                item.remove();
              }
            } else {
              // Structure OK, juste forcer l'affichage
              info.style.display = 'flex';
              info.style.visibility = 'visible';
              info.style.opacity = '1';
              left.style.display = 'flex';
            }
          });
          
          log("D11: Forced repaint of player-info elements in lobby");
        }
      });
    }
  }
  
  // D11 V9: Alias pour compatibilité - tous les appels passent par le debounce
  function reattachAll() {
    reattachAllDebounced();
  }
  
  // D4 v5.6: Cacher tous les slots vidéo
  function hideAllVideoSlots() {
    const container = document.getElementById('inlineVideoBar');
    if (container) {
      container.style.display = 'none';
    }
    // Cacher aussi les slots du lobby si visibles
    document.querySelectorAll('.player-video-slot video').forEach(v => {
      v.style.display = 'none';
    });
  }
  
  // D4 v5.6: Afficher/Cacher l'overlay de phase privée
  function updatePrivatePhaseOverlay(privateStatus) {
    let overlay = document.getElementById('privatePhaseOverlay');
    
    if (privateStatus.isPrivate && !privateStatus.iAmInvolved) {
      // Créer l'overlay si nécessaire
      if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'privatePhaseOverlay';
        overlay.style.cssText = `
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.85);
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          z-index: 10000;
          color: #fff;
          font-family: 'Orbitron', sans-serif;
        `;
        overlay.innerHTML = `
          <div style="font-size: 3rem; margin-bottom: 20px;">🔒</div>
          <div id="privatePhaseMessage" style="font-size: 1.5rem; text-align: center; max-width: 80%; margin-bottom: 20px;"></div>
          <div style="font-size: 1rem; opacity: 0.7;">Veuillez patienter...</div>
          <div style="margin-top: 30px; padding: 20px; background: rgba(255,100,100,0.2); border: 2px solid rgba(255,100,100,0.5); border-radius: 12px;">
            <div style="font-size: 0.9rem; opacity: 0.8;">🎤 Micro désactivé</div>
            <div style="font-size: 0.9rem; opacity: 0.8; margin-top: 5px;">📹 Caméra désactivée</div>
          </div>
        `;
        document.body.appendChild(overlay);
        log("📢 Private phase overlay shown");
        
        // Couper aussi le micro et la caméra local
        forceLocalMute();
      }
      
      // Mettre à jour le message
      const msgEl = overlay.querySelector('#privatePhaseMessage');
      if (msgEl) {
        msgEl.textContent = privateStatus.message;
      }
      
      overlay.style.display = 'flex';
      
      // Cacher la barre inline
      const inlineBar = document.getElementById('inlineVideoBar');
      if (inlineBar) inlineBar.style.display = 'none';
      
    } else {
      // Cacher l'overlay
      if (overlay) {
        overlay.style.display = 'none';
        log("📢 Private phase overlay hidden");
      }
      
      // Réafficher la barre inline si on est en mode INLINE
      const controller = window.VideoModeController;
      const currentMode = controller?.getState?.()?.currentMode;
      if (currentMode === 'INLINE') {
        const inlineBar = document.getElementById('inlineVideoBar');
        if (inlineBar) inlineBar.style.display = 'flex';
      }
    }
  }
  
  // D4 v5.6: Forcer le mute local quand on n'est pas concerné par une phase privée
  function forceLocalMute() {
    const callObj = window.dailyVideo?.callFrame || window.dailyVideo?.callObject;
    if (callObj) {
      try {
        callObj.setLocalAudio(false);
        callObj.setLocalVideo(false);
        log("🔇 Forced local mute for private phase");
      } catch (e) {
        log("Error forcing local mute:", e);
      }
    }
  }
  
  // D4 v5.5: Exposer une fonction pour forcer le recalcul des permissions
  // Appelée quand les permissions changent (changement de phase)
  window.VideoTracksRefresh = function() {
    log("🔄 Permissions refresh requested");
    reattachAll();
  };

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

    // D5: Handler pour participant qui quitte - nettoyage complet
    callObject.on("participant-left", (ev) => {
      const p = ev?.participant;
      const peerKey = p?.session_id || p?.peerId || p?.id || "";
      const pid = peerToPlayerId.get(peerKey) || parsePlayerIdFromUserName(p?.user_name) || "";
      
      log("🚪 participant-left:", p?.user_name, "pid:", pid);
      
      if (pid) {
        // Nettoyer la vidéo
        videoTracks.delete(pid);
        const videoEl = videoEls.get(pid);
        if (videoEl) {
          videoEl.srcObject = null;
          videoEl.load();
          if (videoEl.parentNode) {
            videoEl.parentNode.removeChild(videoEl);
          }
          videoEls.delete(pid);
          log("🧹 Cleaned video for left participant:", pid);
        }
        
        // Nettoyer l'audio
        audioTracks.delete(pid);
        const audioEl = audioEls.get(pid);
        if (audioEl) {
          audioEl.srcObject = null;
          audioEl.load();
          audioEl.remove();
          audioEls.delete(pid);
          log("🧹 Cleaned audio for left participant:", pid);
        }
        
        // Nettoyer le slot
        const slot = getSlot(pid);
        if (slot) {
          slot.innerHTML = "";
        }
        
        // Retirer du mapping
        peerToPlayerId.delete(peerKey);
        
        // Notifier le Briefing UI
        if (window.VideoBriefingUI) {
          window.VideoBriefingUI.onTrackStopped(pid);
        }
      }
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

      // D11 V13: Vérifier si le joueur est toujours dans la partie via lastKnownState
      // C'est plus fiable que callObject.participants() qui peut être désynchronisé
      const gameState = window.lastKnownState;
      const isStillInGame = gameState?.players?.some(player => 
        player.playerId === pid && player.connected !== false && player.status !== 'left'
      );
      
      // D11 V13: Dans le lobby, ne jamais supprimer les vidéos si le joueur est toujours dans la partie
      const lobbyScreen = document.getElementById('lobbyScreen');
      const isInLobby = lobbyScreen && lobbyScreen.classList.contains('active');
      
      if (isStillInGame && isInLobby) {
        log("⏸️ track-stopped in lobby but player still in game, not cleaning:", pid.slice(0,8));
        // Juste supprimer la track de la Map, mais garder le slot et l'élément vidéo intacts
        if (ev?.track?.kind === "video") {
          videoTracks.delete(pid);
        } else if (ev?.track?.kind === "audio") {
          audioTracks.delete(pid);
        }
        return;
      }

      if (ev?.track?.kind === "video") {
        videoTracks.delete(pid);
        const slot = getSlot(pid);
        if (slot) slot.innerHTML = "";
        
        // D5: Nettoyer aussi l'élément vidéo pour libérer les ressources
        const videoEl = videoEls.get(pid);
        if (videoEl) {
          videoEl.srcObject = null;
          videoEl.load(); // Force le navigateur à libérer les ressources
          if (videoEl.parentNode) {
            videoEl.parentNode.removeChild(videoEl);
          }
          videoEls.delete(pid);
          log("🧹 Cleaned up video element for:", pid);
        }
        
        // D4: Notifier le Briefing UI
        if (window.VideoBriefingUI) {
          window.VideoBriefingUI.onTrackStopped(pid);
        }
      } else if (ev?.track?.kind === "audio") {
        audioTracks.delete(pid);
        const audioEl = audioEls.get(pid);
        if (audioEl) {
          audioEl.srcObject = null;
          audioEl.load(); // D5: Force libération ressources
          audioEl.remove();
          audioEls.delete(pid);
          log("🧹 Cleaned up audio element for:", pid);
        }
      }
    });

    callObject.on("active-speaker-change", (ev) => {
      const peerId = ev?.peerId || ev?.activeSpeaker?.peerId || "";
      const pid = peerToPlayerId.get(peerId) || "";
      
      // D5: Log amélioré
      log("🎙️ active-speaker-change event:", { peerId, playerId: pid, raw: ev });
      
      setSpeaking(pid);
      
      // D5: Notifier le VideoModeController avec validation
      if (window.videoModeCtrl && pid) {
        log("🎙️ Notifying VideoModeController of active speaker:", pid);
        window.videoModeCtrl.setActiveSpeaker(pid);
      } else if (!pid) {
        log("🎙️ No playerId found for peerId:", peerId);
      }
    });

    // D11 V10: MutationObserver SUPPRIMÉ - causait des appels en cascade
    // Le reattach est maintenant géré proprement par client.js après renderLobby

    // Initial reattach after a short delay (slots may appear after bind)
    // D11 V10: Réduit à un seul appel
    setTimeout(reattachAll, 1000);
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
      
      // D6: Afficher le toast de confirmation
      if (typeof window.showMuteToast === 'function') {
        window.showMuteToast(userMutedAudio);
      }
      
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

  // D6: Fonction globale pour synchroniser le grayscale des joueurs éliminés
  // Appelée après chaque roomState pour s'assurer que l'affichage est correct
  window.syncEliminatedPlayersGrayscale = function() {
    const state = window.lastKnownState;
    if (!state?.players) return;
    
    // Parcourir tous les joueurs et appliquer/retirer le grayscale
    state.players.forEach(player => {
      const isEliminated = player.status === 'dead' || player.status === 'left';
      const slots = document.querySelectorAll(`[data-player-id="${player.playerId}"]`);
      
      slots.forEach(slot => {
        const video = slot.querySelector('video');
        if (!video) return;
        
        const grayFilter = isEliminated ? 'filter:grayscale(100%) brightness(0.5)!important;opacity:0.6!important;' : '';
        const borderColor = isEliminated ? '#666' : '#00ffff';
        
        // Appliquer les styles au slot
        slot.style.cssText = "width:64px!important;height:48px!important;min-width:64px!important;min-height:48px!important;display:block!important;background:#001830!important;border:2px solid " + borderColor + "!important;border-radius:8px!important;overflow:hidden!important;" + grayFilter;
        
        // Appliquer les styles à la vidéo
        video.style.cssText = "width:100%!important;height:100%!important;object-fit:cover!important;display:block!important;" + grayFilter;
      });
    });
    
    log('🎬 Grayscale sync completed for', state.players.filter(p => p.status === 'dead' || p.status === 'left').length, 'eliminated players');
  };

  // Boot
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      mountButton();
      waitForCallObject();
      startPeriodicCleanup(); // D5: Démarrer le nettoyage périodique
    });
  } else {
    mountButton();
    waitForCallObject();
    startPeriodicCleanup(); // D5: Démarrer le nettoyage périodique
  }
  
  // D5: Nettoyage périodique automatique
  function startPeriodicCleanup() {
    const CLEANUP_INTERVAL = 30000; // Vérifier toutes les 30 secondes
    const CLEANUP_THRESHOLD = 8; // Déclencher si > 8 vidéos
    
    setInterval(() => {
      const stats = window.VideoTracksRegistry.getStats();
      
      if (stats.videoEls > CLEANUP_THRESHOLD) {
        log('🧹 Periodic cleanup triggered - videoEls:', stats.videoEls, 'threshold:', CLEANUP_THRESHOLD);
        cleanupUnusedMediaElements();
        
        // Log final stats
        const newStats = window.VideoTracksRegistry.getStats();
        log('🧹 Cleanup complete - new stats:', newStats);
      }
    }, CLEANUP_INTERVAL);
    
    log('🧹 Periodic cleanup started (every 30s, threshold:', CLEANUP_THRESHOLD, ')');
  }
  
  log("Module loaded ✅");
})();
