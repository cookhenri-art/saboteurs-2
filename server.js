const path = require("path");
const fs = require("fs");
const http = require("http");
const express = require("express");
const { Server } = require("socket.io");

const PORT = process.env.PORT || 3000;
const BUILD_ID = process.env.BUILD_ID || "infiltration-spatiale-v1.0-1-9-2026-01-07";
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
// Manifest-first: public/sounds/audio-manifest.json (key -> filename)
// Fallback: scan public/sounds and keyword-match filenames/keys.
const SOUNDS_DIR = path.join(__dirname, "public", "sounds");
const AUDIO_MANIFEST_PATH = path.join(SOUNDS_DIR, "audio-manifest.json");

function safeReadJSON(filePath) {
  try {
    if (!fs.existsSync(filePath)) return null;
    return JSON.parse(fs.readFileSync(filePath, "utf-8"));
  } catch (e) {
    console.warn("[audio] manifest read/parse failed:", e.message);
    return null;
  }
}

function listSoundFilesFromDir() {
  if (!fs.existsSync(SOUNDS_DIR)) return [];
  return fs.readdirSync(SOUNDS_DIR).filter((f) => {
    const lf = String(f).toLowerCase();
    if (lf.startsWith(".")) return false;
    if (lf === "readme.md") return false;
    if (lf === "audio-manifest.json") return false;
    return lf.endsWith(".mp3") || lf.endsWith(".wav") || lf.endsWith(".ogg");
  });
}

function tokenizeForSearch(s) {
  const norm = normalize(s).replace(/\s+/g, " ").trim();
  return norm ? norm.split(" ") : [];
}

// soundIndex: key -> "/sounds/<file>"
let soundIndex = Object.create(null);
// keywordIndex: [{ url, tokens:Set<string> }]
let soundKeywordsIndex = [];
let audioManifestLoaded = false;

function buildIndexFromManifest(manifestObj) {
  const idx = Object.create(null);
  const kw = [];
  for (const [k, file] of Object.entries(manifestObj || {})) {
    if (!k || !file) continue;
    const key = String(k).trim();
    const filename = String(file).trim();
    const url = "/sounds/" + filename;
    idx[key] = url;

    const base = filename.replace(/\.[^.]+$/, "");
    const toks = new Set([...tokenizeForSearch(key), ...tokenizeForSearch(base)]);
    kw.push({ url, tokens: toks });
  }
  return { idx, kw };
}

function buildIndexFromScan(files) {
  const idx = Object.create(null);
  const kw = [];
  for (const f of files) {
    const base = String(f).replace(/\.[^.]+$/, "");
    // best-effort key from filename: "RADAR_OFFICER_WAKE.mp3" => "RADAR_OFFICER_WAKE"
    const key = base.toUpperCase().replace(/[^A-Z0-9]+/g, "_");
    const url = "/sounds/" + f;
    idx[key] = url;

    const toks = new Set(tokenizeForSearch(base));
    kw.push({ url, tokens: toks });
  }
  return { idx, kw };
}

function initAudioIndex() {
  const manifest = safeReadJSON(AUDIO_MANIFEST_PATH);
  if (manifest && typeof manifest === "object") {
    const built = buildIndexFromManifest(manifest);
    soundIndex = built.idx;
    soundKeywordsIndex = built.kw;
    audioManifestLoaded = true;
    console.log(`[audio] manifest loaded: ${Object.keys(soundIndex).length} keys`);
    return;
  }
  const files = listSoundFilesFromDir();
  const built = buildIndexFromScan(files);
  soundIndex = built.idx;
  soundKeywordsIndex = built.kw;
  audioManifestLoaded = false;
  console.log(`[audio] manifest missing -> scanned: ${Object.keys(soundIndex).length} sounds`);
}

function findSoundByKey(key) {
  if (!key) return null;
  return soundIndex[String(key).trim()] || null;
}

function findSoundByKeywords(keywords) {
  const wants = (keywords || []).flatMap((k) => tokenizeForSearch(k));
  if (!wants.length) return null;

  let bestUrl = null;
  let bestScore = 0;

  for (const entry of soundKeywordsIndex) {
    let score = 0;
    for (const w of wants) if (entry.tokens.has(w)) score++;
    if (score > bestScore) {
      bestScore = score;
      bestUrl = entry.url;
    }
  }
  return bestScore > 0 ? bestUrl : null;
}

