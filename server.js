/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║            🎮 SABOTEUR - SERVEUR UNIFIÉ V2.0 (FUSION)                     ║
 * ║                                                                           ║
 * ║  Base: saboteur reprise avatar (logique jeu complète)                     ║
 * ║  + Système d'authentification et avatars IA                               ║
 * ║  V32.3 - 25/01/2026 - Traductions 7 langues + emails multilingues         ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

const path = require("path");
const fs = require("fs");
const fsPromises = require("fs").promises;
const http = require("http");
const https = require("https");
const crypto = require("crypto");
const express = require("express");
const { Server } = require("socket.io");
const logger = require("./logger");
const RateLimiter = require("./rate-limiter");
const dailyManager = require("./daily-manager");
const videoPermissions = require("./video-permissions");

// Auth dependencies (optionnelles - graceful fallback si non installées)
let bcrypt, jwt, initSqlJs, sharp, Replicate, Resend, multer, stripe;
try { bcrypt = require("bcryptjs"); } catch(e) { console.log("⚠️ bcryptjs non installé"); }
try { jwt = require("jsonwebtoken"); } catch(e) { console.log("⚠️ jsonwebtoken non installé"); }
try { initSqlJs = require("sql.js"); } catch(e) { console.log("⚠️ sql.js non installé"); }
try { sharp = require("sharp"); } catch(e) { console.log("⚠️ sharp non installé"); }
try { Replicate = require("replicate"); } catch(e) { console.log("⚠️ replicate non installé"); }
try { Resend = require("resend").Resend; } catch(e) { console.log("⚠️ resend non installé"); }
try { multer = require("multer"); } catch(e) { console.log("⚠️ multer non installé"); }
try { 
  if (process.env.STRIPE_SECRET_KEY) {
    stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
    console.log("✅ Stripe initialisé");
  }
} catch(e) { console.log("⚠️ stripe non installé"); }

const PORT = process.env.PORT || 3000;
const BUILD_ID = process.env.BUILD_ID || "saboteur-unified-v2.0";
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, "data");
const STATS_FILE = path.join(DATA_DIR, "stats.json");
const DATABASE_PATH = process.env.DATABASE_PATH || path.join(DATA_DIR, "saboteur.db");
const UPLOADS_DIR = path.join(__dirname, "uploads");
const AVATARS_DIR = path.join(DATA_DIR, "avatars");

// Secrets et API
const JWT_SECRET = process.env.JWT_SECRET || "saboteur-jwt-2024-dev-key-change-in-production";
const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN || "";
const RESEND_API_KEY = process.env.RESEND_API_KEY || "";
const APP_URL = process.env.APP_URL || `http://localhost:${PORT}`;

// Créer les dossiers nécessaires
fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(UPLOADS_DIR, { recursive: true });
fs.mkdirSync(AVATARS_DIR, { recursive: true });

// Clients API (optionnels)
const replicate = (REPLICATE_API_TOKEN && Replicate) ? new Replicate({ auth: REPLICATE_API_TOKEN }) : null;
const resend = (RESEND_API_KEY && Resend) ? new Resend(RESEND_API_KEY) : null;

// ============================================================================
// SECTION AUTH: LIMITES COMPTES ET DOMAINES BLOQUÉS
// ============================================================================

const ACCOUNT_LIMITS = {
  guest: { videoCredits: 0, avatars: 0, themes: ["default", "werewolf"], customPrompt: false },
  free: { videoCredits: 2, avatars: 2, themes: ["default", "werewolf"], customPrompt: false },
  pack: { videoCredits: 50, avatars: 50, themes: "all", customPrompt: true },  // Pack 4.99€ - accès à TOUS les thèmes (y compris futurs)
  subscriber: { videoCredits: Infinity, avatars: 30, themes: ["default", "werewolf", "wizard-academy", "mythic-realms"], customPrompt: true },
  admin: { videoCredits: Infinity, avatars: Infinity, themes: "all", customPrompt: true }
};

const ADMIN_CODES = ["HENRICO-DEV", "SABOTEUR-ADMIN", "DEV-UNLIMITED", "ADMIN-MASTER-2024"];

// Codes famille (donnent accès subscriber)
const FAMILY_CODES = ["FAMILLE2024", "SABOTEUR-PAPA", "SABOTEUR-MAMAN", "SABOTEUR-FAMILLE"];

// Codes promo spéciaux
const PROMO_CODES = {
  "BETA-TESTER-VIP": "subscriber",   // Abonnement gratuit
  "PACK-PREMIUM-FREE": "pack"        // Pack 50 crédits
};

// V32 Option D: Tracking des sessions utilisateurs connectés (un seul compte à la fois)
// Map: userId -> { socketId, roomCode, playerId, connectedAt }
const userSessions = new Map();

const BLOCKED_EMAIL_DOMAINS = [
  "tempmail.com", "throwaway.email", "guerrillamail.com", "mailinator.com",
  "10minutemail.com", "temp-mail.org", "fakeinbox.com", "trashmail.com",
  "yopmail.com", "mohmal.com", "getairmail.com", "tempail.com"
];

// Thèmes pour avatars IA
const AVATAR_THEMES = {
  default: {
    name: "Infiltration Spatiale", icon: "🚀", premium: false,
    background: "deep space background with stars and nebula",
    characters: {
      astronaut: { name: "Astronaute", prompt: "wearing white NASA astronaut helmet" },
      alien: { name: "Alien", prompt: "green alien with huge black eyes" },
      cyborg: { name: "Cyborg", prompt: "half robot face with glowing red eye" },
      robot: { name: "Robot", prompt: "humanoid robot with metallic skin" },
      captain: { name: "Capitaine", prompt: "space captain with futuristic uniform" }
    }
  },
  werewolf: {
    name: "Loups-Garous", icon: "🐺", premium: false,
    background: "dark medieval village at night with full moon",
    characters: {
      werewolf: { name: "Loup-garou", prompt: "werewolf with fur and fangs howling at moon" },
      vampire: { name: "Vampire", prompt: "vampire with pale skin, fangs and red eyes" },
      witch: { name: "Sorcière", prompt: "witch with pointy hat and black cat" },
      hunter: { name: "Chasseur", prompt: "medieval hunter with crossbow and cloak" },
      mayor: { name: "Maire", prompt: "medieval village mayor with fancy clothes" },
      peasant: { name: "Paysan", prompt: "medieval peasant villager with simple clothes" }
    }
  },
  "wizard-academy": {
    name: "Académie des Sorciers", icon: "🧙", premium: true,
    background: "magical great hall with floating candles and enchanted ceiling",
    characters: {
      wizard: { name: "Sorcier", prompt: "wizard with pointy hat and magical wand" },
      ghost: { name: "Fantôme", prompt: "translucent ghostly apparition floating" },
      house_elf: { name: "Elfe", prompt: "small house elf with big ears and magical eyes" },
      goblin: { name: "Gobelin", prompt: "mischievous goblin banker with pointed ears" },
      professor: { name: "Professeur", prompt: "old wise wizard professor with long beard and robes" }
    }
  },
  "mythic-realms": {
    name: "Royaumes Mythiques", icon: "⚔️", premium: true,
    background: "epic fantasy landscape with castle and mountains",
    characters: {
      knight: { name: "Chevalier", prompt: "knight in shining silver armor with sword" },
      dragon: { name: "Dragon", prompt: "powerful dragonborn warrior with scales and horns" },
      dwarf: { name: "Nain", prompt: "dwarf warrior with long beard and battle axe" },
      elf: { name: "Elfe", prompt: "elegant elf archer with pointed ears and bow" },
      orc: { name: "Orque", prompt: "fierce orc warrior with green skin and tusks" },
      mage: { name: "Mage", prompt: "powerful mage with glowing staff and mystical robes" }
    }
  }
};

// ============================================================================
// SECTION AUTH: BASE DE DONNÉES SQLITE
// ============================================================================

let authDb = null;

async function initAuthDatabase() {
  if (!initSqlJs) {
    console.log("⚠️ sql.js non disponible - Auth désactivée");
    return;
  }
  
  console.log("📂 Initialisation de la base de données auth...");
  const SQL = await initSqlJs();
  
  try {
    if (fs.existsSync(DATABASE_PATH)) {
      const fileBuffer = fs.readFileSync(DATABASE_PATH);
      authDb = new SQL.Database(fileBuffer);
      console.log("📂 Base auth chargée depuis", DATABASE_PATH);
    } else {
      authDb = new SQL.Database();
      console.log("📂 Nouvelle base auth créée");
    }
  } catch (err) {
    console.error("⚠️ Erreur chargement DB auth:", err.message);
    authDb = new SQL.Database();
  }
  
  // Créer les tables
  authDb.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      account_type TEXT DEFAULT 'free',
      email_verified INTEGER DEFAULT 0,
      verification_token TEXT,
      verification_expires DATETIME,
      reset_token TEXT,
      reset_expires DATETIME,
      video_credits INTEGER DEFAULT 2,
      avatars_used INTEGER DEFAULT 0,
      current_avatar TEXT,
      custom_avatar TEXT,
      created_from_ip TEXT,
      last_video_ip TEXT,
      lifetime_games INTEGER DEFAULT 0,
      stripeCustomerId TEXT,
      stripeSubscriptionId TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_login DATETIME
    )
  `);
  
  // Migration : ajouter colonnes Stripe si elles n'existent pas
  try {
    authDb.run(`ALTER TABLE users ADD COLUMN stripeCustomerId TEXT`);
    console.log('Migration stripeCustomerId: OK');
  } catch (err) {
    if (!err.message.includes('duplicate column')) {
      console.log('Migration stripeCustomerId:', err.message);
    }
  }
  
  try {
    authDb.run(`ALTER TABLE users ADD COLUMN stripeSubscriptionId TEXT`);
    console.log('Migration stripeSubscriptionId: OK');
  } catch (err) {
    if (!err.message.includes('duplicate column')) {
      console.log('Migration stripeSubscriptionId:', err.message);
    }
  }
  
  // Migration : colonnes reset password
  try {
    authDb.run(`ALTER TABLE users ADD COLUMN reset_token TEXT`);
    console.log('Migration reset_token: OK');
  } catch (err) {
    if (!err.message.includes('duplicate column')) {
      console.log('Migration reset_token:', err.message);
    }
  }
  
  try {
    authDb.run(`ALTER TABLE users ADD COLUMN reset_expires DATETIME`);
    console.log('Migration reset_expires: OK');
  } catch (err) {
    if (!err.message.includes('duplicate column')) {
      console.log('Migration reset_expires:', err.message);
    }
  }

  authDb.run(`
    CREATE TABLE IF NOT EXISTS avatars (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      theme TEXT,
      character_type TEXT,
      image_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  authDb.run(`
    CREATE TABLE IF NOT EXISTS account_creation_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ip_address TEXT,
      email TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  authDb.run(`
    CREATE TABLE IF NOT EXISTS blocked_email_domains (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      domain TEXT UNIQUE
    )
  `);

  authDb.run(`
    CREATE TABLE IF NOT EXISTS games_played (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      ip_address TEXT,
      game_mode TEXT,
      played_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // V32: Migration - Ajouter colonne custom_avatar si elle n'existe pas
  try {
    authDb.run("ALTER TABLE users ADD COLUMN custom_avatar TEXT");
    console.log("✅ Migration: colonne custom_avatar ajoutée");
  } catch(e) {
    // La colonne existe déjà, c'est OK
  }

  saveAuthDatabase();
  console.log("✅ Base de données auth initialisée");
}

function saveAuthDatabase() {
  if (!authDb) return;
  try {
    const data = authDb.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DATABASE_PATH, buffer);
  } catch (e) {
    console.error("❌ Erreur sauvegarde DB auth:", e);
  }
}

// Helper fonctions DB
function dbRun(sql, params = []) {
  if (!authDb) return null;
  try {
    authDb.run(sql, params);
    saveAuthDatabase();
    return true;
  } catch (e) {
    console.error("❌ DB Error:", e.message);
    return false;
  }
}

function dbGet(sql, params = []) {
  if (!authDb) return null;
  try {
    const stmt = authDb.prepare(sql);
    stmt.bind(params);
    if (stmt.step()) {
      const row = stmt.getAsObject();
      stmt.free();
      return row;
    }
    stmt.free();
    return null;
  } catch (e) {
    console.error("❌ DB Get Error:", e.message);
    return null;
  }
}

function dbInsert(sql, params = []) {
  if (!authDb) return { lastInsertRowid: 0 };
  try {
    authDb.run(sql, params);
    const result = authDb.exec("SELECT last_insert_rowid() as id");
    saveAuthDatabase();
    return { lastInsertRowid: result[0]?.values[0]?.[0] || 0 };
  } catch (e) {
    console.error("❌ DB Insert Error:", e.message);
    return { lastInsertRowid: 0 };
  }
}

function dbAll(sql, params = []) {
  if (!authDb) return [];
  try {
    const stmt = authDb.prepare(sql);
    stmt.bind(params);
    const results = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    stmt.free();
    return results;
  } catch (e) {
    console.error("❌ DB All Error:", e.message);
    return [];
  }
}

// ============================================================================
// SECTION AUTH: HELPERS
// ============================================================================

function getClientIP(req) {
  return req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.socket?.remoteAddress || "unknown";
}

function generateVerificationToken() {
  return crypto.randomBytes(32).toString("hex");
}

function isBlockedEmailDomain(email) {
  const domain = email.split("@")[1]?.toLowerCase();
  if (!domain) return true;
  if (BLOCKED_EMAIL_DOMAINS.includes(domain)) return true;
  const blocked = dbGet("SELECT id FROM blocked_email_domains WHERE domain = ?", [domain]);
  return !!blocked;
}

function checkAccountCreationLimit(ip) {
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const count = dbGet("SELECT COUNT(*) as count FROM account_creation_log WHERE ip_address = ? AND created_at > ?", [ip, yesterday]);
  return (count?.count || 0) < 5;
}

function getUserLimits(user) {
  if (!user) return ACCOUNT_LIMITS.guest;
  return ACCOUNT_LIMITS[user.account_type] || ACCOUNT_LIMITS.free;
}

// JWT Middleware
function authenticateToken(req, res, next) {
  if (!jwt) return res.status(500).json({ error: "Auth non configurée" });
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Token requis" });
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Token invalide" });
    req.user = user;
    next();
  });
}

function optionalAuth(req, res, next) {
  if (!jwt) return next();
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (token) {
    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (!err) req.user = user;
    });
  }
  next();
}

// Traductions des emails
const EMAIL_TRANSLATIONS = {
  verification: {
    subject: {
      fr: "🎮 Vérifie ton compte Saboteur !",
      en: "🎮 Verify your Saboteur account!",
      es: "🎮 ¡Verifica tu cuenta de Saboteur!",
      it: "🎮 Verifica il tuo account Saboteur!",
      de: "🎮 Bestätige dein Saboteur-Konto!",
      pt: "🎮 Verifique sua conta Saboteur!",
      nl: "🎮 Verifieer je Saboteur-account!"
    },
    title: {
      fr: "Bienvenue sur Saboteur !",
      en: "Welcome to Saboteur!",
      es: "¡Bienvenido a Saboteur!",
      it: "Benvenuto su Saboteur!",
      de: "Willkommen bei Saboteur!",
      pt: "Bem-vindo ao Saboteur!",
      nl: "Welkom bij Saboteur!"
    },
    hello: {
      fr: "Salut",
      en: "Hello",
      es: "Hola",
      it: "Ciao",
      de: "Hallo",
      pt: "Olá",
      nl: "Hallo"
    },
    message: {
      fr: "Clique sur le bouton ci-dessous pour vérifier ton email et débloquer tes",
      en: "Click the button below to verify your email and unlock your",
      es: "Haz clic en el botón de abajo para verificar tu email y desbloquear tus",
      it: "Clicca il pulsante qui sotto per verificare la tua email e sbloccare le tue",
      de: "Klicke auf den Button unten, um deine E-Mail zu bestätigen und deine",
      pt: "Clique no botão abaixo para verificar seu email e desbloquear suas",
      nl: "Klik op de onderstaande knop om je e-mail te verifiëren en je"
    },
    freeGames: {
      fr: "2 parties vidéo gratuites",
      en: "2 free video games",
      es: "2 partidas de vídeo gratis",
      it: "2 partite video gratuite",
      de: "2 kostenlosen Videospiele freizuschalten",
      pt: "2 jogos de vídeo gratuitos",
      nl: "2 gratis videospellen te ontgrendelen"
    },
    button: {
      fr: "✅ Vérifier mon email",
      en: "✅ Verify my email",
      es: "✅ Verificar mi email",
      it: "✅ Verifica la mia email",
      de: "✅ Meine E-Mail bestätigen",
      pt: "✅ Verificar meu email",
      nl: "✅ Mijn e-mail verifiëren"
    },
    copyLink: {
      fr: "Ou copie ce lien :",
      en: "Or copy this link:",
      es: "O copia este enlace:",
      it: "Oppure copia questo link:",
      de: "Oder kopiere diesen Link:",
      pt: "Ou copie este link:",
      nl: "Of kopieer deze link:"
    },
    expires: {
      fr: "Ce lien expire dans 24 heures.",
      en: "This link expires in 24 hours.",
      es: "Este enlace caduca en 24 horas.",
      it: "Questo link scade tra 24 ore.",
      de: "Dieser Link läuft in 24 Stunden ab.",
      pt: "Este link expira em 24 horas.",
      nl: "Deze link verloopt over 24 uur."
    },
    noSpam: {
      fr: "Cet email sert uniquement à sécuriser ton compte. Aucun spam, aucune pub, promis !",
      en: "This email is only used to secure your account. No spam, no ads, promise!",
      es: "Este correo solo sirve para proteger tu cuenta. ¡Sin spam ni publicidad, prometido!",
      it: "Questa email serve solo a proteggere il tuo account. Niente spam, niente pubblicità, promesso!",
      de: "Diese E-Mail dient nur zur Sicherung deines Kontos. Kein Spam, keine Werbung, versprochen!",
      pt: "Este email serve apenas para proteger sua conta. Sem spam, sem anúncios, prometido!",
      nl: "Deze e-mail dient alleen om je account te beveiligen. Geen spam, geen reclame, beloofd!"
    }
  }
};

