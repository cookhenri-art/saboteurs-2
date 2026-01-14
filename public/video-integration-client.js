/**
 * VIDEO INTEGRATION - À ajouter dans public/client.js
 * 
 * Copiez ce code à la fin de votre fichier client.js
 */

// ============================================
// SECTION VIDEO - DAILY.CO INTEGRATION
// ============================================

console.log('[Video] build=D3-fix-mobile-v2-syntax');

let videoRoomUrl = null;
let videoRoomJoined = false;
let isInitializingVideo = false; // Protection contre joins multiples
let isCreatingRoom = false;      // Protection contre create-room multiples

// D3: Sur mobile, l'activation vidéo doit être déclenchée par une interaction utilisateur.
// IMPORTANT: on exige un geste utilisateur À CHAQUE chargement de page (session), pas un flag persistant.
const VIDEO_IS_MOBILE = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || window.innerWidth < 768;

// Desktop: on peut mémoriser la préférence (auto = ok). Mobile: session-only.
let videoUserRequestedSession = (() => {
  try { return sessionStorage.getItem('videoUserRequestedSession') === '1'; } catch (e) { return false; }
})();

let videoUserRequestedPersisted = (() => {
  try { return localStorage.getItem('videoUserRequested') === '1'; } catch (e) { return false; }
})();

let isPreparingVideoRoom = false;

// Expose une API simple pour le bouton (video-tracks.js)
window.VideoIntegration = window.VideoIntegration || {};
window.VideoIntegration.requestVideoStart = function () {
  // Flag session (mobile) + préférence (desktop)
  videoUserRequestedSession = true;
  try { sessionStorage.setItem('videoUserRequestedSession', '1'); } catch (e) {}

  if (!VIDEO_IS_MOBILE) {
    videoUserRequestedPersisted = true;
    try { localStorage.setItem('videoUserRequested', '1'); } catch (e) {}
  }

  // IMPORTANT mobile: le join() doit être déclenché DIRECTEMENT ici (handler clic).
  // => on ne join que si la room est déjà préparée (URL connue).
  const st = window.lastKnownState;
  if (!st || !st.started || st.ended || st.aborted) {
    showVideoStatus('⚠️ Visio: état de partie indisponible', 'warning');
    return;
  }

  if (VIDEO_IS_MOBILE) {
    if (!videoRoomUrl) {
      showVideoStatus('⏳ Préparation de la visio… Réessaie dans 1s', 'info');
      // On prépare en arrière-plan via roomState (ou via prepareVideoRoom si dispo)
      try { prepareVideoRoom(st); } catch (e) {}
      return;
    }
    // Join DIRECT (pas de fetch / pas de chaîne async avant l'appel)
    joinVideoRoomNow(st);
    return;
  }

  // Desktop: ok de lancer (peut créer/join via async)
  initVideoForGame(st);
};


/**
 * Prépare la room Daily côté serveur (crée si besoin) SANS join().
 * Utilisé pour respecter la règle mobile "join seulement sur geste utilisateur".
 */
function prepareVideoRoom(state) {
  if (videoRoomUrl || isPreparingVideoRoom) return;
  if (!state?.started || state?.ended || state?.aborted) return;
  if (state?.videoDisabled) return;
  if (!state?.roomCode) return;

  isPreparingVideoRoom = true;
  const apiUrl = `/api/video/create-room/${state.roomCode}`;
  console.log('[Video] 📡 Preparing room (no-join):', apiUrl);

  fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' } })
    .then(res => res.json())
    .then(data => {
      if (data?.ok && data?.roomUrl) {
        videoRoomUrl = data.roomUrl;
        console.log('[Video] ✅ Room prepared:', videoRoomUrl);
      } else {
        console.warn('[Video] ⚠️ Room prepare failed:', data?.error || data);
      }
    })
    .catch(err => console.warn('[Video] ⚠️ Room prepare error:', err))
    .finally(() => { isPreparingVideoRoom = false; });
}

/**
 * Join la room Daily (DOIT être appelé directement depuis un handler utilisateur sur mobile).
 * N'appelle JAMAIS l'API create-room.
 */
