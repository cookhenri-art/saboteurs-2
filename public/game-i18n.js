/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║            🌍 SABOTEUR - TRADUCTION DYNAMIQUE GAME.HTML V2                ║
 * ║                                                                           ║
 * ║  Ce script traduit dynamiquement tous les textes de game.html             ║
 * ║  Il doit être chargé APRÈS translations.js                                ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

// Fonction de traduction globale qui accède directement à TRANSLATIONS
window.tr = function(key) {
  if (!window.TRANSLATIONS) {
    console.warn('[game-i18n] TRANSLATIONS not loaded');
    return key;
  }
  
  const lang = localStorage.getItem('saboteur_language') || 
    (navigator.language || navigator.userLanguage || 'fr').split('-')[0];
  
  const keys = key.split('.');
  let value = window.TRANSLATIONS;
  
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      console.warn(`[game-i18n] Key not found: ${key}`);
      return key;
    }
  }
  
  // Retourner la traduction pour la langue courante
  if (value && typeof value === 'object') {
    if (lang in value) return value[lang];
    if ('fr' in value) return value.fr; // Fallback FR
    if ('en' in value) return value.en; // Fallback EN
  }
  
  if (typeof value === 'string') return value;
  
  return key;
};

// Remplacer i18n de translations.js avec version plus robuste
window.i18n = window.tr;