// Fonction helper pour obtenir la traduction email
function getEmailText(section, key, lang = 'fr') {
  const translations = EMAIL_TRANSLATIONS[section];
  if (!translations || !translations[key]) return key;
  return translations[key][lang] || translations[key]['fr'] || key;
}

async function sendVerificationEmail(email, username, token, lang = 'fr') {
  if (!resend) {
    console.log(`📧 [DEV] Lien vérification: ${APP_URL}/verify-email.html?token=${token}`);
    return { success: true, simulated: true };
  }
  try {
    const verifyUrl = `${APP_URL}/verify-email.html?token=${token}`;
    const t = (key) => getEmailText('verification', key, lang);
    
    // Template HTML avec design gradient multilingue
    const htmlTemplate = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #1a1a2e;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%); border-radius: 20px; padding: 40px; text-align: center; box-shadow: 0 10px 40px rgba(0,0,0,0.3);">
      
      <!-- Logo/Titre -->
      <div style="margin-bottom: 30px;">
        <span style="font-size: 48px;">🎮</span>
        <h1 style="color: #00d4ff; margin: 10px 0; font-size: 28px; text-shadow: 0 0 20px rgba(0,212,255,0.5);">
          ${t('title')}
        </h1>
      </div>
      
      <!-- Message -->
      <p style="color: #e0e0e0; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
        ${t('hello')} <strong style="color: #00d4ff;">${username}</strong> ! 👋<br><br>
        ${t('message')} <strong style="color: #4ade80;">${t('freeGames')}</strong> !
      </p>
      
      <!-- Bouton -->
      <a href="${verifyUrl}" style="display: inline-block; background: linear-gradient(135deg, #4ade80 0%, #22c55e 100%); color: #000; text-decoration: none; padding: 15px 40px; border-radius: 30px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 15px rgba(74,222,128,0.4); transition: transform 0.2s;">
        ${t('button')}
      </a>
      
      <!-- Lien alternatif -->
      <p style="color: #888; font-size: 12px; margin-top: 30px; word-break: break-all;">
        ${t('copyLink')}<br>
        <a href="${verifyUrl}" style="color: #00d4ff;">${verifyUrl}</a>
      </p>
      
      <!-- Footer -->
      <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.1);">
        <p style="color: #666; font-size: 11px; margin: 0;">
          ${t('expires')}<br>
          🔒 ${t('noSpam')}
        </p>
      </div>
      
    </div>
  </div>
</body>
</html>`;

    await resend.emails.send({
      from: process.env.EMAIL_FROM || "Saboteur Game <noreply@saboteurs-loup-garou.com>",
      to: email,
      subject: t('subject'),
      html: htmlTemplate
    });
    console.log(`📧 Email de vérification envoyé à ${email} (${lang})`);
    return { success: true };
  } catch (e) {
    console.error("❌ Erreur email:", e);
    return { success: false, error: e.message };
  }
}

// ============================================================================
// ANCIEN SERVEUR - HELPERS ORIGINAUX
// ============================================================================

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

// V32: Obtenir les emojis d'avatars par thème (copie de d9-avatars.js)
function getThemeAvatars(themeId) {
  const THEME_AVATARS = {
    default: ['🧑‍🚀', '🤖', '👽', '🚀', '🛰️', '🛸', '⭐', '🌙', '🪐', '☄️'],
    werewolf: ['🐺', '👨‍🌾', '🧙‍♀️', '🏹', '🔮', '🌕', '🌲', '🦉', '🦇', '💀'],
    'wizard-academy': ['🧙‍♂️', '🧙‍♀️', '🪄', '🧪', '🔮', '📖', '🐈‍⬛', '⚗️', '✨', '🐉'],
    'mythic-realms': ['⚔️', '🐲', '👑', '🛡️', '🏰', '🦄', '🔥', '💎', '📜', '🪑']
  };
  return THEME_AVATARS[themeId] || THEME_AVATARS.default;
}

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
      chameleonSwaps: 0, securityRevengeShots: 0,
      // Nouvelles stats avancées (Phase 2)
      ejectedBySaboteurs: 0,  // Tué la nuit par saboteurs
      ejectedByVote: 0,        // Éjecté par vote du jour
      captainElected: 0,       // Nombre de fois élu capitaine
      aiAgentLinks: 0,         // Nombre de liens créés
      matchHistory: [],         // Historique des dernières 20 parties
      shortestGame: null,      // V24: Partie la plus courte (ms)
      longestGame: null,       // V24: Partie la plus longue (ms)
      firstEliminated: 0,       // V26: Nombre de fois éliminé en premier
      // V28: Nouvelles stats Phase 3
      correctSaboteurVotes: 0,  // Votes corrects contre saboteurs
      wrongSaboteurVotes: 0,    // Votes contre astronautes (erreurs)
      totalVotes: 0,            // Total de votes émis
      doctorNotSavedOpportunities: 0, // Occasions où le docteur aurait pu sauver
      doctorKillsOnSaboteurs: 0,  // Potion fatale sur saboteurs
      doctorKillsOnInnocents: 0,  // Potion fatale sur astronautes (erreur)
      revengeKillsOnSaboteurs: 0, // Vengeance sur saboteurs
      revengeKillsOnInnocents: 0, // Vengeance sur astronautes (erreur)
      doctorMissedSaves: 0,       // Non sauvés (potion vie non utilisée)
      mayorTiebreakerOk: 0,       // Départage du maire qui tue un saboteur
      mayorTiebreakerKo: 0,       // Départage du maire qui tue un astronaute
      mayorTiebreakerTotal: 0     // Total de départages du maire
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
  if (direct) {
    // Extraire juste le nom du fichier depuis l'URL complète
    // Ex: "/sounds/INTRO_LOBBY.mp3" -> "INTRO_LOBBY.mp3"
    const filename = direct.split('/').pop();
    return filename;
  }
  const fallback = findSoundByKeywords([key, ...(keywordsFallback || [])]);
  if (fallback) {
    const filename = fallback.split('/').pop();
    return filename;
  }
  return null;
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

  // generic prompts
  CHECK_ROLE: getSoundUrl("CHECK_ROLE", ["check", "role", "verifiez", "verifier", "roles"]) || null,

  // captain election
  ELECTION_CHIEF: getSoundUrl("ELECTION_CHIEF", ["election", "chef"]) || null,

  // station sleep / wake
  STATION_SLEEP: getSoundUrl("STATION_SLEEP", ["station", "endort"]) || null,
  STATION_WAKE_LIGHT: getSoundUrl("STATION_WAKE_LIGHT", ["wake", "light", "leger"]) || getSoundUrl("WAKE_LIGHT", ["wake", "light"]) || null,
  STATION_WAKE_HEAVY: getSoundUrl("STATION_WAKE_HEAVY", ["wake", "heavy", "lourd"]) || getSoundUrl("WAKE_HEAVY", ["wake", "heavy"]) || null,

  // role wake/sleep (canonical)
  CHAMELEON_WAKE: getSoundUrl("CHAMELEON_WAKE", ["cameleon", "wake", "reveil"]) || null,
  CHAMELEON_SLEEP: getSoundUrl("CHAMELEON_SLEEP", ["cameleon", "sleep", "dort"]) || null,

  IA_WAKE: getSoundUrl("IA_WAKE", ["ia", "agent", "wake", "reveil"]) || null,
  IA_SLEEP: getSoundUrl("IA_SLEEP", ["ia", "agent", "sleep", "dort"]) || null,

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
  astronaut: { label: "Astronaute", icon: "astronaute.webp", team: "astronauts" },
  saboteur: { label: "Saboteur", icon: "saboteur.webp", team: "saboteurs" },
  doctor: { label: "Docteur bio", icon: "docteur.webp", team: "astronauts" },
  security: { label: "Chef de sécurité", icon: "chef-securite.webp", team: "astronauts" },
  ai_agent: { label: "Agent IA", icon: "liaison-ia.webp", team: "astronauts" },
  radar: { label: "Officier radar", icon: "radar.webp", team: "astronauts" },
  engineer: { label: "Ingénieur", icon: "ingenieur.webp", team: "astronauts" },
  chameleon: { label: "Caméléon", icon: "cameleon.webp", team: "astronauts" }
};
const CAPTAIN_ICON = "capitaine.webp";

/**
 * Obtient le nom traduit d'un rôle selon le thème de la room
 * @param {string} roleKey - Clé du rôle (astronaut, saboteur, etc.)
 * @param {object} room - L'objet room contenant le themeId
 * @param {boolean} plural - Si true, retourne la forme plurielle
 * @returns {string} - Le nom traduit du rôle
 */
function getRoleLabel(roleKey, room, plural = false) {
  if (!roleKey) return "?";
  const themeId = room?.themeId || "default";
  try {
    return themeManager.getRoleName(themeId, roleKey, plural);
  } catch (e) {
    // Fallback si le thème n'existe pas
    return ROLES[roleKey]?.label || roleKey;
  }
}

/**
 * Obtient un terme traduit selon le thème de la room
 * @param {string} termKey - Clé du terme (captain, station, saboteurs, astronauts, etc.)
 * @param {object} room - L'objet room contenant le themeId
 * @returns {string} - Le terme traduit
 */
function getTerm(termKey, room) {
  if (!termKey) return "";
  const themeId = room?.themeId || "default";
  try {
    const theme = themeManager.getTheme(themeId);
    return theme.terms?.[termKey] || termKey;
  } catch (e) {
    // Fallback
    const defaults = {
      captain: "Chef de station",
      station: "station",
      crew: "équipage",
      mission: "mission",
      title: "Infiltration Spatiale",
      saboteurs: "Saboteurs",
      astronauts: "Astronautes"
    };
    return defaults[termKey] || termKey;
  }
}

/**
 * Traduit un nom de phase selon le thème de la room
 * @param {string} phaseKey - Clé de la phase (CAPTAIN_CANDIDACY, NIGHT_RADAR, etc.)
 * @param {object} room - L'objet room contenant le themeId
 * @returns {string} - Le nom traduit de la phase
 */
function getPhaseName(phaseKey, room) {
  if (!phaseKey) return "";
  
  const captainTerm = getTerm('captain', room);
  const saboteursTerm = getTerm('saboteurs', room);
  
  // Map simple pour les phases communes
  const simpleMap = {
    LOBBY: "LOBBY",
    ROLE_REVEAL: "RÉVÉLATION DES RÔLES",
    CAPTAIN_CANDIDACY: `Élection du ${captainTerm}`,
    CAPTAIN_VOTE: `Vote pour ${captainTerm}`,
    NIGHT_START: "Début de la nuit",
    NIGHT_CHAMELEON: `${getRoleLabel('chameleon', room)}, réveille-toi`,
    NIGHT_AI_AGENT: `${getRoleLabel('ai_agent', room)}, réveille-toi`,
    NIGHT_AI_EXCHANGE: `Échange IA (privé)`,
    NIGHT_RADAR: `${getRoleLabel('radar', room)}, réveille-toi`,
    NIGHT_SABOTEURS: `${saboteursTerm}, réveillez-vous`,
    NIGHT_DOCTOR: `${getRoleLabel('doctor', room)}, réveille-toi`,
    NIGHT_RESULTS: "Résultats de la nuit",
    DAY_WAKE: "Réveil",
    DAY_VOTE: "Vote d'éjection",
    DAY_RESULTS: "Résultats",
    REVENGE: `Vengeance du ${getRoleLabel('security', room)}`,
    GAME_OVER: "Fin de partie",
    GAME_ABORTED: "Partie interrompue"
  };
  
  return simpleMap[phaseKey] || phaseKey;
}

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
    themeId: "default",  // Thème sélectionné par l'hôte

    started: false,
    ended: false,
    aborted: false,

    phase: "LOBBY",
    prevPhase: null,
    phaseData: {},
    phaseAck: new Set(),
    phaseStartTime: Date.now(),  // Pour tracking durée phase (mode hôte)

    day: 0,
    night: 0,

    captainElected: false,

    players: new Map(),     // playerId -> player
    playerTokens: new Map(), // playerToken -> playerId (pour reconnexion robuste)
    timers: new Map(),      // playerId -> {notifyTimer, removeTimer}
    matchLog: [],
    
    // Chat messages
    chatMessages: [],  // { id, playerId, playerName, message, timestamp, type: 'player'|'system' }

    // consumables
    doctorLifeUsed: false,
    doctorDeathUsed: false,
    chameleonUsed: false,
    afterChameleonReveal: false,

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
      case "NIGHT_AI_AGENT": return AUDIO.IA_SLEEP;
      case "NIGHT_RADAR": return AUDIO.RADAR_SLEEP;
      case "NIGHT_SABOTEURS": return AUDIO.SABOTEURS_SLEEP;
      case "NIGHT_DOCTOR": return AUDIO.DOCTOR_SLEEP;
      case "ROLE_REVEAL": return room.afterChameleonReveal ? AUDIO.STATION_SLEEP : null;
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

  if (phase === "LOBBY") return { file: AUDIO.INTRO_LOBBY, queueLoopFile: null, tts: null };
  if (phase === "MANUAL_ROLE_PICK") return { file: AUDIO.GENERIC_MAIN, queueLoopFile: null, tts: "Mode manuel. Choisissez votre rôle." };
  if (phase === "ROLE_REVEAL") {
    if (data.resume === "night" && data.fromChameleon) {
      // After the Caméléon swap: play Caméléon sleep then a dedicated "check role" prompt (MP3).
      // (No TTS here; CHECK_ROLE is provided as an audio asset.)
      return { sequence: [AUDIO.CHAMELEON_SLEEP, AUDIO.CHECK_ROLE].filter(Boolean), file: null, queueLoopFile: null, tts: null };
    }
    return { file: AUDIO.GENERIC_MAIN, queueLoopFile: null, tts: "Vérifiez votre rôle." };
  }
  if (phase === "CAPTAIN_CANDIDACY" || phase === "CAPTAIN_VOTE") return { file: AUDIO.ELECTION_CHIEF, queueLoopFile: null, tts: "Élection du capitaine." };

  if (phase === "NIGHT_START") return { file: AUDIO.STATION_SLEEP, queueLoopFile: null, tts: "La station s'endort." };

  if (phase === "NIGHT_CHAMELEON") return seqIf(AUDIO.CHAMELEON_WAKE, "Caméléon, réveille-toi.");
  if (phase === "NIGHT_AI_AGENT") {
    // If we are coming right after the Caméléon reveal, we want the IA prompt AFTER the station sleep.
    const comingFromStationSleep = prevSleep() === AUDIO.STATION_SLEEP;
    if (comingFromStationSleep && !AUDIO.IA_WAKE) {
      return { sequence: [AUDIO.STATION_SLEEP].filter(Boolean), file: null, queueLoopFile: null, tts: null, ttsAfterSequence: "Agent IA, réveille-toi." };
    }
    // Otherwise use the standard sequence builder (prev sleep + IA wake if available).
    return seqIf(AUDIO.IA_WAKE, AUDIO.IA_WAKE ? null : "Agent IA, réveille-toi.");
  }
  
  if (phase === "NIGHT_AI_EXCHANGE") return { file: null, queueLoopFile: null, tts: "Échange privé IA." };

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
  room.phaseStartTime = Date.now(); // Tracker le début de phase
  room.audio = computeAudioCue(room, prev);
  if (prev === "ROLE_REVEAL" && room.afterChameleonReveal) room.afterChameleonReveal = false;
  
  // V32: Décompter les crédits vidéo quand la partie atteint le 1er jour ou se termine
  const creditTriggerPhases = ['CAPTAIN_CANDIDACY', 'DAY_DISCUSSION', 'DAY_VOTE', 'GAME_OVER'];
  if (creditTriggerPhases.includes(phase) && room.started) {
    deductVideoCreditsForRoom(room);
  }
  
  logEvent(room, "phase", { phase });
  
  // Log structuré
  const alive = alivePlayers(room).length;
  logger.phaseStart(room.code, phase, room.day, room.night, alive);
  
  // Envoyer un message système dans le chat pour les phases importantes
  sendSystemChatMessage(room, phase, data);
  
  // Calculer et émettre les permissions vidéo pour cette phase
  const permissions = videoPermissions.calculateRoomPermissions(phase, room.players);
  const videoMessage = videoPermissions.getPhaseVideoMessage(phase);
  
  // Stocker les permissions dans la room pour référence
  room.videoPermissions = permissions;
  room.videoPhaseMessage = videoMessage;
  
  try {
    console.log(`[${room.code}] ➜ phase=${phase} day=${room.day} night=${room.night} video=${videoMessage}`);
  } catch {}

}

// V32: Décompter les crédits vidéo pour tous les joueurs éligibles d'une room
function deductVideoCreditsForRoom(room) {
  if (!room || !room.players) return;
  
  for (const [playerId, player] of room.players) {
    // Skip si déjà décompté pour ce joueur dans cette partie
    if (player.videoCreditDeducted) continue;
    
    // Skip si le joueur n'avait pas le droit à la vidéo
    if (!player.canBroadcastVideo) continue;
    
    // Skip si pas d'userId (invité)
    if (!player.odooUserId) continue;
    
    // Récupérer l'utilisateur en base
    const user = dbGet("SELECT id, account_type, video_credits FROM users WHERE id = ?", [player.odooUserId]);
    if (!user) continue;
    
    // Skip les admins (crédits illimités)
    if (user.account_type === 'admin') {
      player.videoCreditDeducted = true; // Marquer comme traité
      continue;
    }
    
    // Skip les subscribers (crédits illimités)
    if (user.account_type === 'subscriber') {
      player.videoCreditDeducted = true;
      continue;
    }
    
    // Décompter 1 crédit
    if (user.video_credits > 0) {
      dbRun("UPDATE users SET video_credits = video_credits - 1 WHERE id = ?", [user.id]);
      player.videoCreditDeducted = true;
      
      // Mettre à jour canBroadcastVideo si plus de crédits
      const newCredits = user.video_credits - 1;
      if (newCredits <= 0) {
        player.canBroadcastVideo = false;
      }
      
      console.log(`🎬 [${room.code}] Crédit vidéo décompté pour ${player.name} (userId=${user.id}) - Reste: ${newCredits}`);
    }
  }
}

// Envoie un message système dans le chat
function sendSystemChatMessage(room, phase, data) {
  let message = null;
  const themeId = room.themeId || "default";
  
  switch (phase) {
    case "ROLE_REVEAL":
      message = "🎭 La partie commence ! Les rôles sont distribués.";
      break;
    case "CAPTAIN_CANDIDACY":
      message = "👑 Phase de candidature au poste de Capitaine.";
      break;
    case "CAPTAIN_VOTE":
      message = "🗳️ Vote pour élire le Capitaine.";
      break;
    case "NIGHT_START":
      message = `🌙 Nuit ${room.night} - Les rôles spéciaux agissent...`;
      break;
    case "DAY_DISCUSSION":
      message = `☀️ Jour ${room.day} - Discussion ouverte.`;
      break;
    case "DAY_VOTE":
      message = "🗳️ Vote du jour - Qui sera éliminé ?";
      break;
    case "DAY_TIEBREAK":
      message = "⚖️ Égalité ! Le Capitaine doit départager.";
      break;
    case "REVENGE":
      if (data.eliminatedName) {
        message = `💀 ${data.eliminatedName} a été éliminé(e) et peut se venger !`;
      }
      break;
    case "GAME_OVER":
      if (data.winner) {
        const winnerText = data.winner === "saboteurs" ? "Les Saboteurs" : "L'Équipage";
        message = `🏆 Fin de partie ! ${winnerText} ont gagné !`;
      }
      break;
    case "GAME_ABORTED":
      message = "⚠️ Partie annulée - Pas assez de joueurs.";
      break;
  }
  
  if (message) {
    const chatMsg = {
      id: `sys_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      playerId: null,
      playerName: "Système",
      avatarEmoji: "🤖",
      message: message,
      timestamp: Date.now(),
      type: "system"
    };
    
    room.chatMessages.push(chatMsg);
    if (room.chatMessages.length > 100) {
      room.chatMessages.shift();
    }
    
    // Diffuser à tous les joueurs
    io.to(room.code).emit("chatMessage", chatMsg);
  }
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
    case "NIGHT_AI_EXCHANGE": return (d.iaId && d.partnerId) ? [d.iaId, d.partnerId] : [];
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
  const items = ids.map((id) => {
    const p = room.players.get(id);
    if (!p) return null;
    const roleLabel = getRoleLabel(p.role, room);
    return `${p.name} (${roleLabel})`;
  }).filter(Boolean);
  if (!items.length) return null;

  if (items.length === 1) return `Le joueur ${items[0]} a été éjecté.`;
  return `Les joueurs ${items.join(", ")} ont été éjectés.`;
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
    roleLabel: getRoleLabel(p.role, room),
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
    const role = room.players.get(e.playerId)?.role;
    const roleLabel = getRoleLabel(role, room);
    
    // Traduire la source
    let source = e.source || "?";
    if (source === "saboteurs") source = getTerm('saboteurs', room).toLowerCase();
    else if (source === "doctor") source = getRoleLabel('doctor', room).toLowerCase();
    else if (source === "security") source = getRoleLabel('security', room).toLowerCase();
    
    deathOrder.push({ playerId: e.playerId, name, roleLabel, source });
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
    if (e.type === "doctor_kill") {
      inc(e.by, "doctorKills");
      const tRole = room.players.get(e.targetId)?.role;
      const team = ROLES[tRole]?.team || "astronauts";
      if (team === "astronauts") inc(e.by, "doctorKillsAstronauts");
      else inc(e.by, "doctorKillsSaboteurs");
    }
    if (e.type === "radar_inspect") inc(e.by, "radarInspects");
    if (e.type === "chameleon_swap") inc(e.by, "chameleonSwaps");
    if (e.type === "revenge_shot") {
      inc(e.by, "revengeShots");
      const tRole = room.players.get(e.targetId)?.role;
      const team = ROLES[tRole]?.team || "astronauts";
      if (team === "saboteurs") inc(e.by, "revengeKillsSaboteurs");
      else inc(e.by, "revengeKillsAstronauts");
    }
    if (e.type === "ai_link") inc(e.by, "aiLinks");
  }

  // ----------------- Awards (match) -----------------
  // Helper formatters
  const nameRole = (pid, roleOverride = null) => {
    const p = room.players.get(pid);
    if (!p) return null;
    const role = roleOverride || p.role;
    const roleLabel = getRoleLabel(role, room);
    return `${p.name} (${roleLabel})`;
  };

  const getDoctorActorIds = () => {
    const ids = new Set();
    for (const e of room.matchLog) if (e.type?.startsWith("doctor_") && e.by) ids.add(e.by);
    return Array.from(ids);
  };

  const awardDoctorHouse = () => {
    const saves = [];
    for (const e of room.matchLog) {
      if (e.type !== "doctor_save") continue;
      if (!e.by || !e.targetId) continue;
      const tRole = e.targetRole || room.players.get(e.targetId)?.role || null;
      if ((ROLES[tRole]?.team || "astronauts") === "saboteurs") continue;
      const label = nameRole(e.targetId, tRole);
      if (label) saves.push(label);
    }
    if (!saves.length) return { 
      titleKey: "awards.bestDoctor", 
      textKey: "awards.noSave",
      title: "Meilleur Docteur House", 
      text: "Aucun sauvetage." 
    };
    const uniqSaves = Array.from(new Set(saves));
    return { 
      titleKey: "awards.bestDoctor", 
      textKey: "awards.saveCount",
      data: { count: uniqSaves.length, names: uniqSaves.join(", ") },
      title: "Meilleur Docteur House", 
      text: `${uniqSaves.length} sauvetage(s) : ${uniqSaves.join(", ")}` 
    };
  };

  const awardBoucher = () => {
    // Only if the doctor did NOT use the life potion during the match.
    const stationTerm = getTerm('station', room);
    const astronautsTerm = getTerm('astronauts', room);
    const doctorRoleLabel = getRoleLabel('doctor', room);
    
    if (room.doctorLifeUsed) return { 
      titleKey: "awards.butcher",
      textKey: "awards.lifePotionUsed",
      title: `Boucher de la ${stationTerm}`, 
      text: "Aucun (potion de vie utilisée)." 
    };

    const doctorIds = getDoctorActorIds();
    const doctorName = doctorIds.length ? (room.players.get(doctorIds[0])?.name || doctorRoleLabel) : doctorRoleLabel;

    // Astronauts wrongly ejected by doctor potion of death
    const wrong = [];
    for (const e of room.matchLog) {
      if (e.type !== "doctor_kill") continue;
      const tRole = e.targetRole || room.players.get(e.targetId)?.role || null;
      if (!tRole) continue;
      const team = ROLES[tRole]?.team || "astronauts";
      if (team === "saboteurs") continue;
      const label = nameRole(e.targetId, tRole);
      if (label) wrong.push(label);
    }

    // "non sauvés": victims of saboteurs while life potion unused
    const unsaved = [];
    for (const e of room.matchLog) {
      if (e.type !== "player_died") continue;
      if (e.source !== "saboteurs") continue;
      const label = nameRole(e.playerId);
      if (label) unsaved.push(label);
    }

    if (!wrong.length && !unsaved.length) return { 
      titleKey: "awards.butcher",
      textKey: "awards.none",
      title: `Boucher de la ${stationTerm}`, 
      text: "Aucun." 
    };

    const parts = [];
    if (wrong.length) parts.push(`Éjections d'${astronautsTerm.toLowerCase()} : ${Array.from(new Set(wrong)).join(", ")}`);
    if (unsaved.length) parts.push(`Non sauvés : ${Array.from(new Set(unsaved)).join(", ")}`);
    return { 
      titleKey: "awards.butcher",
      textKey: "awards.butcherDetails",
      data: { 
        doctorName, 
        wrongKills: Array.from(new Set(wrong)).join(", "),
        unsaved: Array.from(new Set(unsaved)).join(", ")
      },
      title: `Boucher de la ${stationTerm}`, 
      text: `${doctorName} — ${parts.join(" • ")}` 
    };
  };

  const awardOeilDeLynx = () => {
    const saboteurTerm = getTerm('saboteurs', room).toLowerCase().slice(0, -1); // saboteur/loup/orque
    
    // Saboteurs inspected by radar who later got ejected
    const diedAt = new Map();
    for (const e of room.matchLog) {
      if (e.type !== "player_died") continue;
      if (!e.playerId) continue;
      if (!diedAt.has(e.playerId)) diedAt.set(e.playerId, e.t || 0);
    }

    const found = [];
    for (const e of room.matchLog) {
      if (e.type !== "radar_inspect") continue;
      if (e.role !== "saboteur") continue;
      const dt = diedAt.get(e.targetId);
      if (!dt) continue;
      // must be "mort par la suite"
      if ((dt || 0) <= (e.t || 0)) continue;
      const label = room.players.get(e.targetId)?.name || e.targetId;
      if (label) found.push(label);
    }
    const uniqFound = Array.from(new Set(found));
    if (!uniqFound.length) return { 
      titleKey: "awards.lynxEye",
      textKey: "awards.noSaboteurSpotted",
      title: "L'œil de Lynx", 
      text: `Aucun ${saboteurTerm} repéré puis éjecté.` 
    };
    return { 
      titleKey: "awards.lynxEye",
      textKey: "awards.saboteurSpotted",
      data: { names: uniqFound.join(", ") },
      title: "L'œil de Lynx", 
      text: `${saboteurTerm.charAt(0).toUpperCase() + saboteurTerm.slice(1)}(s) repéré(s) puis éjecté(s) : ${uniqFound.join(", ")}` 
    };
  };

  const awardLupin = () => {
    const saboteurTerm = getTerm('saboteurs', room).toLowerCase().slice(0, -1);
    
    const names = [];
    for (const e of room.matchLog) {
      if (e.type !== "chameleon_swap") continue;
      if (e.targetOldRole !== "saboteur") continue;
      const n = room.players.get(e.targetId)?.name || e.targetId;
      if (n) names.push(n);
    }
    const uniqNames = Array.from(new Set(names));
    if (!uniqNames.length) return { 
      titleKey: "awards.goldenLupin",
      textKey: "awards.noSaboteurStolen",
      title: "Le Lupin d'Or", 
      text: `Aucun ${saboteurTerm} volé.` 
    };
    return { 
      titleKey: "awards.goldenLupin",
      textKey: "awards.stolenRole",
      data: { names: uniqNames.join(", ") },
      title: "Le Lupin d'Or", 
      text: `A volé le rôle de : ${uniqNames.join(", ")}` 
    };
  };

  const awardSecurity = (teamWanted, title, emptyText, titleKey, emptyTextKey) => {
    const perShooter = new Map(); // shooterId -> {count, victims[]}
    for (const e of room.matchLog) {
      if (e.type !== "revenge_shot") continue;
      const tRole = e.targetRole || room.players.get(e.targetId)?.role || null;
      const team = ROLES[tRole]?.team || "astronauts";
      const wanted = (teamWanted === "saboteurs") ? (team === "saboteurs") : (team !== "saboteurs");
      if (!wanted) continue;
      const shooter = e.by;
      if (!shooter) continue;
      if (!perShooter.has(shooter)) perShooter.set(shooter, { count: 0, victims: [] });
      const o = perShooter.get(shooter);
      o.count += 1;
      const v = nameRole(e.targetId, tRole) || (room.players.get(e.targetId)?.name || e.targetId);
      if (v) o.victims.push(v);
    }
    let best = null;
    for (const [pid, o] of perShooter.entries()) {
      if (!best || o.count > best.count) best = { pid, ...o };
    }
    if (!best) return { titleKey, textKey: emptyTextKey, title, text: emptyText };
    const shooterName = room.players.get(best.pid)?.name || best.pid;
    const victims = Array.from(new Set(best.victims));
    return { 
      titleKey, 
      textKey: "awards.revengeVictims",
      data: { name: shooterName, victims: victims.join(", ") },
      title, 
      text: `${shooterName} — victime(s) : ${victims.join(", ")}` 
    };
  };

  const awardAssociation = () => {
    if (winner !== "AMOUREUX") return { 
      titleKey: "awards.criminalAssociation",
      textKey: "awards.dash",
      title: "Association de Malfaiteurs", 
      text: "—" 
    };
    const alive = alivePlayers(room);
    if (alive.length !== 2) return { 
      titleKey: "awards.criminalAssociation",
      textKey: "awards.dash",
      title: "Association de Malfaiteurs", 
      text: "—" 
    };
    const a = alive[0], b = alive[1];
    const linked = a.linkedTo === b.playerId && b.linkedTo === a.playerId;
    if (!linked) return { 
      titleKey: "awards.criminalAssociation",
      textKey: "awards.dash",
      title: "Association de Malfaiteurs", 
      text: "—" 
    };
    return { 
      titleKey: "awards.criminalAssociation",
      textKey: "awards.linkedPlayers",
      data: { player1: a.name, player2: b.name },
      title: "Association de Malfaiteurs", 
      text: `${a.name} 🤝 ${b.name}` 
    };
  };

  const awardSaboteurIncognito = () => {
    if (winner !== "SABOTEURS") return { 
      titleKey: "awards.incognitoSaboteur",
      textKey: "awards.dash",
      title: "Saboteur Incognito", 
      text: "—" 
    };

    // Aggregate votes AGAINST each player across all day votes.
    const votesAgainst = Object.create(null);
    for (const e of room.matchLog) {
      if (e.type !== "day_votes") continue;
      const counts = e.counts || {};
      for (const [pid, n] of Object.entries(counts)) votesAgainst[pid] = (votesAgainst[pid] || 0) + (n || 0);
    }

    const aliveSab = alivePlayers(room).filter(p => p.role === "saboteur");
    const winners = aliveSab.filter(p => (votesAgainst[p.playerId] || 0) === 0).map(p => p.name);
    const uniq = Array.from(new Set(winners));
    if (!uniq.length) return { 
      titleKey: "awards.incognitoSaboteur",
      textKey: "awards.none",
      title: "Saboteur Incognito", 
      text: "Aucun." 
    };
    return { 
      titleKey: "awards.incognitoSaboteur",
      textKey: "awards.zeroVotes",
      data: { names: uniq.join(", ") },
      title: "Saboteur Incognito", 
      text: `0 vote contre lui : ${uniq.join(", ")}` 
    };
  };

  // V24: Award Meilleur Chef de station (départage pour éliminer saboteur)
  const awardBestCaptain = () => {
    const captainTerm = getTerm('captain', room);
    const saboteurTerm = getTerm('saboteurs', room).toLowerCase().slice(0, -1);
    
    const goodTiebreaks = [];
    for (const e of room.matchLog) {
      if (e.type !== "captain_tiebreak") continue;
      if (e.targetTeam === "saboteurs") {
        const captainName = room.players.get(e.captainId)?.name || "?";
        const targetName = room.players.get(e.targetId)?.name || "?";
        goodTiebreaks.push({ captain: captainName, target: targetName });
      }
    }
    
    if (!goodTiebreaks.length) return { 
      titleKey: "awards.bestCaptain",
      textKey: "awards.noTiebreakAgainstSaboteur",
      title: `Meilleur ${captainTerm}`, 
      text: `Aucun départage contre ${saboteurTerm}.` 
    };
    const captains = [...new Set(goodTiebreaks.map(t => t.captain))];
    const targets = [...new Set(goodTiebreaks.map(t => t.target))];
    return { 
      titleKey: "awards.bestCaptain",
      textKey: "awards.eliminated",
      data: { captains: captains.join(", "), targets: targets.join(", ") },
      title: `Meilleur ${captainTerm}`, 
      text: `${captains.join(", ")} a éliminé : ${targets.join(", ")}` 
    };
  };

  // V24: Award Pire Chef de station (départage pour éliminer astronaute)
  const awardWorstCaptain = () => {
    const captainTerm = getTerm('captain', room);
    const astronautTerm = getTerm('astronauts', room).toLowerCase().slice(0, -1);
    
    const badTiebreaks = [];
    for (const e of room.matchLog) {
      if (e.type !== "captain_tiebreak") continue;
      if (e.targetTeam === "astronauts") {
        const captainName = room.players.get(e.captainId)?.name || "?";
        const targetName = room.players.get(e.targetId)?.name || "?";
        badTiebreaks.push({ captain: captainName, target: targetName });
      }
    }
    
    if (!badTiebreaks.length) return { 
      titleKey: "awards.worstCaptain",
      textKey: "awards.noTiebreakAgainstAstronaut",
      title: `Pire ${captainTerm}`, 
      text: `Aucun départage contre ${astronautTerm}.` 
    };
    const captains = [...new Set(badTiebreaks.map(t => t.captain))];
    const targets = [...new Set(badTiebreaks.map(t => t.target))];
    return { 
      titleKey: "awards.worstCaptain",
      textKey: "awards.eliminated",
      data: { captains: captains.join(", "), targets: targets.join(", ") },
      title: `Pire ${captainTerm}`, 
      text: `${captains.join(", ")} a éliminé : ${targets.join(", ")}` 
    };
  };


  const saboteursTerm = getTerm('saboteurs', room);
  const astronautsTerm = getTerm('astronauts', room);
  const stationTerm = getTerm('station', room);
  
  const awards = [
    awardDoctorHouse(),
    awardBoucher(),
    awardOeilDeLynx(),
    awardLupin(),
    awardSecurity("saboteurs", `Terminator de la ${stationTerm.charAt(0).toUpperCase() + stationTerm.slice(1)}`, `Aucune vengeance sur ${saboteursTerm.toLowerCase().slice(0, -1)}.`, "awards.terminator", "awards.noRevengeOnSaboteur"),
    awardSecurity("astronauts", "Gâchette Nerveuse", `Aucune vengeance sur ${astronautsTerm.toLowerCase().slice(0, -1)}.`, "awards.nervousTrigger", "awards.noRevengeOnAstronaut"),
    awardAssociation(),
    awardSaboteurIncognito(),
    awardBestCaptain(),
    awardWorstCaptain()
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
      securityRevengeShots: s.securityRevengeShots,
      shortestGame: s.shortestGame,
      longestGame: s.longestGame,
      firstEliminated: s.firstEliminated || 0,
      // V28: Nouvelles stats Phase 3
      correctSaboteurVotes: s.correctSaboteurVotes || 0,
      wrongSaboteurVotes: s.wrongSaboteurVotes || 0,
      totalVotes: s.totalVotes || 0,
      doctorNotSavedOpportunities: s.doctorNotSavedOpportunities || 0,
      doctorKillsOnSaboteurs: s.doctorKillsOnSaboteurs || 0,
      doctorKillsOnInnocents: s.doctorKillsOnInnocents || 0,
      revengeKillsOnSaboteurs: s.revengeKillsOnSaboteurs || 0,
      revengeKillsOnInnocents: s.revengeKillsOnInnocents || 0,
      doctorMissedSaves: s.doctorMissedSaves || 0,
      mayorTiebreakerOk: s.mayorTiebreakerOk || 0,
      mayorTiebreakerKo: s.mayorTiebreakerKo || 0,
      mayorTiebreakerTotal: s.mayorTiebreakerTotal || 0
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


// V24: Stats pour Pie Chart - répartition des morts par source
// V26: Stats pour Pie Chart - répartition des morts par source (détaillé)
const deathBySource = {
  vote: 0,
  saboteurs: 0,
  doctor: 0,
  revenge: 0,
  linked: 0,
  other: 0
};
for (const e of room.matchLog) {
  if (e.type !== "player_died") continue;
  const src = e.source || "other";
  if (src === "vote" || src === "tiebreak" || src === "tie_random" || src === "tiebreak_fallback") {
    deathBySource.vote++;
  } else if (src === "saboteurs") {
    deathBySource.saboteurs++;
  } else if (src === "doctor") {
    deathBySource.doctor++;
  } else if (src === "revenge" || src === "security") {
    deathBySource.revenge++;
  } else if (src === "linked" || src === "lover_suicide") {
    deathBySource.linked++;
  } else {
    deathBySource.other++;
  }
}

// V24: Durée de partie
const gameDuration = (room.endTime && room.startTime) ? (room.endTime - room.startTime) : 0;

return { winner, players, deathOrder, awards, counters, statsByName, detailedStatsByName, deathBySource, gameDuration };
}

