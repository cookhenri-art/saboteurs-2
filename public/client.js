// ==============================
// V9.4.3 FORCE RECONNECT
// ==============================
function shouldReconnect() {
  return !!localStorage.getItem("playerId");
}

/* Infiltration Spatiale — client (vanilla) V26 */

// V31: Fonction utilitaire pour afficher l'avatar (IA prioritaire sur emoji)
function getAvatarHtml(player, size = 32, marginRight = 6) {
  if (!player) return `<span style="font-size:${size > 24 ? '1.3rem' : '1rem'}; margin-right:${marginRight}px;">👤</span>`;
  
  const borderColor = player.colorHex || '#00ffff';
  
  // Priorité: avatarUrl (IA ou emoji classique) > customAvatar (photo) > avatarEmoji
  if (player.avatarUrl) {
    // V31: Vérifier si c'est une URL/chemin d'image ou un emoji
    // Une image commence par http, https, / ou data:
    const isImageUrl = player.avatarUrl.startsWith('http') || 
                       player.avatarUrl.startsWith('/') || 
                       player.avatarUrl.startsWith('data:');
    if (isImageUrl) {
      // Avatar IA (image)
      return `<img src="${player.avatarUrl}" style="width:${size}px; height:${size}px; border-radius:50%; object-fit:cover; margin-right:${marginRight}px; border:2px solid ${borderColor};" onerror="this.outerHTML='<span style=\\'font-size:${size > 24 ? '1.3rem' : '1rem'}; margin-right:${marginRight}px;\\'>${player.avatarEmoji || '👤'}</span>'">`;
    } else {
      // Avatar classique (emoji stocké comme avatarUrl)
      return `<span style="font-size:${size > 24 ? '1.5rem' : '1.2rem'}; margin-right:${marginRight}px;">${player.avatarUrl}</span>`;
    }
  }
  if (player.customAvatar) {
    return `<img src="${player.customAvatar}" style="width:${size}px; height:${size}px; border-radius:50%; object-fit:cover; margin-right:${marginRight}px; border:2px solid ${borderColor};" onerror="this.outerHTML='<span style=\\'font-size:${size > 24 ? '1.3rem' : '1rem'}; margin-right:${marginRight}px;\\'>${player.avatarEmoji || '👤'}</span>'">`;
  }
  return `<span style="font-size:${size > 24 ? '1.3rem' : '1rem'}; margin-right:${marginRight}px;">${player.avatarEmoji || '👤'}</span>`;
}

// Socket.IO: index.html ensures the client library is loaded (local first, CDN fallback).
// If the server isn't running, we still want the UI to work and show a clear message.
// CAPACITOR: Utiliser l'URL absolue du serveur en mode natif
const socketUrl = window.SaboteurPlatform?.getSocketUrl() || window.location.origin;
const socket = io(socketUrl, {
  transports: ["websocket", "polling"],
  timeout: 10000,
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 500,
  reconnectionDelayMax: 2500,
});

// CAPACITOR: Gérer le cycle de vie de l'app (background/foreground)
if (window.IS_CAPACITOR) {
  window.addEventListener('appStateChange', (e) => {
    if (e.detail.isActive && !socket.connected) {
      console.log('[Socket] App resumed, reconnecting...');
      socket.connect();
    }
  });
  
  window.addEventListener('networkChange', (e) => {
    if (e.detail.connected && e.detail.wasOffline && !socket.connected) {
      console.log('[Socket] Network restored, reconnecting...');
      socket.connect();
    }
  });
}

// D11 V22: Exposer socket globalement pour d9-avatars.js et autres modules
window.socket = socket;

const $ = (id) => document.getElementById(id);

const STORAGE = {
  playerId: "is_playerId",
  playerToken: "is_playerToken",  // Nouveau: token persistant
  name: "is_name",
  room: "is_roomCode",
};

// Mode debug: ajouter ?debug=1 dans l'URL pour créer un nouveau token à chaque session
const isDebugMode = new URLSearchParams(window.location.search).get('debug') === '1';

// Générer ou récupérer le playerToken (localStorage pour persistence entre sessions)
function getOrCreatePlayerToken() {
  // En mode debug, créer un nouveau token à chaque fois pour tester avec plusieurs fenêtres
  if (isDebugMode) {
    const token = crypto.randomUUID();
    console.log('[DEBUG MODE] New playerToken generated:', token);
    return token;
  }
  
  let token = localStorage.getItem(STORAGE.playerToken);
  if (!token) {
    token = crypto.randomUUID();
    localStorage.setItem(STORAGE.playerToken, token);
  }
  return token;
}

function getOrCreatePlayerId() {
  // En mode debug, créer un nouveau playerId à chaque fois
  if (isDebugMode) {
    const id = crypto.randomUUID();
    console.log('[DEBUG MODE] New playerId generated:', id);
    return id;
  }
  
  let id = sessionStorage.getItem(STORAGE.playerId);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(STORAGE.playerId, id);
  }
  return id;
}

const playerId = getOrCreatePlayerId();
const playerToken = getOrCreatePlayerToken();

// Afficher un indicateur visuel en mode debug
if (isDebugMode) {
  window.addEventListener('DOMContentLoaded', () => {
    const indicator = document.createElement('div');
    indicator.textContent = '🔧 MODE DEBUG';
    indicator.style.cssText = 'position:fixed;top:10px;right:10px;background:red;color:white;padding:5px 10px;border-radius:5px;font-size:12px;z-index:99999;';
    document.body.appendChild(indicator);
  });
}

let state = null;
let lastAudioToken = null;
let lobbyIntroPlayed = false; // Track if we've played the lobby intro for this session

let autoReconnectAttempted = false;
let disconnectReloadTimer = null;
let heartbeatInterval = null;

// Heartbeat pour maintenir la session vivante
function startHeartbeat() {
  if (heartbeatInterval) return;
  heartbeatInterval = setInterval(() => {
    const roomCode = sessionStorage.getItem(STORAGE.room);
    if (roomCode && isConnected) {
      socket.emit("heartbeat", { playerId, roomCode }, (res) => {
        if (!res?.ok) {
          console.warn("[heartbeat] failed");
        }
      });
    }
  }, 30000); // Toutes les 30 secondes
}

function stopHeartbeat() {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
}

function attemptAutoReconnect() {
  if (autoReconnectAttempted) return;
  const name = (sessionStorage.getItem(STORAGE.name) || "").trim();
  const roomCode = (sessionStorage.getItem(STORAGE.room) || "").trim();
  if (!name || !roomCode) return;
  if (state?.roomCode) return;
  autoReconnectAttempted = true;
  // Try to restore the session silently with playerToken
  socket.emit("reconnectRoom", { playerId, name, roomCode, playerToken }, (res) => {
    if (!res?.ok) {
      // Session invalid (room deleted, player not found, etc.)
      autoReconnectAttempted = false;
      
      // Nettoyer la session invalide
      sessionStorage.removeItem(STORAGE.room);
      
      // Afficher un message explicatif
      setError(`Mission ${roomCode} introuvable (expirée ou terminée). Créez une nouvelle mission ou rejoignez-en une autre.`);
      
      try { $("joinRoomCode").value = ""; } catch {}
      showScreen("homeScreen");
    } else {
      startHeartbeat();
    }
  });
}

let isConnected = false;
socket.on("connect", () => {
  isConnected = true;
  clearError();
  if (disconnectReloadTimer) {
    clearTimeout(disconnectReloadTimer);
    disconnectReloadTimer = null;
  }
  attemptAutoReconnect();
});
socket.on("disconnect", () => {
  isConnected = false;
  stopHeartbeat();
  // If the socket stays disconnected for a bit, auto-refresh to recover.
  if (disconnectReloadTimer) clearTimeout(disconnectReloadTimer);
  const hasSession = !!(sessionStorage.getItem(STORAGE.name) && sessionStorage.getItem(STORAGE.room));
  if (hasSession) {
    disconnectReloadTimer = setTimeout(() => {
      if (!isConnected) {
        try { location.reload(); } catch {}
      }
    }, 5000);
  }
});
socket.on("connect_error", () => {
  isConnected = false;
  // Most common cause: user opened index.html directly (file://) or the server isn't running.
  setError("Connexion au serveur impossible. Lance l'application via le serveur (npm install puis npm start) et ouvre l'URL affichée (ex: http://localhost:3000). Sur Render, attends que le service soit démarré.");
});

function showScreen(screenId) {
  for (const el of document.querySelectorAll(".screen")) el.classList.remove("active");
  $(screenId).classList.add("active");
  
  // Reset lobby intro flag when returning to home
  if (screenId === "homeScreen") {
    lobbyIntroPlayed = false;
  }
  
  // D11: Cacher le bouton d'installation quand la partie est lancée
  const installBtn = document.getElementById("installAppBtn");
  const pwaPrompt = document.getElementById("pwaInstallPrompt");
  const hideInstall = (screenId === "gameScreen" || screenId === "endScreen");
  
  if (installBtn) {
    installBtn.style.display = hideInstall ? "none" : "";
  }
  if (pwaPrompt) {
    pwaPrompt.style.display = hideInstall ? "none" : "";
  }
}

function setError(msg) {
  const el = $("errorDisplay");
  el.textContent = msg || "";
  if (msg) {
    el.style.marginTop = "12px";
    el.style.color = "var(--neon-red)";
    el.style.fontWeight = "800";
    el.style.textAlign = "center";
  }
}
function clearError() { setError(""); }

let buildInfo = null;
function refreshBuildBadge() {
  const el = $("buildBadge");
  if (!el) return;
  const bid = buildInfo?.buildId || state?.buildId || "";
  el.innerHTML = bid ? `BUILD: <b>${escapeHtml(bid)}</b>` : "";
}
fetch("https://saboteurs-2.onrender.com/api/themes");

function setNotice(msg) {
  const el = $("errorDisplay");
  el.textContent = msg || "";
  if (msg) {
    el.style.marginTop = "12px";
    el.style.color = "var(--neon-cyan)";
    el.style.fontWeight = "800";
    el.style.textAlign = "center";
  }
}

function mustName() {
  const n = ($("playerName").value || "").trim();
  if (n.length < 2) {
    setError("Nom invalide (min 2 caractères).");
    return null;
  }
  return n.slice(0, 20);
}

function formatPhaseTitle(s) {
  const p = s.phase;
  const night = s.night || 0;
  const day = s.day || 0;
  
  // Helper pour traductions multilingues
  const tr = (key, fallback) => {
    if (typeof window.i18n === 'function') {
      const result = window.i18n(key);
      if (result !== key) return result;
    }
    return fallback;
  };
  
  // V33: Utiliser i18n pour captain au lieu de t() pour avoir la traduction multilingue
  const captainName = window.i18n ? window.i18n('game.ui.captain') : t('captain');
  const saboName = tRole('saboteur', true); // Pluriel traduit

  const map = {
    LOBBY: "LOBBY",
    ROLE_REVEAL: tr('game.phases.roleVerification', "VÉRIFICATION DU RÔLE"),
    CAPTAIN_CANDIDACY: tr('game.phases.captainCandidacy', `CANDIDATURE {captain}`).replace('{captain}', captainName.toUpperCase()),
    CAPTAIN_VOTE: tr('game.phases.captainVote', `VOTE {captain}`).replace('{captain}', captainName.toUpperCase()),
    NIGHT_START: tr('game.phases.nightStart', `NUIT {night} — DÉBUT`).replace('{night}', night),
    NIGHT_CHAMELEON: tr('game.phases.nightRole', `NUIT — {role}`).replace('{role}', tRole('chameleon').toUpperCase()),
    NIGHT_AI_AGENT: tr('game.phases.nightRoleLiaison', `NUIT — {role} (LIAISON)`).replace('{role}', tRole('ai_agent').toUpperCase()),
    NIGHT_AI_EXCHANGE: tr('game.phases.nightExchangePrivate', `NUIT — ÉCHANGE {role} (PRIVÉ)`).replace('{role}', tRole('ai_agent').toUpperCase()),
    NIGHT_RADAR: tr('game.phases.nightRole', `NUIT — {role}`).replace('{role}', tRole('radar').toUpperCase()),
    NIGHT_SABOTEURS: tr('game.phases.nightSaboteurs', `NUIT — {role} (UNANIMITÉ)`).replace('{role}', saboName.toUpperCase()),
    NIGHT_DOCTOR: tr('game.phases.nightRole', `NUIT — {role}`).replace('{role}', tRole('doctor').toUpperCase()),
    NIGHT_RESULTS: tr('game.phases.nightResults', `RÉSULTATS NUIT {night}`).replace('{night}', night),
    DAY_WAKE: tr('game.phases.dayWake', `JOUR {day} — RÉVEIL`).replace('{day}', day),
    DAY_CAPTAIN_TRANSFER: tr('game.phases.dayCaptainTransfer', `JOUR {day} — TRANSMISSION DU {captain}`).replace('{day}', day).replace('{captain}', captainName.toUpperCase()),
    DAY_VOTE: tr('game.phases.dayVote', `JOUR {day} — VOTE D'ÉJECTION`).replace('{day}', day),
    DAY_TIEBREAK: tr('game.phases.dayTiebreak', `JOUR {day} — DÉPARTAGE ({captain})`).replace('{day}', day).replace('{captain}', captainName.toUpperCase()),
    DAY_RESULTS: tr('game.phases.dayResults', `JOUR {day} — RÉSULTATS`).replace('{day}', day),
    REVENGE: tr('game.phases.revenge', `VENGEANCE — {role}`).replace('{role}', tRole('security').toUpperCase()),
    GAME_OVER: tr('game.phases.gameOver', "FIN DE PARTIE"),
    GAME_ABORTED: tr('game.phases.gameAborted', "PARTIE INTERROMPUE"),
    MANUAL_ROLE_PICK: tr('game.phases.manualRolePick', "CHOIX MANUEL DES RÔLES")
  };
  return map[p] || p;
}



// Helper pour récupérer la description de rôle traduite
function getRoleDescTranslation(roleKey, fallback) {
  if (typeof window.i18n === 'function') {
    const tr = window.i18n(`game.roleDesc.${roleKey}`);
    if (tr !== `game.roleDesc.${roleKey}`) return tr;
  }
  return typeof fallback === 'function' ? fallback() : fallback;
}

const ROLE_INFO = {
  astronaut: {
    get title() { return tRole("astronaut"); },
    desc: () => getRoleDescTranslation('astronaut', () => `Aucun pouvoir spécial. Observe, débat et vote pour protéger la ${t('station')}.`)
  },
  saboteur: {
    get title() { return tRole("saboteur"); },
    desc: () => getRoleDescTranslation('saboteur', () => `Chaque nuit, les ${t('saboteurs').toLowerCase()} votent UNANIMEMENT une cible (impossible de viser un ${t('saboteurs').toLowerCase().slice(0, -1)}).`)
  },
  doctor: {
    get title() { return tRole("doctor"); },
    desc: () => getRoleDescTranslation('doctor', "Une seule fois : potion de vie (sauve la cible attaquée). Une seule fois : potion de mort (tue une cible).")
  },
  security: {
    get title() { return tRole("security"); },
    desc: () => getRoleDescTranslation('security', "Si tu meurs, tu tires une dernière fois (vengeance).")
  },
  ai_agent: {
    get title() { return tRole("ai_agent"); },
    desc: () => getRoleDescTranslation('ai_agent', "Nuit 1 : choisis un joueur à lier avec TOI. Si l'un meurt, l'autre meurt aussi.")
  },
  radar: {
    get title() { return tRole("radar"); },
    desc: () => getRoleDescTranslation('radar', "Chaque nuit, inspecte un joueur et découvre son rôle.")
  },
  engineer: {
    get title() { return tRole("engineer"); },
    desc: () => getRoleDescTranslation('engineer', "Peut espionner à ses risques et périls. Rappel discret en début de nuit tant qu'il est vivant.")
  },
  chameleon: {
    get title() { return tRole("chameleon"); },
    desc: () => getRoleDescTranslation('chameleon', "Nuit 1 seulement : échange TON rôle avec un joueur. Après l'échange : revérification globale.")
  },
};

function getRoleInfo(roleKey, roleLabelFromServer) {
  const k = roleKey || "";
  const base = ROLE_INFO[k];
  if (base) {
    return {
      title: base.title,
      desc: typeof base.desc === 'function' ? base.desc() : base.desc
    };
  }
  return { title: roleLabelFromServer || k || "Rôle", desc: "" };
}

function ensureRoleCardEl() {
  let el = $("roleCard");
  if (el) return el;
  el = document.createElement("div");
  el.id = "roleCard";
  el.className = "role-display";
  const phaseTitleEl = $("phaseTitle");
  if (phaseTitleEl && phaseTitleEl.parentElement) {
    phaseTitleEl.parentElement.insertBefore(el, phaseTitleEl);
  }
  return el;
}

function ensureEjectedPanelEl() {
  let el = $("ejectedPanel");
  if (el) return el;
  const logEl = $("log");
  if (!logEl || !logEl.parentElement) return null;
  el = document.createElement("div");
  el.id = "ejectedPanel";
  el.style.marginTop = "16px";
  el.style.padding = "12px";
  el.style.borderRadius = "12px";
  el.style.background = "rgba(0,0,0,0.35)";
  el.style.border = "1px solid rgba(0,255,255,0.25)";
  el.style.maxHeight = "220px";
  el.style.overflow = "auto";
  el.style.display = "none";
  logEl.parentElement.insertBefore(el, logEl);
  return el;
}

function renderEjectedPanel() {
  const el = ensureEjectedPanelEl();
  if (!el || !state) return;
  const ejected = (state.players || []).filter(p => p.status === "dead");
  if (!ejected.length) {
    el.style.display = "none";
    el.innerHTML = "";
    return;
  }
  el.style.display = "block";
  const eliminatedText = window.i18n ? window.i18n('game.ui.eliminated') : "ÉLIMINÉS";
  el.innerHTML =
    `<div style="font-weight:900; margin-bottom:8px;">💀 ${eliminatedText}</div>` +
    `<div style="display:flex; flex-wrap:wrap; gap:8px;">` +
    ejected.map(p => `<div style="padding:8px 10px; border-radius:999px; border:1px solid rgba(255,0,102,0.45); background:rgba(255,0,102,0.12); font-weight:900;">💀 ${escapeHtml(p.name)}</div>`).join("") +
    `</div>`;
}


function setBackdrop() {
  const el = $("gameBackdrop");
  if (!el || !state) return;

  const p = state.phase || "";
  let img = null;

  // cockpit during lobby + role validation + captain election
  if (p === "LOBBY" || p === "MANUAL_ROLE_PICK" || p === "ROLE_REVEAL" || p === "CAPTAIN_CANDIDACY" || p === "CAPTAIN_VOTE") {
    img = getThemeImagePath("cockpit.webp");
  }
  // results: use ejection banner if there were ejections
  else if ((p === "NIGHT_RESULTS" || p === "DAY_RESULTS") && (state.phaseData?.anyDeaths || state.phaseData?.deathsText)) {
    img = getThemeImagePath("out.webp");
  }
  // revenge banner
  else if (p === "REVENGE") img = getThemeImagePath("vengeance.webp");
  // day / night banners
  else if (p.startsWith("DAY")) img = getThemeImagePath("vote-jour.webp");
  else if (p.startsWith("NIGHT")) img = getThemeImagePath("vote-nuit.webp");

  if (img) el.style.backgroundImage = `url('${img}')`;
  else el.style.backgroundImage = "none";
}

function render() {
  if (!state) return;
  
  // Vérifier et appliquer le thème actif
  checkAndApplyTheme();
  
  // top buttons (quit removed)

  // engineer reminder banner at night start
  const banner = $("topBanner");
  if (state.phaseData?.engineerReminder && String(state.phase).startsWith("NIGHT")) {
    banner.style.display = "block";
    banner.textContent = "⚙️ L’ingénieur est encore dans la partie : il peut espionner à ses risques et périls.";
  } else {
    banner.style.display = "none";
    banner.textContent = "";
  }

  if (!state.roomCode) {
    showScreen("homeScreen");
    return;
  }

  if (state.phase === "LOBBY") {
    showScreen("lobbyScreen");
    renderLobby();
    return;
  }

  if (state.phase === "GAME_OVER" || state.phase === "GAME_ABORTED") {
    // D9: Supprimer le bouton personnaliser (on n'est plus dans le lobby)
    if (window.D9Avatars && typeof D9Avatars.removeCustomizationButton === 'function') {
      D9Avatars.removeCustomizationButton();
    }
    showScreen("endScreen");
    renderEnd();
    return;
  }

  // D9: Supprimer le bouton personnaliser (on n'est plus dans le lobby)
  if (window.D9Avatars && typeof D9Avatars.removeCustomizationButton === 'function') {
    D9Avatars.removeCustomizationButton();
  }
  showScreen("gameScreen");
  renderGame();
}