function joinVideoRoomNow(state) {
  if (videoRoomJoined) {
    console.log('[Video] Already joined, skipping join');
    return;
  }
  if (isInitializingVideo) {
    console.log('[Video] Join already in progress, skipping');
    return;
  }
  if (!videoRoomUrl) {
    console.warn('[Video] joinVideoRoomNow called but no videoRoomUrl yet');
    showVideoStatus('⏳ Visio pas prête. Réessaie.', 'info');
    return;
  }

  isInitializingVideo = true;

  const permissions = state.videoPermissions || { video: true, audio: true };
  const baseName = state.you?.name || 'Joueur';
  const youId = state.you?.playerId || window.playerId || state.you?.id || '';
  const userName = youId ? `${baseName}#${youId}` : baseName;

  console.log('[Video] 🚀 Joining prepared room (direct):', { userName, permissions });

  window.dailyVideo.joinRoom(videoRoomUrl, userName, permissions)
    .then(() => {
      videoRoomJoined = true;
      isInitializingVideo = false;
      console.log('[Video] ✅ Successfully joined room');
      showVideoStatus('✅ Visio activée', 'success');
    })
    .catch(err => {
      console.error('[Video] ❌ Join error:', err);
      isInitializingVideo = false;
      showVideoStatus('❌ Erreur de connexion vidéo', 'error');
    });
}

/**

 * Initialise la vidéo quand la partie démarre
 */
function initVideoForGame(state) {
  // D3: Sécurité - sur mobile, ne jamais auto-join via initVideoForGame.
  if (VIDEO_IS_MOBILE) {
    prepareVideoRoom(state);
    console.log('[Video] Mobile: initVideoForGame blocked (use user gesture)');
    return;
  }

  // Ne rien faire si déjà initialisé ou si pas encore démarré
  if (videoRoomJoined) {
    console.log('[Video] Already joined, skipping initialization');
    return;
  }

  // Bloquer si une création de room est déjà en cours
  if (isCreatingRoom) {
    console.log('[Video] Room creation already in progress, skipping');
    return;
  }

  if (!state.started) {
    console.log('[Video] Game not started yet, skipping');
    return;
  }
  
  // V9.3.1: Vérifier si la vidéo est désactivée pour cette partie
  if (state.videoDisabled) {
    console.log('[Video] Video disabled for this game, skipping initialization');
    return;
  }

  if (!state.roomCode) {
    console.error('[Video] No room code in state!', state);
    return;
  }

  // Si la room est déjà connue, on join directement (desktop)
  if (videoRoomUrl) {
    joinVideoRoomNow(state);
    return;
  }

  console.log('[Video] 🎬 Initializing video for game...', {
    roomCode: state.roomCode,
    phase: state.phase,
    started: state.started
  });

  // Demander la création de la room vidéo au serveur
  const apiUrl = `/api/video/create-room/${state.roomCode}`;
  console.log('[Video] 📡 Fetching:', apiUrl);

  isCreatingRoom = true;
  fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  })
    .then(res => {
      console.log('[Video] 📥 Response status:', res.status);
      return res.json();
    })
    .then(data => {
      console.log('[Video] 📦 Response data:', data);

      if (!data.ok) {
        console.error('[Video] ❌ Failed to create room:', data.error);
        showVideoStatus('❌ Impossible de créer la visio', 'error');
        isCreatingRoom = false;
        return;
      }

      videoRoomUrl = data.roomUrl;
      console.log('[Video] ✅ Room created:', videoRoomUrl);

      // Afficher un message d'info si c'est une room gratuite
      if (data.isFreeRoom) {
        console.log('[Video] ℹ️ Using FREE Daily.co room (10 participants max)');
      }

      // Desktop: join maintenant
      joinVideoRoomNow(state);
    })
    .catch(err => {
      console.error('[Video] ❌ API error:', err);
      isCreatingRoom = false;
      showVideoStatus('❌ Erreur serveur vidéo', 'error');
    })
    .finally(() => {
      isCreatingRoom = false;
    });
}

/**
 * Met à jour les permissions vidéo selon la phase
 */