function endGame(room, winner) {
  room.ended = true;
  room.endTime = Date.now(); // V24: Pour calcul durée partie

  // V26: Trouver le premier éliminé
  let firstDeadId = null;
  for (const e of room.matchLog) {
    if (e.type === "player_died" && e.playerId) {
      firstDeadId = e.playerId;
      break;
    }
  }

  // persist stats per name FIRST (so the end report reflects the updated totals)
  for (const p of room.players.values()) {
    if (p.status === "left") continue;

    const st = ensurePlayerStats(p.name);
    st.gamesPlayed += 1;
    
    // V26: Incrémenter si premier éliminé
    if (p.playerId === firstDeadId) {
      st.firstEliminated = (st.firstEliminated || 0) + 1;
    }

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
    
    // V24: Mettre à jour temps de partie le plus court/long
    const gameDuration = (room.endTime && room.startTime) ? (room.endTime - room.startTime) : 0;
    if (gameDuration > 0) {
      if (st.shortestGame === null || gameDuration < st.shortestGame) {
        st.shortestGame = gameDuration;
      }
      if (st.longestGame === null || gameDuration > st.longestGame) {
        st.longestGame = gameDuration;
      }
    }
  }
  
  // V28: Calculer et enregistrer les stats Phase 3 basées sur matchLog
  const playerIdToName = new Map();
  for (const p of room.players.values()) {
    playerIdToName.set(p.playerId, p.name);
  }
  
  for (const p of room.players.values()) {
    if (p.status === "left") continue;
    const st = ensurePlayerStats(p.name);
    
    // Compter les votes de ce joueur
    for (const e of room.matchLog) {
      // V28 FIX: Votes sont dans "day_votes" avec objet votes: {voterId: targetId}
      if (e.type === "day_votes" && e.votes) {
        const votesObj = e.votes;
        // Vérifier si ce joueur a voté dans cet événement
        const targetId = votesObj[p.playerId];
        if (targetId) {
          st.totalVotes = (st.totalVotes || 0) + 1;
          
          // V28 FIX2: Chercher le joueur cible de manière robuste
          let targetPlayer = room.players.get(targetId);
          // Fallback: chercher par itération si get() échoue
          if (!targetPlayer) {
            for (const [pid, pl] of room.players.entries()) {
              if (pid === targetId || String(pid) === String(targetId)) {
                targetPlayer = pl;
                break;
              }
            }
          }
          
          const targetRole = targetPlayer?.role;
          const targetTeam = ROLES[targetRole]?.team || "astronauts";
          
          // Debug log
          const voterTeam = ROLES[p.role]?.team || "astronauts";
          console.log(`[V30 Stats] Player ${p.name} (team: ${voterTeam}) voted for ${targetId} (role: ${targetRole}, team: ${targetTeam})`);
          
          // V30: Ne compter les votes que pour les astronautes
          // Les saboteurs ne doivent pas avoir de "votes faux" car leur but est de tuer les innocents
          if (voterTeam !== "saboteurs") {
            if (targetTeam === "saboteurs") {
              st.correctSaboteurVotes = (st.correctSaboteurVotes || 0) + 1;
            } else {
              st.wrongSaboteurVotes = (st.wrongSaboteurVotes || 0) + 1;
            }
          }
          // Note: Les saboteurs n'ont pas de stats de votes corrects/faux
        }
      }
      
      // Stats du docteur - potion fatale
      if (e.type === "doctor_kill" && e.by === p.playerId) {
        const targetRole = e.targetRole || room.players.get(e.targetId)?.role;
        const targetTeam = ROLES[targetRole]?.team || "astronauts";
        if (targetTeam === "saboteurs") {
          st.doctorKillsOnSaboteurs = (st.doctorKillsOnSaboteurs || 0) + 1;
        } else {
          st.doctorKillsOnInnocents = (st.doctorKillsOnInnocents || 0) + 1;
        }
      }
      
      // Stats du security - vengeance
      if (e.type === "revenge_shot" && e.by === p.playerId) {
        const targetRole = e.targetRole || room.players.get(e.targetId)?.role;
        const targetTeam = ROLES[targetRole]?.team || "astronauts";
        if (targetTeam === "saboteurs") {
          st.revengeKillsOnSaboteurs = (st.revengeKillsOnSaboteurs || 0) + 1;
        } else {
          st.revengeKillsOnInnocents = (st.revengeKillsOnInnocents || 0) + 1;
        }
      }
      
      // Stats du maire - départage
      if (e.type === "captain_tiebreak" && e.captainId === p.playerId) {
        st.mayorTiebreakerTotal = (st.mayorTiebreakerTotal || 0) + 1;
        const targetTeam = e.targetTeam || ROLES[e.targetRole]?.team || "astronauts";
        if (targetTeam === "saboteurs") {
          st.mayorTiebreakerOk = (st.mayorTiebreakerOk || 0) + 1;
        } else {
          st.mayorTiebreakerKo = (st.mayorTiebreakerKo || 0) + 1;
        }
      }
    }
    
    // V28: Calculer doctorMissedSaves et doctorNotSavedOpportunities
    // Si le joueur était docteur et n'a pas utilisé la potion de vie
    if (p.role === "doctor" && !room.doctorLifeUsed) {
      // Compter les morts par saboteurs (opportunités manquées)
      let missedOpportunities = 0;
      for (const e of room.matchLog) {
        if (e.type === "player_died" && e.source === "saboteurs") {
          missedOpportunities++;
        }
      }
      if (missedOpportunities > 0) {
        st.doctorMissedSaves = (st.doctorMissedSaves || 0) + missedOpportunities;
        st.doctorNotSavedOpportunities = (st.doctorNotSavedOpportunities || 0) + missedOpportunities;
      }
    }
  }
  
  saveStats(statsDb);
  
  // V26: Vérifier et attribuer les badges
  for (const p of room.players.values()) {
    if (p.status === "left") continue;
    const st = ensurePlayerStats(p.name);
    const newBadges = badges.checkAndAwardBadges(p.name, st, st.matchHistory || []);
    
    // Envoyer les nouveaux badges au joueur
    if (newBadges.length > 0 && p.connected && p.socketId) {
      const sock = io.sockets.sockets.get(p.socketId);
      if (sock) {
        sock.emit("newBadges", { badges: newBadges });
      }
    }
  }

  const report = buildEndReport(room, winner);
  room.endReport = report;
  setPhase(room, "GAME_OVER", { winner, report });
  logEvent(room, "game_over", { winner });
  logger.endGame(room.code, winner, Date.now() - room.startTime, room.players.size);
  console.log(`[${room.code}] game_over winner=${winner}`);
}