function getSoundUrl(key, keywordsFallback = []) {
  const direct = findSoundByKey(key);
  if (direct) return direct;
  return findSoundByKeywords([key, ...(keywordsFallback || [])]);
}

// Role wake/sleep keys
function roleAudioKey(roleKey, mode /* "WAKE" | "SLEEP" */) {
  const r = String(roleKey || "").toUpperCase();
  const m = String(mode || "").toUpperCase();
  if (!r || !m) return null;
  const alias = {
    CHAMELEON: "CHAMELEON",
    RADAR: "RADAR",
    DOCTOR: "DOCTOR",
    SABOTEUR: "SABOTEURS",
    SABOTEURS: "SABOTEURS",
    SECURITY: "SECURITY",
    AI_AGENT: "IA",
    IA_AGENT: "IA",
    IA: "IA",
    ENGINEER: "ENGINEER"
  };
  const rr = alias[r] || r;
  return `${rr}_${m}`;
}

// Initialize audio index once at boot
initAudioIndex();

// Canonical keys used by the game (manifest-first)
const AUDIO = {
  // lobby / generic
  GENERIC_MAIN: getSoundUrl("GENERIC_MAIN", ["generique"]) || null,
  INTRO_LOBBY: getSoundUrl("INTRO_LOBBY", ["attente", "lancement"]) || null,
  WAITING_LOOP: getSoundUrl("WAITING_LOOP", ["waiting", "loop", "attente"]) || null,

  // captain election
  ELECTION_CHIEF: getSoundUrl("ELECTION_CHIEF", ["election", "chef"]) || null,

  // station sleep / wake
  STATION_SLEEP: getSoundUrl("STATION_SLEEP", ["station", "endort"]) || null,
  STATION_WAKE_LIGHT: getSoundUrl("STATION_WAKE_LIGHT", ["wake", "light", "leger"]) || getSoundUrl("WAKE_LIGHT", ["wake", "light"]) || null,
  STATION_WAKE_HEAVY: getSoundUrl("STATION_WAKE_HEAVY", ["wake", "heavy", "lourd"]) || getSoundUrl("WAKE_HEAVY", ["wake", "heavy"]) || null,

  // role wake/sleep (canonical)
  CHAMELEON_WAKE: getSoundUrl("CHAMELEON_WAKE", ["cameleon", "wake", "reveil"]) || null,
  CHAMELEON_SLEEP: getSoundUrl("CHAMELEON_SLEEP", ["cameleon", "sleep", "dort"]) || null,

  RADAR_WAKE: getSoundUrl("RADAR_WAKE", ["radar", "wake", "reveil"]) || getSoundUrl("RADAR_OFFICER_WAKE", ["radar", "wake", "reveil"]) || null,
  RADAR_SLEEP: getSoundUrl("RADAR_SLEEP", ["radar", "sleep", "dort"]) || getSoundUrl("RADAR_OFFICER_SLEEP", ["radar", "sleep", "dort"]) || null,

  SABOTEURS_WAKE: getSoundUrl("SABOTEURS_WAKE", ["saboteurs", "wake", "reveil"]) || null,
  SABOTEURS_SLEEP: getSoundUrl("SABOTEURS_SLEEP", ["saboteurs", "sleep", "dort"]) || null,
  SABOTEURS_VOTE: getSoundUrl("SABOTEURS_VOTE", ["saboteurs", "vote"]) || null,

  DOCTOR_WAKE: getSoundUrl("DOCTOR_WAKE", ["docteur", "wake", "reveil"]) || null,
  DOCTOR_SLEEP: getSoundUrl("DOCTOR_SLEEP", ["docteur", "sleep", "dort"]) || null,

  SECURITY_REVENGE: getSoundUrl("SECURITY_REVENGE", ["security", "revenge", "vengeance"]) || getSoundUrl("REVENGE", ["venge"]) || null,

  VOTE_ANNONCE: getSoundUrl("VOTE_ANNONCE", ["vote", "annonce"]) || null,

  // end screen / victory / stats outro
  END_VICTORY: getSoundUrl("END_VICTORY", ["victory", "victoire"]) || getSoundUrl("END_SCREEN_SONG", ["ecran", "fin"]) || null,
  END_STATS_OUTRO: getSoundUrl("END_STATS_OUTRO", ["stats", "outro"]) || getSoundUrl("OUTRO", ["outro", "fin"]) || null,

  // legacy fallbacks (keep old keys usable)
  END_SCREEN_SONG: getSoundUrl("END_SCREEN_SONG", ["ecran", "fin"]) || null,
  OUTRO: getSoundUrl("OUTRO", ["outro", "fin"]) || null
};
// -----------------------------------------------------------------------------


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
    prevPhase: null,
    phaseData: {},
    phaseAck: new Set(),

    day: 0,
    night: 0,

    captainElected: false,

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
  // Do NOT abort because players died. Only abort if too few ACTIVE players remain (left/disconnected removed).
  const active = activePlayers(room).length;
  if (room.started && !room.ended && active < 4) {
    room.aborted = true;
    setPhase(room, "GAME_ABORTED", { reason: "Pas assez de joueurs actifs (moins de 4)." });
    logEvent(room, "game_aborted", { active });
  }
}

