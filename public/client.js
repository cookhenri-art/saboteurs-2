/* Infiltration Spatiale — client (vanilla) */

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
  name: "is_name",
  room: "is_roomCode",
};

function getOrCreatePlayerId() {
  let id = sessionStorage.getItem(STORAGE.playerId);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(STORAGE.playerId, id);
  }
  return id;
}
const playerId = getOrCreatePlayerId();

let state = null;
let lastAudioToken = null;

let isConnected = false;
socket.on("connect", () => {
  isConnected = true;
  clearError();
});
socket.on("disconnect", () => {
  isConnected = false;
  // avoid spamming the UI; the server handles the 30s grace logic
});
socket.on("connect_error", () => {
  isConnected = false;
  // Most common cause: user opened index.html directly (file://) or the server isn't running.
  setError("Connexion au serveur impossible. Lance l'application via le serveur (npm install puis npm start) et ouvre l'URL affichée (ex: http://localhost:3000). Sur Render, attends que le service soit démarré.");
});

function showScreen(screenId) {
  for (const el of document.querySelectorAll(".screen")) el.classList.remove("active");
  $(screenId).classList.add("active");
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
    CAPTAIN_CANDIDACY: "CANDIDATURE CAPITAINE",
    CAPTAIN_VOTE: "VOTE CAPITAINE",
    NIGHT_START: `NUIT ${night} — DÉBUT`,
    NIGHT_CHAMELEON: "NUIT — CAMÉLÉON",
    NIGHT_AI_AGENT: "NUIT — AGENT IA (LIAISON)",
    NIGHT_RADAR: "NUIT — OFFICIER RADAR",
    NIGHT_SABOTEURS: "NUIT — SABOTEURS (UNANIMITÉ)",
    NIGHT_DOCTOR: "NUIT — DOCTEUR BIO",
    NIGHT_RESULTS: `RÉSULTATS NUIT ${night}`,
    DAY_WAKE: `JOUR ${day} — RÉVEIL`,
    DAY_CAPTAIN_TRANSFER: `JOUR ${day} — TRANSMISSION DU CAPITAINE`,
    DAY_VOTE: `JOUR ${day} — VOTE D'ÉJECTION`,
    DAY_TIEBREAK: `JOUR ${day} — DÉPARTAGE (CAPITAINE)`,
    DAY_RESULTS: `JOUR ${day} — RÉSULTATS`,
    REVENGE: "VENGEANCE — CHEF DE SÉCURITÉ",
    GAME_OVER: "FIN DE PARTIE",
    GAME_ABORTED: "PARTIE INTERROMPUE",
    MANUAL_ROLE_PICK: "CHOIX MANUEL DES RÔLES"
  };
  return map[p] || p;
}


const ROLE_INFO = {
  astronaut: {
    title: "Astronaute",
    desc: "Aucun pouvoir spécial. Observe, débat et vote pour protéger la station."
  },
  saboteur: {
    title: "Saboteur",
    desc: "Chaque nuit, les saboteurs votent UNANIMEMENT une cible (impossible de viser un saboteur)."
  },
  doctor: {
    title: "Docteur bio",
    desc: "Une seule fois : potion de vie (sauve la cible attaquée). Une seule fois : potion de mort (tue une cible)."
  },
  security: {
    title: "Chef de sécurité",
    desc: "Si tu meurs, tu tires une dernière fois (vengeance)."
  },
  ai_agent: {
    title: "Agent IA",
    desc: "Nuit 1 : choisis un joueur à lier avec TOI. Si l’un meurt, l’autre meurt aussi."
  },
  radar: {
    title: "Officier radar",
    desc: "Chaque nuit, inspecte un joueur et découvre son rôle."
  },
  engineer: {
    title: "Ingénieur",
    desc: "Peut espionner à ses risques et périls. Rappel discret en début de nuit tant qu’il est vivant."
  },
  chameleon: {
    title: "Caméléon",
    desc: "Nuit 1 seulement : échange TON rôle avec un joueur. Après l’échange : revérification globale."
  },
};