// ----------------- role assignment -----------------
function buildRolePool(room) {
  const n = room.players.size;
  const sabCount = countSaboteursFor(n);
  const enabled = room.config.rolesEnabled || {};
  const pool = [];
  
  // 1. Saboteurs en premier (selon nombre de joueurs)
  for (let i = 0; i < sabCount; i++) pool.push("saboteur");
  
  // 2-7. Rôles spéciaux par ordre de priorité:
  // radar > doctor > chameleon > security > ai_agent > astronaut > engineer
  const priorityOrder = ["radar", "doctor", "chameleon", "security", "ai_agent", "engineer"];
  const specials = [];
  for (const role of priorityOrder) {
    if (enabled[role]) specials.push(role);
  }
  
  // V24: Debug log pour voir la distribution
  console.log(`[buildRolePool] n=${n}, sabCount=${sabCount}, enabled=${JSON.stringify(enabled)}, specials before splice=${JSON.stringify(specials)}`);
  
  const maxSpecials = Math.max(0, n - sabCount);
  specials.splice(maxSpecials);
  pool.push(...specials);
  
  // Astronautes pour compléter
  while (pool.length < n) pool.push("astronaut");
  
  console.log(`[buildRolePool] Final pool=${JSON.stringify(pool)}`);
  return pool;
}