function updateVideoPermissions(state) {
  if (!videoRoomJoined || !window.dailyVideo.callFrame) {
    return;
  }

  const permissions = state.videoPermissions;
  if (!permissions) return;

  console.log('[Video] Updating permissions:', permissions);
  window.dailyVideo.updatePermissions(permissions);

  // 🎉 V9.3.0.1 : Réactivation forcée en GAME_OVER pour les joueurs morts
  // Daily.co garde les joueurs morts en mode "spectateur" même si les permissions changent
  // On force la réactivation des tracks pour permettre le débrief post-game
  if (state.phase === 'GAME_OVER' && permissions.video && permissions.audio) {
    console.log('[Video] 🎉 GAME_OVER detected - Force enabling camera and mic for all players');
    
    // Fonction de réactivation avec retry
    const forceEnableTracks = (attempt = 1) => {
      try {
        const callFrame = window.dailyVideo.callFrame;
        if (!callFrame) {
          console.warn('[Video] ⚠️ No callFrame available (attempt ' + attempt + ')');
          return;
        }
        
        // Vérifier si on est toujours dans la room
        const meetingState = callFrame.meetingState();
        if (meetingState !== 'joined-meeting') {
          console.warn('[Video] ⚠️ Not in meeting state:', meetingState);
          return;
        }
        
        // Forcer l'activation de la caméra et du micro
        callFrame.setLocalAudio(true);
        callFrame.setLocalVideo(true);
        console.log('[Video] ✅ Camera and mic forcefully enabled (attempt ' + attempt + ')');
        
        // Retry après 2 secondes si c'est la première tentative
        // Certains joueurs morts depuis longtemps ont besoin d'un second passage
        if (attempt === 1) {
          setTimeout(() => forceEnableTracks(2), 2000);
        }
      } catch (err) {
        console.warn('[Video] ⚠️ Could not force enable tracks (attempt ' + attempt + '):', err);
        
        // Retry une fois en cas d'erreur sur la première tentative
        if (attempt === 1) {
          setTimeout(() => forceEnableTracks(2), 2000);
        }
      }
    };
    
    // Premier passage après 800ms (au lieu de 500ms)
    setTimeout(() => forceEnableTracks(1), 800);
  }

  // Afficher le message de phase
  if (state.videoPhaseMessage) {
    showVideoStatus(state.videoPhaseMessage, 'info');
  }
}

/**
 * Quitte la room vidéo
 */
function leaveVideoRoom() {
  if (!videoRoomJoined) return;

  console.log('[Video] Leaving room...');
  window.dailyVideo.leave();
  videoRoomJoined = false;
  videoRoomUrl = null;
  showVideoStatus('📹 Visio terminée', 'info');
}

/**
 * Affiche un message de statut vidéo (optionnel - peut être adapté à votre UI)
 */
