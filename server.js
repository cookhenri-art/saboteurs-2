const path = require("path");
const fs = require("fs");
const http = require("http");
const express = require("express");
const { Server } = require("socket.io");

const PORT = process.env.PORT || 3000;
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, "data");
const STATS_FILE = path.join(DATA_DIR, "stats.json");
fs.mkdirSync(DATA_DIR, { recursive: true });

// ----------------- helpers -----------------
const nowMs = () => Date.now();
function normalize(str) {
  return String(str || "")
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = randInt(0, i);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function uniq(arr) { return Array.from(new Set(arr)); }
function countSaboteursFor(n) { return n <= 6 ? 1 : (n <= 11 ? 2 : 3); }
function genRoomCode(existing) {
  for (let i = 0; i < 2000; i++) {
    const code = String(randInt(0, 9999)).padStart(4, "0");
    if (!existing.has(code)) return code;
  }
  return String(randInt(0, 999999)).padStart(6, "0");
}

// ----------------- stats persistence -----------------
function loadStats() {
  try {
    if (!fs.existsSync(STATS_FILE)) return {};
    return JSON.parse(fs.readFileSync(STATS_FILE, "utf-8")) || {};
  } catch {
    return {};
  }
}
function saveStats(db) {
  try {
    fs.writeFileSync(STATS_FILE, JSON.stringify(db, null, 2), "utf-8");
  } catch (e) {
    console.error("[stats] save error", e);
  }
}
const statsDb = loadStats();
function ensurePlayerStats(name) {
  if (!statsDb[name]) {
    statsDb[name] = {
      gamesPlayed: 0, wins: 0, losses: 0,
      winsByRole: {}, gamesByRole: {},
      doctorSaves: 0, doctorKills: 0,
      radarInspects: 0, radarCorrect: 0,
      chameleonSwaps: 0, securityRevengeShots: 0
    };
  }
  return statsDb[name];
}

// ----------------- assets auto-map (audio) -----------------
function listPublicFiles(relDir) {
  const full = path.join(__dirname, "public", relDir);
  if (!fs.existsSync(full)) return [];
  return fs.readdirSync(full).filter(f => !f.startsWith("."));
}
const soundFiles = listPublicFiles("sounds");
const soundIndex = new Map(soundFiles.map(f => [normalize(f), f]));
function findSoundByKeywords(keywords) {
  const wants = (keywords || []).map(normalize).filter(Boolean);
  for (const [normName, realName] of soundIndex.entries()) {
    let ok = true;
    for (const w of wants) { if (!normName.includes(w)) { ok = false; break; } }
    if (ok) return "/sounds/" + realName;
  }
  return null;
}
const AUDIO = {
  GENERIC_MAIN: findSoundByKeywords(["generique"]) || null,
  INTRO_LOBBY: findSoundByKeywords(["attente", "lancement"]) || null,
  ELECTION_CHIEF: findSoundByKeywords(["election", "chef"]) || findSoundByKeywords(["election"]) || null,
  STATION_SLEEP: findSoundByKeywords(["station", "endort"]) || null,
  CHAMELEON_WAKE: findSoundByKeywords(["cameleon", "reveil"]) || null,
  RADAR_WAKE: findSoundByKeywords(["radar", "reveil"]) || null,
  SABOTEURS_WAKE: findSoundByKeywords(["saboteurs", "reveil"]) || null,
  DOCTOR_WAKE: findSoundByKeywords(["docteur", "reveil"]) || null,
  WAIT_SABOTEURS: findSoundByKeywords(["attente", "saboteurs"]) || null,
  STATION_VOTE: findSoundByKeywords(["station", "vote"]) || null,
  WAIT_DAYVOTE: findSoundByKeywords(["attente", "journee"]) || null,
  WAKE_LIGHT: findSoundByKeywords(["coeur", "leger"]) || null,
  WAKE_HEAVY: findSoundByKeywords(["coeur", "lourd"]) || null,
  REVENGE: findSoundByKeywords(["venge"]) || null,
  END_SONG: findSoundByKeywords(["ecran", "fin"]) || null,
  END_OUTRO: findSoundByKeywords(["outro", "fin"]) || null
};

// ----------------- roles -----------------
const ROLES = {
  astronaut: { label: "Astronaute", icon: "/images/roles/astronaute.png", team: "astronauts" },
  saboteur: { label: "Saboteur", icon: "/images/roles/saboteur.png", team: "saboteurs" },
  doctor: { label: "Docteur bio", icon: "/images/roles/docteur.png", team: "astronauts" },
  security: { label: "Chef de sécurité", icon: "/images/roles/chef-securite.png", team: "astronauts" },
  ai_agent: { label: "Agent IA", icon: "/images/roles/liaison-ia.png", team: "astronauts" },
  radar: { label: "Officier radar", icon: "/images/roles/radar.png", team: "astronauts" },
  engineer: { label: "Ingénieur", icon: "/images/roles/ingenieur.png", team: "astronauts" },
  chameleon: { label: "Caméléon", icon: "/images/roles/cameleon.png", team: "astronauts" }
};
const CAPTAIN_ICON = "/images/roles/capitaine.png";

function defaultConfig() {
  return {
    rolesEnabled: {
      doctor: true,
      security: true,
      radar: true,
      ai_agent: true,
      engineer: true,
      chameleon: true
    },
    manualRoles: false
  };
}

// ----------------- room model -----------------
function newRoom(code, hostPlayerId) {
  return {
    code,
    hostPlayerId,
    config: defaultConfig(),

    started: false,
    ended: false,
    aborted: false,

    phase: "LOBBY",
    phaseData: {},
    phaseAck: new Set(),

    day: 0,
    night: 0,

    players: new Map(),     // playerId -> player
    timers: new Map(),      // playerId -> {notifyTimer, removeTimer}
    matchLog: [],

    // consumables
    doctorLifeUsed: false,
    doctorDeathUsed: false,
    chameleonUsed: false,

    nightData: {},
    audio: { file: null, queueLoopFile: null, tts: null }
  };
}

function logEvent(room, type, data = {}) {
  room.matchLog.push({ t: nowMs(), type, ...data });
  if (room.matchLog.length > 300) room.matchLog.shift();
}

function alivePlayers(room) {
  return Array.from(room.players.values()).filter(p => p.status === "alive");
}
function activePlayers(room) {
  return Array.from(room.players.values()).filter(p => p.status !== "left");
}
function getPlayer(room, playerId) { return room.players.get(playerId) || null; }
function getRoleHolder(room, roleKey) {
  return Array.from(room.players.values()).find(p => p.status === "alive" && p.role === roleKey) || null;
}
function getAliveByRole(room, roleKey) {
  return Array.from(room.players.values()).filter(p => p.status === "alive" && p.role === roleKey);
}
function getCaptain(room) {
  return Array.from(room.players.values()).find(p => p.isCaptain) || null;
}
function hasAliveRole(room, roleKey) { return !!getRoleHolder(room, roleKey); }

function computeTeams(room) {
  const alive = alivePlayers(room);
  const sab = alive.filter(p => p.role === "saboteur").length;
  return { saboteurs: sab, astronauts: alive.length - sab, aliveTotal: alive.length };
}

function ensureMinPlayers(room) {
  const alive = alivePlayers(room).length;
  if (room.started && !room.ended && alive < 4) {
    room.aborted = true;
    setPhase(room, "GAME_ABORTED", { reason: "Pas assez de joueurs (moins de 4)." });
    logEvent(room, "game_aborted", { alive });
  }
}

function computeAudioCue(room) {
  const phase = room.phase;
  const data = room.phaseData || {};
  if (phase === "LOBBY") return { file: AUDIO.INTRO_LOBBY, queueLoopFile: null, tts: "Lobby. Préparez la mission." };
  if (phase === "MANUAL_ROLE_PICK") return { file: AUDIO.GENERIC_MAIN, queueLoopFile: null, tts: "Mode manuel. Choisissez votre rôle." };
  if (phase === "ROLE_REVEAL") return { file: AUDIO.GENERIC_MAIN, queueLoopFile: null, tts: "Vérifiez votre rôle." };
  if (phase === "CAPTAIN_CANDIDACY" || phase === "CAPTAIN_VOTE") return { file: AUDIO.ELECTION_CHIEF, queueLoopFile: null, tts: "Élection du chef de station." };

  if (phase === "NIGHT_START") return { file: AUDIO.STATION_SLEEP, queueLoopFile: null, tts: "La station s'endort." };
  if (phase === "NIGHT_CHAMELEON") return { file: AUDIO.CHAMELEON_WAKE, queueLoopFile: null, tts: "Caméléon, réveille-toi." };
  if (phase === "NIGHT_AI_AGENT") return { file: null, queueLoopFile: null, tts: "Agent IA, réveille-toi." };
  if (phase === "NIGHT_RADAR") return { file: AUDIO.RADAR_WAKE, queueLoopFile: null, tts: "Officier radar, réveille-toi." };
  if (phase === "NIGHT_SABOTEURS") return { file: AUDIO.SABOTEURS_WAKE, queueLoopFile: AUDIO.WAIT_SABOTEURS, tts: "Saboteurs, choisissez une cible. Unanimité requise." };
  if (phase === "NIGHT_DOCTOR") return { file: AUDIO.DOCTOR_WAKE, queueLoopFile: null, tts: "Docteur bio, choisissez votre action." };
  if (phase === "NIGHT_RESULTS") return { file: null, queueLoopFile: null, tts: "Résultats de la nuit." };

  if (phase === "DAY_WAKE") return { file: data.anyDeaths ? AUDIO.WAKE_HEAVY : AUDIO.WAKE_LIGHT, queueLoopFile: null, tts: "La station se réveille." };
  if (phase === "DAY_CAPTAIN_TRANSFER") return { file: null, queueLoopFile: null, tts: "Transmission du capitaine." };
  if (phase === "DAY_VOTE") return { file: AUDIO.STATION_VOTE, queueLoopFile: AUDIO.WAIT_DAYVOTE, tts: "Vote d'éjection." };
  if (phase === "DAY_TIEBREAK") return { file: null, queueLoopFile: null, tts: "Égalité. Capitaine, tranche." };

  if (phase === "REVENGE") return { file: AUDIO.REVENGE, queueLoopFile: null, tts: "Chef de sécurité, vengeance." };
  if (phase === "GAME_OVER") return { file: AUDIO.END_SONG || AUDIO.END_OUTRO, queueLoopFile: null, tts: "Fin de partie." };
  if (phase === "GAME_ABORTED") return { file: null, queueLoopFile: null, tts: "Partie interrompue." };

  return { file: null, queueLoopFile: null, tts: null };
}

function setPhase(room, phase, data = {}) {
  room.phase = phase;
  room.phaseData = data;
  room.phaseAck = new Set();
  room.audio = computeAudioCue(room);
  logEvent(room, "phase", { phase });
}

function requiredPlayersForPhase(room) {
  const alive = alivePlayers(room).map(p => p.playerId);
  const d = room.phaseData || {};
  switch (room.phase) {
    case "LOBBY": return alive;
    case "MANUAL_ROLE_PICK": return alive;
    case "ROLE_REVEAL": return alive;
    case "CAPTAIN_CANDIDACY": return alive;
    case "CAPTAIN_VOTE": return alive;
    case "NIGHT_START": return alive;
    case "NIGHT_CHAMELEON": return d.actorId ? [d.actorId] : [];
    case "NIGHT_AI_AGENT": return d.actorId ? [d.actorId] : [];
    case "NIGHT_RADAR": return d.actorId ? [d.actorId] : [];
    case "NIGHT_SABOTEURS": return d.actorIds || [];
    case "NIGHT_DOCTOR": return d.actorId ? [d.actorId] : [];
    case "NIGHT_RESULTS": return alive;
    case "DAY_WAKE": return alive;
    case "DAY_CAPTAIN_TRANSFER": return d.actorId ? [d.actorId] : [];
    case "DAY_VOTE": return alive;
    case "DAY_TIEBREAK": return d.actorId ? [d.actorId] : [];
    case "REVENGE": return d.actorId ? [d.actorId] : [];
    case "GAME_OVER": return alive;
    case "GAME_ABORTED": return alive;
    default: return alive;
  }
}

function ack(room, playerId) {
  room.phaseAck.add(playerId);
  const required = requiredPlayersForPhase(room);
  return room.phaseAck.size >= required.length;
}

function applyLinkCascade(room) {
  let changed = true;
  const seen = new Set();
  while (changed) {
    changed = false;
    for (const p of room.players.values()) {
      if (!p.linkedTo) continue;
      const key = [p.playerId, p.linkedTo].sort().join("-");
      if (seen.has(key)) continue;
      const other = room.players.get(p.linkedTo);
      if (!other) continue;
      if (p.status !== "alive" && other.status === "alive") {
        killPlayer(room, other.playerId, "link");
        changed = true;
      } else if (other.status !== "alive" && p.status === "alive") {
        killPlayer(room, p.playerId, "link");
        changed = true;
      }
      seen.add(key);
    }
  }
}

function killPlayer(room, playerId, source, extra = {}) {
  const p = room.players.get(playerId);
  if (!p || p.status !== "alive") return;
  p.status = "dead";
  logEvent(room, "player_died", { playerId, source, ...extra });
}

function checkWin(room) {
  if (room.aborted) return null;
  const { saboteurs, astronauts, aliveTotal } = computeTeams(room);
  if (aliveTotal < 4) { ensureMinPlayers(room); if (room.aborted) return "ABORTED"; }
  if (saboteurs === 0) return "ASTRONAUTES";
  if (saboteurs >= astronauts) {
    // special 2v2 before night: allow if can flip
    if (aliveTotal === 4 && saboteurs === 2 && astronauts === 2) {
      const canFlip =
        (!room.doctorDeathUsed && hasAliveRole(room, "doctor")) ||
        (!room.doctorLifeUsed && hasAliveRole(room, "doctor")) ||
        hasAliveRole(room, "security") ||
        (room.night === 1 && hasAliveRole(room, "chameleon") && !room.chameleonUsed);
      if (canFlip) return null;
    }
    return "SABOTEURS";
  }
  return null;
}

function endGame(room, winner) {
  room.ended = true;
  setPhase(room, "GAME_OVER", { winner });
  logEvent(room, "game_over", { winner });

  // persist stats per name
  for (const p of room.players.values()) {
    if (p.status === "left") continue;
    const st = ensurePlayerStats(p.name);
    st.gamesPlayed += 1;
    const role = p.role || "unknown";
    st.gamesByRole[role] = (st.gamesByRole[role] || 0) + 1;
    const team = ROLES[role]?.team || "astronauts";
    const win = (winner === "ASTRONAUTES" && team === "astronauts") ||
                (winner === "SABOTEURS" && team === "saboteurs");
    if (win) st.wins += 1;
    else st.losses += 1;
    if (win) st.winsByRole[role] = (st.winsByRole[role] || 0) + 1;
  }
  saveStats(statsDb);
}

// ----------------- role assignment -----------------
function buildRolePool(room) {
  const n = room.players.size;
  const sabCount = countSaboteursFor(n);
  const enabled = room.config.rolesEnabled || {};
  const pool = [];
  for (let i = 0; i < sabCount; i++) pool.push("saboteur");
  const specials = [];
  if (enabled.chameleon) specials.push("chameleon");
  if (enabled.ai_agent) specials.push("ai_agent");
  if (enabled.radar) specials.push("radar");
  if (enabled.doctor) specials.push("doctor");
  if (enabled.security) specials.push("security");
  if (enabled.engineer) specials.push("engineer");
  const maxSpecials = Math.max(0, n - sabCount);
  specials.splice(maxSpecials);
  pool.push(...specials);
  while (pool.length < n) pool.push("astronaut");
  return pool;
}

function assignRolesAuto(room) {
  const players = shuffle(Array.from(room.players.values()));
  const pool = shuffle(buildRolePool(room));
  for (let i = 0; i < players.length; i++) players[i].role = pool[i] || "astronaut";
  room.doctorLifeUsed = false;
  room.doctorDeathUsed = false;
  room.chameleonUsed = false;
  logEvent(room, "roles_assigned", {});
}

function resetForNewRound(room, keepStats) {
  room.started = false;
  room.ended = false;
  room.aborted = false;
  room.phase = "LOBBY";
  room.phaseData = {};
  room.phaseAck = new Set();
  room.day = 0;
  room.night = 0;
  room.matchLog = [];
  room.nightData = {};
  room.doctorLifeUsed = false;
  room.doctorDeathUsed = false;
  room.chameleonUsed = false;

  for (const p of room.players.values()) {
    p.ready = false;
    p.status = "alive";
    p.role = null;
    p.isCaptain = false;
    p.linkedTo = null;
    p.linkedName = null;
  }

  if (!keepStats) {
    const names = Array.from(room.players.values()).map(p => p.name);
    for (const n of names) delete statsDb[n];
    saveStats(statsDb);
  }

  setPhase(room, "LOBBY", {});
  logEvent(room, "reset_game", { keepStats });
}

// ----------------- game progression -----------------
function startGame(room) {
  room.started = true;
  room.ended = false;
  room.aborted = false;
  room.day = 0;
  room.night = 0;

  // clear captain
  for (const p of room.players.values()) p.isCaptain = false;

  if (room.config.manualRoles) {
    // Enforce exact counts based on pool
    const pool = buildRolePool(room);
    const remaining = {};
    for (const r of pool) remaining[r] = (remaining[r] || 0) + 1;
    setPhase(room, "MANUAL_ROLE_PICK", { remaining, picks: {} });
  } else {
    assignRolesAuto(room);
    setPhase(room, "ROLE_REVEAL", {});
  }
}

function beginCaptainElection(room) {
  setPhase(room, "CAPTAIN_CANDIDACY", { candidacies: {} });
}

function finishCaptainCandidacy(room) {
  const alive = alivePlayers(room).map(p => p.playerId);
  const cand = room.phaseData.candidacies || {};
  const candidates = alive.filter(id => cand[id] === true);
  if (candidates.length === 0) {
    setPhase(room, "CAPTAIN_CANDIDACY", { candidacies: {}, error: "Aucun candidat. Recommencez." });
    return;
  }
  setPhase(room, "CAPTAIN_VOTE", { candidates, votes: {} });
}

function finishCaptainVote(room) {
  const votes = room.phaseData.votes || {};
  const candidates = room.phaseData.candidates || [];
  const counts = {};
  for (const voterId of Object.keys(votes)) {
    const target = votes[voterId];
    if (!candidates.includes(target)) continue;
    counts[target] = (counts[target] || 0) + 1;
  }
  let best = [];
  let bestN = -1;
  for (const c of candidates) {
    const n = counts[c] || 0;
    if (n > bestN) { bestN = n; best = [c]; }
    else if (n === bestN) best.push(c);
  }
  if (best.length !== 1) {
    setPhase(room, "CAPTAIN_VOTE", { candidates: best, votes: {}, tie: true });
    return;
  }
  for (const p of room.players.values()) p.isCaptain = false;
  const cap = room.players.get(best[0]);
  if (cap) cap.isCaptain = true;
  logEvent(room, "captain_elected", { playerId: best[0] });

  beginNight(room);
}

function beginNight(room) {
  room.night += 1;
  room.nightData = {
    saboteurTarget: null,
    doctorSave: null,
    doctorKill: null,
    aiLinked: false,
    radarDone: false,
    saboteurDone: false,
    doctorDone: false,
    chameleonDone: false
  };
  setPhase(room, "NIGHT_START", { engineerReminder: hasAliveRole(room, "engineer") });
}

function nextNightPhase(room) {
  // order: chameleon (night1), ai (night1), radar, saboteurs, doctor, resolve
  if (room.night === 1 && room.config.rolesEnabled?.chameleon && !room.chameleonUsed) {
    const cham = getRoleHolder(room, "chameleon");
    if (cham) { setPhase(room, "NIGHT_CHAMELEON", { actorId: cham.playerId }); return; }
  }
  if (room.night === 1 && room.config.rolesEnabled?.ai_agent && !room.nightData.aiLinked) {
    const ai = getRoleHolder(room, "ai_agent");
    if (ai) { setPhase(room, "NIGHT_AI_AGENT", { actorId: ai.playerId }); return; }
  }
  if (room.config.rolesEnabled?.radar && !room.nightData.radarDone) {
    const radar = getRoleHolder(room, "radar");
    if (radar) { setPhase(room, "NIGHT_RADAR", { actorId: radar.playerId, lastRadarResult: null }); return; }
  }
  const sab = getAliveByRole(room, "saboteur");
  if (sab.length > 0 && !room.nightData.saboteurDone) {
    setPhase(room, "NIGHT_SABOTEURS", { actorIds: sab.map(p => p.playerId), votes: {} });
    return;
  }
  if (room.config.rolesEnabled?.doctor && !room.nightData.doctorDone) {
    const doc = getRoleHolder(room, "doctor");
    if (doc) { setPhase(room, "NIGHT_DOCTOR", { actorId: doc.playerId, lifeUsed: room.doctorLifeUsed, deathUsed: room.doctorDeathUsed }); return; }
  }
  resolveNight(room);
}

function resolveNight(room) {
  const nd = room.nightData || {};
  const killed = new Set();
  if (nd.saboteurTarget && nd.saboteurTarget !== nd.doctorSave) killed.add(nd.saboteurTarget);
  if (nd.doctorKill) killed.add(nd.doctorKill);

  const newlyDead = [];
  for (const pid of killed) {
    const p = room.players.get(pid);
    if (p && p.status === "alive") newlyDead.push(pid);
  }
  for (const pid of newlyDead) killPlayer(room, pid, "night");

  const securityDied = newlyDead.find(pid => room.players.get(pid)?.role === "security");
  if (securityDied) {
    setPhase(room, "REVENGE", { actorId: securityDied, context: "night", options: alivePlayers(room).map(p => p.playerId) });
    return;
  }

  applyLinkCascade(room);

  const winner = checkWin(room);
  if (winner) { endGame(room, winner); return; }

  setPhase(room, "NIGHT_RESULTS", { newlyDead, anyDeaths: newlyDead.length > 0 });
}

function beginDay(room, anyDeaths) {
  room.day += 1;
  setPhase(room, "DAY_WAKE", { anyDeaths: !!anyDeaths });
}

function proceedDayAfterWake(room) {
  const deadCaptain = Array.from(room.players.values()).find(p => p.isCaptain && p.status !== "alive");
  if (deadCaptain) {
    // fallback if not connected
    if (!deadCaptain.connected || deadCaptain.status === "left") {
      const alive = alivePlayers(room);
      if (alive.length > 0) {
        const pick = alive[randInt(0, alive.length - 1)];
        for (const p of room.players.values()) p.isCaptain = false;
        pick.isCaptain = true;
        logEvent(room, "captain_transferred_fallback", { from: deadCaptain.playerId, to: pick.playerId });
      }
      setPhase(room, "DAY_VOTE", { votes: {} });
      return;
    }
    setPhase(room, "DAY_CAPTAIN_TRANSFER", { actorId: deadCaptain.playerId, options: alivePlayers(room).map(p => p.playerId) });
    return;
  }
  setPhase(room, "DAY_VOTE", { votes: {} });
}

function finishCaptainTransfer(room, chosenId) {
  const chosen = room.players.get(chosenId);
  if (!chosen || chosen.status !== "alive") return;
  for (const p of room.players.values()) p.isCaptain = false;
  chosen.isCaptain = true;
  logEvent(room, "captain_transferred", { to: chosenId });
  setPhase(room, "DAY_VOTE", { votes: {} });
}

function finishDayVote(room) {
  const votes = room.phaseData.votes || {};
  const alive = alivePlayers(room).map(p => p.playerId);
  const counts = {};
  for (const voter of alive) {
    const t = votes[voter];
    if (!t) continue;
    counts[t] = (counts[t] || 0) + 1;
  }
  let best = [];
  let bestN = -1;
  for (const pid of alive) {
    const n = counts[pid] || 0;
    if (n > bestN) { bestN = n; best = [pid]; }
    else if (n === bestN) best.push(pid);
  }
  if (bestN <= 0) best = alive.slice();

  if (best.length !== 1) {
    const cap = getCaptain(room);
    if (cap && cap.status === "alive") {
      setPhase(room, "DAY_TIEBREAK", { actorId: cap.playerId, options: best });
      return;
    }
    const pick = best[randInt(0, best.length - 1)];
    executeEjection(room, pick, "tie_random");
    return;
  }
  executeEjection(room, best[0], "vote");
}

function executeEjection(room, ejectedId, reason) {
  const p = room.players.get(ejectedId);
  if (!p || p.status !== "alive") return;

  killPlayer(room, ejectedId, "day", { reason });

  if (p.role === "security") {
    setPhase(room, "REVENGE", { actorId: ejectedId, context: "day", options: alivePlayers(room).map(p => p.playerId) });
    return;
  }

  applyLinkCascade(room);

  const winner = checkWin(room);
  if (winner) { endGame(room, winner); return; }

  beginNight(room);
}

function afterRevenge(room, context) {
  applyLinkCascade(room);

  const winner = checkWin(room);
  if (winner) { endGame(room, winner); return; }

  if (context === "night") setPhase(room, "NIGHT_RESULTS", { newlyDead: [], anyDeaths: true });
  else beginNight(room);
}

// ----------------- state for client -----------------
function formatLogLine(room, e) {
  const t = new Date(e.t).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  const name = (id) => room.players.get(id)?.name || "???";
  switch (e.type) {
    case "phase": return { kind: "info", text: `[${t}] ➜ Phase: ${e.phase}` };
    case "roles_assigned": return { kind: "info", text: `[${t}] Rôles attribués.` };
    case "captain_elected": return { kind: "info", text: `[${t}] ⭐ Capitaine: ${name(e.playerId)}` };
    case "player_died": return { kind: "info", text: `[${t}] ☠️ ${name(e.playerId)} est mort.` };
    case "player_left": return { kind: "warn", text: `[${t}] 🚪 ${name(e.playerId)} peut revenir (30s).` };
    case "player_removed": return { kind: "warn", text: `[${t}] ⛔ ${name(e.playerId)} est sorti.` };
    case "reconnected": return { kind: "info", text: `[${t}] ✅ ${name(e.playerId)} est revenu.` };
    case "game_over": return { kind: "info", text: `[${t}] 🏁 Fin: ${e.winner}` };
    default: return null;
  }
}

function publicRoomStateFor(room, viewerId) {
  const viewer = getPlayer(room, viewerId);
  const required = requiredPlayersForPhase(room);

  const players = Array.from(room.players.values()).map(p => {
    const base = {
      playerId: p.playerId,
      name: p.name,
      status: p.status,
      connected: !!p.connected,
      ready: !!p.ready,
      isHost: room.hostPlayerId === p.playerId,
      isCaptain: !!p.isCaptain
    };
    if (!room.started) return base;

    if (viewer && viewer.playerId === p.playerId) {
      base.role = p.role;
      base.roleLabel = ROLES[p.role]?.label || p.role;
      base.roleIcon = ROLES[p.role]?.icon || null;
    } else if (viewer && viewer.role === "saboteur" && p.role === "saboteur") {
      base.role = "saboteur";
      base.roleLabel = ROLES.saboteur.label;
      base.roleIcon = ROLES.saboteur.icon;
    } else {
      base.role = null;
      base.roleLabel = null;
      base.roleIcon = null;
    }
    return base;
  });

  const you = viewer ? {
    playerId: viewer.playerId,
    name: viewer.name,
    status: viewer.status,
    role: viewer.role,
    roleLabel: viewer.role ? (ROLES[viewer.role]?.label || viewer.role) : null,
    roleIcon: viewer.role ? (ROLES[viewer.role]?.icon || null) : null,
    isCaptain: !!viewer.isCaptain,
    captainIcon: viewer.isCaptain ? CAPTAIN_ICON : null,
    linkedTo: viewer.linkedTo,
    linkedName: viewer.linkedName
  } : null;

  const teams = computeTeams(room);
  const logs = room.matchLog.slice(-30).map(e => formatLogLine(room, e)).filter(Boolean);

  const privateLines = [];
  if (viewer && room.phase === "NIGHT_RADAR" && room.phaseData?.lastRadarResult?.viewerId === viewerId) {
    privateLines.push({ kind: "private", text: room.phaseData.lastRadarResult.text });
  }
  if (viewer && viewer.linkedTo) privateLines.push({ kind: "private", text: `🔗 Lié à ${viewer.linkedName || "?"}` });

  return {
    roomCode: room.code,
    phase: room.phase,
    phaseData: room.phaseData,
    started: room.started,
    ended: room.ended,
    aborted: room.aborted,
    day: room.day,
    night: room.night,
    config: room.config,
    audio: room.audio,
    ack: { done: room.phaseAck.size, total: required.length },
    teams,
    players,
    you,
    logs,
    privateLines
  };
}

// ----------------- socket server -----------------
const app = express();
app.use(express.static(path.join(__dirname, "public")));
app.get("/api/health", (req, res) => res.json({ ok: true }));
app.get("/api/assets/audio", (req, res) => res.json({ files: soundFiles, mapped: AUDIO }));

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const rooms = new Map();

function emitRoom(room) {
  for (const p of room.players.values()) {
    if (!p.connected || !p.socketId) continue;
    const sock = io.sockets.sockets.get(p.socketId);
    if (!sock) continue;
    sock.emit("roomState", publicRoomStateFor(room, p.playerId));
  }
}

function clearTimers(room, playerId) {
  const t = room.timers.get(playerId);
  if (!t) return;
  if (t.notifyTimer) clearTimeout(t.notifyTimer);
  if (t.removeTimer) clearTimeout(t.removeTimer);
  room.timers.delete(playerId);
}

function joinRoomCommon(socket, room, playerId, name) {
  let p = getPlayer(room, playerId);
  if (!p) {
    p = {
      playerId,
      name: name || "Joueur",
      socketId: socket.id,
      connected: true,
      status: "alive",
      ready: false,
      role: null,
      isCaptain: false,
      linkedTo: null,
      linkedName: null
    };
    room.players.set(playerId, p);
  } else {
    p.name = name || p.name;
    p.socketId = socket.id;
    p.connected = true;
  }

  socket.data.playerId = playerId;
  socket.data.roomCode = room.code;
  socket.join(room.code);

  clearTimers(room, playerId);
  logEvent(room, "reconnected", { playerId });
  emitRoom(room);
}

function scheduleDisconnect(room, playerId) {
  const p = getPlayer(room, playerId);
  if (!p) return;

  const notifyTimer = setTimeout(() => {
    const p2 = getPlayer(room, playerId);
    if (p2 && !p2.connected && p2.status !== "left") {
      logEvent(room, "player_left", { playerId });
      emitRoom(room);
    }
  }, 2000);

  const removeTimer = setTimeout(() => {
    const p3 = getPlayer(room, playerId);
    if (!p3 || p3.connected) return;
    p3.status = "left";
    p3.ready = false;
    logEvent(room, "player_removed", { playerId });

    // if phase waits on this actor, fallback
    if (room.phase === "DAY_CAPTAIN_TRANSFER" && room.phaseData?.actorId === playerId) {
      const alive = alivePlayers(room);
      if (alive.length > 0) {
        const pick = alive[randInt(0, alive.length - 1)];
        for (const pp of room.players.values()) pp.isCaptain = false;
        pick.isCaptain = true;
        logEvent(room, "captain_transferred_fallback", { from: playerId, to: pick.playerId });
      }
      setPhase(room, "DAY_VOTE", { votes: {} });
    }
    if (room.phase === "DAY_TIEBREAK" && room.phaseData?.actorId === playerId) {
      const opts = room.phaseData.options || alivePlayers(room).map(pp => pp.playerId);
      const pick = opts[randInt(0, opts.length - 1)];
      executeEjection(room, pick, "tiebreak_fallback");
    }
    if (room.phase === "REVENGE" && room.phaseData?.actorId === playerId) {
      const opts = alivePlayers(room).map(pp => pp.playerId);
      if (opts.length > 0) {
        const pick = opts[randInt(0, opts.length - 1)];
        killPlayer(room, pick, "revenge_fallback");
      }
      afterRevenge(room, room.phaseData.context);
    }

    // recalc ack (if fewer required now)
    handlePhaseMaybeComplete(room);

    ensureMinPlayers(room);
    emitRoom(room);
  }, 30000);

  room.timers.set(playerId, { notifyTimer, removeTimer });
}

function handlePhaseMaybeComplete(room) {
  const required = requiredPlayersForPhase(room);
  if (room.phaseAck.size >= required.length) handlePhaseCompletion(room);
}

function handlePhaseCompletion(room) {
  switch (room.phase) {
    case "MANUAL_ROLE_PICK":
      // if all picked, go reveal
      {
        const alive = alivePlayers(room).map(p => p.playerId);
        const picks = room.phaseData.picks || {};
        const ok = alive.every(id => !!picks[id]);
        if (ok) setPhase(room, "ROLE_REVEAL", {});
      }
      break;

    case "ROLE_REVEAL":
      beginCaptainElection(room);
      break;

    case "CAPTAIN_CANDIDACY":
      finishCaptainCandidacy(room);
      break;

    case "CAPTAIN_VOTE":
      finishCaptainVote(room);
      break;

    case "NIGHT_START":
      nextNightPhase(room);
      break;

    case "NIGHT_RESULTS":
      beginDay(room, room.phaseData?.anyDeaths);
      break;

    case "DAY_WAKE":
      proceedDayAfterWake(room);
      break;

    default:
      break;
  }
}

io.on("connection", (socket) => {
  socket.emit("serverHello", { ok: true });

  socket.on("createRoom", ({ playerId, name }, cb) => {
    try {
      const code = genRoomCode(rooms);
      const room = newRoom(code, playerId);
      rooms.set(code, room);
      joinRoomCommon(socket, room, playerId, name);
      cb && cb({ ok: true, roomCode: code, host: true });
    } catch (e) {
      console.error(e);
      cb && cb({ ok: false, error: "createRoom failed" });
    }
  });

  socket.on("joinRoom", ({ playerId, name, roomCode }, cb) => {
    const code = String(roomCode || "").trim();
    const room = rooms.get(code);
    if (!room) return cb && cb({ ok: false, error: "Room introuvable" });
    joinRoomCommon(socket, room, playerId, name);
    cb && cb({ ok: true, roomCode: code, host: room.hostPlayerId === playerId });
  });

  socket.on("reconnectRoom", ({ playerId, name, roomCode }, cb) => {
    const code = String(roomCode || "").trim();
    const room = rooms.get(code);
    if (!room) return cb && cb({ ok: false, error: "Room introuvable" });
    const p = getPlayer(room, playerId);
    if (!p) return cb && cb({ ok: false, error: "Joueur introuvable dans la room" });
    joinRoomCommon(socket, room, playerId, name || p.name);
    cb && cb({ ok: true, roomCode: code, host: room.hostPlayerId === playerId });
  });

  socket.on("setReady", ({ ready }, cb) => {
    const room = rooms.get(socket.data.roomCode);
    if (!room) return;
    const p = getPlayer(room, socket.data.playerId);
    if (!p || p.status !== "alive") return;
    p.ready = !!ready;
    emitRoom(room);
    cb && cb({ ok: true });
  });

  socket.on("updateConfig", ({ config }, cb) => {
    const room = rooms.get(socket.data.roomCode);
    if (!room) return;
    if (room.hostPlayerId !== socket.data.playerId) return cb && cb({ ok:false, error:"Only host" });
    if (room.started) return cb && cb({ ok:false, error:"Déjà commencé" });
    room.config = {
      rolesEnabled: {
        doctor: !!config?.rolesEnabled?.doctor,
        security: !!config?.rolesEnabled?.security,
        radar: !!config?.rolesEnabled?.radar,
        ai_agent: !!config?.rolesEnabled?.ai_agent,
        engineer: !!config?.rolesEnabled?.engineer,
        chameleon: !!config?.rolesEnabled?.chameleon
      },
      manualRoles: !!config?.manualRoles
    };
    emitRoom(room);
    cb && cb({ ok:true });
  });

  socket.on("startGame", (_, cb) => {
    const room = rooms.get(socket.data.roomCode);
    if (!room) return;
    if (room.hostPlayerId !== socket.data.playerId) return cb && cb({ ok:false, error:"Only host" });
    if (room.players.size < 4) return cb && cb({ ok:false, error:"Min 4 joueurs" });
    if (alivePlayers(room).some(p => !p.ready)) return cb && cb({ ok:false, error:"Tous doivent être prêts" });
    startGame(room);
    emitRoom(room);
    cb && cb({ ok:true });
  });

  socket.on("phaseAck", (_, cb) => {
    const room = rooms.get(socket.data.roomCode);
    if (!room) return;
    const playerId = socket.data.playerId;
    const p = getPlayer(room, playerId);
    if (!p || p.status !== "alive") return;

    const done = ack(room, playerId);
    emitRoom(room);
    if (done) {
      handlePhaseCompletion(room);
      emitRoom(room);
    }
    cb && cb({ ok:true });
  });

  socket.on("phaseAction", (payload, cb) => {
    const room = rooms.get(socket.data.roomCode);
    if (!room) return;
    const playerId = socket.data.playerId;
    const p = getPlayer(room, playerId);
    if (!p) return;

    const phase = room.phase;

    const isActor = (actorId) => actorId && actorId === playerId;

    // --- manual role pick ---
    if (phase === "MANUAL_ROLE_PICK") {
      if (p.status !== "alive") return;
      const roleKey = payload?.roleKey;
      const remaining = room.phaseData.remaining || {};
      const picks = room.phaseData.picks || {};
      if (!roleKey || !remaining[roleKey] || remaining[roleKey] <= 0) return cb && cb({ ok:false, error:"Rôle épuisé" });

      // return previous pick
      if (picks[playerId]) {
        remaining[picks[playerId]] = (remaining[picks[playerId]] || 0) + 1;
      }
      picks[playerId] = roleKey;
      remaining[roleKey] -= 1;

      p.role = roleKey;

      const done = ack(room, playerId);
      emitRoom(room);
      if (done) {
        handlePhaseCompletion(room);
        emitRoom(room);
      }
      cb && cb({ ok:true });
      return;
    }

    // --- captain candidacy ---
    if (phase === "CAPTAIN_CANDIDACY") {
      if (p.status !== "alive") return;
      room.phaseData.candidacies[playerId] = !!payload?.candidacy;
      const done = ack(room, playerId);
      emitRoom(room);
      if (done) { handlePhaseCompletion(room); emitRoom(room); }
      cb && cb({ ok:true });
      return;
    }

    // --- captain vote ---
    if (phase === "CAPTAIN_VOTE") {
      if (p.status !== "alive") return;
      const target = payload?.vote;
      const candidates = room.phaseData.candidates || [];
      if (!candidates.includes(target)) return;
      room.phaseData.votes[playerId] = target;
      const done = ack(room, playerId);
      emitRoom(room);
      if (done) { handlePhaseCompletion(room); emitRoom(room); }
      cb && cb({ ok:true });
      return;
    }

    // --- night: chameleon ---
    if (phase === "NIGHT_CHAMELEON") {
      if (!isActor(room.phaseData.actorId) || p.status !== "alive") return;
      if (room.night !== 1 || room.chameleonUsed) {
        room.chameleonUsed = true;
        nextNightPhase(room);
        emitRoom(room);
        return cb && cb({ ok:true });
      }
      const targetId = payload?.targetId;
      const tP = room.players.get(targetId);
      if (!tP || tP.status !== "alive") return;
      // swap roles
      const a = p.role;
      p.role = tP.role;
      tP.role = a;

      room.chameleonUsed = true;
      ensurePlayerStats(p.name).chameleonSwaps += 1;
      saveStats(statsDb);

      // everybody re-check role
      setPhase(room, "ROLE_REVEAL", { notice: "Les rôles ont pu changer. Revérifiez." });
      emitRoom(room);
      return cb && cb({ ok:true });
    }

    // --- night: ai agent ---
    if (phase === "NIGHT_AI_AGENT") {
      if (!isActor(room.phaseData.actorId) || p.status !== "alive") return;
      if (room.night !== 1) { room.nightData.aiLinked = true; nextNightPhase(room); emitRoom(room); return cb && cb({ ok:true }); }
      const a = payload?.a, b = payload?.b;
      if (!a || !b || a === b) return;
      const pa = room.players.get(a), pb = room.players.get(b);
      if (!pa || !pb || pa.status !== "alive" || pb.status !== "alive") return;
      pa.linkedTo = pb.playerId; pa.linkedName = pb.name;
      pb.linkedTo = pa.playerId; pb.linkedName = pa.name;
      room.nightData.aiLinked = true;
      nextNightPhase(room);
      emitRoom(room);
      return cb && cb({ ok:true });
    }

    // --- night: radar ---
    if (phase === "NIGHT_RADAR") {
      if (!isActor(room.phaseData.actorId) || p.status !== "alive") return;
      const targetId = payload?.targetId;
      const tP = room.players.get(targetId);
      if (!tP || tP.status !== "alive") return;
      const role = tP.role || "astronaut";
      room.phaseData.lastRadarResult = { viewerId: playerId, text: `🔍 Radar: ${tP.name} = ${ROLES[role]?.label || role}` };

      const st = ensurePlayerStats(p.name);
      st.radarInspects += 1;
      if (role === "saboteur") st.radarCorrect += 1;
      saveStats(statsDb);

      room.nightData.radarDone = true;
      nextNightPhase(room);
      emitRoom(room);
      return cb && cb({ ok:true });
    }

    // --- night: saboteurs (unanimity) ---
    if (phase === "NIGHT_SABOTEURS") {
      if (p.status !== "alive" || p.role !== "saboteur") return;
      const targetId = payload?.targetId;
      const tP = room.players.get(targetId);
      if (!tP || tP.status !== "alive") return;
      room.phaseData.votes[playerId] = targetId;

      const sabIds = (room.phaseData.actorIds || []).filter(id => room.players.get(id)?.status === "alive");
      const allVoted = sabIds.every(id => !!room.phaseData.votes[id]);
      if (!allVoted) { emitRoom(room); return cb && cb({ ok:true, unanimous:false }); }

      const chosen = uniq(sabIds.map(id => room.phaseData.votes[id]));
      if (chosen.length !== 1) { emitRoom(room); return cb && cb({ ok:true, unanimous:false }); }

      room.nightData.saboteurTarget = chosen[0];
      room.nightData.saboteurDone = true;
      nextNightPhase(room);
      emitRoom(room);
      return cb && cb({ ok:true, unanimous:true });
    }

    // --- night: doctor ---
    if (phase === "NIGHT_DOCTOR") {
      if (!isActor(room.phaseData.actorId) || p.status !== "alive") return;
      const action = payload?.action;
      const targetId = payload?.targetId || null;

      if (action === "save") {
        if (room.doctorLifeUsed) return;
        room.nightData.doctorSave = targetId;
        room.doctorLifeUsed = true;
        ensurePlayerStats(p.name).doctorSaves += 1;
        saveStats(statsDb);
      } else if (action === "kill") {
        if (room.doctorDeathUsed) return;
        if (!targetId) return;
        room.nightData.doctorKill = targetId;
        room.doctorDeathUsed = true;
        ensurePlayerStats(p.name).doctorKills += 1;
        saveStats(statsDb);
      }
      room.nightData.doctorDone = true;
      nextNightPhase(room);
      emitRoom(room);
      return cb && cb({ ok:true });
    }

    // --- day: captain transfer ---
    if (phase === "DAY_CAPTAIN_TRANSFER") {
      if (!isActor(room.phaseData.actorId)) return;
      const chosenId = payload?.chosenId;
      finishCaptainTransfer(room, chosenId);
      emitRoom(room);
      return cb && cb({ ok:true });
    }

    // --- day: vote ---
    if (phase === "DAY_VOTE") {
      if (p.status !== "alive") return;
      const target = payload?.vote;
      const tP = room.players.get(target);
      if (!tP || tP.status !== "alive") return;
      room.phaseData.votes[playerId] = target;

      const done = ack(room, playerId);
      emitRoom(room);
      if (done) { finishDayVote(room); emitRoom(room); }
      return cb && cb({ ok:true });
    }

    // --- day: tiebreak ---
    if (phase === "DAY_TIEBREAK") {
      if (!isActor(room.phaseData.actorId)) return;
      const pick = payload?.pick;
      const opts = room.phaseData.options || [];
      if (!opts.includes(pick)) return;
      executeEjection(room, pick, "tiebreak");
      emitRoom(room);
      return cb && cb({ ok:true });
    }

    // --- revenge ---
    if (phase === "REVENGE") {
      if (playerId !== room.phaseData.actorId) return;
      const target = payload?.targetId;
      const tP = room.players.get(target);
      if (!tP || tP.status !== "alive") return;
      killPlayer(room, target, "revenge");
      ensurePlayerStats(p.name).securityRevengeShots += 1;
      saveStats(statsDb);

      afterRevenge(room, room.phaseData.context);
      emitRoom(room);
      return cb && cb({ ok:true });
    }

    cb && cb({ ok:false, error:"Action invalide" });
  });

  socket.on("quitRoom", (_, cb) => {
    const room = rooms.get(socket.data.roomCode);
    if (!room) return;
    const playerId = socket.data.playerId;
    const p = getPlayer(room, playerId);
    if (!p) return;
    p.connected = false;
    scheduleDisconnect(room, playerId);
    emitRoom(room);
    cb && cb({ ok:true });
  });

  socket.on("replaySameRoom", (_, cb) => {
    const room = rooms.get(socket.data.roomCode);
    if (!room) return;
    resetForNewRound(room, true);
    emitRoom(room);
    cb && cb({ ok:true });
  });

  socket.on("newGameResetStats", (_, cb) => {
    const room = rooms.get(socket.data.roomCode);
    if (!room) return;
    resetForNewRound(room, false);
    emitRoom(room);
    cb && cb({ ok:true });
  });

  socket.on("disconnect", () => {
    const room = rooms.get(socket.data.roomCode);
    if (!room) return;
    const playerId = socket.data.playerId;
    const p = getPlayer(room, playerId);
    if (!p) return;
    p.connected = false;
    scheduleDisconnect(room, playerId);
    emitRoom(room);
  });
});

server.listen(PORT, () => {
  console.log(`Infiltration Spatiale server listening on :${PORT}`);
  console.log("[audio] mapped:", AUDIO);
});