function renderLobby() {
  // D11 V10: Lock pour empêcher video-tracks de modifier le DOM pendant le rendu
  window._renderingLobby = true;
  
  // D11 V12: Compteur de rendu pour éviter les race conditions
  window._lobbyRenderCount = (window._lobbyRenderCount || 0) + 1;
  const currentRenderCount = window._lobbyRenderCount;
  
  // D11: Détecter si on revient d'une partie (phase précédente n'était pas LOBBY)
  const wasInGame = window._lastRenderedPhase && window._lastRenderedPhase !== 'LOBBY';
  window._lastRenderedPhase = 'LOBBY';
  
  // D11: Si on revient d'une partie, forcer la reconstruction complète
  if (wasInGame) {
    console.log('[D11] Returning to lobby from game - forcing full rebuild');
    const list = $("playersList");
    if (list) {
      list.innerHTML = '';
    }
    // D11: Supprimer inlineVideoBar pour éviter les doubles slots
    const inlineBar = document.getElementById('inlineVideoBar');
    if (inlineBar) {
      console.log('[D11] Removing inlineVideoBar on lobby return');
      inlineBar.remove();
    }
  }
  
  // D11: Toujours vérifier et supprimer inlineVideoBar quand on est dans le lobby
  const strayInlineBar = document.getElementById('inlineVideoBar');
  if (strayInlineBar) {
    console.log('[D11] Removing stray inlineVideoBar in lobby');
    strayInlineBar.remove();
  }
  
  // D9: Injecter le bouton de personnalisation
  requestAnimationFrame(() => {
    if (window.D9Avatars && typeof D9Avatars.injectCustomizationButton === 'function') {
      D9Avatars.injectCustomizationButton();
    }
  });
  
  // Play lobby intro on first entry (adapté au thème)
  if (!lobbyIntroPlayed) {
    lobbyIntroPlayed = true;
    
    // Unlock audio si pas déjà fait
    if (!audioManager.userUnlocked) {
      audioManager.unlock();
    }
    
    // Jouer l'intro avec le thème actif de la room (force=true)
    const introCue = {
      file: getThemeAudioPath("INTRO_LOBBY.mp3"),
      queueLoopFile: null,
      tts: null,
      ttsAfterSequence: null
    };
    console.log("[lobby-intro] Playing theme intro:", introCue.file);
    audioManager.play(introCue, true); // force=true pour bypass pending
  }
  
  const code = state.roomCode;
  $("displayRoomCode").textContent = code;
  $("playerCount").textContent = String(state.players.filter(p => p.status !== "left").length);

  // Lobby title: adapt "ÉQUIPAGE CONNECTÉ" to the active theme
  const connectedTitleEl = $("connectedPlayersTitle");
  if (connectedTitleEl) {
    const themeId = state.themeId || currentTheme?.id || "default";
    let title = "ÉQUIPAGE CONNECTÉ";
    if (themeId === "werewolf") title = "LES CITOYENS CONNECTÉS";
    if (themeId === "mythic-realms") title = "LES COMPAGNONS CONNECTÉS";
    if (themeId === "wizard-academy") title = "LES MAGICIENS CONNECTÉS";
    connectedTitleEl.textContent = title;
  }

  // auto allocation summary (based on player count)
  const n = state.players.filter(p => p.status !== "left").length;
  const sab = (n <= 6) ? 1 : (n <= 11 ? 2 : 3);
  const ast = Math.max(0, n - sab);
  
  // Format simplifié : "Répartition : X Saboteurs • Y Astronautes"
  const sabLabel = tRole('saboteur', sab > 1);
  const astLabel = tRole('astronaut', ast > 1);
  $("autoAllocation").innerHTML = `<div style="text-align:center; opacity:0.9;">Répartition : <b>${sab}</b> ${sabLabel} • <b>${ast}</b> ${astLabel}</div>`;

  // balance indicator
  const ratio = n ? (ast / n) : 0.5;
  const left = Math.round(ratio * 100);
  $("balanceIndicatorCockpit").style.left = `${left}%`;
  
  // Traduire les labels
  const astronautsTerm = t('astronauts').toUpperCase();
  const saboteursTerm = t('saboteurs').toUpperCase();
  // Lobby: on garde uniquement les noms des 2 camps (sans emojis / sans "AVANTAGE")
  $("balanceLabelLeft").textContent = astronautsTerm;
  $("balanceLabelRight").textContent = saboteursTerm;
  if ($("balanceStatusCockpit")) {
    $("balanceStatusCockpit").textContent = "";
  }

  // players list - D11 V6: Mise à jour intelligente sans détruire les vidéos
  const list = $("playersList");
  const playersSorted = [...state.players].sort((a,b) => (b.isHost?1:0) - (a.isHost?1:0) || a.name.localeCompare(b.name));
  
  // D11 V6: Mapper les éléments existants par playerId
  const existingItems = new Map();
  Array.from(list.children).forEach(item => {
    if (item.dataset?.playerId) {
      existingItems.set(item.dataset.playerId, item);
    }
  });
  
  // D11 V6: Créer un Set des IDs attendus
  const expectedIds = new Set(playersSorted.map(p => p.playerId));
  
  // D11 V6: Supprimer les joueurs qui ne sont plus dans la liste
  existingItems.forEach((item, playerId) => {
    if (!expectedIds.has(playerId)) {
      console.log('[D11] Removing player no longer in list:', playerId);
      item.remove();
      existingItems.delete(playerId);
    }
  });
  
  // D11 V18: Bloquer video-tracks pendant toute la reconstruction
  window._lobbyRebuildInProgress = true;
  console.log('[D11] V19 🔒 Lobby rebuild LOCKED');
  
  // D11 V19: NE PAS sauvegarder les vidéos - laisser video-tracks.js les réattacher
  // Cela évite les conflits de DOM entre client.js et video-tracks.js
  
  // Vider complètement la liste
  list.innerHTML = '';
  console.log('[D11] V19 List cleared, recreating all players (no video save)');
  
  // Recréer tous les joueurs
  playersSorted.forEach((p, index) => {
    // D11 V19: Ne pas restaurer de vidéo - video-tracks.js le fera
    
    console.log('[D11] V19 Creating player item for:', p.name);
    let item = document.createElement("div");
    item.className = "player-item";
    item.dataset.playerId = p.playerId;
      
      // Appliquer la couleur de bordure
      if (p.colorHex) {
        item.style.borderColor = p.colorHex;
        item.style.boxShadow = `0 0 8px ${p.colorHex}40`;
      }
      
      // V31: Utiliser la fonction utilitaire pour l'avatar (IA prioritaire)
      const avatarDisplay = getAvatarHtml(p, 32, 6);
      console.log('[D9 V31] Player', p.name, 'avatarUrl:', p.avatarUrl, 'avatarEmoji:', p.avatarEmoji);
      const badgeDisplay = p.badgeEmoji ? `<span style="margin-left:4px; font-size:0.9rem;" title="${p.badgeName || ''}">${p.badgeEmoji}</span>` : '';
      
      // Créer la structure gauche
      const left = document.createElement("div");
      left.className = "player-left";
      left.style.cssText = "display:flex !important; flex-direction:row !important; gap:10px; align-items:center; flex:1 1 auto;";
      
      // Créer le slot vidéo
      const videoSlot = document.createElement("div");
      videoSlot.className = "player-video-slot";
      videoSlot.dataset.playerId = p.playerId;
      videoSlot.setAttribute("aria-label", `Video ${p.name}`);
      videoSlot.style.cssText = "flex-shrink:0; width:64px; height:48px; min-width:64px; min-height:48px; display:flex; align-items:center; justify-content:center; background:rgba(0,0,0,0.3); border-radius:8px; overflow:hidden;";
      
      // V31: Afficher l'avatar comme placeholder quand pas de vidéo
      if (p.avatarUrl) {
        const isImageUrl = p.avatarUrl.startsWith('http') || 
                           p.avatarUrl.startsWith('/') || 
                           p.avatarUrl.startsWith('data:');
        if (isImageUrl) {
          // Avatar IA (image)
          videoSlot.innerHTML = `<img src="${p.avatarUrl}" class="video-slot-avatar" style="width:100%; height:100%; object-fit:cover; border-radius:8px;" onerror="this.style.display='none'">`;
        } else {
          // Avatar classique (emoji)
          videoSlot.innerHTML = `<span style="font-size:2rem;">${p.avatarUrl}</span>`;
        }
      } else if (p.avatarEmoji) {
        videoSlot.innerHTML = `<span style="font-size:1.8rem;">${p.avatarEmoji}</span>`;
      }
      
      // D11 V19: video-tracks.js attachera la vidéo par-dessus si disponible
      
      // Créer le conteneur d'info
      const playerInfo = document.createElement("div");
      playerInfo.className = "player-info";
      playerInfo.style.cssText = "display:flex !important; visibility:visible !important; flex-direction:column; gap:4px; flex:1 1 auto; min-width:80px;";
      
      // Créer le nom
      const playerName = document.createElement("div");
      playerName.className = "player-name";
      playerName.style.cssText = "font-weight:700; font-size:1rem; color:white; display:flex; align-items:center;";
      playerName.innerHTML = `${avatarDisplay}${escapeHtml(p.name)}${badgeDisplay}`;
      
      // Créer les badges
      const badges = document.createElement("div");
      badges.className = "player-badges";
      badges.style.cssText = "display:flex; flex-wrap:wrap; gap:4px;";
      badges.innerHTML = `
        ${p.isHost ? `<span class="pill ok">HÔTE</span>` : ""}
        ${p.isCaptain ? `<span class="pill ok">CAPITAINE</span>` : ""}
        ${p.connected ? `<span class="pill ok">EN LIGNE</span>` : `<span class="pill warn">RECONNEXION…</span>`}
        ${p.status === "left" ? `<span class="pill bad">SORTI</span>` : (p.status === "dead" ? `<span class="pill bad">ÉJECTÉ</span>` : "")}
      `;
      
      playerInfo.appendChild(playerName);
      playerInfo.appendChild(badges);
      
      left.appendChild(videoSlot);
      left.appendChild(playerInfo);
      
      // Créer la partie droite (état prêt)
      const right = document.createElement("div");
      right.className = "player-right";
      right.innerHTML = p.ready 
        ? `<span class="pill ok">${window.i18n ? window.i18n('game.lobby.ready') : 'PRÊT'}</span>` 
        : `<span class="pill warn">${window.i18n ? window.i18n('game.lobby.notReady') : 'PAS PRÊT'}</span>`;
      
      item.appendChild(left);
      item.appendChild(right);
      
      // Ajouter à la liste
      list.appendChild(item);
    
    // D11 V7: S'assurer que l'élément est dans le bon ordre
    if (list.children[index] !== item) {
      list.insertBefore(item, list.children[index] || null);
    }
  });
  
  // D11 V19: Simplification - on ne fait que vérifier l'affichage, pas de reconstruction
  // La structure a été créée correctement juste au-dessus
  requestAnimationFrame(() => {
    list.querySelectorAll('.player-item').forEach(item => {
      const left = item.querySelector('.player-left');
      const info = left?.querySelector('.player-info');
      
      // V19: Juste forcer l'affichage, jamais reconstruire
      if (left && info) {
        info.style.display = 'flex';
        info.style.visibility = 'visible';
        info.style.opacity = '1';
        left.style.display = 'flex';
      }
    });
    
    // D11 V19: Déverrouiller et forcer le reattach après un court délai
    setTimeout(() => {
      if (window._lobbyRenderCount !== currentRenderCount) {
        console.log('[D11] V19 Skipping unlock - newer render in progress');
        return;
      }
      window._renderingLobby = false;
      window._lobbyRebuildInProgress = false;
      console.log('[D11] V19 🔓 Lobby rebuild UNLOCKED - triggering reattach');
      if (window.VideoTracksRefresh) {
        window.VideoTracksRefresh();
      }
    }, 250); // V19: Délai augmenté pour laisser le DOM se stabiliser
  });

  // ready button
  const me = state.players.find(p => p.playerId === state.you?.playerId);
  const ready = !!me?.ready;
  $("readyBtn").textContent = ready 
    ? `☑ ${window.i18n ? window.i18n('game.lobby.ready') : 'PRÊT'} (${window.i18n ? window.i18n('game.actions.cancel') : 'annuler'})` 
    : `☐ ${window.i18n ? window.i18n('game.lobby.ready') : 'PRÊT'}`;
  $("readyBtn").onclick = () => socket.emit("setReady", { ready: !ready });

  // host controls
  const isHost = !!state.players.find(p => p.playerId === state.you?.playerId)?.isHost;
  $("startGameBtn").style.display = isHost ? "inline-block" : "none";
  $("startGameBtn").onclick = () => socket.emit("startGame", {}, (r) => { if (!r?.ok) setError(r?.error || "Erreur"); });

  // roles config
  const cfg = state.config || {};
  const rolesEnabled = cfg.rolesEnabled || {};
  const box = $("rolesConfig");
  box.innerHTML = "";

  if (!isHost) {
    // Pour les joueurs : afficher seulement les rôles actifs
    const activeRoles = [];
    if (rolesEnabled.doctor) activeRoles.push({ key: 'doctor', label: tRole('doctor') });
    if (rolesEnabled.security) activeRoles.push({ key: 'security', label: tRole('security') });
    if (rolesEnabled.radar) activeRoles.push({ key: 'radar', label: tRole('radar') });
    if (rolesEnabled.ai_agent) activeRoles.push({ key: 'ai_agent', label: tRole('ai_agent') });
    if (rolesEnabled.engineer) activeRoles.push({ key: 'engineer', label: tRole('engineer') });
    if (rolesEnabled.chameleon) activeRoles.push({ key: 'chameleon', label: `${tRole('chameleon')} (Nuit 1)` });
    
    if (activeRoles.length > 0) {
      box.innerHTML = activeRoles.map(r => {
        const help = tRoleHelp(r.key);
        return `
          <div style="margin-bottom: 10px; color: var(--neon-cyan); opacity: 0.9;">
            <div>• ${escapeHtml(r.label)}</div>
            ${help ? `<div class="role-cfg-help" style="margin-left: 14px;">${escapeHtml(help)}</div>` : ""}
          </div>
        `;
      }).join("");
    } else {
      const noRolesText = window.i18n ? window.i18n('game.config.noSpecialRoles') : 'Aucun rôle spécial activé';
      box.innerHTML = `<div style="opacity: 0.7; font-style: italic;">${noRolesText}</div>`;
    }
    
    if (cfg.manualRoles) {
      const manualText = window.i18n ? window.i18n('game.config.manualMode') : 'Mode manuel (cartes physiques)';
      box.innerHTML += `<hr><div style="margin-top: 8px; color: var(--neon-orange); opacity: 0.9;">• ${manualText}</div>`;
    }
    
  } else {
    // Pour l'hôte : afficher les checkboxes comme avant
    box.appendChild(makeCheckbox("doctor", tRole('doctor'), tRoleHelp('doctor'), rolesEnabled.doctor, false, false));
    box.appendChild(makeCheckbox("security", tRole('security'), tRoleHelp('security'), rolesEnabled.security, false, false));
    box.appendChild(makeCheckbox("radar", tRole('radar'), tRoleHelp('radar'), rolesEnabled.radar, false, false));
    box.appendChild(makeCheckbox("ai_agent", tRole('ai_agent'), tRoleHelp('ai_agent'), rolesEnabled.ai_agent, false, false));
    box.appendChild(makeCheckbox("engineer", tRole('engineer'), tRoleHelp('engineer'), rolesEnabled.engineer, false, false));
    box.appendChild(makeCheckbox("chameleon", `${tRole('chameleon')} (Nuit 1)`, tRoleHelp('chameleon'), rolesEnabled.chameleon, false, false));
    box.appendChild(document.createElement("hr"));
    const manualModeText = window.i18n ? window.i18n('game.config.manualMode') : 'Mode manuel (cartes physiques)';
    box.appendChild(makeCheckbox("manualRoles", manualModeText, "", !!cfg.manualRoles, true, false));
  }
  
  
  // Theme selector (host only)
  renderThemeSelector(isHost);
  
  // V9.3.1: Video options (host only)
  renderVideoOptions(isHost);

  function makeCheckbox(key, label, helpText, checked, isRoot=false, isDisabled=false) {
    const row = document.createElement("div");
    row.style.marginBottom = "10px";
    const id = `cfg_${key}`;
    row.innerHTML = `<label class="role-cfg-row" style="display:flex; align-items:flex-start; gap:10px; text-transform:none; letter-spacing:1px; ${isDisabled ? 'opacity:0.5; cursor:not-allowed;' : ''}">
      <input type="checkbox" id="${id}" ${checked ? "checked" : ""} ${isDisabled ? "disabled" : ""}>
      <span class="role-cfg-text" style="display:flex; flex-direction:column; gap:2px;">
        <span class="role-cfg-title">${label}</span>
        ${helpText ? `<span class="role-cfg-help">${helpText}</span>` : ``}
      </span>
    </label>`;
    if (!isDisabled) {
      row.querySelector("input").addEventListener("change", () => {
        const next = JSON.parse(JSON.stringify(state.config || {}));
        next.rolesEnabled = next.rolesEnabled || {};
        if (isRoot) next[key] = row.querySelector("input").checked;
        else next.rolesEnabled[key] = row.querySelector("input").checked;
        socket.emit("updateConfig", { config: next }, (r) => { if (!r?.ok) setError(r?.error || "Erreur config"); });
      });
    }
    return row;
  }
}

