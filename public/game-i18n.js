/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║            🌍 SABOTEUR - TRADUCTION DYNAMIQUE GAME.HTML                   ║
 * ║                                                                           ║
 * ║  Ce script traduit dynamiquement tous les textes de game.html             ║
 * ║  Il doit être chargé APRÈS translations.js et APRÈS le DOM ready          ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

(function() {
  'use strict';

  // Attendre que le DOM et translations.js soient chargés
  function waitForTranslations(callback) {
    if (typeof window.i18n === 'function' || typeof window.t === 'function') {
      callback();
    } else {
      setTimeout(() => waitForTranslations(callback), 100);
    }
  }

  // Fonction helper pour récupérer une traduction
  function tr(key) {
    if (typeof window.i18n === 'function') {
      return window.i18n(key);
    }
    if (typeof window.t === 'function') {
      return window.t(key);
    }
    return key;
  }

  // Applique les traductions à tous les éléments statiques
  function translateGamePage() {
    const lang = window.getCurrentLanguage ? window.getCurrentLanguage() : 'fr';
    console.log('[game-i18n] Translating game.html to:', lang);

    // ============================================
    // USER BAR (bandeau haut)
    // ============================================
    const userBarName = document.querySelector('.user-bar-name');
    if (userBarName && userBarName.textContent === 'Invité') {
      userBarName.textContent = tr('common.guest');
    }

    const chatOnlyBadge = document.querySelector('.user-bar-credits');
    if (chatOnlyBadge && chatOnlyBadge.textContent.includes('Chat uniquement')) {
      chatOnlyBadge.textContent = tr('common.chatOnly');
    }

    const logoutBtn = document.querySelector('.user-bar-btn[style*="neon-red"]');
    if (logoutBtn && logoutBtn.textContent.includes('Déconnexion')) {
      logoutBtn.innerHTML = `<span style="color: var(--neon-red);">■</span> ${tr('common.disconnect')}`;
    }

    // ============================================
    // AUDIO UNLOCK OVERLAY
    // ============================================
    const audioUnlockText = document.querySelector('#audioUnlockOverlay > div > div:nth-child(2)');
    if (audioUnlockText && audioUnlockText.textContent.includes('CLIQUEZ POUR ACTIVER')) {
      audioUnlockText.textContent = tr('game.audio.clickToActivate');
    }

    const audioUnlockBtn = document.getElementById('audioUnlockBtn');
    if (audioUnlockBtn && audioUnlockBtn.textContent.includes('ACTIVER L\'AUDIO')) {
      audioUnlockBtn.textContent = tr('game.audio.activateAudio');
    }

    // ============================================
    // HEADER
    // ============================================
    const subtitle = document.querySelector('.header .subtitle');
    if (subtitle && subtitle.textContent.includes('MISSION TEMPS RÉEL')) {
      subtitle.textContent = tr('index.missionRealtime');
    }

    // ============================================
    // HOME SCREEN
    // ============================================
    // Titre "LES SABOTEURS"
    const homeTitle = document.querySelector('#homeScreen h1');
    if (homeTitle && homeTitle.textContent.includes('SABOTEURS')) {
      homeTitle.textContent = tr('index.title');
    }

    // Sous-titre
    const homeSubtitle = document.querySelector('#homeScreen p');
    if (homeSubtitle && homeSubtitle.textContent.includes('déduction sociale')) {
      homeSubtitle.textContent = tr('index.subtitleSmall');
    }

    // Label "NOM DU JOUEUR"
    const playerLabel = document.querySelector('label[for="playerName"]');
    if (playerLabel && playerLabel.textContent.includes('NOM DU JOUEUR')) {
      playerLabel.textContent = tr('index.gameModal.playerName');
    }

    // Placeholder input
    const playerNameInput = document.getElementById('playerName');
    if (playerNameInput && playerNameInput.placeholder.includes('Entrez votre nom')) {
      playerNameInput.placeholder = tr('index.gameModal.playerNamePlaceholder');
    }

    // Bouton créer
    const createBtn = document.getElementById('createBtn');
    if (createBtn && createBtn.textContent.includes('CRÉER UNE MISSION')) {
      createBtn.textContent = tr('index.gameModal.createGame');
    }

    // Bouton rejoindre
    const joinBtn = document.getElementById('joinBtn');
    if (joinBtn && joinBtn.textContent.includes('REJOINDRE UNE MISSION')) {
      joinBtn.textContent = tr('index.gameModal.joinGame');
    }

    // Choix thème
    const themeChoiceLabel = document.querySelector('#homeThemeSelectorContainer span');
    if (themeChoiceLabel && themeChoiceLabel.textContent.includes('CHOIX DU THÈME')) {
      themeChoiceLabel.textContent = tr('index.themeSelector.chooseTheme');
    }

    // ============================================
    // CREATE SCREEN
    // ============================================
    const createMissionTitle = document.getElementById('createMissionTitle');
    if (createMissionTitle) {
      createMissionTitle.textContent = tr('index.gameModal.createGame').replace('🚀 ', '');
    }

    const createRoomBtn = document.getElementById('createRoomBtn');
    if (createRoomBtn && createRoomBtn.textContent.includes('Générer Code')) {
      createRoomBtn.textContent = tr('index.gameModal.generateCode');
    }

    const backFromCreate = document.getElementById('backFromCreate');
    if (backFromCreate && backFromCreate.textContent === 'Retour') {
      backFromCreate.textContent = tr('common.back');
    }

    // ============================================
    // JOIN SCREEN
    // ============================================
    const joinMissionTitle = document.getElementById('joinMissionTitle');
    if (joinMissionTitle) {
      joinMissionTitle.textContent = tr('index.gameModal.joinGame').replace('🔗 ', '');
    }

    const roomNumberLabel = document.querySelector('label[for="joinRoomCode"]');
    if (roomNumberLabel && roomNumberLabel.textContent.includes('Numéro de salle')) {
      roomNumberLabel.textContent = tr('index.gameModal.roomNumber');
    }

    const backFromJoin = document.getElementById('backFromJoin');
    if (backFromJoin && backFromJoin.textContent === 'Retour') {
      backFromJoin.textContent = tr('common.back');
    }

    // ============================================
    // LOBBY SCREEN
    // ============================================
    const missionCodeTitle = document.getElementById('missionCodeTitle');
    if (missionCodeTitle && missionCodeTitle.textContent.includes('CODE MISSION')) {
      missionCodeTitle.textContent = tr('game.lobby.missionCode');
    }

    const readyBtn = document.getElementById('readyBtn');
    if (readyBtn) {
      if (readyBtn.textContent.includes('PRÊT') && !readyBtn.textContent.includes('PAS')) {
        readyBtn.textContent = '✅ ' + tr('game.lobby.ready');
      } else if (readyBtn.textContent.includes('PAS PRÊT')) {
        readyBtn.textContent = tr('game.lobby.notReady');
      }
    }

    const launchBtn = document.getElementById('launchBtn');
    if (launchBtn && launchBtn.textContent.includes('Lancer Mission')) {
      launchBtn.textContent = tr('game.lobby.launchMission');
    }

    const connectedPlayersTitle = document.getElementById('connectedPlayersTitle');
    if (connectedPlayersTitle && connectedPlayersTitle.textContent.includes('ÉQUIPAGE CONNECTÉ')) {
      connectedPlayersTitle.textContent = tr('game.lobby.connectedCrew');
    }

    // Config sections
    const rolesConfigTitle = document.querySelector('#rolesConfig')?.closest('div')?.querySelector('h3');
    if (rolesConfigTitle && rolesConfigTitle.textContent.includes('CONFIG RÔLES')) {
      rolesConfigTitle.textContent = tr('game.config.rolesConfig');
    }

    const themeConfigTitle = document.querySelector('#themeSelector h3');
    if (themeConfigTitle && themeConfigTitle.textContent.includes('THÈME')) {
      themeConfigTitle.textContent = tr('game.config.themeHost');
    }

    const videoOptionsTitle = document.querySelector('#videoOptions h3');
    if (videoOptionsTitle && videoOptionsTitle.textContent.includes('OPTIONS VIDÉO')) {
      videoOptionsTitle.textContent = tr('game.config.videoOptions');
    }

    const disableVideoLabel = document.querySelector('#disableVideoCheckbox')?.closest('label')?.querySelector('span');
    if (disableVideoLabel && disableVideoLabel.textContent.includes('Désactiver la vidéo')) {
      disableVideoLabel.textContent = tr('game.config.disableVideo');
    }

    const videoOptionDescription = document.getElementById('videoOptionDescription');
    if (videoOptionDescription && videoOptionDescription.textContent.includes('Ce mode est idéal')) {
      videoOptionDescription.textContent = tr('game.config.videoDescription');
    }

    // ============================================
    // GAME SCREEN
    // ============================================
    const deadBanner = document.getElementById('deadBanner');
    if (deadBanner && deadBanner.textContent.includes('Vous avez été éliminé')) {
      deadBanner.textContent = tr('game.messages.youHaveBeenEliminated');
    }

    // Video dock
    const videoDockTitle = document.querySelector('#videoDockSlotHeader .title');
    if (videoDockTitle && videoDockTitle.textContent.includes('VISIO')) {
      videoDockTitle.textContent = tr('game.video.visioDiscussion');
    }

    const videoDockExpandBtn = document.getElementById('videoDockExpandBtn');
    if (videoDockExpandBtn) {
      videoDockExpandBtn.title = tr('game.video.openWindow');
    }

    const videoDockHideBtn = document.getElementById('videoDockHideBtn');
    if (videoDockHideBtn) {
      videoDockHideBtn.title = tr('game.video.hideVideo');
    }

    // Host controls
    const hostControlsTitle = document.querySelector('#hostControls > div > div:first-child');
    if (hostControlsTitle && hostControlsTitle.textContent.includes('CONTRÔLES HÔTE')) {
      hostControlsTitle.textContent = tr('game.hostControls.title');
    }

    const phaseTimerText = document.querySelector('#phaseTimer');
    if (phaseTimerText && phaseTimerText.textContent.includes('Phase active depuis')) {
      const elapsed = document.getElementById('phaseElapsed')?.textContent || '0s';
      phaseTimerText.innerHTML = `${tr('game.hostControls.phaseActiveSince')} <span id="phaseElapsed">${elapsed}</span>`;
    }

    const forceAdvanceBtn = document.getElementById('forceAdvanceBtn');
    if (forceAdvanceBtn && forceAdvanceBtn.textContent.includes('Forcer la suite')) {
      forceAdvanceBtn.textContent = tr('game.hostControls.forceAdvance');
    }

    // ============================================
    // END SCREEN
    // ============================================
    const newBadgesTitle = document.querySelector('#newBadgesSection h3');
    if (newBadgesTitle && newBadgesTitle.textContent.includes('BADGES DÉBLOQUÉS')) {
      newBadgesTitle.textContent = tr('game.endGame.badgesUnlocked');
    }

    const replayBtn = document.getElementById('replayBtn');
    if (replayBtn && replayBtn.textContent.includes('Rejouer dans cette chambre')) {
      replayBtn.textContent = tr('game.buttons.replayKeepStats');
    }

    const newGameBtn = document.getElementById('newGameBtn');
    if (newGameBtn && newGameBtn.textContent.includes('Nouvelle partie')) {
      newGameBtn.textContent = tr('game.buttons.newGameResetStats');
    }

    // ============================================
    // RULES MODAL
    // ============================================
    const rulesTitle = document.querySelector('#rulesModal .panel-title');
    if (rulesTitle && rulesTitle.getAttribute('data-i18n') === 'index.rules.title') {
      rulesTitle.textContent = tr('index.rules.title');
    }

    const tutorialBtn = document.getElementById('tutorialBtn');
    if (tutorialBtn && tutorialBtn.textContent.includes('tutoriel rapide')) {
      tutorialBtn.textContent = tr('game.buttons.viewTutorial');
    }

    // ============================================
    // TUTORIAL MODAL
    // ============================================
    translateTutorial();

    // ============================================
    // CHAT
    // ============================================
    const chatTitle = document.querySelector('#chatPanel .chat-header span, #chatWidget .chat-title');
    if (chatTitle && chatTitle.textContent === 'Chat') {
      chatTitle.textContent = tr('game.chat.title');
    }

    const chatInput = document.querySelector('#chatInput, .chat-input input');
    if (chatInput && chatInput.placeholder.includes('Écris ton message')) {
      chatInput.placeholder = tr('game.chat.placeholder');
    }

    // ============================================
    // GUEST BANNER
    // ============================================
    const guestBanner = document.getElementById('guestBanner');
    if (guestBanner) {
      const bannerText = guestBanner.querySelector('span:first-child');
      if (bannerText && bannerText.textContent.includes('Mode Invité')) {
        bannerText.innerHTML = tr('game.guest.banner');
      }
      const createAccountLink = guestBanner.querySelector('a');
      if (createAccountLink && createAccountLink.textContent.includes('Créer un compte')) {
        createAccountLink.textContent = tr('game.guest.createAccount');
      }
    }

    console.log('[game-i18n] Translation complete');
  }

  // Traduit le tutoriel
  function translateTutorial() {
    // Écran 1 - Bienvenue
    const screen1 = document.querySelector('[data-screen="1"]');
    if (screen1) {
      const title = screen1.querySelector('h2');
      if (title && title.textContent.includes('Bienvenue')) {
        title.textContent = tr('tutorial.welcome');
      }
      
      const paragraphs = screen1.querySelectorAll('p');
      if (paragraphs[0] && paragraphs[0].innerHTML.includes('déduction sociale')) {
        paragraphs[0].innerHTML = tr('tutorial.gameDescription');
      }
      if (paragraphs[1] && paragraphs[1].innerHTML.includes('phases de nuit')) {
        paragraphs[1].innerHTML = tr('tutorial.phaseAlternation');
      }
    }

    // Écran 2 - Phase de nuit
    const screen2 = document.querySelector('[data-screen="2"]');
    if (screen2) {
      const title = screen2.querySelector('h2');
      if (title && title.textContent.includes('Phase de nuit')) {
        title.textContent = tr('tutorial.nightPhase');
      }
      
      const items = screen2.querySelectorAll('li');
      if (items[0]) items[0].innerHTML = tr('tutorial.nightSaboteurs');
      if (items[1]) items[1].innerHTML = tr('tutorial.nightRadar');
      if (items[2]) items[2].innerHTML = tr('tutorial.nightDoctor');
      if (items[3]) items[3].innerHTML = tr('tutorial.nightSpecial');
    }

    // Écran 3 - Phase de jour
    const screen3 = document.querySelector('[data-screen="3"]');
    if (screen3) {
      const title = screen3.querySelector('h2');
      if (title && title.textContent.includes('Phase de jour')) {
        title.textContent = tr('tutorial.dayPhase');
      }
      
      const items = screen3.querySelectorAll('li');
      if (items[0] && items[0].textContent.includes('résultats de la nuit')) items[0].textContent = tr('tutorial.dayResults');
      if (items[1]) items[1].innerHTML = tr('tutorial.dayDiscussion');
      if (items[2]) items[2].innerHTML = tr('tutorial.dayVote');
      if (items[3]) items[3].innerHTML = tr('tutorial.dayCaptain');
      
      const tip = screen3.querySelector('p[style*="border-left"]');
      if (tip && tip.innerHTML.includes('Astuce')) {
        tip.innerHTML = tr('tutorial.dayTip');
      }
    }

    // Écran 4 - Conditions de victoire
    const screen4 = document.querySelector('[data-screen="4"]');
    if (screen4) {
      const title = screen4.querySelector('h2');
      if (title && title.textContent.includes('Conditions de victoire')) {
        title.textContent = tr('tutorial.victoryConditions');
      }
      
      const cards = screen4.querySelectorAll('div[style*="border-radius: 12px"]');
      if (cards[0]) {
        const cardTitle = cards[0].querySelector('div[style*="font-weight: 800"]');
        const cardDesc = cards[0].querySelector('div[style*="0.95rem"]');
        if (cardTitle && cardTitle.textContent.includes('Astronautes gagnent')) {
          cardTitle.textContent = tr('tutorial.astronautsWin');
        }
        if (cardDesc && cardDesc.textContent.includes('saboteurs sont éliminés')) {
          cardDesc.textContent = tr('tutorial.astronautsWinDesc');
        }
      }
      if (cards[1]) {
        const cardTitle = cards[1].querySelector('div[style*="font-weight: 800"]');
        const cardDesc = cards[1].querySelector('div[style*="0.95rem"]');
        if (cardTitle && cardTitle.textContent.includes('Saboteurs gagnent')) {
          cardTitle.textContent = tr('tutorial.saboteursWin');
        }
        if (cardDesc && cardDesc.textContent.includes('saboteurs ≥')) {
          cardDesc.textContent = tr('tutorial.saboteursWinDesc');
        }
      }
      
      const readyText = screen4.querySelector('p[style*="text-align: center"]');
      if (readyText && readyText.textContent.includes('Prêt à jouer')) {
        readyText.textContent = tr('tutorial.readyToPlay');
      }
    }

    // Navigation du tutoriel
    const prevBtn = document.getElementById('tutorialPrev');
    if (prevBtn && prevBtn.textContent.includes('Précédent')) {
      prevBtn.textContent = tr('common.previous');
    }

    const nextBtn = document.getElementById('tutorialNext');
    if (nextBtn && nextBtn.textContent.includes('Suivant')) {
      nextBtn.textContent = tr('common.next');
    }

    const dontShowLabel = document.querySelector('#tutorialDontShow')?.closest('label')?.querySelector('span');
    if (dontShowLabel && dontShowLabel.textContent.includes('Ne plus afficher')) {
      dontShowLabel.textContent = tr('tutorial.dontShowAgain');
    }
  }

  // Fonction pour construire le HTML des règles traduit
  // Cette fonction remplace buildRulesHtml() de client.js
  window.buildTranslatedRulesHtml = function(cfg) {
    const enabled = cfg?.rolesEnabled || {};
    const on = (k) => !!enabled[k];

    // Utiliser les noms de rôles thématiques si disponibles
    const tRole = window.tRole || ((key) => key);
    const tTheme = window.t || ((key) => key); // t() de client.js pour les termes thématiques

    const roleLines = [];
    roleLines.push(`<li><b>${tRole('astronaut')}</b> — ${tr('rules.astronautDesc')}</li>`);
    roleLines.push(`<li><b>${tRole('saboteur')}</b> — ${tr('rules.saboteurDesc')}</li>`);
    if (on("radar")) roleLines.push(`<li><b>${tRole('radar')}</b> — ${tr('rules.radarDesc')}</li>`);
    if (on("doctor")) roleLines.push(`<li><b>${tRole('doctor')}</b> — ${tr('rules.doctorDesc')}</li>`);
    if (on("chameleon")) roleLines.push(`<li><b>${tRole('chameleon')}</b> — ${tr('rules.chameleonDesc')}</li>`);
    if (on("security")) roleLines.push(`<li><b>${tRole('security')}</b> — ${tr('rules.securityDesc')}</li>`);
    if (on("ai_agent")) roleLines.push(`<li><b>${tRole('ai_agent')}</b> — ${tr('rules.aiAgentDesc')}</li>`);

    const captain = tTheme('captain');
    const mission = tTheme('mission');
    const saboteurs = tTheme('saboteurs');
    const astronauts = tTheme('astronauts');

    return `
      <div style="opacity:.95;">
        <h3 style="margin:10px 0;">${tr('rules.rolesTitle')}</h3>
        <ul>${roleLines.join("")}</ul>

        <h3 style="margin:10px 0;">${tr('rules.captainTitle')}</h3>
        <ul>
          <li><b>${tr('rules.captainElectionRequired')}</b> ${tr('rules.atStartOfMission')}</li>
          <li>${tr('rules.captainTiebreaker').replace('chef de station', captain.toLowerCase())}</li>
          <li>${tr('rules.captainTransfer').replace('chef de station', captain.toLowerCase())}</li>
        </ul>

        <h3 style="margin:10px 0;">${tr('rules.nightOrderTitle')}</h3>
        <ol>
          <li>${tRole('chameleon')} ${tr('rules.nightN1')}</li>
          <li>${tRole('ai_agent')} ${tr('rules.nightN1')}</li>
          <li>${tRole('radar')}</li>
          <li>${saboteurs} ${tr('rules.unanimity')}</li>
          <li>${tRole('doctor')}</li>
          <li>${tr('rules.resolutionVengeanceLink')}</li>
        </ol>

        <h3 style="margin:10px 0;">${tr('rules.victoryTitle')}</h3>
        <ul>
          <li><b>${astronauts}</b> : ${tr('rules.astronautsWinCondition')}</li>
          <li><b>${saboteurs}</b> : ${tr('rules.saboteursWinCondition')}</li>
          <li><b>${tr('game.endGame.associationOfCriminals').replace('🤝 ', '')}</b> : ${tr('rules.associationWinCondition')}</li>
        </ul>

        <h3 style="margin:10px 0;">${tr('rules.saboteurCountTitle')}</h3>
        <div>${tr('rules.saboteurCountAuto')}</div>
        <ul>
          <li>${tr('rules.players06')} : <b>1</b> ${saboteurs.toLowerCase()}</li>
          <li>${tr('rules.players711')} : <b>2</b> ${saboteurs.toLowerCase()}</li>
          <li>${tr('rules.players12plus')} : <b>3</b> ${saboteurs.toLowerCase()}</li>
        </ul>
      </div>
    `;
  };

  // Initialisation
  function init() {
    console.log('[game-i18n] Initializing...');
    
    // Première traduction
    translateGamePage();

    // Retraduire quand la langue change
    window.addEventListener('languageChanged', (e) => {
      console.log('[game-i18n] Language changed to:', e.detail?.lang);
      setTimeout(translateGamePage, 100);
    });

    // Observer les modifications du DOM pour traduire les éléments dynamiques
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.addedNodes.length > 0) {
          // Retraduire après ajout d'éléments (comme le chat ou les modales)
          setTimeout(translateGamePage, 200);
          break;
        }
      }
    });

    // Observer les conteneurs principaux
    const containers = ['#homeScreen', '#lobbyScreen', '#gameScreen', '#endScreen', '#rulesModal', '#tutorialModal'];
    containers.forEach(selector => {
      const el = document.querySelector(selector);
      if (el) {
        observer.observe(el, { childList: true, subtree: true });
      }
    });
  }

  // Lancer l'initialisation quand tout est prêt
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      waitForTranslations(init);
    });
  } else {
    waitForTranslations(init);
  }

})();
