/**
 * VIDEO MODE CONTROLLER - D4 "Salle de Briefing"
 * ==============================================
 * 
 * Machine à états centralisée pour le mode visio avancé.
 * Gère les transitions entre modes inline/advanced selon phase et seuils.
 * 
 * États possibles:
 * - OFF: Aucune visio
 * - INLINE: Vignettes dans players-list (< seuil joueurs ou hors débat)
 * - ADVANCED_FOCUS: Mode "réunion" avec focus + sidebar (débat/vote + seuil atteint)
 * - PIP: Picture-in-Picture (nuit/action sur PC)
 * - HIDDEN: Visio masquée (phases privées)
 */

(function() {
  'use strict';

  // ============================================
  // CONFIGURATION
  // ============================================
  
  const CONFIG = {
    // Seuil minimum de joueurs pour activer le mode avancé
    PLAYER_THRESHOLD: 4, // D4: abaissé à 4 pour tests (recommandé: 6 pour prod)
    
    // Délai de stabilisation active speaker (ms)
    SPEAKER_STABILIZATION_DELAY: 700,
    
    // Durée du focus manuel avant retour auto (ms)
    MANUAL_FOCUS_TIMEOUT: 12000,
    
    // Phases qui activent le mode avancé
    ADVANCED_PHASES: [
      'DEBATE', 'VOTING', 'DAY_DEBATE', 'DAY_VOTE', 'DISCUSSION', 'GAME_OVER',
      // Phases spécifiques Saboteur
      'ROLE_REVEAL', 'CAPTAIN_CANDIDACY', 'CAPTAIN_VOTE', 'DAY', 'DAY_DISCUSSION',
      'EJECTION_REVEAL', 'FINAL_VOTE'
    ],
    
    // Phases de nuit (PiP possible)
    NIGHT_PHASES: ['NIGHT', 'NIGHT_SABOTEURS', 'SABOTEURS', 'DOCTOR', 'RADAR_OFFICER', 'SECURITY', 'ACTION'],
    
    // Phases privées (visio cachée)
    PRIVATE_PHASES: ['NIGHT_SABOTEURS', 'SABOTEURS_PRIVATE'],
    
    // Debug
    DEBUG: true
  };

  // ============================================
  // DÉTECTION DEVICE
  // ============================================
  
  const IS_MOBILE = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || window.innerWidth < 768;

  // ============================================
  // ÉTATS
  // ============================================
  
  const VideoMode = {
    OFF: 'OFF',
    INLINE: 'INLINE',
    SPLIT: 'SPLIT',           // D4: Nouveau mode 50/50
    ADVANCED_FOCUS: 'ADVANCED_FOCUS', // Plein écran
    PIP: 'PIP',
    HIDDEN: 'HIDDEN'
  };

  // ============================================
  // CONTROLLER
  // ============================================
  
  class VideoModeController {
    constructor() {
      this.currentMode = VideoMode.OFF;
      this.previousMode = null;
      this.activePlayerCount = 0;
      this.currentPhase = 'LOBBY';
      this.isVideoJoined = false;
      
      // Focus management
      this.focusedPlayerId = null;
      this.activeSpeakerId = null;
      this.isManualFocus = false;
      this.manualFocusTimer = null;
      this.speakerDebounceTimer = null;
      
      // Participants tracking
      this.participants = new Map(); // playerId -> { name, hasVideo, hasAudio }
      
      // Event listeners storage
      this._listeners = {};
      
      // Mobile manual activation
      this.mobileManuallyActivated = false;
      
      this.log('Controller initialized', { IS_MOBILE });
    }

    // ============================================
    // LOGGING
    // ============================================
    
    log(...args) {
      if (CONFIG.DEBUG) {
        console.log('[VideoModeCtrl]', ...args);
      }
    }

    // ============================================
    // EVENT SYSTEM
    // ============================================
    
    on(event, callback) {
      if (!this._listeners[event]) {
        this._listeners[event] = [];
      }
      this._listeners[event].push(callback);
    }

    off(event, callback) {
      if (!this._listeners[event]) return;
      this._listeners[event] = this._listeners[event].filter(cb => cb !== callback);
    }

    emit(event, data) {
      if (!this._listeners[event]) return;
      this._listeners[event].forEach(cb => {
        try {
          cb(data);
        } catch (e) {
          console.error('[VideoModeCtrl] Event handler error:', e);
        }
      });
    }

    // ============================================
    // STATE UPDATES
    // ============================================
    
    /**
     * Met à jour l'état depuis roomState (appelé par video-integration-client.js)
     */
    updateFromRoomState(state) {
      if (!state) return;
      
      this.currentPhase = state.phase || 'LOBBY';
      
      // Compter les joueurs vivants avec vidéo potentiellement active
      const players = state.players || [];
      const alivePlayers = players.filter(p => p.alive !== false);
      this.activePlayerCount = alivePlayers.length;
      
      // Update participants map
      this.participants.clear();
      alivePlayers.forEach(p => {
        this.participants.set(p.playerId, {
          name: p.name,
          alive: p.alive !== false,
          hasVideo: true, // Will be updated by track events
          hasAudio: true
        });
      });
      
      this.log('State updated', {
        phase: this.currentPhase,
        playerCount: this.activePlayerCount,
        isVideoJoined: this.isVideoJoined
      });
      
      this.evaluateMode();
    }

    /**
     * Signale que la vidéo Daily est connectée
     */
    setVideoJoined(joined) {
      this.isVideoJoined = !!joined;
      this.log('Video joined:', joined);
      this.evaluateMode();
    }

    /**
     * Active manuellement le mode avancé sur mobile
     */
    activateMobileAdvanced() {
      if (!IS_MOBILE) return;
      this.mobileManuallyActivated = true;
      this.log('Mobile advanced mode manually activated');
      this.evaluateMode();
    }

    /**
     * Désactive le mode avancé sur mobile
     */
    deactivateMobileAdvanced() {
      if (!IS_MOBILE) return;
      this.mobileManuallyActivated = false;
      this.log('Mobile advanced mode deactivated');
      this.evaluateMode();
    }

    /**
     * D4: Bascule vers le mode split (50/50)
     */
    setSplitMode() {
      this.log('Switching to SPLIT mode');
      this.setMode(VideoMode.SPLIT);
    }

    /**
     * D4: Bascule vers le mode plein écran
     */
    setFullMode() {
      this.log('Switching to FULL (ADVANCED_FOCUS) mode');
      this.setMode(VideoMode.ADVANCED_FOCUS);
    }

    /**
     * D4: Bascule vers le mode inline (fermer briefing)
     */
    setInlineMode() {
      this.log('Switching to INLINE mode');
      this.mobileManuallyActivated = false;
      this.setMode(VideoMode.INLINE);
    }

    /**
     * D4: Cycle entre les modes (pour un bouton toggle)
     */
    cycleMode() {
      switch (this.currentMode) {
        case VideoMode.INLINE:
          this.setMode(VideoMode.SPLIT);
          break;
        case VideoMode.SPLIT:
          this.setMode(VideoMode.ADVANCED_FOCUS);
          break;
        case VideoMode.ADVANCED_FOCUS:
          this.setMode(VideoMode.INLINE);
          break;
        default:
          this.setMode(VideoMode.SPLIT);
      }
    }

    // ============================================
    // MODE EVALUATION (CORE LOGIC)
    // ============================================
    
    evaluateMode() {
      if (!this.isVideoJoined) {
        this.setMode(VideoMode.OFF);
        return;
      }
      
      const phase = this.currentPhase;
      const playerCount = this.activePlayerCount;
      
      // Phase privée = masqué
      if (CONFIG.PRIVATE_PHASES.includes(phase)) {
        this.setMode(VideoMode.HIDDEN);
        return;
      }
      
      // Phase de nuit = PiP (PC) ou inline (mobile)
      if (CONFIG.NIGHT_PHASES.includes(phase)) {
        if (IS_MOBILE) {
          this.setMode(VideoMode.INLINE);
        } else {
          this.setMode(VideoMode.PIP);
        }
        return;
      }
      
      // Phases avancées (débat/vote)
      if (CONFIG.ADVANCED_PHASES.includes(phase)) {
        // Vérifier le seuil de joueurs
        if (playerCount >= CONFIG.PLAYER_THRESHOLD) {
          // Mobile: nécessite activation manuelle
          if (IS_MOBILE && !this.mobileManuallyActivated) {
            this.setMode(VideoMode.INLINE);
            return;
          }
          // D4: Mode SPLIT par défaut (au lieu de ADVANCED_FOCUS)
          // L'utilisateur peut passer en plein écran avec le bouton "Max"
          if (this.currentMode !== VideoMode.ADVANCED_FOCUS && this.currentMode !== VideoMode.SPLIT) {
            this.setMode(VideoMode.SPLIT);
          }
          return;
        }
      }
      
      // Par défaut: inline
      this.setMode(VideoMode.INLINE);
    }

    setMode(newMode) {
      if (this.currentMode === newMode) return;
      
      this.previousMode = this.currentMode;
      this.currentMode = newMode;
      
      this.log(`Mode changed: ${this.previousMode} → ${this.currentMode}`);
      
      this.emit('modeChange', {
        mode: this.currentMode,
        previousMode: this.previousMode,
        phase: this.currentPhase,
        playerCount: this.activePlayerCount
      });
    }

    // ============================================
    // FOCUS MANAGEMENT
    // ============================================
    
    /**
     * Active speaker change (depuis Daily)
     */
    setActiveSpeaker(playerId) {
      if (this.speakerDebounceTimer) {
        clearTimeout(this.speakerDebounceTimer);
      }
      
      // Debounce pour éviter le clignotement
      this.speakerDebounceTimer = setTimeout(() => {
        if (this.activeSpeakerId === playerId) return;
        
        this.activeSpeakerId = playerId;
        this.log('Active speaker:', playerId);
        
        this.emit('activeSpeakerChange', { playerId });
        
        // Auto-focus si pas de focus manuel actif
        if (!this.isManualFocus && playerId) {
          this.setFocus(playerId, false);
        }
      }, CONFIG.SPEAKER_STABILIZATION_DELAY);
    }

    /**
     * Focus manuel sur un joueur
     */
    setManualFocus(playerId) {
      this.setFocus(playerId, true);
    }

    /**
     * Focus (interne)
     */
    setFocus(playerId, isManual) {
      if (this.focusedPlayerId === playerId) return;
      
      const previousFocus = this.focusedPlayerId;
      this.focusedPlayerId = playerId;
      this.isManualFocus = isManual;
      
      // Timer de retour auto si focus manuel
      if (isManual) {
        if (this.manualFocusTimer) {
          clearTimeout(this.manualFocusTimer);
        }
        this.manualFocusTimer = setTimeout(() => {
          this.isManualFocus = false;
          // Revenir à l'active speaker si disponible
          if (this.activeSpeakerId && this.activeSpeakerId !== this.focusedPlayerId) {
            this.setFocus(this.activeSpeakerId, false);
          }
        }, CONFIG.MANUAL_FOCUS_TIMEOUT);
      }
      
      this.log('Focus changed:', { playerId, isManual, previousFocus });
      
      this.emit('focusChange', {
        playerId,
        previousPlayerId: previousFocus,
        isManual
      });
    }

    /**
     * Annule le focus manuel (retour à l'auto)
     */
    clearManualFocus() {
      if (this.manualFocusTimer) {
        clearTimeout(this.manualFocusTimer);
        this.manualFocusTimer = null;
      }
      this.isManualFocus = false;
      
      if (this.activeSpeakerId) {
        this.setFocus(this.activeSpeakerId, false);
      }
    }

    // ============================================
    // GETTERS
    // ============================================
    
    getMode() {
      return this.currentMode;
    }

    isAdvancedMode() {
      return this.currentMode === VideoMode.ADVANCED_FOCUS;
    }

    isSplitMode() {
      return this.currentMode === VideoMode.SPLIT;
    }

    isInlineMode() {
      return this.currentMode === VideoMode.INLINE;
    }

    isBriefingActive() {
      return this.currentMode === VideoMode.ADVANCED_FOCUS || this.currentMode === VideoMode.SPLIT;
    }

    getFocusedPlayerId() {
      return this.focusedPlayerId;
    }

    getActiveSpeakerId() {
      return this.activeSpeakerId;
    }

    getParticipants() {
      return Array.from(this.participants.entries()).map(([id, data]) => ({
        playerId: id,
        ...data
      }));
    }

    canActivateAdvanced() {
      return this.activePlayerCount >= CONFIG.PLAYER_THRESHOLD &&
             CONFIG.ADVANCED_PHASES.includes(this.currentPhase);
    }

    // ============================================
    // CLEANUP
    // ============================================
    
    destroy() {
      if (this.manualFocusTimer) clearTimeout(this.manualFocusTimer);
      if (this.speakerDebounceTimer) clearTimeout(this.speakerDebounceTimer);
      this._listeners = {};
      this.participants.clear();
    }
  }

  // ============================================
  // EXPORT GLOBAL
  // ============================================
  
  window.VideoModeController = VideoModeController;
  window.VideoMode = VideoMode;
  window.videoModeCtrl = new VideoModeController();
  
  console.log('[VideoModeController] D4 Module loaded ✅');

})();