function renderGame() {
  // D11: Tracker la phase pour détecter le retour au lobby
  window._lastRenderedPhase = state.phase;
  
  // V9.3.5: Debug mode manuel
  if (state.phase === "MANUAL_ROLE_PICK") {
    console.log('[MANUAL_DEBUG] renderGame called, phase:', state.phase, 'phaseData:', state.phaseData);
  }
  
  $("hudRoom").textContent = state.roomCode;
  setBackdrop();

  // results overlay (ejection)
  const ov = $("ejectionOverlay");
  if (ov) {
    // Keep the overlay image synced with the active theme
    ov.src = getThemeImagePath("out.webp");
    const show = (state.phase === "NIGHT_RESULTS" || state.phase === "DAY_RESULTS") && (state.phaseData?.anyDeaths || state.phaseData?.deathsText);
    ov.style.display = show ? "block" : "none";
  }

  // dead banner (no actions, no ACK) — except if you are the actor of REVENGE / captain transfer
  const deadBanner = $("deadBanner");
  const meDead = state.you?.status === "dead";
  const meId = state.you?.playerId;
  const actorId = state.phaseData?.actorId;
  const actorIds = state.phaseData?.actorIds || [];
  const isActorNow = (actorId && actorId === meId) || (Array.isArray(actorIds) && actorIds.includes(meId));
  const deadCanAct = isActorNow && (state.phase === "REVENGE" || state.phase === "DAY_CAPTAIN_TRANSFER");
  if (deadBanner) deadBanner.style.display = (meDead && !deadCanAct) ? "block" : "none";

  // role card (big icon + title + description)
  const roleCard = ensureRoleCardEl();
  const info = getRoleInfo(state.you?.role, state.you?.roleLabel);
  const roleIconFilename = state.you?.roleIcon || "";
  const roleIconSrc = getRoleImagePath(roleIconFilename);
  const isCaptain = !!state.you?.isCaptain;
  const captainIconSrc = isCaptain ? getRoleImagePath("capitaine.webp") : "";

  // V31: Afficher l'avatar du joueur actuel à côté de la zone MISSION
  const icons = $("roleIcons");
  if (icons) {
    const me = state.players?.find(p => p.playerId === state.you?.playerId);
    if (me) {
      icons.innerHTML = getAvatarHtml(me, 48, 0);
    } else {
      icons.innerHTML = "";
    }
  }

  roleCard.innerHTML = `
    <div class="role-card-inner">
      <div class="role-card-icons">
        ${roleIconSrc ? `<img class="role-card-icon" src="${roleIconSrc}" alt="role">` : ``}
        ${captainIconSrc ? `<img class="role-card-icon captain" src="${captainIconSrc}" alt="capitaine">` : ``}
      </div>
      <div class="role-card-text">
        <div class="role-card-title">${escapeHtml(info.title)} ${isCaptain ? `<span class="role-card-badge">⭐ ${t('captain')}</span>` : ``}</div>
        <div class="role-card-desc">${escapeHtml(info.desc)}</div>
      </div>
    </div>
  `;


  // link banner
  const link = $("linkBanner");
  if (state.you?.linkedTo) {
    link.style.display = "inline-block";
    const linkedToText = window.i18n ? window.i18n('game.ui.linkedTo') : "Lié à";
    link.textContent = `🔗 ${linkedToText} ${state.you.linkedName || "?"}`;
  } else {
    link.style.display = "none";
    link.textContent = "";
  }

  $("phaseTitle").textContent = formatPhaseTitle(state);
  $("phaseText").textContent = buildPhaseText(state);

  console.log('[VideoDock] build=D3-fix-dock-v1');

// VIDEO DOCK (prototype)
  updateVideoDockSlot(state);

  // D6: Compteur de validations amélioré avec barre de progression
  const ack = state.ack || { done:0, total:0 };
  const ackLine = $("ackLine");
  if (ack.total) {
    const percent = Math.round((ack.done / ack.total) * 100);
    const isComplete = ack.done === ack.total;
    const progressColor = isComplete ? '#00ff88' : (percent > 50 ? '#ffaa00' : '#ff6b6b');
    
    // Détecter si le compteur a changé pour animer
    const prevDone = parseInt(ackLine.dataset.prevDone || '0');
    const shouldAnimate = prevDone !== ack.done && ack.done > 0;
    ackLine.dataset.prevDone = ack.done;
    
    const validationsText = window.i18n ? window.i18n('game.ui.validations') : "Validations";
    ackLine.innerHTML = `
      <div class="validation-counter ${shouldAnimate ? 'pulse' : ''}" style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
        <span style="font-weight:600;">✅ ${validationsText} : ${ack.done}/${ack.total}</span>
        <div class="validation-progress" style="flex:1;min-width:100px;height:8px;background:rgba(255,255,255,0.15);border-radius:4px;overflow:hidden;">
          <div class="validation-progress-bar" style="width:${percent}%;height:100%;background:${progressColor};border-radius:4px;transition:width 0.4s ease, background 0.4s ease;${shouldAnimate ? 'animation:progressPulse 0.5s ease;' : ''}"></div>
        </div>
      </div>
    `;
  } else {
    ackLine.textContent = "";
  }

// logs (+ panel éjectés)
const isHost = !!state.players?.find(p => p.playerId === state.you?.playerId)?.isHost;

renderEjectedPanel();

// Log masqué pour tout le monde (anciennement visible uniquement pour l'hôte)
const logEl = $("log");
if (logEl) {
  logEl.style.display = "none";
  logEl.innerHTML = "";
}


  // controls
  const controls = $("controls");
  controls.innerHTML = "";


// actor-only phases: only the actor sees the action UI
const actorOnly = new Set(["NIGHT_CHAMELEON","NIGHT_AI_AGENT","NIGHT_RADAR","NIGHT_DOCTOR","NIGHT_SABOTEURS","DAY_TIEBREAK","DAY_CAPTAIN_TRANSFER","REVENGE"]);
// Fonction dynamique pour récupérer le texte d'attente traduit selon le thème
function getWaitText(phase) {
  // V23: Utiliser les traductions
  const h = (key, fallback) => window.i18n ? window.i18n(`game.hints.${key}`) : fallback;
  
  const waitTexts = {
    NIGHT_CHAMELEON: h('waitChameleon', `🦎 {role} agit…`).replace('{role}', tRole('chameleon')),
    NIGHT_AI_AGENT: h('waitAiAgent', `🤖 {role} agit…`).replace('{role}', tRole('ai_agent')),
    NIGHT_RADAR: h('waitRadar', `🔍 {role} agit…`).replace('{role}', tRole('radar')),
    NIGHT_DOCTOR: h('waitDoctor', `🧪 {role} agit…`).replace('{role}', tRole('doctor')),
    NIGHT_SABOTEURS: h('waitSaboteurs', `🗡️ Les {saboteurs} agissent…`).replace('{saboteurs}', t('saboteurs').toLowerCase()),
    DAY_TIEBREAK: h('waitTiebreak', `⭐ {captain} tranche…`).replace('{captain}', t('captain')),
    DAY_CAPTAIN_TRANSFER: h('waitCaptainTransfer', `⭐ Transmission du {captain}…`).replace('{captain}', t('captain').toLowerCase()),
    REVENGE: h('waitRevenge', `🔫 {role} se venge…`).replace('{role}', tRole('security'))
  };
  return waitTexts[phase] || h('waitDefault', "⏳ Action en cours…");
}

// dead players have no controls (including ACK), except if they are the actor in REVENGE / captain transfer
if (meDead && !deadCanAct) {
  const deadHint = window.i18n ? window.i18n('game.hints.youAreDead') : "💀 Vous êtes mort. Vous n'agissez plus.";
  controls.appendChild(makeHint(deadHint));
  return;
}

if (actorOnly.has(state.phase) && !isActorNow) {
  controls.appendChild(makeHint(getWaitText(state.phase)));
  return;
}

  // default: show ACK button for phases that use it
  const ackButton = () => {
    const b = document.createElement("button");
    b.className = "btn btn-primary btn-validate";
    
    // D6: Vérifier si le joueur a déjà validé (pas dans la liste pending)
    const myId = state.you?.playerId;
    const pending = state.ack?.pending || [];
    const alreadyValidated = myId && !pending.includes(myId);
    
    if (alreadyValidated) {
      // Déjà validé - afficher l'état coché
      const validatedText = window.i18n ? window.i18n('game.buttons.validated') : "VALIDÉ";
      b.innerHTML = "☑ " + validatedText;
      b.classList.add('validated');
      b.disabled = true;
    } else {
      // Pas encore validé
      const validateText = window.i18n ? window.i18n('game.buttons.validate') : "VALIDER";
      b.innerHTML = "☐ " + validateText;
      b.onclick = () => {
        // D6: Feedback visuel amélioré - case cochée
        b.classList.add('validated');
        const validatedText2 = window.i18n ? window.i18n('game.buttons.validated') : "VALIDÉ";
        b.innerHTML = "☑ " + validatedText2;
        b.disabled = true;
        lockControlsNow($('controls'));
        socket.emit("phaseAck");
      };
    }
    return b;
  };

  if (state.phase === "ROLE_REVEAL" || state.phase === "NIGHT_START" || state.phase === "NIGHT_RESULTS" || state.phase === "DAY_WAKE" || state.phase === "DAY_RESULTS") {
    controls.appendChild(ackButton());
  }
  if (state.phase === "NIGHT_RADAR" && state.phaseData?.selectionDone) {
    controls.appendChild(ackButton());
  }

  if (state.phase === "MANUAL_ROLE_PICK") {
  const remaining = state.phaseData?.remaining || {};
  console.log('[MANUAL] Phase:', state.phase, 'PhaseData:', state.phaseData, 'Remaining:', remaining);
  const rolesOrder = ["astronaut","saboteur","doctor","security","radar","ai_agent","engineer","chameleon"];
  const grid = document.createElement("div");
  grid.className = "choice-grid";

  for (const rk of rolesOrder) {
    const count = remaining[rk] ?? 0;
    if (count <= 0) continue;
    const label = tRole(rk) || rk;

    const card = document.createElement("div");
    card.className = "choice-card";
    card.dataset.playerId = state.playerId;
    card.innerHTML = `<div style="font-weight:900; font-size:1.1rem;">${label}</div>
      <div style="opacity:.9; margin-top:6px;">Places restantes : <b>${count}</b></div>`;
    card.onclick = () => {
      for (const el of grid.querySelectorAll('.choice-card')) el.classList.remove('selected');
      card.classList.add('selected');
      lockControlsNow(grid);
      socket.emit("phaseAction", { roleKey: rk }, (r) => { if (r?.ok === false) setError(r.error || "Erreur"); });
    };
    grid.appendChild(card);
  }

  controls.appendChild(grid);
  controls.appendChild(makeHint("Choisis ton rôle (mode cartes physiques). Ton choix vaut validation."));
}

if (state.phase === "CAPTAIN_CANDIDACY") {
    const wrap = document.createElement("div");
    wrap.className = "btn-group";
    const yes = document.createElement("button");
    yes.className = "btn btn-primary";
    const runText = window.i18n ? window.i18n('game.buttons.runForCaptain') : "Je me présente";
    yes.textContent = "🙋 " + runText;
    yes.onclick = () => {
      yes.classList.add('selected');
      lockControlsNow($("controls"));
      socket.emit("phaseAction", { candidacy: true });
    };
    const no = document.createElement("button");
    no.className = "btn btn-secondary";
    const dontRunText = window.i18n ? window.i18n('game.buttons.dontRunForCaptain') : "Je ne me présente pas";
    no.textContent = "🙅 " + dontRunText;
    no.onclick = () => {
      no.classList.add('selected');
      lockControlsNow($("controls"));
      socket.emit("phaseAction", { candidacy: false });
    };
    wrap.appendChild(yes); wrap.appendChild(no);
    controls.appendChild(wrap);
  }

  if (state.phase === "CAPTAIN_VOTE") {
    const cands = state.phaseData?.candidates || [];
    const grid = makeChoiceGrid(cands, "Voter", (id) => socket.emit("phaseAction", { vote: id }), { lockOnPick: false });
    // D6: Réappliquer la sélection si le joueur a déjà voté
    const cur = state.phaseData?.yourVoteId || null;
    if (cur) {
      for (const card of grid.querySelectorAll('.choice-card')) {
        if (card.dataset.playerId === cur) {
          card.classList.add('selected');
          card.classList.add('locked');
        }
      }
    }
    controls.appendChild(grid);
  }

  if (state.phase === "NIGHT_CHAMELEON") {
    const alive = state.players.filter(p => p.status === "alive");
    const swapVerb = window.i18n ? window.i18n('game.actions.swap') : "Échanger";
    controls.appendChild(makeChoiceGrid(alive.map(p => p.playerId), swapVerb, (id) => socket.emit("phaseAction", { targetId: id })));
    const chameleonHint = window.i18n ? window.i18n('game.hints.chameleonHint') : `${tRole('chameleon')} : Nuit 1 uniquement. Un seul usage dans toute la partie.`;
    controls.appendChild(makeHint(chameleonHint));
  }

  if (state.phase === "NIGHT_AI_AGENT") {
    const alive = state.players.filter(p => p.status === "alive" && p.playerId !== state.you?.playerId);
    const sel = document.createElement("select");
    sel.style.width = "100%";
    const choosePlayerText = window.i18n ? window.i18n('game.ui.choosePlayerToLink') : "Choisir le joueur à lier avec toi";
    sel.appendChild(new Option(choosePlayerText, ""));
    for (const p of alive) sel.appendChild(new Option(p.name, p.playerId));

    const btnLink = document.createElement("button");
    btnLink.className = "btn btn-primary";
    btnLink.style.marginTop = "10px";
    const linkText = window.i18n ? window.i18n('game.buttons.link') : "Lier";
    btnLink.textContent = "🔗 " + linkText;
    btnLink.onclick = () => {
      const chooseError = window.i18n ? window.i18n('game.errors.choosePlayerToLink') : "Choisis un joueur à lier.";
      if (!sel.value) return setError(chooseError);
      btnLink.classList.add('selected');
      lockControlsNow($("controls"));
      let responded = false;
      const t = setTimeout(() => {
        if (responded) return;
        unlockControlsNow($("controls"));
        setError("Action non prise en compte (connexion instable?). Réessaie.");
      }, 1500);
      socket.emit("phaseAction", { targetId: sel.value }, (r) => {
        responded = true;
        clearTimeout(t);
        if (!r || r.ok === false) {
          unlockControlsNow($("controls"));
          setError(r?.error || "Erreur");
        }
      });
    };

    const btnSkip = document.createElement("button");
    btnSkip.className = "btn btn-secondary";
    btnSkip.style.marginTop = "10px";
    const dontLinkText = window.i18n ? window.i18n('game.buttons.dontLink') : "Ne pas lier (optionnel)";
    btnSkip.textContent = "⏭️ " + dontLinkText;
    btnSkip.onclick = () => {
      btnSkip.classList.add('selected');
      lockControlsNow($("controls"));
      let responded = false;
      const t = setTimeout(() => {
        if (responded) return;
        unlockControlsNow($("controls"));
        setError("Action non prise en compte (connexion instable?). Réessaie.");
      }, 1500);
      socket.emit("phaseAction", { skip: true }, (r) => {
        responded = true;
        clearTimeout(t);
        if (!r || r.ok === false) {
          unlockControlsNow($("controls"));
          setError(r?.error || "Erreur");
        }
      });
    };

    controls.appendChild(sel);
    controls.appendChild(btnLink);
    controls.appendChild(btnSkip);
    const aiAgentHint = window.i18n ? window.i18n('game.hints.aiAgentHint') : `Nuit 1 uniquement. La liaison est entre toi (${tRole('ai_agent')}) et le joueur choisi.`;
    controls.appendChild(makeHint(aiAgentHint));
  }

  // NIGHT_AI_EXCHANGE: Phase privée où l'Agent IA et son partenaire lié doivent valider
  if (state.phase === "NIGHT_AI_EXCHANGE") {
    const iaId = state.phaseData?.iaId;
    const partnerId = state.phaseData?.partnerId;
    const isParticipant = (meId === iaId || meId === partnerId);
    
    if (isParticipant) {
      const btn = document.createElement("button");
      btn.className = "btn btn-primary btn-validate";
      
      // D6: Vérifier si déjà validé
      const pending = state.ack?.pending || [];
      const alreadyValidated = meId && !pending.includes(meId);
      
      const validatedText = window.i18n ? window.i18n('game.buttons.validated') : "Validé";
      const validateExchangeText = window.i18n ? window.i18n('game.buttons.validateExchange') : "Valider l'échange";
      
      if (alreadyValidated) {
        btn.innerHTML = "☑ " + validatedText + " 🤖";
        btn.classList.add('validated');
        btn.disabled = true;
      } else {
        btn.innerHTML = "☐ " + validateExchangeText + " 🤖";
        btn.onclick = () => {
          btn.classList.add('validated');
          btn.innerHTML = "☑ " + validatedText + " 🤖";
          btn.disabled = true;
          lockControlsNow($('controls'));
          socket.emit("phaseAck");
        };
      }
      controls.appendChild(btn);
      const hintText = window.i18n ? window.i18n('game.phaseDesc.nightAiExchange') : `Échange privé entre ${tRole('ai_agent')} et son partenaire lié. Les deux doivent valider pour continuer.`;
      controls.appendChild(makeHint(hintText));
    } else {
      const exchangeInProgressText = window.i18n ? window.i18n('game.ui.aiExchangeInProgress') : `🤖 Échange ${tRole('ai_agent')} en cours…`;
      controls.appendChild(makeHint(exchangeInProgressText));
    }
  }

  if (state.phase === "NIGHT_RADAR") {
    if (state.phaseData?.selectionDone) {
      // V24: Afficher le résultat avec traduction du rôle
      const radarResult = (state.privateLines || []).find(x => x.type === "radar_result") || 
                          (state.privateLines || []).find(x => /radar/i.test(x.text));
      
      if (radarResult) {
        const box = document.createElement("div");
        box.style.marginTop = "10px";
        box.style.padding = "12px";
        box.style.borderRadius = "12px";
        box.style.border = "1px solid rgba(0,255,255,0.25)";
        box.style.background = "rgba(0,0,0,0.25)";
        const radarLabel = window.i18n ? window.i18n('game.ui.radar') : "Radar";
        
        // V24: Utiliser roleKey si disponible pour traduire le rôle
        let displayText;
        if (radarResult.roleKey && radarResult.targetName) {
          const translatedRole = tRole(radarResult.roleKey) || radarResult.roleKey;
          displayText = `🔍 ${radarLabel}: ${radarResult.targetName} = ${translatedRole}`;
        } else {
          displayText = radarResult.text || "";
        }
        
        box.innerHTML = `<div style="font-weight:900; margin-bottom:6px;">🔎 ${radarLabel}</div>` +
          `<div style="opacity:.95; font-weight:800;">${escapeHtml(displayText)}</div>`;
        controls.appendChild(box);
      }
      const readResultHint = window.i18n ? window.i18n('game.hints.readResultThenValidate') : "Lis le résultat puis valide pour continuer.";
      controls.appendChild(makeHint(readResultHint));
    } else {
      const alive = state.players.filter(p => p.status === "alive" && p.playerId !== state.you?.playerId);
      const inspectVerb = window.i18n ? window.i18n('game.actions.inspect') : "Inspecter";
      controls.appendChild(makeChoiceGrid(alive.map(p => p.playerId), inspectVerb, (id) => socket.emit("phaseAction", { targetId: id }, (r) => { if (r?.ok === false) setError(r.error || "Erreur"); })));
      const radarHint = window.i18n ? window.i18n('game.hints.radarHint') : "Choisis un joueur à inspecter. Ensuite, lis le résultat puis valide.";
      controls.appendChild(makeHint(radarHint));
    }
  }

  if (state.phase === "NIGHT_SABOTEURS") {
    // Show current team votes for coordination (saboteurs only).
    const teamVotes = state.phaseData?.teamVotes || [];
    if (teamVotes.length) {
      const box = document.createElement("div");
      box.style.marginTop = "10px";
      box.style.padding = "10px";
      box.style.borderRadius = "12px";
      box.style.border = "1px solid rgba(0,255,255,0.25)";
      box.style.background = "rgba(0,0,0,0.25)";
      box.innerHTML = `<div style="font-weight:900; margin-bottom:6px;">🗳️ Votes des ${t('saboteurs').toLowerCase()}</div>` +
        teamVotes.map(v => `<div style="opacity:.95;">${escapeHtml(v.saboteurName)} → <b>${escapeHtml(v.targetName)}</b></div>`).join("");
      controls.appendChild(box);
    }
    const aliveTargets = state.players.filter(p =>
      p.status === "alive" &&
      p.playerId !== state.you?.playerId &&
      p.role !== "saboteur" // visible to saboteurs for teammates
    );
    const grid = makeChoiceGrid(aliveTargets.map(p => p.playerId), "Cibler", (id) =>
      socket.emit("phaseAction", { targetId: id }, (r) => { if (r?.ok === false) setError(r.error || "Erreur"); })
    , { lockOnPick: false });

    // Re-apply current selection if any (without locking)
    const cur = state.phaseData?.yourVoteId || null;
    if (cur) {
      for (const card of grid.querySelectorAll('.choice-card')) {
        if (card.dataset.playerId === cur) card.classList.add('selected');
      }
    }
    controls.appendChild(grid);
    const saboteursHint = window.i18n ? window.i18n('game.hints.saboteursHint') : `Vote UNANIME entre ${t('saboteurs').toLowerCase()}. Impossible de viser un ${tRole('saboteur').toLowerCase()} (ni toi-même).`;
    controls.appendChild(makeHint(saboteursHint));
  }

  if (state.phase === "NIGHT_DOCTOR") {
    const alive = state.players.filter(p => p.status === "alive" && p.playerId !== state.you?.playerId);
    const lifeUsed = !!state.phaseData?.lifeUsed;
    const deathUsed = !!state.phaseData?.deathUsed;
    const sabName = state.phaseData?.saboteurTargetName || null;

    const section = document.createElement("div");
    section.style.marginTop = "8px";

    const title = document.createElement("div");
    title.style.fontWeight = "900";
    title.style.marginBottom = "8px";
    title.textContent = "Action du docteur :";
    section.appendChild(title);

    // Save (automatic target)
    const btnSave = document.createElement("button");
    btnSave.className = "btn btn-primary";
    btnSave.disabled = lifeUsed || !sabName;
    btnSave.textContent = lifeUsed ? "💚 Potion de vie (déjà utilisée)" : (sabName ? `💚 Sauver la cible attaquée : ${sabName}` : "💚 Sauver (aucune cible)");
    btnSave.onclick = () => {
      btnSave.classList.add('selected');
      lockControlsNow($("controls"));
      socket.emit("phaseAction", { action: "save" }, (r) => { if (r?.ok === false) setError(r.error || "Erreur"); });
    };

    // Kill (choose target)
    const selKill = document.createElement("select");
    selKill.style.width = "100%";
    selKill.style.marginTop = "10px";
    selKill.appendChild(new Option("Choisir une cible à tuer (potion de mort)", ""));
    for (const p of alive) selKill.appendChild(new Option(p.name, p.playerId));

    const btnKill = document.createElement("button");
    btnKill.className = "btn btn-primary";
    btnKill.style.marginTop = "10px";
    btnKill.disabled = deathUsed;
    btnKill.textContent = deathUsed ? "💀 Potion de mort (déjà utilisée)" : "💀 Tuer la cible sélectionnée";
    btnKill.onclick = () => {
      if (deathUsed) return;
      if (!selKill.value) return setError("Choisis une cible à tuer.");
      btnKill.classList.add('selected');
      lockControlsNow($("controls"));
      socket.emit("phaseAction", { action: "kill", targetId: selKill.value }, (r) => { if (r?.ok === false) setError(r.error || "Erreur"); });
    };

    const btnNone = document.createElement("button");
    btnNone.className = "btn btn-secondary";
    btnNone.style.marginTop = "10px";
    btnNone.textContent = "🤷 Ne rien faire";
    btnNone.onclick = () => {
      btnNone.classList.add('selected');
      lockControlsNow($("controls"));
      socket.emit("phaseAction", { action: "none" });
    };

    section.appendChild(btnSave);
    section.appendChild(selKill);
    section.appendChild(btnKill);
    section.appendChild(btnNone);

    controls.appendChild(section);
    const doctorHintText = window.i18n ? window.i18n('game.hints.doctorHint') : "La potion de vie protège automatiquement la cible des saboteurs (s'il y en a une).";
    controls.appendChild(makeHint(doctorHintText));
  }

  if (state.phase === "DAY_CAPTAIN_TRANSFER") {
    const alive = state.players.filter(p => p.status === "alive");
    controls.appendChild(makeChoiceGrid(alive.map(p => p.playerId), "Transmettre", (id) => socket.emit("phaseAction", { chosenId: id })));
    // V23: Traduire le hint
    const transferHintTemplate = window.i18n ? window.i18n('game.hints.captainTransferHint') : "Le {captain} mort choisit sans connaître le rôle du joueur choisi.";
    const transferHint = transferHintTemplate.replace('{captain}', t('captain').toLowerCase());
    controls.appendChild(makeHint(transferHint));
  }

  if (state.phase === "DAY_VOTE") {
    const alive = state.players.filter(p => p.status === "alive");
    const grid = makeChoiceGrid(alive.map(p => p.playerId), "Voter", (id) => socket.emit("phaseAction", { vote: id }), { lockOnPick: false });
    // D6: Réappliquer la sélection si le joueur a déjà voté
    const cur = state.phaseData?.yourVoteId || null;
    if (cur) {
      for (const card of grid.querySelectorAll('.choice-card')) {
        if (card.dataset.playerId === cur) {
          card.classList.add('selected');
          card.classList.add('locked');
        }
      }
    }
    controls.appendChild(grid);
  }

  if (state.phase === "DAY_TIEBREAK") {
    const opts = state.phaseData?.options || [];
    const grid = makeChoiceGrid(opts, "Départager", (id) => socket.emit("phaseAction", { pick: id }), { lockOnPick: false });
    // D6: Réappliquer la sélection
    const cur = state.phaseData?.yourVoteId || null;
    if (cur) {
      for (const card of grid.querySelectorAll('.choice-card')) {
        if (card.dataset.playerId === cur) {
          card.classList.add('selected');
          card.classList.add('locked');
        }
      }
    }
    controls.appendChild(grid);
    // V23: Traduire le hint
    const tiebreakerHintTemplate = window.i18n ? window.i18n('game.hints.tiebreakerHint') : "En cas d'égalité, le {captain} tranche avant toute conséquence.";
    const tiebreakerHint = tiebreakerHintTemplate.replace('{captain}', t('captain').toLowerCase());
    controls.appendChild(makeHint(tiebreakerHint));
  }

  if (state.phase === "REVENGE") {
    const alive = state.players.filter(p => p.status === "alive");
    const grid = makeChoiceGrid(alive.map(p => p.playerId), "Tirer", (id) => socket.emit("phaseAction", { targetId: id }), { lockOnPick: false });
    // D6: Réappliquer la sélection
    const cur = state.phaseData?.yourVoteId || null;
    if (cur) {
      for (const card of grid.querySelectorAll('.choice-card')) {
        if (card.dataset.playerId === cur) {
          card.classList.add('selected');
          card.classList.add('locked');
        }
      }
    }
    controls.appendChild(grid);
  }
}