function showVideoStatus(message, type = 'info') {
  console.log(`[Video Status - ${type}]`, message);
  
  // Option 1: Afficher dans la console seulement
  // (Commentez cette partie si vous avez déjà un système de notifications)
  
  // Option 2: Créer une notification temporaire
  const notification = document.createElement('div');
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 120px;
    right: 20px;
    padding: 12px 20px;
    background: ${type === 'error' ? '#ef4444' : type === 'success' ? '#10b981' : '#3b82f6'};
    color: white;
    border-radius: 8px;
    font-weight: 600;
    font-size: 14px;
    z-index: 9997;
    animation: slideInRight 0.3s ease-out;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  `;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.opacity = '0';
    notification.style.transform = 'translateX(100%)';
    notification.style.transition = 'all 0.3s ease-out';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

/**
 * Nettoie la vidéo (appelé lors de la déconnexion)
 */
function cleanupVideo() {
  if (videoRoomJoined) {
    window.dailyVideo.destroy();
    videoRoomJoined = false;
    videoRoomUrl = null;
  }
}

// ============================================
// HOOKS DANS LE CODE EXISTANT
// ============================================

// ============================================
// AUTO-ACTIVATION via Socket.IO
// ============================================

/**
 * Écoute automatique des événements Socket.IO
 * S'active dès que le module est chargé
 */
(function autoActivateVideo() {
  // Vérifier que Socket.IO est disponible
  if (typeof io === 'undefined') {
    console.warn('[Video] Socket.IO not loaded yet, retrying...');
    setTimeout(autoActivateVideo, 500);
    return;
  }

  // Vérifier qu'une socket existe
  if (typeof socket === 'undefined') {
    console.warn('[Video] Socket not initialized yet, retrying...');
    setTimeout(autoActivateVideo, 500);
    return;
  }

  console.log('[Video] Auto-activation enabled ✅');

  // Hook sur roomState (s'ajoute aux listeners existants)
  socket.on("roomState", (state) => {
    // Stocker l'état pour debug
    window.lastKnownState = state;

    // DEBUG : Logger l'état complet
    console.log('[Video] 📥 roomState received:', {
      started: state.started,
      ended: state.ended,
      aborted: state.aborted,
      phase: state.phase,
      roomCode: state.roomCode,
      hasYou: !!state.you,
      hasVideoPermissions: !!state.videoPermissions
    });

    // 1. Initialiser la vidéo au démarrage de la partie
    if (state.started && !state.ended && !state.aborted) {
      // D3: Sur mobile, attendre une action utilisateur explicite
      prepareVideoRoom(state);
      if (VIDEO_IS_MOBILE && !videoUserRequestedSession) {
        console.log('[Video] ⏸️ Mobile: waiting for user gesture (button)');
        showVideoStatus('📱 Appuie sur "Activer la visio"', 'info');
      } else {
        // Desktop: auto si préférence persistée, ou si non mobile
        if (!VIDEO_IS_MOBILE && (videoUserRequestedPersisted || true)) {
          console.log('[Video] 🎯 Conditions met for video initialization');
          initVideoForGame(state);
        }
      }
    } else {
      console.log('[Video] ⏸️ Not starting video:', {
        started: state.started,
        ended: state.ended,
        aborted: state.aborted
      });
    }
    
    // 2. Mettre à jour les permissions selon la phase
    // V9.3.0.2: IMPORTANT - Appeler même en GAME_OVER (state.ended=true) pour réactiver les morts
    if (state.started) {
      updateVideoPermissions(state);

      // D3: Auto PiP en phase nuit/action (PC uniquement, jamais forcé mobile)
      try {
        const isNightLike = (
          state.phase === 'NIGHT' ||
          state.phase === 'ACTION' ||
          state.phase === 'SABOTEURS' ||
          state.phase === 'DOCTOR' ||
          state.phase === 'RADAR_OFFICER' ||
          state.phase === 'SECURITY'
        );

        if (!VIDEO_IS_MOBILE && isNightLike && document.pictureInPictureEnabled) {
          const youId = state.you?.playerId || window.playerId || state.you?.id || '';
          const selector = youId ? `.player-item[data-player-id="${youId}"] video` : '.player-item video';
          const el = document.querySelector(selector);

          if (el && document.pictureInPictureElement !== el) {
            el.requestPictureInPicture().catch(() => {});
          }
        }

        if (!VIDEO_IS_MOBILE && !isNightLike && document.pictureInPictureElement) {
          document.exitPictureInPicture().catch(() => {});
        }
      } catch (e) {}

    }
    
    // 3. Quitter la vidéo en fin de partie
    if (state.aborted) {
      leaveVideoRoom();
    }
    // ✅ V8.1: keep video running through GAME_OVER and end stats; server controls media permissions.
    // We intentionally do NOT leave on state.ended here.
  });

  // Hook sur disconnect
  socket.on("disconnect", () => {
    cleanupVideo();
  });

  console.log('[Video] Event listeners registered ✅');
})();

/**
 * À ajouter quand l'utilisateur quitte volontairement
 */
function onLeaveRoom() {
  // ... votre code existant ...
  
  // Quitter la vidéo
  leaveVideoRoom();
}

// ============================================
// CONTRÔLES UTILISATEUR (OPTIONNEL)
// ============================================

/**
 * Bouton pour toggle la vidéo manuellement
 * À ajouter dans votre UI si souhaité
 */
function createVideoToggleButton() {
  const button = document.createElement('button');
  button.id = 'videoToggleBtn';
  button.textContent = '📹';
  button.title = 'Activer/Désactiver la visioconférence';
  button.className = 'btn btn-secondary';
  button.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 60px;
    height: 60px;
    border-radius: 50%;
    font-size: 28px;
    z-index: 9996;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  `;
  
  button.onclick = () => {
    if (!videoRoomJoined) {
      // Tenter de rejoindre manuellement
      const state = window.lastKnownState; // Vous devez stocker state globalement
      if (state && state.started) {
        initVideoForGame(state);
      } else {
        showVideoStatus('⚠️ Attendez le début de la partie', 'warning');
      }
    } else {
      // Toggle minimiser/maximiser
      window.dailyVideo.toggleMinimize();
    }
  };
  
  document.body.appendChild(button);
  
  return button;
}

// Créer le bouton au chargement (optionnel)
// window.addEventListener('DOMContentLoaded', () => {
//   createVideoToggleButton();
// });

// ============================================
// DEBUGGING
// ============================================

/**
 * Fonction de debug pour tester manuellement
 * Utilisez dans la console: testVideoConnection()
 */
window.testVideoConnection = function() {
  console.log('[Video Debug] Testing connection...');
  console.log('Room joined:', videoRoomJoined);
  console.log('Room URL:', videoRoomUrl);
  console.log('CallFrame exists:', !!window.dailyVideo.callFrame);
  
  if (window.dailyVideo.callFrame) {
    window.dailyVideo.callFrame.participants().then(participants => {
      console.log('Participants:', Object.keys(participants).length);
      console.log('Details:', participants);
    });
  }
};

/**
 * Logger les événements vidéo importants
 */
if (window.dailyVideo) {
  const originalJoin = window.dailyVideo.joinRoom;
  window.dailyVideo.joinRoom = async function(...args) {
    console.log('[Video] Joining room with args:', args);
    try {
      const result = await originalJoin.apply(this, args);
      console.log('[Video] Join successful');
      return result;
    } catch (error) {
      console.error('[Video] Join failed:', error);
      throw error;
    }
  };
}

console.log('[Video Integration] Module loaded successfully ✅');
