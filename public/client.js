// ==============================
// V9.4.3 FORCE RECONNECT
// ==============================
function shouldReconnect() {
  return !!localStorage.getItem("playerId");
}

/* Infiltration Spatiale — client (vanilla) V26 */

// Socket.IO: index.html ensures the client library is loaded (local first, CDN fallback).
// If the server isn't running, we still want the UI to work and show a clear message.
const socket = io({
  transports: ["websocket", "polling"],
  timeout: 7000,
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 500,
  reconnectionDelayMax: 2500,
});

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
fetch("/api/build").then(r => r.json()).then(j => { buildInfo = j; refreshBuildBadge(); }).catch(() => {});

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

  const map = {
    LOBBY: "LOBBY",
    ROLE_REVEAL: "VÉRIFICATION DU RÔLE",
    CAPTAIN_CANDIDACY: `CANDIDATURE ${t('captain').toUpperCase()}`,
    CAPTAIN_VOTE: `VOTE ${t('captain').toUpperCase()}`,
    NIGHT_START: `NUIT ${night} — DÉBUT`,
    NIGHT_CHAMELEON: `NUIT — ${tRole('chameleon').toUpperCase()}`,
    NIGHT_AI_AGENT: `NUIT — ${tRole('ai_agent').toUpperCase()} (LIAISON)`,
    NIGHT_AI_EXCHANGE: `NUIT — ÉCHANGE ${tRole('ai_agent').toUpperCase()} (PRIVÉ)`,
    NIGHT_RADAR: `NUIT — ${tRole('radar').toUpperCase()}`,
    NIGHT_SABOTEURS: `NUIT — ${t('saboteurs').toUpperCase()} (UNANIMITÉ)`,
    NIGHT_DOCTOR: `NUIT — ${tRole('doctor').toUpperCase()}`,
    NIGHT_RESULTS: `RÉSULTATS NUIT ${night}`,
    DAY_WAKE: `JOUR ${day} — RÉVEIL`,
    DAY_CAPTAIN_TRANSFER: `JOUR ${day} — TRANSMISSION DU ${t('captain').toUpperCase()}`,
    DAY_VOTE: `JOUR ${day} — VOTE D'ÉJECTION`,
    DAY_TIEBREAK: `JOUR ${day} — DÉPARTAGE (${t('captain').toUpperCase()})`,
    DAY_RESULTS: `JOUR ${day} — RÉSULTATS`,
    REVENGE: `VENGEANCE — ${tRole('security').toUpperCase()}`,
    GAME_OVER: "FIN DE PARTIE",
    GAME_ABORTED: "PARTIE INTERROMPUE",
    MANUAL_ROLE_PICK: "CHOIX MANUEL DES RÔLES"
  };
  return map[p] || p;
}