function computeAudioCue(room, prevPhase) {
  const phase = room.phase;
  const data = room.phaseData || {};

  const withDeaths = (baseTts) => {
    const dt = data.deathsText || null;
    if (dt && baseTts) return `${baseTts} ${dt}`;
    if (dt && !baseTts) return dt;
    return baseTts || null;
  };

  const prevSleep = () => {
    switch (prevPhase) {
      case "NIGHT_CHAMELEON": return AUDIO.CHAMELEON_SLEEP;
      case "NIGHT_RADAR": return AUDIO.RADAR_SLEEP;
      case "NIGHT_SABOTEURS": return AUDIO.SABOTEURS_SLEEP;
      case "NIGHT_DOCTOR": return AUDIO.DOCTOR_SLEEP;
      default: return null;
    }
  };

  const seqIf = (wakeFile, tts, queueLoopFile = null) => {
    const s = prevSleep();
    const seq = [];
    if (s) seq.push(s);
    if (wakeFile) seq.push(wakeFile);
    if (seq.length >= 2) return { sequence: seq, file: null, queueLoopFile, tts };
    if (seq.length === 1) return { sequence: seq, file: null, queueLoopFile, tts };
    return { file: wakeFile || null, queueLoopFile, tts };
  };

  if (phase === "LOBBY") return { file: AUDIO.INTRO_LOBBY, queueLoopFile: null, tts: "Lobby. Préparez la mission." };
  if (phase === "MANUAL_ROLE_PICK") return { file: AUDIO.GENERIC_MAIN, queueLoopFile: null, tts: "Mode manuel. Choisissez votre rôle." };
  if (phase === "ROLE_REVEAL") return { file: AUDIO.GENERIC_MAIN, queueLoopFile: null, tts: "Vérifiez votre rôle." };
  if (phase === "CAPTAIN_CANDIDACY" || phase === "CAPTAIN_VOTE") return { file: AUDIO.ELECTION_CHIEF, queueLoopFile: null, tts: "Élection du capitaine." };

  if (phase === "NIGHT_START") return { file: AUDIO.STATION_SLEEP, queueLoopFile: null, tts: "La station s'endort." };

  if (phase === "NIGHT_CHAMELEON") return seqIf(AUDIO.CHAMELEON_WAKE, "Caméléon, réveille-toi.");
  if (phase === "NIGHT_AI_AGENT") return seqIf(null, "Agent IA, réveille-toi.");
  if (phase === "NIGHT_RADAR") return seqIf(AUDIO.RADAR_WAKE, "Officier radar, réveille-toi.");
  if (phase === "NIGHT_SABOTEURS") return seqIf(AUDIO.SABOTEURS_WAKE, "Saboteurs, choisissez une cible. Unanimité requise.", AUDIO.WAITING_LOOP);
  if (phase === "NIGHT_DOCTOR") return seqIf(AUDIO.DOCTOR_WAKE, "Docteur bio, choisissez votre action.");

  if (phase === "NIGHT_RESULTS") return { file: null, queueLoopFile: null, tts: withDeaths("Résultats de la nuit.") };

  if (phase === "DAY_WAKE") return { file: data.anyDeaths ? AUDIO.STATION_WAKE_HEAVY : AUDIO.STATION_WAKE_LIGHT, queueLoopFile: null, tts: "La station se réveille." };
  if (phase === "DAY_CAPTAIN_TRANSFER") return { file: null, queueLoopFile: null, tts: "Transmission du capitaine." };
  if (phase === "DAY_VOTE") return { file: AUDIO.VOTE_ANNONCE, queueLoopFile: AUDIO.WAITING_LOOP, tts: "Vote d'éjection." };
  if (phase === "DAY_TIEBREAK") return { file: null, queueLoopFile: null, tts: "Égalité. Capitaine, tranche." };
  if (phase === "DAY_RESULTS") return { file: null, queueLoopFile: null, tts: withDeaths("Résultats du jour.") };

  if (phase === "REVENGE") return { file: AUDIO.SECURITY_REVENGE, queueLoopFile: null, tts: "Chef de sécurité, vengeance." };

  if (phase === "GAME_OVER") {
    // Prefer a short victory sting then stats outro if available
    const seq = [];
    if (AUDIO.END_VICTORY) seq.push(AUDIO.END_VICTORY);
    if (AUDIO.END_STATS_OUTRO) seq.push(AUDIO.END_STATS_OUTRO);
    if (seq.length) return { sequence: seq, file: null, queueLoopFile: null, tts: "Fin de partie." };
    return { file: AUDIO.END_SCREEN_SONG || AUDIO.OUTRO || null, queueLoopFile: null, tts: "Fin de partie." };
  }

  if (phase === "GAME_ABORTED") return { file: null, queueLoopFile: null, tts: "Partie interrompue." };

  return { file: null, queueLoopFile: null, tts: null };
}