function assignRolesAuto(room) {
  const players = shuffle(Array.from(room.players.values()));
  const pool = shuffle(buildRolePool(room));
  for (let i = 0; i < players.length; i++) players[i].role = pool[i] || "astronaut";
  room.doctorLifeUsed = false;
  room.doctorDeathUsed = false;
  room.chameleonUsed = false;
  room.afterChameleonReveal = false;
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
  room.afterChameleonReveal = false;

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
  room.startTime = Date.now();  // V26: Pour calcul durée partie

  // clear captain
  for (const p of room.players.values()) p.isCaptain = false;

  if (room.config.manualRoles) {
    // Enforce exact counts based on pool
    const pool = buildRolePool(room);
    const remaining = {};
    for (const r of pool) remaining[r] = (remaining[r] || 0) + 1;
    logger.info("manual_role_pick_start", { roomCode: room.code, remaining, poolSize: pool.length });
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
    // Distinguish sources for stats/awards.
    let source = "night";
    if (nd.doctorKill && pid === nd.doctorKill) source = "doctor";
    else if (nd.saboteurTarget && pid === nd.saboteurTarget && pid !== nd.doctorSave) source = "saboteurs";
    if (killPlayer(room, pid, source)) newlyDead.push(pid);
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

  // log votes for awards (e.g. Saboteur Incognito)
  logEvent(room, "day_votes", { day: room.day, votes: JSON.parse(JSON.stringify(votes || {})), counts: JSON.parse(JSON.stringify(counts || {})) });

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
  const captainTerm = getTerm('captain', room);
  
  switch (e.type) {
    case "phase": return { kind: "info", text: `[${t}] ➜ ${getPhaseName(e.phase, room)}` };
    case "roles_assigned": return { kind: "info", text: `[${t}] Rôles attribués.` };
    case "captain_elected": return { kind: "info", text: `[${t}] ⭐ ${captainTerm}: ${name(e.playerId)}` };
    case "player_died": return { kind: "info", text: `[${t}] 🚀 ${name(e.playerId)} a été éjecté.` };
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
  // Clone phaseData so we can safely redact/augment per viewer.
  const phaseData = JSON.parse(JSON.stringify(room.phaseData || {}));

  const players = Array.from(room.players.values()).map(p => {
    const base = {
      playerId: p.playerId,
      name: p.name,
      status: p.status,
      connected: !!p.connected,
      ready: !!p.ready,
      isHost: room.hostPlayerId === p.playerId,
      isCaptain: !!p.isCaptain,
      // D9: Données de personnalisation
      avatarId: p.avatarId || null,
      avatarEmoji: p.avatarEmoji || null,
      avatarUrl: p.avatarUrl || null,  // V31: Avatar IA
      colorId: p.colorId || null,
      colorHex: p.colorHex || null,
      badgeId: p.badgeId || null,
      badgeEmoji: p.badgeEmoji || null,
      badgeName: p.badgeName || null
    };
    if (!room.started) return base;

    if (room.ended || room.phase === "GAME_OVER") {
      base.role = p.role;
      base.roleLabel = getRoleLabel(p.role, room);
      base.roleIcon = ROLES[p.role]?.icon || null;
      return base;
    }

    if (viewer && viewer.playerId === p.playerId) {
      base.role = p.role;
      base.roleLabel = getRoleLabel(p.role, room);
      base.roleIcon = ROLES[p.role]?.icon || null;
    } else if (viewer && viewer.role === "saboteur" && p.role === "saboteur") {
      base.role = "saboteur";
      base.roleLabel = getRoleLabel("saboteur", room);
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
    roleLabel: viewer.role ? getRoleLabel(viewer.role, room) : null,
    roleIcon: viewer.role ? (ROLES[viewer.role]?.icon || null) : null,
    isCaptain: !!viewer.isCaptain,
    captainIcon: viewer.isCaptain ? CAPTAIN_ICON : null,
    linkedTo: viewer.linkedTo,
    linkedName: viewer.linkedName,
    canBroadcastVideo: !!viewer.canBroadcastVideo  // V32: Peut diffuser vidéo
  } : null;

  const teams = computeTeams(room);
  const logs = room.matchLog.slice(-30).map(e => formatLogLine(room, e)).filter(Boolean);

  const privateLines = [];
  if (viewer && room.phase === "NIGHT_RADAR" && room.phaseData?.lastRadarResult?.viewerId === viewerId) {
    // V24: Envoyer les données structurées pour traduction côté client
    privateLines.push({ 
      kind: "private", 
      type: "radar_result",
      text: room.phaseData.lastRadarResult.text,
      roleKey: room.phaseData.lastRadarResult.roleKey,
      targetName: room.players.get(room.phaseData.lastRadarResult.targetId)?.name || "?"
    });
  }
  if (viewer && viewer.linkedTo) privateLines.push({ kind: "private", text: `🔗 Lié à ${viewer.linkedName || "?"}` });

  // Augment/redact saboteur votes for the saboteur phase.
  if (room.phase === "NIGHT_SABOTEURS") {
    if (viewer && viewer.role === "saboteur" && viewer.status === "alive") {
      const votes = phaseData.votes || {};
      phaseData.teamVotes = Object.entries(votes)
        .map(([sid, tid]) => {
          const sp = room.players.get(sid);
          const tp = room.players.get(tid);
          return { saboteurId: sid, saboteurName: sp?.name || "?", targetId: tid, targetName: tp?.name || "?" };
        });
      phaseData.yourVoteId = votes[viewer.playerId] || null;
    } else {
      // Never expose votes to non-saboteurs.
      delete phaseData.votes;
      delete phaseData.teamVotes;
      delete phaseData.yourVoteId;
    }
  }

  // D6: Ajouter yourVoteId pour les autres phases de vote
  if (["DAY_VOTE", "CAPTAIN_VOTE", "DAY_TIEBREAK", "REVENGE"].includes(room.phase)) {
    const votes = room.phaseData?.votes || {};
    if (viewer) {
      phaseData.yourVoteId = votes[viewer.playerId] || null;
    }
    // Ne pas exposer les votes des autres joueurs
    delete phaseData.votes;
  }

  return {
    roomCode: room.code,
    phase: room.phase,
    phaseData,
    started: room.started,
    ended: room.ended,
    aborted: room.aborted,
    day: room.day,
    night: room.night,
    config: room.config,
    themeId: room.themeId || "default",  // V26: Thème sélectionné
    phaseStartTime: room.phaseStartTime || Date.now(),  // V26: Pour timer hôte
    audio: room.audio,
    // V9.3.1: Option lobby — partie sans visio
    // IMPORTANT: doit être exposée au client sinon la checkbox se réinitialise.
    videoDisabled: !!room.videoDisabled,
    ack: { 
      done: room.phaseAck.size, 
      total: required.length,
      pending: required.filter(pid => !room.phaseAck.has(pid))  // V26: Liste des AFK
    },
    teams,
    players,
    you,
    logs,
    privateLines,
    // V27: Permissions vidéo
    videoPermissions: room.videoPermissions ? room.videoPermissions[viewerId] : null,
    videoPhaseMessage: room.videoPhaseMessage || null
  };
}

// ----------------- socket server -----------------
const app = express();

// CORS pour l'app mobile Capacitor
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// D6: Configuration de cache pour les assets statiques
// Fonction middleware pour définir les headers de cache selon le type de fichier
const cacheMiddleware = (req, res, next) => {
  // Images et sons: cache longue durée (1 an)
  if (req.url.startsWith('/images/') || req.url.startsWith('/sounds/')) {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  } 
  // JS/CSS: cache courte durée (1 heure)
  else if (req.url.endsWith('.js') || req.url.endsWith('.css')) {
    res.setHeader('Cache-Control', 'public, max-age=3600');
  }
  // HTML: pas de cache (toujours frais)
  else if (req.url.endsWith('.html') || req.url === '/') {
    res.setHeader('Cache-Control', 'no-cache');
  }
  next();
};

app.use(cacheMiddleware);

// ============================================================================
// STRIPE WEBHOOK (doit être AVANT express.json pour recevoir le body raw)
// ============================================================================
app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  if (!stripe) {
    console.log('[Stripe] Stripe non configuré');
    return res.status(400).send('Stripe not configured');
  }
  
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  let event;
  
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('[Stripe Webhook] Signature invalide:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  
  console.log(`[Stripe Webhook] Événement reçu: ${event.type}`);
  
  // Traiter les événements
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const stripeUserId = session.metadata?.userId;
      const priceType = session.metadata?.priceType;
      
      console.log(`[Stripe] Paiement réussi pour user ${stripeUserId}, type: ${priceType}`);
      
      if (stripeUserId) {
        try {
          if (priceType === 'subscription') {
            // Abonnement mensuel : passer en subscriber
            dbRun(`
              UPDATE users 
              SET account_type = 'subscriber', 
                  video_credits = 999999,
                  stripeCustomerId = ?,
                  stripeSubscriptionId = ?
              WHERE id = ?
            `, [session.customer, session.subscription, stripeUserId]);
            console.log(`[Stripe] User ${stripeUserId} upgradé en subscriber`);
            
          } else if (priceType === 'pack') {
            // Pack crédits : ajouter 50 crédits
            dbRun(`
              UPDATE users 
              SET account_type = CASE WHEN account_type = 'free' THEN 'pack' ELSE account_type END,
                  video_credits = video_credits + 50,
                  avatars_used = CASE WHEN avatars_used > 50 THEN avatars_used - 50 ELSE 0 END,
                  stripeCustomerId = ?
              WHERE id = ?
            `, [session.customer, stripeUserId]);
            console.log(`[Stripe] User ${stripeUserId} a reçu 50 crédits`);
          }
          
        } catch (dbError) {
          console.error('[Stripe] Erreur DB:', dbError);
        }
      }
      break;
    }
    
    case 'customer.subscription.created': {
      const subscription = event.data.object;
      console.log(`[Stripe] Nouvel abonnement créé: ${subscription.id}`);
      break;
    }
    
    case 'customer.subscription.updated': {
      const subscription = event.data.object;
      console.log(`[Stripe] Abonnement mis à jour: ${subscription.id}, status: ${subscription.status}`);
      break;
    }
    
    case 'customer.subscription.deleted': {
      // Abonnement annulé
      const subscription = event.data.object;
      const customerId = subscription.customer;
      
      console.log(`[Stripe] Abonnement annulé pour customer ${customerId}`);
      
      dbRun(`
        UPDATE users 
        SET account_type = 'free',
            video_credits = 0,
            stripeSubscriptionId = NULL
        WHERE stripeCustomerId = ?
      `, [customerId]);
      
      break;
    }
    
    case 'invoice.payment_succeeded': {
      const invoice = event.data.object;
      console.log(`[Stripe] Paiement facture réussi: ${invoice.id}`);
      break;
    }
    
    case 'invoice.payment_failed': {
      // Paiement échoué (abonnement)
      const invoice = event.data.object;
      const customerId = invoice.customer;
      console.log(`[Stripe] Paiement échoué pour customer ${customerId}`);
      // TODO: Envoyer email de relance
      break;
    }
    
    case 'charge.refunded': {
      const charge = event.data.object;
      console.log(`[Stripe] Remboursement effectué: ${charge.id}`);
      break;
    }
    
    case 'customer.created': {
      const customer = event.data.object;
      console.log(`[Stripe] Nouveau client créé: ${customer.id} (${customer.email})`);
      break;
    }
  }
  
  res.json({ received: true });
});

app.use(express.json()); // Pour parser le JSON des requêtes auth
app.use(express.static(path.join(__dirname, "public")));
app.use("/avatars", express.static(AVATARS_DIR)); // Servir les avatars

// Initialiser les systèmes
const rateLimiter = new RateLimiter();
const BadgeSystem = require("./badge-system");
const badges = new BadgeSystem(DATA_DIR);
const ThemeManager = require("./theme-manager");
const themeManager = new ThemeManager(path.join(__dirname, "themes"));

// Garbage collection périodique du rate limiter
setInterval(() => rateLimiter.gc(), 60000); // Toutes les minutes

logger.info("server_start", { port: PORT, build: BUILD_ID });

// ============================================================================
// ROUTES D'AUTHENTIFICATION
// ============================================================================

// Inscription
app.post("/api/auth/register", async (req, res) => {
  try {
    if (!bcrypt || !jwt) return res.status(500).json({ error: "Auth non configurée" });
    
    const { email, username, password, promoCode, lang } = req.body;
    const userLang = lang || 'fr'; // Langue par défaut français
    const ip = getClientIP(req);

    if (!email || !username || !password) {
      return res.status(400).json({ error: "Email, pseudo et mot de passe requis" });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "Mot de passe trop court (min 6)" });
    }
    if (username.length < 2 || username.length > 20) {
      return res.status(400).json({ error: "Pseudo entre 2 et 20 caractères" });
    }
    if (isBlockedEmailDomain(email)) {
      return res.status(400).json({ error: "Ce type d'email n'est pas accepté" });
    }
    if (!checkAccountCreationLimit(ip)) {
      return res.status(429).json({ error: "Trop de comptes créés. Réessaie demain." });
    }

    const existingEmail = dbGet("SELECT id FROM users WHERE email = ?", [email.toLowerCase()]);
    if (existingEmail) return res.status(400).json({ error: "Email déjà utilisé" });

    const existingUsername = dbGet("SELECT id FROM users WHERE username = ?", [username]);
    if (existingUsername) return res.status(400).json({ error: "Pseudo déjà pris" });

    let accountType = "free";
    let videoCredits = 2; // Par défaut pour free
    
    if (promoCode) {
      const code = promoCode.toUpperCase().trim();
      
      if (ADMIN_CODES.includes(code)) {
        accountType = "admin";
        videoCredits = 999999;
      } else if (FAMILY_CODES.includes(code)) {
        accountType = "subscriber";
        videoCredits = 999999; // Famille = illimité
      } else if (PROMO_CODES[code]) {
        accountType = PROMO_CODES[code];
        if (accountType === "subscriber") {
          videoCredits = 999999;
        } else if (accountType === "pack") {
          videoCredits = 50;
        }
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = generateVerificationToken();
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const result = dbInsert(
      `INSERT INTO users (email, username, password, account_type, verification_token, verification_expires, created_from_ip, video_credits)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [email.toLowerCase(), username, hashedPassword, accountType, verificationToken, verificationExpires, ip, videoCredits]
    );

    dbInsert("INSERT INTO account_creation_log (ip_address, email) VALUES (?, ?)", [ip, email.toLowerCase()]);
    const emailResult = await sendVerificationEmail(email, username, verificationToken, userLang);

    const token = jwt.sign({ id: result.lastInsertRowid, email: email.toLowerCase(), username, accountType }, JWT_SECRET, { expiresIn: "30d" });

    res.json({
      success: true, token,
      user: { id: result.lastInsertRowid, email: email.toLowerCase(), username, accountType, emailVerified: false, videoCredits },
      message: emailResult.simulated ? "Compte créé ! (Email simulé)" : "Compte créé ! Vérifie ton email."
    });
  } catch (error) {
    console.error("❌ Erreur inscription:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Connexion
app.post("/api/auth/login", async (req, res) => {
  try {
    if (!bcrypt || !jwt) return res.status(500).json({ error: "Auth non configurée" });
    
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email et mot de passe requis" });

    const user = dbGet("SELECT * FROM users WHERE email = ?", [email.toLowerCase()]);
    if (!user) return res.status(401).json({ error: "Email ou mot de passe incorrect" });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(401).json({ error: "Email ou mot de passe incorrect" });

    dbRun("UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?", [user.id]);

    const token = jwt.sign({ id: user.id, email: user.email, username: user.username, accountType: user.account_type }, JWT_SECRET, { expiresIn: "30d" });

    res.json({
      success: true, token,
      user: {
        id: user.id, email: user.email, username: user.username,
        accountType: user.account_type, emailVerified: user.email_verified === 1,
        videoCredits: user.video_credits, currentAvatar: user.current_avatar
      }
    });
  } catch (error) {
    console.error("❌ Erreur connexion:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Vérifier email
app.get("/api/auth/verify-email", async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ error: "Token manquant" });

    const user = dbGet("SELECT * FROM users WHERE verification_token = ? AND verification_expires > datetime('now')", [token]);
    if (!user) return res.status(400).json({ error: "Token invalide ou expiré" });

    dbRun("UPDATE users SET email_verified = 1, verification_token = NULL WHERE id = ?", [user.id]);

    res.json({ success: true, message: "Email vérifié ! 2 parties vidéo débloquées.", username: user.username });
  } catch (error) {
    console.error("❌ Erreur vérification:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Renvoyer email
app.post("/api/auth/resend-verification", async (req, res) => {
  try {
    const { email, lang } = req.body;
    const userLang = lang || 'fr';
    const user = dbGet("SELECT * FROM users WHERE email = ?", [email?.toLowerCase()]);
    if (!user) return res.status(404).json({ error: "Utilisateur non trouvé" });
    if (user.email_verified === 1) return res.status(400).json({ error: "Email déjà vérifié" });

    const verificationToken = generateVerificationToken();
    dbRun("UPDATE users SET verification_token = ?, verification_expires = ? WHERE id = ?",
      [verificationToken, new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), user.id]);
    await sendVerificationEmail(user.email, user.username, verificationToken, userLang);

    res.json({ success: true, message: "Email renvoyé" });
  } catch (error) {
    console.error("❌ Erreur renvoi:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Mot de passe oublié
app.post("/api/auth/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ success: false, error: "Email requis" });
    }
    
    const user = dbGet("SELECT id, username, email FROM users WHERE email = ?", [email.toLowerCase()]);
    
    // Toujours répondre succès pour éviter de révéler si l'email existe
    if (!user) {
      return res.json({ success: true, message: "Si cet email existe, un lien a été envoyé" });
    }
    
    // Générer token de reset
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 heure
    
    dbRun("UPDATE users SET reset_token = ?, reset_expires = ? WHERE id = ?", 
      [resetToken, resetExpires.toISOString(), user.id]);
    
    
    // Envoyer email
    if (resend) {
      const resetUrl = `${APP_URL}/reset-password.html?token=${resetToken}`;
      
      await resend.emails.send({
        from: process.env.EMAIL_FROM || "Saboteur Game <noreply@saboteurs-loup-garou.com>",
        to: user.email,
        subject: "🔑 Réinitialisation de ton mot de passe - Saboteur",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #1a1a2e, #16213e); color: #fff; border-radius: 15px;">
            <h1 style="text-align: center; color: #00ffff;">🔑 Mot de passe oublié</h1>
            <p>Salut <strong>${user.username}</strong> !</p>
            <p>Tu as demandé à réinitialiser ton mot de passe.</p>
            <p>Clique sur le bouton ci-dessous (valable 1 heure) :</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="display: inline-block; padding: 15px 40px; background: linear-gradient(135deg, #00ffff, #0099cc); color: #000; text-decoration: none; border-radius: 10px; font-weight: bold; font-size: 1.1em;">
                🔐 Réinitialiser mon mot de passe
              </a>
            </div>
            <p style="color: #888; font-size: 0.9em;">Si tu n'as pas fait cette demande, ignore cet email.</p>
            <hr style="border: none; border-top: 1px solid #333; margin: 20px 0;">
            <p style="text-align: center; color: #666; font-size: 0.8em;">🎭 L'équipe Saboteur</p>
          </div>
        `
      });
      
      logger.info("password_reset_sent", { email: user.email });
    }
    
    res.json({ success: true, message: "Email envoyé" });
    
  } catch (error) {
    console.error("Erreur forgot-password:", error);
    res.status(500).json({ success: false, error: "Erreur serveur" });
  }
});

// Réinitialiser le mot de passe
app.post("/api/auth/reset-password", async (req, res) => {
  try {
    const { token, password } = req.body;
    
    if (!token || !password) {
      return res.status(400).json({ success: false, error: "Token et mot de passe requis" });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ success: false, error: "Mot de passe trop court (min 6)" });
    }
    
    const user = dbGet("SELECT id, username, email, reset_expires FROM users WHERE reset_token = ?", [token]);
    
    if (!user) {
      return res.status(400).json({ success: false, error: "Lien invalide ou expiré" });
    }
    
    // Vérifier expiration
    if (new Date(user.reset_expires) < new Date()) {
      return res.status(400).json({ success: false, error: "Lien expiré, redemande un nouveau" });
    }
    
    // Hasher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Mettre à jour
    dbRun("UPDATE users SET password = ?, reset_token = NULL, reset_expires = NULL WHERE id = ?", 
      [hashedPassword, user.id]);
    
    
    logger.info("password_reset_completed", { email: user.email });
    
    res.json({ success: true, message: "Mot de passe modifié avec succès" });
    
  } catch (error) {
    console.error("Erreur reset-password:", error);
    res.status(500).json({ success: false, error: "Erreur serveur" });
  }
});

