/**
 * VIDEO BRIEFING UI - D4
 * ======================
 * 
 * Gère le DOM et le rendu du mode "Salle de Briefing".
 * Écoute les événements du VideoModeController et met à jour l'interface.
 * 
 * Responsabilités:
 * - Créer/détruire le DOM du mode briefing
 * - Attacher les flux vidéo aux éléments
 * - Gérer les interactions utilisateur (clic thumbnail, boutons)
 * - Synchroniser avec video-tracks.js
 */

(function() {
  'use strict';

  const DEBUG = true;
  
  function log(...args) {
    if (DEBUG) console.log('[BriefingUI]', ...args);
  }

  // ============================================
  // DOM REFERENCES
  // ============================================
  
  let container = null;
  let focusWrapper = null;
  let focusMain = null;
  let focusNameEl = null;
  let thumbsSidebar = null;
  let headerEl = null;
  let exitBtn = null;
  let expandBtn = null; // Mobile expand button
  
  // Track elements
  const thumbElements = new Map(); // playerId -> DOM element
  let focusVideoEl = null;
  
  // State
  let isInitialized = false;
  let currentFocusId = null;

  // ============================================
  // INITIALIZATION
  // ============================================
  
  function init() {
    if (isInitialized) return;
    
    createDOM();
    bindEvents();
    
    isInitialized = true;
    log('UI initialized');
  }

  function createDOM() {
    // Main container
    container = document.createElement('div');
    container.className = 'video-briefing-container';
    container.id = 'videoBriefingContainer';
    
    // Header
    headerEl = document.createElement('div');
    headerEl.className = 'video-briefing-header';
    headerEl.innerHTML = `
      <div class="video-briefing-title">
        <span class="icon">🎥</span>
        <span class="text" data-i18n="briefingTitle">SALLE DE BRIEFING</span>
        <span class="phase-badge" id="briefingPhaseBadge">DÉBAT</span>
      </div>
      <div class="video-briefing-actions">
        <button class="video-briefing-btn btn-expand" id="briefingExpandBtn" title="Plein écran">
          ⬆ Max
        </button>
        <button class="video-briefing-btn btn-split" id="briefingSplitBtn" title="Mode 50/50">
          ⬕ Split
        </button>
        <button class="video-briefing-btn btn-exit" id="briefingExitBtn" title="Fermer la visio">
          ✕ Fermer
        </button>
      </div>
    `;
    container.appendChild(headerEl);
    
    // Focus wrapper
    focusWrapper = document.createElement('div');
    focusWrapper.className = 'video-focus-wrapper';
    
    // Main focus video
    focusMain = document.createElement('div');
    focusMain.className = 'video-focus-main empty';
    focusMain.id = 'videoFocusMain';
    
    // Focus name overlay
    focusNameEl = document.createElement('div');
    focusNameEl.className = 'video-focus-name';
    focusNameEl.innerHTML = `
      <span class="name" id="focusPlayerName">—</span>
      <span class="badge-speaker" id="focusSpeakerBadge" style="display:none;">PARLE</span>
    `;
    focusMain.appendChild(focusNameEl);
    
    focusWrapper.appendChild(focusMain);
    container.appendChild(focusWrapper);
    
    // Thumbnails sidebar
    thumbsSidebar = document.createElement('div');
    thumbsSidebar.className = 'video-thumbs-sidebar';
    thumbsSidebar.id = 'videoThumbsSidebar';
    container.appendChild(thumbsSidebar);
    
    // Add to body
    document.body.appendChild(container);
    
    // Mobile expand button (separate from container)
    expandBtn = document.createElement('button');
    expandBtn.className = 'video-expand-btn';
    expandBtn.id = 'videoExpandBtn';
    expandBtn.innerHTML = `
      <span class="icon">⤢</span>
      <span class="text">Agrandir visio</span>
    `;
    document.body.appendChild(expandBtn);
    
    // Cache exit button reference
    exitBtn = document.getElementById('briefingExitBtn');
    
    log('DOM created');
  }

  function bindEvents() {
    // Exit button (fermer complètement)
    exitBtn = document.getElementById('briefingExitBtn');
    if (exitBtn) {
      exitBtn.addEventListener('click', () => {
        log('Exit button clicked');
        if (window.videoModeCtrl) {
          window.videoModeCtrl.setInlineMode();
        }
      });
    }
    
    // Expand button (plein écran)
    const expandBtn2 = document.getElementById('briefingExpandBtn');
    if (expandBtn2) {
      expandBtn2.addEventListener('click', () => {
        log('Expand to full button clicked');
        if (window.videoModeCtrl) {
          window.videoModeCtrl.setFullMode();
        }
      });
    }
    
    // Split button (50/50)
    const splitBtn = document.getElementById('briefingSplitBtn');
    if (splitBtn) {
      splitBtn.addEventListener('click', () => {
        log('Split button clicked');
        if (window.videoModeCtrl) {
          window.videoModeCtrl.setSplitMode();
        }
      });
    }
    
    // Expand button (mobile - dans le jeu)
    if (expandBtn) {
      expandBtn.addEventListener('click', () => {
        log('Expand button clicked');
        if (window.videoModeCtrl) {
          // Par défaut, ouvrir en mode split
          window.videoModeCtrl.setSplitMode();
          window.videoModeCtrl.mobileManuallyActivated = true;
        }
      });
    }
    
    // ESC key to exit
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isVisible()) {
        log('ESC pressed, closing briefing');
        if (window.videoModeCtrl) {
          window.videoModeCtrl.setInlineMode();
        }
      }
    });
    
    // Listen to VideoModeController events
    if (window.videoModeCtrl) {
      window.videoModeCtrl.on('modeChange', handleModeChange);
      window.videoModeCtrl.on('focusChange', handleFocusChange);
      window.videoModeCtrl.on('activeSpeakerChange', handleActiveSpeakerChange);
    }
    
    log('Events bound');
  }

  // ============================================
  // MODE HANDLING
  // ============================================
  
  function handleModeChange(data) {
    log('Mode change:', data);
    
    const { mode, phase } = data;
    
    // Update phase badge
    const phaseBadge = document.getElementById('briefingPhaseBadge');
    if (phaseBadge) {
      phaseBadge.textContent = getPhaseLabel(phase);
    }
    
    // Update container class for mode
    if (container) {
      container.classList.remove('mode-full', 'mode-split');
      if (mode === 'ADVANCED_FOCUS') {
        container.classList.add('mode-full');
      } else if (mode === 'SPLIT') {
        container.classList.add('mode-split');
      }
    }
    
    // Update body class for game content positioning
    updateBodyClass(mode);
    
    // Update button states
    updateModeButtons(mode);
    
    // Show/hide based on mode
    if (mode === 'ADVANCED_FOCUS' || mode === 'SPLIT') {
      show();
      updateExpandButton(false);
    } else {
      hide();
      // Show expand button if conditions allow advanced mode
      const ctrl = window.videoModeCtrl;
      if (ctrl && ctrl.canActivateAdvanced() && ctrl.isVideoJoined) {
        updateExpandButton(true);
      } else {
        updateExpandButton(false);
      }
    }
  }
  
  function updateModeButtons(mode) {
    const expandBtn2 = document.getElementById('briefingExpandBtn');
    const splitBtn = document.getElementById('briefingSplitBtn');
    
    if (expandBtn2) {
      expandBtn2.classList.toggle('active', mode === 'ADVANCED_FOCUS');
      expandBtn2.disabled = mode === 'ADVANCED_FOCUS';
    }
    if (splitBtn) {
      splitBtn.classList.toggle('active', mode === 'SPLIT');
      splitBtn.disabled = mode === 'SPLIT';
    }
  }

  function handleFocusChange(data) {
    log('Focus change:', data);
    setFocus(data.playerId, data.isManual);
  }

  function handleActiveSpeakerChange(data) {
    log('Active speaker:', data);
    updateSpeakerHighlights(data.playerId);
  }

  // ============================================
  // VISIBILITY
  // ============================================
  
  function show() {
    if (!container) init();
    
    container.classList.add('active');
    refreshParticipants();
    log('Briefing UI shown');
  }

  function hide() {
    if (!container) return;
    container.classList.remove('active');
    // Retirer la classe split du body
    document.body.classList.remove('video-split-active');
    log('Briefing UI hidden');
  }

  function isVisible() {
    return container && container.classList.contains('active');
  }
  
  function updateBodyClass(mode) {
    if (mode === 'SPLIT') {
      document.body.classList.add('video-split-active');
    } else {
      document.body.classList.remove('video-split-active');
    }
  }

  function updateExpandButton(visible) {
    if (!expandBtn) return;
    
    if (visible) {
      expandBtn.classList.add('visible');
    } else {
      expandBtn.classList.remove('visible');
    }
  }

  // ============================================
  // PARTICIPANTS MANAGEMENT
  // ============================================
  
  function refreshParticipants() {
    if (!window.videoModeCtrl) return;
    
    const participants = window.videoModeCtrl.getParticipants();
    const currentFocus = window.videoModeCtrl.getFocusedPlayerId();
    
    log('Refreshing participants:', participants.length);
    
    // Clear existing thumbs
    thumbsSidebar.innerHTML = '';
    thumbElements.clear();
    
    // Create thumbnail for each participant
    participants.forEach(p => {
      if (p.playerId === currentFocus) return; // Skip focused player in thumbs
      
      const thumb = createThumbnail(p);
      thumbsSidebar.appendChild(thumb);
      thumbElements.set(p.playerId, thumb);
    });
    
    // Set focus
    if (currentFocus) {
      setFocus(currentFocus, false);
    } else if (participants.length > 0) {
      // Auto-focus first participant
      setFocus(participants[0].playerId, false);
    }
    
    // Attach video tracks
    attachVideoTracks();
  }

  function createThumbnail(participant) {
    const thumb = document.createElement('div');
    thumb.className = 'video-thumb empty';
    thumb.dataset.playerId = participant.playerId;
    
    // Name label
    const nameEl = document.createElement('div');
    nameEl.className = 'thumb-name';
    nameEl.textContent = participant.name || 'Joueur';
    thumb.appendChild(nameEl);
    
    // Click to focus
    thumb.addEventListener('click', () => {
      log('Thumbnail clicked:', participant.playerId);
      if (window.videoModeCtrl) {
        window.videoModeCtrl.setManualFocus(participant.playerId);
      }
    });
    
    // Mark if dead
    if (!participant.alive) {
      thumb.classList.add('is-dead');
    }
    
    return thumb;
  }

  // ============================================
  // FOCUS MANAGEMENT
  // ============================================
  
  function setFocus(playerId, isManual) {
    if (!playerId) return;
    
    const ctrl = window.videoModeCtrl;
    if (!ctrl) return;
    
    const participants = ctrl.getParticipants();
    const focusedPlayer = participants.find(p => p.playerId === playerId);
    
    if (!focusedPlayer) {
      log('Player not found for focus:', playerId);
      return;
    }
    
    currentFocusId = playerId;
    
    // Update focus name
    const nameEl = document.getElementById('focusPlayerName');
    if (nameEl) {
      nameEl.textContent = focusedPlayer.name || 'Joueur';
    }
    
    // Update focus video
    focusMain.classList.remove('empty');
    attachFocusVideo(playerId);
    
    // Update thumbnail highlights
    thumbElements.forEach((el, id) => {
      el.classList.toggle('is-focused', id === playerId);
    });
    
    // Rebuild thumbs to exclude focused player
    rebuildThumbs(playerId);
    
    log('Focus set to:', playerId, focusedPlayer.name);
  }

  function rebuildThumbs(focusedId) {
    if (!window.videoModeCtrl) return;
    
    const participants = window.videoModeCtrl.getParticipants();
    
    // Clear
    thumbsSidebar.innerHTML = '';
    thumbElements.clear();
    
    // Recreate without focused player
    participants.forEach(p => {
      if (p.playerId === focusedId) return;
      
      const thumb = createThumbnail(p);
      thumbsSidebar.appendChild(thumb);
      thumbElements.set(p.playerId, thumb);
    });
    
    // Reattach tracks
    attachVideoTracks();
  }

  // ============================================
  // VIDEO TRACK ATTACHMENT
  // ============================================
  
  function attachVideoTracks() {
    // Get tracks from video-tracks.js registry
    const tracks = window.VideoTracksRegistry?.getAll() || getTracksFromGlobal();
    
    tracks.forEach((track, playerId) => {
      if (playerId === currentFocusId) {
        attachFocusVideo(playerId);
      } else {
        attachThumbVideo(playerId, track);
      }
    });
  }

  function getTracksFromGlobal() {
    // Fallback: try to find tracks from existing video-tracks.js internals
    // This is a compatibility layer
    const result = new Map();
    
    // Check for Daily participants
    const callObj = window.dailyVideo?.callObject;
    if (!callObj) return result;
    
    try {
      const participants = callObj.participants();
      Object.entries(participants).forEach(([key, p]) => {
        if (key === 'local') return;
        
        const userName = p.user_name || '';
        const idx = userName.lastIndexOf('#');
        const playerId = idx !== -1 ? userName.slice(idx + 1).trim() : '';
        
        if (playerId && p.tracks?.video?.track) {
          result.set(playerId, p.tracks.video.track);
        }
      });
    } catch (e) {
      log('Error getting tracks:', e);
    }
    
    return result;
  }

  function attachFocusVideo(playerId) {
    const track = getTrackForPlayer(playerId);
    if (!track) {
      focusMain.classList.add('empty');
      return;
    }
    
    focusMain.classList.remove('empty');
    
    // Remove old video if exists
    if (focusVideoEl) {
      focusVideoEl.remove();
    }
    
    // Create new video element
    focusVideoEl = document.createElement('video');
    focusVideoEl.autoplay = true;
    focusVideoEl.playsInline = true;
    focusVideoEl.muted = isLocalPlayer(playerId);
    
    const stream = new MediaStream([track]);
    try {
      focusVideoEl.srcObject = stream;
    } catch (e) {
      focusVideoEl.src = URL.createObjectURL(stream);
    }
    
    // Insert before name overlay
    focusMain.insertBefore(focusVideoEl, focusNameEl);
    
    log('Focus video attached for:', playerId);
  }

  function attachThumbVideo(playerId, track) {
    const thumb = thumbElements.get(playerId);
    if (!thumb || !track) return;
    
    thumb.classList.remove('empty');
    
    // Remove existing video
    const existingVideo = thumb.querySelector('video');
    if (existingVideo) existingVideo.remove();
    
    // Create video
    const video = document.createElement('video');
    video.autoplay = true;
    video.playsInline = true;
    video.muted = true; // Always mute thumbs
    
    const stream = new MediaStream([track]);
    try {
      video.srcObject = stream;
    } catch (e) {
      video.src = URL.createObjectURL(stream);
    }
    
    // Insert before name label
    const nameEl = thumb.querySelector('.thumb-name');
    thumb.insertBefore(video, nameEl);
  }

  function getTrackForPlayer(playerId) {
    const callObj = window.dailyVideo?.callObject;
    if (!callObj) return null;
    
    try {
      const participants = callObj.participants();
      
      // Check local first
      const local = participants.local;
      if (local) {
        const localId = getPlayerIdFromUserName(local.user_name);
        if (localId === playerId && local.tracks?.video?.track) {
          return local.tracks.video.track;
        }
      }
      
      // Check remotes
      for (const [key, p] of Object.entries(participants)) {
        if (key === 'local') continue;
        
        const pId = getPlayerIdFromUserName(p.user_name);
        if (pId === playerId && p.tracks?.video?.track) {
          return p.tracks.video.track;
        }
      }
    } catch (e) {
      log('Error getting track:', e);
    }
    
    return null;
  }

  function isLocalPlayer(playerId) {
    const state = window.lastKnownState;
    const localId = state?.you?.playerId || window.playerId;
    return localId === playerId;
  }

  function getPlayerIdFromUserName(userName) {
    if (!userName) return '';
    const idx = userName.lastIndexOf('#');
    return idx !== -1 ? userName.slice(idx + 1).trim() : '';
  }

  // ============================================
  // SPEAKER HIGHLIGHTS
  // ============================================
  
  function updateSpeakerHighlights(speakerId) {
    // Update focus speaker badge
    const badge = document.getElementById('focusSpeakerBadge');
    if (badge) {
      badge.style.display = (speakerId === currentFocusId) ? 'inline-block' : 'none';
    }
    
    // Update focus main speaking state
    focusMain?.classList.toggle('is-speaking', speakerId === currentFocusId);
    
    // Update thumbnails
    thumbElements.forEach((el, id) => {
      el.classList.toggle('is-speaking', id === speakerId);
    });
  }

  // ============================================
  // UTILITIES
  // ============================================
  
  function getPhaseLabel(phase) {
    const labels = {
      'DEBATE': 'DÉBAT',
      'VOTING': 'VOTE',
      'DAY_DEBATE': 'DISCUSSION',
      'DAY_VOTE': 'VOTE',
      'DISCUSSION': 'DISCUSSION',
      'GAME_OVER': 'FIN'
    };
    return labels[phase] || phase || 'BRIEFING';
  }

  // ============================================
  // PUBLIC API
  // ============================================
  
  window.VideoBriefingUI = {
    init,
    show,
    hide,
    isVisible,
    refreshParticipants,
    setFocus,
    
    // For external updates (e.g., from video-tracks.js)
    onTrackStarted: (playerId, track) => {
      if (isVisible()) {
        if (playerId === currentFocusId) {
          attachFocusVideo(playerId);
        } else {
          attachThumbVideo(playerId, track);
        }
      }
    },
    
    onTrackStopped: (playerId) => {
      if (playerId === currentFocusId) {
        focusMain?.classList.add('empty');
      } else {
        const thumb = thumbElements.get(playerId);
        if (thumb) {
          thumb.classList.add('empty');
          const video = thumb.querySelector('video');
          if (video) video.remove();
        }
      }
    }
  };

  // Auto-init when DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  console.log('[VideoBriefingUI] D4 Module loaded ✅');

})();