const ROLE_INFO = {
  astronaut: {
    get title() { return tRole("astronaut"); },
    desc: () => `Aucun pouvoir spécial. Observe, débat et vote pour protéger la ${t('station')}.`
  },
  saboteur: {
    get title() { return tRole("saboteur"); },
    desc: () => `Chaque nuit, les ${t('saboteurs').toLowerCase()} votent UNANIMEMENT une cible (impossible de viser un ${t('saboteurs').toLowerCase().slice(0, -1)}).`
  },
  doctor: {
    get title() { return tRole("doctor"); },
    desc: "Une seule fois : potion de vie (sauve la cible attaquée). Une seule fois : potion de mort (tue une cible)."
  },
  security: {
    get title() { return tRole("security"); },
    desc: "Si tu meurs, tu tires une dernière fois (vengeance)."
  },
  ai_agent: {
    get title() { return tRole("ai_agent"); },
    desc: "Nuit 1 : choisis un joueur à lier avec TOI. Si l’un meurt, l’autre meurt aussi."
  },
  radar: {
    get title() { return tRole("radar"); },
    desc: "Chaque nuit, inspecte un joueur et découvre son rôle."
  },
  engineer: {
    get title() { return tRole("engineer"); },
    desc: "Peut espionner à ses risques et périls. Rappel discret en début de nuit tant qu’il est vivant."
  },
  chameleon: {
    get title() { return tRole("chameleon"); },
    desc: "Nuit 1 seulement : échange TON rôle avec un joueur. Après l’échange : revérification globale."
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
  el.innerHTML =
    `<div style="font-weight:900; margin-bottom:8px;">🚀 ÉJECTÉS</div>` +
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

  // players list - D11: Mise à jour incrémentale au lieu de tout recréer
  const list = $("playersList");
  const playersSorted = [...state.players].sort((a,b) => (b.isHost?1:0) - (a.isHost?1:0) || a.name.localeCompare(b.name));
  
  // D11: Garder une map des éléments existants
  const existingItems = new Map();
  list.querySelectorAll('.player-item').forEach(item => {
    // D11: Vérifier si l'élément est corrompu (manque player-info)
    const hasValidStructure = item.querySelector('.player-left') && 
                               item.querySelector('.player-info') &&
                               item.querySelector('.player-name');
    if (hasValidStructure) {
      existingItems.set(item.dataset.playerId, item);
    } else {
      // Élément corrompu, le supprimer pour le recréer
      console.log('[D11] Removing corrupted player item:', item.dataset.playerId);
      item.remove();
    }
  });
  
  // D11: Créer les nouveaux IDs attendus
  const expectedIds = new Set(playersSorted.map(p => p.playerId));
  
  // D11: Supprimer les joueurs qui ne sont plus dans la liste
  existingItems.forEach((item, playerId) => {
    if (!expectedIds.has(playerId)) {
      item.remove();
    }
  });
  
  // D11: Mettre à jour ou créer chaque joueur
  playersSorted.forEach((p, index) => {
    let item = existingItems.get(p.playerId);
    const isNewItem = !item;
    
    if (isNewItem) {
      // Créer un nouvel élément
      item = document.createElement("div");
      item.className = "player-item";
      item.dataset.playerId = p.playerId;
    }
    
    // D9: Appliquer la couleur de bordure personnalisée
    if (p.colorHex) {
      item.style.borderColor = p.colorHex;
      item.style.boxShadow = `0 0 8px ${p.colorHex}40`;
    } else {
      item.style.borderColor = '';
      item.style.boxShadow = '';
    }
    
    // D9: Préparer l'avatar emoji et le badge
    const avatarEmoji = p.avatarEmoji || '👤';
    const badgeDisplay = p.badgeEmoji ? `<span style="margin-left:4px; font-size:0.9rem;" title="${p.badgeName || ''}">${p.badgeEmoji}</span>` : '';
    
    // D11 V4: Toujours reconstruire le contenu pour éviter les corruptions
    // Mais préserver le slot vidéo existant si possible
    let existingVideoSlot = item.querySelector('.player-video-slot');
    let existingVideo = existingVideoSlot?.querySelector('video');
    
    // Vider l'élément
    item.innerHTML = '';
    
    // Créer la structure gauche
    const left = document.createElement("div");
    left.className = "player-left";
    left.style.cssText = "display:flex !important; flex-direction:row !important; gap:10px; align-items:center; flex:1 1 auto;";
    
    // Créer ou réutiliser le slot vidéo
    const videoSlot = document.createElement("div");
    videoSlot.className = "player-video-slot";
    videoSlot.dataset.playerId = p.playerId;
    videoSlot.setAttribute("aria-label", `Video ${p.name}`);
    videoSlot.style.cssText = "flex-shrink:0; width:64px; height:48px; min-width:64px; min-height:48px;";
    
    // Réattacher la vidéo existante si elle existe
    if (existingVideo && existingVideo.srcObject) {
      videoSlot.appendChild(existingVideo);
    }
    
    // Créer le conteneur d'info
    const playerInfo = document.createElement("div");
    playerInfo.className = "player-info";
    playerInfo.style.cssText = "display:flex !important; visibility:visible !important; flex-direction:column; gap:4px; flex:1 1 auto; min-width:80px;";
    
    // Créer le nom
    const playerName = document.createElement("div");
    playerName.className = "player-name";
    playerName.style.cssText = "font-weight:700; font-size:1rem; color:white; display:flex; align-items:center;";
    playerName.innerHTML = `<span style="font-size:1.3rem; margin-right:6px;">${avatarEmoji}</span>${escapeHtml(p.name)}${badgeDisplay}`;
    
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
    right.innerHTML = p.ready ? `<span class="pill ok">PRÊT</span>` : `<span class="pill warn">PAS PRÊT</span>`;
    
    item.appendChild(left);
    item.appendChild(right);
    
    // D11: S'assurer que l'élément est dans la bonne position
    const currentAtIndex = list.children[index];
    if (currentAtIndex !== item) {
      if (currentAtIndex) {
        list.insertBefore(item, currentAtIndex);
      } else {
        list.appendChild(item);
      }
    }
  });
  
  // D11: Forcer un repaint pour s'assurer que les éléments sont visibles (fix bug fenêtre inactive)
  requestAnimationFrame(() => {
    list.querySelectorAll('.player-info').forEach(info => {
      info.style.display = 'flex';
      info.style.visibility = 'visible';
      info.style.opacity = '1';
      // Force reflow
      void info.offsetHeight;
    });
    list.querySelectorAll('.player-left').forEach(left => {
      left.style.display = 'flex';
      void left.offsetHeight;
    });
    // D11: Appeler la fonction de réparation de video-tracks si disponible
    if (window.VideoTracksRegistry?.repairLobbyDisplay) {
      setTimeout(() => window.VideoTracksRegistry.repairLobbyDisplay(), 100);
    }
  });

  // ready button
  const me = state.players.find(p => p.playerId === state.you?.playerId);
  const ready = !!me?.ready;
  $("readyBtn").textContent = ready ? "☑ PRÊT (annuler)" : "☐ PRÊT";
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
      box.innerHTML = `<div style="opacity: 0.7; font-style: italic;">Aucun rôle spécial activé</div>`;
    }
    
    if (cfg.manualRoles) {
      box.innerHTML += `<hr><div style="margin-top: 8px; color: var(--neon-orange); opacity: 0.9;">• Mode manuel (cartes physiques)</div>`;
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
    box.appendChild(makeCheckbox("manualRoles", "Mode manuel (cartes physiques)", "", !!cfg.manualRoles, true, false));
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

  // hide legacy small icons container (kept for compatibility)
  const icons = $("roleIcons");
  if (icons) icons.innerHTML = "";

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
    link.textContent = `🔗 Lié à ${state.you.linkedName || "?"}`;
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
    
    ackLine.innerHTML = `
      <div class="validation-counter ${shouldAnimate ? 'pulse' : ''}" style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
        <span style="font-weight:600;">✅ Validations : ${ack.done}/${ack.total}</span>
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

const logEl = $("log");
if (logEl) {
  if (isHost) {
    logEl.style.display = "block";
    logEl.innerHTML = "";
    for (const l of (state.logs || [])) {
      const div = document.createElement("div");
      div.className = "log-line";
      div.textContent = l.text;
      logEl.appendChild(div);
    }
    for (const l of (state.privateLines || [])) {
      const div = document.createElement("div");
      div.className = "log-line private";
      div.textContent = l.text;
      logEl.appendChild(div);
    }
    logEl.scrollTop = logEl.scrollHeight;
  } else {
    // Joueurs : on masque le tableau/log pour réduire la charge visuelle.
    logEl.style.display = "none";
    logEl.innerHTML = "";
  }
}


  // controls
  const controls = $("controls");
  controls.innerHTML = "";


// actor-only phases: only the actor sees the action UI
const actorOnly = new Set(["NIGHT_CHAMELEON","NIGHT_AI_AGENT","NIGHT_RADAR","NIGHT_DOCTOR","NIGHT_SABOTEURS","DAY_TIEBREAK","DAY_CAPTAIN_TRANSFER","REVENGE"]);
// Fonction dynamique pour récupérer le texte d'attente traduit selon le thème
function getWaitText(phase) {
  const waitTexts = {
    NIGHT_CHAMELEON: `🦎 ${tRole('chameleon')} agit…`,
    NIGHT_AI_AGENT: `🤖 ${tRole('ai_agent')} agit…`,
    NIGHT_RADAR: `🔍 ${tRole('radar')} agit…`,
    NIGHT_DOCTOR: `🧪 ${tRole('doctor')} agit…`,
    NIGHT_SABOTEURS: `🗡️ Les ${t('saboteurs').toLowerCase()} agissent…`,
    DAY_TIEBREAK: `⭐ ${t('captain')} tranche…`,
    DAY_CAPTAIN_TRANSFER: `⭐ Transmission du ${t('captain').toLowerCase()}…`,
    REVENGE: `🔫 ${tRole('security')} se venge…`
  };
  return waitTexts[phase] || "⏳ Action en cours…";
}

// dead players have no controls (including ACK), except if they are the actor in REVENGE / captain transfer
if (meDead && !deadCanAct) {
  controls.appendChild(makeHint("💀 Vous êtes mort. Vous n’agissez plus."));
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
      b.innerHTML = "☑ VALIDÉ";
      b.classList.add('validated');
      b.disabled = true;
    } else {
      // Pas encore validé
      b.innerHTML = "☐ VALIDER";
      b.onclick = () => {
        // D6: Feedback visuel amélioré - case cochée
        b.classList.add('validated');
        b.innerHTML = "☑ VALIDÉ";
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
    yes.textContent = "🙋 Je me présente";
    yes.onclick = () => {
      yes.classList.add('selected');
      lockControlsNow($("controls"));
      socket.emit("phaseAction", { candidacy: true });
    };
    const no = document.createElement("button");
    no.className = "btn btn-secondary";
    no.textContent = "🙅 Je ne me présente pas";
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
    controls.appendChild(makeChoiceGrid(alive.map(p => p.playerId), "Échanger", (id) => socket.emit("phaseAction", { targetId: id })));
    controls.appendChild(makeHint(`${tRole('chameleon')} : Nuit 1 uniquement. Un seul usage dans toute la partie.`));
  }

  if (state.phase === "NIGHT_AI_AGENT") {
    const alive = state.players.filter(p => p.status === "alive" && p.playerId !== state.you?.playerId);
    const sel = document.createElement("select");
    sel.style.width = "100%";
    sel.appendChild(new Option("Choisir le joueur à lier avec toi", ""));
    for (const p of alive) sel.appendChild(new Option(p.name, p.playerId));

    const btnLink = document.createElement("button");
    btnLink.className = "btn btn-primary";
    btnLink.style.marginTop = "10px";
    btnLink.textContent = "🔗 Lier";
    btnLink.onclick = () => {
      if (!sel.value) return setError("Choisis un joueur à lier.");
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
    btnSkip.textContent = "⏭️ Ne pas lier (optionnel)";
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
    controls.appendChild(makeHint(`Nuit 1 uniquement. La liaison est entre toi (${tRole('ai_agent')}) et le joueur choisi.`));
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
      
      if (alreadyValidated) {
        btn.innerHTML = "☑ Validé 🤖";
        btn.classList.add('validated');
        btn.disabled = true;
      } else {
        btn.innerHTML = "☐ Valider l'échange 🤖";
        btn.onclick = () => {
          btn.classList.add('validated');
          btn.innerHTML = "☑ Validé 🤖";
          btn.disabled = true;
          lockControlsNow($('controls'));
          socket.emit("phaseAck");
        };
      }
      controls.appendChild(btn);
      controls.appendChild(makeHint(`Échange privé entre ${tRole('ai_agent')} et son partenaire lié. Les deux doivent valider pour continuer.`));
    } else {
      controls.appendChild(makeHint(`🤖 Échange ${tRole('ai_agent')} en cours…`));
    }
  }

  if (state.phase === "NIGHT_RADAR") {
    if (state.phaseData?.selectionDone) {
// Afficher le résultat directement ici (les joueurs n'ont plus le log/tableau).
const radarLine = (state.privateLines || []).map(x => x.text).find(t => /radar/i.test(t)) || state.privateLines?.[0]?.text || "";
if (radarLine) {
  const box = document.createElement("div");
  box.style.marginTop = "10px";
  box.style.padding = "12px";
  box.style.borderRadius = "12px";
  box.style.border = "1px solid rgba(0,255,255,0.25)";
  box.style.background = "rgba(0,0,0,0.25)";
  box.innerHTML = `<div style="font-weight:900; margin-bottom:6px;">🔎 Radar</div>` +
    `<div style="opacity:.95; font-weight:800;">${escapeHtml(radarLine)}</div>`;
  controls.appendChild(box);
}
controls.appendChild(makeHint("Lis le résultat puis valide pour continuer."));
    } else {
      const alive = state.players.filter(p => p.status === "alive" && p.playerId !== state.you?.playerId);
      controls.appendChild(makeChoiceGrid(alive.map(p => p.playerId), "Inspecter", (id) => socket.emit("phaseAction", { targetId: id }, (r) => { if (r?.ok === false) setError(r.error || "Erreur"); })));
      controls.appendChild(makeHint("Choisis un joueur à inspecter. Ensuite, lis le résultat puis valide."));
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
    controls.appendChild(makeHint(`Vote UNANIME entre ${t('saboteurs').toLowerCase()}. Impossible de viser un ${tRole('saboteur').toLowerCase()} (ni toi-même).`));
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
    controls.appendChild(makeHint(`La potion de vie protège automatiquement la cible des ${t('saboteurs').toLowerCase()} (s’il y en a une).`));
  }

  if (state.phase === "DAY_CAPTAIN_TRANSFER") {
    const alive = state.players.filter(p => p.status === "alive");
    controls.appendChild(makeChoiceGrid(alive.map(p => p.playerId), "Transmettre", (id) => socket.emit("phaseAction", { chosenId: id })));
    controls.appendChild(makeHint(`Le ${t('captain').toLowerCase()} mort choisit sans connaître le rôle du joueur choisi.`));
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
    controls.appendChild(makeHint(`En cas d'égalité, le ${t('captain').toLowerCase()} tranche avant toute conséquence.`));
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
    title.textContent = "Partie interrompue — pas assez de joueurs";
    $("endSummary").innerHTML = `<div style="color: var(--neon-orange); font-weight:800;">${escapeHtml(state.phaseData?.reason || "")}</div>`;
  } else {
    title.textContent = winner === "SABOTEURS" ? `⚔️ VICTOIRE DES ${t('saboteurs').toUpperCase()}` : (winner === "AMOUREUX" ? "🤝 ASSOCIATION DE MALFAITEURS" : `👨‍🚀 VICTOIRE DES ${t('astronauts').toUpperCase()}`);
    $("endSummary").innerHTML = `<div style="opacity:.9;">Stats persistées par NOM (serveur).</div>`;
  }


  const rep = state.phaseData?.report;
  if (rep) {
    const deaths = (rep.deathOrder || []).map((d, i) => {
      const rl = d.roleLabel ? ` (${d.roleLabel})` : "";
      return `${i + 1}. ${d.name}${rl} — ${d.source || "?"}`;
    }).join("<br>");
    const awardsHtml = (rep.awards || []).map(a => `<div style="margin:6px 0;"><b>${escapeHtml(a.title)}</b> : ${escapeHtml(a.text)}</div>`).join("");
    const statsHtml = Object.entries(rep.statsByName || {}).map(([name, s]) => {
      // D9: Trouver le joueur pour récupérer son avatar
      const player = state.players.find(p => p.name === name);
      const avatarEmoji = player?.avatarEmoji || '👤';
      const colorStyle = player?.colorHex ? `border-left: 3px solid ${player.colorHex};` : '';
      
      return `<div class="player-item" style="margin:8px 0; ${colorStyle}">
        <div class="player-left">
          <div style="font-weight:900; display:flex; align-items:center;">
            <span style="font-size:1.3rem; margin-right:8px;">${avatarEmoji}</span>
            ${escapeHtml(name)}
          </div>
          <div style="opacity:.9;">Parties: <b>${s.gamesPlayed}</b> • Victoires: <b>${s.wins}</b> • Défaites: <b>${s.losses}</b> • Winrate: <b>${s.winRatePct}%</b></div>
        </div>
      </div>`;
    }).join("");


const detailed = rep.detailedStatsByName || {};
const detailedHtml = Object.entries(detailed).map(([name, s]) => {
  // D9: Trouver le joueur pour récupérer son avatar
  const player = state.players.find(p => p.name === name);
  const avatarEmoji = player?.avatarEmoji || '👤';
  const colorStyle = player?.colorHex ? `border-left: 3px solid ${player.colorHex};` : '';
  
  const roles = Object.entries(s.roleWinRates || {}).map(([rk, pct]) => {
    // Traduire la clé de rôle en nom localisé
    const roleName = tRole(rk) || rk;
    return `<div style="opacity:.95;">• <b>${escapeHtml(roleName)}</b> : ${pct}% (${(s.winsByRole?.[rk]||0)}/${(s.gamesByRole?.[rk]||0)})</div>`;
  }).join("");
  return `<div class="player-item" style="margin:8px 0; ${colorStyle}">
    <div class="player-left">
      <div style="font-weight:900; display:flex; align-items:center;">
        <span style="font-size:1.3rem; margin-right:8px;">${avatarEmoji}</span>
        ${escapeHtml(name)}
      </div>
      <div style="opacity:.9;">Parties: <b>${s.gamesPlayed}</b> • Victoires: <b>${s.wins}</b> • Défaites: <b>${s.losses}</b> • Winrate: <b>${s.winRatePct}%</b></div>
      <div style="margin-top:6px; opacity:.95;">
        <div style="font-weight:900; margin-bottom:4px;">Stats par rôle</div>
        ${roles || "<div>—</div>"}
      </div>
    </div>
  </div>`;
}).join("");

$("endSummary").innerHTML += `
  <div style="margin-top:14px; display:flex; gap:10px; flex-wrap:wrap;">
    <button class="btn btn-secondary" id="tabSummaryBtn">Résumé</button>
    <button class="btn btn-secondary" id="tabDetailedBtn">Stats détaillées</button>
  </div>

  <div id="tabSummary" style="margin-top:12px;">
    <div style="padding:12px; border-radius:12px; border:1px solid rgba(0,255,255,0.25); background: rgba(0,0,0,0.25);">
      <div style="font-weight:900; margin-bottom:8px;">🏆 Awards</div>
      ${awardsHtml || "<div>—</div>"}
    </div>

    <div style="margin-top:14px; padding:12px; border-radius:12px; border:1px solid rgba(255,165,0,0.25); background: rgba(0,0,0,0.22);">
      <div style="font-weight:900; margin-bottom:8px;">🚀 Ordre des éjections</div>
      <div style="opacity:.95;">${deaths || "—"}</div>
    </div>

    <div style="margin-top:14px;">
      <div style="font-weight:900; margin-bottom:8px;">📈 Stats cumulées (par NOM)</div>
      ${statsHtml || "<div>—</div>"}
    </div>
  </div>

  <div id="tabDetailed" style="margin-top:12px; display:none;">
    <div style="font-weight:900; margin-bottom:8px;">📊 Stats détaillées (par NOM)</div>
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
}  }

  // ranking table (show roles)
  const table = $("rankingTable");
  const players = [...state.players].filter(p => p.status !== "left");
  players.sort((a,b) => (a.status === "alive" ? -1 : 1) - (b.status === "alive" ? -1 : 1) || a.name.localeCompare(b.name));
  table.innerHTML = players.map(p => {
    const role = p.roleLabel || (p.status === "alive" ? "" : "");
    return `<div class="player-item">
      <div class="player-left">
        <div style="font-weight:900;">${escapeHtml(p.name)}</div>
        ${p.isCaptain ? `<span class="pill ok">CAPITAINE</span>` : ""}
        ${p.status === "alive" ? `<span class="pill ok">SURVIVANT</span>` : (p.status === "dead" ? `<span class="pill bad">ÉJECTÉ</span>` : `<span class="pill warn">SORTI</span>`)}
      </div>
      <div style="opacity:.95; font-weight:800;">${escapeHtml(role || "")}</div>
    </div>`;
  }).join("");

  $("replayBtn").onclick = () => socket.emit("replaySameRoom");
  $("newGameBtn").onclick = () => socket.emit("newGameResetStats");
}

function buildPhaseText(s) {
  const p = s.phase;
  if (p === "ROLE_REVEAL") return (s.phaseData?.notice ? s.phaseData.notice + " " : "") + "Regarde ton rôle et valide.";
  if (p === "CAPTAIN_CANDIDACY") return `Choisis si tu te présentes au poste de ${t('captain')}.`;
  if (p === "CAPTAIN_VOTE") return `Vote pour élire le ${t('captain').toLowerCase()}. En cas d'égalité : revote.`;
  if (p === "NIGHT_START") return "Tout le monde ferme les yeux… puis valide pour démarrer la nuit.";
  if (p === "NIGHT_CHAMELEON") return `${tRole('chameleon')} : choisis un joueur pour échanger les rôles (Nuit 1 uniquement).`;
  if (p === "NIGHT_AI_AGENT") return `${tRole('ai_agent')} : Nuit 1, choisis un joueur à lier avec TOI (liaison permanente).`;
  if (p === "NIGHT_AI_EXCHANGE") return `Échange privé entre ${tRole("ai_agent")} et son partenaire lié. Les deux doivent valider pour continuer.`;
  if (p === "NIGHT_RADAR") return `${tRole('radar')} : inspecte un joueur et découvre son rôle.`;
  if (p === "NIGHT_SABOTEURS") return `${t('saboteurs')} : votez UNANIMEMENT une cible.`;
  if (p === "NIGHT_DOCTOR") return `${tRole('doctor')} : potion de vie (sauve automatiquement la cible des ${t('saboteurs').toLowerCase()}) OU potion de mort (tue une cible) OU rien.`;

  if (p === "NIGHT_RESULTS") return (s.phaseData?.deathsText ? s.phaseData.deathsText + " " : "") + "Annonce des effets de la nuit, puis passage au jour.";
  if (p === "DAY_WAKE") return `Réveil de la ${t('station')}. Validez pour passer à la suite.`;
  if (p === "DAY_CAPTAIN_TRANSFER") return `Le ${t('captain').toLowerCase()} est mort : il transmet le ${t('captain').toLowerCase()} à un joueur vivant.`;
  if (p === "DAY_VOTE") return "Votez pour éjecter un joueur.";
  if (p === "DAY_TIEBREAK") return `Égalité : le ${t('captain').toLowerCase()} choisit l'éjecté.`;
  if (p === "DAY_RESULTS") return (s.phaseData?.deathsText ? s.phaseData.deathsText + " " : "") + "Résultats du jour, puis passage à la nuit.";
  if (p === "REVENGE") return `${tRole('security')} : tu as été éjecté, tu peux tirer sur quelqu'un.`;
  if (p === "MANUAL_ROLE_PICK") return "Mode manuel : chaque joueur choisit son rôle (cartes physiques), puis tout le monde valide.";
  if (p === "GAME_ABORTED") return "Partie interrompue.";
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
    card.innerHTML = `<div style="font-weight:900; font-size:1.1rem;">${escapeHtml(p.name)}</div>
      ${p.isCaptain ? `<div style="opacity:.85; margin-top:4px;">⭐ Capitaine</div>` : ""}`;
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
    try {
      // Important: do NOT cancel TTS in stopAll(), otherwise a fast phase change can cut announcements.
      // Instead, cancel right before speaking to avoid overlaps.
      try { window.speechSynthesis.cancel(); } catch {}
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "fr-FR";
      window.speechSynthesis.speak(u);
    } catch {}
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

  // D9: Récupérer les données de personnalisation
  const customization = window.D9Avatars?.getCustomizationForServer() || {};
  
  socket.emit("createRoom", { 
    playerId, 
    name, 
    playerToken, 
    themeId: homeSelectedTheme,
    // D9: Données de personnalisation
    avatarId: customization.avatarId,
    avatarEmoji: customization.avatarEmoji,
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

  // D9: Récupérer les données de personnalisation
  const customization = window.D9Avatars?.getCustomizationForServer() || {};
  
  socket.emit("joinRoom", { 
    playerId, 
    name, 
    roomCode, 
    playerToken,
    // D9: Données de personnalisation
    avatarId: customization.avatarId,
    avatarEmoji: customization.avatarEmoji,
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
  
  state = s;
  // D6: Stocker aussi dans window.lastKnownState pour video-tracks.js
  window.lastKnownState = s;
  
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
  
  // D11: Animation élection capitaine
  if (previousPhase && previousPhase !== 'CAPTAIN_CANDIDACY' && currentPhaseNow === 'CAPTAIN_CANDIDACY') {
    requestAnimationFrame(() => {
      if (window.D7Animations) {
        console.log('[D7] ⭐ Triggering captain election animation');
        D7Animations.animateCaptainElection();
      }
    });
  }
  
  // D7: Animation d'éjection (quand un joueur est éliminé)
  if (previousAliveCount > 0 && currentAliveCount < previousAliveCount) {
    // Trouver les joueurs qui viennent d'être éliminés
    const previousPlayers = (state?.players || []);
    const newlyDead = s.players.filter(p => {
      if (p.status !== 'dead') return false;
      const prev = previousPlayers.find(pp => pp.playerId === p.playerId);
      return prev && prev.status === 'alive';
    });
    
    newlyDead.forEach(deadPlayer => {
      if (window.D7Animations) {
        console.log('[D7] 💀 Triggering ejection animation for:', deadPlayer.name);
        setTimeout(() => {
          D7Animations.animateEjection(deadPlayer.playerId);
          D7Animations.animateDeath(deadPlayer.playerId);
        }, 100);
      }
    });
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
let homeSelectedTheme = "default"; // Thème choisi sur la page d'accueil (avant d'entrer dans une room)

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
 * Traduit un nom de rôle selon le thème actif
 * @param {string} roleKey - La clé du rôle (saboteur, astronaut, radar, doctor, etc.)
 * @param {boolean} plural - Si true, retourne la forme plurielle si disponible
 * @returns {string} - Le nom traduit du rôle
 */
function tRole(roleKey, plural = false) {
  // Debug
  if (!currentTheme) {
    console.warn("[tRole] currentTheme is null! Themes not loaded yet. Using defaults for:", roleKey);
  }
  
  // Fallback complet si pas de thème chargé
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
fetch("/api/themes")
  .then(r => r.json())
  .then(data => {
    console.log("[themes] Received response:", data);
    if (data.ok && data.themes) {
      availableThemes = data.themes;
      console.log("[themes] Loaded themes:", availableThemes.map(t => t.id));
      console.log("[themes] Available themes count:", availableThemes.length);
      
      // Appliquer le thème par défaut au chargement
      const defaultTheme = availableThemes.find(t => t.id === "default");
      if (defaultTheme) {
        currentTheme = defaultTheme;
        homeSelectedTheme = "default";
        console.log("[themes] Set default theme:", currentTheme.id);
        console.log("[themes] Default theme has roles:", Object.keys(currentTheme.roles || {}));
        
        // Appliquer les styles CSS
        applyThemeStyles("default");
        
        // Appliquer les traductions
        applyThemeTranslations();
        
        // Rendre le sélecteur de thème sur la page d'accueil
        renderHomeThemeSelector();
      } else {
        console.error("[themes] No default theme found!");
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
  // Titre principal (avec ID)
  const mainTitle = document.getElementById('mainTitle');
  if (mainTitle) {
    mainTitle.textContent = t('title').toUpperCase();
  }
  
  // Titres des écrans
  const createTitle = document.getElementById('createMissionTitle');
  if (createTitle) createTitle.textContent = `CRÉER UNE ${t('mission').toUpperCase()}`;
  
  const joinTitle = document.getElementById('joinMissionTitle');
  if (joinTitle) joinTitle.textContent = `REJOINDRE UNE ${t('mission').toUpperCase()}`;
  
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

// --- MODE HÔTE : FORCER LA SUITE ---

let phaseTimerInterval = null;

function updateHostControls() {
  const hostControls = $("hostControls");
  if (!hostControls) return;
  
  const isHost = !!state.players?.find(p => p.playerId === state.you?.playerId)?.isHost;
  const inGame = state.started && !state.ended;
  
  if (!isHost || !inGame) {
    hostControls.style.display = "none";
    if (phaseTimerInterval) {
      clearInterval(phaseTimerInterval);
      phaseTimerInterval = null;
    }
    return;
  }
  
  hostControls.style.display = "block";
  
  // Démarrer le timer de phase
  if (!phaseTimerInterval) {
    phaseTimerInterval = setInterval(updatePhaseTimer, 1000);
  }
  
  updatePhaseTimer();
  updatePendingPlayers();
}

function updatePhaseTimer() {
  const elapsed = $("phaseElapsed");
  if (!elapsed || !state.phaseStartTime) return;
  
  const elapsedSeconds = Math.floor((Date.now() - state.phaseStartTime) / 1000);
  elapsed.textContent = `${elapsedSeconds}s`;
  
  // Activer le bouton après 20s
  const forceBtn = $("forceAdvanceBtn");
  if (forceBtn) {
    if (elapsedSeconds >= 20) {
      forceBtn.disabled = false;
      forceBtn.style.opacity = "1";
      forceBtn.style.cursor = "pointer";
    } else {
      forceBtn.disabled = true;
      forceBtn.style.opacity = "0.5";
      forceBtn.style.cursor = "not-allowed";
    }
  }
}

function updatePendingPlayers() {
  const pending = $("pendingPlayers");
  if (!pending) return;
  
  const ack = state.ack || { done: 0, total: 0, pending: [] };
  
  if (ack.pending && ack.pending.length > 0) {
    const names = ack.pending.map(pid => {
      const p = state.players?.find(pl => pl.playerId === pid);
      return p ? p.name : "?";
    }).join(", ");
    pending.textContent = `⏳ En attente de : ${names}`;
    pending.style.display = "block";
  } else {
    pending.textContent = "";
    pending.style.display = "none";
  }
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
  
  return `
    <!-- Écran 1 -->
    <div class="tutorial-screen" data-screen="1" style="display:block;">
      <div style="text-align:center; margin-bottom: 25px;">
        <div style="font-size: 4rem; margin-bottom: 10px;">🚀</div>
        <h2 style="color: var(--neon-cyan); font-size: 1.8rem; margin: 0;">Bienvenue !</h2>
      </div>
      <p style="font-size: 1.1rem; line-height: 1.6; color: var(--text-primary);">
        <strong>Les Saboteurs</strong> est un jeu de déduction sociale où des <span style="color: var(--neon-red);">${saboteurs.toLowerCase()}</span> 
        tentent d'éliminer les <span style="color: var(--neon-cyan);">${astronauts.toLowerCase()}</span> sans être découverts.
      </p>
      <p style="font-size: 1.05rem; line-height: 1.6; color: var(--text-secondary);">
        Le jeu alterne entre <strong>phases de nuit</strong> (actions secrètes) et <strong>phases de jour</strong> (discussions et votes).
      </p>
    </div>

    <!-- Écran 2 -->
    <div class="tutorial-screen" data-screen="2" style="display:none;">
      <div style="text-align:center; margin-bottom: 25px;">
        <div style="font-size: 4rem; margin-bottom: 10px;">🌙</div>
        <h2 style="color: var(--neon-purple, var(--neon-cyan)); font-size: 1.8rem; margin: 0;">Phase de nuit</h2>
      </div>
      <ul style="font-size: 1.05rem; line-height: 1.8; color: var(--text-primary); padding-left: 25px;">
        <li><strong style="color: var(--neon-red);">${saboteurs}</strong> : choisissent une victime (unanimité requise)</li>
        <li><strong style="color: var(--neon-cyan);">${tRole('radar')}</strong> : inspecte un joueur (${saboteurs.toLowerCase()[0] + saboteurs.toLowerCase().slice(1, -1)} ou non ?)</li>
        <li><strong style="color: var(--neon-green);">${tRole('doctor')}</strong> : peut sauver OU tuer (1 vie + 1 mort max)</li>
        <li><strong style="color: var(--neon-orange);">Rôles spéciaux</strong> : ${tRole('chameleon')}, ${tRole('ai_agent')}, etc.</li>
      </ul>
    </div>

    <!-- Écran 3 -->
    <div class="tutorial-screen" data-screen="3" style="display:none;">
      <div style="text-align:center; margin-bottom: 25px;">
        <div style="font-size: 4rem; margin-bottom: 10px;">☀️</div>
        <h2 style="color: var(--neon-orange); font-size: 1.8rem; margin: 0;">Phase de jour</h2>
      </div>
      <ul style="font-size: 1.05rem; line-height: 1.8; color: var(--text-primary); padding-left: 25px;">
        <li>Les résultats de la nuit sont révélés (qui est mort ?)</li>
        <li>Tous les joueurs vivants <strong>discutent</strong> et <strong>débattent</strong></li>
        <li>Un <strong>vote d'éjection</strong> a lieu pour éliminer un suspect</li>
        <li>Le <strong>${t('captain')}</strong> tranche en cas d'égalité</li>
      </ul>
      <p style="margin-top: 15px; padding: 12px; background: rgba(255,165,0,0.15); border-left: 3px solid var(--neon-orange); border-radius: 8px; color: var(--text-secondary);">
        <strong>Astuce :</strong> Observez les comportements, cherchez les contradictions, et faites confiance à votre instinct !
      </p>
    </div>

    <!-- Écran 4 -->
    <div class="tutorial-screen" data-screen="4" style="display:none;">
      <div style="text-align:center; margin-bottom: 25px;">
        <div style="font-size: 4rem; margin-bottom: 10px;">🎥</div>
        <h2 style="color: var(--neon-cyan); font-size: 1.8rem; margin: 0;">Visioconférence</h2>
      </div>
      <div style="margin-bottom: 20px;">
        <h3 style="color: var(--neon-orange); font-size: 1.2rem; margin-bottom: 10px;">📹 Contrôles Vidéo</h3>
        <ul style="font-size: 1rem; line-height: 1.7; color: var(--text-primary); padding-left: 20px;">
          <li><strong>🎤 Micro</strong> : Cliquez pour activer/désactiver votre micro</li>
          <li><strong>📷 Caméra</strong> : Cliquez pour activer/désactiver votre caméra</li>
          <li><strong>⬆ Max</strong> : Mode plein écran (briefing étendu)</li>
          <li><strong>⬕ Split</strong> : Mode 50/50 (jeu + vidéo)</li>
        </ul>
      </div>
      <div>
        <h3 style="color: var(--neon-purple, var(--neon-cyan)); font-size: 1.2rem; margin-bottom: 10px;">🔊 Activation Automatique</h3>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 0.95rem;">
          <div style="padding: 10px; background: rgba(0,255,0,0.1); border-left: 3px solid var(--neon-green); border-radius: 6px;">
            <div style="color: var(--neon-green); font-weight: 700; margin-bottom: 5px;">✅ Micro + Caméra ON</div>
            <div style="color: var(--text-secondary);">• Jour (débat/vote)<br>• Fin de partie<br>• Révélation des rôles</div>
          </div>
          <div style="padding: 10px; background: rgba(128,0,128,0.1); border-left: 3px solid var(--neon-purple, var(--neon-cyan)); border-radius: 6px;">
            <div style="color: var(--neon-purple, var(--neon-cyan)); font-weight: 700; margin-bottom: 5px;">🔒 Certains Rôles</div>
            <div style="color: var(--text-secondary);">• Nuit des ${saboteurs.toLowerCase()}<br>• Échange ${tRole('ai_agent')}<br>• Actions spéciales</div>
          </div>
        </div>
        <p style="margin-top: 12px; padding: 10px; background: rgba(255,165,0,0.1); border-left: 3px solid var(--neon-orange); border-radius: 6px; font-size: 0.9rem; color: var(--text-secondary);">
          💡 <strong>Astuce :</strong> Vous pouvez désactiver votre micro/caméra manuellement à tout moment.
        </p>
      </div>
    </div>

    <!-- Écran 5 -->
    <div class="tutorial-screen" data-screen="5" style="display:none;">
      <div style="text-align:center; margin-bottom: 25px;">
        <div style="font-size: 4rem; margin-bottom: 10px;">📱</div>
        <h2 style="color: var(--neon-cyan); font-size: 1.8rem; margin: 0;">Visio sur Mobile</h2>
      </div>
      <div style="margin-bottom: 20px;">
        <h3 style="color: var(--neon-orange); font-size: 1.2rem; margin-bottom: 10px;">🎥 Activation sur Mobile</h3>
        <ul style="font-size: 1rem; line-height: 1.7; color: var(--text-primary); padding-left: 20px;">
          <li><strong>1ère connexion</strong> : Autoriser l'accès micro/caméra dans le navigateur</li>
          <li><strong>Bouton "📹 Visio activée"</strong> : En bas à gauche pour activer/désactiver</li>
          <li><strong>Après un refresh</strong> : Retaper sur "Activer visio" puis valider</li>
        </ul>
      </div>
      <div style="padding: 15px; background: rgba(0,255,255,0.1); border: 2px solid var(--neon-cyan); border-radius: 12px;">
        <div style="font-size: 1.8rem; text-align: center; margin-bottom: 10px;">📱 👆</div>
        <div style="text-align: center; color: var(--text-primary); font-size: 1rem; line-height: 1.6;">
          <strong>Sur PC</strong> : La visio s'active automatiquement<br>
          <strong>Sur Mobile</strong> : Utiliser le bouton en bas à gauche
        </div>
      </div>
      <p style="margin-top: 12px; padding: 10px; background: rgba(255,165,0,0.1); border-left: 3px solid var(--neon-orange); border-radius: 6px; font-size: 0.9rem; color: var(--text-secondary);">
        💡 <strong>Astuce :</strong> Si la vidéo ne s'affiche pas après refresh, vérifier que le bouton "Visio activée" est bien actif (vert).
      </p>
    </div>

    <!-- Écran 6 -->
    <div class="tutorial-screen" data-screen="6" style="display:none;">
      <div style="text-align:center; margin-bottom: 25px;">
        <div style="font-size: 4rem; margin-bottom: 10px;">🏆</div>
        <h2 style="color: var(--neon-green); font-size: 1.8rem; margin: 0;">Conditions de victoire</h2>
      </div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
        <div style="padding: 15px; background: rgba(0,255,255,0.1); border: 2px solid var(--neon-cyan); border-radius: 12px;">
          <div style="font-size: 2rem; margin-bottom: 8px;">👨‍🚀</div>
          <div style="color: var(--neon-cyan); font-weight: 800; margin-bottom: 5px;">${astronauts} gagnent</div>
          <div style="font-size: 0.95rem; color: var(--text-secondary);">Tous les ${saboteurs.toLowerCase()} sont éjectés</div>
        </div>
        <div style="padding: 15px; background: rgba(255,7,58,0.1); border: 2px solid var(--neon-red); border-radius: 12px;">
          <div style="font-size: 2rem; margin-bottom: 8px;">⚔️</div>
          <div style="color: var(--neon-red); font-weight: 800; margin-bottom: 5px;">${saboteurs} gagnent</div>
          <div style="font-size: 0.95rem; color: var(--text-secondary);">Nombre de ${saboteurs.toLowerCase()} ≥ ${astronauts.toLowerCase()}</div>
        </div>
      </div>
      <p style="text-align: center; font-size: 1.1rem; color: var(--neon-green); font-weight: 800;">
        Prêt à jouer ? Créez ou rejoignez une ${t('mission')} ! 🚀
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
      nextBtn.textContent = "Commencer ! 🚀";
    } else {
      nextBtn.textContent = "Suivant →";
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
});