function setPhase(room, phase, data = {}) {
  const prev = room.phase;
  room.prevPhase = prev;
  room.phase = phase;
  room.phaseData = data;
  room.phaseAck = new Set();
  room.audio = computeAudioCue(room, prev);
  logEvent(room, "phase", { phase });
  try {
    console.log(`[${room.code}] ➜ phase=${phase} day=${room.day} night=${room.night}`);
  } catch {}

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
    case "DAY_RESULTS": return alive;
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
  const newlyDead = [];
  let changed = true;
  const seen = new Set();
  while (changed) {
    changed = false;
    for (const p of room.players.values()) {
      if (!p.linkedTo) continue;
      const other = room.players.get(p.linkedTo);
      if (!other) continue;

      const key = [p.playerId, other.playerId].sort().join("-");
      if (seen.has(key)) continue;

      if (p.status !== "alive" && other.status === "alive") {
        if (killPlayer(room, other.playerId, "link")) newlyDead.push(other.playerId);
        changed = true;
      } else if (other.status !== "alive" && p.status === "alive") {
        if (killPlayer(room, p.playerId, "link")) newlyDead.push(p.playerId);
        changed = true;
      }
      seen.add(key);
    }
  }
  return newlyDead;
}


function buildDeathsText(room, newlyDeadIds) {
  const ids = (newlyDeadIds || []).filter(Boolean);
  if (!ids.length) return null;
  const parts = ids
    .map((id) => {
      const p = room.players.get(id);
      if (!p) return null;
      const label = (p.role && (ROLES[p.role]?.label || p.role)) || "rôle inconnu";
      return `${p.name} (${label})`;
    })
    .filter(Boolean);
  if (!parts.length) return null;
  if (parts.length === 1) return `Le joueur ${parts[0]} est mort.`;
  return `Les joueurs ${parts.join(", ")} sont morts.`;
}

function killPlayer(room, playerId, source, extra = {}) {
  const p = room.players.get(playerId);
  if (!p || p.status !== "alive") return false;
  p.status = "dead";
  logEvent(room, "player_died", { playerId, source, ...extra });
  return true;
}