function getRoleInfo(roleKey, roleLabelFromServer) {
  const k = roleKey || "";
  const base = ROLE_INFO[k];
  if (base) return base;
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

function setBackdrop() {
  const el = $("gameBackdrop");
  if (!el || !state) return;

  const p = state.phase || "";
  let img = null;

  // cockpit during lobby + role validation + captain election
  if (p === "LOBBY" || p === "MANUAL_ROLE_PICK" || p === "ROLE_REVEAL" || p === "CAPTAIN_CANDIDACY" || p === "CAPTAIN_VOTE") {
    img = "/images/cockpit.png";
  }
  // results: use ejection banner if there were ejections
  else if ((p === "NIGHT_RESULTS" || p === "DAY_RESULTS") && (state.phaseData?.anyDeaths || state.phaseData?.deathsText)) {
    img = "/images/ejection.png";
  }
  // day / night banners
  else if (p.startsWith("DAY")) img = "/images/vote-jour.png";
  else if (p.startsWith("NIGHT")) img = "/images/vote-nuit.png";

  if (img) el.style.backgroundImage = `url('${img}')`;
  else el.style.backgroundImage = "none";
}

function render() {
  if (!state) return;
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
    showScreen("endScreen");
    renderEnd();
    return;
  }

  showScreen("gameScreen");
  renderGame();
}

function renderLobby() {
  const code = state.roomCode;
  $("displayRoomCode").textContent = code;
  $("playerCount").textContent = String(state.players.filter(p => p.status !== "left").length);

  // auto allocation summary (based on player count)
  const n = state.players.filter(p => p.status !== "left").length;
  const sab = (n <= 6) ? 1 : (n <= 11 ? 2 : 3);
  const ast = Math.max(0, n - sab);
  $("autoAllocation").innerHTML = `<div>${sab}️⃣ SABOTEUR(S)</div><div>${ast}️⃣ ASTRONAUTE(S)</div>`;

  // balance indicator
  const ratio = n ? (ast / n) : 0.5;
  const left = Math.round(ratio * 100);
  $("balanceIndicatorCockpit").style.left = `${left}%`;
  $("balanceStatusCockpit").textContent = (ratio > 0.62) ? "TEAM HUMAN AVANTAGE" : (ratio < 0.55 ? "SABOTEURS AVANTAGE" : "MISSION BALANCED");

  // players list
  const list = $("playersList");
  list.innerHTML = "";
  const playersSorted = [...state.players].sort((a,b) => (b.isHost?1:0) - (a.isHost?1:0) || a.name.localeCompare(b.name));
  for (const p of playersSorted) {
    const item = document.createElement("div");
    item.className = "player-item";
    const left = document.createElement("div");
    left.className = "player-left";
    left.innerHTML = `
      <div style="font-weight:900;">${escapeHtml(p.name)}</div>
      ${p.isHost ? `<span class="pill ok">HÔTE</span>` : ""}
      ${p.isCaptain ? `<span class="pill ok">CAPITAINE</span>` : ""}
      ${p.connected ? `<span class="pill ok">EN LIGNE</span>` : `<span class="pill warn">RECONNEXION…</span>`}
      ${p.status === "left" ? `<span class="pill bad">SORTI</span>` : (p.status === "dead" ? `<span class="pill bad">ÉJECTÉ</span>` : "")}
    `;
    const right = document.createElement("div");
    right.innerHTML = p.ready ? `<span class="pill ok">PRÊT</span>` : `<span class="pill warn">PAS PRÊT</span>`;
    item.appendChild(left);
    item.appendChild(right);
    list.appendChild(item);
  }

  // ready button
  const me = state.players.find(p => p.playerId === state.you?.playerId);
  const ready = !!me?.ready;
  $("readyBtn").textContent = ready ? "✅ PRÊT (annuler)" : "✅ PRÊT";
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
    box.innerHTML = `<div style="opacity:.85;">Seul l’hôte peut configurer.</div>`;
    return;
  }

  box.appendChild(makeCheckbox("doctor", "Docteur bio", rolesEnabled.doctor));
  box.appendChild(makeCheckbox("security", "Chef de sécurité", rolesEnabled.security));
  box.appendChild(makeCheckbox("radar", "Officier radar", rolesEnabled.radar));
  box.appendChild(makeCheckbox("ai_agent", "Agent IA", rolesEnabled.ai_agent));
  box.appendChild(makeCheckbox("engineer", "Ingénieur", rolesEnabled.engineer));
  box.appendChild(makeCheckbox("chameleon", "Caméléon (Nuit 1)", rolesEnabled.chameleon));
  box.appendChild(document.createElement("hr"));
  box.appendChild(makeCheckbox("manualRoles", "Mode manuel (cartes physiques)", !!cfg.manualRoles, true));

  function makeCheckbox(key, label, checked, isRoot=false) {
    const row = document.createElement("div");
    row.style.marginBottom = "10px";
    const id = `cfg_${key}`;
    row.innerHTML = `<label style="display:flex; align-items:center; gap:10px; text-transform:none; letter-spacing:1px;">
      <input type="checkbox" id="${id}" ${checked ? "checked" : ""}>
      <span>${label}</span>
    </label>`;
    row.querySelector("input").addEventListener("change", () => {
      const next = JSON.parse(JSON.stringify(state.config || {}));
      next.rolesEnabled = next.rolesEnabled || {};
      if (isRoot) next[key] = row.querySelector("input").checked;
      else next.rolesEnabled[key] = row.querySelector("input").checked;
      socket.emit("updateConfig", { config: next }, (r) => { if (!r?.ok) setError(r?.error || "Erreur config"); });
    });
    return row;
  }
}

