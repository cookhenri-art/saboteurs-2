/* =========================================================
   D7 - ANIMATIONS UX / VISUEL
   Module pour les animations d'élimination, vote, speaking glow
   Version: 1.1 - PEGI 12
========================================================= */
(function() {
  'use strict';

  const DEBUG = true;
  function log(...args) { if (DEBUG) console.log('[D7-Animations]', ...args); }

  // =========================================================
  // D7.1 - ANIMATION D'ÉLIMINATION
  // =========================================================
  
  /**
   * Anime l'élimination d'un ou plusieurs joueurs
   * @param {string|string[]} playerIds - ID(s) du/des joueur(s) éliminé(s)
   * @param {Function} callback - Callback après animation
   */
  function animateEjection(playerIds, callback) {
    // V32: Support pour plusieurs joueurs
    const ids = Array.isArray(playerIds) ? playerIds : [playerIds];
    log('Animating elimination for players:', ids);
    
    // Récupérer les infos de tous les joueurs éliminés
    const players = ids.map(id => window.lastKnownState?.players?.find(p => p.playerId === id)).filter(Boolean);
    
    if (players.length === 0) {
      log('No players found for elimination animation');
      return;
    }
    
    // V32: Générer les avatars de tous les joueurs éliminés
    const avatarsHtml = players.map(player => {
      const playerName = player?.name || 'Joueur';
      let avatarHtml = '';
      
      // Vérifier si c'est une URL/chemin ou un emoji
      if (player?.avatarUrl) {
        const isImageUrl = player.avatarUrl.startsWith('http') || 
                           player.avatarUrl.startsWith('/') || 
                           player.avatarUrl.startsWith('data:');
        if (isImageUrl) {
          avatarHtml = `<img src="${player.avatarUrl}" style="width:70px; height:70px; border-radius:50%; object-fit:cover; border:3px solid #ff0055; box-shadow: 0 0 20px rgba(255, 0, 85, 0.8);">`;
        } else {
          avatarHtml = `<div style="font-size: 3rem;">${player.avatarUrl}</div>`;
        }
      } else if (player?.avatarEmoji) {
        avatarHtml = `<div style="font-size: 3rem;">${player.avatarEmoji}</div>`;
      } else {
        avatarHtml = `<div style="font-size: 3rem;">👤</div>`;
      }
      
      return `
        <div style="display:flex; flex-direction:column; align-items:center; margin: 0 15px;">
          ${avatarHtml}
          <div style="font-size: 1rem; color: #ff0055; margin-top: 8px; font-weight: bold;">${playerName}</div>
        </div>
      `;
    }).join('');
    
    // Texte selon le nombre de morts (traduit)
    const getSingleElimText = () => {
      if (window.i18n) {
        const t = window.i18n('game.ui.playerEliminated');
        if (t !== 'game.ui.playerEliminated') {
          return t.replace('{name}', players[0]?.name || 'Joueur');
        }
      }
      return `${players[0]?.name || 'Joueur'} a été éliminé !`;
    };
    const getMultiElimText = () => {
      if (window.i18n) {
        const t = window.i18n('game.ui.playersEliminated');
        if (t !== 'game.ui.playersEliminated') {
          return t.replace('{names}', players.map(p => p.name).join(' & '));
        }
      }
      return `${players.map(p => p.name).join(' et ')} ont été éliminés !`;
    };
    const eliminationText = players.length > 1 ? getMultiElimText() : getSingleElimText();
    
    const overlay = document.createElement('div');
    overlay.id = 'ejectionOverlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: rgba(0, 0, 0, 0.85);
      z-index: 9999;
      animation: fadeInEjection 0.3s ease-out;
      pointer-events: none;
    `;
    
    overlay.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: center; margin-bottom: 20px;">
        ${avatarsHtml}
      </div>
      <div style="
        font-size: 4rem;
        animation: ejectionBounce 0.8s ease-out;
        text-shadow: 0 0 30px rgba(255, 0, 85, 0.8), 0 0 60px rgba(255, 0, 85, 0.5);
      ">💀</div>
      <div style="
        font-size: 1.3rem;
        color: #ff0055;
        font-weight: bold;
        margin-top: 20px;
        text-shadow: 0 0 10px rgba(255, 0, 85, 0.5);
        animation: fadeInText 0.5s ease-out 0.3s both;
        text-align: center;
        padding: 0 20px;
      ">${eliminationText}</div>
    `;
    
    // Ajouter les styles d'animation si pas déjà présents
    if (!document.getElementById('ejectionAnimStyles')) {
      const style = document.createElement('style');
      style.id = 'ejectionAnimStyles';
      style.textContent = `
        @keyframes fadeInEjection {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fadeOutEjection {
          from { opacity: 1; }
          to { opacity: 0; }
        }
        @keyframes ejectionBounce {
          0% { transform: scale(0) rotate(-180deg); opacity: 0; }
          50% { transform: scale(1.3) rotate(10deg); }
          70% { transform: scale(0.9) rotate(-5deg); }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        @keyframes fadeInText {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `;
      document.head.appendChild(style);
    }
    
    document.body.appendChild(overlay);
    
    // Vibration mobile
    if (navigator.vibrate) {
      navigator.vibrate([100, 50, 100, 50, 200]);
    }
    
    // Supprimer après l'animation
    setTimeout(() => {
      overlay.style.animation = 'fadeOutEjection 0.5s ease-out forwards';
      setTimeout(() => overlay.remove(), 500);
      if (callback) callback();
    }, 2000);
    
    // Aussi appliquer l'animation aux éléments existants (si présents)
    const selectors = [
      `.choice-card[data-player-id="${playerId}"]`,
      `.player-card[data-player-id="${playerId}"]`,
      `.player-item[data-player-id="${playerId}"]`
    ];
    
    selectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(el => {
        el.classList.add('ejecting');
      });
    });
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
   * Anime l'élimination d'un joueur (moins dramatique que l'overlay)
   * @param {string} playerId - ID du joueur éliminé
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
    
    // Vibration
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
      // Élimination
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
  function animateCaptainElection(captainPlayerId) {
    log('Animating captain election for:', captainPlayerId);
    
    // V31: Trouver le joueur capitaine pour son avatar
    const captain = window.lastKnownState?.players?.find(p => p.playerId === captainPlayerId || p.isCaptain);
    const captainName = captain?.name || '';
    
    // V31: Générer l'avatar du capitaine
    let avatarHtml = '';
    if (captain?.avatarUrl) {
      avatarHtml = `<img src="${captain.avatarUrl}" style="width:100px; height:100px; border-radius:50%; object-fit:cover; border:4px solid gold; box-shadow: 0 0 30px gold; margin-bottom: 20px;">`;
    } else if (captain?.avatarEmoji) {
      avatarHtml = `<div style="font-size: 4rem; margin-bottom: 10px;">${captain.avatarEmoji}</div>`;
    }
    
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
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: rgba(0, 0, 0, 0.7);
      z-index: 9999;
      animation: fadeInCaptain 0.5s ease-out;
      pointer-events: none;
    `;
    
    // Emoji de capitaine selon le thème
    const captainEmoji = '⭐';
    
    // V33: Traduction du texte "est élu Capitaine"
    const electedText = window.i18n ? window.i18n('game.ui.isElectedCaptain') : 'est élu Capitaine !';
    
    overlay.innerHTML = `
      ${avatarHtml}
      <div style="
        font-size: 6rem;
        animation: captainBounce 1s ease-out;
        text-shadow: 0 0 30px gold, 0 0 60px gold;
      ">${captainEmoji}</div>
      ${captainName ? `<div style="font-size: 1.3rem; color: gold; font-weight: bold; margin-top: 15px; text-shadow: 0 0 10px gold;">${captainName} ${electedText}</div>` : ''}
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
