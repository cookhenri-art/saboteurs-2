/* =========================================================
   D9 - SYSTÈME DE CUSTOMISATION AVATARS
   Module pour sélection avatar, couleur, badges
   Version: 1.0
========================================================= */
(function() {
  'use strict';

  const DEBUG = true;
  function log(...args) { if (DEBUG) console.log('[D9-Avatars]', ...args); }

  // =========================================================
  // CONFIGURATION
  // =========================================================
  
  const STORAGE_KEY = 'saboteur_player_customization';
  
  // Avatars disponibles par thème
  const AVATARS = {
    default: [
      { id: 'astronaut_1', name: 'Astronaute 1', emoji: '👨‍🚀' },
      { id: 'astronaut_2', name: 'Astronaute 2', emoji: '👩‍🚀' },
      { id: 'robot_1', name: 'Robot', emoji: '🤖' },
      { id: 'alien_1', name: 'Alien', emoji: '👽' },
      { id: 'rocket', name: 'Fusée', emoji: '🚀' },
      { id: 'satellite', name: 'Satellite', emoji: '🛰️' },
      { id: 'ufo', name: 'OVNI', emoji: '🛸' },
      { id: 'star', name: 'Étoile', emoji: '⭐' },
      { id: 'moon', name: 'Lune', emoji: '🌙' },
      { id: 'planet', name: 'Planète', emoji: '🪐' }
    ],
    werewolf: [
      { id: 'wolf', name: 'Loup', emoji: '🐺' },
      { id: 'villager', name: 'Villageois', emoji: '👨‍🌾' },
      { id: 'witch', name: 'Sorcière', emoji: '🧙‍♀️' },
      { id: 'hunter', name: 'Chasseur', emoji: '🏹' },
      { id: 'seer', name: 'Voyante', emoji: '🔮' },
      { id: 'moon_full', name: 'Pleine Lune', emoji: '🌕' },
      { id: 'forest', name: 'Forêt', emoji: '🌲' },
      { id: 'owl', name: 'Hibou', emoji: '🦉' },
      { id: 'bat', name: 'Chauve-souris', emoji: '🦇' },
      { id: 'skull', name: 'Crâne', emoji: '💀' }
    ],
    'wizard-academy': [
      { id: 'wizard', name: 'Sorcier', emoji: '🧙‍♂️' },
      { id: 'witch', name: 'Sorcière', emoji: '🧙‍♀️' },
      { id: 'wand', name: 'Baguette', emoji: '🪄' },
      { id: 'potion', name: 'Potion', emoji: '🧪' },
      { id: 'crystal', name: 'Cristal', emoji: '🔮' },
      { id: 'book', name: 'Grimoire', emoji: '📖' },
      { id: 'cat', name: 'Chat Noir', emoji: '🐈‍⬛' },
      { id: 'cauldron', name: 'Chaudron', emoji: '⚗️' },
      { id: 'star_magic', name: 'Étoile Magique', emoji: '✨' },
      { id: 'dragon', name: 'Dragon', emoji: '🐉' }
    ],
    'mythic-realms': [
      { id: 'knight', name: 'Chevalier', emoji: '⚔️' },
      { id: 'dragon', name: 'Dragon', emoji: '🐲' },
      { id: 'crown', name: 'Couronne', emoji: '👑' },
      { id: 'shield', name: 'Bouclier', emoji: '🛡️' },
      { id: 'castle', name: 'Château', emoji: '🏰' },
      { id: 'unicorn', name: 'Licorne', emoji: '🦄' },
      { id: 'phoenix', name: 'Phoenix', emoji: '🔥' },
      { id: 'gem', name: 'Gemme', emoji: '💎' },
      { id: 'scroll', name: 'Parchemin', emoji: '📜' },
      { id: 'throne', name: 'Trône', emoji: '🪑' }
    ]
  };

  // Couleurs disponibles
  const COLORS = [
    { id: 'cyan', hex: '#00ffff', name: 'Cyan' },
    { id: 'purple', hex: '#9d4edd', name: 'Violet' },
    { id: 'green', hex: '#00ff88', name: 'Vert' },
    { id: 'orange', hex: '#ff6b35', name: 'Orange' },
    { id: 'pink', hex: '#ff66cc', name: 'Rose' },
    { id: 'gold', hex: '#ffd700', name: 'Or' },
    { id: 'red', hex: '#ff0055', name: 'Rouge' },
    { id: 'blue', hex: '#4a90e2', name: 'Bleu' }
  ];

  // Seuils pour les badges
  const BADGE_THRESHOLDS = {
    newcomer: { min: 0, max: 4 },
    regular: { min: 5, max: 19 },
    veteran: { min: 20, max: 49 },
    legend: { min: 50, max: Infinity }
  };

  // =========================================================
  // STATE MANAGEMENT
  // =========================================================
  
  let currentCustomization = {
    avatarId: null,
    colorId: 'cyan',
    gamesPlayed: 0,
    wins: 0,
    lastUpdated: null
  };

  /**
   * Charge la customisation depuis le localStorage
   */
  function loadCustomization() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        currentCustomization = { ...currentCustomization, ...parsed };
        log('Customization loaded:', currentCustomization);
      }
    } catch (e) {
      console.error('[D9-Avatars] Failed to load customization:', e);
    }
    return currentCustomization;
  }

  /**
   * Sauvegarde la customisation dans le localStorage
   */
  function saveCustomization() {
    try {
      currentCustomization.lastUpdated = Date.now();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(currentCustomization));
      log('Customization saved:', currentCustomization);
    } catch (e) {
      console.error('[D9-Avatars] Failed to save customization:', e);
    }
  }

  /**
   * Obtient la customisation actuelle
   * @returns {Object}
   */
  function getCustomization() {
    return { ...currentCustomization };
  }

  // =========================================================
  // AVATAR SELECTION
  // =========================================================
  
  /**
   * Définit l'avatar du joueur
   * @param {string} avatarId - ID de l'avatar
   */
  function setAvatar(avatarId) {
    currentCustomization.avatarId = avatarId;
    saveCustomization();
    applyCustomization();
    log('Avatar set to:', avatarId);
  }

  /**
   * Obtient l'avatar actuel ou par défaut
   * @param {string} theme - Thème actuel
   * @returns {Object}
   */
  function getAvatar(theme = 'default') {
    const avatars = AVATARS[theme] || AVATARS.default;
    const avatar = avatars.find(a => a.id === currentCustomization.avatarId);
    return avatar || avatars[0];
  }

  /**
   * Crée le sélecteur d'avatars
   * @param {string} theme - Thème actuel
   * @returns {HTMLElement}
   */
  function createAvatarSelector(theme = 'default') {
    const avatars = AVATARS[theme] || AVATARS.default;
    
    const container = document.createElement('div');
    container.className = 'avatar-selector';
    
    avatars.forEach(avatar => {
      const option = document.createElement('div');
      option.className = 'avatar-option';
      if (avatar.id === currentCustomization.avatarId) {
        option.classList.add('selected');
      }
      option.dataset.avatarId = avatar.id;
      option.title = avatar.name;
      option.textContent = avatar.emoji;
      option.style.cssText = `
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 2rem;
        background: rgba(0, 0, 0, 0.3);
      `;
      
      option.addEventListener('click', () => {
        container.querySelectorAll('.avatar-option').forEach(o => o.classList.remove('selected'));
        option.classList.add('selected');
        setAvatar(avatar.id);
      });
      
      container.appendChild(option);
    });
    
    return container;
  }

  // =========================================================
  // COLOR SELECTION
  // =========================================================
  
  /**
   * Définit la couleur du joueur
   * @param {string} colorId - ID de la couleur
   */
  function setColor(colorId) {
    currentCustomization.colorId = colorId;
    saveCustomization();
    applyCustomization();
    log('Color set to:', colorId);
  }

  /**
   * Obtient la couleur actuelle
   * @returns {Object}
   */
  function getColor() {
    const color = COLORS.find(c => c.id === currentCustomization.colorId);
    return color || COLORS[0];
  }

  /**
   * Crée le sélecteur de couleurs
   * @returns {HTMLElement}
   */
  function createColorSelector() {
    const container = document.createElement('div');
    container.className = 'color-selector';
    
    COLORS.forEach(color => {
      const option = document.createElement('div');
      option.className = 'color-option';
      if (color.id === currentCustomization.colorId) {
        option.classList.add('selected');
      }
      option.dataset.color = color.id;
      option.style.backgroundColor = color.hex;
      option.title = color.name;
      
      option.addEventListener('click', () => {
        container.querySelectorAll('.color-option').forEach(o => o.classList.remove('selected'));
        option.classList.add('selected');
        setColor(color.id);
      });
      
      container.appendChild(option);
    });
    
    return container;
  }

  // =========================================================
  // BADGES
  // =========================================================
  
  /**
   * Obtient le badge du joueur basé sur son expérience
   * @returns {Object}
   */
  function getBadge() {
    const games = currentCustomization.gamesPlayed;
    
    if (games >= BADGE_THRESHOLDS.legend.min) {
      return { id: 'legend', name: 'Légende', icon: '👑' };
    } else if (games >= BADGE_THRESHOLDS.veteran.min) {
      return { id: 'veteran', name: 'Vétéran', icon: '⭐' };
    } else if (games >= BADGE_THRESHOLDS.regular.min) {
      return { id: 'regular', name: 'Régulier', icon: '🎮' };
    } else {
      return { id: 'newcomer', name: 'Nouveau', icon: '🌱' };
    }
  }

  /**
   * Crée l'élément de badge
   * @returns {HTMLElement}
   */
  function createBadgeElement() {
    const badge = getBadge();
    const element = document.createElement('span');
    element.className = `player-badge ${badge.id}`;
    element.innerHTML = `${badge.icon} ${badge.name}`;
    return element;
  }

  /**
   * Incrémente le compteur de parties
   * @param {boolean} won - Si le joueur a gagné
   */
  function recordGamePlayed(won = false) {
    currentCustomization.gamesPlayed++;
    if (won) {
      currentCustomization.wins++;
    }
    saveCustomization();
    log('Game recorded. Total:', currentCustomization.gamesPlayed, 'Wins:', currentCustomization.wins);
  }

  // =========================================================
  // UI APPLICATION
  // =========================================================
  
  /**
   * Applique la customisation au DOM
   */
  function applyCustomization() {
    const color = getColor();
    const avatar = getAvatar();
    
    // Appliquer la couleur comme variable CSS
    document.documentElement.style.setProperty('--player-color', color.hex);
    
    // Mettre à jour les éléments du joueur local
    const playerId = sessionStorage.getItem('is_playerId');
    if (playerId) {
      document.querySelectorAll(`[data-player-id="${playerId}"]`).forEach(el => {
        el.style.setProperty('--player-color', color.hex);
        el.dataset.playerColor = color.id;
      });
      
      // Mettre à jour les avatars
      document.querySelectorAll(`.player-avatar[data-player-id="${playerId}"]`).forEach(el => {
        el.textContent = avatar.emoji;
      });
    }
    
    log('Customization applied:', { color: color.id, avatar: avatar?.id });
  }

  // =========================================================
  // MODAL DE CUSTOMISATION
  // =========================================================
  
  /**
   * Ouvre le modal de customisation
   */
  function openCustomizationModal() {
    const theme = document.documentElement.dataset.theme || 'default';
    
    // Créer le modal
    const overlay = document.createElement('div');
    overlay.id = 'customizationModal';
    overlay.style.cssText = `
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      animation: fadeIn 0.3s ease;
    `;
    
    const modal = document.createElement('div');
    modal.style.cssText = `
      background: var(--secondary-bg, #1a1f35);
      border: 1px solid var(--neon-cyan, #00ffff);
      border-radius: 16px;
      padding: 24px;
      max-width: 400px;
      width: 90%;
      max-height: 80vh;
      overflow-y: auto;
      box-shadow: 0 0 30px rgba(0, 255, 255, 0.3);
    `;
    
    // Titre
    const title = document.createElement('h2');
    title.textContent = '🎨 Personnalisation';
    title.style.cssText = `
      font-family: var(--font-title, 'Orbitron');
      color: var(--neon-cyan, #00ffff);
      text-align: center;
      margin-bottom: 20px;
    `;
    modal.appendChild(title);
    
    // Section Avatar
    const avatarSection = document.createElement('div');
    avatarSection.innerHTML = '<h3 style="margin-bottom: 10px; color: var(--text-primary);">Avatar</h3>';
    avatarSection.appendChild(createAvatarSelector(theme));
    modal.appendChild(avatarSection);
    
    // Section Couleur
    const colorSection = document.createElement('div');
    colorSection.style.marginTop = '20px';
    colorSection.innerHTML = '<h3 style="margin-bottom: 10px; color: var(--text-primary);">Couleur</h3>';
    colorSection.appendChild(createColorSelector());
    modal.appendChild(colorSection);
    
    // Stats
    const statsSection = document.createElement('div');
    statsSection.style.cssText = `
      margin-top: 20px;
      padding: 15px;
      background: rgba(0, 0, 0, 0.3);
      border-radius: 12px;
      text-align: center;
    `;
    const badge = getBadge();
    statsSection.innerHTML = `
      <h3 style="margin-bottom: 10px; color: var(--text-primary);">Statistiques</h3>
      <p style="color: var(--text-secondary);">
        Parties jouées: <strong>${currentCustomization.gamesPlayed}</strong><br>
        Victoires: <strong>${currentCustomization.wins}</strong><br>
        Rang: <span class="player-badge ${badge.id}">${badge.icon} ${badge.name}</span>
      </p>
    `;
    modal.appendChild(statsSection);
    
    // Bouton Valider et Fermer
    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'Valider';
    closeBtn.className = 'btn btn-primary';
    closeBtn.style.cssText = `
      margin-top: 20px;
      width: 100%;
      padding: 12px;
    `;
    closeBtn.addEventListener('click', () => {
      // D11: Envoyer les changements au serveur
      sendCustomizationToServer();
      overlay.remove();
    });
    modal.appendChild(closeBtn);
    
    overlay.appendChild(modal);
    
    // Fermer en cliquant à l'extérieur
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        // D11: Envoyer les changements au serveur
        sendCustomizationToServer();
        overlay.remove();
      }
    });
    
    document.body.appendChild(overlay);
    log('Customization modal opened');
  }
  
  // D11: Fonction pour envoyer la personnalisation au serveur
  function sendCustomizationToServer() {
    if (!window.socket) {
      log('No socket available, cannot send customization');
      return;
    }
    
    const data = getCustomizationForServer();
    log('Sending customization to server:', data);
    
    window.socket.emit('updateCustomization', data, (response) => {
      if (response?.ok) {
        log('Customization updated on server');
      } else {
        log('Failed to update customization:', response?.error);
      }
    });
  }

  // =========================================================
  // INTÉGRATION AVEC LE JEU
  // =========================================================
  
  /**
   * Injecte le bouton de customisation dans le lobby
   */
  function injectCustomizationButton() {
    const lobbyScreen = document.getElementById('lobbyScreen');
    if (!lobbyScreen) return;
    
    // Vérifier si le bouton existe déjà
    if (document.getElementById('customizationBtn')) return;
    
    const btn = document.createElement('button');
    btn.id = 'customizationBtn';
    btn.className = 'btn customization-btn';
    btn.innerHTML = '🎨';
    btn.title = 'Personnaliser mon avatar';
    btn.style.cssText = `
      position: fixed;
      bottom: 10px;
      right: 10px;
      z-index: 1000;
      width: 40px;
      height: 40px;
      padding: 0;
      font-size: 1.2rem;
      background: var(--secondary-bg, rgba(0,0,0,0.85));
      border: 2px solid var(--neon-cyan, #00ffff);
      border-radius: 50%;
      color: var(--neon-cyan, #00ffff);
      box-shadow: 0 0 10px var(--neon-cyan, rgba(0, 255, 255, 0.4));
      cursor: pointer;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
    `;
    btn.addEventListener('click', openCustomizationModal);
    btn.addEventListener('mouseenter', () => {
      btn.style.transform = 'scale(1.1)';
      btn.style.boxShadow = '0 0 15px var(--neon-cyan, rgba(0, 255, 255, 0.6))';
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.transform = 'scale(1)';
      btn.style.boxShadow = '0 0 10px var(--neon-cyan, rgba(0, 255, 255, 0.4))';
    });
    
    document.body.appendChild(btn);
    log('Customization button injected');
  }
  
  /**
   * Supprime le bouton de personnalisation (appelé quand on quitte le lobby)
   */
  function removeCustomizationButton() {
    const btn = document.getElementById('customizationBtn');
    if (btn) {
      btn.remove();
      log('Customization button removed');
    }
  }

  /**
   * Obtient les données de customisation pour l'envoi au serveur
   * @returns {Object}
   */
  function getCustomizationForServer() {
    const avatar = getAvatar();
    const color = getColor();
    const badge = getBadge();
    
    // D11 V4: Ajouter playerId et roomCode pour le serveur
    const playerId = sessionStorage.getItem('is_playerId');
    const roomCode = sessionStorage.getItem('is_roomCode');
    
    return {
      playerId,
      roomCode,
      avatarId: avatar?.id,
      avatarEmoji: avatar?.emoji,
      colorId: color.id,
      colorHex: color.hex,
      badgeId: badge.id,
      badgeEmoji: badge.icon, // D11 V4: Corrigé - c'est 'icon' pas 'emoji'
      badgeName: badge.name,
      gamesPlayed: currentCustomization.gamesPlayed,
      wins: currentCustomization.wins
    };
  }

  // =========================================================
  // INITIALISATION
  // =========================================================
  
  function init() {
    loadCustomization();
    applyCustomization();
    
    // Injecter le bouton quand le lobby est visible
    const lobbyScreen = document.getElementById('lobbyScreen');
    if (lobbyScreen) {
      const observer = new MutationObserver(() => {
        if (lobbyScreen.classList.contains('active')) {
          injectCustomizationButton();
        }
      });
      observer.observe(lobbyScreen, { attributes: true, attributeFilter: ['class'] });
    }
    
    log('D9 Avatars module initialized');
  }

  // =========================================================
  // EXPOSITION GLOBALE
  // =========================================================
  
  window.D9Avatars = {
    // State
    loadCustomization,
    saveCustomization,
    getCustomization,
    
    // Avatar
    setAvatar,
    getAvatar,
    createAvatarSelector,
    AVATARS,
    
    // Color
    setColor,
    getColor,
    createColorSelector,
    COLORS,
    
    // Badge
    getBadge,
    createBadgeElement,
    recordGamePlayed,
    BADGE_THRESHOLDS,
    
    // UI
    applyCustomization,
    openCustomizationModal,
    injectCustomizationButton,
    removeCustomizationButton,
    
    // Server
    getCustomizationForServer
  };

  // Auto-init
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  log('D9 Avatars module loaded');

})();