function renderGame() {
  $("hudRoom").textContent = state.roomCode;
  setBackdrop();

  // results overlay (ejection)
  const ov = $("ejectionOverlay");
  if (ov) {
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
  const roleIconSrc = state.you?.roleIcon || "";
  const isCaptain = !!state.you?.isCaptain;
  const captainIconSrc = isCaptain ? "/images/roles/capitaine.png" : "";

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
        <div class="role-card-title">${escapeHtml(info.title)} ${isCaptain ? `<span class="role-card-badge">⭐ Chef de station</span>` : ``}</div>
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

  const ack = state.ack || { done:0, total:0 };
  $("ackLine").textContent = ack.total ? `✅ Validations : ${ack.done}/${ack.total}` : "";

  // logs
  const logEl = $("log");
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

  // controls
  const controls = $("controls");
  controls.innerHTML = "";


// actor-only phases: only the actor sees the action UI
const actorOnly = new Set(["NIGHT_CHAMELEON","NIGHT_AI_AGENT","NIGHT_RADAR","NIGHT_DOCTOR","NIGHT_SABOTEURS","DAY_TIEBREAK","DAY_CAPTAIN_TRANSFER","REVENGE"]);
const waitTextByPhase = {
  NIGHT_CHAMELEON: "🦎 Le caméléon agit…",
  NIGHT_AI_AGENT: "🤖 L’Agent IA agit…",
  NIGHT_RADAR: "🔍 Le radar agit…",
  NIGHT_DOCTOR: "🧪 Le docteur agit…",
  NIGHT_SABOTEURS: "🗡️ Les saboteurs agissent…",
  DAY_TIEBREAK: "⭐ Le capitaine tranche…",
  DAY_CAPTAIN_TRANSFER: "⭐ Transmission du capitaine…",
  REVENGE: "🔫 Le chef de sécurité se venge…"
};

// dead players have no controls (including ACK), except if they are the actor in REVENGE / captain transfer
if (meDead && !deadCanAct) {
  controls.appendChild(makeHint("💀 Vous êtes mort. Vous n’agissez plus."));
  return;
}

if (actorOnly.has(state.phase) && !isActorNow) {
  controls.appendChild(makeHint(waitTextByPhase[state.phase] || "⏳ Action en cours…"));
  return;
}

  // default: show ACK button for phases that use it
  const ackButton = () => {
    const b = document.createElement("button");
    b.className = "btn btn-primary";
    b.textContent = "✅ VALIDER";
    b.onclick = () => socket.emit("phaseAck");
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
  const rolesOrder = ["astronaut","saboteur","doctor","security","radar","ai_agent","engineer","chameleon"];
  const grid = document.createElement("div");
  grid.className = "choice-grid";

  for (const rk of rolesOrder) {
    const count = remaining[rk] ?? 0;
    if (count <= 0) continue;
    const label = ({
      astronaut: "Astronaute",
      saboteur: "Saboteur",
      doctor: "Docteur bio",
      security: "Chef de sécurité",
      radar: "Officier radar",
      ai_agent: "Agent IA",
      engineer: "Ingénieur",
      chameleon: "Caméléon"
    })[rk] || rk;

    const card = document.createElement("div");
    card.className = "choice-card";
    card.innerHTML = `<div style="font-weight:900; font-size:1.1rem;">${label}</div>
      <div style="opacity:.9; margin-top:6px;">Places restantes : <b>${count}</b></div>`;
    card.onclick = () => socket.emit("phaseAction", { roleKey: rk }, (r) => { if (r?.ok === false) setError(r.error || "Erreur"); });
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
    yes.onclick = () => socket.emit("phaseAction", { candidacy: true });
    const no = document.createElement("button");
    no.className = "btn btn-secondary";
    no.textContent = "🙅 Je ne me présente pas";
    no.onclick = () => socket.emit("phaseAction", { candidacy: false });
    wrap.appendChild(yes); wrap.appendChild(no);
    controls.appendChild(wrap);
  }

  if (state.phase === "CAPTAIN_VOTE") {
    const cands = state.phaseData?.candidates || [];
    controls.appendChild(makeChoiceGrid(cands, "Voter", (id) => socket.emit("phaseAction", { vote: id })));
  }

  if (state.phase === "NIGHT_CHAMELEON") {
    const alive = state.players.filter(p => p.status === "alive");
    controls.appendChild(makeChoiceGrid(alive.map(p => p.playerId), "Échanger", (id) => socket.emit("phaseAction", { targetId: id })));
    controls.appendChild(makeHint("Caméléon : Nuit 1 uniquement. Un seul usage dans toute la partie."));
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
      socket.emit("phaseAction", { targetId: sel.value }, (r) => { if (r?.ok === false) setError(r.error || "Erreur"); });
    };

    const btnSkip = document.createElement("button");
    btnSkip.className = "btn btn-secondary";
    btnSkip.style.marginTop = "10px";
    btnSkip.textContent = "⏭️ Ne pas lier (optionnel)";
    btnSkip.onclick = () => socket.emit("phaseAction", { skip: true });

    controls.appendChild(sel);
    controls.appendChild(btnLink);
    controls.appendChild(btnSkip);
    controls.appendChild(makeHint("Nuit 1 uniquement. La liaison est entre toi (Agent IA) et le joueur choisi."));
  }

  if (state.phase === "NIGHT_RADAR") {
    if (state.phaseData?.selectionDone) {
      controls.appendChild(makeHint("Résultat affiché en bas (journal privé). Valide pour continuer."));
    } else {
      const alive = state.players.filter(p => p.status === "alive" && p.playerId !== state.you?.playerId);
      controls.appendChild(makeChoiceGrid(alive.map(p => p.playerId), "Inspecter", (id) => socket.emit("phaseAction", { targetId: id }, (r) => { if (r?.ok === false) setError(r.error || "Erreur"); })));
      controls.appendChild(makeHint("Choisis un joueur à inspecter. Ensuite, lis le résultat puis valide."));
    }
  }

  if (state.phase === "NIGHT_SABOTEURS") {
    const aliveTargets = state.players.filter(p =>
      p.status === "alive" &&
      p.playerId !== state.you?.playerId &&
      p.role !== "saboteur" // visible to saboteurs for teammates
    );
    controls.appendChild(makeChoiceGrid(aliveTargets.map(p => p.playerId), "Cibler", (id) =>
      socket.emit("phaseAction", { targetId: id }, (r) => { if (r?.ok === false) setError(r.error || "Erreur"); })
    ));
    controls.appendChild(makeHint("Vote UNANIME entre saboteurs. Impossible de viser un saboteur (ni toi-même)."));
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
    btnSave.onclick = () => socket.emit("phaseAction", { action: "save" }, (r) => { if (r?.ok === false) setError(r.error || "Erreur"); });

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
      socket.emit("phaseAction", { action: "kill", targetId: selKill.value }, (r) => { if (r?.ok === false) setError(r.error || "Erreur"); });
    };

    const btnNone = document.createElement("button");
    btnNone.className = "btn btn-secondary";
    btnNone.style.marginTop = "10px";
    btnNone.textContent = "🤷 Ne rien faire";
    btnNone.onclick = () => socket.emit("phaseAction", { action: "none" });

    section.appendChild(btnSave);
    section.appendChild(selKill);
    section.appendChild(btnKill);
    section.appendChild(btnNone);

    controls.appendChild(section);
    controls.appendChild(makeHint("La potion de vie protège automatiquement la cible des saboteurs (s’il y en a une)."));
  }

  if (state.phase === "DAY_CAPTAIN_TRANSFER") {
    const alive = state.players.filter(p => p.status === "alive");
    controls.appendChild(makeChoiceGrid(alive.map(p => p.playerId), "Transmettre", (id) => socket.emit("phaseAction", { chosenId: id })));
    controls.appendChild(makeHint("Le capitaine mort choisit sans connaître le rôle du joueur choisi."));
  }

  if (state.phase === "DAY_VOTE") {
    const alive = state.players.filter(p => p.status === "alive");
    controls.appendChild(makeChoiceGrid(alive.map(p => p.playerId), "Voter", (id) => socket.emit("phaseAction", { vote: id })));
  }

  if (state.phase === "DAY_TIEBREAK") {
    const opts = state.phaseData?.options || [];
    controls.appendChild(makeChoiceGrid(opts, "Départager", (id) => socket.emit("phaseAction", { pick: id })));
    controls.appendChild(makeHint("En cas d'égalité, le capitaine tranche avant toute conséquence."));
  }

  if (state.phase === "REVENGE") {
    const alive = state.players.filter(p => p.status === "alive");
    controls.appendChild(makeChoiceGrid(alive.map(p => p.playerId), "Tirer", (id) => socket.emit("phaseAction", { targetId: id })));
  }
}