function renderEnd() {
  // D11: Tracker la phase pour détecter le retour au lobby
  window._lastRenderedPhase = state.phase;
  
  const winner = state.phaseData?.winner;
  const endBg = $("endBackdrop");
  if (endBg) {
    let img = null;
    if (state.phase === "GAME_ABORTED") img = getThemeImagePath("cockpit.webp");
    else if (winner === "SABOTEURS") img = getThemeImagePath("image-fin-stats-explosion2.webp");
    else if (winner === "ASTRONAUTES") img = getThemeImagePath("image-fin-stats-station2.webp");
    else if (winner === "AMOUREUX") img = getThemeImagePath("image-fin-stats-station2.webp");
    endBg.style.backgroundImage = img ? `url('${img}')` : "none";
  }
  const title = $("winnerTitle");
  if (state.phase === "GAME_ABORTED") {
    title.textContent = window.i18n ? window.i18n('game.endGame.gameAborted') : "Partie interrompue — pas assez de joueurs";
    $("endSummary").innerHTML = `<div style="color: var(--neon-orange); font-weight:800;">${escapeHtml(state.phaseData?.reason || "")}</div>`;
  } else {
    const victoryOf = window.i18n ? window.i18n('game.endGame.victoryOf') : "⚔️ VICTOIRE DES";
    const association = window.i18n ? window.i18n('game.endGame.associationOfCriminals') : "🤝 ASSOCIATION DE MALFAITEURS";
    const statsPersisted = window.i18n ? window.i18n('game.endGame.statsPersistedByName') : "Stats persistées par NOM (serveur).";
    title.textContent = winner === "SABOTEURS" ? `${victoryOf} ${t('saboteurs').toUpperCase()}` : (winner === "AMOUREUX" ? association : `${victoryOf} ${t('astronauts').toUpperCase()}`);
    $("endSummary").innerHTML = `<div style="opacity:.9;">${statsPersisted}</div>`;
  }


  const rep = state.phaseData?.report;
  if (rep) {
    // V23: Helper pour traduire les sources d'élimination
    const translateSource = (source) => {
      if (!source) return "?";
      const key = source.toLowerCase();
      if (window.i18n) {
        const translated = window.i18n(`game.deathSources.${key}`);
        if (translated !== `game.deathSources.${key}`) return translated;
      }
      return source;
    };
    
    // V23: Reverse lookup pour traduire roleLabel français vers la langue cible
    const translateRoleLabel = (roleLabel) => {
      if (!roleLabel) return '';
      // Mapping des noms français vers les clés
      const frenchToKey = {
        'Astronaute': 'crewmate', 'Saboteur': 'saboteur', 'Capitaine': 'captain',
        'Officier Radar': 'radar', 'Voyante': 'radar', 'Docteur': 'doctor', 'Sorcière': 'doctor',
        'Chef de sécurité': 'security', 'Chasseur': 'security',
        'Caméléon': 'chameleon', 'Voleur': 'chameleon',
        'Agent IA': 'ai_agent', 'Amoureux': 'ai_agent', "L'Amoureux": 'ai_agent',
        // Thème Loup-Garou
        'Villageois': 'crewmate', 'Loup-Garou': 'saboteur', 'Lycanthrope': 'saboteur',
        'Maire': 'captain', 'Cupidon': 'ai_agent',
        // Thème Wizard
        'Étudiant': 'crewmate', 'Mage Noir': 'saboteur', 'Directeur': 'captain',
        'Professeur de Divination': 'radar', 'Infirmière': 'doctor',
        'Auror': 'security', 'Métamorphe': 'chameleon', 'Elfe de Maison': 'ai_agent',
        // Thème Mythic
        'Mortel': 'crewmate', 'Titan': 'saboteur', 'Zeus': 'captain',
        'Oracle': 'radar', 'Asclépios': 'doctor', 'Némésis': 'security',
        'Protée': 'chameleon', 'Éros': 'ai_agent'
      };
      const key = frenchToKey[roleLabel];
      if (key) {
        const translated = tRole(key);
        if (translated && translated !== key) return translated;
      }
      return roleLabel; // Fallback au label original
    };
    
    // V25: Ordre des éjections
    const deaths = (rep.deathOrder || []).map((d, i) => {
      // V23: Traduire le rôle (essayer d.role d'abord, sinon reverse lookup sur roleLabel)
      const roleKey = d.role || '';
      let translatedRole;
      if (roleKey) {
        translatedRole = tRole(roleKey) || d.roleLabel || roleKey;
      } else {
        translatedRole = translateRoleLabel(d.roleLabel);
      }
      const rl = translatedRole ? ` (${translatedRole})` : "";
      // V23: Traduire la source
      const translatedSource = translateSource(d.source);
      return `${i + 1}. ${d.name}${rl} — ${translatedSource}`;
    }).join("<br>");
    
    // V24: Awards HTML avec traduction
    const translateAward = (a) => {
      let title = a.title;
      let text = a.text;
      
      // V24: Traduire le titre
      if (window.i18n && a.titleKey) {
        const fullKey = `game.${a.titleKey}`;
        const translatedTitle = window.i18n(fullKey);
        if (translatedTitle && translatedTitle !== fullKey && !translatedTitle.startsWith('game.')) {
          title = translatedTitle;
        }
      }
      
      // V24: Traduire le texte
      if (window.i18n && a.textKey) {
        const fullKey = `game.${a.textKey}`;
        let translatedText = window.i18n(fullKey);
        if (translatedText && translatedText !== fullKey && !translatedText.startsWith('game.')) {
          // Remplacer les placeholders avec les données
          if (a.data) {
            for (const [key, value] of Object.entries(a.data)) {
              translatedText = translatedText.replace(new RegExp(`\\{${key}\\}`, 'g'), value || '');
            }
          }
          text = translatedText;
        }
      }
      
      return `<div style="margin:6px 0;"><b>${escapeHtml(title)}</b> : ${escapeHtml(text)}</div>`;
    };
    
    const awardsHtml = (rep.awards || []).map(a => translateAward(a)).join("");
    
    // V25: Durée de partie formatée
    const formatDuration = (ms) => {
      if (!ms || ms <= 0) return "—";
      const totalSec = Math.floor(ms / 1000);
      const min = Math.floor(totalSec / 60);
      const sec = totalSec % 60;
      return `${min}m ${sec}s`;
    };
    const gameDurationHtml = formatDuration(rep.gameDuration);
    
    // V25: Pie Chart data
    const deathBySource = rep.deathBySource || { vote: 0, saboteurs: 0, doctor: 0, revenge: 0, linked: 0, other: 0 };
    const totalDeaths = Object.values(deathBySource).reduce((a, b) => a + b, 0);
    
    // V25: Générer le Pie Chart SVG
    const pieChartHtml = (() => {
      const noElimText = window.i18n ? window.i18n('game.endGame.noElimination') : 'Aucune élimination';
      if (totalDeaths === 0) return `<div style="opacity:0.7;">${noElimText}</div>`;
      
      // V26: Couleurs et labels mis à jour
      const colors = {
        vote: '#00ffff',
        saboteurs: '#ff4444',
        doctor: '#44ff44',
        revenge: '#ffaa00',
        linked: '#ff66ff',
        other: '#888888'
      };
      
      const labels = {
        vote: window.i18n ? window.i18n('game.endGame.vote') : 'Vote',
        saboteurs: t('saboteurs'),
        doctor: tRole('doctor') || 'Docteur',
        revenge: window.i18n ? window.i18n('game.endGame.revenge') : 'Vengeance',
        linked: window.i18n ? window.i18n('game.endGame.linked') : 'Liaison',
        other: window.i18n ? window.i18n('game.endGame.other') : 'Autre'
      };
      
      let currentAngle = 0;
      const paths = [];
      const legend = [];
      
      for (const [source, count] of Object.entries(deathBySource)) {
        if (count === 0) continue;
        
        const percentage = count / totalDeaths;
        const angle = percentage * 360;
        const startAngle = currentAngle;
        const endAngle = currentAngle + angle;
        
        const startRad = (startAngle - 90) * Math.PI / 180;
        const endRad = (endAngle - 90) * Math.PI / 180;
        const x1 = 50 + 40 * Math.cos(startRad);
        const y1 = 50 + 40 * Math.sin(startRad);
        const x2 = 50 + 40 * Math.cos(endRad);
        const y2 = 50 + 40 * Math.sin(endRad);
        const largeArc = angle > 180 ? 1 : 0;
        
        if (angle >= 360) {
          paths.push(`<circle cx="50" cy="50" r="40" fill="${colors[source]}" opacity="0.8"/>`);
        } else {
          paths.push(`<path d="M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z" fill="${colors[source]}" opacity="0.8"/>`);
        }
        
        legend.push(`<div style="display:flex; align-items:center; gap:6px; margin:4px 0;">
          <div style="width:12px; height:12px; background:${colors[source]}; border-radius:2px;"></div>
          <span>${labels[source]}: ${count} (${Math.round(percentage * 100)}%)</span>
        </div>`);
        
        currentAngle = endAngle;
      }
      
      return `
        <div style="display:flex; align-items:center; gap:20px; flex-wrap:wrap;">
          <svg width="120" height="120" viewBox="0 0 100 100">
            ${paths.join('')}
            <circle cx="50" cy="50" r="20" fill="rgba(0,0,0,0.5)"/>
            <text x="50" y="55" text-anchor="middle" fill="white" font-size="12" font-weight="bold">${totalDeaths}</text>
          </svg>
          <div style="font-size:0.9rem;">
            ${legend.join('')}
          </div>
        </div>
      `;
    })();
    
    // V22: Helper pour les traductions endGame
    const eg = (key, fallback) => window.i18n ? window.i18n(`game.endGame.${key}`) : fallback;
    
    // V25: Stats cumulées
    const statsHtml = Object.entries(rep.statsByName || {}).map(([name, s]) => {
      const player = state.players.find(p => p.name === name);
      // V31: Utiliser la fonction utilitaire pour l'avatar
      const avatarDisplay = getAvatarHtml(player, 28, 8);
      const colorStyle = player?.colorHex ? `border-left: 3px solid ${player.colorHex};` : '';
      
      // V26: Calcul du taux de première élimination
      const firstElimPct = s.gamesPlayed > 0 ? Math.round(((s.firstEliminated || 0) / s.gamesPlayed) * 100) : 0;
      
      return `<div class="player-item" style="margin:8px 0; ${colorStyle}">
        <div class="player-left">
          <div style="font-weight:900; display:flex; align-items:center;">
            ${avatarDisplay}
            ${escapeHtml(name)}
          </div>
          <div style="opacity:.9;">${eg('games', 'Parties')}: <b>${s.gamesPlayed}</b> • ${eg('wins', 'Victoires')}: <b>${s.wins}</b> • ${eg('losses', 'Défaites')}: <b>${s.losses}</b> • ${eg('winrate', 'Winrate')}: <b>${s.winRatePct}%</b></div>
          <div style="opacity:.8; font-size:0.9rem;">${eg('firstElim', '🎯 1ère élim')}: <b>${s.firstEliminated || 0}</b> ${eg('times', 'fois')} (${firstElimPct}%)</div>
        </div>
      </div>`;
    }).join("");

    // V25: Stats détaillées avec temps de partie
    const detailed = rep.detailedStatsByName || {};
    const detailedHtml = Object.entries(detailed).map(([name, s]) => {
      const player = state.players.find(p => p.name === name);
      // V31: Utiliser la fonction utilitaire pour l'avatar
      const avatarDisplay = getAvatarHtml(player, 28, 8);
      const colorStyle = player?.colorHex ? `border-left: 3px solid ${player.colorHex};` : '';
      
      const roles = Object.entries(s.roleWinRates || {}).map(([rk, pct]) => {
        const roleName = tRole(rk) || rk;
        return `<div style="opacity:.95;">• <b>${escapeHtml(roleName)}</b> : ${(s.winsByRole?.[rk]||0)}/${(s.gamesByRole?.[rk]||0)} (${pct}%)</div>`;
      }).join("");
      
      // V25: Temps de partie min/max
      const shortestHtml = s.shortestGame ? formatDuration(s.shortestGame) : "—";
      const longestHtml = s.longestGame ? formatDuration(s.longestGame) : "—";
      
      // V28: Nouvelles stats Phase 3
      const correctVotes = s.correctSaboteurVotes || 0;
      const wrongVotes = s.wrongSaboteurVotes || 0;
      const totalVotes = s.totalVotes || 0;
      const pctCorrectVotes = totalVotes > 0 ? Math.round((correctVotes / totalVotes) * 100) : 0;
      const pctWrongVotes = totalVotes > 0 ? Math.round((wrongVotes / totalVotes) * 100) : 0;
      
      const revengeKillsSab = s.revengeKillsOnSaboteurs || 0;
      const revengeKillsInn = s.revengeKillsOnInnocents || 0;
      const totalRevengeShots = s.securityRevengeShots || 0;
      const pctRevengeSab = totalRevengeShots > 0 ? Math.round((revengeKillsSab / totalRevengeShots) * 100) : 0;
      const pctRevengeInn = totalRevengeShots > 0 ? Math.round((revengeKillsInn / totalRevengeShots) * 100) : 0;
      
      const doctorKillsSab = s.doctorKillsOnSaboteurs || 0;
      const doctorKillsInn = s.doctorKillsOnInnocents || 0;
      const totalDoctorKills = s.doctorKills || 0;
      const doctorSaves = s.doctorSaves || 0;
      const doctorMissed = s.doctorMissedSaves || 0;
      const doctorNotSavedOpp = s.doctorNotSavedOpportunities || 0;
      const doctorGames = s.gamesByRole?.doctor || 0;
      const pctFataleSab = totalDoctorKills > 0 ? Math.round((doctorKillsSab / totalDoctorKills) * 100) : 0;
      const pctFataleInn = totalDoctorKills > 0 ? Math.round((doctorKillsInn / totalDoctorKills) * 100) : 0;
      const pctVieUsed = doctorGames > 0 ? Math.round((doctorSaves / doctorGames) * 100) : 0;
      const pctNotSaved = doctorNotSavedOpp > 0 ? Math.round((doctorMissed / doctorNotSavedOpp) * 100) : 0;
      
      // V28: Stats du maire
      const mayorOk = s.mayorTiebreakerOk || 0;
      const mayorKo = s.mayorTiebreakerKo || 0;
      const mayorTotal = s.mayorTiebreakerTotal || 0;
      const pctMayorOk = mayorTotal > 0 ? Math.round((mayorOk / mayorTotal) * 100) : 0;
      const pctMayorKo = mayorTotal > 0 ? Math.round((mayorKo / mayorTotal) * 100) : 0;
      
      // V28: Labels selon le thème
      const saboteursLabel = t('saboteurs') || 'Saboteurs';
      const astronautesLabel = t('astronauts') || 'Astronautes';
      const securityLabel = tRole('security') || 'Chef de sécurité';
      const doctorLabel = tRole('doctor') || 'Docteur';
      const captainLabel = tRole('captain') || 'Capitaine';
      
      return `<div class="player-item" style="margin:12px 0; padding:12px; ${colorStyle}">
        <!-- BANDEAU HAUT : Nom + Stats générales (100% largeur) -->
        <div style="margin-bottom:14px; padding-bottom:10px; border-bottom:1px solid rgba(255,255,255,0.15);">
          <div style="font-weight:900; display:flex; align-items:center; margin-bottom:6px;">
            ${avatarDisplay}
            ${escapeHtml(name)}
          </div>
          <div style="opacity:.9; font-size:0.85rem;">
            ${eg('games', 'Parties')}: <b>${s.gamesPlayed}</b> • ${eg('wins', 'Victoires')}: <b>${s.wins}</b> • ${eg('losses', 'Défaites')}: <b>${s.losses}</b> • ${eg('winrate', 'Winrate')}: <b>${s.winRatePct}%</b>
          </div>
          <div style="opacity:.9; font-size:0.85rem;">
            ⏱️ ${eg('shortest', 'Courte')}: <b>${shortestHtml}</b> • ${eg('longest', 'Longue')}: <b>${longestHtml}</b>
          </div>
        </div>
        
        <!-- 2 COLONNES avec CSS Grid + classe pour responsive mobile -->
        <div class="stats-detailed-grid" style="display:grid; grid-template-columns: 1fr 1fr; gap:24px; font-size:0.85rem;">
          
          <!-- Colonne gauche : Combat + Sécurité + Docteur -->
          <div>
            <div style="margin-bottom:12px;">
              <div style="font-weight:900; margin-bottom:4px;">${eg('combatVs', '🎯 Combat VS')} ${saboteursLabel.toLowerCase()}</div>
              <div>• ${eg('correctVotes', 'Votes corrects')}: <b>${correctVotes}/${totalVotes}</b> (${pctCorrectVotes}%)</div>
              <div>• ${eg('wrongVotes', 'Votes faux')}: <b>${wrongVotes}/${totalVotes}</b> (${pctWrongVotes}%)</div>
            </div>
            
            <div style="margin-bottom:12px;">
              <div style="font-weight:900; margin-bottom:4px;">🔫 ${securityLabel}</div>
              <div>• ${saboteursLabel} ${eg('eliminated', 'éliminés')}: <b>${revengeKillsSab}/${totalRevengeShots}</b> (${pctRevengeSab}%)</div>
              <div>• ${astronautesLabel} ${eg('eliminatedErr', 'éliminés (err)')}: <b>${revengeKillsInn}/${totalRevengeShots}</b> (${pctRevengeInn}%)</div>
            </div>
            
            <div>
              <div style="font-weight:900; margin-bottom:4px;">💊 ${doctorLabel}</div>
              <div>• ${eg('fatalPotionOk', 'Potion fatale ok')}: <b>${doctorKillsSab}/${totalDoctorKills}</b> (${pctFataleSab}%)</div>
              <div>• ${eg('fatalPotionErr', 'Potion fatale err')}: <b>${doctorKillsInn}/${totalDoctorKills}</b> (${pctFataleInn}%)</div>
              <div>• ${eg('lifePotion', 'Potion vie')}: <b>${doctorSaves}/${doctorGames}</b> (${pctVieUsed}%)</div>
              <div>• ${eg('notSaved', 'Non sauvés')}: <b>${doctorMissed}/${doctorNotSavedOpp}</b> (${pctNotSaved}%)</div>
            </div>
          </div>
          
          <!-- Colonne droite : Actions du Maire + Victoires par rôle -->
          <div>
            <div style="margin-bottom:12px;">
              <div style="font-weight:900; margin-bottom:4px;">${eg('captainAction', '👑 Action du')} ${captainLabel}</div>
              <div>• ${eg('tiebreakerOk', 'Départage OK')}: <b>${mayorOk}/${mayorTotal}</b> (${pctMayorOk}%)</div>
              <div>• ${eg('tiebreakerKo', 'Départage KO')}: <b>${mayorKo}/${mayorTotal}</b> (${pctMayorKo}%)</div>
            </div>
            
            <div>
              <div style="font-weight:900; margin-bottom:6px;">${eg('winsByRole', '📈 Victoires par rôle')}</div>
              ${roles || "<div>—</div>"}
            </div>
          </div>
          
        </div>
      </div>`;
    }).join("");

    // V25: Nouvelle structure - Éjections en premier
    $("endSummary").innerHTML += `
      <div style="margin-top:14px; display:flex; gap:10px; flex-wrap:wrap;">
        <button class="btn btn-secondary" id="tabSummaryBtn">${eg('tabSummary', 'Résumé')}</button>
        <button class="btn btn-secondary" id="tabDetailedBtn">${eg('tabDetailed', 'Stats détaillées')}</button>
      </div>

      <div id="tabSummary" style="margin-top:12px;">
        <div style="margin-bottom:14px; padding:10px; border-radius:8px; background: rgba(0,0,0,0.2); display:flex; align-items:center; gap:10px;">
          <span style="font-size:1.5rem;">⏱️</span>
          <span>${eg('gameDuration', 'Durée de la partie')}: <b>${gameDurationHtml}</b></span>
        </div>
        
        <div style="padding:12px; border-radius:12px; border:1px solid rgba(255,165,0,0.25); background: rgba(0,0,0,0.22);">
          <div style="font-weight:900; margin-bottom:8px;">${eg('eliminationOrder', '🚀 Ordre des éjections')}</div>
          <div style="opacity:.95;">${deaths || "—"}</div>
        </div>
        
        <div style="margin-top:14px; padding:12px; border-radius:12px; border:1px solid rgba(128,0,255,0.25); background: rgba(0,0,0,0.22);">
          <div style="font-weight:900; margin-bottom:8px;">${eg('eliminationDistribution', '🥧 Répartition des éliminations')}</div>
          ${pieChartHtml}
        </div>

        <div style="margin-top:14px; padding:12px; border-radius:12px; border:1px solid rgba(0,255,255,0.25); background: rgba(0,0,0,0.25);">
          <div style="font-weight:900; margin-bottom:8px;">${eg('awards', '🏆 Awards')}</div>
          ${awardsHtml || "<div>—</div>"}
        </div>

        <div style="margin-top:14px;">
          <div style="font-weight:900; margin-bottom:8px;">${eg('cumulativeStats', '📈 Stats cumulées (par NOM)')}</div>
          ${statsHtml || "<div>—</div>"}
        </div>
      </div>

      <div id="tabDetailed" style="margin-top:12px; display:none;">
        <div style="font-weight:900; margin-bottom:8px;">${eg('detailedStats', '📊 Stats détaillées (par NOM)')}</div>
        ${detailedHtml || "<div>—</div>"}
      </div>
    `;

    const tabSummaryBtn = document.getElementById("tabSummaryBtn");
    const tabDetailedBtn = document.getElementById("tabDetailedBtn");
    const tabSummary = document.getElementById("tabSummary");
    const tabDetailed = document.getElementById("tabDetailed");
    if (tabSummaryBtn && tabDetailedBtn && tabSummary && tabDetailed) {
      tabSummaryBtn.onclick = () => { tabSummary.style.display = "block"; tabDetailed.style.display = "none"; };
      tabDetailedBtn.onclick = () => { tabSummary.style.display = "none"; tabDetailed.style.display = "block"; };
    }
  }

  // ranking table (show roles)
  const table = $("rankingTable");
  const players = [...state.players].filter(p => p.status !== "left");
  players.sort((a,b) => (a.status === "alive" ? -1 : 1) - (b.status === "alive" ? -1 : 1) || a.name.localeCompare(b.name));
  
  // V22: Helper pour traductions fin de partie
  const egBadge = (key, fb) => window.i18n ? window.i18n(`game.endGame.${key}`) : fb;
  const survivorBadge = egBadge('survivor', 'SURVIVANT');
  const eliminatedBadge = egBadge('eliminatedBadge', 'ÉLIMINÉ');
  const leftBadge = egBadge('leftBadge', 'SORTI');
  const captainBadge = window.i18n ? window.i18n('game.ui.captain').toUpperCase() : 'CAPITAINE';
  
  table.innerHTML = players.map(p => {
    // V22: Traduire le rôle
    const roleKey = p.role || '';
    const role = roleKey ? (tRole(roleKey) || p.roleLabel || roleKey) : (p.roleLabel || "");
    
    return `<div class="player-item" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:nowrap;">
      <div class="player-left" style="flex:1; min-width:0; display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
        <div style="font-weight:900;">${escapeHtml(p.name)}</div>
        ${p.isCaptain ? `<span class="pill ok">${captainBadge}</span>` : ""}
        ${p.status === "alive" ? `<span class="pill ok">${survivorBadge}</span>` : (p.status === "dead" ? `<span class="pill bad">${eliminatedBadge}</span>` : `<span class="pill warn">${leftBadge}</span>`)}
      </div>
      <div style="opacity:.95; font-weight:800; text-align:right; flex-shrink:0; margin-left:10px;">${escapeHtml(role || "")}</div>
    </div>`;
  }).join("");

  $("replayBtn").onclick = () => socket.emit("replaySameRoom");
  $("newGameBtn").onclick = () => socket.emit("newGameResetStats");
}