function checkWin(room) {
  if (room.aborted) return "ABORTED";

  // abort only if too few ACTIVE players remain
  ensureMinPlayers(room);
  if (room.aborted) return "ABORTED";

  const alive = alivePlayers(room);
  const { saboteurs, astronauts, aliveTotal } = computeTeams(room);

  // Lovers mixed win: only two alive, linked together, and mixed teams
  if (aliveTotal === 2) {
    const a = alive[0];
    const b = alive[1];
    const linked = a.linkedTo === b.playerId && b.linkedTo === a.playerId;
    if (linked) {
      const teamA = ROLES[a.role]?.team || "astronauts";
      const teamB = ROLES[b.role]?.team || "astronauts";
      if (teamA !== teamB) return "AMOUREUX";
    }
  }

  if (saboteurs === 0) return "ASTRONAUTES";

  // Saboteurs win on parity/superiority (classic)
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

function buildEndReport(room, winner) {
  const players = Array.from(room.players.values()).map(p => ({
    playerId: p.playerId,
    name: p.name,
    status: p.status,
    role: p.role,
    roleLabel: ROLES[p.role]?.label || p.role || null,
    isCaptain: !!p.isCaptain
  }));

  // death order (first time each player died)
  const deathOrder = [];
  const seen = new Set();
  for (const e of room.matchLog) {
    if (e.type !== "player_died") continue;
    if (seen.has(e.playerId)) continue;
    seen.add(e.playerId);
    const name = room.players.get(e.playerId)?.name || e.playerId;
    deathOrder.push({ playerId: e.playerId, name, source: e.source || "?" });
  }

  // match-specific counters from matchLog
  const counters = {};
  const inc = (pid, k) => {
    if (!pid) return;
    counters[pid] = counters[pid] || {};
    counters[pid][k] = (counters[pid][k] || 0) + 1;
  };
  for (const e of room.matchLog) {
    if (e.type === "doctor_save") inc(e.by, "doctorSaves");
    if (e.type === "doctor_kill") inc(e.by, "doctorKills");
    if (e.type === "radar_inspect") inc(e.by, "radarInspects");
    if (e.type === "chameleon_swap") inc(e.by, "chameleonSwaps");
    if (e.type === "revenge_shot") inc(e.by, "revengeShots");
    if (e.type === "ai_link") inc(e.by, "aiLinks");
  }

  const awardPick = (k, title, emptyText) => {
    let bestPid = null;
    let bestVal = 0;
    for (const [pid, c] of Object.entries(counters)) {
      const v = c[k] || 0;
      if (v > bestVal) { bestVal = v; bestPid = pid; }
    }
    if (!bestPid || bestVal <= 0) return { title, text: emptyText || "—" };
    const name = room.players.get(bestPid)?.name || bestPid;
    return { title, text: `${name} (${bestVal})` };
  };

  const awards = [
    awardPick("doctorSaves", "Meilleur docteur (sauvetages)", "Aucun sauvetage"),
    awardPick("doctorKills", "Docteur (kills)", "Aucun kill docteur"),
    awardPick("radarInspects", "Meilleur officier radar (inspections)", "Aucune inspection"),
    awardPick("chameleonSwaps", "Meilleur caméléon (échanges)", "Aucun échange"),
    awardPick("revengeShots", "Chef de sécurité (vengeance)", "Aucune vengeance"),
    awardPick("aiLinks", "Agent IA (liaisons)", "Aucune liaison")
  ];

  // snapshot of persistent stats for present players
  const statsByName = {};
  for (const p of room.players.values()) {
    if (p.status === "left") continue;
    const s = statsDb[p.name] || ensurePlayerStats(p.name);
    const wr = s.gamesPlayed ? Math.round((s.wins / s.gamesPlayed) * 100) : 0;
    statsByName[p.name] = {
      gamesPlayed: s.gamesPlayed,
      wins: s.wins,
      losses: s.losses,
      winRatePct: wr,
      winsByRole: s.winsByRole,
      gamesByRole: s.gamesByRole,
      doctorSaves: s.doctorSaves,
      doctorKills: s.doctorKills,
      radarInspects: s.radarInspects,
      radarCorrect: s.radarCorrect,
      chameleonSwaps: s.chameleonSwaps,
      securityRevengeShots: s.securityRevengeShots
    };
  }


const detailedStatsByName = {};
for (const [name, s] of Object.entries(statsByName)) {
  const gamesByRole = s.gamesByRole || {};
  const winsByRole = s.winsByRole || {};
  const roleWinRates = {};
  for (const [role, g] of Object.entries(gamesByRole)) {
    const w = winsByRole[role] || 0;
    roleWinRates[role] = g ? Math.round((w / g) * 100) : 0;
  }
  detailedStatsByName[name] = {
    ...s,
    roleWinRates
  };
}

return { winner, players, deathOrder, awards, counters, statsByName, detailedStatsByName };
}

function endGame(room, winner) {
  room.ended = true;

  // persist stats per name FIRST (so the end report reflects the updated totals)
  for (const p of room.players.values()) {
    if (p.status === "left") continue;

    const st = ensurePlayerStats(p.name);
    st.gamesPlayed += 1;

    const role = p.role || "unknown";
    st.gamesByRole[role] = (st.gamesByRole[role] || 0) + 1;

    let win = false;
    if (winner === "AMOUREUX") {
      // only the two linked lovers win
      win = (p.status === "alive") && !!p.linkedTo && (room.players.get(p.linkedTo)?.status === "alive");
    } else {
      const team = ROLES[role]?.team || "astronauts";
      win = (winner === "ASTRONAUTES" && team === "astronauts") ||
            (winner === "SABOTEURS" && team === "saboteurs");
    }

    if (win) st.wins += 1;
    else st.losses += 1;

    if (win) st.winsByRole[role] = (st.winsByRole[role] || 0) + 1;
  }
  saveStats(statsDb);

  const report = buildEndReport(room, winner);
  room.endReport = report;
  setPhase(room, "GAME_OVER", { winner, report });
  logEvent(room, "game_over", { winner });
  console.log(`[${room.code}] game_over winner=${winner}`);
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
  room.captainElected = false;
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
  room.captainElected = false;

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
  room.captainElected = true;

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
    if (doc) {
      const tId = room.nightData?.saboteurTarget || null;
      const tName = tId ? (room.players.get(tId)?.name || null) : null;
      setPhase(room, "NIGHT_DOCTOR", { actorId: doc.playerId, lifeUsed: room.doctorLifeUsed, deathUsed: room.doctorDeathUsed, saboteurTargetId: tId, saboteurTargetName: tName });
      return;
    }
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
    if (killPlayer(room, pid, "night")) newlyDead.push(pid);
  }

  // linked deaths cascade
  const casc = applyLinkCascade(room);
  for (const pid of casc) if (!newlyDead.includes(pid)) newlyDead.push(pid);

  const deathsText = buildDeathsText(room, newlyDead);

  const securityDied = newlyDead.find((pid) => room.players.get(pid)?.role === "security");
  if (securityDied) {
    room.pendingAfterRevenge = { context: "night", newlyDead: newlyDead.slice(), deathsText };
    setPhase(room, "REVENGE", { actorId: securityDied, context: "night", options: alivePlayers(room).map((p) => p.playerId) });
    return;
  }

  const winner = checkWin(room);
  if (winner) {
    if (winner === "ABORTED") return;
    endGame(room, winner);
    return;
  }

  setPhase(room, "NIGHT_RESULTS", { newlyDead, anyDeaths: newlyDead.length > 0, deathsText });
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

  const newlyDead = [];
  if (killPlayer(room, ejectedId, "day", { reason })) newlyDead.push(ejectedId);

  const casc = applyLinkCascade(room);
  for (const pid of casc) if (!newlyDead.includes(pid)) newlyDead.push(pid);

  const deathsText = buildDeathsText(room, newlyDead);

  const securityDied = newlyDead.find((pid) => room.players.get(pid)?.role === "security");
  if (securityDied) {
    room.pendingAfterRevenge = { context: "day", newlyDead: newlyDead.slice(), deathsText };
    setPhase(room, "REVENGE", { actorId: securityDied, context: "day", options: alivePlayers(room).map((p) => p.playerId) });
    return;
  }

  const winner = checkWin(room);
  if (winner) {
    if (winner === "ABORTED") return;
    endGame(room, winner);
    return;
  }

  setPhase(room, "DAY_RESULTS", { newlyDead, anyDeaths: newlyDead.length > 0, deathsText });
}