// Profil
app.get("/api/auth/me", authenticateToken, (req, res) => {
  try {
    const user = dbGet("SELECT * FROM users WHERE id = ?", [req.user.id]);
    if (!user) return res.status(404).json({ error: "Utilisateur non trouvé" });

    const limits = getUserLimits(user);
    res.json({
      user: {
        id: user.id, email: user.email, username: user.username,
        accountType: user.account_type, emailVerified: user.email_verified === 1,
        videoCredits: user.video_credits, avatarsUsed: user.avatars_used,
        currentAvatar: user.current_avatar
      },
      limits: { videoCredits: limits.videoCredits, avatars: limits.avatars, themes: limits.themes }
    });
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Vérifier crédits vidéo
app.get("/api/video/can-play", optionalAuth, (req, res) => {
  if (!req.user) {
    return res.json({ canPlay: false, reason: "no_account", message: "Crée un compte pour la vidéo", videoCredits: 0 });
  }
  const user = dbGet("SELECT * FROM users WHERE id = ?", [req.user.id]);
  if (!user) return res.json({ canPlay: false, reason: "user_not_found", videoCredits: 0 });
  if (user.email_verified !== 1) {
    return res.json({ canPlay: false, reason: "email_not_verified", message: "Vérifie ton email", videoCredits: user.video_credits });
  }
  const limits = getUserLimits(user);
  if (limits.videoCredits === Infinity) {
    return res.json({ canPlay: true, reason: "unlimited", videoCredits: "∞" });
  }
  if (user.video_credits <= 0) {
    return res.json({ canPlay: false, reason: "no_credits", message: "Plus de crédits vidéo", videoCredits: 0 });
  }
  res.json({ canPlay: true, reason: "has_credits", videoCredits: user.video_credits });
});

// Consommer crédit vidéo
app.post("/api/video/consume-credit", authenticateToken, (req, res) => {
  try {
    const user = dbGet("SELECT * FROM users WHERE id = ?", [req.user.id]);
    if (!user) return res.status(404).json({ error: "Utilisateur non trouvé" });
    if (user.email_verified !== 1) return res.status(403).json({ error: "Vérifie ton email" });

    const limits = getUserLimits(user);
    if (limits.videoCredits === Infinity) {
      dbRun("UPDATE users SET lifetime_games = lifetime_games + 1 WHERE id = ?", [user.id]);
      return res.json({ success: true, videoCredits: "∞" });
    }
    if (user.video_credits <= 0) {
      return res.status(403).json({ error: "Plus de crédits vidéo" });
    }

    dbRun("UPDATE users SET video_credits = video_credits - 1, lifetime_games = lifetime_games + 1 WHERE id = ?", [user.id]);
    res.json({ success: true, videoCredits: user.video_credits - 1 });
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Liste thèmes avatars
app.get("/api/avatars/themes", optionalAuth, (req, res) => {
  const user = req.user ? dbGet("SELECT * FROM users WHERE id = ?", [req.user.id]) : null;
  const limits = getUserLimits(user);
  const availableThemes = limits.themes === "all" ? Object.keys(AVATAR_THEMES) : limits.themes;

  const themes = {};
  for (const [key, theme] of Object.entries(AVATAR_THEMES)) {
    themes[key] = {
      name: theme.name, icon: theme.icon, premium: theme.premium,
      available: availableThemes.includes(key),
      characters: Object.entries(theme.characters).map(([k, c]) => ({ key: k, name: c.name }))
    };
  }
  res.json({ themes });
});

// ============== CONFIGURATION MULTER POUR UPLOAD PHOTO ==============
let uploadPhoto = null;
if (multer) {
  const photoStorage = multer.diskStorage({
    destination: UPLOADS_DIR,
    filename: (req, file, cb) => {
      const uniqueId = crypto.randomBytes(8).toString("hex");
      cb(null, `photo_${uniqueId}${path.extname(file.originalname)}`);
    }
  });
  uploadPhoto = multer({
    storage: photoStorage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB max
  });
}

// ============== ROUTES AVATAR GÉNÉRATION ==============

// Générer un avatar IA
app.post("/api/avatars/generate", authenticateToken, (req, res, next) => {
  if (!uploadPhoto) {
    return res.status(500).json({ error: "Service d'upload non configuré" });
  }
  uploadPhoto.single("photo")(req, res, next);
}, async (req, res) => {
  try {
    const { theme, character, customPrompt } = req.body;
    const user = dbGet("SELECT * FROM users WHERE id = ?", [req.user.id]);

    if (!user) {
      return res.status(404).json({ error: "Utilisateur non trouvé" });
    }

    if (!req.file) {
      return res.status(400).json({ error: "Photo requise" });
    }

    const limits = getUserLimits(user);

    // Vérifier limite avatars
    if (limits.avatars !== Infinity && user.avatars_used >= limits.avatars) {
      await fsPromises.unlink(req.file.path).catch(() => {});
      return res.status(403).json({ 
        error: "Limite d'avatars atteinte",
        avatarsUsed: user.avatars_used,
        avatarsLimit: limits.avatars
      });
    }

    // Vérifier accès au thème
    const availableThemes = limits.themes === "all" ? Object.keys(AVATAR_THEMES) : limits.themes;
    if (!availableThemes.includes(theme)) {
      await fsPromises.unlink(req.file.path).catch(() => {});
      return res.status(403).json({ error: "Thème non accessible avec ton abonnement" });
    }

    const themeConfig = AVATAR_THEMES[theme];
    const charConfig = themeConfig?.characters?.[character];

    if (!themeConfig || !charConfig) {
      await fsPromises.unlink(req.file.path).catch(() => {});
      return res.status(400).json({ error: "Thème ou personnage invalide" });
    }

    // Vérifier Replicate
    if (!Replicate) {
      await fsPromises.unlink(req.file.path).catch(() => {});
      return res.status(500).json({ error: "Service de génération non configuré (Replicate manquant)" });
    }

    const replicate = new Replicate({ auth: REPLICATE_API_TOKEN });

    // Lire et convertir l'image en base64
    const imageBuffer = await fsPromises.readFile(req.file.path);
    const base64Image = `data:image/jpeg;base64,${imageBuffer.toString("base64")}`;

    // Construire le prompt
    let finalPrompt;
    if (customPrompt && limits.customPrompt) {
      finalPrompt = customPrompt;
    } else {
      finalPrompt = `portrait photo of a person transformed into ${charConfig.prompt}, ${themeConfig.background}, high quality, detailed, 4k`;
    }

    console.log(`🎨 Génération avatar: ${theme}/${character} pour ${user.username}`);

    // Paramètres
    const instant_id = parseFloat(req.body.instant_id_strength) || 0.8;
    const prompt_str = parseFloat(req.body.prompt_strength) || 4.5;
    const denoise_str = parseFloat(req.body.denoising_strength) || 0.65;
    const depth_str = parseFloat(req.body.control_depth_strength) || 0.8;

    // Récupérer la dernière version du modèle
    let modelVersion = "fofr/face-to-many";
    try {
      const model = await replicate.models.get("fofr", "face-to-many");
      if (model.latest_version?.id) {
        modelVersion = `fofr/face-to-many:${model.latest_version.id}`;
        console.log(`📦 Utilisation version: ${model.latest_version.id.substring(0, 8)}...`);
      }
    } catch (versionError) {
      console.log(`⚠️ Impossible de récupérer la version, utilisation du fallback`);
    }

    // Appeler Replicate
    const output = await replicate.run(modelVersion, {
      input: {
        image: base64Image,
        style: "3D",
        prompt: finalPrompt,
        negative_prompt: "blurry, bad quality, distorted, ugly, deformed",
        prompt_strength: prompt_str,
        denoising_strength: denoise_str,
        instant_id_strength: instant_id,
        control_depth_strength: depth_str
      }
    });

    const resultUrl = Array.isArray(output) ? output[0] : output;

    if (!resultUrl) {
      throw new Error("Pas d'image générée");
    }

    // Télécharger et sauvegarder localement
    let localAvatarUrl = resultUrl;
    try {
      const protocol = resultUrl.startsWith("https") ? https : http;
      const imageData = await new Promise((resolve, reject) => {
        protocol.get(resultUrl, (response) => {
          const chunks = [];
          response.on("data", chunk => chunks.push(chunk));
          response.on("end", () => resolve(Buffer.concat(chunks)));
          response.on("error", reject);
        }).on("error", reject);
      });

      const avatarFilename = `avatar_${user.id}_${Date.now()}.webp`;
      const avatarPath = path.join(AVATARS_DIR, avatarFilename);

      if (sharp) {
        try {
          await sharp(imageData)
            .resize(512, 512, { fit: "cover" })
            .webp({ quality: 90 })
            .toFile(avatarPath);
          localAvatarUrl = `/avatars/${avatarFilename}`;
          console.log(`💾 Avatar sauvegardé (sharp): ${localAvatarUrl}`);
        } catch (sharpError) {
          console.error("⚠️ Erreur sharp, sauvegarde brute:", sharpError.message);
          // Fallback: sauvegarder le fichier brut avec extension correcte
          const rawFilename = `avatar_${user.id}_${Date.now()}.png`;
          const rawPath = path.join(AVATARS_DIR, rawFilename);
          fs.writeFileSync(rawPath, imageData);
          localAvatarUrl = `/avatars/${rawFilename}`;
          console.log(`💾 Avatar sauvegardé (brut): ${localAvatarUrl}`);
        }
      } else {
        // Pas de sharp: sauvegarder le fichier brut
        const rawFilename = `avatar_${user.id}_${Date.now()}.png`;
        const rawPath = path.join(AVATARS_DIR, rawFilename);
        fs.writeFileSync(rawPath, imageData);
        localAvatarUrl = `/avatars/${rawFilename}`;
        console.log(`💾 Avatar sauvegardé (sans sharp): ${localAvatarUrl}`);
      }
    } catch (downloadError) {
      console.error("⚠️ Erreur sauvegarde locale:", downloadError.message);
      // Garder l'URL Replicate comme fallback (temporaire!)
      console.warn("⚠️ Attention: URL Replicate temporaire utilisée!");
    }

    // Mettre à jour la base de données
    dbInsert(
      "INSERT INTO avatars (user_id, theme, character_type, image_url) VALUES (?, ?, ?, ?)",
      [user.id, theme, character, localAvatarUrl]
    );

    dbRun(
      "UPDATE users SET avatars_used = avatars_used + 1, current_avatar = ? WHERE id = ?",
      [localAvatarUrl, user.id]
    );

    // Nettoyer le fichier uploadé
    await fsPromises.unlink(req.file.path).catch(() => {});

    res.json({
      success: true,
      url: localAvatarUrl,
      theme,
      themeName: themeConfig.name,
      character,
      characterName: charConfig.name,
      avatarsUsed: user.avatars_used + 1,
      avatarsLimit: limits.avatars
    });

  } catch (error) {
    console.error("❌ Erreur génération avatar:", error);
    if (req.file) {
      await fsPromises.unlink(req.file.path).catch(() => {});
    }
    res.status(500).json({ error: error.message || "Erreur de génération" });
  }
});

// Liste des avatars de l'utilisateur
app.get("/api/avatars/my-avatars", authenticateToken, (req, res) => {
  try {
    const avatars = dbAll(
      "SELECT * FROM avatars WHERE user_id = ? ORDER BY created_at DESC",
      [req.user.id]
    );

    const user = dbGet("SELECT avatars_used, current_avatar FROM users WHERE id = ?", [req.user.id]);
    const limits = getUserLimits(user);

    res.json({
      avatars: avatars || [],
      avatarsUsed: user?.avatars_used || 0,
      avatarsLimit: limits.avatars,
      currentAvatar: user?.current_avatar
    });

  } catch (error) {
    console.error("❌ Erreur liste avatars:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Définir l'avatar actif
app.post("/api/avatars/set-current", authenticateToken, (req, res) => {
  try {
    const { avatarUrl } = req.body;

    dbRun("UPDATE users SET current_avatar = ? WHERE id = ?", [avatarUrl, req.user.id]);

    res.json({ success: true, currentAvatar: avatarUrl });

  } catch (error) {
    console.error("❌ Erreur set avatar:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Supprimer un avatar
app.delete("/api/avatars/delete", authenticateToken, (req, res) => {
  try {
    // V32: Seuls les admins peuvent supprimer des avatars
    const userInfo = dbGet("SELECT account_type FROM users WHERE id = ?", [req.user.id]);
    if (userInfo?.account_type !== "admin") {
      return res.status(403).json({ 
        error: "La suppression d'avatars n'est pas disponible. Choisis un autre avatar dans ta galerie !" 
      });
    }

    const { avatarId, avatarUrl } = req.body;

    // Trouver l'avatar
    let avatar;
    if (avatarId) {
      avatar = dbGet("SELECT * FROM avatars WHERE id = ? AND user_id = ?", [avatarId, req.user.id]);
    } else if (avatarUrl) {
      avatar = dbGet("SELECT * FROM avatars WHERE image_url = ? AND user_id = ?", [avatarUrl, req.user.id]);
    }

    if (!avatar) {
      return res.status(404).json({ error: "Avatar non trouvé" });
    }

    // Supprimer le fichier physique
    if (avatar.image_url && avatar.image_url.startsWith("/avatars/")) {
      const filename = avatar.image_url.replace("/avatars/", "");
      const filepath = path.join(AVATARS_DIR, filename);
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
        console.log(`🗑️ Fichier avatar supprimé: ${filename}`);
      }
    }

    // Supprimer de la base de données
    dbRun("DELETE FROM avatars WHERE id = ?", [avatar.id]);

    // Réinitialiser si c'était l'avatar actif
    const user = dbGet("SELECT current_avatar FROM users WHERE id = ?", [req.user.id]);
    if (user?.current_avatar === avatar.image_url) {
      const remainingAvatar = dbGet(
        "SELECT image_url FROM avatars WHERE user_id = ? ORDER BY created_at DESC LIMIT 1",
        [req.user.id]
      );
      dbRun("UPDATE users SET current_avatar = ? WHERE id = ?", 
        [remainingAvatar?.image_url || null, req.user.id]);
    }

    // Décrémenter le compteur
    dbRun("UPDATE users SET avatars_used = MAX(0, avatars_used - 1) WHERE id = ?", [req.user.id]);

    console.log(`🗑️ Avatar ${avatar.id} supprimé pour user ${req.user.id}`);

    res.json({ 
      success: true, 
      message: "Avatar supprimé",
      deletedId: avatar.id
    });

  } catch (error) {
    console.error("❌ Erreur suppression avatar:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ============================================================================
// V32: AVATAR PERSO (UPLOAD)
// ============================================================================

// Configuration multer pour upload d'avatars custom
// V32.1: Stocker dans AVATARS_DIR (Render Disk) pour persistance
const customAvatarsDir = path.join(AVATARS_DIR, 'custom');
fs.mkdirSync(customAvatarsDir, { recursive: true });

const avatarUploadStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, customAvatarsDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `custom_${req.user.id}_${Date.now()}.webp`;
    cb(null, uniqueName);
  }
});

const avatarUpload = multer({
  storage: avatarUploadStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 Mo max
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Format non supporté'), false);
    }
  }
});

// Récupérer l'avatar custom de l'utilisateur
app.get("/api/avatar/my-custom", authenticateToken, (req, res) => {
  try {
    const user = dbGet("SELECT custom_avatar FROM users WHERE id = ?", [req.user.id]);
    res.json({ ok: true, customAvatar: user?.custom_avatar || null });
  } catch (error) {
    console.error("❌ Erreur get custom avatar:", error);
    res.status(500).json({ ok: false, error: "Erreur serveur" });
  }
});

// Upload d'un avatar custom
app.post("/api/avatar/upload-custom", authenticateToken, avatarUpload.single('avatar'), (req, res) => {
  try {
    // Vérifier email vérifié
    const user = dbGet("SELECT email_verified, custom_avatar FROM users WHERE id = ?", [req.user.id]);
    if (!user?.email_verified) {
      // Supprimer le fichier uploadé
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(403).json({ ok: false, error: "Vérifie ton email d'abord" });
    }
    
    // Supprimer l'ancien avatar custom s'il existe
    if (user.custom_avatar) {
      // V32.1: Chercher dans AVATARS_DIR (nouveau) et public (ancien)
      const newPath = path.join(AVATARS_DIR, user.custom_avatar.replace('/avatars/', ''));
      const oldPath = path.join(__dirname, 'public', user.custom_avatar);
      
      if (fs.existsSync(newPath)) {
        fs.unlinkSync(newPath);
      } else if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }
    
    const avatarUrl = `/avatars/custom/${req.file.filename}`;
    
    // Enregistrer dans la base
    dbRun("UPDATE users SET custom_avatar = ? WHERE id = ?", [avatarUrl, req.user.id]);
    
    console.log(`📸 Avatar custom uploadé pour user ${req.user.id}: ${avatarUrl}`);
    
    res.json({ ok: true, avatarUrl });
    
  } catch (error) {
    console.error("❌ Erreur upload custom avatar:", error);
    if (req.file) {
      try { fs.unlinkSync(req.file.path); } catch(e) {}
    }
    res.status(500).json({ ok: false, error: "Erreur serveur" });
  }
});

// Supprimer l'avatar custom
app.delete("/api/avatar/delete-custom", authenticateToken, (req, res) => {
  try {
    const user = dbGet("SELECT custom_avatar FROM users WHERE id = ?", [req.user.id]);
    
    if (user?.custom_avatar) {
      // V32.1: Chercher dans AVATARS_DIR (nouveau) et public (ancien)
      const newPath = path.join(AVATARS_DIR, user.custom_avatar.replace('/avatars/', ''));
      const oldPath = path.join(__dirname, 'public', user.custom_avatar);
      
      if (fs.existsSync(newPath)) {
        fs.unlinkSync(newPath);
      } else if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
      
      // Réinitialiser dans la base
      dbRun("UPDATE users SET custom_avatar = NULL WHERE id = ?", [req.user.id]);
      
      // Si c'était l'avatar actif, le réinitialiser
      const currentUser = dbGet("SELECT current_avatar FROM users WHERE id = ?", [req.user.id]);
      if (currentUser?.current_avatar === user.custom_avatar) {
        dbRun("UPDATE users SET current_avatar = NULL WHERE id = ?", [req.user.id]);
      }
      
      console.log(`🗑️ Avatar custom supprimé pour user ${req.user.id}`);
    }
    
    res.json({ ok: true });
    
  } catch (error) {
    console.error("❌ Erreur delete custom avatar:", error);
    res.status(500).json({ ok: false, error: "Erreur serveur" });
  }
});

// V32.2: API pour voir les fichiers avatars (debug)
app.get("/api/admin/list-files", (req, res) => {
  try {
    const result = {
      DATA_DIR,
      AVATARS_DIR,
      avatars: [],
      customAvatars: [],
      publicAvatars: []
    };
    
    // Avatars IA
    if (fs.existsSync(AVATARS_DIR)) {
      result.avatars = fs.readdirSync(AVATARS_DIR).filter(f => !fs.statSync(path.join(AVATARS_DIR, f)).isDirectory());
    }
    
    // Avatars custom (nouveau chemin)
    const customDir = path.join(AVATARS_DIR, 'custom');
    if (fs.existsSync(customDir)) {
      result.customAvatars = fs.readdirSync(customDir);
    }
    
    // Avatars dans public (ancien chemin)
    const publicDir = path.join(__dirname, 'public', 'avatars');
    if (fs.existsSync(publicDir)) {
      result.publicAvatars = fs.readdirSync(publicDir, { recursive: true });
    }
    
    res.json(result);
  } catch (e) {
    res.json({ error: e.message });
  }
});

// ============================================================================
// ROUTES ORIGINALES DU JEU
// ============================================================================

app.get("/api/health", (req, res) => res.json({ ok: true }));

app.get("/api/build", (req, res) => {
  res.json({
    ok: true,
    buildId: BUILD_ID,
    node: process.version,
    manifest: "/sounds/audio-manifest.json"
  });
});

app.get("/api/themes", (req, res) => {
  res.json({
    ok: true,
    themes: themeManager.getAllThemes()
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

// ============== DAILY.CO VIDEO ROUTES ==============
app.post("/api/video/create-room/:roomCode", async (req, res) => {
  try {
    const { roomCode } = req.params;
    
    if (!roomCode) {
      return res.status(400).json({ ok: false, error: "roomCode required" });
    }

    // V32: Note - On ne bloque PAS ici car cette API crée la room pour TOUS les joueurs
    // Le blocage individuel se fait côté client dans joinVideoRoomNow()

    // A) Anti-concurrence + C) récupération si la room existe déjà (après redéploiement)
    const videoRoom = await dailyManager.getOrCreateVideoRoom(roomCode);

    res.json({
      ok: true,
      roomUrl: videoRoom.roomUrl,
      roomName: videoRoom.roomName,
      cached: !!videoRoom.cached,
      isFreeRoom: !!videoRoom.isFreeRoom
    });

  } catch (error) {
    logger.error('[API] Error creating video room:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

app.get("/api/video/room-info/:roomCode", (req, res) => {
  try {
    const { roomCode } = req.params;
    const videoRoom = dailyManager.getVideoRoom(roomCode);
    
    if (!videoRoom) {
      return res.status(404).json({ ok: false, error: "Video room not found" });
    }
    
    res.json({
      ok: true,
      roomUrl: videoRoom.dailyRoomUrl,
      roomName: videoRoom.dailyRoomName
    });
    
  } catch (error) {
    logger.error('[API] Error getting video room info:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

app.delete("/api/video/delete-room/:roomCode", async (req, res) => {
  try {
    const { roomCode } = req.params;
    await dailyManager.deleteVideoRoom(roomCode);
    
    res.json({ ok: true });
    
  } catch (error) {
    logger.error('[API] Error deleting video room:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

// ===================================================
// API ADMIN SÉCURISÉE
// ===================================================
const ADMIN_SECRET = process.env.ADMIN_SECRET || "SABOTEUR-ADMIN-2024-SECRET";
const ADMIN_URL_SECRET = process.env.ADMIN_URL_SECRET || "panel-8x7k2m9z";

// Rate limiting pour admin (protection brute force)
const adminAttempts = new Map();
function checkAdminRateLimit(ip) {
  const now = Date.now();
  const attempts = adminAttempts.get(ip) || { count: 0, firstAttempt: now };
  
  // Reset après 15 minutes
  if (now - attempts.firstAttempt > 15 * 60 * 1000) {
    adminAttempts.set(ip, { count: 1, firstAttempt: now });
    return true;
  }
  
  // Bloque après 5 tentatives
  if (attempts.count >= 5) {
    return false;
  }
  
  attempts.count++;
  adminAttempts.set(ip, attempts);
  return true;
}

// Middleware de vérification admin
function verifyAdmin(req, res, next) {
  const ip = getClientIP(req);
  const secretCode = req.body.secretCode || req.query.secretCode;
  
  if (!checkAdminRateLimit(ip)) {
    logger.warn("admin_rate_limited", { ip });
    return res.status(429).json({ ok: false, error: "Trop de tentatives. Réessaie dans 15 minutes." });
  }
  
  if (secretCode !== ADMIN_SECRET) {
    logger.warn("admin_invalid_secret", { ip });
    return res.status(403).json({ ok: false, error: "Code secret invalide" });
  }
  
  // Reset le compteur si succès
  adminAttempts.delete(ip);
  logger.info("admin_access", { ip });
  next();
}

// Upgrade un compte (free → subscriber/pack/admin)
app.post("/api/admin/upgrade", verifyAdmin, (req, res) => {
  const { email, tier } = req.body;
  
  if (!email) {
    return res.status(400).json({ ok: false, error: "Email requis" });
  }
  
  const validTiers = ['free', 'pack', 'subscriber', 'admin'];
  const targetTier = tier || 'admin';
  
  if (!validTiers.includes(targetTier)) {
    return res.status(400).json({ ok: false, error: "Tier invalide (free/pack/subscriber/admin)" });
  }
  
  const user = dbGet("SELECT id, username, account_type FROM users WHERE email = ?", [email.toLowerCase()]);
  if (!user) {
    return res.status(404).json({ ok: false, error: "Utilisateur non trouvé" });
  }
  
  let videoCredits = 2;
  if (targetTier === 'pack') videoCredits = 50;
  if (targetTier === 'subscriber' || targetTier === 'admin') videoCredits = 999999;
  
  dbRun("UPDATE users SET account_type = ?, video_credits = ? WHERE id = ?", [targetTier, videoCredits, user.id]);
  logger.info("admin_upgrade", { email, userId: user.id, tier: targetTier });
  
  res.json({ 
    ok: true, 
    message: `${user.username} est maintenant ${targetTier}`, 
    user: { id: user.id, email, username: user.username, accountType: targetTier, videoCredits } 
  });
});

// Ajouter des crédits à un compte
app.post("/api/admin/add-credits", verifyAdmin, (req, res) => {
  const { email, credits } = req.body;
  
  if (!email || !credits) {
    return res.status(400).json({ ok: false, error: "Email et credits requis" });
  }
  
  const user = dbGet("SELECT id, username, video_credits FROM users WHERE email = ?", [email.toLowerCase()]);
  if (!user) {
    return res.status(404).json({ ok: false, error: "Utilisateur non trouvé" });
  }
  
  const newCredits = (user.video_credits || 0) + parseInt(credits);
  dbRun("UPDATE users SET video_credits = ? WHERE id = ?", [newCredits, user.id]);
  logger.info("admin_add_credits", { email, credits, newTotal: newCredits });
  
  res.json({ 
    ok: true, 
    message: `${credits} crédits ajoutés à ${user.username}`,
    user: { id: user.id, email, username: user.username, videoCredits: newCredits }
  });
});

// Lister tous les utilisateurs
app.get("/api/admin/users", verifyAdmin, (req, res) => {
  const users = dbAll("SELECT id, email, username, account_type, email_verified, video_credits, avatars_used, stripeCustomerId, created_at, last_login FROM users ORDER BY created_at DESC");
  res.json({ ok: true, count: users.length, users });
});

// Infos d'un utilisateur
app.get("/api/admin/user", verifyAdmin, (req, res) => {
  const { email } = req.query;
  
  if (!email) {
    return res.status(400).json({ ok: false, error: "Email requis" });
  }
  
  const user = dbGet("SELECT * FROM users WHERE email = ?", [email.toLowerCase()]);
  if (!user) {
    return res.status(404).json({ ok: false, error: "Utilisateur non trouvé" });
  }
  
  // Ne pas renvoyer le mot de passe
  delete user.password;
  res.json({ ok: true, user });
});

// Supprimer un utilisateur
app.post("/api/admin/delete-user", verifyAdmin, (req, res) => {
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({ ok: false, error: "Email requis" });
  }
  
  const user = dbGet("SELECT id, username FROM users WHERE email = ?", [email.toLowerCase()]);
  if (!user) {
    return res.status(404).json({ ok: false, error: "Utilisateur non trouvé" });
  }
  
  dbRun("DELETE FROM users WHERE id = ?", [user.id]);
  dbRun("DELETE FROM avatars WHERE user_id = ?", [user.id]);
  logger.info("admin_delete_user", { email, userId: user.id });
  
  res.json({ ok: true, message: `Utilisateur ${user.username} supprimé` });
});

// Reset les limites IP
app.post("/api/admin/clear-ip-logs", verifyAdmin, (req, res) => {
  dbRun("DELETE FROM ip_tracking");
  dbRun("DELETE FROM account_creation_log");
  logger.info("admin_clear_ip_logs");
  
  res.json({ ok: true, message: "Logs IP et limites création de compte effacés" });
});

// Stats globales
app.get("/api/admin/stats", verifyAdmin, (req, res) => {
  const totalUsers = dbGet("SELECT COUNT(*) as count FROM users")?.count || 0;
  const verifiedUsers = dbGet("SELECT COUNT(*) as count FROM users WHERE email_verified = 1")?.count || 0;
  const subscribers = dbGet("SELECT COUNT(*) as count FROM users WHERE account_type = 'subscriber'")?.count || 0;
  const packs = dbGet("SELECT COUNT(*) as count FROM users WHERE account_type = 'pack'")?.count || 0;
  const admins = dbGet("SELECT COUNT(*) as count FROM users WHERE account_type = 'admin'")?.count || 0;
  
  res.json({ 
    ok: true, 
    stats: {
      totalUsers,
      verifiedUsers,
      subscribers,
      packs,
      admins,
      freeUsers: totalUsers - subscribers - packs - admins
    }
  });
});

// ============================================================================
// STRIPE PAYMENT ROUTES
// ============================================================================

// Créer une session de paiement Stripe Checkout
app.post('/api/stripe/create-checkout-session', async (req, res) => {
  if (!stripe) {
    return res.status(500).json({ error: 'Stripe non configuré' });
  }
  
  try {
    const { priceType, userId, userEmail } = req.body;
    
    if (!userId || !userEmail) {
      return res.status(400).json({ error: 'userId et userEmail requis' });
    }
    
    // Choisir le bon Price ID
    const priceId = priceType === 'subscription' 
      ? process.env.STRIPE_PRICE_SUBSCRIPTION 
      : process.env.STRIPE_PRICE_PACK;
    
    if (!priceId) {
      return res.status(500).json({ error: 'Price ID non configuré' });
    }
    
    const mode = priceType === 'subscription' ? 'subscription' : 'payment';
    
    const session = await stripe.checkout.sessions.create({
      mode: mode,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      customer_email: userEmail,
      metadata: {
        userId: userId,
        priceType: priceType
      },
      success_url: `${APP_URL}/payment-success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${APP_URL}/payment-cancel.html`,
      locale: 'fr',
      allow_promotion_codes: true,
    });
    
    console.log(`[Stripe] Session créée: ${session.id} pour user ${userId}`);
    res.json({ url: session.url, sessionId: session.id });
    
  } catch (error) {
    console.error('[Stripe] Erreur création session:', error);
    res.status(500).json({ error: error.message });
  }
});

// Récupérer les infos de tarification (pour le frontend)
app.get('/api/stripe/prices', (req, res) => {
  res.json({
    subscription: {
      priceId: process.env.STRIPE_PRICE_SUBSCRIPTION || null,
      amount: 149, // centimes
      currency: 'eur',
      interval: 'month',
      name: 'Saboteur Premium',
      description: 'Vidéo illimitée, 4 thèmes, 30 avatars/mois'
    },
    pack: {
      priceId: process.env.STRIPE_PRICE_PACK || null,
      amount: 499, // centimes
      currency: 'eur',
      name: 'Pack 50 Crédits',
      description: '50 parties vidéo, 50 avatars, badge Supporter'
    },
    configured: !!(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PRICE_SUBSCRIPTION)
  });
});

// Vérifier le statut d'une session (pour page succès)
app.get('/api/stripe/session-status', async (req, res) => {
  if (!stripe) {
    return res.status(500).json({ error: 'Stripe non configuré' });
  }
  
  try {
    const { session_id } = req.query;
    if (!session_id) {
      return res.status(400).json({ error: 'session_id requis' });
    }
    
    const session = await stripe.checkout.sessions.retrieve(session_id);
    
    res.json({
      status: session.payment_status,
      customer_email: session.customer_email,
      priceType: session.metadata?.priceType
    });
  } catch (error) {
    console.error('[Stripe] Erreur récupération session:', error);
    res.status(500).json({ error: error.message });
  }
});

// Créer un portail client Stripe (pour gérer son abonnement)
app.post('/api/stripe/create-portal-session', authenticateToken, async (req, res) => {
  if (!stripe) {
    return res.status(500).json({ error: 'Stripe non configuré' });
  }
  
  try {
    const user = req.user;
    
    if (!user.stripeCustomerId) {
      return res.status(400).json({ error: 'Pas de compte Stripe associé' });
    }
    
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${APP_URL}/game.html`,
    });
    
    res.json({ url: portalSession.url });
  } catch (error) {
    console.error('[Stripe] Erreur création portail:', error);
    res.status(500).json({ error: error.message });
  }
});

// ===================================================

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

// Prevent duplicate player names in a room (case-insensitive, accents-insensitive, ignoring punctuation/spaces)
function normalizePlayerName(name) {
  return String(name || "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

function isNameTaken(room, name, exceptPlayerId = null) {
  const needle = normalizePlayerName(name);
  if (!needle) return false;
  for (const p of room.players.values()) {
    if (p.status === "left") continue;
    // V9.3.3: Ignorer aussi les joueurs déconnectés (fermeture navigateur)
    if (!p.connected) continue;
    if (exceptPlayerId && p.playerId === exceptPlayerId) continue;
    if (normalizePlayerName(p.name) === needle) return true;
  }
  return false;
}

// V32 Option D: Vérifier si un compte est déjà connecté ailleurs
// Retourne { allowed: true } ou { allowed: false, error: "message" }
function checkUserAlreadyConnected(authToken, socketId) {
  if (!authToken) return { allowed: true }; // Invités toujours OK
  
  try {
    const decoded = jwt.verify(authToken, JWT_SECRET);
    if (!decoded?.id) return { allowed: true };
    
    const userId = decoded.id;
    const existingSession = userSessions.get(userId);
    
    if (existingSession && existingSession.socketId !== socketId) {
      // Vérifier si l'ancien socket est encore actif
      const oldSocket = io.sockets.sockets.get(existingSession.socketId);
      if (oldSocket && oldSocket.connected) {
        logger.warn("duplicate_session_blocked", { 
          userId, 
          existingSocketId: existingSession.socketId, 
          newSocketId: socketId,
          existingRoom: existingSession.roomCode
        });
        return { 
          allowed: false, 
          error: "Ce compte est déjà connecté dans une autre session. Déconnecte-toi d'abord." 
        };
      } else {
        // L'ancien socket n'est plus actif, nettoyer
        userSessions.delete(userId);
      }
    }
    
    return { allowed: true, userId };
  } catch (e) {
    // Token invalide, on laisse passer (sera traité comme invité)
    return { allowed: true };
  }
}

// V32 Option D: Enregistrer une session utilisateur
function registerUserSession(authToken, socketId, roomCode, playerId) {
  if (!authToken) return;
  
  try {
    const decoded = jwt.verify(authToken, JWT_SECRET);
    if (decoded?.id) {
      userSessions.set(decoded.id, {
        socketId,
        roomCode,
        playerId,
        connectedAt: Date.now()
      });
      logger.info("user_session_registered", { userId: decoded.id, socketId, roomCode });
    }
  } catch (e) {
    // Ignorer
  }
}

// V32 Option D: Supprimer une session utilisateur
function unregisterUserSession(socketId) {
  for (const [userId, session] of userSessions.entries()) {
    if (session.socketId === socketId) {
      userSessions.delete(userId);
      logger.info("user_session_unregistered", { userId, socketId });
      break;
    }
  }
}

function joinRoomCommon(socket, room, playerId, name, playerToken = null, customization = {}, authToken = null) {
  let p = getPlayer(room, playerId);
  const now = Date.now();
  
  if (!p) {
    // V32: Vérifier si le joueur peut diffuser de la vidéo (a un compte avec crédits)
    let canBroadcastVideo = false;
    let odooUserId = null;  // V32: Stocker l'ID utilisateur pour le décompte des crédits
    
    if (authToken) {
      try {
        const decoded = jwt.verify(authToken, JWT_SECRET);
        // Le token utilise 'id' (pas 'userId')
        if (decoded?.id) {
          odooUserId = decoded.id;  // V32: Stocker l'ID
          const user = dbGet("SELECT account_type, video_credits, email_verified FROM users WHERE id = ?", [decoded.id]);
          if (user && user.email_verified) {
            const limits = getUserLimits(user);
            // Peut diffuser si crédits illimités OU si a des crédits restants
            canBroadcastVideo = (limits.videoCredits === Infinity || user.video_credits > 0);
            logger.info("video_credits_check", { playerId, canBroadcastVideo, accountType: user.account_type, videoCredits: user.video_credits, limitsVideoCredits: limits.videoCredits });
          }
        }
      } catch (e) {
        // Token invalide ou expiré, pas de broadcast vidéo
        logger.warn("video_credits_check_failed", { playerId, error: e.message });
        canBroadcastVideo = false;
      }
    }
    
    // V32: Si pas d'avatar IA et que l'emoji est déjà pris, en assigner un différent
    let avatarEmoji = customization.avatarEmoji || null;
    const avatarUrl = customization.avatarUrl || null;
    
    // Seulement si pas d'avatar IA (URL ou emoji classique persistant)
    if (!avatarUrl && avatarEmoji) {
      const usedEmojis = Array.from(room.players.values())
        .filter(player => player.status !== 'left')
        .map(player => player.avatarEmoji || player.avatarUrl)
        .filter(e => e && !String(e).startsWith('http') && !String(e).startsWith('/'));
      
      if (usedEmojis.includes(avatarEmoji)) {
        // L'emoji est déjà pris, en choisir un autre du même thème
        const themeAvatars = getThemeAvatars(room.themeId || 'default');
        const availableEmojis = themeAvatars.filter(e => !usedEmojis.includes(e));
        if (availableEmojis.length > 0) {
          avatarEmoji = availableEmojis[Math.floor(Math.random() * availableEmojis.length)];
          logger.info("avatar_reassigned", { playerId, oldEmoji: customization.avatarEmoji, newEmoji: avatarEmoji });
        }
      }
    }
    
    p = {
      playerId,
      name: String(name || "Joueur").trim(),
      socketId: socket.id,
      connected: true,
      status: "alive",
      ready: false,
      role: null,
      isCaptain: false,
      linkedTo: null,
      linkedName: null,
      playerToken,           // Token pour reconnexion
      lastSeenAt: now,       // Dernière activité
      joinedAt: now,         // Date de première connexion
      canBroadcastVideo,     // V32: Peut diffuser vidéo (compte avec crédits)
      odooUserId,            // V32: ID utilisateur pour décompte crédits
      videoCreditDeducted: false,  // V32: Flag pour éviter double décompte
      // D9: Données de personnalisation
      avatarId: customization.avatarId || null,
      avatarEmoji: avatarEmoji,  // V32: Peut être réassigné
      avatarUrl: avatarUrl,  // V31: Avatar IA généré
      colorId: customization.colorId || null,
      colorHex: customization.colorHex || null,
      badgeId: customization.badgeId || null,
      badgeEmoji: customization.badgeEmoji || null,
      badgeName: customization.badgeName || null
    };
    room.players.set(playerId, p);
    
    // Associer token -> playerId si fourni
    if (playerToken) {
      room.playerTokens.set(playerToken, playerId);
    }
    
    logger.join(room.code, playerId, p.name, socket.id);
  } else {
    // Reconnexion
    const oldSocketId = p.socketId;
    if (name != null) p.name = String(name).trim() || p.name;
    p.socketId = socket.id;
    p.connected = true;
    p.lastSeenAt = now;
    
    // D9: Mettre à jour les données de personnalisation si fournies
    if (customization.avatarEmoji) p.avatarEmoji = customization.avatarEmoji;
    if (customization.avatarId) p.avatarId = customization.avatarId;
    if (customization.colorHex) p.colorHex = customization.colorHex;
    if (customization.colorId) p.colorId = customization.colorId;
    if (customization.badgeEmoji) p.badgeEmoji = customization.badgeEmoji;
    if (customization.badgeId) p.badgeId = customization.badgeId;
    if (customization.badgeName) p.badgeName = customization.badgeName;
    
    // Mettre à jour le token si fourni
    if (playerToken && playerToken !== p.playerToken) {
      // Supprimer l'ancien mapping
      if (p.playerToken) {
        room.playerTokens.delete(p.playerToken);
      }
      p.playerToken = playerToken;
      room.playerTokens.set(playerToken, playerId);
    }
    
    logger.reconnect(room.code, playerId, p.name, oldSocketId, socket.id);
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
          if (room.phaseData?.fromChameleon) room.afterChameleonReveal = true;
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

    case "NIGHT_AI_EXCHANGE":
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

  socket.on("createRoom", ({ playerId, name, playerToken, authToken, themeId, avatarId, avatarEmoji, avatarUrl, colorId, colorHex, badgeId, badgeEmoji, badgeName, chatOnly, videoEnabled }, cb) => {
    // Rate limiting
    if (!rateLimiter.check(socket.id, "createRoom", playerId)) {
      return cb && cb({ ok: false, error: "Trop de tentatives. Attendez un moment." });
    }
    
    // V32 Option D: Vérifier si le compte est déjà connecté ailleurs
    // DÉSACTIVÉ POUR LES TESTS - À ACTIVER EN PRODUCTION
    // const sessionCheck = checkUserAlreadyConnected(authToken, socket.id);
    // if (!sessionCheck.allowed) {
    //   return cb && cb({ ok: false, error: sessionCheck.error });
    // }
    
    try {
      const code = genRoomCode(rooms);
      const room = newRoom(code, playerId);
      
      // Appliquer le thème choisi sur la page d'accueil
      if (themeId && themeManager.getTheme(themeId)) {
        room.themeId = themeId;
        logger.info("room_theme_set", { roomCode: code, themeId });
      }
      
      // Gérer le mode chatOnly (vidéo désactivée)
      if (chatOnly === true || videoEnabled === false) {
        room.videoDisabled = true;
        logger.info("room_video_disabled", { roomCode: code, chatOnly, videoEnabled });
      }
      
      rooms.set(code, room);
      logger.info("room_created", { roomCode: code, hostId: playerId, hostName: name, themeId: room.themeId, videoDisabled: room.videoDisabled });
      
      // D9: Préparer les données de personnalisation (V31: ajout avatarUrl)
      const customization = { avatarId, avatarEmoji, avatarUrl, colorId, colorHex, badgeId, badgeEmoji, badgeName };
      // V32: Passer authToken pour vérifier les crédits vidéo
      joinRoomCommon(socket, room, playerId, name, playerToken, customization, authToken);
      
      // V32 Option D: Enregistrer la session - DÉSACTIVÉ POUR LES TESTS
      // registerUserSession(authToken, socket.id, code, playerId);
      
      cb && cb({ ok: true, roomCode: code, host: true });
    } catch (e) {
      logger.error("createRoom_failed", { error: e.message, playerId });
      cb && cb({ ok: false, error: "createRoom failed" });
    }
  });

  socket.on("joinRoom", ({ playerId, name, roomCode, playerToken, authToken, avatarId, avatarEmoji, avatarUrl, colorId, colorHex, badgeId, badgeEmoji, badgeName }, cb) => {
    // Rate limiting
    if (!rateLimiter.check(socket.id, "joinRoom", playerId)) {
      return cb && cb({ ok: false, error: "Trop de tentatives. Attendez un moment." });
    }
    
    // D9: Préparer les données de personnalisation (V31: ajout avatarUrl)
    const customization = { avatarId, avatarEmoji, avatarUrl, colorId, colorHex, badgeId, badgeEmoji, badgeName };
    
    const code = String(roomCode || "").trim();
    const room = rooms.get(code);
    if (!room) {
      logger.reject(code, "room_not_found", { playerId });
      return cb && cb({ ok: false, error: "Room introuvable" });
    }
    
    // V9.3.6: PRIORITÉ 1 - Reconnexion par nom déconnecté
    // Si un joueur avec ce nom existe et est déconnecté, on le réutilise immédiatement
    // Cela évite les conflits de token et simplifie la reconnexion
    const playerByName = Array.from(room.players.values()).find(p => 
      normalizePlayerName(p.name) === normalizePlayerName(name) && 
      !p.connected &&
      p.status !== "left"
    );
    
    if (playerByName) {
      // Reconnexion par nom : réutiliser l'ancien playerId
      logger.info("reconnect_by_name", { roomCode: code, oldPlayerId: playerByName.playerId, newPlayerId: playerId, name });
      // V32: Passer authToken pour vérifier les crédits vidéo
      joinRoomCommon(socket, room, playerByName.playerId, name, playerToken, customization, authToken);
      cb && cb({ ok: true, roomCode: code, host: room.hostPlayerId === playerByName.playerId });
      return;
    }
    
    // V9.3.7: Empêcher les nouveaux joueurs de rejoindre une partie déjà commencée
    // Exception: Les joueurs existants peuvent se reconnecter
    const existingPlayer = getPlayer(room, playerId);
    
    // V9.3.7: Si partie commencée ET que c'est un nouveau joueur (pas dans la room)
    if (room.started && !existingPlayer) {
      logger.reject(code, "game_started", { playerId, name });
      return cb && cb({ ok: false, error: "Cette partie a déjà commencé. Vous ne pouvez plus rejoindre." });
    }
    
    // Vérifier si le nom est pris par un autre joueur CONNECTÉ
    if (isNameTaken(room, name, playerId)) {
      logger.reject(code, "name_taken", { playerId, name });
      return cb && cb({ ok: false, error: "Ce nom est déjà utilisé dans cette mission." });
    }
    
    // V32: Passer authToken pour vérifier les crédits vidéo
    joinRoomCommon(socket, room, playerId, name, playerToken, customization, authToken);
    cb && cb({ ok: true, roomCode: code, host: room.hostPlayerId === playerId });
  });

  socket.on("reconnectRoom", ({ playerId, name, roomCode, playerToken }, cb) => {
    const code = String(roomCode || "").trim();
    const room = rooms.get(code);
    if (!room) return cb && cb({ ok: false, error: "Room introuvable" });
    const p = getPlayer(room, playerId);
    if (!p) return cb && cb({ ok: false, error: "Joueur introuvable dans la room" });
    joinRoomCommon(socket, room, playerId, name || p.name, playerToken);
    cb && cb({ ok: true, roomCode: code, host: room.hostPlayerId === playerId });
  });
  
  // D11 V4: Mettre à jour la personnalisation d'un joueur (avatar, couleur, badge)
  socket.on("updateCustomization", ({ playerId, roomCode, avatarId, avatarEmoji, avatarUrl, colorId, colorHex, badgeId, badgeEmoji, badgeName }, cb) => {
    const code = String(roomCode || "").trim();
    const room = rooms.get(code);
    if (!room) return cb && cb({ ok: false, error: "Room introuvable" });
    
    const p = getPlayer(room, playerId);
    if (!p) return cb && cb({ ok: false, error: "Joueur introuvable" });
    
    // Mettre à jour les champs de personnalisation
    if (avatarId !== undefined) p.avatarId = avatarId;
    if (avatarEmoji !== undefined) p.avatarEmoji = avatarEmoji;
    if (avatarUrl !== undefined) p.avatarUrl = avatarUrl; // V32: Support avatarUrl
    if (colorId !== undefined) p.colorId = colorId;
    if (colorHex !== undefined) p.colorHex = colorHex;
    if (badgeId !== undefined) p.badgeId = badgeId;
    if (badgeEmoji !== undefined) p.badgeEmoji = badgeEmoji;
    if (badgeName !== undefined) p.badgeName = badgeName;
    
    logger.info("customization_updated", { roomCode: code, playerId, avatarEmoji, avatarUrl, colorHex });
    
    // Diffuser le nouvel état à tous les joueurs
    emitRoom(room);
    cb && cb({ ok: true });
  });
  
  // Heartbeat pour maintenir la session vivante
  socket.on("heartbeat", ({ playerId, roomCode }, cb) => {
    if (!rateLimiter.check(socket.id, "heartbeat", playerId)) {
      return cb && cb({ ok: false });
    }
    
    const room = rooms.get(roomCode);
    if (room) {
      const p = getPlayer(room, playerId);
      if (p) {
        p.lastSeenAt = Date.now();
        logger.heartbeat(playerId, roomCode, p.lastSeenAt);
      }
    }
    cb && cb({ ok: true });
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
  
  // Sélection de thème (Phase 3 - uniquement l'hôte avant le start)
  socket.on("setTheme", ({ themeId }, cb) => {
    const room = rooms.get(socket.data.roomCode);
    if (!room) return cb && cb({ ok: false, error: "Room introuvable" });
    if (room.hostPlayerId !== socket.data.playerId) return cb && cb({ ok: false, error: "Seul l'hôte peut choisir le thème" });
    if (room.started) return cb && cb({ ok: false, error: "Partie déjà commencée" });
    
    const theme = themeManager.getTheme(themeId);
    if (!theme) return cb && cb({ ok: false, error: "Thème introuvable" });
    
    room.themeId = themeId;
    logger.info("theme_selected", { roomCode: room.code, themeId, hostId: socket.data.playerId });
    emitRoom(room);
    cb && cb({ ok: true, themeId });
  });

  // ========== CHAT MODULE ==========
  
  // Envoyer un message de chat
  socket.on("chatMessage", ({ message }, cb) => {
    const room = rooms.get(socket.data.roomCode);
    if (!room) return cb && cb({ ok: false, error: "Room introuvable" });
    
    const player = room.players.get(socket.data.playerId);
    if (!player) return cb && cb({ ok: false, error: "Joueur introuvable" });
    
    // Validation du message
    const trimmedMessage = (message || "").trim();
    if (!trimmedMessage) return cb && cb({ ok: false, error: "Message vide" });
    if (trimmedMessage.length > 500) return cb && cb({ ok: false, error: "Message trop long (max 500 caractères)" });
    
    // Rate limiting: max 10 messages par 10 secondes par joueur
    if (!rateLimiter.check(socket.data.playerId, "chatMessage", socket.data.playerId)) {
      return cb && cb({ ok: false, error: "Trop de messages, attendez un moment" });
    }
    
    // Créer le message
    const chatMsg = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      playerId: player.playerId,
      playerName: player.name,
      avatarEmoji: player.avatarEmoji || "👤",
      avatarUrl: player.avatarUrl || null,  // V31: Avatar IA
      message: trimmedMessage,
      timestamp: Date.now(),
      type: "player"
    };
    
    // Stocker le message (garder les 100 derniers)
    room.chatMessages.push(chatMsg);
    if (room.chatMessages.length > 100) {
      room.chatMessages.shift();
    }
    
    // Diffuser à tous les joueurs de la room
    io.to(room.code).emit("chatMessage", chatMsg);
    
    logger.info("chat_message", { roomCode: room.code, playerId: player.playerId, messageLength: trimmedMessage.length });
    cb && cb({ ok: true });
  });
  
  // Récupérer l'historique du chat (pour reconnexion)
  socket.on("getChatHistory", (_, cb) => {
    const room = rooms.get(socket.data.roomCode);
    if (!room) return cb && cb({ ok: false, error: "Room introuvable" });
    
    cb && cb({ ok: true, messages: room.chatMessages });
  });

  // ========== FIN CHAT MODULE ==========

  // V9.3.1: Toggle video disabled option
  socket.on("setVideoDisabled", ({ videoDisabled }, cb) => {
    const room = rooms.get(socket.data.roomCode);
    if (!room) return cb && cb({ ok: false, error: "Room introuvable" });
    if (room.hostPlayerId !== socket.data.playerId) return cb && cb({ ok: false, error: "Seul l'hôte peut modifier cette option" });
    if (room.started) return cb && cb({ ok: false, error: "Partie déjà commencée" });
    
    room.videoDisabled = Boolean(videoDisabled);
    logger.info("video_disabled_changed", { roomCode: room.code, videoDisabled: room.videoDisabled, hostId: socket.data.playerId });
    emitRoom(room);
    cb && cb({ ok: true, videoDisabled: room.videoDisabled });
  });
  
  // Force advance (Phase 1 - S4 Mode hôte amélioré)
  socket.on("forceAdvance", (_, cb) => {
    if (!rateLimiter.check(socket.data.playerId, "forceAdvance", socket.data.playerId)) {
      return cb && cb({ ok: false, error: "Trop de tentatives" });
    }
    
    const room = rooms.get(socket.data.roomCode);
    if (!room) return cb && cb({ ok: false, error: "Room introuvable" });
    if (room.hostPlayerId !== socket.data.playerId) return cb && cb({ ok: false, error: "Seul l'hôte peut forcer" });
    if (!room.started || room.ended) return cb && cb({ ok: false, error: "Partie non active" });
    
    // Vérifier qu'un délai minimum est écoulé (20s)
    const phaseElapsed = Date.now() - room.phaseStartTime;
    if (phaseElapsed < 20000) {
      return cb && cb({ ok: false, error: "Attendez au moins 20 secondes" });
    }
    
    // Identifier les joueurs en attente
    const required = requiredPlayersForPhase(room);
    const pending = required.filter(pid => !room.phaseAck.has(pid));
    
    // Logger l'événement
    logger.forceAdvance(room.code, room.phase, socket.data.playerId, pending);
    
    // Auto-ack les joueurs manquants
    for (const pid of pending) {
      room.phaseAck.add(pid);
    }
    
    // Vérifier si c'est maintenant complété
    if (room.phaseAck.size >= required.length) {
      handlePhaseCompletion(room);
    }
    
    emitRoom(room);
    cb && cb({ ok: true });
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
    if (!rateLimiter.check(socket.id, "ack", socket.data.playerId)) {
      return cb && cb({ ok: false, error: "Trop rapide" });
    }
    
    const room = rooms.get(socket.data.roomCode);
    if (!room) return;
    const playerId = socket.data.playerId;
    const p = getPlayer(room, playerId);
    if (!p || p.status !== "alive") return;
    
    // Mettre à jour lastSeenAt
    p.lastSeenAt = Date.now();

    const done = ack(room, playerId);
    
    // Log avec progression
    const required = requiredPlayersForPhase(room);
    logger.phaseAck(room.code, room.phase, playerId, `${room.phaseAck.size}/${required.length}`);
    
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
      const byOldRole = p.role;
      const targetOldRole = tP.role;
      const a = p.role;
      p.role = tP.role;
      tP.role = a;

      room.chameleonUsed = true;
      logEvent(room, "chameleon_swap", { by: playerId, targetId, byOldRole, targetOldRole });
      console.log(`[${room.code}] chameleon_swap by=${p.name} target=${tP.name}`);
      ensurePlayerStats(p.name).chameleonSwaps += 1;
      saveStats(statsDb);

      // everybody re-check role
      setPhase(room, "ROLE_REVEAL", { notice: "Les rôles ont pu changer. Revérifiez.", resume: "night", fromChameleon: true });
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

      // ✅ V9: phase d'échange privé IA + lié (les 2 doivent valider pour continuer)
      setPhase(room, "NIGHT_AI_EXCHANGE", { iaId: p.playerId, partnerId: tP.playerId });
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
      room.phaseData.lastRadarResult = { viewerId: playerId, targetId, roleKey: role, text: `🔍 Radar: ${tP.name} = ${getRoleLabel(role, room)}` };
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
        logEvent(room, "doctor_save", { by: playerId, targetId: saveTarget, targetRole: room.players.get(saveTarget)?.role || null });
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
        logEvent(room, "doctor_kill", { by: playerId, targetId, targetRole: tP.role || null });
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
      // V24: Log du tiebreak pour awards
      const pickedPlayer = room.players.get(pick);
      const pickedRole = pickedPlayer?.role || null;
      const pickedTeam = ROLES[pickedRole]?.team || "astronauts";
      logEvent(room, "captain_tiebreak", { captainId: room.phaseData.actorId, targetId: pick, targetRole: pickedRole, targetTeam: pickedTeam });
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
  logEvent(room, "revenge_shot", { by: playerId, targetId: target, targetRole: tP.role || null });
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

server.listen(PORT, async () => {
  console.log(`🚀 Saboteur Unified Server v2.0 listening on :${PORT}`);
  console.log("[audio] mapped:", AUDIO);
  
  // Initialiser la base de données auth
  await initAuthDatabase();
  console.log("✅ Serveur prêt !");
});

