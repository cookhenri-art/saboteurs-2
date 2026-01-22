/**
 * Avatar Customizer - Système d'avatar personnalisé basé sur photo
 * Version 1.0
 * 
 * Utilise face-api.js pour la détection de visage
 * et Canvas API pour superposer les overlays thématiques
 */

const AvatarCustomizer = (function() {
  'use strict';

  // Configuration
  const CONFIG = {
    faceApiModelUrl: 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/',
    maxImageSize: 512,
    overlaySize: 256,
    jpegQuality: 0.85
  };

  // État
  let faceApiLoaded = false;
  let currentPhoto = null;
  let currentOverlay = null;

  // Overlays thématiques au choix (4 par thème, indépendants du rôle)
  const OVERLAYS = {
    // Thème Spatial (default)
    default: [
      { id: 'helmet', name: 'Casque Astronaute', type: 'helmet', color: '#00aaff', icon: '🚀' },
      { id: 'alien', name: 'Antennes Alien', type: 'alien', color: '#00ff88', icon: '👽' },
      { id: 'robot', name: 'Visière Robot', type: 'robot', color: '#ff6b35', icon: '🤖' },
      { id: 'ufo', name: 'Halo OVNI', type: 'ufo', color: '#aa00ff', icon: '🛸' }
    ],
    // Thème Loup-Garou
    werewolf: [
      { id: 'wolf', name: 'Oreilles de Loup', type: 'wolf', color: '#8B4513', icon: '🐺' },
      { id: 'villager', name: 'Chapeau Villageois', type: 'villager', color: '#228B22', icon: '🧑‍🌾' },
      { id: 'moon', name: 'Aura Lunaire', type: 'aura', color: '#c0c0ff', icon: '🌙' },
      { id: 'bat', name: 'Ailes Chauve-souris', type: 'bat', color: '#4a0080', icon: '🦇' }
    ],
    // Thème Wizard Academy
    'wizard-academy': [
      { id: 'wizard', name: 'Chapeau Pointu', type: 'witch', color: '#4a00aa', icon: '🧙' },
      { id: 'magic', name: 'Aura Magique', type: 'aura', color: '#ff69b4', icon: '✨' },
      { id: 'crystal', name: 'Cristal Flottant', type: 'crystal', color: '#9b59b6', icon: '🔮' },
      { id: 'scroll', name: 'Parchemins', type: 'scroll', color: '#d4a574', icon: '📜' }
    ],
    // Thème Mythic Realms
    'mythic-realms': [
      { id: 'knight', name: 'Casque Chevalier', type: 'warrior', color: '#708090', icon: '⚔️' },
      { id: 'dragon', name: 'Cornes Dragon', type: 'dragon', color: '#ff4500', icon: '🐉' },
      { id: 'crown', name: 'Couronne Royale', type: 'crown', color: '#ffd700', icon: '👑' },
      { id: 'shield', name: 'Aura Bouclier', type: 'aura', color: '#4169e1', icon: '🛡️' }
    ]
  };
  
  // Overlay sélectionné par l'utilisateur (stocké dans localStorage)
  let selectedOverlayId = localStorage.getItem('saboteur_avatar_overlay') || null;

  /**
   * Charger face-api.js dynamiquement
   */
  async function loadFaceApi() {
    if (faceApiLoaded) return true;

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/dist/face-api.min.js';
      script.onload = async () => {
        try {
          // Charger le modèle de détection de visage (le plus léger)
          await faceapi.nets.tinyFaceDetector.loadFromUri(CONFIG.faceApiModelUrl);
          await faceapi.nets.faceLandmark68TinyNet.loadFromUri(CONFIG.faceApiModelUrl);
          faceApiLoaded = true;
          console.log('[AvatarCustomizer] Face-API chargé avec succès');
          resolve(true);
        } catch (err) {
          console.error('[AvatarCustomizer] Erreur chargement modèles:', err);
          reject(err);
        }
      };
      script.onerror = () => reject(new Error('Impossible de charger face-api.js'));
      document.head.appendChild(script);
    });
  }

  /**
   * Afficher le popup de consentement RGPD
   */
  function showConsentPopup() {
    return new Promise((resolve) => {
      const overlay = document.createElement('div');
      overlay.id = 'avatar-consent-overlay';
      overlay.style.cssText = `
        position: fixed; top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0,0,0,0.85); z-index: 10000;
        display: flex; align-items: center; justify-content: center;
        padding: 20px;
      `;

      overlay.innerHTML = `
        <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                    border-radius: 16px; padding: 24px; max-width: 450px;
                    border: 1px solid rgba(255,255,255,0.1); color: white;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.5);">
          <div style="text-align: center; margin-bottom: 20px;">
            <span style="font-size: 3rem;">📸</span>
            <h2 style="margin: 10px 0; font-size: 1.4rem;">Avatar Personnalisé</h2>
          </div>
          
          <div style="font-size: 0.9rem; opacity: 0.9; line-height: 1.6; margin-bottom: 20px;">
            <p style="margin-bottom: 12px;">
              <b>🔒 Confidentialité de votre photo :</b>
            </p>
            <ul style="padding-left: 20px; margin: 0;">
              <li>Votre photo est traitée <b>uniquement sur votre appareil</b></li>
              <li>Elle n'est <b>jamais envoyée</b> à nos serveurs</li>
              <li>Elle n'est <b>pas stockée</b> après la session</li>
              <li>Elle n'est <b>pas utilisée</b> à des fins commerciales</li>
            </ul>
            <p style="margin-top: 12px; opacity: 0.8;">
              Seul l'avatar transformé (avec overlay) sera visible par les autres joueurs.
            </p>
          </div>
          
          <div style="display: flex; gap: 12px;">
            <button id="avatar-consent-refuse" style="
              flex: 1; padding: 12px; border: 1px solid rgba(255,255,255,0.3);
              background: transparent; color: white; border-radius: 8px;
              cursor: pointer; font-size: 1rem; transition: all 0.2s;">
              Refuser
            </button>
            <button id="avatar-consent-accept" style="
              flex: 1; padding: 12px; border: none;
              background: linear-gradient(135deg, #00d4ff 0%, #00ff88 100%);
              color: #000; border-radius: 8px; cursor: pointer;
              font-size: 1rem; font-weight: 700; transition: all 0.2s;">
              ✓ Accepter
            </button>
          </div>
        </div>
      `;

      document.body.appendChild(overlay);

      document.getElementById('avatar-consent-accept').onclick = () => {
        overlay.remove();
        resolve(true);
      };
      document.getElementById('avatar-consent-refuse').onclick = () => {
        overlay.remove();
        resolve(false);
      };
    });
  }

  /**
   * Obtenir l'overlay sélectionné pour un thème
   */
  function getSelectedOverlay(theme = 'default') {
    const themeOverlays = OVERLAYS[theme] || OVERLAYS.default;
    if (selectedOverlayId) {
      const found = themeOverlays.find(o => o.id === selectedOverlayId);
      if (found) return found;
    }
    return themeOverlays[0]; // Premier par défaut
  }
  
  /**
   * Sauvegarder le choix d'overlay
   */
  function setSelectedOverlay(overlayId) {
    selectedOverlayId = overlayId;
    localStorage.setItem('saboteur_avatar_overlay', overlayId);
  }

  /**
   * Afficher le popup de capture photo
   */
  function showCapturePopup(theme = 'default') {
    const themeOverlays = OVERLAYS[theme] || OVERLAYS.default;
    const currentOverlay = getSelectedOverlay(theme);
    
    return new Promise((resolve) => {
      const overlay = document.createElement('div');
      overlay.id = 'avatar-capture-overlay';
      overlay.style.cssText = `
        position: fixed; top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0,0,0,0.9); z-index: 10000;
        display: flex; align-items: center; justify-content: center;
        padding: 20px;
      `;
      
      // Générer les options d'overlay
      const overlayOptionsHtml = themeOverlays.map(o => `
        <div class="overlay-option ${o.id === currentOverlay.id ? 'selected' : ''}" 
             data-overlay-id="${o.id}" 
             title="${o.name}"
             style="
               width: 50px; height: 50px;
               display: flex; align-items: center; justify-content: center;
               font-size: 1.8rem;
               background: ${o.id === currentOverlay.id ? 'rgba(0,212,255,0.3)' : 'rgba(255,255,255,0.1)'};
               border: 2px solid ${o.id === currentOverlay.id ? '#00d4ff' : 'rgba(255,255,255,0.2)'};
               border-radius: 10px;
               cursor: pointer;
               transition: all 0.2s;
             ">${o.icon}</div>
      `).join('');

      overlay.innerHTML = `
        <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                    border-radius: 16px; padding: 24px; max-width: 500px; width: 100%;
                    border: 1px solid rgba(255,255,255,0.1); color: white;
                    max-height: 90vh; overflow-y: auto;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h2 style="margin: 0; font-size: 1.3rem;">📷 Avatar Personnalisé</h2>
          </div>
          
          <!-- Sélecteur d'overlay -->
          <div style="margin-bottom: 16px;">
            <p style="font-size: 0.9rem; opacity: 0.8; margin-bottom: 8px; text-align: center;">Choisis ton style :</p>
            <div id="overlay-selector" style="display: flex; justify-content: center; gap: 10px; flex-wrap: wrap;">
              ${overlayOptionsHtml}
            </div>
          </div>
          
          <div id="avatar-video-container" style="
            width: 100%; aspect-ratio: 1; background: #000;
            border-radius: 12px; overflow: hidden; margin-bottom: 16px;
            display: flex; align-items: center; justify-content: center;">
            <video id="avatar-video" autoplay playsinline style="
              width: 100%; height: 100%; object-fit: cover;"></video>
          </div>
          
          <canvas id="avatar-canvas" style="display: none;"></canvas>
          
          <div id="avatar-preview-container" style="display: none; text-align: center; margin-bottom: 16px;">
            <img id="avatar-preview" style="max-width: 200px; border-radius: 12px; border: 2px solid #00d4ff;">
          </div>
          
          <div id="avatar-capture-buttons" style="display: flex; gap: 12px; flex-wrap: wrap;">
            <button id="avatar-capture-btn" style="
              flex: 1; min-width: 120px; padding: 12px; border: none;
              background: linear-gradient(135deg, #00d4ff 0%, #00ff88 100%);
              color: #000; border-radius: 8px; cursor: pointer;
              font-size: 1rem; font-weight: 700;">
              📸 Capturer
            </button>
            <button id="avatar-upload-btn" style="
              flex: 1; min-width: 120px; padding: 12px;
              border: 1px solid rgba(255,255,255,0.3);
              background: transparent; color: white; border-radius: 8px;
              cursor: pointer; font-size: 1rem;">
              📁 Importer
            </button>
            <input type="file" id="avatar-file-input" accept="image/*" style="display: none;">
          </div>
          
          <div id="avatar-confirm-buttons" style="display: none; gap: 12px;">
            <button id="avatar-retake-btn" style="
              flex: 1; padding: 12px; border: 1px solid rgba(255,255,255,0.3);
              background: transparent; color: white; border-radius: 8px;
              cursor: pointer; font-size: 1rem;">
              ↺ Reprendre
            </button>
            <button id="avatar-confirm-btn" style="
              flex: 1; padding: 12px; border: none;
              background: linear-gradient(135deg, #00d4ff 0%, #00ff88 100%);
              color: #000; border-radius: 8px; cursor: pointer;
              font-size: 1rem; font-weight: 700;">
              ✓ Utiliser cette photo
            </button>
          </div>
          
          <button id="avatar-cancel-btn" style="
            width: 100%; margin-top: 12px; padding: 10px;
            border: none; background: rgba(255,255,255,0.1);
            color: white; border-radius: 8px; cursor: pointer;">
            Annuler
          </button>
          
          <div id="avatar-loading" style="display: none; text-align: center; padding: 20px;">
            <div style="font-size: 2rem; animation: spin 1s linear infinite;">⏳</div>
            <p>Chargement de la caméra...</p>
          </div>
        </div>
        
        <style>
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        </style>
      `;

      document.body.appendChild(overlay);

      let stream = null;
      const video = document.getElementById('avatar-video');
      const canvas = document.getElementById('avatar-canvas');
      const preview = document.getElementById('avatar-preview');
      const videoContainer = document.getElementById('avatar-video-container');
      const previewContainer = document.getElementById('avatar-preview-container');
      const captureButtons = document.getElementById('avatar-capture-buttons');
      const confirmButtons = document.getElementById('avatar-confirm-buttons');
      const loading = document.getElementById('avatar-loading');
      const fileInput = document.getElementById('avatar-file-input');

      // Démarrer la caméra
      async function startCamera() {
        loading.style.display = 'block';
        videoContainer.style.display = 'none';
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 640 } }
          });
          video.srcObject = stream;
          loading.style.display = 'none';
          videoContainer.style.display = 'flex';
        } catch (err) {
          console.error('[AvatarCustomizer] Erreur caméra:', err);
          loading.innerHTML = '<p style="color: #ff6b6b;">❌ Impossible d\'accéder à la caméra.<br>Vous pouvez importer une photo.</p>';
        }
      }

      // Arrêter la caméra
      function stopCamera() {
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
          stream = null;
        }
      }

      // Capturer la photo
      function capturePhoto() {
        canvas.width = CONFIG.maxImageSize;
        canvas.height = CONFIG.maxImageSize;
        const ctx = canvas.getContext('2d');
        
        // Calculer le crop carré centré
        const size = Math.min(video.videoWidth, video.videoHeight);
        const x = (video.videoWidth - size) / 2;
        const y = (video.videoHeight - size) / 2;
        
        ctx.drawImage(video, x, y, size, size, 0, 0, CONFIG.maxImageSize, CONFIG.maxImageSize);
        
        const dataUrl = canvas.toDataURL('image/jpeg', CONFIG.jpegQuality);
        showPreview(dataUrl);
      }

      // Afficher la prévisualisation
      function showPreview(dataUrl) {
        currentPhoto = dataUrl;
        preview.src = dataUrl;
        videoContainer.style.display = 'none';
        previewContainer.style.display = 'block';
        captureButtons.style.display = 'none';
        confirmButtons.style.display = 'flex';
        stopCamera();
      }

      // Revenir à la capture
      function retake() {
        currentPhoto = null;
        previewContainer.style.display = 'none';
        captureButtons.style.display = 'flex';
        confirmButtons.style.display = 'none';
        startCamera();
      }

      // Gérer l'import de fichier
      function handleFileUpload(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
          const img = new Image();
          img.onload = () => {
            canvas.width = CONFIG.maxImageSize;
            canvas.height = CONFIG.maxImageSize;
            const ctx = canvas.getContext('2d');
            
            // Crop carré centré
            const size = Math.min(img.width, img.height);
            const x = (img.width - size) / 2;
            const y = (img.height - size) / 2;
            
            ctx.drawImage(img, x, y, size, size, 0, 0, CONFIG.maxImageSize, CONFIG.maxImageSize);
            
            const dataUrl = canvas.toDataURL('image/jpeg', CONFIG.jpegQuality);
            showPreview(dataUrl);
          };
          img.src = event.target.result;
        };
        reader.readAsDataURL(file);
      }

      // Event listeners
      document.getElementById('avatar-capture-btn').onclick = capturePhoto;
      document.getElementById('avatar-upload-btn').onclick = () => fileInput.click();
      fileInput.onchange = handleFileUpload;
      document.getElementById('avatar-retake-btn').onclick = retake;
      document.getElementById('avatar-confirm-btn').onclick = () => {
        stopCamera();
        overlay.remove();
        resolve(currentPhoto);
      };
      document.getElementById('avatar-cancel-btn').onclick = () => {
        stopCamera();
        overlay.remove();
        resolve(null);
      };
      
      // Gestion du sélecteur d'overlay
      document.querySelectorAll('.overlay-option').forEach(option => {
        option.addEventListener('click', () => {
          // Retirer la sélection précédente
          document.querySelectorAll('.overlay-option').forEach(o => {
            o.classList.remove('selected');
            o.style.background = 'rgba(255,255,255,0.1)';
            o.style.borderColor = 'rgba(255,255,255,0.2)';
          });
          // Appliquer la nouvelle sélection
          option.classList.add('selected');
          option.style.background = 'rgba(0,212,255,0.3)';
          option.style.borderColor = '#00d4ff';
          // Sauvegarder
          setSelectedOverlay(option.dataset.overlayId);
        });
        
        // Hover effect
        option.addEventListener('mouseenter', () => {
          if (!option.classList.contains('selected')) {
            option.style.background = 'rgba(255,255,255,0.2)';
          }
        });
        option.addEventListener('mouseleave', () => {
          if (!option.classList.contains('selected')) {
            option.style.background = 'rgba(255,255,255,0.1)';
          }
        });
      });

      startCamera();
    });
  }

  /**
   * Dessiner un overlay sur le canvas
   */
  function drawOverlay(ctx, faceData, overlayConfig, canvasSize) {
    const { type, color, icon } = overlayConfig;
    
    if (!faceData) {
      // Pas de visage détecté, dessiner l'overlay au centre
      drawCenteredOverlay(ctx, overlayConfig, canvasSize);
      return;
    }

    const { x, y, width, height } = faceData.detection.box;
    const centerX = x + width / 2;
    const centerY = y + height / 2;

    ctx.save();

    switch (type) {
      case 'helmet':
        drawHelmet(ctx, centerX, centerY - height * 0.1, width * 1.4, color);
        break;
      case 'alien':
        drawAlienAntennae(ctx, centerX, y - height * 0.3, width, color);
        break;
      case 'robot':
        drawRobotVisor(ctx, centerX, centerY - height * 0.1, width * 1.3, color);
        break;
      case 'ufo':
        drawUfoHalo(ctx, centerX, y - height * 0.4, width * 1.5, color);
        break;
      case 'wolf':
        drawWolfEars(ctx, centerX, y - height * 0.2, width, color);
        break;
      case 'villager':
        drawVillagerHat(ctx, centerX, y - height * 0.35, width * 1.1, color);
        break;
      case 'bat':
        drawBatWings(ctx, centerX, y - height * 0.1, width * 1.8, color);
        break;
      case 'aura':
        drawMysticAura(ctx, centerX, centerY, width * 1.5, color);
        break;
      case 'crystal':
        drawFloatingCrystal(ctx, centerX, y - height * 0.5, width * 0.6, color);
        break;
      case 'scroll':
        drawFloatingScrolls(ctx, centerX, y - height * 0.3, width * 1.2, color);
        break;
      case 'crown':
      case 'mayor':
      case 'king':
      case 'headmaster':
        drawCrown(ctx, centerX, y - height * 0.3, width * 0.8, color);
        break;
      case 'witch':
      case 'alchemist':
        drawWitchHat(ctx, centerX, y - height * 0.4, width * 1.2, color);
        break;
      case 'warrior':
      case 'hunter':
      case 'guardian':
      case 'paladin':
        drawWarriorHelmet(ctx, centerX, y - height * 0.2, width * 1.3, color);
        break;
      case 'seer':
      case 'oracle':
      case 'mage':
        drawMysticAura(ctx, centerX, centerY, width * 1.5, color);
        break;
      case 'dragon':
        drawDragonHorns(ctx, centerX, y - height * 0.2, width, color);
        break;
      default:
        drawGenericOverlay(ctx, centerX, y - height * 0.3, width, color, icon);
    }

    ctx.restore();
  }

  // Fonctions de dessin des overlays
  function drawHelmet(ctx, x, y, size, color) {
    ctx.beginPath();
    ctx.ellipse(x, y, size / 2, size / 2.5, 0, 0, Math.PI * 2);
    ctx.strokeStyle = color;
    ctx.lineWidth = size / 15;
    ctx.stroke();
    
    // Visor
    ctx.beginPath();
    ctx.ellipse(x, y + size * 0.1, size / 3, size / 6, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 200, 255, 0.3)';
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = size / 30;
    ctx.stroke();
  }
  
  function drawAlienAntennae(ctx, x, y, size, color) {
    // Antenne gauche
    ctx.beginPath();
    ctx.moveTo(x - size * 0.3, y + size * 0.3);
    ctx.quadraticCurveTo(x - size * 0.4, y - size * 0.2, x - size * 0.25, y - size * 0.4);
    ctx.strokeStyle = color;
    ctx.lineWidth = size / 20;
    ctx.stroke();
    // Boule
    ctx.beginPath();
    ctx.arc(x - size * 0.25, y - size * 0.45, size * 0.08, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;
    ctx.fill();
    ctx.shadowBlur = 0;
    
    // Antenne droite
    ctx.beginPath();
    ctx.moveTo(x + size * 0.3, y + size * 0.3);
    ctx.quadraticCurveTo(x + size * 0.4, y - size * 0.2, x + size * 0.25, y - size * 0.4);
    ctx.stroke();
    // Boule
    ctx.beginPath();
    ctx.arc(x + size * 0.25, y - size * 0.45, size * 0.08, 0, Math.PI * 2);
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;
    ctx.fill();
    ctx.shadowBlur = 0;
  }
  
  function drawRobotVisor(ctx, x, y, size, color) {
    // Bandeau horizontal
    ctx.beginPath();
    ctx.roundRect(x - size * 0.45, y - size * 0.1, size * 0.9, size * 0.2, 5);
    ctx.fillStyle = '#333';
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.stroke();
    
    // LED lumineuse qui traverse
    const gradient = ctx.createLinearGradient(x - size * 0.4, 0, x + size * 0.4, 0);
    gradient.addColorStop(0, 'transparent');
    gradient.addColorStop(0.5, color);
    gradient.addColorStop(1, 'transparent');
    ctx.fillStyle = gradient;
    ctx.fillRect(x - size * 0.4, y - size * 0.05, size * 0.8, size * 0.1);
    
    // Glow effect
    ctx.shadowColor = color;
    ctx.shadowBlur = 15;
    ctx.fillRect(x - size * 0.3, y - size * 0.03, size * 0.6, size * 0.06);
    ctx.shadowBlur = 0;
  }
  
  function drawUfoHalo(ctx, x, y, size, color) {
    // Anneau principal
    ctx.beginPath();
    ctx.ellipse(x, y, size * 0.5, size * 0.15, 0, 0, Math.PI * 2);
    ctx.strokeStyle = color;
    ctx.lineWidth = size * 0.05;
    ctx.shadowColor = color;
    ctx.shadowBlur = 20;
    ctx.stroke();
    ctx.shadowBlur = 0;
    
    // Deuxième anneau plus petit
    ctx.beginPath();
    ctx.ellipse(x, y - size * 0.1, size * 0.35, size * 0.1, 0, 0, Math.PI * 2);
    ctx.strokeStyle = color + '80';
    ctx.lineWidth = size * 0.03;
    ctx.stroke();
    
    // Petites lumières
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const px = x + Math.cos(angle) * size * 0.45;
      const py = y + Math.sin(angle) * size * 0.12;
      ctx.beginPath();
      ctx.arc(px, py, size * 0.03, 0, Math.PI * 2);
      ctx.fillStyle = i % 2 === 0 ? color : '#fff';
      ctx.fill();
    }
  }
  
  function drawVillagerHat(ctx, x, y, size, color) {
    // Chapeau de paille
    ctx.beginPath();
    ctx.ellipse(x, y + size * 0.2, size * 0.6, size * 0.12, 0, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = '#5a4a32';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Dôme
    ctx.beginPath();
    ctx.ellipse(x, y, size * 0.35, size * 0.25, 0, Math.PI, 0);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.stroke();
    
    // Ruban
    ctx.beginPath();
    ctx.rect(x - size * 0.35, y - size * 0.05, size * 0.7, size * 0.1);
    ctx.fillStyle = '#8B0000';
    ctx.fill();
  }
  
  function drawBatWings(ctx, x, y, size, color) {
    // Aile gauche
    ctx.beginPath();
    ctx.moveTo(x - size * 0.1, y + size * 0.2);
    ctx.quadraticCurveTo(x - size * 0.5, y - size * 0.1, x - size * 0.45, y - size * 0.3);
    ctx.lineTo(x - size * 0.35, y - size * 0.15);
    ctx.lineTo(x - size * 0.3, y - size * 0.35);
    ctx.lineTo(x - size * 0.2, y - size * 0.1);
    ctx.lineTo(x - size * 0.15, y - size * 0.3);
    ctx.lineTo(x - size * 0.1, y + size * 0.1);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    
    // Aile droite (miroir)
    ctx.beginPath();
    ctx.moveTo(x + size * 0.1, y + size * 0.2);
    ctx.quadraticCurveTo(x + size * 0.5, y - size * 0.1, x + size * 0.45, y - size * 0.3);
    ctx.lineTo(x + size * 0.35, y - size * 0.15);
    ctx.lineTo(x + size * 0.3, y - size * 0.35);
    ctx.lineTo(x + size * 0.2, y - size * 0.1);
    ctx.lineTo(x + size * 0.15, y - size * 0.3);
    ctx.lineTo(x + size * 0.1, y + size * 0.1);
    ctx.closePath();
    ctx.fill();
  }
  
  function drawFloatingCrystal(ctx, x, y, size, color) {
    // Cristal principal
    ctx.beginPath();
    ctx.moveTo(x, y - size * 0.5);
    ctx.lineTo(x + size * 0.3, y);
    ctx.lineTo(x + size * 0.15, y + size * 0.4);
    ctx.lineTo(x - size * 0.15, y + size * 0.4);
    ctx.lineTo(x - size * 0.3, y);
    ctx.closePath();
    
    const gradient = ctx.createLinearGradient(x - size * 0.3, y - size * 0.5, x + size * 0.3, y + size * 0.4);
    gradient.addColorStop(0, color);
    gradient.addColorStop(0.5, '#fff');
    gradient.addColorStop(1, color);
    ctx.fillStyle = gradient;
    ctx.fill();
    
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Glow
    ctx.shadowColor = color;
    ctx.shadowBlur = 15;
    ctx.fill();
    ctx.shadowBlur = 0;
    
    // Petits cristaux satellites
    [-0.4, 0.4].forEach(offset => {
      ctx.beginPath();
      ctx.moveTo(x + size * offset, y);
      ctx.lineTo(x + size * (offset + 0.1), y + size * 0.15);
      ctx.lineTo(x + size * (offset - 0.05), y + size * 0.2);
      ctx.lineTo(x + size * (offset - 0.1), y + size * 0.1);
      ctx.closePath();
      ctx.fillStyle = color + '80';
      ctx.fill();
    });
  }
  
  function drawFloatingScrolls(ctx, x, y, size, color) {
    // Parchemin principal
    ctx.beginPath();
    ctx.roundRect(x - size * 0.25, y - size * 0.1, size * 0.5, size * 0.6, 5);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Rouleau haut
    ctx.beginPath();
    ctx.ellipse(x, y - size * 0.1, size * 0.28, size * 0.06, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#d4a574';
    ctx.fill();
    ctx.stroke();
    
    // Lignes de texte
    ctx.strokeStyle = '#5a4a32';
    ctx.lineWidth = 1;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(x - size * 0.15, y + size * 0.1 + i * size * 0.1);
      ctx.lineTo(x + size * 0.15, y + size * 0.1 + i * size * 0.1);
      ctx.stroke();
    }
    
    // Petit parchemin satellite
    ctx.save();
    ctx.translate(x + size * 0.35, y + size * 0.1);
    ctx.rotate(0.3);
    ctx.beginPath();
    ctx.roundRect(-size * 0.1, -size * 0.15, size * 0.2, size * 0.3, 3);
    ctx.fillStyle = color + 'cc';
    ctx.fill();
    ctx.restore();
  }

  function drawWolfEars(ctx, x, y, size, color) {
    // Oreille gauche
    ctx.beginPath();
    ctx.moveTo(x - size * 0.5, y + size * 0.3);
    ctx.lineTo(x - size * 0.3, y - size * 0.4);
    ctx.lineTo(x - size * 0.1, y + size * 0.1);
    ctx.fillStyle = color;
    ctx.fill();
    
    // Oreille droite
    ctx.beginPath();
    ctx.moveTo(x + size * 0.5, y + size * 0.3);
    ctx.lineTo(x + size * 0.3, y - size * 0.4);
    ctx.lineTo(x + size * 0.1, y + size * 0.1);
    ctx.fill();
  }

  function drawCrown(ctx, x, y, size, color) {
    ctx.beginPath();
    ctx.moveTo(x - size / 2, y + size * 0.3);
    ctx.lineTo(x - size / 2, y);
    ctx.lineTo(x - size / 4, y + size * 0.15);
    ctx.lineTo(x, y - size * 0.2);
    ctx.lineTo(x + size / 4, y + size * 0.15);
    ctx.lineTo(x + size / 2, y);
    ctx.lineTo(x + size / 2, y + size * 0.3);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  function drawWitchHat(ctx, x, y, size, color) {
    ctx.beginPath();
    ctx.moveTo(x, y - size * 0.5);
    ctx.lineTo(x - size / 2, y + size * 0.2);
    ctx.lineTo(x + size / 2, y + size * 0.2);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    
    // Bord du chapeau
    ctx.beginPath();
    ctx.ellipse(x, y + size * 0.2, size * 0.6, size * 0.15, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawWarriorHelmet(ctx, x, y, size, color) {
    // Casque
    ctx.beginPath();
    ctx.arc(x, y + size * 0.2, size / 2, Math.PI, 0);
    ctx.fillStyle = color;
    ctx.fill();
    
    // Crête
    ctx.beginPath();
    ctx.moveTo(x - size * 0.1, y - size * 0.1);
    ctx.lineTo(x, y - size * 0.4);
    ctx.lineTo(x + size * 0.1, y - size * 0.1);
    ctx.lineTo(x + size * 0.1, y + size * 0.3);
    ctx.lineTo(x - size * 0.1, y + size * 0.3);
    ctx.closePath();
    ctx.fillStyle = '#ff4444';
    ctx.fill();
  }

  function drawMysticAura(ctx, x, y, size, color) {
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, size / 2);
    gradient.addColorStop(0, 'rgba(255,255,255,0)');
    gradient.addColorStop(0.5, color + '40');
    gradient.addColorStop(1, color + '00');
    
    ctx.beginPath();
    ctx.arc(x, y, size / 2, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();
    
    // Particules
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const px = x + Math.cos(angle) * size * 0.4;
      const py = y + Math.sin(angle) * size * 0.4;
      ctx.beginPath();
      ctx.arc(px, py, 4, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    }
  }

  function drawDragonHorns(ctx, x, y, size, color) {
    // Corne gauche
    ctx.beginPath();
    ctx.moveTo(x - size * 0.4, y + size * 0.2);
    ctx.quadraticCurveTo(x - size * 0.6, y - size * 0.2, x - size * 0.3, y - size * 0.5);
    ctx.lineTo(x - size * 0.2, y + size * 0.1);
    ctx.fillStyle = color;
    ctx.fill();
    
    // Corne droite
    ctx.beginPath();
    ctx.moveTo(x + size * 0.4, y + size * 0.2);
    ctx.quadraticCurveTo(x + size * 0.6, y - size * 0.2, x + size * 0.3, y - size * 0.5);
    ctx.lineTo(x + size * 0.2, y + size * 0.1);
    ctx.fill();
  }

  function drawGenericOverlay(ctx, x, y, size, color, icon) {
    // Cercle de fond
    ctx.beginPath();
    ctx.arc(x, y, size / 3, 0, Math.PI * 2);
    ctx.fillStyle = color + '80';
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.stroke();
    
    // Emoji
    ctx.font = `${size / 2}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(icon, x, y);
  }

  function drawCenteredOverlay(ctx, overlayConfig, canvasSize) {
    const { color, icon } = overlayConfig;
    const x = canvasSize / 2;
    const y = canvasSize * 0.25;
    const size = canvasSize * 0.3;
    
    drawGenericOverlay(ctx, x, y, size, color, icon);
  }

  /**
   * Appliquer l'overlay sur la photo
   */
  async function applyOverlay(photoDataUrl, theme = 'default') {
    const overlayConfig = getSelectedOverlay(theme);
    
    return new Promise(async (resolve) => {
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement('canvas');
        canvas.width = CONFIG.overlaySize;
        canvas.height = CONFIG.overlaySize;
        const ctx = canvas.getContext('2d');
        
        // Dessiner la photo
        ctx.drawImage(img, 0, 0, CONFIG.overlaySize, CONFIG.overlaySize);
        
        // Détecter le visage si face-api est chargé
        let faceData = null;
        if (faceApiLoaded) {
          try {
            const detections = await faceapi.detectSingleFace(
              canvas,
              new faceapi.TinyFaceDetectorOptions()
            ).withFaceLandmarks(true);
            faceData = detections;
          } catch (err) {
            console.warn('[AvatarCustomizer] Détection visage échouée:', err);
          }
        }
        
        // Appliquer l'overlay
        drawOverlay(ctx, faceData, overlayConfig, CONFIG.overlaySize);
        
        resolve(canvas.toDataURL('image/png'));
      };
      img.src = photoDataUrl;
    });
  }

  /**
   * Point d'entrée principal
   */
  async function createCustomAvatar(theme = 'default') {
    // 1. Demander le consentement
    const consent = await showConsentPopup();
    if (!consent) {
      console.log('[AvatarCustomizer] Consentement refusé');
      return null;
    }

    // 2. Charger face-api en arrière-plan (non bloquant)
    loadFaceApi().catch(err => console.warn('[AvatarCustomizer] Face-API non disponible:', err));

    // 3. Capturer la photo (avec sélecteur d'overlay)
    const photo = await showCapturePopup(theme);
    if (!photo) {
      console.log('[AvatarCustomizer] Capture annulée');
      return null;
    }

    // 4. Appliquer l'overlay sélectionné
    const avatar = await applyOverlay(photo, theme);
    
    console.log('[AvatarCustomizer] Avatar créé avec succès');
    return { avatar, originalPhoto: photo };
  }

  /**
   * Mettre à jour l'overlay sur une photo existante (changement de thème ou d'overlay)
   */
  async function updateOverlay(existingPhoto, theme = 'default') {
    if (!existingPhoto) return null;
    return await applyOverlay(existingPhoto, theme);
  }
  
  /**
   * Obtenir la photo originale stockée
   */
  function getOriginalPhoto() {
    return localStorage.getItem('saboteur_avatar_original_photo');
  }
  
  /**
   * Sauvegarder la photo originale
   */
  function saveOriginalPhoto(photoDataUrl) {
    if (photoDataUrl) {
      localStorage.setItem('saboteur_avatar_original_photo', photoDataUrl);
    }
  }
  
  /**
   * Obtenir l'avatar finalisé stocké
   */
  function getSavedAvatar() {
    return localStorage.getItem('saboteur_avatar_final');
  }
  
  /**
   * Sauvegarder l'avatar finalisé
   */
  function saveAvatar(avatarDataUrl) {
    if (avatarDataUrl) {
      localStorage.setItem('saboteur_avatar_final', avatarDataUrl);
    }
  }
  
  /**
   * Supprimer l'avatar personnalisé
   */
  function clearAvatar() {
    localStorage.removeItem('saboteur_avatar_original_photo');
    localStorage.removeItem('saboteur_avatar_final');
    localStorage.removeItem('saboteur_avatar_overlay');
  }
  
  /**
   * Vérifier si un avatar personnalisé existe
   */
  function hasCustomAvatar() {
    return !!localStorage.getItem('saboteur_avatar_final');
  }

  // API publique
  return {
    create: createCustomAvatar,
    updateOverlay,
    loadFaceApi,
    OVERLAYS,
    // Gestion du stockage
    getOriginalPhoto,
    saveOriginalPhoto,
    getSavedAvatar,
    saveAvatar,
    clearAvatar,
    hasCustomAvatar,
    // Gestion de l'overlay sélectionné
    getSelectedOverlay,
    setSelectedOverlay
  };

})();

// Export pour utilisation dans le client
if (typeof window !== 'undefined') {
  window.AvatarCustomizer = AvatarCustomizer;
}
