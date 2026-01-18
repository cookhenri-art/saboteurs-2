/* =========================================================
   D7 - ANIMATIONS UX / VISUEL
   Module pour les animations d'éjection, vote, speaking glow
   Version: 1.0
========================================================= */
(function() {
  'use strict';

  const DEBUG = true;
  function log(...args) { if (DEBUG) console.log('[D7-Animations]', ...args); }

  // =========================================================
  // D7.1 - ANIMATION D'ÉJECTION
  // =========================================================
  
  /**
   * Anime l'éjection d'un joueur
   * @param {string} playerId - ID du joueur éjecté
   * @param {Function} callback - Callback après animation
   */
  function animateEjection(playerId, callback) {
    log('Animating ejection for player:', playerId);
    
    // Trouver toutes les cartes du joueur
    const selectors = [
      `.choice-card[data-player-id="${playerId}"]`,
      `.player-card[data-player-id="${playerId}"]`,
      `.player-item[data-player-id="${playerId}"]`
    ];
    
    const elements = [];
    selectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(el => elements.push(el));
    });
    
    if (elements.length === 0) {
      log('No elements found for player:', playerId);
      if (callback) callback();
      return;
    }
    
    // Appliquer l'animation
    elements.forEach(el => {
      el.classList.add('ejecting');
    });
    
    // Vibration mobile si disponible
    if (navigator.vibrate) {
      navigator.vibrate([100, 50, 100, 50, 200]);
    }
    
    // Callback après l'animation (1.2s)
    setTimeout(() => {
      if (callback) callback();
    }, 1200);
  }

  // =========================================================
  // D7.2 - ANIMATION DE VOTE
  // =========================================================
  
  /**
   * Anime quand un joueur vote
   * @param {string} voterId - ID du joueur qui vote
   * @param {string} targetId - ID du joueur ciblé (optionnel)
   */
  function animateVote(voterId, targetId) {
    log('Animating vote from:', voterId, 'to:', targetId);
    
    // Animation sur la carte du joueur ciblé
    if (targetId) {
      const targetSelectors = [
        `.choice-card[data-player-id="${targetId}"]`,
        `.player-card[data-player-id="${targetId}"]`
      ];
      
      targetSelectors.forEach(selector => {
        document.querySelectorAll(selector).forEach(el => {
          el.classList.remove('just-voted');
          // Force reflow pour redémarrer l'animation
          void el.offsetWidth;
          el.classList.add('just-voted');
          
          // Retirer la classe après l'animation
          setTimeout(() => el.classList.remove('just-voted'), 600);
        });
      });
    }
    
    // Petite vibration mobile
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
  }

  /**
   * Met à jour le compteur de votes avec animation
   * @param {HTMLElement} counterElement - Élément du compteur
   * @param {number} newValue - Nouvelle valeur
   */
  function animateVoteCounter(counterElement, newValue) {
    if (!counterElement) return;
    
    counterElement.classList.remove('updated');
    void counterElement.offsetWidth;
    counterElement.textContent = newValue;
    counterElement.classList.add('updated');
    
    setTimeout(() => counterElement.classList.remove('updated'), 400);
  }

  // =========================================================
  // D7.3 - SPEAKING GLOW AMÉLIORÉ
  // =========================================================
  
  let currentSpeaker = null;
  
  /**
   * Met à jour l'indicateur de qui parle
   * @param {string} playerId - ID du joueur qui parle (null si personne)
   */
  function updateSpeakingIndicator(playerId) {
    // Retirer l'ancien indicateur
    if (currentSpeaker) {
      const oldSelectors = [
        `.video-thumb[data-player-id="${currentSpeaker}"]`,
        `.player-video-slot[data-player-id="${currentSpeaker}"]`,
        `.player-item[data-player-id="${currentSpeaker}"]`
      ];
      
      oldSelectors.forEach(selector => {
        document.querySelectorAll(selector).forEach(el => {
          el.classList.remove('speaking', 'is-speaking');
        });
      });
    }
    
    currentSpeaker = playerId;
    
    // Ajouter le nouvel indicateur
    if (playerId) {
      const newSelectors = [
        `.video-thumb[data-player-id="${playerId}"]`,
        `.player-video-slot[data-player-id="${playerId}"]`,
        `.player-item[data-player-id="${playerId}"]`
      ];
      
      newSelectors.forEach(selector => {
        document.querySelectorAll(selector).forEach(el => {
          el.classList.add('speaking');
          if (el.classList.contains('player-item')) {
            el.classList.add('is-speaking');
          }
        });
      });
      
      log('Speaking indicator updated for:', playerId);
    }
  }

  // =========================================================
  // D7.4 - ANIMATION DE RÉVÉLATION DE RÔLE
  // =========================================================
  
  /**
   * Anime la révélation du rôle
   * @param {HTMLElement} roleElement - Élément .role-display
   */
  function animateRoleReveal(roleElement) {
    if (!roleElement) {
      roleElement = document.querySelector('.role-display');
    }
    
    if (!roleElement) return;
    
    roleElement.classList.remove('revealing');
    void roleElement.offsetWidth;
    roleElement.classList.add('revealing');
    
    // Vibration de révélation
    if (navigator.vibrate) {
      navigator.vibrate([50, 30, 50, 30, 100]);
    }
    
    setTimeout(() => roleElement.classList.remove('revealing'), 1000);
  }

  // =========================================================
  // D7.5 - ANIMATION DE TRANSITION DE PHASE
  // =========================================================
  
  /**
   * Anime la transition vers une nouvelle phase
   * @param {HTMLElement} container - Container de la phase
   */
  function animatePhaseTransition(container) {
    if (!container) return;
    
    container.classList.remove('phase-transition');
    void container.offsetWidth;
    container.classList.add('phase-transition');
    
    setTimeout(() => container.classList.remove('phase-transition'), 800);
  }

  // =========================================================
  // D7.6 - ANIMATION DE MORT
  // =========================================================
  
  /**
   * Anime la mort d'un joueur (moins dramatique que l'éjection)
   * @param {string} playerId - ID du joueur mort
   * @param {Function} callback - Callback après animation
   */
  function animateDeath(playerId, callback) {
    log('Animating death for player:', playerId);
    
    const selectors = [
      `.choice-card[data-player-id="${playerId}"]`,
      `.player-card[data-player-id="${playerId}"]`,
      `.video-thumb[data-player-id="${playerId}"]`
    ];
    
    selectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(el => {
        el.classList.add('dead-animation');
      });
    });
    
    // Vibration de mort
    if (navigator.vibrate) {
      navigator.vibrate([200, 100, 300]);
    }
    
    setTimeout(() => {
      if (callback) callback();
    }, 1500);
  }

  // =========================================================
  // D7.7 - ANIMATION DE VICTOIRE
  // =========================================================
  
  /**
   * Anime l'écran de victoire
   * @param {boolean} isWinner - Si le joueur local a gagné
   */
  function animateVictory(isWinner) {
    log('Animating victory, isWinner:', isWinner);
    
    const endScreen = document.getElementById('endScreen');
    if (!endScreen) return;
    
    endScreen.classList.add('victory-animation');
    
    // Confetti effect si victoire
    if (isWinner) {
      createConfetti();
      
      // Grande vibration de victoire
      if (navigator.vibrate) {
        navigator.vibrate([100, 50, 100, 50, 100, 50, 300]);
      }
    }
    
    setTimeout(() => endScreen.classList.remove('victory-animation'), 2000);
  }

  /**
   * Crée un effet de confettis
   */
  function createConfetti() {
    const colors = ['#00ffff', '#ff6b35', '#00ff88', '#9d4edd', '#ffd700'];
    const confettiCount = 50;
    
    for (let i = 0; i < confettiCount; i++) {
      const confetti = document.createElement('div');
      confetti.style.cssText = `
        position: fixed;
        width: 10px;
        height: 10px;
        background: ${colors[Math.floor(Math.random() * colors.length)]};
        left: ${Math.random() * 100}vw;
        top: -20px;
        border-radius: ${Math.random() > 0.5 ? '50%' : '0'};
        pointer-events: none;
        z-index: 10000;
        animation: confettiFall ${2 + Math.random() * 3}s linear forwards;
      `;
      document.body.appendChild(confetti);
      
      // Nettoyer après animation
      setTimeout(() => confetti.remove(), 5000);
    }
  }

  // Ajouter l'animation de confetti au CSS dynamiquement
  const confettiStyle = document.createElement('style');
  confettiStyle.textContent = `
    @keyframes confettiFall {
      to {
        transform: translateY(100vh) rotate(720deg);
        opacity: 0;
      }
    }
  `;
  document.head.appendChild(confettiStyle);

  // =========================================================
  // D7.8 - INTÉGRATION AVEC LE JEU
  // =========================================================
  
  /**
   * Hook pour intercepter les événements de jeu
   */
  function setupGameHooks() {
    // Écouter les événements socket si disponible
    if (typeof socket !== 'undefined') {
      // Éjection
      socket.on('playerEjected', (data) => {
        if (data && data.playerId) {
          animateEjection(data.playerId);
        }
      });
      
      // Vote
      socket.on('voteRegistered', (data) => {
        if (data && data.voterId) {
          animateVote(data.voterId, data.targetId);
        }
      });
      
      // Speaking (déjà géré par video-tracks.js normalement)
      socket.on('activeSpeaker', (data) => {
        if (data) {
          updateSpeakingIndicator(data.playerId);
        }
      });
      
      log('Game hooks set up');
    }
  }

  // =========================================================
  // D11 - ANIMATION ÉLECTION CAPITAINE
  // =========================================================
  
  /**
   * Anime l'élection du capitaine avec un effet de couronne/étoile
   */
  function animateCaptainElection() {
    log('Animating captain election');
    
    // Chercher le conteneur de phase ou créer un overlay
    const gameContent = document.querySelector('#gameContent') || document.querySelector('.game-content');
    
    // Créer un overlay d'animation
    const overlay = document.createElement('div');
    overlay.id = 'captainElectionOverlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(0, 0, 0, 0.7);
      z-index: 9999;
      animation: fadeInCaptain 0.5s ease-out;
      pointer-events: none;
    `;
    
    // Emoji de capitaine selon le thème
    const captainEmoji = '⭐';
    
    overlay.innerHTML = `
      <div style="
        font-size: 8rem;
        animation: captainBounce 1s ease-out;
        text-shadow: 0 0 30px gold, 0 0 60px gold;
      ">${captainEmoji}</div>
    `;
    
    document.body.appendChild(overlay);
    
    // Vibration
    if (navigator.vibrate) {
      navigator.vibrate([100, 50, 100, 50, 200]);
    }
    
    // Supprimer après l'animation
    setTimeout(() => {
      overlay.style.animation = 'fadeOutCaptain 0.5s ease-out forwards';
      setTimeout(() => overlay.remove(), 500);
    }, 1500);
  }

  // =========================================================
  // EXPOSITION GLOBALE
  // =========================================================
  
  window.D7Animations = {
    animateEjection,
    animateVote,
    animateVoteCounter,
    updateSpeakingIndicator,
    animateRoleReveal,
    animatePhaseTransition,
    animateDeath,
    animateVictory,
    animateCaptainElection,
    createConfetti,
    setupGameHooks
  };

  // Auto-setup au chargement
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupGameHooks);
  } else {
    setupGameHooks();
  }

  log('D7 Animations module loaded');

})();