// Fonction pour construire les règles traduites
window.buildTranslatedRulesHtml = function(cfg) {
  const tr = window.tr;
  const enabled = cfg?.rolesEnabled || {};
  const on = (k) => !!enabled[k];

  // Utiliser les noms de rôles thématiques si disponibles (de client.js)
  const tRole = window.tRole || ((key) => {
    const roleNames = {
      astronaut: 'Astronaute',
      saboteur: 'Saboteur', 
      radar: 'Officier Radar',
      doctor: 'Docteur Bio',
      chameleon: 'Caméléon',
      security: 'Chef de Sécurité',
      ai_agent: 'Agent IA'
    };
    return roleNames[key] || key;
  });
  
  // t() de client.js pour les termes thématiques
  const tTheme = window.t || ((key) => {
    const themeTerms = {
      captain: 'Chef de station',
      mission: 'mission',
      saboteurs: 'Saboteurs',
      astronauts: 'Astronautes'
    };
    return themeTerms[key] || key;
  });

  const roleLines = [];
  roleLines.push(`<li><b>${tRole('astronaut')}</b> — ${tr('rules.astronautDesc')}</li>`);
  roleLines.push(`<li><b>${tRole('saboteur')}</b> — ${tr('rules.saboteurDesc')}</li>`);
  if (on("radar")) roleLines.push(`<li><b>${tRole('radar')}</b> — ${tr('rules.radarDesc')}</li>`);
  if (on("doctor")) roleLines.push(`<li><b>${tRole('doctor')}</b> — ${tr('rules.doctorDesc')}</li>`);
  if (on("chameleon")) roleLines.push(`<li><b>${tRole('chameleon')}</b> — ${tr('rules.chameleonDesc')}</li>`);
  if (on("security")) roleLines.push(`<li><b>${tRole('security')}</b> — ${tr('rules.securityDesc')}</li>`);
  if (on("ai_agent")) roleLines.push(`<li><b>${tRole('ai_agent')}</b> — ${tr('rules.aiAgentDesc')}</li>`);

  const captain = tTheme('captain');
  const saboteurs = tTheme('saboteurs');
  const astronauts = tTheme('astronauts');

  return `
    <div style="opacity:.95;">
      <h3 style="margin:10px 0;">${tr('rules.rolesTitle')}</h3>
      <ul>${roleLines.join("")}</ul>

      <h3 style="margin:10px 0;">${tr('rules.captainTitle')}</h3>
      <ul>
        <li><b>${tr('rules.captainElectionRequired')}</b> ${tr('rules.atStartOfMission')}</li>
        <li>${tr('rules.captainTiebreaker')}</li>
        <li>${tr('rules.captainTransfer')}</li>
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
        <li><b>${tr('rules.associationTitle')}</b> : ${tr('rules.associationWinCondition')}</li>
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

// Fonction de traduction de la page game.html
function translateGamePage() {
  const tr = window.tr;
  const lang = localStorage.getItem('saboteur_language') || 'fr';
  console.log('[game-i18n] Translating to:', lang);

  // ============================================
  // USER BAR (bandeau haut) - Traduire Invité et Chat uniquement
  // ============================================
  const userBarName = document.querySelector('.user-bar-name');
  if (userBarName) {
    const text = userBarName.textContent.trim();
    // Traduire "Invité" dans toutes les langues possibles
    const guestWords = ['Invité', 'Guest', 'Invitado', 'Ospite', 'Gast', 'Convidado'];
    if (guestWords.some(w => text.includes(w))) {
      userBarName.textContent = tr('common.guest');
    }
  }

  const chatOnlyBadge = document.querySelector('.user-bar-credits');
  if (chatOnlyBadge) {
    const text = chatOnlyBadge.textContent.trim();
    const chatOnlyWords = ['Chat uniquement', 'Chat only', 'Solo chat', 'Nur Chat', 'Apenas chat', 'Alleen chat'];
    if (chatOnlyWords.some(w => text.includes(w))) {
      chatOnlyBadge.textContent = tr('common.chatOnly');
    }
  }

  const logoutBtn = document.querySelector('.user-bar-btn');
  if (logoutBtn) {
    const text = logoutBtn.textContent.trim();
    const disconnectWords = ['Déconnexion', 'Disconnect', 'Desconectar', 'Disconnetti', 'Abmelden', 'Sair', 'Uitloggen'];
    if (disconnectWords.some(w => text.includes(w))) {
      logoutBtn.innerHTML = `<span style="color: var(--neon-red);">■</span> ${tr('common.disconnect')}`;
    }
  }

  // ============================================
  // LOBBY SCREEN
  // ============================================
  
  // Code Mission label
  const missionCodeLabel = document.getElementById('missionCodeLabel');
  if (missionCodeLabel) {
    missionCodeLabel.textContent = tr('game.lobby.missionCode');
  }

  // V20: Mission label in HUD (above room code)
  const missionLabel = document.getElementById('missionLabel');
  if (missionLabel) {
    missionLabel.textContent = tr('game.ui.missionLabel');
  }

  // Membres d'équipage
  const crewMembersLabel = document.getElementById('crewMembersLabel');
  if (crewMembersLabel) {
    crewMembersLabel.textContent = tr('game.lobby.crewMembers');
  }

  // Bouton Lancer Mission
  const startGameBtn = document.getElementById('startGameBtn');
  if (startGameBtn) {
    startGameBtn.innerHTML = tr('game.lobby.launchMission');
  }

  // V22: Boutons de fin de partie
  const replayBtn = document.getElementById('replayBtn');
  if (replayBtn) {
    replayBtn.innerHTML = tr('game.buttons.replayKeepStats');
  }
  const newGameBtn = document.getElementById('newGameBtn');
  if (newGameBtn) {
    newGameBtn.innerHTML = tr('game.buttons.newGameResetStats');
  }

  // Labels balance (Astronautes / Saboteurs)
  const balanceLabelLeft = document.getElementById('balanceLabelLeft');
  if (balanceLabelLeft) {
    const crewmatePlural = tr('game.roles.crewmate') + 'S';
    balanceLabelLeft.textContent = crewmatePlural.toUpperCase();
  }
  
  const balanceLabelRight = document.getElementById('balanceLabelRight');
  if (balanceLabelRight) {
    const saboteurPlural = tr('game.roles.saboteur') + 'S';
    balanceLabelRight.textContent = saboteurPlural.toUpperCase();
  }

  // ============================================
  // CONFIG SECTIONS (LOBBY)
  // ============================================
  
  // Config Rôles title
  const configRolesTitle = document.getElementById('configRolesTitle');
  if (configRolesTitle) {
    configRolesTitle.textContent = tr('game.config.rolesConfig');
  }

  // Theme selector title
  const themeSelectorTitle = document.getElementById('themeSelectorTitle');
  if (themeSelectorTitle) {
    themeSelectorTitle.textContent = tr('game.config.themeHost');
  }

  // Video Options title
  const videoOptionsTitle = document.getElementById('videoOptionsTitle');
  if (videoOptionsTitle) {
    videoOptionsTitle.textContent = tr('game.config.videoOptions');
  }

  // Disable video label
  const disableVideoLabel = document.getElementById('disableVideoLabel');
  if (disableVideoLabel) {
    disableVideoLabel.textContent = tr('game.config.disableVideo');
  }

  // Video option description
  const videoOptionDesc = document.getElementById('videoOptionDescription');
  if (videoOptionDesc) {
    videoOptionDesc.textContent = tr('game.config.videoDescription');
  }

  // Connected players title
  const connectedPlayersTitle = document.getElementById('connectedPlayersTitle');
  if (connectedPlayersTitle) {
    connectedPlayersTitle.textContent = tr('game.lobby.connectedPlayers');
  }

  // Tutorial button
  const tutorialBtn = document.getElementById('tutorialBtn');
  if (tutorialBtn) {
    tutorialBtn.textContent = '📖 ' + tr('game.buttons.viewTutorial');
  }

  // Game title in lobby ("LES SABOTEURS")
  const gameTitleLobby = document.getElementById('gameTitleLobby');
  if (gameTitleLobby) {
    gameTitleLobby.textContent = tr('game.mainTitle');
  }
  
  const gameTitleLobby2 = document.getElementById('gameTitleLobby2');
  if (gameTitleLobby2) {
    gameTitleLobby2.textContent = tr('game.mainTitle');
  }

  // Game subtitle in lobby
  const gameSubtitleLobby = document.getElementById('gameSubtitleLobby');
  if (gameSubtitleLobby) {
    gameSubtitleLobby.textContent = tr('game.mainSubtitle');
  }

  // Game subtitle (MISSION TEMPS RÉEL)
  const gameSubtitle = document.getElementById('gameSubtitle');
  if (gameSubtitle) {
    gameSubtitle.textContent = '⚡ ' + tr('game.subtitle') + ' ⚡';
  }

  // ============================================
  // AUDIO UNLOCK
  // ============================================
  const audioText = document.querySelector('#audioUnlockOverlay > div > div:nth-child(2)');
  if (audioText) {
    audioText.textContent = tr('game.audio.clickToActivate');
  }

  const audioBtn = document.getElementById('audioUnlockBtn');
  if (audioBtn) {
    audioBtn.innerHTML = '🎵 ' + tr('game.audio.activateAudio');
  }

  // ============================================
  // HOME SCREEN
  // ============================================
  const homeTitle = document.querySelector('#homeScreen h1');
  if (homeTitle && homeTitle.textContent.includes('SABOTEURS')) {
    homeTitle.textContent = tr('index.title');
  }

  const homeSubtitle = document.querySelector('#homeScreen p');
  if (homeSubtitle && (homeSubtitle.textContent.includes('déduction') || homeSubtitle.textContent.includes('deducción'))) {
    homeSubtitle.textContent = tr('index.subtitleSmall');
  }

  const playerLabel = document.querySelector('label[for="playerName"]');
  if (playerLabel) {
    playerLabel.textContent = tr('index.gameModal.playerName');
  }

  const playerInput = document.getElementById('playerName');
  if (playerInput) {
    playerInput.placeholder = tr('index.gameModal.playerNamePlaceholder');
  }

  const createBtn = document.getElementById('createBtn');
  if (createBtn) {
    createBtn.innerHTML = tr('index.gameModal.createGame');
  }

  const joinBtn = document.getElementById('joinBtn');
  if (joinBtn) {
    joinBtn.innerHTML = tr('index.gameModal.joinGame');
  }

  // CREATE/JOIN screens
  const createMissionTitle = document.getElementById('createMissionTitle');
  if (createMissionTitle) {
    createMissionTitle.textContent = tr('index.gameModal.createGame').replace(/🚀\s*/, '');
  }

  const createRoomBtn = document.getElementById('createRoomBtn');
  if (createRoomBtn) {
    createRoomBtn.textContent = tr('index.gameModal.generateCode');
  }

  const joinMissionTitle = document.getElementById('joinMissionTitle');
  if (joinMissionTitle) {
    joinMissionTitle.textContent = tr('index.gameModal.joinGame').replace(/🔗\s*/, '');
  }

  const roomLabel = document.querySelector('label[for="joinRoomCode"]');
  if (roomLabel) {
    roomLabel.textContent = tr('index.gameModal.roomNumber');
  }

  // Back buttons
  document.querySelectorAll('#backFromCreate, #backFromJoin').forEach(btn => {
    if (btn && btn.textContent === 'Retour') {
      btn.textContent = tr('common.back');
    }
  });

  // ============================================
  // TUTORIAL - Traduire les écrans 1-6
  // ============================================
  translateTutorial();

  // ============================================
  // CHAT
  // ============================================
  const chatInput = document.querySelector('#chatInput, .chat-input input');
  if (chatInput) {
    chatInput.placeholder = tr('game.chat.placeholder');
  }

  // ============================================
  // NAVIGATION TUTORIEL
  // ============================================
  const tutorialPrev = document.getElementById('tutorialPrev');
  if (tutorialPrev) {
    tutorialPrev.textContent = tr('common.previous');
  }

  const tutorialNext = document.getElementById('tutorialNext');
  if (tutorialNext) {
    const isLastScreen = tutorialNext.textContent.includes('Commencer') || tutorialNext.textContent.includes('Start') || tutorialNext.textContent.includes('🚀');
    if (isLastScreen) {
      tutorialNext.textContent = tr('common.start');
    } else {
      tutorialNext.textContent = tr('common.next');
    }
  }

  const dontShowLabel = document.querySelector('#tutorialDontShow')?.closest('label')?.querySelector('span');
  if (dontShowLabel) {
    dontShowLabel.textContent = tr('tutorial.dontShowAgain');
  }

  console.log('[game-i18n] Translation complete');
}

// Traduire les écrans du tutoriel
function translateTutorial() {
  const tr = window.tr;
  
  // Utiliser les noms de rôles thématiques si disponibles
  const tRole = window.tRole || ((key) => key);

  // Écran 1 - Bienvenue
  const screen1 = document.querySelector('[data-screen="1"]');
  if (screen1) {
    const title = screen1.querySelector('h2');
    if (title) title.textContent = tr('tutorial.welcome');
    
    const paras = screen1.querySelectorAll('p');
    if (paras[0]) paras[0].innerHTML = tr('tutorial.gameDescription');
    if (paras[1]) paras[1].innerHTML = tr('tutorial.phaseAlternation');
  }

  // Écran 2 - Phase de nuit - Reconstruire avec noms thématiques
  const screen2 = document.querySelector('[data-screen="2"]');
  if (screen2) {
    const title = screen2.querySelector('h2');
    if (title) title.textContent = tr('tutorial.nightPhase');
    
    const ul = screen2.querySelector('ul');
    if (ul) {
      // Reconstruire les items avec noms thématiques + descriptions traduites
      const saboteurName = tRole('saboteur');
      const radarName = tRole('radar');
      const doctorName = tRole('doctor');
      
      ul.innerHTML = `
        <li><strong style="color: var(--neon-red);">${saboteurName}s</strong> : ${tr('tutorial.nightSaboteursAction')}</li>
        <li><strong style="color: var(--neon-cyan);">${radarName}</strong> : ${tr('tutorial.nightRadarAction')}</li>
        <li><strong style="color: var(--neon-green);">${doctorName}</strong> : ${tr('tutorial.nightDoctorAction')}</li>
        <li><strong style="color: var(--neon-orange);">${tr('tutorial.specialRolesLabel')}</strong> : ${tRole('chameleon')}, ${tRole('ai_agent')}, etc.</li>
      `;
    }
  }

  // Écran 3 - Phase de jour
  const screen3 = document.querySelector('[data-screen="3"]');
  if (screen3) {
    const title = screen3.querySelector('h2');
    if (title) title.textContent = tr('tutorial.dayPhase');
    
    const items = screen3.querySelectorAll('li');
    if (items[0]) items[0].innerHTML = tr('tutorial.dayResults');
    if (items[1]) items[1].innerHTML = tr('tutorial.dayDiscussion');
    if (items[2]) items[2].innerHTML = tr('tutorial.dayVote');
    if (items[3]) items[3].innerHTML = tr('tutorial.dayCaptain');
    
    const tip = screen3.querySelector('p[style*="border-left"]');
    if (tip) tip.innerHTML = tr('tutorial.dayTip');
  }

  // Écran 4 - Conditions de victoire
  const screen4 = document.querySelector('[data-screen="4"]');
  if (screen4) {
    const title = screen4.querySelector('h2');
    if (title) title.textContent = tr('tutorial.victoryConditions');
    
    // Utiliser noms thématiques pour les cartes
    const astronautName = tRole('astronaut');
    const saboteurName = tRole('saboteur');
    
    const cards = screen4.querySelectorAll('div[style*="border-radius: 12px"]');
    if (cards[0]) {
      const t1 = cards[0].querySelector('div[style*="font-weight"]');
      const d1 = cards[0].querySelector('div[style*="0.95rem"]');
      if (t1) t1.textContent = `${astronautName}s ${tr('tutorial.win')}`;
      if (d1) d1.textContent = tr('tutorial.astronautsWinDesc');
    }
    if (cards[1]) {
      const t2 = cards[1].querySelector('div[style*="font-weight"]');
      const d2 = cards[1].querySelector('div[style*="0.95rem"]');
      if (t2) t2.textContent = `${saboteurName}s ${tr('tutorial.win')}`;
      if (d2) d2.textContent = tr('tutorial.saboteursWinDesc');
    }
    
    const ready = screen4.querySelector('p[style*="text-align: center"]');
    if (ready) ready.textContent = tr('tutorial.readyToPlay');
  }

  // Écrans 5 et 6 sont générés dynamiquement par client.js
}

// Initialisation
function init() {
  console.log('[game-i18n] Initializing...');
  
  // Test si TRANSLATIONS est chargé
  if (!window.TRANSLATIONS) {
    console.warn('[game-i18n] Waiting for TRANSLATIONS...');
    setTimeout(init, 200);
    return;
  }
  
  // Première traduction après un court délai pour laisser le DOM se charger
  setTimeout(translateGamePage, 500);
  
  // Retraduire quand la langue change
  window.addEventListener('languageChanged', () => {
    console.log('[game-i18n] Language changed, re-translating...');
    translateGamePage();
  });
  
  // Retraduire quand le lobby est affiché
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
        const target = mutation.target;
        if (target.classList && target.classList.contains('active')) {
          setTimeout(translateGamePage, 100);
        }
      }
    }
  });
  
  // Observer les changements d'écran
  document.querySelectorAll('.screen').forEach(screen => {
    observer.observe(screen, { attributes: true });
  });
}

// Lancer quand le DOM est prêt
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