function buildPhaseText(s) {
  const p = s.phase;
  
  // Helper pour traductions
  const tr = (key, fallback) => {
    if (typeof window.i18n === 'function') {
      const result = window.i18n(key);
      if (result !== key) return result;
    }
    return fallback;
  };
  
  // Helper pour traduire les notices du serveur
  const translateNotice = (notice) => {
    if (!notice) return "";
    if (notice.includes("Les rôles ont pu changer") || notice.includes("Revérifiez")) {
      return tr('game.phaseDesc.rolesChanged', "Les rôles ont pu changer. Revérifiez.") + " ";
    }
    return notice + " ";
  };
  
  // Helper pour traduire les textes de mort du serveur
  const translateDeathsText = (text) => {
    if (!text) return "";
    // Pattern: "Le joueur X (Role) a été éjecté."
    const pattern = /Le joueur ([^\(]+) \(([^\)]+)\) a été éjecté\./g;
    const template = tr('game.messages.playerEliminated', "Le joueur {name} ({role}) a été éliminé.");
    let result = text;
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const name = match[1].trim();
      const role = match[2].trim();
      const translated = template.replace('{name}', name).replace('{role}', role);
      result = result.replace(match[0], translated);
    }
    return result + " ";
  };
  
  if (p === "ROLE_REVEAL") return translateNotice(s.phaseData?.notice) + tr('game.phaseDesc.roleReveal', "Regarde ton rôle et valide.");
  if (p === "CAPTAIN_CANDIDACY") return tr('game.phaseDesc.captainCandidacy', `Choisis si tu te présentes au poste de ${t('captain')}.`);
  if (p === "CAPTAIN_VOTE") return tr('game.phaseDesc.captainVote', `Vote pour élire le ${t('captain').toLowerCase()}. En cas d'égalité : revote.`);
  if (p === "NIGHT_START") return tr('game.phaseDesc.nightStart', "Tout le monde ferme les yeux… puis valide pour démarrer la nuit.");
  if (p === "NIGHT_CHAMELEON") return tr('game.phaseDesc.nightChameleon', `${tRole('chameleon')} : choisis un joueur pour échanger les rôles (Nuit 1 uniquement).`);
  if (p === "NIGHT_AI_AGENT") return tr('game.phaseDesc.nightAiAgent', `${tRole('ai_agent')} : Nuit 1, choisis un joueur à lier avec TOI (liaison permanente).`);
  if (p === "NIGHT_AI_EXCHANGE") return tr('game.phaseDesc.nightAiExchange', `Échange privé entre ${tRole("ai_agent")} et son partenaire lié. Les deux doivent valider pour continuer.`);
  if (p === "NIGHT_RADAR") return tr('game.phaseDesc.nightRadar', `${tRole('radar')} : inspecte un joueur et découvre son rôle.`);
  if (p === "NIGHT_SABOTEURS") return tr('game.phaseDesc.nightSaboteurs', `${t('saboteurs')} : votez UNANIMEMENT une cible.`);
  if (p === "NIGHT_DOCTOR") return tr('game.phaseDesc.nightDoctor', `${tRole('doctor')} : potion de vie (sauve automatiquement la cible des ${t('saboteurs').toLowerCase()}) OU potion de mort (tue une cible) OU rien.`);

  if (p === "NIGHT_RESULTS") return translateDeathsText(s.phaseData?.deathsText) + tr('game.phaseDesc.nightResults', "Annonce des effets de la nuit, puis passage au jour.");
  if (p === "DAY_WAKE") return tr('game.phaseDesc.dayWake', `Réveil de la ${t('station')}. Validez pour passer à la suite.`);
  if (p === "DAY_CAPTAIN_TRANSFER") return tr('game.phaseDesc.dayCaptainTransfer', `Le ${t('captain').toLowerCase()} est mort : il transmet le ${t('captain').toLowerCase()} à un joueur vivant.`);
  if (p === "DAY_VOTE") return tr('game.phaseDesc.dayVote', "Votez pour éjecter un joueur.");
  if (p === "DAY_TIEBREAK") return tr('game.phaseDesc.dayTiebreak', `Égalité : le ${t('captain').toLowerCase()} choisit l'éjecté.`);
  if (p === "DAY_RESULTS") return translateDeathsText(s.phaseData?.deathsText) + tr('game.phaseDesc.dayResults', "Résultats du jour, puis passage à la nuit.");
  if (p === "REVENGE") return tr('game.phaseDesc.revenge', `${tRole('security')} : tu as été éjecté, tu peux tirer sur quelqu'un.`);
  if (p === "MANUAL_ROLE_PICK") return tr('game.phaseDesc.manualRolePick', "Mode manuel : chaque joueur choisit son rôle (cartes physiques), puis tout le monde valide.");
  if (p === "GAME_ABORTED") return tr('game.phaseDesc.gameAborted', "Partie interrompue.");
  return "";
}

function makeChoiceGrid(ids, verb, onPick, opts = {}) {
  const lockOnPick = opts.lockOnPick !== false;
  const grid = document.createElement("div");
  grid.className = "choice-grid";

  const playersById = new Map(state.players.map(p => [p.playerId, p]));
  for (const id of ids) {
    const p = playersById.get(id);
    if (!p) continue;
    const card = document.createElement("div");
    card.className = "choice-card";
    card.dataset.playerId = id;
    const captainText = window.i18n ? window.i18n('game.ui.captain') : "Capitaine";
    card.innerHTML = `<div style="font-weight:900; font-size:1.1rem;">${escapeHtml(p.name)}</div>
      ${p.isCaptain ? `<div style="opacity:.85; margin-top:4px;">⭐ ${captainText}</div>` : ""}`;
    card.onclick = () => {
      // Highlight selection
      for (const el of grid.querySelectorAll('.choice-card')) el.classList.remove('selected');
      card.classList.add('selected');
      // Optionally lock controls after selection
      if (lockOnPick) lockControlsNow(grid);
      onPick(id);
    };
    grid.appendChild(card);
  }
  return grid;
}

function lockControlsNow(scopeEl = null) {
  const root = scopeEl || document;
  // Disable all interactive controls within the controls panel
  const controls = $("controls") || root;
  const container = controls.contains(root) ? root : controls;
  for (const b of container.querySelectorAll('button')) {
    b.disabled = true;
  }
  for (const s of container.querySelectorAll('select, input, textarea')) {
    // do not disable the global name input on home screen
    if (s.id === 'playerName') continue;
    s.disabled = true;
  }
  for (const c of container.querySelectorAll('.choice-card')) {
    c.classList.add('locked');
  }
}

function unlockControlsNow(scopeEl = null) {
  const root = scopeEl || document;
  const controls = $("controls") || root;
  const container = controls.contains(root) ? root : controls;
  for (const b of container.querySelectorAll('button')) {
    b.disabled = false;
  }
  for (const s of container.querySelectorAll('select, input, textarea')) {
    if (s.id === 'playerName') continue;
    s.disabled = false;
  }
  for (const c of container.querySelectorAll('.choice-card')) {
    c.classList.remove('locked');
  }
}

function makeIcon(src, title, size=44) {
  const img = document.createElement("img");
  img.src = src;
  img.alt = title || "";
  img.title = title || "";
  img.style.width = `${size}px`;
  img.style.height = `${size}px`;
  img.style.objectFit = "contain";
  img.style.filter = "drop-shadow(0 0 10px rgba(0,255,255,0.5))";
  return img;
}

function makeHint(text) {
  const div = document.createElement("div");
  div.innerHTML = `<small class="hint">${escapeHtml(text)}</small>`;
  div.style.marginTop = "10px";
  return div;
}

