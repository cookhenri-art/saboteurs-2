/**
 * VIDEO INTEGRATION - À ajouter dans public/client.js
 * 
 * Copiez ce code à la fin de votre fichier client.js
 */

// ============================================
// SECTION VIDEO - DAILY.CO INTEGRATION
// ============================================

let videoRoomUrl = null;
let videoRoomJoined = false;
let currentVideoRoomCode = null;
let isInitializingVideo = false; // Protection contre appels multiples

/**
 * Initialise la vidéo quand la partie démarre
 */
function computeDesiredVideoRoomCode(state) {
  const base = state.roomCode;
  const night = state.night || 1;
  const ch = state.videoPermissions && state.videoPermissions.channel ? state.videoPermissions.channel : "main";
  const suffix = state.videoPermissions && state.videoPermissions.roomSuffix ? state.videoPermissions.roomSuffix : null;

  if (suffix) return suffix; // roomSuffix déjà complet (ex: 0593-sabo)
  if (!base) return null;

  if (ch === "sabo") return `${base}-sabo`;
  if (ch === "ai") return `${base}-ai-${night}`;
  return base;
}

function initVideoForGame(state) {
  // Ne rien faire si déjà initialisé ou si pas encore démarré
  if (videoRoomJoined) {
    console.log('[Video] Already joined, skipping initialization');
    return;
  }

  // ✨ NOUVEAU : Bloquer si initialisation en cours
  if (isInitializingVideo) {
    console.log('[Video] Initialization already in progress, skipping');
    return;
  }

  if (!state.started) {
    console.log('[Video] Game not started yet, skipping');
    return;
  }

  if (!state.roomCode) {
    console.error('[Video] No room code in state!', state);
    return;
  }

  // ✨ Marquer comme en cours
  isInitializingVideo = true;

  console.log('[Video] 🎬 Initializing video for game...', {
    roomCode: state.roomCode,
    desiredRoomCode: computeDesiredVideoRoomCode(state),
    phase: state.phase,
    started: state.started
  });

  // Demander la création de la room vidéo au serveur
  const desiredRoomCode = computeDesiredVideoRoomCode(state);
  const apiUrl = `/api/video/create-room/${desiredRoomCode}`;
  console.log('[Video] 📡 Fetching:', apiUrl);

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
        isInitializingVideo = false; // ✨ Débloquer en cas d'erreur
        return;
      }

      videoRoomUrl = data.roomUrl;
      console.log('[Video] ✅ Room created:', videoRoomUrl);
      
      // Afficher un message d'info si c'est une room gratuite
      if (data.isFreeRoom) {
        console.log('[Video] ℹ️ Using FREE Daily.co room (10 participants max)');
      }

      // Rejoindre la room avec les permissions initiales
      const permissions = state.videoPermissions || { video: true, audio: true };
      const userName = state.you?.name || 'Joueur';
      
      console.log('[Video] 🚀 Joining room with:', { userName, permissions });
      
      window.dailyVideo.joinRoom(videoRoomUrl, userName, permissions)
        .then(() => {
          videoRoomJoined = true;
      currentVideoRoomCode = desiredRoomCode;
          isInitializingVideo = false; // ✨ Débloquer après succès
          console.log('[Video] ✅ Successfully joined room');
          showVideoStatus('✅ Visio activée', 'success');
        })
        .catch(err => {
          console.error('[Video] ❌ Join error:', err);
          isInitializingVideo = false; // ✨ Débloquer en cas d'erreur
          showVideoStatus('❌ Erreur de connexion vidéo', 'error');
        });
    })
    .catch(err => {
      console.error('[Video] ❌ API error:', err);
      isInitializingVideo = false; // ✨ Débloquer en cas d'erreur
      showVideoStatus('❌ Erreur serveur vidéo', 'error');
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
      console.log('[Video] 🎯 Conditions met for video initialization');
      initVideoForGame(state);
    } else {
      console.log('[Video] ⏸️ Not starting video:', {
        started: state.started,
        ended: state.ended,
        aborted: state.aborted
      });
    }
    
    // 2. Mettre à jour les permissions selon la phase
    if (state.started && !state.ended) {
      if (window.dailyVideo && window.dailyVideo.setContext) {
        window.dailyVideo.setContext({ roomCode: state.roomCode, night: state.night });
      }
      updateVideoPermissions(state);
// 2bis. Switch de room Daily si le channel change (main / sabo / ai)
const desiredRoomCode = computeDesiredVideoRoomCode(state);
if (videoRoomJoined && desiredRoomCode && currentVideoRoomCode && desiredRoomCode !== currentVideoRoomCode) {
  console.log('[Video] 🔁 Switching Daily room:', { from: currentVideoRoomCode, to: desiredRoomCode });
  const apiUrl = `/api/video/create-room/${desiredRoomCode}`;
  fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }})
    .then(r => r.json())
    .then(data => {
      if (!data || !data.ok || !data.roomUrl) throw new Error(data?.error || 'No roomUrl');
      return window.dailyVideo.switchRoom(data.roomUrl);
    })
    .then(() => { currentVideoRoomCode = desiredRoomCode; })
    .catch(err => console.error('[Video] ❌ switchRoom error:', err));
}
    }
    
    // 3. En fin de partie: on garde la visio pour les stats (GAME_OVER). On quitte seulement si aborted.
    if (state.aborted) {
      leaveVideoRoom();
    }
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