function renderEnd() {
  const winner = state.phaseData?.winner;
  const endBg = $("endBackdrop");
  if (endBg) {
    let img = null;
    if (state.phase === "GAME_ABORTED") img = "/images/cockpit.png";
    else if (winner === "SABOTEURS") img = "/images/image-fin-stats-explosion2.png";
    else if (winner === "ASTRONAUTES") img = "/images/image-fin-stats-station2.png";
    else if (winner === "AMOUREUX") img = "/images/image-fin-stats-station2.png";
    endBg.style.backgroundImage = img ? `url('${img}')` : "none";
  }
  const title = $("winnerTitle");
  if (state.phase === "GAME_ABORTED") {
    title.textContent = "Partie interrompue — pas assez de joueurs";
    $("endSummary").innerHTML = `<div style="color: var(--neon-orange); font-weight:800;">${escapeHtml(state.phaseData?.reason || "")}</div>`;
  } else {
    title.textContent = winner === "SABOTEURS" ? "⚔️ VICTOIRE DES SABOTEURS" : (winner === "AMOUREUX" ? "🤝 ASSOCIATION DE MALFAITEURS" : "👨‍🚀 VICTOIRE DES ASTRONAUTES");
    $("endSummary").innerHTML = `<div style="opacity:.9;">Stats persistées par NOM (serveur).</div>`;
  }


  const rep = state.phaseData?.report;
  if (rep) {
    const deaths = (rep.deathOrder || []).map((d, i) => {
      const r = d.roleLabel || d.role || "?";
      const src = d.source ? ` — ${d.source}` : "";
      return `${i + 1}. ${escapeHtml(d.name)} (${escapeHtml(r)})${escapeHtml(src)}`;
    }).join("<br>");
    const awardsHtml = (rep.awards || []).map(a => `<div style="margin:6px 0;"><b>${escapeHtml(a.title)}</b> : ${escapeHtml(a.text)}</div>`).join("");
    const statsHtml = Object.entries(rep.statsByName || {}).map(([name, s]) => {
      return `<div class="player-item" style="margin:8px 0;">
        <div class="player-left">
          <div style="font-weight:900;">${escapeHtml(name)}</div>
          <div style="opacity:.9;">Parties: <b>${s.gamesPlayed}</b> • Victoires: <b>${s.wins}</b> • Défaites: <b>${s.losses}</b> • Winrate: <b>${s.winRatePct}%</b></div>
        </div>
      </div>`;
    }).join("");


const detailed = rep.detailedStatsByName || {};
const detailedHtml = Object.entries(detailed).map(([name, s]) => {
  const roles = Object.entries(s.roleWinRates || {}).map(([rk, pct]) => {
    return `<div style="opacity:.95;">• <b>${escapeHtml(rk)}</b> : ${pct}% (${(s.winsByRole?.[rk]||0)}/${(s.gamesByRole?.[rk]||0)})</div>`;
  }).join("");
  return `<div class="player-item" style="margin:8px 0;">
    <div class="player-left">
      <div style="font-weight:900;">${escapeHtml(name)}</div>
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
  if (p === "CAPTAIN_CANDIDACY") return "Choisis si tu te présentes au poste de Chef de station (capitaine).";
  if (p === "CAPTAIN_VOTE") return "Vote pour élire le capitaine. En cas d'égalité : revote.";
  if (p === "NIGHT_START") return "Tout le monde ferme les yeux… puis valide pour démarrer la nuit.";
  if (p === "NIGHT_CHAMELEON") return "Caméléon : choisis un joueur pour échanger les rôles (Nuit 1 uniquement).";
  if (p === "NIGHT_AI_AGENT") return "Agent IA : Nuit 1, choisis un joueur à lier avec TOI (liaison permanente).";
  if (p === "NIGHT_RADAR") return "Radar : inspecte un joueur et découvre son rôle.";
  if (p === "NIGHT_SABOTEURS") return "Saboteurs : votez UNANIMEMENT une cible.";
  if (p === "NIGHT_DOCTOR") return "Docteur : potion de vie (sauve automatiquement la cible des saboteurs) OU potion de mort (tue une cible) OU rien.";

  if (p === "NIGHT_RESULTS") return (s.phaseData?.deathsText ? s.phaseData.deathsText + " " : "") + "Annonce des effets de la nuit, puis passage au jour.";
  if (p === "DAY_WAKE") return "Réveil de la station. Validez pour passer à la suite.";
  if (p === "DAY_CAPTAIN_TRANSFER") return "Le capitaine est mort : il transmet le capitaine à un joueur vivant.";
  if (p === "DAY_VOTE") return "Votez pour éjecter un joueur.";
  if (p === "DAY_TIEBREAK") return "Égalité : le capitaine choisit l'éjecté.";
  if (p === "DAY_RESULTS") return (s.phaseData?.deathsText ? s.phaseData.deathsText + " " : "") + "Résultats du jour, puis passage à la nuit.";
  if (p === "REVENGE") return "Chef de sécurité : tu as été éjecté, tu peux tirer sur quelqu'un.";
  if (p === "MANUAL_ROLE_PICK") return "Mode manuel : chaque joueur choisit son rôle (cartes physiques), puis tout le monde valide.";
  if (p === "GAME_ABORTED") return "Partie interrompue.";
  return "";
}

function makeChoiceGrid(ids, verb, onPick) {
  const grid = document.createElement("div");
  grid.className = "choice-grid";

  const playersById = new Map(state.players.map(p => [p.playerId, p]));
  for (const id of ids) {
    const p = playersById.get(id);
    if (!p) continue;
    const card = document.createElement("div");
    card.className = "choice-card";
    card.innerHTML = `<div style="font-weight:900; font-size:1.1rem;">${escapeHtml(p.name)}</div>
      ${p.isCaptain ? `<div style="opacity:.85; margin-top:4px;">⭐ Capitaine</div>` : ""}`;
    card.onclick = () => onPick(id);
    grid.appendChild(card);
  }
  return grid;
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
    this.userUnlocked = false;
    this.muted = sessionStorage.getItem("is_muted") === "1";

    this._manifest = null;
    this._manifestPromise = null;
    this._homeIntroPlayed = false;

    this.updateButton();

    // Autoplay restrictions: unlock on first user gesture then replay pending cue.
    const unlockOnce = () => this.unlock();
    window.addEventListener("pointerdown", unlockOnce, { once: true, passive: true });
    window.addEventListener("keydown", unlockOnce, { once: true });
  }

  async loadManifest() {
    if (this._manifest) return this._manifest;
    if (this._manifestPromise) return this._manifestPromise;
    this._manifestPromise = fetch("/sounds/audio-manifest.json", { cache: "no-store" })
      .then(r => (r.ok ? r.json() : null))
      .catch(() => null)
      .then(obj => {
        this._manifest = (obj && typeof obj === "object") ? obj : {};
        return this._manifest;
      });
    return this._manifestPromise;
  }

  async urlForKey(key) {
    const m = await this.loadManifest();
    const f = m?.[key];
    if (!f) return null;
    return `/sounds/${f}`;
  }

  async playHomeIntro() {
    if (this._homeIntroPlayed) return;
    if (this.muted) return;
    // Avoid starting the intro if we're already in a room.
    if (state?.roomCode) return;
    const url = await this.urlForKey("INTRO_LOBBY");
    if (!url) return;
    this._homeIntroPlayed = true;
    this.play({ file: url, queueLoopFile: null, tts: null }, true);
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
    this.userUnlocked = true;
    if (!this.muted && this.pendingCue) {
      const cue = this.pendingCue;
      this.pendingCue = null;
      this.play(cue, true);
    }
  }
  stopAll() {
    try {
      if (this.audio) { this.audio.pause(); this.audio.currentTime = 0; }
      if (this.loopAudio) { this.loopAudio.pause(); this.loopAudio.currentTime = 0; }
    } catch {}
    this.audio = null;
    this.loopAudio = null;
    try { window.speechSynthesis.cancel(); } catch {}
  }

  play(cue, force=false) {
    this.lastCue = cue;
    const token = JSON.stringify([cue?.sequence || null, cue?.file || null, cue?.queueLoopFile || null, cue?.tts || null, state?.phase || null]);
    if (!force && token === this.token) return;
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
          if (loop) this.playLoop(loop);
          return;
        }
        const url = seq[i++];
        const a = new Audio(url);
        a.volume = 1.0;
        this.audio = a;
        a.play().catch((err) => {
          if (err && err.name === "NotAllowedError") {
            this.pendingCue = cue;
          } else if (ttsText) {
            this.tts(ttsText);
          }
        });
        a.onended = () => playNext();
      };
      playNext();
      return;
    }

    const primary = cue.file || null;

    if (primary) {
      const a = new Audio(primary);
      a.volume = 1.0;
      this.audio = a;
      a.play().catch((err) => {
        if (err && err.name === "NotAllowedError") {
          this.pendingCue = cue;
        } else {
          this.tts(ttsText);
        }
      });
      a.onended = () => {
        if (this.token !== token) return;
        if (loop) this.playLoop(loop);
      };
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
    const a = new Audio(url);
    a.loop = true;
    a.volume = 1.0;
    this.loopAudio = a;
    a.play().catch((err) => {
      if (err && err.name === "NotAllowedError") {
        this.pendingCue = this.lastCue || { queueLoopFile: url };
      }
    });
  }
  tts(text) {
    if (!text || this.muted) return;
    try {
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

// Home: start lobby intro as soon as the user starts typing their name (autoplay-safe).
const nameInput = $("playerName");
if (nameInput) {
  const trigger = () => audioManager.playHomeIntro();
  nameInput.addEventListener("focus", trigger, { passive: true });
  nameInput.addEventListener("input", trigger, { passive: true });
  nameInput.addEventListener("keydown", trigger);
}

// ---------- Rules modal ----------
function buildRulesHtml(cfg) {
  const enabled = cfg?.rolesEnabled || {};
  const on = (k) => !!enabled[k];

  const roleLines = [];
  roleLines.push(`<li><b>Astronaute</b> — aucun pouvoir particulier. Vote le jour.</li>`);
  roleLines.push(`<li><b>Saboteur</b> — vote la nuit avec les autres saboteurs pour éjecter une cible (unanimité).</li>`);
  if (on("radar")) roleLines.push(`<li><b>Officier radar</b> — chaque nuit, inspecte un joueur et découvre son rôle (résultat visible dans le menu des phases).</li>`);
  if (on("doctor")) roleLines.push(`<li><b>Docteur bio</b> — 1 potion de vie (protège la cible attaquée) + 1 potion de mort (éjecte une cible) sur toute la partie.</li>`);
  if (on("chameleon")) roleLines.push(`<li><b>Caméléon</b> — Nuit 1 : échange secrètement son rôle avec un joueur (une seule fois).</li>`);
  if (on("security")) roleLines.push(`<li><b>Chef de sécurité</b> — s’il est éjecté, peut se venger en ciblant un joueur.</li>`);
  if (on("ai_agent")) roleLines.push(`<li><b>Agent IA</b> — Nuit 1 : se lie à un autre joueur (liaison permanente). Si l’un est éjecté, l’autre l’est aussi.</li>`);
  if (on("engineer")) roleLines.push(`<li><b>Ingénieur</b> — peut espionner à ses risques et périls (rappel discret au début de la nuit).</li>`);

  return `
    <div style="opacity:.95;">
      <h3 style="margin:10px 0;">Rôles</h3>
      <ul>${roleLines.join("")}</ul>

      <h3 style="margin:10px 0;">Ordre de la nuit</h3>
      <ol>
        <li>Caméléon (Nuit 1)</li>
        <li>Agent IA (Nuit 1)</li>
        <li>Officier radar</li>
        <li>Saboteurs (unanimité)</li>
        <li>Docteur bio</li>
        <li>Résolution + vengeance + liaisons</li>
      </ol>

      <h3 style="margin:10px 0;">Jour</h3>
      <ul>
        <li>Réveil de la station</li>
        <li><b>Élection du Chef de station obligatoire</b> (capitaine)</li>
        <li>En cas d’égalité, la voix du capitaine compte <b>double</b> / il tranche</li>
        <li>Si le capitaine est éjecté : il transmet immédiatement le rôle de capitaine à un survivant <b>sans connaître son rôle</b></li>
        <li>Vote d’éjection</li>
      </ul>

      <h3 style="margin:10px 0;">Victoire</h3>
      <ul>
        <li><b>Astronautes</b> : tous les saboteurs sont éjectés.</li>
        <li><b>Saboteurs</b> : supériorité numérique (parité ou plus).</li>
        <li><b>Association de malfaiteurs</b> : s’il ne reste que 2 joueurs vivants, liés ensemble, et de camps différents, ils gagnent ensemble.</li>
      </ul>

      <h3 style="margin:10px 0;">Nombre de saboteurs</h3>
      <div>Le nombre de saboteurs est automatique :</div>
      <ul>
        <li>0–6 joueurs : <b>1</b> saboteur</li>
        <li>7–11 joueurs : <b>2</b> saboteurs</li>
        <li>12+ joueurs : <b>3</b> saboteurs</li>
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

  socket.emit("createRoom", { playerId, name }, (res) => {
    if (!res?.ok) return setError(res?.error || "Erreur création");
    sessionStorage.setItem(STORAGE.room, res.roomCode);
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

  socket.emit("joinRoom", { playerId, name, roomCode }, (res) => {
    if (!res?.ok) return setError(res?.error || "Erreur connexion");
    clearError();
  });
};

// auto reconnect on load
window.addEventListener("load", () => {
  const name = (sessionStorage.getItem(STORAGE.name) || "").trim();
  const roomCode = (sessionStorage.getItem(STORAGE.room) || "").trim();
  if (name && roomCode) {
    socket.emit("reconnectRoom", { playerId, name, roomCode }, (res) => {
      if (!res?.ok) {
        // maybe removed after 30s; fallback to join screen with code prefilled
        $("joinRoomCode").value = roomCode;
        showScreen("joinScreen");
      }
    });
  }
});

// receive state
socket.on("roomState", (s) => {
  state = s;
  refreshBuildBadge();

  // If we are in lobby/game and the server thinks we have no room (rare), reset
  if (!state?.roomCode) return;

  // audio per phase
  audioManager.play(state.audio);

  // If we are ended, show end.
  render();
});

socket.on("serverHello", () => {
  // On reconnect, do NOT force the user back to the home screen.
  // If we have a persisted session (name + room code), attempt a reconnect.
  clearError();

  // If we already have a room state, keep the current screen.
  if (state?.roomCode) return;

  const savedName = (sessionStorage.getItem(STORAGE.name) || "").trim();
  const savedRoom = (sessionStorage.getItem(STORAGE.room) || "").trim();

  if (savedName && savedRoom) {
    // Try to re-attach to the room without changing screens.
    socket.emit("reconnectRoom", { playerId, name: savedName, roomCode: savedRoom }, (res) => {
      if (!res?.ok) {
        // If the room is gone, fall back to join screen with the code prefilled.
        $("joinRoomCode").value = savedRoom;
        showScreen("joinScreen");
      }
    });
    return;
  }

  // No session: default to home.
  showScreen("homeScreen");
});

// fallback render if no state yet
showScreen("homeScreen");
