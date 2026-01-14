/**
 * Audio Mixer - Gestion du mixage MP3 jeu + Audio vidéo
 * À ajouter dans public/client.js ou créer un fichier séparé
 */

class AudioMixer {
  constructor() {
    this.gameVolume = 1.0;      // Volume par défaut MP3
    this.videoActive = false;
    this.videoHasPeople = false;
  }

  /**
   * Ajuste le volume des MP3 selon l'état de la vidéo
   */
  adjustGameVolume() {
    // Si vidéo active avec des gens qui parlent potentiellement
    if (this.videoActive && this.videoHasPeople) {
      this.gameVolume = 0.3;  // Baisser à 30%
    } else {
      this.gameVolume = 1.0;  // Volume normal
    }

    // Appliquer aux éléments audio HTML
    const audioElements = document.querySelectorAll('audio');
    audioElements.forEach(audio => {
      audio.volume = this.gameVolume;
    });

    console.log(`[AudioMixer] Game volume: ${Math.round(this.gameVolume * 100)}%`);
  }

  /**
   * Appelé quand la vidéo s'active
   */
  onVideoStart() {
    this.videoActive = true;
    this.adjustGameVolume();
  }

  /**
   * Appelé quand la vidéo se désactive
   */
  onVideoStop() {
    this.videoActive = false;
    this.adjustGameVolume();
  }

  /**
   * Appelé quand les permissions changent
   */
  onPermissionsChange(permissions) {
    // Si audio actif = des gens peuvent parler
    this.videoHasPeople = permissions.audio === true;
    this.adjustGameVolume();
  }

  /**
   * Muet temporaire des MP3 (pour annonces importantes)
   */
  muteGame(duration = 3000) {
    const originalVolume = this.gameVolume;
    this.gameVolume = 0;
    this.adjustGameVolume();

    setTimeout(() => {
      this.gameVolume = originalVolume;
      this.adjustGameVolume();
    }, duration);
  }
}

// Instance globale
window.audioMixer = new AudioMixer();

// INTÉGRATION dans video-integration-client.js
// Modifier la fonction initVideoForGame :

function initVideoForGame(state) {
  // ... code existant ...
  
  window.dailyVideo.joinRoom(videoRoomUrl, userName, permissions)
    .then(() => {
      videoRoomJoined = true;
      console.log('[Video] Successfully joined room');
      
      // ✨ NOUVEAU : Notifier le mixer
      window.audioMixer.onVideoStart();
      
      showVideoStatus('✅ Visio activée', 'success');
    })
    .catch(err => {
      console.error('[Video] Join error:', err);
      showVideoStatus('❌ Erreur de connexion vidéo', 'error');
    });
}

// Modifier la fonction updateVideoPermissions :

function updateVideoPermissions(state) {
  if (!videoRoomJoined || !window.dailyVideo.callFrame) {
    return;
  }

  const permissions = state.videoPermissions;
  if (!permissions) return;

  console.log('[Video] Updating permissions:', permissions);
  window.dailyVideo.updatePermissions(permissions);

  // ✨ NOUVEAU : Ajuster le volume selon permissions
  window.audioMixer.onPermissionsChange(permissions);

  // Afficher le message de phase
  if (state.videoPhaseMessage) {
    showVideoStatus(state.videoPhaseMessage, 'info');
  }
}

// Modifier la fonction leaveVideoRoom :

function leaveVideoRoom() {
  if (!videoRoomJoined) return;

  console.log('[Video] Leaving room...');
  window.dailyVideo.leave();
  videoRoomJoined = false;
  videoRoomUrl = null;
  
  // ✨ NOUVEAU : Remettre volume normal
  window.audioMixer.onVideoStop();
  
  showVideoStatus('📹 Visio terminée', 'info');
}
