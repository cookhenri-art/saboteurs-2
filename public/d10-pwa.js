/* =========================================================
   D10 - PWA MODULE
   Gestion de l'installation PWA et du Service Worker
   Version: 1.0
========================================================= */
(function() {
  'use strict';

  const DEBUG = true;
  function log(...args) { if (DEBUG) console.log('[D10-PWA]', ...args); }

  // =========================================================
  // STATE
  // =========================================================
  
  let deferredPrompt = null;
  let isInstalled = false;
  let isStandalone = false;
  let swRegistration = null;

  // =========================================================
  // DÉTECTION DU MODE
  // =========================================================
  
  /**
   * Vérifie si l'app est installée ou en mode standalone
   */
  function checkInstallState() {
    // Mode standalone (PWA installée)
    isStandalone = window.matchMedia('(display-mode: standalone)').matches 
                   || window.navigator.standalone 
                   || document.referrer.includes('android-app://');
    
    // Vérifier le localStorage
    isInstalled = localStorage.getItem('pwa_installed') === 'true';
    
    log('Install state:', { isStandalone, isInstalled });
    
    return { isStandalone, isInstalled };
  }

  // =========================================================
  // SERVICE WORKER
  // =========================================================
  
  /**
   * Enregistre le Service Worker
   */
  async function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) {
      log('Service Worker not supported');
      return null;
    }
    
    try {
      swRegistration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });
      
      log('Service Worker registered:', swRegistration.scope);
      
      // Écouter les mises à jour
      swRegistration.addEventListener('updatefound', () => {
        const newWorker = swRegistration.installing;
        log('New Service Worker installing...');
        
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // Nouvelle version disponible
            showUpdateAvailable();
          }
        });
      });
      
      // Vérifier les mises à jour toutes les heures
      setInterval(() => {
        swRegistration.update();
      }, 60 * 60 * 1000);
      
      return swRegistration;
      
    } catch (error) {
      console.error('[D10-PWA] Service Worker registration failed:', error);
      return null;
    }
  }

  /**
   * Affiche une notification de mise à jour disponible
   */
  function showUpdateAvailable() {
    const banner = document.createElement('div');
    banner.id = 'updateBanner';
    banner.style.cssText = `
      position: fixed;
      bottom: 80px;
      left: 50%;
      transform: translateX(-50%);
      background: var(--secondary-bg, #1a1f35);
      border: 1px solid var(--neon-cyan, #00ffff);
      border-radius: 12px;
      padding: 12px 20px;
      display: flex;
      align-items: center;
      gap: 12px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
      z-index: 10000;
      animation: slideUp 0.5s ease;
      font-family: var(--font-body, 'Rajdhani');
    `;
    
    banner.innerHTML = `
      <span style="color: var(--text-primary, #e0f4ff);">🔄 Mise à jour disponible !</span>
      <button id="updateNowBtn" style="
        background: var(--neon-cyan, #00ffff);
        color: var(--primary-bg, #0a0e1a);
        border: none;
        padding: 8px 16px;
        border-radius: 6px;
        font-weight: bold;
        cursor: pointer;
      ">Mettre à jour</button>
      <button id="updateLaterBtn" style="
        background: transparent;
        color: var(--text-secondary, #8ab4d5);
        border: none;
        padding: 8px;
        cursor: pointer;
      ">✕</button>
    `;
    
    document.body.appendChild(banner);
    
    document.getElementById('updateNowBtn').addEventListener('click', () => {
      // Forcer le nouveau SW à prendre le contrôle
      if (swRegistration && swRegistration.waiting) {
        swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
      }
      window.location.reload();
    });
    
    document.getElementById('updateLaterBtn').addEventListener('click', () => {
      banner.remove();
    });
    
    log('Update banner shown');
  }

  // =========================================================
  // INSTALLATION
  // =========================================================
  
  /**
   * Configure l'écoute de l'événement d'installation
   */
  function setupInstallPrompt() {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      log('Install prompt captured');
      
      // Afficher le prompt personnalisé si pas déjà installé
      if (!isInstalled && !isStandalone) {
        setTimeout(() => {
          showInstallPrompt();
        }, 30000); // Attendre 30 secondes avant de proposer
      }
    });
    
    // Écouter l'installation réussie
    window.addEventListener('appinstalled', () => {
      log('App installed successfully');
      isInstalled = true;
      localStorage.setItem('pwa_installed', 'true');
      hideInstallPrompt();
      
      // Notification de succès
      showInstallSuccess();
    });
  }

  /**
   * Affiche le prompt d'installation personnalisé
   */
  function showInstallPrompt() {
    // Ne pas afficher si déjà affiché ou installé
    if (document.getElementById('pwaInstallPrompt') || isInstalled || isStandalone) {
      return;
    }
    
    // Ne pas afficher si l'utilisateur a refusé récemment
    const lastDismissed = localStorage.getItem('pwa_prompt_dismissed');
    if (lastDismissed) {
      const daysSinceDismissed = (Date.now() - parseInt(lastDismissed)) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissed < 7) {
        log('Install prompt dismissed recently, waiting...');
        return;
      }
    }
    
    const prompt = document.createElement('div');
    prompt.id = 'pwaInstallPrompt';
    prompt.className = 'pwa-install-prompt';
    
    prompt.innerHTML = `
      <div class="pwa-icon">🚀</div>
      <div class="pwa-text">
        <div class="pwa-title">Installer Saboteur</div>
        <div class="pwa-desc">Jouez même hors ligne !</div>
      </div>
      <div class="pwa-buttons">
        <button class="btn-install" id="pwaInstallBtn">Installer</button>
        <button class="btn-dismiss" id="pwaDismissBtn">Plus tard</button>
      </div>
    `;
    
    document.body.appendChild(prompt);
    
    document.getElementById('pwaInstallBtn').addEventListener('click', () => {
      triggerInstall();
    });
    
    document.getElementById('pwaDismissBtn').addEventListener('click', () => {
      hideInstallPrompt();
      localStorage.setItem('pwa_prompt_dismissed', Date.now().toString());
    });
    
    log('Install prompt shown');
  }

  /**
   * Cache le prompt d'installation
   */
  function hideInstallPrompt() {
    const prompt = document.getElementById('pwaInstallPrompt');
    if (prompt) {
      prompt.style.animation = 'slideDown 0.3s ease forwards';
      setTimeout(() => prompt.remove(), 300);
    }
  }

  /**
   * Déclenche l'installation
   */
  async function triggerInstall() {
    if (!deferredPrompt) {
      log('No deferred prompt available');
      return false;
    }
    
    hideInstallPrompt();
    deferredPrompt.prompt();
    
    const { outcome } = await deferredPrompt.userChoice;
    log('User choice:', outcome);
    
    deferredPrompt = null;
    
    if (outcome === 'accepted') {
      return true;
    }
    
    localStorage.setItem('pwa_prompt_dismissed', Date.now().toString());
    return false;
  }

  /**
   * Affiche une notification de succès d'installation
   */
  function showInstallSuccess() {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: linear-gradient(135deg, #00cc88, #00ff88);
      color: #000;
      padding: 15px 25px;
      border-radius: 30px;
      font-weight: bold;
      z-index: 10001;
      animation: slideDown 0.5s ease, fadeOut 0.5s ease 2.5s forwards;
      box-shadow: 0 5px 20px rgba(0, 255, 136, 0.4);
    `;
    notification.textContent = '✅ Saboteur installé avec succès !';
    
    document.body.appendChild(notification);
    
    setTimeout(() => notification.remove(), 3000);
  }

  // =========================================================
  // INDICATEUR OFFLINE
  // =========================================================
  
  /**
   * Configure les indicateurs online/offline
   */
  function setupOfflineIndicator() {
    const showOffline = () => {
      if (document.getElementById('offlineIndicator')) return;
      
      const indicator = document.createElement('div');
      indicator.id = 'offlineIndicator';
      indicator.className = 'offline-indicator';
      indicator.textContent = '📡 Hors ligne - Fonctionnalités limitées';
      document.body.appendChild(indicator);
      
      log('Offline indicator shown');
    };
    
    const hideOffline = () => {
      const indicator = document.getElementById('offlineIndicator');
      if (indicator) {
        indicator.remove();
        log('Offline indicator hidden');
      }
    };
    
    window.addEventListener('online', hideOffline);
    window.addEventListener('offline', showOffline);
    
    // État initial
    if (!navigator.onLine) {
      showOffline();
    }
  }

  // =========================================================
  // COMMUNICATION AVEC LE SERVICE WORKER
  // =========================================================
  
  /**
   * Envoie un message au Service Worker
   */
  function sendToSW(message) {
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage(message);
    }
  }

  /**
   * Vide le cache du Service Worker
   */
  function clearCache() {
    sendToSW({ type: 'CLEAR_CACHE' });
    log('Cache clear requested');
  }

  /**
   * Obtient la version du Service Worker
   */
  async function getVersion() {
    return new Promise((resolve) => {
      const messageChannel = new MessageChannel();
      messageChannel.port1.onmessage = (event) => {
        resolve(event.data.version);
      };
      
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage(
          { type: 'GET_VERSION' },
          [messageChannel.port2]
        );
      } else {
        resolve(null);
      }
    });
  }

  // =========================================================
  // SHARE API
  // =========================================================
  
  /**
   * Partage le jeu via l'API Web Share
   */
  async function shareGame(roomCode = null) {
    const shareData = {
      title: 'Saboteur',
      text: roomCode 
        ? `Rejoins ma partie de Saboteur avec le code: ${roomCode}` 
        : 'Viens jouer à Saboteur, un jeu de déduction sociale !',
      url: roomCode 
        ? `${window.location.origin}?join=${roomCode}` 
        : window.location.origin
    };
    
    if (navigator.share && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        log('Game shared successfully');
        return true;
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('[D10-PWA] Share failed:', error);
        }
        return false;
      }
    } else {
      // Fallback: copier le lien
      try {
        await navigator.clipboard.writeText(shareData.url);
        log('Link copied to clipboard');
        return 'copied';
      } catch (error) {
        console.error('[D10-PWA] Clipboard failed:', error);
        return false;
      }
    }
  }

  // =========================================================
  // BADGES API (si supporté)
  // =========================================================
  
  /**
   * Met à jour le badge de l'app (nombre de notifications)
   */
  async function setAppBadge(count) {
    if ('setAppBadge' in navigator) {
      try {
        if (count > 0) {
          await navigator.setAppBadge(count);
        } else {
          await navigator.clearAppBadge();
        }
        log('App badge set to:', count);
      } catch (error) {
        console.error('[D10-PWA] Badge API error:', error);
      }
    }
  }

  // =========================================================
  // INITIALISATION
  // =========================================================
  
  async function init() {
    // Vérifier l'état d'installation
    checkInstallState();
    
    // Enregistrer le Service Worker
    await registerServiceWorker();
    
    // Setup des événements
    setupInstallPrompt();
    setupOfflineIndicator();
    
    // Ajouter les styles d'animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideDown {
        from { transform: translateX(-50%) translateY(-100px); opacity: 0; }
        to { transform: translateX(-50%) translateY(0); opacity: 1; }
      }
      @keyframes fadeOut {
        to { opacity: 0; }
      }
    `;
    document.head.appendChild(style);
    
    log('D10 PWA module initialized');
  }

  // =========================================================
  // EXPOSITION GLOBALE
  // =========================================================
  
  window.D10PWA = {
    // State
    checkInstallState,
    get isInstalled() { return isInstalled; },
    get isStandalone() { return isStandalone; },
    get canInstall() { return !!deferredPrompt; },
    
    // Service Worker
    registerServiceWorker,
    clearCache,
    getVersion,
    
    // Installation
    showInstallPrompt,
    hideInstallPrompt,
    triggerInstall,
    
    // Share
    shareGame,
    
    // Badge
    setAppBadge
  };

  // Auto-init
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  log('D10 PWA module loaded');

})();