function escapeHtml(str) {
  return String(str || "").replace(/[&<>"']/g, (m) => ({ "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;" }[m]));
}

// ---------- Audio manager ----------
class AudioManager {
  constructor() {
    this.audio = null;
    this.loopAudio = null;
    this.token = null;
    this.lastCue = null;
    this.pendingCue = null;
    this.queuedCue = null;
    this.userUnlocked = false;
    this.ttsUnlocked = false;  // V28: Track TTS unlock state pour mobile
    this.muted = sessionStorage.getItem("is_muted") === "1";

    this.updateButton();

    // Autoplay restrictions: browsers may block audio. We re-unlock on ANY user gesture,
    // and replay a pending cue as soon as we can.
    const unlockAny = () => this.unlock();
    window.addEventListener("pointerdown", unlockAny, { passive: true });
    window.addEventListener("keydown", unlockAny);
  }

  resolveAudioUrl(urlOrFilename) {
    if (!urlOrFilename) return null;
    // Si c'est déjà une URL complète, la retourner telle quelle
    if (urlOrFilename.startsWith("http") || urlOrFilename.startsWith("/sounds/")) {
      return urlOrFilename;
    }
    // Sinon, construire le chemin avec le thème actif
    return getThemeAudioPath(urlOrFilename);
  }

  _createAudio(urlOrFilename, { loop = false } = {}) {
    const url = this.resolveAudioUrl(urlOrFilename);
    if (!url) return null;
    
    const a = new Audio(url);
    a.preload = "auto";
    a.loop = !!loop;
    a.volume = 1.0;
    // Some browsers start at a non-zero position on first load; force a reset once metadata is ready.
    a.addEventListener("loadedmetadata", () => {
      try { a.currentTime = 0; } catch {}
    }, { once: true });
    return a;
  }

  async _safePlay(a, cueForPending, fallbackTtsText = null) {
    try {
      // Ensure metadata is available so resetting currentTime to 0 is reliable.
      // This prevents "starting near the end" glitches on some browsers.
      try { a.load(); } catch {}
      if (a.readyState < 1) {
        await new Promise((resolve) => {
          let done = false;
          const finish = () => {
            if (done) return;
            done = true;
            cleanup();
            resolve();
          };
          const cleanup = () => {
            a.removeEventListener("loadedmetadata", finish);
            a.removeEventListener("canplay", finish);
            clearTimeout(t);
          };
          a.addEventListener("loadedmetadata", finish);
          a.addEventListener("canplay", finish);
          const t = setTimeout(finish, 600);
        });
      }
      try { a.currentTime = 0; } catch {}
      await a.play();
      return true;
    } catch (err) {
      if (err && err.name === "NotAllowedError") {
        this.pendingCue = cueForPending;
        this.showUnlockOverlay();
        return false;
      }
      if (fallbackTtsText) this.tts(fallbackTtsText);
      return false;
    }
  }
  updateButton() {
    const btn = $("soundBtn");
    if (!btn) return;
    btn.textContent = this.muted ? "🔇" : "🔊";
    btn.title = this.muted ? "Son coupé (clic pour réactiver)" : "Son activé (clic pour couper)";
  }
  setMuted(v) {
    this.muted = !!v;
    sessionStorage.setItem("is_muted", this.muted ? "1" : "0");
    this.updateButton();
    if (this.muted) {
      this.stopAll();
    } else {
      this.unlock();
      if (this.lastCue) this.play(this.lastCue, true);
    }
  }
  toggleMuted() { this.setMuted(!this.muted); }
  unlock() {
    console.log("[audio] unlock() called, userUnlocked:", this.userUnlocked, "pendingCue:", !!this.pendingCue);
    this.userUnlocked = true;
    // Cacher l'overlay audio si visible
    const overlay = document.getElementById('audioUnlockOverlay');
    if (overlay) overlay.style.display = 'none';
    
    // V28: Déverrouiller aussi le TTS sur interaction utilisateur
    // V29-safe: Vérifier que SpeechSynthesis existe avant d'appeler
    if (!this.ttsUnlocked && typeof SpeechSynthesisUtterance !== 'undefined') {
      try {
        const emptyUtterance = new SpeechSynthesisUtterance("");
        window.speechSynthesis.speak(emptyUtterance);
        this.ttsUnlocked = true;
        console.log("[audio] TTS unlocked");
      } catch (err) {
        console.warn("[audio] TTS unlock failed:", err);
      }
    }
    
    if (!this.muted && this.pendingCue) {
      const cue = this.pendingCue;
      this.pendingCue = null;
      console.log("[audio] Playing pending cue:", cue.file);
      // do NOT clear queuedCue here; it is used to avoid cutting the lobby intro.
      this.play(cue, true);
    } else {
      console.log("[audio] No pending cue to play, muted:", this.muted);
    }
  }
  showUnlockOverlay() {
    if (this.userUnlocked) return;
    const overlay = document.getElementById('audioUnlockOverlay');
    if (overlay) {
      overlay.style.display = 'flex';
    }
  }
  stopAll() {
    try {
      if (this.audio) { this.audio.pause(); this.audio.currentTime = 0; }
      if (this.loopAudio) { this.loopAudio.pause(); this.loopAudio.currentTime = 0; }
    } catch {}
    this.audio = null;
    this.loopAudio = null;
  }

  play(cue, force=false) {
    this.lastCue = cue;
    const token = JSON.stringify([cue?.sequence || null, cue?.file || null, cue?.queueLoopFile || null, cue?.tts || null, cue?.ttsAfterSequence || null]);
    if (!force && token === this.token) return;

    // If the lobby intro is currently playing, do not cut it: queue the next cue.
    const isLobbyIntroUrl = (u) => !!u && /intro/i.test(u) && /lobby/i.test(u);
    const currentUrl = this.audio?.src || null;
    const currentIsIntro = isLobbyIntroUrl(currentUrl);
    const nextPrimary = cue?.file || null;
    const nextIsIntro = isLobbyIntroUrl(nextPrimary);
    if (!force && currentIsIntro && !nextIsIntro && this.audio && !this.audio.ended) {
      this.queuedCue = cue;
      return;
    }

    this.token = token;

    this.stopAll();
    if (!cue) return;
    if (this.muted) return;

    const loop = cue.queueLoopFile || null;
    const ttsText = cue.tts || null;

    const seq = Array.isArray(cue.sequence) ? cue.sequence.filter(Boolean) : null;
    if (seq && seq.length) {
      let i = 0;
      const playNext = () => {
        if (this.token !== token) return;
        if (i >= seq.length) {
          if (cue.ttsAfterSequence) this.tts(cue.ttsAfterSequence);
          if (loop) this.playLoop(loop);
          return;
        }
        const url = seq[i++];
        const a = this._createAudio(url);
        this.audio = a;
        this._safePlay(a, cue, ttsText).then((ok) => {
          if (!ok) return;
          a.onended = () => playNext();
        });
      };
      playNext();
      return;
    }

    const primary = cue.file || null;

    if (primary) {
      const a = this._createAudio(primary);
      this.audio = a;
      this._safePlay(a, cue, ttsText).then((ok) => {
        if (!ok) return;
        a.onended = () => {
        if (this.token !== token) return;
        if (cue.ttsAfterSequence) this.tts(cue.ttsAfterSequence);
        if (loop) this.playLoop(loop);
        if (this.queuedCue) {
          const q = this.queuedCue;
          this.queuedCue = null;
          // play queued cue right after the intro finished
          this.play(q, true);
        }
        };
      });
    } else if (ttsText) {
      this.tts(ttsText);
      if (loop) this.playLoop(loop);
    } else if (loop) {
      this.playLoop(loop);
    }
  }

  playLoop(url) {
    const token = this.token;
    if (this.muted) return;
    const a = this._createAudio(url, { loop: true });
    this.loopAudio = a;
    this._safePlay(a, this.lastCue || { queueLoopFile: url }, null);
  }
  tts(text) {
    if (!text || this.muted) return;
    // V29-safe: Skip si SpeechSynthesis non disponible (Android WebView)
    if (typeof SpeechSynthesisUtterance === 'undefined') return;
    try {
      // Important: do NOT cancel TTS in stopAll(), otherwise a fast phase change can cut announcements.
      // Instead, cancel right before speaking to avoid overlaps.
      try { window.speechSynthesis.cancel(); } catch {}
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "fr-FR";
      
      // V28: Sur mobile, s'assurer que speechSynthesis est déverrouillé
      // Certains navigateurs mobiles ont besoin d'une interaction utilisateur
      if (!this.ttsUnlocked) {
        // Tenter de jouer un son vide pour déverrouiller
        const emptyUtterance = new SpeechSynthesisUtterance("");
        window.speechSynthesis.speak(emptyUtterance);
        this.ttsUnlocked = true;
      }
      
      window.speechSynthesis.speak(u);
    } catch (err) {
      console.warn("[audio] TTS error:", err);
    }
  }
}
const audioManager = new AudioManager();

// UI mute button
const soundBtn = $("soundBtn");
if (soundBtn) soundBtn.onclick = () => audioManager.toggleMuted();

// Audio unlock overlay button
const audioUnlockBtn = $("audioUnlockBtn");
if (audioUnlockBtn) {
  audioUnlockBtn.onclick = () => {
    audioManager.unlock();
  };
}

// Home screen: user gesture "unlock" for autoplay restrictions.
// D6: Audio INTRO_LOBBY est lancé uniquement au moment de rejoindre le lobby (ligne 422)
// pour éviter double chargement et bande passante gaspillée.
(() => {
  const nameInput = $("playerName");
  if (!nameInput) return;
  const maybeUnlock = () => {
    if (!audioManager.userUnlocked) {
      audioManager.unlock();
    }
  };
  nameInput.addEventListener("input", maybeUnlock);
  nameInput.addEventListener("keydown", maybeUnlock);
})();

// ---------- Rules modal ----------
function buildRulesHtml(cfg) {
  // V33: Utiliser la version traduite si disponible
  if (typeof window.buildTranslatedRulesHtml === 'function') {
    return window.buildTranslatedRulesHtml(cfg);
  }
  
  // Fallback: version française
  const enabled = cfg?.rolesEnabled || {};
  const on = (k) => !!enabled[k];

  const roleLines = [];
  roleLines.push(`<li><b>${tRole('astronaut')}</b> — aucun pouvoir.</li>`);
  roleLines.push(`<li><b>${tRole('saboteur')}</b> — vote unanimement une cible la nuit.</li>`);
  if (on("radar")) roleLines.push(`<li><b>${tRole('radar')}</b> — inspecte un joueur et découvre son rôle.</li>`);
  if (on("doctor")) roleLines.push(`<li><b>${tRole('doctor')}</b> — 1 potion de vie (sauve la cible des ${t('saboteurs').toLowerCase()}) et 1 potion de mort (éjecte une cible) sur toute la partie.</li>`);
  if (on("chameleon")) roleLines.push(`<li><b>${tRole('chameleon')}</b> — Nuit 1 : échange son rôle avec un joueur (1 seule fois). Ensuite, tout le monde revérifie son rôle.</li>`);
  if (on("security")) roleLines.push(`<li><b>${tRole('security')}</b> — si éjecté, tire une dernière fois (vengeance).</li>`);
  if (on("ai_agent")) roleLines.push(`<li><b>${tRole('ai_agent')}</b> — Nuit 1 : lie 2 joueurs. Si l'un est éjecté, l'autre l'est aussi.</li>`);

  return `
    <div style="opacity:.95;">
      <h3 style="margin:10px 0;">Rôles</h3>
      <ul>${roleLines.join("")}</ul>

      <h3 style="margin:10px 0;">${t('captain')}</h3>
      <ul>
        <li><b>Élection obligatoire</b> au début de la ${t('mission')}.</li>
        <li>En cas d'égalité au vote du jour, le ${t('captain').toLowerCase()} <b>tranche</b> (sa voix compte double pour départager).</li>
        <li>Dès que le ${t('captain').toLowerCase()} est éjecté, il <b>transmet</b> le rôle à un survivant <b>sans connaître son rôle</b>.</li>
      </ul>

      <h3 style="margin:10px 0;">Ordre de nuit</h3>
      <ol>
        <li>${tRole('chameleon')} (Nuit 1)</li>
        <li>${tRole('ai_agent')} (Nuit 1)</li>
        <li>${tRole('radar')}</li>
        <li>${t('saboteurs')} (unanimité)</li>
        <li>${tRole('doctor')}</li>
        <li>Résolution + vengeance + liaison</li>
      </ol>

      <h3 style="margin:10px 0;">Victoire</h3>
      <ul>
        <li><b>${t('astronauts')}</b> : tous les ${t('saboteurs').toLowerCase()} sont éjectés.</li>
        <li><b>${t('saboteurs')}</b> : supériorité numérique (parité ou plus).</li>
        <li><b>Association de malfaiteurs</b> : s’il ne reste que 2 joueurs vivants, liés ensemble, et de camps différents, ils gagnent ensemble.</li>
      </ul>

      <h3 style="margin:10px 0;">Nombre de ${t('saboteurs').toLowerCase()}</h3>
      <div>Le nombre de ${t('saboteurs').toLowerCase()} est automatique :</div>
      <ul>
        <li>0–6 joueurs : <b>1</b> ${t('saboteurs').toLowerCase()}</li>
        <li>7–11 joueurs : <b>2</b> ${t('saboteurs').toLowerCase()}</li>
        <li>12+ joueurs : <b>3</b> ${t('saboteurs').toLowerCase()}</li>
      </ul>
    </div>
  `;
}

$("rulesBtn").onclick = () => {
  const cfg = state?.config || {};
  $("rulesContent").innerHTML = buildRulesHtml(cfg);
  $("rulesModal").style.display = "block";
};
$("rulesClose").onclick = () => $("rulesModal").style.display = "none";
$("rulesModal").addEventListener("click", (e) => {
  if (e.target === $("rulesModal")) $("rulesModal").style.display = "none";
});

// =========================================================
// BOUTON INSTALLATION APP (PWA)
// =========================================================
(function initInstallButton() {
  const installBtn = document.getElementById("installAppBtn");
  const installContainer = document.getElementById("installAppContainer");
  
  if (!installBtn || !installContainer) {
    console.log('[APP] Bouton installation non trouvé');
    return;
  }
  
  console.log('[APP] Initialisation du bouton installation');
  
  // Vérifier si déjà installé ou en mode standalone
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                       window.navigator.standalone === true;
  const isInstalled = localStorage.getItem('pwa_installed') === 'true';
  
  if (isStandalone || isInstalled) {
    installContainer.style.display = 'none';
    console.log('[APP] Masqué (déjà installé ou standalone)');
    return;
  }
  
  // Afficher le bouton
  installContainer.style.display = 'block';
  
  // Attacher le handler de clic DIRECTEMENT
  installBtn.onclick = function(e) {
    e.preventDefault();
    e.stopPropagation();
    console.log('[APP] Clic sur bouton installation');
    
    // Réinitialiser les flags qui pourraient bloquer
    localStorage.removeItem('pwa_prompt_dismissed');
    
    // Essayer D10PWA d'abord
    if (window.D10PWA && D10PWA.canInstall) {
      console.log('[APP] Utilisation D10PWA - installation directe');
      D10PWA.triggerInstall();
      return false;
    }
    
    // Si D10PWA a capturé le prompt mais canInstall est false, forcer l'affichage
    if (window.D10PWA && typeof D10PWA.forceShowInstallPrompt === 'function') {
      console.log('[APP] Affichage prompt D10PWA forcé');
      D10PWA.forceShowInstallPrompt();
      return false;
    }
    
    console.log('[APP] Affichage instructions installation');
    
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);
    
    let title = 'Installer l\'application';
    let steps = '';
    
    if (isIOS) {
      title = 'Installer sur iPhone/iPad';
      steps = `
        <li>Appuyez sur <b>Partager</b> ⬆️ en bas de Safari</li>
        <li>Faites défiler et appuyez sur <b>"Sur l'écran d'accueil"</b></li>
        <li>Appuyez sur <b>Ajouter</b></li>
      `;
    } else if (isAndroid) {
      title = 'Installer sur Android';
      steps = `
        <li>Appuyez sur le menu <b>⋮</b> en haut à droite</li>
        <li>Appuyez sur <b>"Installer l'application"</b></li>
        <li>Confirmez l'installation</li>
      `;
    } else {
      title = 'Installer sur PC';
      steps = `
        <li>Cliquez sur l'icône 📥 (carré avec flèche) à droite de la barre d'adresse</li>
        <li>Ou menu <b>⋮</b> → <b>"Installer Saboteur"</b></li>
        <li>Confirmez l'installation</li>
      `;
    }
    
    const html = `
      <div style="text-align:center; padding:20px;">
        <div style="font-size:3rem; margin-bottom:15px;">📲</div>
        <h3 style="color:var(--neon-cyan); margin-bottom:15px;">${title}</h3>
        <ol style="text-align:left; line-height:2; font-size:1.1rem;">${steps}</ol>
      </div>
    `;
    
    document.getElementById("rulesContent").innerHTML = html;
    document.getElementById("rulesModal").style.display = "block";
    
    return false;
  };
  
  console.log('[APP] Handler attaché avec succès');
})();

// quit

// navigation
$("joinBtn").onclick = () => { clearError(); showScreen("joinScreen"); };
$("backFromCreate").onclick = () => { clearError(); showScreen("homeScreen"); };
$("backFromJoin").onclick = () => { clearError(); showScreen("homeScreen"); };

function createRoomFlow() {
  clearError();
  const name = mustName();
  if (!name) return;
  sessionStorage.setItem(STORAGE.name, name);
  showScreen("createScreen");

  // Provide immediate feedback even before the first roomState arrives
  setNotice("Création de la mission…");

  // D9 V20: Récupérer les données de personnalisation avec le bon thème
  const customization = window.D9Avatars?.getCustomizationForServer(homeSelectedTheme) || {};
  
  // V31: Fallback direct pour avatarUrl depuis localStorage
  let avatarUrl = customization.avatarUrl;
  if (!avatarUrl) {
    try {
      const savedUser = localStorage.getItem('saboteur_user');
      if (savedUser) {
        const user = JSON.parse(savedUser);
        avatarUrl = user.currentAvatar || null;
      }
    } catch (e) {}
  }
  
  // V32: Récupérer le JWT d'authentification pour vérifier les crédits vidéo
  const authToken = localStorage.getItem('saboteur_token') || null;
  
  socket.emit("createRoom", { 
    playerId, 
    name, 
    playerToken,
    authToken,  // V32: JWT pour vérifier les crédits vidéo
    themeId: homeSelectedTheme,
    // D9: Données de personnalisation
    avatarId: customization.avatarId,
    avatarEmoji: customization.avatarEmoji,
    avatarUrl: avatarUrl,
    colorId: customization.colorId,
    colorHex: customization.colorHex,
    badgeId: customization.badgeId,
    badgeEmoji: customization.badgeEmoji,
    badgeName: customization.badgeName
  }, (res) => {
    if (!res?.ok) return setError(res?.error || "Erreur création");
    sessionStorage.setItem(STORAGE.room, res.roomCode);
    startHeartbeat();
    clearError();
    // The server will push roomState next; render() will switch to the lobby.
  });
}

// UX: the big home button creates the room directly.
$("createBtn").onclick = createRoomFlow;
$("createRoomBtn").onclick = createRoomFlow;

$("joinRoomBtn").onclick = () => {
  clearError();
  const name = mustName();
  if (!name) return;
  const roomCode = ($("joinRoomCode").value || "").trim();
  if (!/^\d{4}$/.test(roomCode)) return setError("Code mission invalide (4 chiffres).");
  sessionStorage.setItem(STORAGE.name, name);
  sessionStorage.setItem(STORAGE.room, roomCode);

  // D9 V20: Récupérer les données de personnalisation avec le thème sélectionné
  const customization = window.D9Avatars?.getCustomizationForServer(homeSelectedTheme) || {};
  console.log('[D9 V20] joinRoom customization:', customization);
  
  // V31: Fallback direct pour avatarUrl depuis localStorage
  let avatarUrl = customization.avatarUrl;
  if (!avatarUrl) {
    try {
      const savedUser = localStorage.getItem('saboteur_user');
      if (savedUser) {
        const user = JSON.parse(savedUser);
        avatarUrl = user.currentAvatar || null;
      }
    } catch (e) {}
  }
  
  // V32: Récupérer le JWT d'authentification pour vérifier les crédits vidéo
  const authToken = localStorage.getItem('saboteur_token') || null;
  
  socket.emit("joinRoom", { 
    playerId, 
    name, 
    roomCode, 
    playerToken,
    authToken,  // V32: JWT pour vérifier les crédits vidéo
    // D9: Données de personnalisation
    avatarId: customization.avatarId,
    avatarEmoji: customization.avatarEmoji,
    avatarUrl: avatarUrl,
    colorId: customization.colorId,
    colorHex: customization.colorHex,
    badgeId: customization.badgeId,
    badgeEmoji: customization.badgeEmoji,
    badgeName: customization.badgeName
  }, (res) => {
    if (!res?.ok) {
      const error = res?.error || "Erreur connexion";
      setError(error);
      
      // Si c'est un conflit de token, donner des conseils
      if (error.includes("Session déjà active")) {
        setTimeout(() => {
          setError(error + " Conseil : Fermez tous les autres onglets de ce jeu et rafraîchissez cette page.");
        }, 100);
      }
      return;
    }
    startHeartbeat();
    clearError();
  });
};


// receive state
// D5 V3.10: AUCUN SCROLL AUTOMATIQUE - Position maintenue naturellement
// On laisse le navigateur et l'utilisateur gérer le scroll
let lastScrolledPhase = null;

function noAutoScroll() {
  // Ne rien faire - pas de scroll automatique
  console.log('[No Auto Scroll] Position maintenue par l\'utilisateur');
}

socket.on("roomState", (s) => {
  // D6: Stocker phase précédente et joueurs vivants pour vibration
  const previousPhase = state?.phase;
  const previousAliveCount = (state?.players || []).filter(p => p.status === 'alive').length;
  // D11 V4: Sauvegarder l'ancien capitaine AVANT mise à jour
  const previousCaptainId = state?.players?.find(p => p.isCaptain)?.playerId;
  // D11 V4: Sauvegarder l'ancien statut des joueurs pour détecter les éjections
  const previousPlayerStatuses = new Map((state?.players || []).map(p => [p.playerId, p.status]));
  
  state = s;
  // D6: Stocker aussi dans window.lastKnownState pour video-tracks.js
  window.lastKnownState = s;
  // Exposer state globalement pour game.html
  window.state = s;
  // Mettre à jour la visibilité du sélecteur de thème
  if (typeof window.updateThemeSelectVisibility === 'function') {
    window.updateThemeSelectVisibility();
  }
  
  refreshBuildBadge();

  // If we are in lobby/game and the server thinks we have no room (rare), reset
  if (!state?.roomCode) return;

  // D6: Vibration mobile sur changements importants
  const currentPhaseNow = state.phase || '';
  const currentAliveCount = (state.players || []).filter(p => p.status === 'alive').length;
  
  function vibratePattern(pattern) {
    if (navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  }
  
  // Vibration si changement de phase
  if (previousPhase && currentPhaseNow !== previousPhase) {
    if (currentPhaseNow.includes('NIGHT')) {
      vibratePattern([100, 50, 100, 50, 100]); // Pattern nuit
    } else if (currentPhaseNow.includes('VOTE')) {
      vibratePattern([100, 50, 100]); // Pattern vote
    } else if (currentPhaseNow.includes('DAY')) {
      vibratePattern([50, 30, 50]); // Pattern jour
    }
  }
  
  // Vibration si quelqu'un a été éliminé
  if (previousAliveCount > 0 && currentAliveCount < previousAliveCount) {
    vibratePattern([150, 50, 150]); // Pattern élimination
    console.log('[D6] Player eliminated! Alive:', previousAliveCount, '->', currentAliveCount);
  }

  // audio per phase
  audioManager.play(state.audio);

  // D5 V3.11: Sauvegarder la position AVANT le render
  const scrollBeforeRender = window.pageYOffset || document.documentElement.scrollTop;

  // If we are ended, show end.
  render();
  
  // D6: Réappliquer le badge PARLE après le re-render
  requestAnimationFrame(() => {
    if (typeof window.reapplySpeakerHighlight === 'function') {
      window.reapplySpeakerHighlight();
    }
  });
  
  // D6: Synchroniser le grayscale des joueurs morts
  requestAnimationFrame(() => {
    if (typeof window.syncEliminatedPlayersGrayscale === 'function') {
      window.syncEliminatedPlayersGrayscale();
    }
  });
  
  // =========================================================
  // D7: ANIMATIONS UX
  // =========================================================
  
  // D7: Animation de révélation de rôle (flip 3D)
  if (previousPhase && previousPhase !== 'ROLE_REVEAL' && currentPhaseNow === 'ROLE_REVEAL') {
    requestAnimationFrame(() => {
      if (window.D7Animations) {
        console.log('[D7] 🎭 Triggering role reveal animation');
        D7Animations.animateRoleReveal();
      }
    });
  }
  
  // D11 V4: Animation élection capitaine - quand un joueur DEVIENT capitaine
  const newCaptain = s.players?.find(p => p.isCaptain);
  const myPlayerId = sessionStorage.getItem('is_playerId');
  
  // Si un nouveau capitaine est élu (pas de capitaine avant, ou changement de capitaine)
  // V32: Afficher l'overlay capitaine pour TOUS les joueurs (pas seulement l'élu)
  if (newCaptain && newCaptain.playerId !== previousCaptainId) {
    console.log('[D7] ⭐ New captain elected:', newCaptain.name);
    // Délai pour laisser le temps au rendu de se faire
    setTimeout(() => {
      if (window.D7Animations) {
        console.log('[D7] ⭐ Triggering captain election animation for:', newCaptain.name);
        D7Animations.animateCaptainElection(newCaptain.playerId);
      }
    }, 500);
  }
  
  // D7: Animation d'éjection (quand un joueur est éliminé)
  console.log('[D7] Ejection check - previousAlive:', previousAliveCount, 'currentAlive:', currentAliveCount);
  if (previousAliveCount > 0 && currentAliveCount < previousAliveCount) {
    // D11 V4: Trouver les joueurs qui viennent d'être éliminés en utilisant previousPlayerStatuses
    const newlyDead = s.players.filter(p => {
      if (p.status !== 'dead') return false;
      const prevStatus = previousPlayerStatuses.get(p.playerId);
      console.log('[D7] Player', p.name, 'status:', p.status, 'prevStatus:', prevStatus);
      return prevStatus && prevStatus === 'alive';
    });
    
    console.log('[D7] Newly dead players:', newlyDead.map(p => p.name));
    
    // V32: Appeler animateEjection avec tous les morts en une seule fois
    if (newlyDead.length > 0 && window.D7Animations) {
      console.log('[D7] 💀 Triggering ejection animation for:', newlyDead.map(p => p.name));
      setTimeout(() => {
        // Passer tous les IDs des joueurs morts
        const deadPlayerIds = newlyDead.map(p => p.playerId);
        D7Animations.animateEjection(deadPlayerIds);
        // Animer la mort pour chaque joueur individuellement (effet visuel sur leur carte)
        newlyDead.forEach(deadPlayer => {
          D7Animations.animateDeath(deadPlayer.playerId);
        });
      }, 500);
    }
  }
  
  // D7: Animation de victoire/défaite + D9: Enregistrement partie
  if (previousPhase && previousPhase !== 'GAME_OVER' && currentPhaseNow === 'GAME_OVER') {
    const winner = state.phaseData?.winner;
    const myPlayerId = sessionStorage.getItem('is_playerId');
    const myPlayer = state.players?.find(p => p.playerId === myPlayerId);
    
    if (winner && myPlayer) {
      const myTeam = myPlayer.role?.team || (myPlayer.role === 'saboteur' ? 'SABOTEURS' : 'ASTRONAUTES');
      const isWinner = (winner === 'SABOTEURS' && myTeam === 'SABOTEURS') ||
                       (winner === 'ASTRONAUTES' && myTeam === 'ASTRONAUTES') ||
                       (winner === 'AMOUREUX');
      
      setTimeout(() => {
        if (window.D7Animations) {
          console.log('[D7] 🏆 Triggering victory animation, isWinner:', isWinner);
          D7Animations.animateVictory(isWinner);
        }
        // D9: Enregistrer la partie jouée
        if (window.D9Avatars) {
          console.log('[D9] 📊 Recording game played, won:', isWinner);
          D9Avatars.recordGamePlayed(isWinner);
        }
      }, 500);
    }
  }
  
  // D5 V3.21: Vérifier le flag de coordination AVANT de restaurer
  requestAnimationFrame(() => {
    // V3.21 COORDINATION: Si BriefingUI gère le scroll, on ne touche pas
    if (window.__briefingUIScrollLock) {
      console.log('[Scroll Restore] ⏸️ SKIP - BriefingUI gère le scroll (flag actif)');
      return;
    }
    
    // Sinon, restaurer normalement
    window.scrollTo(0, scrollBeforeRender);
    console.log('[Scroll Restore] Position restaurée:', scrollBeforeRender);
  });
  
  // Log pour debug
  const currentPhase = state.phase;
  if (currentPhase && currentPhase !== lastScrolledPhase) {
    lastScrolledPhase = currentPhase;
    console.log('[No Auto Scroll] Phase:', currentPhase, '- Position:', scrollBeforeRender);
  }
});

socket.on("serverHello", () => {
  clearError();
  // On websocket reconnect, avoid kicking the user back to home.
  if (state?.roomCode) return;

  // Prefer silent auto-reconnect when possible.
  attemptAutoReconnect();

  // If no session is stored, show the home screen.
  const name = (sessionStorage.getItem(STORAGE.name) || "").trim();
  const roomCode = (sessionStorage.getItem(STORAGE.room) || "").trim();
  if (!name || !roomCode) showScreen("homeScreen");
});

// Initial screen: keep it simple, auto-reconnect will swap screens once roomState arrives.
showScreen("homeScreen");

// ============================================================================
// V26 - NOUVELLES FONCTIONNALITÉS
// ============================================================================

// --- GESTION DES THÈMES ---

let availableThemes = [];
let currentTheme = null;
// Thème choisi sur la page d'accueil - initialiser depuis localStorage si disponible
let homeSelectedTheme = localStorage.getItem('saboteur_theme') || "default";
// Exposer globalement pour game.html
window.homeSelectedTheme = homeSelectedTheme;
console.log('[Theme] homeSelectedTheme initialisé à:', homeSelectedTheme);

// Résout le chemin d'une image de rôle selon le thème actif
function getRoleImagePath(filename) {
  if (!filename) return "";
  if (filename.startsWith("/") || filename.startsWith("http")) return filename;
  
  const themeId = currentTheme?.id || "default";
  return `/images/${themeId}/roles/${filename}`;
}

// Résout le chemin d'une image générique selon le thème actif
function getThemeImagePath(filename) {
  if (!filename) return "";
  if (filename.startsWith("/") || filename.startsWith("http")) return filename;
  
  const themeId = currentTheme?.id || "default";
  return `/images/${themeId}/${filename}`;
}

// Résout le chemin d'un fichier audio selon le thème actif
function getThemeAudioPath(filename) {
  if (!filename) return "";
  if (filename.startsWith("/") || filename.startsWith("http")) return filename;
  
  // Utiliser le thème de la room si disponible, sinon le thème sélectionné sur l'accueil
  const themeId = state?.themeId || currentTheme?.id || homeSelectedTheme || "default";
  return `/sounds/${themeId}/${filename}`;
}

// Fonction de traduction des termes selon le thème actif
function t(key) {
  if (!currentTheme || !currentTheme.terms) {
    // Fallback: termes par défaut
    const defaults = {
      captain: "Chef de station",
      station: "station",
      crew: "équipage",
      mission: "mission",
      title: "Infiltration Spatiale",
      saboteurs: "Saboteurs",
      astronauts: "Astronautes"
    };
    return defaults[key] || key;
  }
  return currentTheme.terms[key] || key;
}

/**
 * Traduit un nom de rôle selon le thème actif ET la langue
 * Priorité: 1) Traduction multilingue du thème 2) Nom du thème 3) Défaut
 * @param {string} roleKey - La clé du rôle (saboteur, astronaut, radar, doctor, etc.)
 * @param {boolean} plural - Si true, retourne la forme plurielle si disponible
 * @returns {string} - Le nom traduit du rôle
 */
function tRole(roleKey, plural = false) {
  const themeId = currentTheme?.id || 'default';
  const lang = window.getCurrentLanguage ? window.getCurrentLanguage() : 'fr';
  
  // Debug
  if (!currentTheme) {
    console.warn("[tRole] currentTheme is null! Themes not loaded yet. Using defaults for:", roleKey);
  }
  
  // 1) Essayer d'abord la traduction multilingue par thème
  if (window.TRANSLATIONS?.themeRoles?.[themeId]?.[roleKey]) {
    const roleTranslations = window.TRANSLATIONS.themeRoles[themeId][roleKey];
    
    // Forme plurielle
    if (plural) {
      const pluralKey = lang + '_plural';
      if (roleTranslations[pluralKey]) return roleTranslations[pluralKey];
      if (roleTranslations['fr_plural']) return roleTranslations['fr_plural']; // Fallback FR pluriel
    }
    
    // Forme singulière
    if (roleTranslations[lang]) return roleTranslations[lang];
    if (roleTranslations.fr) return roleTranslations.fr; // Fallback FR
  }
  
  // 2) Fallback: utiliser le nom du thème (comportement original)
  const defaults = {
    saboteur: plural ? "Saboteurs" : "Saboteur",
    astronaut: plural ? "Astronautes" : "Astronaute",
    radar: "Officier radar",
    doctor: "Docteur bio",
    security: "Chef de sécurité",
    ai_agent: "Agent IA",
    engineer: "Ingénieur",
    chameleon: "Caméléon"
  };
  
  if (!currentTheme || !currentTheme.roles || !currentTheme.roles[roleKey]) {
    return defaults[roleKey] || roleKey;
  }
  
  const role = currentTheme.roles[roleKey];
  if (plural && role.namePlural) {
    return role.namePlural;
  }
  return role.name || roleKey;
}

// Petites explications génériques des rôles (identiques pour tous les thèmes)
function tRoleHelp(roleKey) {
  // V33: Utiliser les traductions multilingues si disponibles
  if (typeof window.i18n === 'function') {
    const key = `game.roleDescriptions.${roleKey}`;
    const translated = window.i18n(key);
    if (translated !== key) return translated;
  }
  
  // Fallback: descriptions en français
  const helps = {
    doctor: "Une potion de vie, une potion de mort.",
    security: "Vengeance si tué.",
    radar: "Peut révéler un rôle.",
    ai_agent: "Se lie à un joueur.",
    engineer: "Regarde discrètement lors des votes.",
    chameleon: "Échange son rôle avec 1 joueur."
  };
  return helps[roleKey] || "";
}

// D11: Exposer les fonctions de traduction globalement pour les autres modules
window.t = t;
window.tRole = tRole;

// Charger la liste des thèmes disponibles
console.log("[themes] Fetching themes from server...");
fetch('https://saboteurs-2.onrender.com/api/themes')
  .then(r => r.json())
  .then(data => {
    console.log("[themes] Received response:", data);
    if (data.ok && data.themes) {
      availableThemes = data.themes;
      console.log("[themes] Loaded themes:", availableThemes.map(t => t.id));
      console.log("[themes] Available themes count:", availableThemes.length);
      
      // Utiliser le thème sauvegardé dans localStorage (défini par index.html ou sélecteur)
      const savedThemeId = localStorage.getItem('saboteur_theme') || "default";
      const savedTheme = availableThemes.find(t => t.id === savedThemeId);
      const themeToApply = savedTheme || availableThemes.find(t => t.id === "default");
      
      if (themeToApply) {
        currentTheme = themeToApply;
        homeSelectedTheme = themeToApply.id;
        window.homeSelectedTheme = themeToApply.id;
        console.log("[themes] Applied saved theme:", currentTheme.id);
        console.log("[themes] Theme has roles:", Object.keys(currentTheme.roles || {}));        
        // Appliquer les styles CSS
        applyThemeStyles(themeToApply.id);
        
        // Appliquer les traductions
        applyThemeTranslations();
        
        // Rendre le sélecteur de thème sur la page d'accueil
        renderHomeThemeSelector();
      } else {
        console.error("[themes] No theme found!");
      }
    } else {
      console.error("[themes] Invalid response format:", data);
    }
  })
  .catch(e => console.error("[themes] Failed to load:", e));

// Détecte et applique automatiquement le changement de thème
/**
 * Rend le sélecteur de thème sur la page d'accueil
 */
function renderHomeThemeSelector() {
  const container = document.getElementById("homeThemeSelector");
  const descContainer = document.getElementById("homeThemeDescription");
  if (!container) return;

// Fallback si availableThemes n'est pas chargé
if (!availableThemes || availableThemes.length === 0) {
    availableThemes = [
        { id: 'default', name: '🚀 Spatial' },
        { id: 'werewolf', name: '🐺 Loups-Garous' },
        { id: 'wizard-academy', name: '🧙 Sorciers' },
        { id: 'mythic-realms', name: '⚔️ Mythique' }
    ];
}
  
  container.innerHTML = availableThemes.map(theme => {
    const isSelected = theme.id === homeSelectedTheme;
    return `<button 
      class="theme-button ${isSelected ? 'selected' : ''}" 
      data-theme-id="${theme.id}"
      style="
        padding: 10px 20px;
        border-radius: 8px;
        border: 2px solid ${isSelected ? 'var(--neon-green)' : 'rgba(255, 255, 255, 0.3)'};
        background: ${isSelected ? 'rgba(0, 255, 0, 0.2)' : 'rgba(0, 0, 0, 0.4)'};
        color: ${isSelected ? 'var(--neon-green)' : 'white'};
        font-weight: ${isSelected ? '800' : '600'};
        cursor: pointer;
        transition: all 0.3s;
        font-size: 0.9rem;
        text-transform: uppercase;
      "
      onmouseover="this.style.borderColor='var(--neon-cyan)'; this.style.transform='scale(1.05)';"
      onmouseout="this.style.borderColor='${isSelected ? 'var(--neon-green)' : 'rgba(255, 255, 255, 0.3)'}'; this.style.transform='scale(1)';"
    >${theme.name}</button>`;
  }).join("");
  
  // Mettre à jour la description
  const selected = availableThemes.find(t => t.id === homeSelectedTheme);
  if (selected && descContainer) {
    descContainer.textContent = selected.description || "";
  }
  
  // Ajouter les event listeners
  container.querySelectorAll(".theme-button").forEach(btn => {
    btn.addEventListener("click", () => {
      const themeId = btn.dataset.themeId;
      homeSelectedTheme = themeId;
      
      // Appliquer le thème visuellement
      const theme = availableThemes.find(t => t.id === themeId);
      if (theme) {
        currentTheme = theme;
        applyThemeStyles(themeId);
        applyThemeTranslations();
      }
      
      // D6: Précharger les assets du thème sélectionné
      preloadThemeAssets(themeId);
      
      // Re-render pour mettre à jour les boutons
      renderHomeThemeSelector();
      
      console.log("[home-theme] Selected theme:", themeId);
    });
  });
}

/**
 * Applique les styles CSS du thème actif (polices, couleurs, effets)
 */
function applyThemeStyles(themeId) {
  // Définir l'attribut data-theme sur l'élément racine
  document.documentElement.setAttribute('data-theme', themeId);
  console.log("[theme-styles] Applied visual theme:", themeId);
}

function checkAndApplyTheme() {
  const themeId = state?.themeId || "default";
  
  // Si le thème a changé, l'appliquer
  if (!currentTheme || currentTheme.id !== themeId) {
    const newTheme = availableThemes.find(t => t.id === themeId);
    if (newTheme) {
      currentTheme = newTheme;
      console.log("[theme] Applied theme:", themeId);
      
      // Appliquer les styles visuels du thème
      applyThemeStyles(themeId);
      
      // Appliquer les traductions sur les éléments fixes
      applyThemeTranslations();
      
      // NOTE: renderLobby() sera appelé juste après par render() si on est en phase LOBBY
      // Pas besoin de l'appeler ici pour éviter le double rendu
    }
  }
}

// Applique les traductions du thème actif sur les éléments visibles
function applyThemeTranslations() {
  // Titre principal (avec ID) - utilise traduction multilingue si disponible
  const mainTitle = document.getElementById('mainTitle');
  if (mainTitle) {
    const themeId = currentTheme?.id || 'default';
    // Essayer d'abord la traduction multilingue
    if (window.i18n) {
      const translatedTitle = window.i18n(`game.themeTitles.${themeId}`);
      if (translatedTitle && !translatedTitle.includes('themeTitles')) {
        mainTitle.textContent = translatedTitle;
      } else {
        mainTitle.textContent = t('title').toUpperCase();
      }
    } else {
      mainTitle.textContent = t('title').toUpperCase();
    }
  }
  
  // Titres des écrans - utilise traduction multilingue si disponible
  const createTitle = document.getElementById('createMissionTitle');
  if (createTitle) {
    const missionText = window.i18n ? window.i18n('game.lobby.createMission') : null;
    if (missionText && !missionText.includes('createMission')) {
      createTitle.textContent = missionText;
    } else {
      createTitle.textContent = `CRÉER UNE ${t('mission').toUpperCase()}`;
    }
  }
  
  const joinTitle = document.getElementById('joinMissionTitle');
  if (joinTitle) {
    const joinText = window.i18n ? window.i18n('game.lobby.joinMission') : null;
    if (joinText && !joinText.includes('joinMission')) {
      joinTitle.textContent = joinText;
    } else {
      joinTitle.textContent = `REJOINDRE UNE ${t('mission').toUpperCase()}`;
    }
  }
  
  // Note: Les autres traductions (rôles) sont appliquées dynamiquement dans render()
}

function renderThemeSelector(isHost) {
  const selector = $("themeSelector");
  if (!selector) return;
  
  if (!isHost || state.started) {
    selector.style.display = "none";
    return;
  }
  
  selector.style.display = "block";
  const buttonsContainer = $("themeButtons");
  const descContainer = $("themeDescription");
  
  buttonsContainer.innerHTML = "";
  
  const currentThemeId = state.themeId || "default";
  
  for (const theme of availableThemes) {
    const btn = document.createElement("button");
    btn.className = "btn";
    btn.textContent = theme.name;
    btn.style.padding = "10px 18px";
    btn.style.fontSize = "0.95rem";
    
    if (theme.id === currentThemeId) {
      btn.style.background = "var(--neon-purple, #9d4edd)";
      btn.style.color = "#fff";
      btn.style.fontWeight = "800";
      btn.style.boxShadow = "0 0 20px rgba(157,78,221,0.6)";
    } else {
      btn.style.background = "rgba(157,78,221,0.2)";
      btn.style.border = "2px solid rgba(157,78,221,0.5)";
      btn.style.color = "#ccc";
    }
    
    btn.onclick = () => {
      socket.emit("setTheme", { themeId: theme.id }, (res) => {
        if (!res?.ok) {
          setError(res?.error || "Erreur changement thème");
        }
      });
    };
    
    buttonsContainer.appendChild(btn);
  }
  
  // Afficher la description du thème actuel
  const theme = availableThemes.find(t => t.id === currentThemeId);
  if (theme) {
    descContainer.textContent = theme.description || "";
  }
}


// V9.3.1: Afficher les options vidéo pour l'hôte
function renderVideoOptions(isHost) {
  const videoOptions = $("videoOptions");
  if (!videoOptions) return;
  
  if (!isHost || state.started) {
    videoOptions.style.display = "none";
    return;
  }
  
  videoOptions.style.display = "block";
  
  const checkbox = $("disableVideoCheckbox");
  if (!checkbox) return;
  
  // Synchroniser la checkbox avec l'état du serveur
  checkbox.checked = state.videoDisabled || false;
  
  // Écouter les changements de la checkbox
  if (!checkbox.__boundVideoOption) {
    checkbox.__boundVideoOption = true;
    checkbox.addEventListener("change", () => {
      const videoDisabled = checkbox.checked;

      // Si l'état est déjà celui du serveur, ne rien faire.
      // (évite des émissions inutiles lors des re-renders)
      if (!!state.videoDisabled === !!videoDisabled) return;

      socket.emit("setVideoDisabled", { videoDisabled }, (res) => {
        if (!res?.ok) {
          setError(res?.error || "Erreur changement option vidéo");
          // Remettre l'ancienne valeur en cas d'erreur
          checkbox.checked = !videoDisabled;
        }
      });
    });
  }
}

// --- MODE HÔTE : FORCER LA SUITE (DÉSACTIVÉ) ---

let phaseTimerInterval = null;

function updateHostControls() {
  // Panneau hostControls désactivé
  const hostControls = $("hostControls");
  if (hostControls) {
    hostControls.style.display = "none";
  }
  if (phaseTimerInterval) {
    clearInterval(phaseTimerInterval);
    phaseTimerInterval = null;
  }
}

function updatePhaseTimer() {
  // Désactivé
}

function updatePendingPlayers() {
  // Désactivé
}

// Bouton forcer la suite
const forceAdvanceBtn = $("forceAdvanceBtn");
if (forceAdvanceBtn) {
  forceAdvanceBtn.onclick = () => {
    if (forceAdvanceBtn.disabled) return;
    
    if (!confirm("Forcer la suite va valider automatiquement pour les joueurs en attente. Continuer ?")) {
      return;
    }
    
    socket.emit("forceAdvance", {}, (res) => {
      if (!res?.ok) {
        setError(res?.error || "Impossible de forcer");
      }
    });
  };
}

// --- TUTORIEL EXPRESS ---

let currentTutorialScreen = 1;
const tutorialDontShowKey = "is_tutorialDontShow";

// Le tutoriel ne se lance plus automatiquement
// Il faut cliquer sur le bouton dans les règles pour le voir

function generateTutorialContent() {
  // Termes traduits selon le thème actif
  const astronauts = t('astronauts');
  const saboteurs = t('saboteurs');
  
  // Fonction helper pour les traductions (avec fallback)
  const tr = (key, fallback) => {
    if (typeof window.i18n === 'function') {
      const result = window.i18n(key);
      if (result !== key) return result;
    }
    return fallback;
  };
  
  return `
    <!-- Écran 1 -->
    <div class="tutorial-screen" data-screen="1" style="display:block;">
      <div style="text-align:center; margin-bottom: 25px;">
        <div style="font-size: 4rem; margin-bottom: 10px;">🚀</div>
        <h2 style="color: var(--neon-cyan); font-size: 1.8rem; margin: 0;">${tr('tutorial.welcome', 'Bienvenue !')}</h2>
      </div>
      <p style="font-size: 1.1rem; line-height: 1.6; color: var(--text-primary);">
        <strong>Les Saboteurs</strong> ${tr('tutorial.gameDescriptionShort', `est un jeu de déduction sociale où des <span style="color: var(--neon-red);">${saboteurs.toLowerCase()}</span> tentent d'éliminer les <span style="color: var(--neon-cyan);">${astronauts.toLowerCase()}</span> sans être découverts.`)}
      </p>
      <p style="font-size: 1.05rem; line-height: 1.6; color: var(--text-secondary);">
        ${tr('tutorial.phaseAlternationShort', `Le jeu alterne entre <strong>phases de nuit</strong> (actions secrètes) et <strong>phases de jour</strong> (discussions et votes).`)}
      </p>
    </div>

    <!-- Écran 2 -->
    <div class="tutorial-screen" data-screen="2" style="display:none;">
      <div style="text-align:center; margin-bottom: 25px;">
        <div style="font-size: 4rem; margin-bottom: 10px;">🌙</div>
        <h2 style="color: var(--neon-purple, var(--neon-cyan)); font-size: 1.8rem; margin: 0;">${tr('tutorial.nightPhase', 'Phase de nuit')}</h2>
      </div>
      <ul style="font-size: 1.05rem; line-height: 1.8; color: var(--text-primary); padding-left: 25px;">
        <li><strong style="color: var(--neon-red);">${saboteurs}</strong> : ${tr('tutorial.nightSaboteursAction', 'choisissent une victime (unanimité requise)')}</li>
        <li><strong style="color: var(--neon-cyan);">${tRole('radar')}</strong> : ${tr('tutorial.nightRadarAction', 'inspecte un joueur (saboteur ou non ?)')}</li>
        <li><strong style="color: var(--neon-green);">${tRole('doctor')}</strong> : ${tr('tutorial.nightDoctorAction', 'peut sauver OU tuer (1 vie + 1 mort max)')}</li>
        <li><strong style="color: var(--neon-orange);">${tr('tutorial.specialRolesLabel', 'Rôles spéciaux')}</strong> : ${tRole('chameleon')}, ${tRole('ai_agent')}, etc.</li>
      </ul>
    </div>

    <!-- Écran 3 -->
    <div class="tutorial-screen" data-screen="3" style="display:none;">
      <div style="text-align:center; margin-bottom: 25px;">
        <div style="font-size: 4rem; margin-bottom: 10px;">☀️</div>
        <h2 style="color: var(--neon-orange); font-size: 1.8rem; margin: 0;">${tr('tutorial.dayPhase', 'Phase de jour')}</h2>
      </div>
      <ul style="font-size: 1.05rem; line-height: 1.8; color: var(--text-primary); padding-left: 25px;">
        <li>${tr('tutorial.dayResults', 'Les résultats de la nuit sont révélés (qui est mort ?)')}</li>
        <li>${tr('tutorial.dayDiscussion', 'Tous les joueurs vivants <strong>discutent</strong> et <strong>débattent</strong>')}</li>
        <li>${tr('tutorial.dayVote', "Un <strong>vote d'éjection</strong> a lieu pour éliminer un suspect")}</li>
        <li>${tr('tutorial.dayCaptain', `Le <strong>${t('captain')}</strong> tranche en cas d'égalité`)}</li>
      </ul>
      <p style="margin-top: 15px; padding: 12px; background: rgba(255,165,0,0.15); border-left: 3px solid var(--neon-orange); border-radius: 8px; color: var(--text-secondary);">
        <strong>${tr('common.tip', 'Astuce')} :</strong> ${tr('tutorial.dayTipText', "Observez les comportements, cherchez les contradictions, et faites confiance à votre instinct !")}
      </p>
    </div>

    <!-- Écran 4 - Visioconférence -->
    <div class="tutorial-screen" data-screen="4" style="display:none;">
      <div style="text-align:center; margin-bottom: 25px;">
        <div style="font-size: 4rem; margin-bottom: 10px;">🎥</div>
        <h2 style="color: var(--neon-cyan); font-size: 1.8rem; margin: 0;">${tr('tutorial.videoConference.title', 'Visioconférence')}</h2>
      </div>
      <div style="margin-bottom: 20px;">
        <h3 style="color: var(--neon-orange); font-size: 1.2rem; margin-bottom: 10px;">📹 ${tr('tutorial.videoConference.videoControls', 'Contrôles Vidéo')}</h3>
        <ul style="font-size: 1rem; line-height: 1.7; color: var(--text-primary); padding-left: 20px;">
          <li><strong>🎤 ${tr('tutorial.videoConference.micro', 'Micro')}</strong> : ${tr('tutorial.videoConference.microDesc', 'Cliquez pour activer/désactiver votre micro')}</li>
          <li><strong>📷 ${tr('tutorial.videoConference.camera', 'Caméra')}</strong> : ${tr('tutorial.videoConference.cameraDesc', 'Cliquez pour activer/désactiver votre caméra')}</li>
          <li><strong>⬆ Max</strong> : ${tr('tutorial.videoConference.maxMode', 'Mode plein écran (briefing étendu)')}</li>
          <li><strong>⬕ Split</strong> : ${tr('tutorial.videoConference.splitMode', 'Mode 50/50 (jeu + vidéo)')}</li>
        </ul>
      </div>
      <div>
        <h3 style="color: var(--neon-purple, var(--neon-cyan)); font-size: 1.2rem; margin-bottom: 10px;">🔊 ${tr('tutorial.videoConference.autoActivation', 'Activation Automatique')}</h3>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 0.95rem;">
          <div style="padding: 10px; background: rgba(0,255,0,0.1); border-left: 3px solid var(--neon-green); border-radius: 6px;">
            <div style="color: var(--neon-green); font-weight: 700; margin-bottom: 5px;">✅ ${tr('tutorial.videoConference.microCameraOn', 'Micro + Caméra ON')}</div>
            <div style="color: var(--text-secondary);">${tr('tutorial.videoConference.onPhases', '• Jour (débat/vote)<br>• Fin de partie<br>• Révélation des rôles')}</div>
          </div>
          <div style="padding: 10px; background: rgba(128,0,128,0.1); border-left: 3px solid var(--neon-purple, var(--neon-cyan)); border-radius: 6px;">
            <div style="color: var(--neon-purple, var(--neon-cyan)); font-weight: 700; margin-bottom: 5px;">🔒 ${tr('tutorial.videoConference.certainRoles', 'Certains Rôles')}</div>
            <div style="color: var(--text-secondary);">• ${tr('tutorial.videoConference.saboteurNight', `Nuit des ${saboteurs.toLowerCase()}`)}<br>• ${tr('tutorial.videoConference.aiAgentExchange', `Échange ${tRole('ai_agent')}`)}<br>• ${tr('tutorial.videoConference.specialActions', 'Actions spéciales')}</div>
          </div>
        </div>
        <p style="margin-top: 12px; padding: 10px; background: rgba(255,165,0,0.1); border-left: 3px solid var(--neon-orange); border-radius: 6px; font-size: 0.9rem; color: var(--text-secondary);">
          💡 <strong>${tr('common.tip', 'Astuce')} :</strong> ${tr('tutorial.videoConference.tipManualControl', 'Vous pouvez désactiver votre micro/caméra manuellement à tout moment.')}
        </p>
      </div>
    </div>

    <!-- Écran 5 - Visio sur Mobile -->
    <div class="tutorial-screen" data-screen="5" style="display:none;">
      <div style="text-align:center; margin-bottom: 25px;">
        <div style="font-size: 4rem; margin-bottom: 10px;">📱</div>
        <h2 style="color: var(--neon-cyan); font-size: 1.8rem; margin: 0;">${tr('tutorial.mobileVideo.title', 'Visio sur Mobile')}</h2>
      </div>
      <div style="margin-bottom: 20px;">
        <h3 style="color: var(--neon-orange); font-size: 1.2rem; margin-bottom: 10px;">${tr('tutorial.mobileVideo.mobileActivation', '🎥 Activation sur Mobile')}</h3>
        <ul style="font-size: 1rem; line-height: 1.7; color: var(--text-primary); padding-left: 20px;">
          <li><strong>${tr('tutorial.mobileVideo.firstConnection', '1ère connexion')}</strong> : ${tr('tutorial.mobileVideo.firstConnectionDesc', "Autoriser l'accès micro/caméra dans le navigateur")}</li>
          <li><strong>${tr('tutorial.mobileVideo.videoEnabledButton', 'Bouton "📹 Visio activée"')}</strong> : ${tr('tutorial.mobileVideo.videoEnabledButtonDesc', 'En bas à gauche pour activer/désactiver')}</li>
          <li><strong>${tr('tutorial.mobileVideo.afterRefresh', 'Après un refresh')}</strong> : ${tr('tutorial.mobileVideo.afterRefreshDesc', 'Retaper sur "Activer visio" puis valider')}</li>
        </ul>
      </div>
      <div style="padding: 15px; background: rgba(0,255,255,0.1); border: 2px solid var(--neon-cyan); border-radius: 12px;">
        <div style="font-size: 1.8rem; text-align: center; margin-bottom: 10px;">📱 👆</div>
        <div style="text-align: center; color: var(--text-primary); font-size: 1rem; line-height: 1.6;">
          <strong>${tr('tutorial.mobileVideo.onPC', 'Sur PC')}</strong> : ${tr('tutorial.mobileVideo.onPCDesc', "La visio s'active automatiquement")}<br>
          <strong>${tr('tutorial.mobileVideo.onMobile', 'Sur Mobile')}</strong> : ${tr('tutorial.mobileVideo.onMobileDesc', 'Utiliser le bouton en bas à gauche')}
        </div>
      </div>
      <p style="margin-top: 12px; padding: 10px; background: rgba(255,165,0,0.1); border-left: 3px solid var(--neon-orange); border-radius: 6px; font-size: 0.9rem; color: var(--text-secondary);">
        💡 <strong>${tr('common.tip', 'Astuce')} :</strong> ${tr('tutorial.mobileVideo.tipVideoNotShowing', 'Si la vidéo ne s\'affiche pas après refresh, vérifier que le bouton "Visio activée" est bien actif (vert).')}
      </p>
    </div>

    <!-- Écran 6 - Conditions de victoire -->
    <div class="tutorial-screen" data-screen="6" style="display:none;">
      <div style="text-align:center; margin-bottom: 25px;">
        <div style="font-size: 4rem; margin-bottom: 10px;">🏆</div>
        <h2 style="color: var(--neon-green); font-size: 1.8rem; margin: 0;">${tr('tutorial.victoryConditions', 'Conditions de victoire')}</h2>
      </div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
        <div style="padding: 15px; background: rgba(0,255,255,0.1); border: 2px solid var(--neon-cyan); border-radius: 12px;">
          <div style="font-size: 2rem; margin-bottom: 8px;">👨‍🚀</div>
          <div style="color: var(--neon-cyan); font-weight: 800; margin-bottom: 5px;">${astronauts} ${tr('tutorial.win', 'gagnent')}</div>
          <div style="font-size: 0.95rem; color: var(--text-secondary);">${tr('tutorial.astronautsWinDesc', `Tous les ${saboteurs.toLowerCase()} sont éjectés`)}</div>
        </div>
        <div style="padding: 15px; background: rgba(255,7,58,0.1); border: 2px solid var(--neon-red); border-radius: 12px;">
          <div style="font-size: 2rem; margin-bottom: 8px;">⚔️</div>
          <div style="color: var(--neon-red); font-weight: 800; margin-bottom: 5px;">${saboteurs} ${tr('tutorial.win', 'gagnent')}</div>
          <div style="font-size: 0.95rem; color: var(--text-secondary);">${tr('tutorial.saboteursWinDesc', `Nombre de ${saboteurs.toLowerCase()} ≥ ${astronauts.toLowerCase()}`)}</div>
        </div>
      </div>
      <p style="text-align: center; font-size: 1.1rem; color: var(--neon-green); font-weight: 800;">
        ${tr('tutorial.readyToPlay', `Prêt à jouer ? Créez ou rejoignez une ${t('mission')} !`)} 🚀
      </p>
    </div>
  `;
}

function showTutorial() {
  // Régénérer le contenu avec les traductions actuelles
  $("tutorialContent").innerHTML = generateTutorialContent();
  
  $("tutorialModal").style.display = "block";
  currentTutorialScreen = 1;
  updateTutorialScreen();
}

function hideTutorial() {
  $("tutorialModal").style.display = "none";
  
  // Sauvegarder la préférence si cochée
  if ($("tutorialDontShow")?.checked) {
    localStorage.setItem(tutorialDontShowKey, "true");
  }
}

function updateTutorialScreen() {
  // Afficher le bon écran
  document.querySelectorAll(".tutorial-screen").forEach(screen => {
    const screenNum = parseInt(screen.dataset.screen);
    screen.style.display = screenNum === currentTutorialScreen ? "block" : "none";
  });
  
  // Mettre à jour les dots
  document.querySelectorAll(".tutorial-dot").forEach(dot => {
    const dotNum = parseInt(dot.dataset.dot);
    if (dotNum === currentTutorialScreen) {
      dot.style.background = "var(--neon-cyan)";
      dot.style.boxShadow = "0 0 10px var(--neon-cyan)";
    } else {
      dot.style.background = "rgba(0,255,255,0.3)";
      dot.style.boxShadow = "none";
    }
  });
  
  // Gérer les boutons prev/next
  const prevBtn = $("tutorialPrev");
  const nextBtn = $("tutorialNext");
  
  if (prevBtn) {
    prevBtn.style.visibility = currentTutorialScreen === 1 ? "hidden" : "visible";
  }
  
  if (nextBtn) {
    if (currentTutorialScreen === 6) {
      const startText = window.i18n ? window.i18n('common.start') : 'Commencer ! 🚀';
      nextBtn.textContent = startText;
    } else {
      const nextText = window.i18n ? window.i18n('common.next') : 'Suivant →';
      nextBtn.textContent = nextText;
    }
  }
}

// Event listeners tutoriel
$("tutorialBtn")?.addEventListener("click", showTutorial);
$("tutorialClose")?.addEventListener("click", hideTutorial);

$("tutorialPrev")?.addEventListener("click", () => {
  if (currentTutorialScreen > 1) {
    currentTutorialScreen--;
    updateTutorialScreen();
  }
});

$("tutorialNext")?.addEventListener("click", () => {
  if (currentTutorialScreen < 6) {
    currentTutorialScreen++;
    updateTutorialScreen();
  } else {
    hideTutorial();
  }
});

// Dots cliquables
document.querySelectorAll(".tutorial-dot").forEach(dot => {
  dot.addEventListener("click", () => {
    currentTutorialScreen = parseInt(dot.dataset.dot);
    updateTutorialScreen();
  });
});

// --- BADGES ---

function displayNewBadges(badges) {
  if (!badges || badges.length === 0) return;
  
  const section = $("newBadgesSection");
  const list = $("newBadgesList");
  
  if (!section || !list) return;
  
  section.style.display = "block";
  list.innerHTML = "";
  
  const badgeDefinitions = {
    saboteur_streak_3: { icon: "🔥", name: "Saboteur implacable" },
    astronaut_streak_3: { icon: "🚀", name: "Astronaute vigilant" },
    perfect_doctor: { icon: "⚕️", name: "Docteur parfait" },
    radar_master: { icon: "📡", name: "Radar implacable" },
    decisive_captain: { icon: "⭐", name: "Capitaine décisif" },
    ghost_saboteur: { icon: "👻", name: "Saboteur fantôme" },
    ai_cupid: { icon: "💕", name: "Cupidon IA" },
    security_avenger: { icon: "⚔️", name: "Vengeur implacable" },
    chameleon_master: { icon: "🦎", name: "Maître du déguisement" },
    veteran_player: { icon: "🎖️", name: "Vétéran spatial" }
  };
  
  for (const badgeId of badges) {
    const def = badgeDefinitions[badgeId];
    if (!def) continue;
    
    const card = document.createElement("div");
    card.style.cssText = `
      padding: 15px 20px;
      background: linear-gradient(135deg, rgba(157,78,221,0.3), rgba(255,165,0,0.3));
      border: 2px solid var(--neon-purple, #9d4edd);
      border-radius: 12px;
      text-align: center;
      min-width: 140px;
      box-shadow: 0 0 15px rgba(157,78,221,0.4);
      animation: badgePop 0.5s ease;
    `;
    
    card.innerHTML = `
      <div style="font-size: 2.5rem; margin-bottom: 8px;">${def.icon}</div>
      <div style="font-weight: 800; color: var(--neon-purple, #9d4edd); font-size: 1.05rem;">${def.name}</div>
    `;
    
    list.appendChild(card);
  }
}

// --- INTÉGRATION DANS RENDER ---

// Ajouter l'appel updateHostControls dans renderGame
const originalRenderGame = renderGame;
renderGame = function() {
  originalRenderGame();
  updateHostControls();
};

// Ajouter l'affichage des badges dans renderEnd
socket.on("newBadges", (data) => {
  if (data.badges && data.badges.length > 0) {
    displayNewBadges(data.badges);
  }
});

console.log("[V26] Nouvelles fonctionnalités chargées !");


// =====================================================
console.log('[VideoDock] build=D3-fix-dock-v2');

// VIDEO DOCK (prototype)
// Objectif: en phase DAY*, intégrer la visio dans l'UI (slot) sans refonte Daily.
// - Dock: positionne la fenêtre Daily au-dessus du slot (même rendu qu'un embed)
// - Undock: restauration à la position flottante (gérée par DailyVideo + localStorage si dispo)
// =====================================================

const __videoDockIsMobile = (() => {
  try {
    // Heuristique fiable : breakpoint + fallback UA
    if (window.matchMedia && window.matchMedia("(max-width: 767px)").matches) return true;
  } catch {}
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent || "");
})();


let __videoDockHandlersBound = false;
let __videoDockIsDocked = false;

function shouldDockVideo(state) {
  if (__videoDockIsMobile) return false; // IMPORTANT: sur mobile, éviter tout dock auto
  const p = String(state?.phase || "");
  if (!p) return false;
  if (state?.videoDisabled) return false;

  // Exclusions évidentes
  if (p === "LOBBY" || p === "GAME_ABORTED") return false;

  // Règle D3: dock uniquement pendant les phases où l'UI prévoit un slot "discussion".
  // IMPORTANT: ne pas se baser sur des labels FR, on utilise les clés de phase serveur.
  // Phases confirmées côté serveur:
  // - ROLE_REVEAL
  // - CAPTAIN_CANDIDACY / CAPTAIN_VOTE
  // - NIGHT_RESULTS (résultats publics)
  // - DAY_WAKE / DAY_VOTE / DAY_RESULTS
  // - GAME_OVER (optionnel: on garde flottant pour éviter d'écraser les stats)
  const DOCK_PHASES = new Set([
    "ROLE_REVEAL",
    "CAPTAIN_CANDIDACY",
    "CAPTAIN_VOTE",
    "NIGHT_RESULTS",
    "DAY_WAKE",
    "DAY_VOTE",
    "DAY_RESULTS",
  ]);

  if (DOCK_PHASES.has(p)) return true;
  if (p.startsWith("CAPTAIN_")) return true; // futur-proof
  if (p.startsWith("DAY_")) return true; // futur-proof

  // GAME_OVER: laisser flotter (évite dock qui saute quand on scrolle les stats)
  if (p === "GAME_OVER") return false;

  return false;
}

function bindVideoDockHandlersOnce() {
  if (__videoDockHandlersBound) return;
  __videoDockHandlersBound = true;

  const expandBtn = document.getElementById("videoDockExpandBtn");
  const hideBtn = document.getElementById("videoDockHideBtn");

  if (expandBtn) {
    expandBtn.onclick = () => {
      undockVideoFromSlot();
      // Ré-ouvrir la fenêtre si Daily fournit la méthode
      try { window.dailyVideo?.showWindow?.(); } catch {}
    };
  }
  if (hideBtn) {
    hideBtn.onclick = () => {
      // Masque la visio (bulle éventuelle gérée côté DailyVideo)
      try { window.dailyVideo?.hideWindow?.(); }
      catch {
        const c = document.getElementById("dailyVideoContainer");
        if (c) c.style.display = "none";
      }
      // On cache aussi le slot
      const slot = document.getElementById("videoDockSlot");
      if (slot) slot.style.display = "none";
      __videoDockIsDocked = false;
    };
  }
}

function __isDockRectVisible(rect) {
  // rect is viewport-relative
  if (!rect) return false;
  const vw = window.innerWidth || 0;
  const vh = window.innerHeight || 0;
  const minVisiblePx = 40; // seuil: on exige un morceau significatif visible
  const visibleW = Math.min(rect.right, vw) - Math.max(rect.left, 0);
  const visibleH = Math.min(rect.bottom, vh) - Math.max(rect.top, 0);
  return visibleW > minVisiblePx && visibleH > minVisiblePx;
}

function dockVideoToSlot() {
  const slot = document.getElementById("videoDockSlot");
  const body = document.getElementById("videoDockSlotBody");
  const container = document.getElementById("dailyVideoContainer");

  if (!slot || !body || !container) return;

  slot.style.display = "block";

  // Si le slot n'est plus visible (scroll), on ne dock pas.
  const rect = body.getBoundingClientRect();
  if (!__isDockRectVisible(rect)) {
    undockVideoFromSlot();
    return;
  }

  // 🔧 "Vrai" incrustation: on déplace le container Daily DANS le slot.
  // On conserve le parent original pour pouvoir le remettre en flottant.
  if (!container.dataset.__dockParentSaved) {
    container.dataset.__dockParentSaved = "1";
    container.dataset.__dockParentId = container.parentElement ? (container.parentElement.id || "") : "";
    // Sauvegarde un marqueur d'insertion
    container.dataset.__dockNextSiblingId = container.nextElementSibling ? (container.nextElementSibling.id || "") : "";
    // Sauvegarder styles utiles
    container.dataset.__dockPos = container.style.position || "";
    container.dataset.__dockLeft = container.style.left || "";
    container.dataset.__dockTop = container.style.top || "";
    container.dataset.__dockRight = container.style.right || "";
    container.dataset.__dockBottom = container.style.bottom || "";
    container.dataset.__dockWidth = container.style.width || "";
    container.dataset.__dockHeight = container.style.height || "";
    container.dataset.__dockZ = container.style.zIndex || "";
  }

  // Déplacer dans le slot
  if (container.parentElement !== body) {
    body.appendChild(container);
  }

  container.style.display = "flex";
  container.style.position = "relative";
  container.style.left = "auto";
  container.style.top = "auto";
  container.style.right = "auto";
  container.style.bottom = "auto";
  container.style.width = "100%";
  container.style.height = "100%";
  container.style.zIndex = "1";
  container.style.transform = "none";

  container.classList.add("docked-embedded");

  // Daily injecte généralement un <iframe> dans ce container.
  // En encart, on force l'iframe à prendre 100%.
  const iframe = container.querySelector('iframe');
  if (iframe) {
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = '0';
  }
  __videoDockIsDocked = true;

  // Masquer la barre interne "Visioconférence" si elle existe (évite double header).
  try {
    const titleNodes = Array.from(container.querySelectorAll("*")).filter((n) => {
      const t = (n.textContent || "").trim();
      return t === "Visioconférence" || t === "Visio";
    });
    titleNodes.forEach((n) => {
      const header = n.closest("div") || n;
      // On masque le bloc du titre si petit
      if (header && header !== container) header.style.display = "none";
    });
  } catch {}
}

function undockVideoFromSlot() {
  const container = document.getElementById("dailyVideoContainer");
  if (!container) return;

  if (container.classList.contains("docked-embedded")) {
    container.classList.remove("docked-embedded");

    // Restaurer styles
    if (container.dataset.__dockParentSaved) {
      container.style.position = container.dataset.__dockPos;
      container.style.left = container.dataset.__dockLeft;
      container.style.top = container.dataset.__dockTop;
      container.style.right = container.dataset.__dockRight;
      container.style.bottom = container.dataset.__dockBottom;
      container.style.width = container.dataset.__dockWidth;
      container.style.height = container.dataset.__dockHeight;
      container.style.zIndex = container.dataset.__dockZ;
      container.style.transform = "";

      // Remettre dans le DOM d'origine si possible
      const parentId = container.dataset.__dockParentId || "";
      const parent = parentId ? document.getElementById(parentId) : null;
      if (parent && container.parentElement !== parent) {
        const sibId = container.dataset.__dockNextSiblingId || "";
        const sib = sibId ? document.getElementById(sibId) : null;
        if (sib && sib.parentElement === parent) parent.insertBefore(container, sib);
        else parent.appendChild(container);
      }
    }
  }
  __videoDockIsDocked = false;
}

function updateVideoDockSlot(state) {
  // D4: En mode headless (par défaut), on n'utilise plus le VideoDock
  // Le mode "Salle de Briefing" gère l'affichage via video-briefing-ui.js
  if (window.dailyVideo && window.dailyVideo.headless) {
    const slot = document.getElementById("videoDockSlot");
    if (slot) slot.style.display = "none";
    return;
  }
  
  bindVideoDockHandlersOnce();

  // IMPORTANT: sur mobile, ne pas déplacer/masquer/redimensionner automatiquement l'iframe Daily.
  // Cela peut bloquer la connexion ("Connexion à la réunion...") sur iOS/Android.
  if (__videoDockIsMobile) {
    const slot = document.getElementById("videoDockSlot");
    if (slot) slot.style.display = "none";
    return;
  }

  const slot = document.getElementById("videoDockSlot");
  const container = document.getElementById("dailyVideoContainer");

  // Si pas de visio encore join => on ne montre pas le slot (prototype)
  const joined = !!(window.dailyVideo && window.dailyVideo.callFrame);
  if (!joined || !container || !slot) {
    if (slot) slot.style.display = "none";
    return;
  }

  if (shouldDockVideo(state)) {
    // Dock en phase jour (discussion)
    // Dé-dock propre si on était docké mais la page a scroll (recalcul rect)
    dockVideoToSlot();
  } else {
    // Nuit / autres : on libère l'espace
    if (__videoDockIsDocked) undockVideoFromSlot();
    // On laisse Daily gérer sa minimisation/bulle si la phase coupe les perms
    slot.style.display = "none";
  }
}

// Repositionner si resize/scroll quand docké
window.addEventListener("resize", () => {
  if (__videoDockIsDocked) {
    try { dockVideoToSlot(); } catch {}
  }
});
window.addEventListener("scroll", () => {
  if (__videoDockIsDocked) {
    try { dockVideoToSlot(); } catch {}
  }
}, { passive: true });

// ============================================================
// D6: SYSTÈME DE PRÉCHARGEMENT DES ASSETS (CACHE)
// ============================================================

// Liste des assets à précharger par thème
const THEME_ASSETS = {
  images: [
    'cockpit.webp',
    'out.webp',
    'vengeance.webp',
    'vote-jour.webp',
    'vote-nuit.webp',
    'image-fin-stats-astronautes.webp',
    'image-fin-stats-saboteurs.webp',
    'ejection-overlay.webp'
  ],
  roles: [
    'astronaute.webp',
    'saboteur.webp',
    'docteur.webp',
    'chef-securite.webp',
    'liaison-ia.webp',
    'radar.webp',
    'ingenieur.webp',
    'cameleon.webp',
    'capitaine.webp'
  ],
  sounds: [
    'INTRO_LOBBY.mp3'
  ]
};

// Cache des assets préchargés
const preloadedAssets = new Set();

/**
 * Précharge tous les assets d'un thème en arrière-plan
 * @param {string} themeId - L'identifiant du thème
 */
function preloadThemeAssets(themeId) {
  if (!themeId) return;
  
  const cacheKey = `theme_${themeId}`;
  if (preloadedAssets.has(cacheKey)) {
    console.log(`[preload] Theme ${themeId} already preloaded, skipping`);
    return;
  }
  
  console.log(`[preload] 🔄 Starting preload for theme: ${themeId}`);
  
  let loadedCount = 0;
  const totalAssets = THEME_ASSETS.images.length + THEME_ASSETS.roles.length + THEME_ASSETS.sounds.length;
  
  // Précharger les images principales
  THEME_ASSETS.images.forEach(filename => {
    const img = new Image();
    img.onload = () => {
      loadedCount++;
      if (loadedCount === totalAssets) {
        console.log(`[preload] ✅ Theme ${themeId} fully preloaded (${totalAssets} assets)`);
        preloadedAssets.add(cacheKey);
      }
    };
    img.onerror = () => {
      loadedCount++;
      // Pas d'erreur bloquante, certains thèmes n'ont pas tous les assets
    };
    img.src = `/images/${themeId}/${filename}`;
  });
  
  // Précharger les icônes de rôles
  THEME_ASSETS.roles.forEach(filename => {
    const img = new Image();
    img.onload = () => {
      loadedCount++;
      if (loadedCount === totalAssets) {
        console.log(`[preload] ✅ Theme ${themeId} fully preloaded (${totalAssets} assets)`);
        preloadedAssets.add(cacheKey);
      }
    };
    img.onerror = () => loadedCount++;
    img.src = `/images/${themeId}/roles/${filename}`;
  });
  
  // Précharger les sons (en background, sans lecture)
  THEME_ASSETS.sounds.forEach(filename => {
    const audio = new Audio();
    audio.preload = 'auto';
    audio.oncanplaythrough = () => {
      loadedCount++;
      if (loadedCount === totalAssets) {
        console.log(`[preload] ✅ Theme ${themeId} fully preloaded (${totalAssets} assets)`);
        preloadedAssets.add(cacheKey);
      }
    };
    audio.onerror = () => loadedCount++;
    audio.src = `/sounds/${themeId}/${filename}`;
  });
}

// Précharger le thème par défaut au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
  // Petit délai pour ne pas bloquer le rendu initial
  setTimeout(() => {
    preloadThemeAssets('default');
  }, 1000);
  
  // D11: Listener de visibilité pour rafraîchir le lobby quand la page redevient visible
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && state?.phase === 'LOBBY') {
      console.log('[D11] Page visible again, refreshing lobby display');
      requestAnimationFrame(() => {
        const list = document.getElementById('playersList');
        if (list) {
          // Forcer un repaint de tous les éléments player-info
          list.querySelectorAll('.player-info').forEach(info => {
            info.style.display = 'flex';
            void info.offsetHeight; // Force reflow
          });
          list.querySelectorAll('.player-left').forEach(left => {
            left.style.display = 'flex';
            void left.offsetHeight;
          });
        }
      });
    }
  });

  // V33: Recharger les règles quand la langue change
  window.addEventListener('languageChanged', () => {
    const rulesContent = document.getElementById('rulesContent');
    if (rulesContent && rulesContent.innerHTML) {
      const cfg = state?.config || {};
      rulesContent.innerHTML = buildRulesHtml(cfg);
    }
    console.log('[i18n] Language changed, rules reloaded');
  });
});

