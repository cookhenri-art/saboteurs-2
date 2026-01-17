/* =========================================================
   D8 - OPTIMISATIONS PERFORMANCE
   Module pour lazy loading, debounce, GPU acceleration
   Version: 1.0
========================================================= */
(function() {
  'use strict';

  const DEBUG = true;
  function log(...args) { if (DEBUG) console.log('[D8-Performance]', ...args); }

  // =========================================================
  // D8.1 - DEBOUNCE POUR RESIZE
  // =========================================================
  
  let resizeTimeout = null;
  let resizeCallbacks = [];

  /**
   * Ajoute un callback debounced au resize
   * @param {Function} callback - Fonction à appeler
   * @param {number} delay - Délai en ms (défaut: 150)
   */
  function onResizeDebounced(callback, delay = 150) {
    resizeCallbacks.push({ callback, delay });
    
    if (resizeCallbacks.length === 1) {
      window.addEventListener('resize', handleResize);
      log('Resize listener attached');
    }
  }

  function handleResize() {
    if (resizeTimeout) {
      clearTimeout(resizeTimeout);
    }
    
    resizeTimeout = setTimeout(() => {
      resizeCallbacks.forEach(({ callback }) => {
        try {
          callback();
        } catch (e) {
          console.error('[D8-Performance] Resize callback error:', e);
        }
      });
    }, 150);
  }

  /**
   * Retire un callback du resize
   * @param {Function} callback - Fonction à retirer
   */
  function offResizeDebounced(callback) {
    resizeCallbacks = resizeCallbacks.filter(item => item.callback !== callback);
    
    if (resizeCallbacks.length === 0) {
      window.removeEventListener('resize', handleResize);
      log('Resize listener removed');
    }
  }

  // =========================================================
  // D8.2 - LAZY LOADING DES BACKGROUNDS
  // =========================================================
  
  const loadedBackgrounds = new Set();
  const backgroundObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const element = entry.target;
          loadBackground(element);
          backgroundObserver.unobserve(element);
        }
      });
    },
    { rootMargin: '100px' }
  );

  /**
   * Marque un élément pour lazy loading de son background
   * @param {HTMLElement} element - Élément avec background à charger
   * @param {string} backgroundUrl - URL du background
   */
  function lazyLoadBackground(element, backgroundUrl) {
    if (!element || !backgroundUrl) return;
    
    // Stocker l'URL pour le chargement ultérieur
    element.dataset.lazyBg = backgroundUrl;
    element.classList.add('lazy-bg');
    element.style.setProperty('--lazy-bg-url', `url('${backgroundUrl}')`);
    
    // Observer pour le chargement
    backgroundObserver.observe(element);
    log('Background queued for lazy load:', backgroundUrl);
  }

  /**
   * Charge immédiatement le background d'un élément
   * @param {HTMLElement} element - Élément à charger
   */
  function loadBackground(element) {
    const url = element.dataset.lazyBg;
    if (!url || loadedBackgrounds.has(url)) {
      element.classList.add('loaded');
      return;
    }
    
    // Précharger l'image
    const img = new Image();
    img.onload = () => {
      loadedBackgrounds.add(url);
      element.classList.add('loaded');
      log('Background loaded:', url);
    };
    img.onerror = () => {
      log('Background failed to load:', url);
      element.classList.add('loaded'); // Montrer quand même le fallback
    };
    img.src = url;
  }

  /**
   * Charge tous les backgrounds du thème actuel
   * @param {string} theme - Nom du thème
   */
  function preloadThemeBackgrounds(theme) {
    const backgrounds = [
      `/images/${theme}/cockpit.webp`,
      `/images/${theme}/vote-jour.webp`,
      `/images/${theme}/vote-nuit.webp`,
      `/images/${theme}/out.webp`,
      `/images/${theme}/vengeance.webp`,
      `/images/${theme}/video-bg.webp`,
      `/images/${theme}/image-fin-stats-explosion2.webp`,
      `/images/${theme}/image-fin-stats-station2.webp`
    ];
    
    log('Preloading backgrounds for theme:', theme);
    
    backgrounds.forEach(url => {
      if (loadedBackgrounds.has(url)) return;
      
      const img = new Image();
      img.onload = () => {
        loadedBackgrounds.add(url);
        log('Preloaded:', url);
      };
      img.src = url;
    });
  }

  // =========================================================
  // D8.3 - THROTTLE UTILITY
  // =========================================================
  
  /**
   * Crée une fonction throttled
   * @param {Function} func - Fonction à throttler
   * @param {number} limit - Intervalle minimum en ms
   * @returns {Function}
   */
  function throttle(func, limit) {
    let inThrottle;
    let lastResult;
    
    return function(...args) {
      if (!inThrottle) {
        lastResult = func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
      return lastResult;
    };
  }

  /**
   * Crée une fonction debounced
   * @param {Function} func - Fonction à debouncer
   * @param {number} wait - Délai en ms
   * @param {boolean} immediate - Exécuter immédiatement
   * @returns {Function}
   */
  function debounce(func, wait, immediate = false) {
    let timeout;
    
    return function(...args) {
      const later = () => {
        timeout = null;
        if (!immediate) func.apply(this, args);
      };
      
      const callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      
      if (callNow) func.apply(this, args);
    };
  }

  // =========================================================
  // D8.4 - OPTIMISATION DES ANIMATIONS
  // =========================================================
  
  /**
   * Désactive temporairement les animations (pour les transitions lourdes)
   */
  function disableAnimations() {
    document.body.classList.add('no-animations');
    log('Animations disabled');
  }

  /**
   * Réactive les animations
   */
  function enableAnimations() {
    document.body.classList.remove('no-animations');
    log('Animations enabled');
  }

  /**
   * Exécute une action sans animations
   * @param {Function} action - Action à exécuter
   */
  function withoutAnimations(action) {
    disableAnimations();
    requestAnimationFrame(() => {
      action();
      requestAnimationFrame(() => {
        enableAnimations();
      });
    });
  }

  // Ajouter le style pour désactiver les animations
  const noAnimStyle = document.createElement('style');
  noAnimStyle.textContent = `
    .no-animations *,
    .no-animations *::before,
    .no-animations *::after {
      animation-duration: 0s !important;
      transition-duration: 0s !important;
    }
  `;
  document.head.appendChild(noAnimStyle);

  // =========================================================
  // D8.5 - MEMORY MANAGEMENT
  // =========================================================
  
  const managedElements = new WeakMap();

  /**
   * Enregistre un élément pour gestion mémoire
   * @param {HTMLElement} element - Élément à gérer
   * @param {Object} data - Données associées
   */
  function trackElement(element, data = {}) {
    managedElements.set(element, {
      created: Date.now(),
      ...data
    });
  }

  /**
   * Nettoie les éléments orphelins
   */
  function cleanupOrphanedElements() {
    // Nettoyer les toasts expirés
    document.querySelectorAll('.mute-toast, .notification-toast').forEach(el => {
      if (!document.body.contains(el)) {
        el.remove();
      }
    });
    
    // Nettoyer les overlays cachés
    document.querySelectorAll('.overlay.hidden, .modal.hidden').forEach(el => {
      if (el.childNodes.length === 0) {
        el.remove();
      }
    });
    
    log('Orphaned elements cleaned up');
  }

  // =========================================================
  // D8.6 - RAF BATCHING
  // =========================================================
  
  let rafQueue = [];
  let rafScheduled = false;

  /**
   * Ajoute une tâche à la queue RAF (batched)
   * @param {Function} task - Tâche à exécuter
   */
  function queueRAF(task) {
    rafQueue.push(task);
    
    if (!rafScheduled) {
      rafScheduled = true;
      requestAnimationFrame(processRAFQueue);
    }
  }

  function processRAFQueue() {
    const tasks = rafQueue;
    rafQueue = [];
    rafScheduled = false;
    
    tasks.forEach(task => {
      try {
        task();
      } catch (e) {
        console.error('[D8-Performance] RAF task error:', e);
      }
    });
  }

  // =========================================================
  // D8.7 - PERFORMANCE MONITORING
  // =========================================================
  
  const perfMetrics = {
    fps: [],
    lastFrameTime: performance.now(),
    frameCount: 0
  };

  let fpsMonitorActive = false;

  /**
   * Démarre le monitoring FPS
   */
  function startFPSMonitor() {
    if (fpsMonitorActive) return;
    fpsMonitorActive = true;
    
    function measureFPS() {
      if (!fpsMonitorActive) return;
      
      const now = performance.now();
      const delta = now - perfMetrics.lastFrameTime;
      perfMetrics.lastFrameTime = now;
      
      const fps = 1000 / delta;
      perfMetrics.fps.push(fps);
      
      // Garder seulement les 60 dernières mesures
      if (perfMetrics.fps.length > 60) {
        perfMetrics.fps.shift();
      }
      
      perfMetrics.frameCount++;
      requestAnimationFrame(measureFPS);
    }
    
    requestAnimationFrame(measureFPS);
    log('FPS monitor started');
  }

  /**
   * Arrête le monitoring FPS
   */
  function stopFPSMonitor() {
    fpsMonitorActive = false;
    log('FPS monitor stopped');
  }

  /**
   * Obtient les stats de performance
   * @returns {Object}
   */
  function getPerformanceStats() {
    const fps = perfMetrics.fps;
    const avgFPS = fps.length > 0 
      ? Math.round(fps.reduce((a, b) => a + b, 0) / fps.length)
      : 0;
    const minFPS = fps.length > 0 ? Math.round(Math.min(...fps)) : 0;
    const maxFPS = fps.length > 0 ? Math.round(Math.max(...fps)) : 0;
    
    return {
      avgFPS,
      minFPS,
      maxFPS,
      frameCount: perfMetrics.frameCount,
      loadedBackgrounds: loadedBackgrounds.size,
      rafQueueSize: rafQueue.length
    };
  }

  // =========================================================
  // D8.8 - IMAGE OPTIMIZATION HELPERS
  // =========================================================
  
  /**
   * Convertit une URL d'image en WebP si possible
   * @param {string} url - URL originale
   * @returns {string}
   */
  function toWebP(url) {
    if (!url) return url;
    
    // Déjà WebP
    if (url.endsWith('.webp')) return url;
    
    // Remplacer les extensions courantes
    return url.replace(/\.(png|jpg|jpeg|gif)$/i, '.webp');
  }

  /**
   * Vérifie si le navigateur supporte WebP
   * @returns {Promise<boolean>}
   */
  async function supportsWebP() {
    if ('createImageBitmap' in window) {
      const webpData = 'data:image/webp;base64,UklGRh4AAABXRUJQVlA4TBEAAAAvAAAAAAfQ//73v/+BiOh/AAA=';
      const blob = await fetch(webpData).then(r => r.blob());
      return createImageBitmap(blob).then(() => true, () => false);
    }
    return false;
  }

  // =========================================================
  // D8.9 - VIDEO LAYOUT OPTIMIZATION
  // =========================================================
  
  // Optimisation du recalcul des layouts vidéo
  const updateVideoLayoutDebounced = debounce(() => {
    if (typeof window.updateVideoLayout === 'function') {
      window.updateVideoLayout();
    }
  }, 150);

  // =========================================================
  // INITIALISATION
  // =========================================================
  
  function init() {
    // Ajouter le listener de resize debounced pour les layouts vidéo
    onResizeDebounced(updateVideoLayoutDebounced);
    
    // Précharger le thème par défaut
    const currentTheme = document.documentElement.dataset.theme || 'default';
    preloadThemeBackgrounds(currentTheme);
    
    // Nettoyer périodiquement les éléments orphelins
    setInterval(cleanupOrphanedElements, 60000); // Toutes les minutes
    
    log('D8 Performance module initialized');
  }

  // =========================================================
  // EXPOSITION GLOBALE
  // =========================================================
  
  window.D8Performance = {
    // Resize
    onResizeDebounced,
    offResizeDebounced,
    
    // Lazy loading
    lazyLoadBackground,
    loadBackground,
    preloadThemeBackgrounds,
    
    // Utilities
    throttle,
    debounce,
    
    // Animations
    disableAnimations,
    enableAnimations,
    withoutAnimations,
    
    // Memory
    trackElement,
    cleanupOrphanedElements,
    
    // RAF
    queueRAF,
    
    // Performance
    startFPSMonitor,
    stopFPSMonitor,
    getPerformanceStats,
    
    // Images
    toWebP,
    supportsWebP,
    
    // Video
    updateVideoLayoutDebounced
  };

  // Auto-init
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  log('D8 Performance module loaded');

})();