function afterRevenge(room, context) {
  // integrate any pending deaths + revenge results (already applied)
  const pending = room.pendingAfterRevenge || { context, newlyDead: [], deathsText: null };

  const winner = checkWin(room);
  if (winner) {
    room.pendingAfterRevenge = null;
    if (winner === "ABORTED") return;
    endGame(room, winner);
    return;
  }

  const data = { newlyDead: pending.newlyDead || [], anyDeaths: (pending.newlyDead || []).length > 0, deathsText: pending.deathsText || null };
  room.pendingAfterRevenge = null;

  if (context === "night") setPhase(room, "NIGHT_RESULTS", data);
  else setPhase(room, "DAY_RESULTS", data);
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

  // Phase data can include sensitive internals (e.g., saboteur votes). Build a viewer-specific view.
  let phaseDataOut = room.phaseData || {};
  if (room.phase === "NIGHT_SABOTEURS") {
    if (viewer && viewer.role === "saboteur") {
      const sabIds = (room.phaseData?.actorIds || []).filter(id => room.players.get(id)?.status === "alive");
      const view = {};
      for (const sid of sabIds) {
        const sp = room.players.get(sid);
        const tid = room.phaseData?.votes?.[sid] || null;
        const tp = tid ? room.players.get(tid) : null;
        view[sp?.name || sid] = tp?.name || null;
      }
      phaseDataOut = { ...(room.phaseData || {}), saboteurVotes: view };
    } else {
      // Hide raw votes for non-saboteurs
      const { votes, ...rest } = room.phaseData || {};
      phaseDataOut = rest;
    }
  }

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

    if (room.ended || room.phase === "GAME_OVER") {
      base.role = p.role;
      base.roleLabel = ROLES[p.role]?.label || p.role;
      base.roleIcon = ROLES[p.role]?.icon || null;
      return base;
    }

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
    phaseData: phaseDataOut,
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

app.get("/api/build", (req, res) => {
  res.json({
    ok: true,
    buildId: BUILD_ID,
    node: process.version,
    manifest: "/sounds/audio-manifest.json"
  });
});

app.get("/api/assets/audio", (req, res) => {
  res.json({
    manifestLoaded: !!audioManifestLoaded,
    files: listSoundFilesFromDir(),
    indexKeys: Object.keys(soundIndex || {}),
    mapped: AUDIO
  });
});

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
      // ROLE_REVEAL happens once at game start, and may happen again after Caméléon (re-check). Never re-run captain election.
      if (!room.captainElected) {
        beginCaptainElection(room);
      } else {
        // Resume flow (usually night) after a global role re-check.
        if (room.phaseData?.resume === "night") {
          nextNightPhase(room);
        }
      }
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

    case "NIGHT_RADAR":
      if (room.nightData?.radarDone) nextNightPhase(room);
      break;

    case "NIGHT_RESULTS":
      beginDay(room, room.phaseData?.anyDeaths);
      break;

    case "DAY_WAKE":
      proceedDayAfterWake(room);
      break;

    case "DAY_RESULTS":
      beginNight(room);
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
      console.log(`[${code}] room_created host=${name} (${playerId})`);
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
    console.log(`[${code}] room_join name=${name} (${playerId})`);
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
    console.log(`[${room.code}] game_start by=${getPlayer(room, socket.data.playerId)?.name || socket.data.playerId}`);
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
      logEvent(room, "chameleon_swap", { by: playerId, targetId });
      console.log(`[${room.code}] chameleon_swap by=${p.name} target=${tP.name}`);
      ensurePlayerStats(p.name).chameleonSwaps += 1;
      saveStats(statsDb);

      // everybody re-check role
      setPhase(room, "ROLE_REVEAL", { notice: "Les rôles ont pu changer. Revérifiez.", resume: "night" });
      emitRoom(room);
      return cb && cb({ ok:true });
    }

    // --- night: ai agent ---
    if (phase === "NIGHT_AI_AGENT") {
      if (!isActor(room.phaseData.actorId) || p.status !== "alive") return;

      // Only night 1. After that, just skip.
      if (room.night !== 1) { room.nightData.aiLinked = true; nextNightPhase(room); emitRoom(room); return cb && cb({ ok:true }); }

      if (payload?.skip) {
        room.nightData.aiLinked = true;
        logEvent(room, "ai_link_skip", { by: playerId });
        console.log(`[${room.code}] ai_link_skip by=${p.name}`);
        nextNightPhase(room);
        emitRoom(room);
        return cb && cb({ ok:true });
      }

      const targetId = payload?.targetId || payload?.partnerId;
      if (!targetId || targetId === playerId) return cb && cb({ ok:false, error:"Choisis un autre joueur." });
      const tP = room.players.get(targetId);
      if (!tP || tP.status !== "alive") return cb && cb({ ok:false, error:"Cible invalide." });

      // Link the Agent IA with the chosen player (persistent banner for both).
      p.linkedTo = tP.playerId; p.linkedName = tP.name;
      tP.linkedTo = p.playerId; tP.linkedName = p.name;

      room.nightData.aiLinked = true;
      logEvent(room, "ai_link", { by: playerId, targetId });
      console.log(`[${room.code}] ai_link by=${p.name} target=${tP.name}`);

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
      room.phaseData.lastRadarResult = { viewerId: playerId, targetId, roleKey: role, text: `🔍 Radar: ${tP.name} = ${ROLES[role]?.label || role}` };
      room.phaseData.selectionDone = true;

      logEvent(room, "radar_inspect", { by: playerId, targetId, role });
      console.log(`[${room.code}] radar_inspect by=${p.name} target=${tP.name} role=${role}`);

      const st = ensurePlayerStats(p.name);
      st.radarInspects += 1;
      if (role === "saboteur") st.radarCorrect += 1;
      saveStats(statsDb);

      // Important: stay on NIGHT_RADAR so the Radar can see the result, then ACK to continue.
      room.nightData.radarDone = true;
      emitRoom(room);
      return cb && cb({ ok:true });
    }

    // --- night: saboteurs (unanimity) --- (unanimity) ---
    if (phase === "NIGHT_SABOTEURS") {
      if (p.status !== "alive" || p.role !== "saboteur") return;
      const targetId = payload?.targetId;
      const tP = room.players.get(targetId);
      if (!tP || tP.status !== "alive") return;
      if (targetId === playerId) return cb && cb({ ok:false, error:"Cible invalide." });
      if (tP.role === "saboteur") return cb && cb({ ok:false, error:"Les saboteurs ne peuvent pas viser un saboteur." });
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
        if (room.doctorLifeUsed) return cb && cb({ ok:false, error:"Potion de vie déjà utilisée." });
        const saveTarget = room.nightData?.saboteurTarget || null;
        room.nightData.doctorSave = saveTarget;
        room.doctorLifeUsed = true;
        logEvent(room, "doctor_save", { by: playerId, targetId: saveTarget });
        console.log(`[${room.code}] doctor_save by=${p.name} target=${room.players.get(saveTarget)?.name || "none"}`);

        const st = ensurePlayerStats(p.name);
        st.doctorSaves += 1;
        saveStats(statsDb);
      } else if (action === "kill") {
        if (room.doctorDeathUsed) return cb && cb({ ok:false, error:"Potion de mort déjà utilisée." });
        if (!targetId) return cb && cb({ ok:false, error:"Cible manquante." });
        const tP = room.players.get(targetId);
        if (!tP || tP.status !== "alive") return cb && cb({ ok:false, error:"Cible invalide." });
        room.nightData.doctorKill = targetId;
        room.doctorDeathUsed = true;
        logEvent(room, "doctor_kill", { by: playerId, targetId });
        console.log(`[${room.code}] doctor_kill by=${p.name} target=${tP.name}`);

        const st = ensurePlayerStats(p.name);
        st.doctorKills += 1;
        saveStats(statsDb);
      } else if (action === "none") {
        logEvent(room, "doctor_none", { by: playerId });
        console.log(`[${room.code}] doctor_none by=${p.name}`);
      } else {
        return cb && cb({ ok:false, error:"Action invalide." });
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

  const extraDead = [];
  if (killPlayer(room, target, "revenge")) extraDead.push(target);
  logEvent(room, "revenge_shot", { by: playerId, targetId: target });
  console.log(`[${room.code}] revenge_shot by=${p.name} target=${tP.name}`);
  ensurePlayerStats(p.name).securityRevengeShots += 1;
  saveStats(statsDb);

  const casc = applyLinkCascade(room);
  for (const pid of casc) if (!extraDead.includes(pid)) extraDead.push(pid);

  // merge with pending deaths (from the event that triggered revenge)
  const pending = room.pendingAfterRevenge || { context: room.phaseData.context, newlyDead: [], deathsText: null };
  const merged = [];
  for (const pid of (pending.newlyDead || [])) if (!merged.includes(pid)) merged.push(pid);
  for (const pid of extraDead) if (!merged.includes(pid)) merged.push(pid);

  room.pendingAfterRevenge = {
    context: room.phaseData.context,
    newlyDead: merged,
    deathsText: buildDeathsText(room, merged)
  };

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
