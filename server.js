/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                    🎮 SABOTEUR - SERVEUR UNIFIÉ V1.0                       ║
 * ║                                                                           ║
 * ║  Fusion de:                                                               ║
 * ║  - Système d'authentification et avatars IA (V4)                          ║
 * ║  - Jeu multijoueur Saboteur (V29)                                         ║
 * ║                                                                           ║
 * ║  Fonctionnalités:                                                         ║
 * ║  ✅ Authentification (login/register/email verification)                  ║
 * ║  ✅ Génération d'avatars IA (Replicate)                                   ║
 * ║  ✅ Jeu multijoueur temps réel (Socket.IO)                                ║
 * ║  ✅ Vidéo intégrée (Daily.co)                                             ║
 * ║  ✅ Anti-fraude (2 parties gratuites, email obligatoire pour vidéo)       ║
 * ║  ✅ Base de données SQLite persistante                                    ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

// ============================================================================
// SECTION 1: IMPORTS
// ============================================================================

const path = require("path");
const fs = require("fs");
const fsPromises = require("fs").promises;
const http = require("http");
const https = require("https");
const crypto = require("crypto");
const express = require("express");
const { Server } = require("socket.io");
const multer = require("multer");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const initSqlJs = require("sql.js");
const sharp = require("sharp");
const Replicate = require("replicate");
const { Resend } = require("resend");

// ============================================================================
// SECTION 2: CONFIGURATION
// ============================================================================

const PORT = process.env.PORT || 3000;
const BUILD_ID = process.env.BUILD_ID || "saboteur-unified-v1.0";

// Chemins
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, "data");
const DATABASE_PATH = process.env.DATABASE_PATH || path.join(DATA_DIR, "saboteur.db");
const STATS_FILE = path.join(DATA_DIR, "stats.json");
const UPLOADS_DIR = path.join(__dirname, "uploads");
// IMPORTANT: Avatars sur le disque persistant /data/avatars/ (pas dans public/)
const AVATARS_DIR = path.join(DATA_DIR, "avatars");

// Secrets et API
const JWT_SECRET = process.env.JWT_SECRET || "saboteur-jwt-2024-dev-key-change-in-production";
const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN || "";
const RESEND_API_KEY = process.env.RESEND_API_KEY || "";
const DAILY_API_KEY = process.env.DAILY_API_KEY || "";
const APP_URL = process.env.APP_URL || `http://localhost:${PORT}`;

// Créer les dossiers nécessaires
fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(UPLOADS_DIR, { recursive: true });
fs.mkdirSync(AVATARS_DIR, { recursive: true });

// Clients API
const replicate = REPLICATE_API_TOKEN ? new Replicate({ auth: REPLICATE_API_TOKEN }) : null;
const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

// Express + Socket.IO
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
  pingTimeout: 60000,
  pingInterval: 25000
});

// Middlewares - IMPORTANT: doit être AVANT les routes !
app.use(express.json());
app.use(express.static("public"));
app.use("/avatars", express.static(AVATARS_DIR));

// ============================================================================
// SECTION 3: CONSTANTES DU JEU
// ============================================================================

// Limites selon le type de compte
const ACCOUNT_LIMITS = {
  guest: {
    videoCredits: 0,        // Pas de vidéo sans compte
    avatars: 0,
    themes: ["default", "werewolf"],
    customPrompt: false
  },
  free: {
    videoCredits: 2,        // 2 parties vidéo gratuites pour tester
    avatars: 2,             // 1 avatar par thème gratuit (Spatial + Loup-Garou)
    themes: ["default", "werewolf"],
    customPrompt: false
  },
  subscriber: {
    videoCredits: Infinity,
    avatars: 30,
    themes: ["default", "werewolf", "wizard-academy", "mythic-realms"],
    customPrompt: true
  },
  pack: {
    videoCredits: 50,       // Crédits achetés
    avatars: 50,
    themes: ["default", "werewolf", "wizard-academy", "mythic-realms", "gang", "corporate"],
    customPrompt: true
  },
  family: {
    videoCredits: Infinity,
    avatars: 100,           // Partagés entre 6 comptes
    themes: ["default", "werewolf", "wizard-academy", "mythic-realms", "gang", "corporate", 
             "kingdoms", "gothic-manor", "galaxy", "deadly-games"],
    customPrompt: true
  },
  admin: {
    videoCredits: Infinity,
    avatars: Infinity,
    themes: "all",
    customPrompt: true
  }
};

// Codes admin
const ADMIN_CODES = ["HENRICO-DEV", "SABOTEUR-ADMIN", "DEV-UNLIMITED"];

// Domaines email jetables bloqués
const BLOCKED_EMAIL_DOMAINS = [
  "tempmail.com", "throwaway.email", "guerrillamail.com", "mailinator.com",
  "10minutemail.com", "temp-mail.org", "fakeinbox.com", "trashmail.com",
  "yopmail.com", "mohmal.com", "getairmail.com", "tempail.com"
];

// Rôles du jeu
const ROLES = {
  saboteur:   { team: "saboteurs", wakeAtNight: true,  label: "Saboteur" },
  astronaut:  { team: "astronauts", wakeAtNight: false, label: "Astronaute" },
  radar:      { team: "astronauts", wakeAtNight: true,  label: "Opérateur Radar" },
  doctor:     { team: "astronauts", wakeAtNight: true,  label: "Médecin" },
  security:   { team: "astronauts", wakeAtNight: false, label: "Agent de Sécurité" },
  chameleon:  { team: "astronauts", wakeAtNight: true,  label: "Caméléon" },
  ai_agent:   { team: "astronauts", wakeAtNight: true,  label: "Agent IA" },
  engineer:   { team: "astronauts", wakeAtNight: false, label: "Ingénieur" }
};

// Thèmes pour avatars IA
const AVATAR_THEMES = {
  default: {
    name: "Infiltration Spatiale",
    icon: "🚀",
    premium: false,
    background: "deep space background with stars and nebula, three distant suns glowing red yellow and blue",
    characters: {
      astronaut: { name: "Astronaute", prompt: "wearing white NASA astronaut helmet with open visor, full space suit with oxygen tubes" },
      alien: { name: "Alien", prompt: "green alien skin color, elongated bald head, huge bulging black eyes, extraterrestrial creature" },
      bounty_hunter: { name: "Chasseur de primes", prompt: "large sci-fi rifle strapped on back, worn brown leather jacket with armor plates, Star-Lord style" },
      cyborg: { name: "Robot/Cyborg", prompt: "half robot face with metal plates, one glowing red cybernetic eye, Terminator style" },
      captain: { name: "Capitaine", prompt: "wearing navy captain hat with gold insignia, military uniform with medals" }
    }
  },
  werewolf: {
    name: "Loups-Garous",
    icon: "🐺",
    premium: false,
    background: "dark medieval village at night, old wooden houses, giant bright full moon, fog and mist",
    characters: {
      werewolf: { name: "Loup-garou", prompt: "werewolf transformation with thick brown fur, wolf snout, sharp white fangs, yellow glowing wolf eyes" },
      vampire: { name: "Vampire", prompt: "vampire with pale white skin, sharp fangs, glowing red eyes, black cape, Dracula style" },
      mayor: { name: "Maire", prompt: "wearing tall black top hat, tricolor mayor sash, formal black victorian suit" },
      peasant: { name: "Paysan", prompt: "holding wooden pitchfork, straw farmer hat, medieval clothes" },
      witch: { name: "Sorcière", prompt: "tall twisted black pointy witch hat, crooked nose with wart, wild grey messy hair" },
      hunter: { name: "Chasseur", prompt: "old hunting rifle, leather bandolier with bullets, Van Helsing style" }
    }
  },
  "wizard-academy": {
    name: "Académie des Sorciers",
    icon: "🧙",
    premium: true,
    background: "magical great hall with high cathedral ceiling, floating candles, Hogwarts style",
    characters: {
      wizard: { name: "Sorcier", prompt: "pointed wizard hat with stars, purple wizard robe, glowing magic wand" },
      house_elf: { name: "Elfe de maison", prompt: "large pointy bat ears, enormous sad bulging eyes, torn pillowcase, Dobby style" },
      goblin: { name: "Gobelin", prompt: "long pointed ears, hooked nose, small beady eyes, banker suit, Gringotts goblin" },
      ghost: { name: "Fantôme", prompt: "pale bluish-white translucent skin, ethereal smoky aura, ghostly apparition" },
      professor: { name: "Professeur", prompt: "wise magic professor with long grey beard, academic robes, half-moon spectacles" }
    }
  },
  "mythic-realms": {
    name: "Royaumes Mythiques",
    icon: "⚔️",
    premium: true,
    background: "epic fantasy dragon lair with rivers of glowing lava, piles of gold treasure",
    characters: {
      knight: { name: "Chevalier", prompt: "full medieval plate armor, shining silver, sword on back, noble warrior" },
      dragon: { name: "Dragon", prompt: "dragonborn with green scales, dragon snout, reptilian yellow slit eyes, small horns" },
      dwarf: { name: "Nain", prompt: "very long thick braided beard, iron viking helmet, large battle axe, Gimli style" },
      elf: { name: "Elfe", prompt: "very long pointed ears, flowing white silver hair, elegant bow, Legolas style" },
      orc: { name: "Orque", prompt: "green skin, large tusks, tribal war paint, heavy fur armor, World of Warcraft orc" }
    }
  }
};

// ============================================================================
// SECTION 4: BASE DE DONNÉES SQLITE
// ============================================================================

let db = null;

async function initDatabase() {
  console.log("📂 Initialisation de la base de données...");
  
  const SQL = await initSqlJs();
  
  // Charger la base existante ou en créer une nouvelle
  try {
    if (fs.existsSync(DATABASE_PATH)) {
      const fileBuffer = fs.readFileSync(DATABASE_PATH);
      db = new SQL.Database(fileBuffer);
      console.log("📂 Base de données chargée depuis", DATABASE_PATH);
    } else {
      db = new SQL.Database();
      console.log("📂 Nouvelle base de données créée");
    }
  } catch (err) {
    console.error("⚠️ Erreur chargement DB, création nouvelle:", err.message);
    db = new SQL.Database();
  }
  
  // Créer les tables
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      account_type TEXT DEFAULT 'free',
      email_verified INTEGER DEFAULT 0,
      verification_token TEXT,
      verification_expires DATETIME,
      
      -- Crédits
      video_credits INTEGER DEFAULT 2,
      avatars_used INTEGER DEFAULT 0,
      
      -- Avatar actuel
      current_avatar TEXT,
      
      -- Anti-fraude
      created_from_ip TEXT,
      last_video_ip TEXT,
      
      -- Stats
      lifetime_games INTEGER DEFAULT 0,
      
      -- Timestamps
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_login DATETIME
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS avatars (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      theme TEXT,
      character_type TEXT,
      image_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS games_played (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      ip_address TEXT,
      game_mode TEXT,
      played_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS guest_generations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ip_address TEXT NOT NULL,
      avatar_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS account_creation_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ip_address TEXT NOT NULL,
      email TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS blocked_email_domains (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      domain TEXT UNIQUE NOT NULL,
      reason TEXT,
      added_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Index pour performance
  db.run(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_games_user ON games_played(user_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_account_ip ON account_creation_log(ip_address, created_at)`);

  // Insérer les domaines bloqués par défaut
  for (const domain of BLOCKED_EMAIL_DOMAINS) {
    try {
      db.run(`INSERT OR IGNORE INTO blocked_email_domains (domain, reason) VALUES (?, ?)`, 
        [domain, "Email jetable"]);
    } catch (e) {}
  }
  
  saveDatabase();
  console.log("✅ Base de données initialisée");
}

function saveDatabase() {
  if (db) {
    try {
      const data = db.export();
      const buffer = Buffer.from(data);
      fs.writeFileSync(DATABASE_PATH, buffer);
    } catch (e) {
      console.error("❌ Erreur sauvegarde DB:", e.message);
    }
  }
}

// Helpers DB
function dbRun(sql, params = []) {
  db.run(sql, params);
  saveDatabase();
}

function dbGet(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  if (stmt.step()) {
    const row = stmt.getAsObject();
    stmt.free();
    return row;
  }
  stmt.free();
  return null;
}

function dbAll(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const results = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  return results;
}

function dbInsert(sql, params = []) {
  db.run(sql, params);
  const result = db.exec("SELECT last_insert_rowid() as id")[0];
  saveDatabase();
  return { lastInsertRowid: result?.values?.[0]?.[0] || 0 };
}

// ============================================================================
// SECTION 5: HELPERS GÉNÉRAUX
// ============================================================================

const nowMs = () => Date.now();

function normalize(str) {
  return String(str || "")
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function randInt(min, max) { 
  return Math.floor(Math.random() * (max - min + 1)) + min; 
}

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = randInt(0, i);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function uniq(arr) { 
  return Array.from(new Set(arr)); 
}

function countSaboteursFor(n) { 
  return n <= 6 ? 1 : (n <= 11 ? 2 : 3); 
}

function genRoomCode(existing) {
  for (let i = 0; i < 2000; i++) {
    const code = String(randInt(0, 9999)).padStart(4, "0");
    if (!existing.has(code)) return code;
  }
  return String(randInt(0, 999999)).padStart(6, "0");
}

function getClientIP(req) {
  return req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || 
         req.socket?.remoteAddress || 
         "unknown";
}

function generateVerificationToken() {
  return crypto.randomBytes(32).toString("hex");
}

// Vérifier si un email utilise un domaine bloqué
function isBlockedEmailDomain(email) {
  const domain = email.split("@")[1]?.toLowerCase();
  if (!domain) return true;
  
  // Vérifier dans la liste en mémoire
  if (BLOCKED_EMAIL_DOMAINS.includes(domain)) return true;
  
  // Vérifier dans la base de données
  const blocked = dbGet("SELECT id FROM blocked_email_domains WHERE domain = ?", [domain]);
  return !!blocked;
}

// Vérifier limite de création de comptes par IP (max 5 en 24h)
function checkAccountCreationLimit(ip) {
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const count = dbGet(
    "SELECT COUNT(*) as count FROM account_creation_log WHERE ip_address = ? AND created_at > ?",
    [ip, yesterday]
  );
  return (count?.count || 0) < 5;
}

// Récupérer les limites selon le type de compte
function getUserLimits(user) {
  if (!user) return ACCOUNT_LIMITS.guest;
  
  const accountType = user.account_type || "free";
  
  // Vérifier si c'est un admin via code
  if (accountType === "admin") return ACCOUNT_LIMITS.admin;
  
  return ACCOUNT_LIMITS[accountType] || ACCOUNT_LIMITS.free;
}

// ============================================================================
// SECTION 6: AUTHENTIFICATION
// ============================================================================

// Middleware JWT
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  
  if (!token) {
    return res.status(401).json({ error: "Token requis" });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: "Token invalide ou expiré" });
    }
    req.user = user;
    next();
  });
}

// Middleware optionnel (utilisateur ou invité)
function optionalAuth(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  
  if (token) {
    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (!err) {
        req.user = user;
      }
    });
  }
  next();
}

// Envoyer email de vérification
async function sendVerificationEmail(email, username, token) {
  if (!resend) {
    console.log("⚠️ Resend non configuré - Email simulé");
    console.log(`📧 Lien: ${APP_URL}/verify-email.html?token=${token}`);
    return { success: true, simulated: true };
  }

  try {
    const verifyUrl = `${APP_URL}/verify-email.html?token=${token}`;
    
    // Utiliser le domaine vérifié sur Resend
    const emailFrom = process.env.EMAIL_FROM || "Saboteur Game <noreply@saboteurs-loup-garou.com>";
    
    const { data, error } = await resend.emails.send({
      from: emailFrom,
      to: email,
      subject: "🎮 Vérifie ton compte Saboteur !",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; background: #1a1a2e; color: white; padding: 20px; }
            .container { max-width: 500px; margin: 0 auto; background: #16213e; border-radius: 15px; padding: 30px; }
            h1 { color: #00ffff; }
            .btn { display: inline-block; background: linear-gradient(135deg, #00ffff, #ff00ff); color: black; padding: 15px 30px; text-decoration: none; border-radius: 10px; font-weight: bold; margin: 20px 0; }
            .footer { margin-top: 30px; font-size: 12px; color: #888; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>🎭 Bienvenue sur Saboteur !</h1>
            <p>Salut <strong>${username}</strong> !</p>
            <p>Clique sur le bouton ci-dessous pour vérifier ton email et débloquer <strong>2 parties vidéo gratuites</strong> :</p>
            <a href="${verifyUrl}" class="btn">✅ Vérifier mon email</a>
            <p>Ou copie ce lien :</p>
            <p style="word-break: break-all; font-size: 12px; color: #00ffff;">${verifyUrl}</p>
            <p class="footer">
              Ce lien expire dans 24 heures.<br>
              📧 Cet email sert uniquement à sécuriser ton compte. Aucun spam, aucune pub, promis !
            </p>
          </div>
        </body>
        </html>
      `
    });

    if (error) {
      console.error("❌ Erreur envoi email:", error);
      return { success: false, error };
    }

    console.log(`📧 Email envoyé à ${email}`);
    return { success: true, data };
  } catch (error) {
    console.error("❌ Erreur Resend:", error);
    return { success: false, error };
  }
}


// ============================================================================
// SECTION 7: ROUTES D'AUTHENTIFICATION
// ============================================================================

// Inscription
app.post("/api/auth/register", express.json(), async (req, res) => {
  try {
    const { email, username, password, promoCode } = req.body;
    const ip = getClientIP(req);

    // Validations
    if (!email || !username || !password) {
      return res.status(400).json({ error: "Email, pseudo et mot de passe requis" });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: "Mot de passe trop court (min 6 caractères)" });
    }

    if (username.length < 2 || username.length > 20) {
      return res.status(400).json({ error: "Pseudo entre 2 et 20 caractères" });
    }

    // Vérifier domaine email bloqué
    if (isBlockedEmailDomain(email)) {
      return res.status(400).json({ error: "Ce type d'email n'est pas accepté. Utilise une vraie adresse email." });
    }

    // Vérifier limite création comptes par IP
    if (!checkAccountCreationLimit(ip)) {
      return res.status(429).json({ error: "Trop de comptes créés depuis cette adresse. Réessaie demain." });
    }

    // Vérifier si email/username existe déjà
    const existingEmail = dbGet("SELECT id FROM users WHERE email = ?", [email.toLowerCase()]);
    if (existingEmail) {
      return res.status(400).json({ error: "Cet email est déjà utilisé" });
    }

    const existingUsername = dbGet("SELECT id FROM users WHERE username = ?", [username]);
    if (existingUsername) {
      return res.status(400).json({ error: "Ce pseudo est déjà pris" });
    }

    // Déterminer le type de compte
    let accountType = "free";
    if (promoCode) {
      const upperCode = promoCode.toUpperCase().trim();
      if (ADMIN_CODES.includes(upperCode)) {
        accountType = "admin";
      }
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Générer token de vérification
    const verificationToken = generateVerificationToken();
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    // Créer l'utilisateur
    const result = dbInsert(
      `INSERT INTO users (email, username, password, account_type, verification_token, verification_expires, created_from_ip, video_credits)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [email.toLowerCase(), username, hashedPassword, accountType, verificationToken, verificationExpires, ip, 
       accountType === "admin" ? 999999 : 2]
    );

    // Logger la création de compte
    dbInsert("INSERT INTO account_creation_log (ip_address, email) VALUES (?, ?)", [ip, email.toLowerCase()]);

    // Envoyer email de vérification
    const emailResult = await sendVerificationEmail(email, username, verificationToken);

    // Créer le token JWT
    const token = jwt.sign(
      { id: result.lastInsertRowid, email: email.toLowerCase(), username, accountType },
      JWT_SECRET,
      { expiresIn: "30d" }
    );

    res.json({
      success: true,
      token,
      user: {
        id: result.lastInsertRowid,
        email: email.toLowerCase(),
        username,
        accountType,
        emailVerified: false,
        videoCredits: accountType === "admin" ? 999999 : 2
      },
      message: emailResult.simulated 
        ? "Compte créé ! (Email simulé en dev)"
        : "Compte créé ! Vérifie ton email pour débloquer les parties vidéo."
    });

  } catch (error) {
    console.error("❌ Erreur inscription:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Connexion
app.post("/api/auth/login", express.json(), async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email et mot de passe requis" });
    }

    const user = dbGet("SELECT * FROM users WHERE email = ?", [email.toLowerCase()]);
    if (!user) {
      return res.status(401).json({ error: "Email ou mot de passe incorrect" });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: "Email ou mot de passe incorrect" });
    }

    // Mettre à jour last_login
    dbRun("UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?", [user.id]);

    const token = jwt.sign(
      { id: user.id, email: user.email, username: user.username, accountType: user.account_type },
      JWT_SECRET,
      { expiresIn: "30d" }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        accountType: user.account_type,
        emailVerified: user.email_verified === 1,
        videoCredits: user.video_credits,
        currentAvatar: user.current_avatar
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

    if (!token) {
      return res.status(400).json({ error: "Token manquant" });
    }

    const user = dbGet(
      "SELECT * FROM users WHERE verification_token = ? AND verification_expires > datetime('now')",
      [token]
    );

    if (!user) {
      return res.status(400).json({ error: "Token invalide ou expiré" });
    }

    // Marquer comme vérifié
    dbRun(
      "UPDATE users SET email_verified = 1, verification_token = NULL, verification_expires = NULL WHERE id = ?",
      [user.id]
    );

    res.json({
      success: true,
      message: "Email vérifié ! Tu as maintenant accès à 2 parties vidéo gratuites.",
      username: user.username
    });

  } catch (error) {
    console.error("❌ Erreur vérification:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Renvoyer email de vérification
app.post("/api/auth/resend-verification", express.json(), async (req, res) => {
  try {
    const { email } = req.body;

    const user = dbGet("SELECT * FROM users WHERE email = ?", [email?.toLowerCase()]);
    if (!user) {
      return res.status(404).json({ error: "Utilisateur non trouvé" });
    }

    if (user.email_verified === 1) {
      return res.status(400).json({ error: "Email déjà vérifié" });
    }

    const verificationToken = generateVerificationToken();
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    dbRun(
      "UPDATE users SET verification_token = ?, verification_expires = ? WHERE id = ?",
      [verificationToken, verificationExpires, user.id]
    );

    await sendVerificationEmail(user.email, user.username, verificationToken);

    res.json({ success: true, message: "Email de vérification renvoyé" });

  } catch (error) {
    console.error("❌ Erreur renvoi:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Profil utilisateur
app.get("/api/auth/me", authenticateToken, (req, res) => {
  try {
    const user = dbGet("SELECT * FROM users WHERE id = ?", [req.user.id]);
    if (!user) {
      return res.status(404).json({ error: "Utilisateur non trouvé" });
    }

    const limits = getUserLimits(user);

    res.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        accountType: user.account_type,
        emailVerified: user.email_verified === 1,
        videoCredits: user.video_credits,
        avatarsUsed: user.avatars_used,
        currentAvatar: user.current_avatar,
        lifetimeGames: user.lifetime_games
      },
      limits: {
        videoCredits: limits.videoCredits,
        avatars: limits.avatars,
        themes: limits.themes,
        customPrompt: limits.customPrompt
      }
    });

  } catch (error) {
    console.error("❌ Erreur profil:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Changer le mot de passe
app.post("/api/auth/change-password", authenticateToken, express.json(), async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Mot de passe actuel et nouveau requis" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: "Le nouveau mot de passe doit faire au moins 6 caractères" });
    }

    const user = dbGet("SELECT * FROM users WHERE id = ?", [req.user.id]);
    if (!user) {
      return res.status(404).json({ error: "Utilisateur non trouvé" });
    }

    // Vérifier le mot de passe actuel
    const validPassword = await bcrypt.compare(currentPassword, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: "Mot de passe actuel incorrect" });
    }

    // Hasher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Mettre à jour
    dbRun("UPDATE users SET password = ? WHERE id = ?", [hashedPassword, user.id]);
    saveDatabase();

    console.log(`🔐 Mot de passe changé pour ${user.email}`);

    res.json({ success: true, message: "Mot de passe modifié avec succès !" });

  } catch (error) {
    console.error("❌ Erreur changement mot de passe:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ============================================================================
// SECTION 8: VÉRIFICATION CRÉDITS VIDÉO
// ============================================================================

// Vérifier si l'utilisateur peut jouer en vidéo
app.get("/api/video/can-play", optionalAuth, (req, res) => {
  const ip = getClientIP(req);

  // Sans compte = pas de vidéo
  if (!req.user) {
    return res.json({
      canPlay: false,
      reason: "no_account",
      message: "Crée un compte gratuit pour accéder aux parties vidéo !",
      videoCredits: 0
    });
  }

  const user = dbGet("SELECT * FROM users WHERE id = ?", [req.user.id]);
  if (!user) {
    return res.json({
      canPlay: false,
      reason: "user_not_found",
      message: "Utilisateur non trouvé",
      videoCredits: 0
    });
  }

  // Email non vérifié = pas de vidéo
  if (user.email_verified !== 1) {
    return res.json({
      canPlay: false,
      reason: "email_not_verified",
      message: "Vérifie ton email pour débloquer les parties vidéo !",
      videoCredits: user.video_credits
    });
  }

  const limits = getUserLimits(user);

  // Admin ou abonné = illimité
  if (limits.videoCredits === Infinity) {
    return res.json({
      canPlay: true,
      reason: "unlimited",
      videoCredits: "∞",
      accountType: user.account_type
    });
  }

  // Vérifier crédits restants
  if (user.video_credits <= 0) {
    return res.json({
      canPlay: false,
      reason: "no_credits",
      message: "Tu as utilisé tes 2 parties gratuites. Passe à l'abonnement pour continuer en vidéo !",
      videoCredits: 0,
      upgradeOptions: [
        { type: "subscriber", price: "1.49€/mois", label: "Vidéo illimitée" },
        { type: "pack", price: "4.99€", label: "50 parties vidéo" }
      ]
    });
  }

  res.json({
    canPlay: true,
    reason: "has_credits",
    videoCredits: user.video_credits,
    accountType: user.account_type
  });
});

// Consommer un crédit vidéo (appelé quand une partie vidéo commence)
app.post("/api/video/consume-credit", authenticateToken, express.json(), (req, res) => {
  try {
    const ip = getClientIP(req);
    const user = dbGet("SELECT * FROM users WHERE id = ?", [req.user.id]);

    if (!user) {
      return res.status(404).json({ error: "Utilisateur non trouvé" });
    }

    if (user.email_verified !== 1) {
      return res.status(403).json({ error: "Vérifie ton email d'abord" });
    }

    const limits = getUserLimits(user);

    // Admin/abonné = pas de décompte
    if (limits.videoCredits === Infinity) {
      // Logger la partie quand même
      dbInsert("INSERT INTO games_played (user_id, ip_address, game_mode) VALUES (?, ?, ?)",
        [user.id, ip, "video"]);
      dbRun("UPDATE users SET lifetime_games = lifetime_games + 1, last_video_ip = ? WHERE id = ?",
        [ip, user.id]);

      return res.json({
        success: true,
        videoCredits: "∞",
        message: "Bonne partie !"
      });
    }

    // Vérifier crédits
    if (user.video_credits <= 0) {
      return res.status(403).json({ 
        error: "Plus de crédits vidéo",
        upgradeRequired: true
      });
    }

    // Décompter un crédit
    dbRun("UPDATE users SET video_credits = video_credits - 1, lifetime_games = lifetime_games + 1, last_video_ip = ? WHERE id = ?",
      [ip, user.id]);

    // Logger la partie
    dbInsert("INSERT INTO games_played (user_id, ip_address, game_mode) VALUES (?, ?, ?)",
      [user.id, ip, "video"]);

    const newCredits = user.video_credits - 1;

    res.json({
      success: true,
      videoCredits: newCredits,
      message: newCredits > 0 
        ? `Bonne partie ! Il te reste ${newCredits} partie(s) vidéo.`
        : "Dernière partie gratuite ! Pense à t'abonner pour continuer en vidéo."
    });

  } catch (error) {
    console.error("❌ Erreur consommation crédit:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});


// ============================================================================
// SECTION 9: GÉNÉRATION D'AVATARS IA
// ============================================================================

// Configuration upload photos
const photoStorage = multer.diskStorage({
  destination: UPLOADS_DIR,
  filename: (req, file, cb) => {
    const uniqueId = crypto.randomBytes(8).toString("hex");
    cb(null, `photo_${uniqueId}${path.extname(file.originalname)}`);
  }
});

const uploadPhoto = multer({
  storage: photoStorage,
  limits: { fileSize: 10 * 1024 * 1024 }
});

// Liste des thèmes disponibles
app.get("/api/avatars/themes", optionalAuth, (req, res) => {
  const user = req.user ? dbGet("SELECT * FROM users WHERE id = ?", [req.user.id]) : null;
  const limits = getUserLimits(user);
  const availableThemes = limits.themes === "all" ? Object.keys(AVATAR_THEMES) : limits.themes;

  const themes = {};
  for (const [key, theme] of Object.entries(AVATAR_THEMES)) {
    themes[key] = {
      name: theme.name,
      icon: theme.icon,
      premium: theme.premium,
      available: availableThemes.includes(key) || limits.themes === "all",
      characters: Object.entries(theme.characters).map(([charKey, char]) => ({
        key: charKey,
        name: char.name
      }))
    };
  }

  res.json({ themes, userPremium: user?.account_type !== "free" });
});

// Générer un avatar
app.post("/api/avatars/generate", authenticateToken, uploadPhoto.single("photo"), async (req, res) => {
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
    if (!replicate) {
      await fsPromises.unlink(req.file.path).catch(() => {});
      return res.status(500).json({ error: "Service de génération non configuré" });
    }

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

    // Paramètres par défaut ou personnalisés (admin)
    const instant_id = parseFloat(req.body.instant_id_strength) || 0.8;
    const prompt_str = parseFloat(req.body.prompt_strength) || 4.5;
    const denoise_str = parseFloat(req.body.denoising_strength) || 0.65;
    const depth_str = parseFloat(req.body.control_depth_strength) || 0.8;

    // Récupérer automatiquement la dernière version du modèle
    let modelVersion = "fofr/face-to-many"; // Par défaut sans version = latest
    try {
      const model = await replicate.models.get("fofr", "face-to-many");
      if (model.latest_version?.id) {
        modelVersion = `fofr/face-to-many:${model.latest_version.id}`;
        console.log(`📦 Utilisation version: ${model.latest_version.id.substring(0, 8)}...`);
      }
    } catch (versionError) {
      console.log(`⚠️ Impossible de récupérer la version, utilisation du fallback`);
    }

    // Appeler Replicate avec la dernière version
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

      await sharp(imageData)
        .resize(512, 512, { fit: "cover" })
        .webp({ quality: 90 })
        .toFile(avatarPath);

      localAvatarUrl = `/avatars/${avatarFilename}`;
      console.log(`💾 Avatar sauvegardé: ${localAvatarUrl}`);
    } catch (downloadError) {
      console.error("⚠️ Erreur sauvegarde locale:", downloadError.message);
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
      avatars,
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
app.post("/api/avatars/set-current", authenticateToken, express.json(), (req, res) => {
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
app.delete("/api/avatars/delete", authenticateToken, express.json(), (req, res) => {
  try {
    // Vérifier le type de compte - les comptes gratuits ne peuvent pas supprimer leurs avatars
    const userInfo = dbGet("SELECT account_type FROM users WHERE id = ?", [req.user.id]);
    if (userInfo?.account_type === "free") {
      return res.status(403).json({ 
        error: "Les comptes gratuits ne peuvent pas supprimer leurs avatars. Passez à un compte premium pour cette fonctionnalité." 
      });
    }

    const { avatarId, avatarUrl } = req.body;

    // Trouver l'avatar par ID ou URL
    let avatar;
    if (avatarId) {
      avatar = dbGet("SELECT * FROM avatars WHERE id = ? AND user_id = ?", [avatarId, req.user.id]);
    } else if (avatarUrl) {
      avatar = dbGet("SELECT * FROM avatars WHERE image_url = ? AND user_id = ?", [avatarUrl, req.user.id]);
    }

    if (!avatar) {
      return res.status(404).json({ error: "Avatar non trouvé" });
    }

    // Supprimer le fichier physique si c'est un fichier local
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

    // Si c'était l'avatar actif, le réinitialiser
    const user = dbGet("SELECT current_avatar FROM users WHERE id = ?", [req.user.id]);
    if (user?.current_avatar === avatar.image_url) {
      // Récupérer le premier avatar restant ou null
      const remainingAvatar = dbGet(
        "SELECT image_url FROM avatars WHERE user_id = ? ORDER BY created_at DESC LIMIT 1",
        [req.user.id]
      );
      dbRun("UPDATE users SET current_avatar = ? WHERE id = ?", 
        [remainingAvatar?.image_url || null, req.user.id]);
    }

    // Décrémenter le compteur d'avatars utilisés
    dbRun("UPDATE users SET avatars_used = MAX(0, avatars_used - 1) WHERE id = ?", [req.user.id]);

    saveDatabase();

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
// SECTION 10: STATS PERSISTENCE (JEU)
// ============================================================================

function loadStats() {
  try {
    if (!fs.existsSync(STATS_FILE)) return {};
    return JSON.parse(fs.readFileSync(STATS_FILE, "utf-8")) || {};
  } catch {
    return {};
  }
}

function saveStatsFile(db) {
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
      ejectedBySaboteurs: 0, ejectedByVote: 0,
      captainElected: 0, aiAgentLinks: 0,
      matchHistory: [],
      shortestGame: null, longestGame: null,
      firstEliminated: 0,
      correctSaboteurVotes: 0, wrongSaboteurVotes: 0, totalVotes: 0,
      doctorNotSavedOpportunities: 0,
      doctorKillsOnSaboteurs: 0, doctorKillsOnInnocents: 0,
      revengeKillsOnSaboteurs: 0, revengeKillsOnInnocents: 0,
      doctorMissedSaves: 0,
      mayorTiebreakerOk: 0, mayorTiebreakerKo: 0, mayorTiebreakerTotal: 0
    };
  }
  return statsDb[name];
}

// ============================================================================
// SECTION 11: GAME ROOMS
// ============================================================================

const rooms = new Map();

function createPlayer(id, name, socketId) {
  return {
    id,
    name,
    socketId,
    status: "alive",
    role: null,
    connected: true,
    ready: false,
    // Customization
    avatarId: null,
    avatarEmoji: "👤",
    avatarUrl: null,
    colorId: null,
    colorHex: "#888888",
    badgeId: null,
    badgeEmoji: null,
    badgeName: null,
    // Stats de la partie
    cumulativeStats: {}
  };
}

function createRoom(code, hostId, hostName, hostSocketId, options = {}) {
  return {
    code,
    hostId,
    hostName,
    players: new Map([[hostId, createPlayer(hostId, hostName, hostSocketId)]]),
    state: "lobby",
    phase: null,
    phaseData: {},
    round: 0,
    day: 0,
    votes: new Map(),
    nightActions: {},
    gameLog: [],
    eventLog: [],
    startedAt: null,
    endedAt: null,
    winner: null,
    // Options
    theme: options.theme || "default",
    videoEnabled: options.videoEnabled || false,
    chatOnly: options.chatOnly || false,
    // Timers
    disconnectTimers: new Map(),
    phaseTimer: null,
    // Links (AI Agent)
    links: [],
    // Daily room
    dailyRoomName: null,
    dailyRoomUrl: null
  };
}

function getPlayer(room, playerId) {
  return room.players.get(playerId);
}

function getAlivePlayers(room) {
  return Array.from(room.players.values()).filter(p => p.status === "alive");
}

function getDeadPlayers(room) {
  return Array.from(room.players.values()).filter(p => p.status === "dead");
}

function getPlayersByTeam(room, team) {
  return Array.from(room.players.values()).filter(p => {
    const role = ROLES[p.role];
    return role && role.team === team && p.status === "alive";
  });
}

// ============================================================================
// SECTION 12: GAME LOGIC HELPERS
// ============================================================================

function assignRoles(room) {
  const players = Array.from(room.players.values());
  const n = players.length;
  const numSaboteurs = countSaboteursFor(n);

  // Roles spéciaux pour les astronautes
  const specialRoles = ["radar", "doctor"];
  if (n >= 7) specialRoles.push("security");
  if (n >= 8) specialRoles.push("chameleon");
  if (n >= 9) specialRoles.push("ai_agent");
  if (n >= 10) specialRoles.push("engineer");

  // Créer le pool de rôles
  const rolePool = [];
  for (let i = 0; i < numSaboteurs; i++) {
    rolePool.push("saboteur");
  }
  for (const role of specialRoles) {
    rolePool.push(role);
  }
  while (rolePool.length < n) {
    rolePool.push("astronaut");
  }

  // Mélanger et assigner
  const shuffled = shuffle(rolePool);
  players.forEach((p, i) => {
    p.role = shuffled[i];
    p.status = "alive";
  });

  console.log(`[${room.code}] Rôles assignés: ${shuffled.join(", ")}`);
}

function checkWinCondition(room) {
  const alive = getAlivePlayers(room);
  const saboteurs = alive.filter(p => ROLES[p.role]?.team === "saboteurs");
  const astronauts = alive.filter(p => ROLES[p.role]?.team === "astronauts");

  if (saboteurs.length === 0) {
    return { winner: "astronauts", reason: "Tous les saboteurs ont été éliminés !" };
  }

  if (saboteurs.length >= astronauts.length) {
    return { winner: "saboteurs", reason: "Les saboteurs sont majoritaires !" };
  }

  return null;
}

function killPlayer(room, playerId, cause) {
  const player = getPlayer(room, playerId);
  if (!player || player.status !== "alive") return false;

  player.status = "dead";
  logEvent(room, "death", { playerId, playerName: player.name, role: player.role, cause });
  console.log(`[${room.code}] ${player.name} est mort (${cause})`);

  return true;
}

function logEvent(room, type, data) {
  room.eventLog.push({
    type,
    data,
    timestamp: Date.now(),
    round: room.round,
    day: room.day
  });
}

function emitRoom(room) {
  const roomData = serializeRoom(room);
  for (const player of room.players.values()) {
    if (player.connected && player.socketId) {
      io.to(player.socketId).emit("roomState", roomData);  // FIX: était "roomUpdate"
    }
  }
}

function serializeRoom(room) {
  const players = Array.from(room.players.values()).map(p => ({
    id: p.id,
    name: p.name,
    status: p.status,
    connected: p.connected,
    ready: p.ready,
    avatarId: p.avatarId,
    avatarEmoji: p.avatarEmoji,
    avatarUrl: p.avatarUrl,
    colorId: p.colorId,
    colorHex: p.colorHex,
    badgeId: p.badgeId,
    badgeEmoji: p.badgeEmoji,
    badgeName: p.badgeName,
    // Le rôle n'est visible que si la partie est terminée ou si c'est le joueur lui-même
    role: room.state === "ended" ? p.role : undefined,
    cumulativeStats: p.cumulativeStats
  }));

  return {
    code: room.code,
    hostId: room.hostId,
    hostName: room.hostName,
    state: room.state,
    phase: room.phase,
    phaseData: room.phaseData,
    round: room.round,
    day: room.day,
    players,
    theme: room.theme,
    videoEnabled: room.videoEnabled,
    chatOnly: room.chatOnly,
    winner: room.winner,
    dailyRoomUrl: room.dailyRoomUrl,
    startedAt: room.startedAt,
    endedAt: room.endedAt
  };
}


// ============================================================================
// SECTION 13: SOCKET.IO - CONNEXION ET ROOMS
// ============================================================================

io.on("connection", (socket) => {
  console.log(`🔌 Nouvelle connexion: ${socket.id}`);

  // Créer une room
  socket.on("createRoom", async (data, cb) => {
    try {
      const { playerName, theme, videoEnabled, token } = data;

      if (!playerName || playerName.length < 2) {
        return cb?.({ ok: false, error: "Nom invalide" });
      }

      // Vérifier auth si token fourni
      let user = null;
      if (token) {
        try {
          const decoded = jwt.verify(token, JWT_SECRET);
          user = dbGet("SELECT * FROM users WHERE id = ?", [decoded.id]);
        } catch (e) {}
      }

      // Si vidéo demandée, vérifier les droits
      if (videoEnabled && !data.chatOnly) {
        if (!user) {
          return cb?.({ ok: false, error: "Compte requis pour le mode vidéo" });
        }
        if (user.email_verified !== 1) {
          return cb?.({ ok: false, error: "Vérifie ton email pour le mode vidéo" });
        }
        const limits = getUserLimits(user);
        if (limits.videoCredits !== Infinity && user.video_credits <= 0) {
          return cb?.({ ok: false, error: "Plus de crédits vidéo" });
        }
      }

      const code = genRoomCode(rooms);
      const playerId = crypto.randomBytes(8).toString("hex");

      const room = createRoom(code, playerId, playerName, socket.id, {
        theme: theme || "default",
        videoEnabled: videoEnabled || false,
        chatOnly: data.chatOnly || false
      });

      // Ajouter l'avatar si l'utilisateur est connecté
      if (user && user.current_avatar) {
        const player = room.players.get(playerId);
        player.avatarUrl = user.current_avatar;
      }

      rooms.set(code, room);

      socket.data.roomCode = code;
      socket.data.playerId = playerId;
      socket.join(code);

      console.log(`🏠 Room ${code} créée par ${playerName}`);

      // FIX: Émettre roomState pour que le client passe au lobby
      emitRoom(room);

      cb?.({
        ok: true,
        roomCode: code,
        playerId,
        room: serializeRoom(room)
      });

    } catch (error) {
      console.error("❌ Erreur createRoom:", error);
      cb?.({ ok: false, error: "Erreur serveur" });
    }
  });

  // Rejoindre une room
  socket.on("joinRoom", (data, cb) => {
    try {
      const { roomCode, playerName, token } = data;

      if (!playerName || playerName.length < 2) {
        return cb?.({ ok: false, error: "Nom invalide" });
      }

      const room = rooms.get(roomCode);
      if (!room) {
        return cb?.({ ok: false, error: "Room introuvable" });
      }

      if (room.state !== "lobby") {
        return cb?.({ ok: false, error: "Partie déjà en cours" });
      }

      if (room.players.size >= 15) {
        return cb?.({ ok: false, error: "Room pleine (max 15)" });
      }

      // Vérifier si le nom est déjà pris
      for (const p of room.players.values()) {
        if (p.name.toLowerCase() === playerName.toLowerCase()) {
          return cb?.({ ok: false, error: "Ce nom est déjà pris" });
        }
      }

      // Vérifier auth
      let user = null;
      if (token) {
        try {
          const decoded = jwt.verify(token, JWT_SECRET);
          user = dbGet("SELECT * FROM users WHERE id = ?", [decoded.id]);
        } catch (e) {}
      }

      const playerId = crypto.randomBytes(8).toString("hex");
      const player = createPlayer(playerId, playerName, socket.id);

      if (user && user.current_avatar) {
        player.avatarUrl = user.current_avatar;
      }

      room.players.set(playerId, player);

      socket.data.roomCode = roomCode;
      socket.data.playerId = playerId;
      socket.join(roomCode);

      console.log(`👤 ${playerName} a rejoint la room ${roomCode}`);

      emitRoom(room);

      cb?.({
        ok: true,
        playerId,
        room: serializeRoom(room)
      });

    } catch (error) {
      console.error("❌ Erreur joinRoom:", error);
      cb?.({ ok: false, error: "Erreur serveur" });
    }
  });

  // Marquer prêt
  socket.on("setReady", (data, cb) => {
    const room = rooms.get(socket.data.roomCode);
    if (!room) return cb?.({ ok: false });

    const player = getPlayer(room, socket.data.playerId);
    if (!player) return cb?.({ ok: false });

    player.ready = data.ready !== false;
    emitRoom(room);
    cb?.({ ok: true });
  });

  // Lancer la partie
  socket.on("startGame", (data, cb) => {
    const room = rooms.get(socket.data.roomCode);
    if (!room) return cb?.({ ok: false, error: "Room introuvable" });

    if (socket.data.playerId !== room.hostId) {
      return cb?.({ ok: false, error: "Seul l'hôte peut lancer" });
    }

    if (room.players.size < 5) {
      return cb?.({ ok: false, error: "Minimum 5 joueurs" });
    }

    // Vérifier que tout le monde est prêt
    for (const p of room.players.values()) {
      if (!p.ready && p.id !== room.hostId) {
        return cb?.({ ok: false, error: "Tous les joueurs doivent être prêts" });
      }
    }

    // Démarrer
    room.state = "playing";
    room.round = 1;
    room.day = 1;
    room.startedAt = Date.now();

    assignRoles(room);

    // Commencer par la phase de jour
    startDayPhase(room);

    console.log(`🎮 Partie démarrée dans ${room.code} avec ${room.players.size} joueurs`);

    emitRoom(room);
    cb?.({ ok: true });
  });

  // Chat
  socket.on("chatMessage", (data, cb) => {
    const room = rooms.get(socket.data.roomCode);
    if (!room) return;

    const player = getPlayer(room, socket.data.playerId);
    if (!player) return;

    // Émettre le message à tous les joueurs de la room
    io.to(room.code).emit("chatMessage", {
      playerId: player.id,
      playerName: player.name,
      message: data.message,
      timestamp: Date.now()
    });

    cb?.({ ok: true });
  });

  // Vote
  socket.on("vote", (data, cb) => {
    const room = rooms.get(socket.data.roomCode);
    if (!room) return cb?.({ ok: false });

    const player = getPlayer(room, socket.data.playerId);
    if (!player || player.status !== "alive") return cb?.({ ok: false });

    if (room.phase !== "DAY_VOTE") {
      return cb?.({ ok: false, error: "Ce n'est pas le moment de voter" });
    }

    const targetId = data.targetId; // peut être null pour "skip"
    room.votes.set(player.id, targetId);

    // Vérifier si tout le monde a voté
    const alive = getAlivePlayers(room);
    const votedCount = Array.from(room.votes.keys()).filter(id => {
      const p = getPlayer(room, id);
      return p && p.status === "alive";
    }).length;

    if (votedCount >= alive.length) {
      resolveVotes(room);
    }

    emitRoom(room);
    cb?.({ ok: true });
  });

  // Action de nuit
  socket.on("nightAction", (data, cb) => {
    const room = rooms.get(socket.data.roomCode);
    if (!room) return cb?.({ ok: false });

    const player = getPlayer(room, socket.data.playerId);
    if (!player || player.status !== "alive") return cb?.({ ok: false });

    // Enregistrer l'action
    room.nightActions[player.id] = {
      role: player.role,
      targetId: data.targetId,
      action: data.action
    };

    // Vérifier si toutes les actions nocturnes sont faites
    const nightRoles = getAlivePlayers(room).filter(p => ROLES[p.role]?.wakeAtNight);
    const actionsCount = Object.keys(room.nightActions).length;

    if (actionsCount >= nightRoles.length) {
      resolveNightActions(room);
    }

    cb?.({ ok: true });
  });

  // Déconnexion
  socket.on("disconnect", () => {
    const room = rooms.get(socket.data.roomCode);
    if (!room) return;

    const player = getPlayer(room, socket.data.playerId);
    if (!player) return;

    player.connected = false;
    console.log(`📴 ${player.name} déconnecté de ${room.code}`);

    // Timer de déconnexion (2 minutes pour revenir)
    const timer = setTimeout(() => {
      if (!player.connected) {
        // Retirer le joueur si en lobby, sinon le marquer comme abandonné
        if (room.state === "lobby") {
          room.players.delete(player.id);
          if (room.players.size === 0) {
            rooms.delete(room.code);
            console.log(`🗑️ Room ${room.code} supprimée (vide)`);
          } else if (player.id === room.hostId) {
            // Transférer l'hôte
            const newHost = room.players.values().next().value;
            room.hostId = newHost.id;
            room.hostName = newHost.name;
          }
        }
        emitRoom(room);
      }
    }, 2 * 60 * 1000);

    room.disconnectTimers.set(player.id, timer);
    emitRoom(room);
  });

  // Reconnexion
  socket.on("reconnect", (data, cb) => {
    const { roomCode, playerId } = data;
    const room = rooms.get(roomCode);
    if (!room) return cb?.({ ok: false, error: "Room introuvable" });

    const player = getPlayer(room, playerId);
    if (!player) return cb?.({ ok: false, error: "Joueur introuvable" });

    // Annuler le timer de déconnexion
    const timer = room.disconnectTimers.get(playerId);
    if (timer) {
      clearTimeout(timer);
      room.disconnectTimers.delete(playerId);
    }

    player.connected = true;
    player.socketId = socket.id;
    socket.data.roomCode = roomCode;
    socket.data.playerId = playerId;
    socket.join(roomCode);

    console.log(`🔄 ${player.name} reconnecté à ${roomCode}`);

    emitRoom(room);
    cb?.({ ok: true, room: serializeRoom(room) });
  });
});

// ============================================================================
// SECTION 14: PHASES DU JEU
// ============================================================================

function startDayPhase(room) {
  room.phase = "DAY_DISCUSSION";
  room.votes.clear();
  room.phaseData = {
    startedAt: Date.now(),
    duration: 90000 // 90 secondes de discussion
  };

  logEvent(room, "phase_start", { phase: "DAY_DISCUSSION", day: room.day });

  // Timer pour passer au vote
  room.phaseTimer = setTimeout(() => {
    if (room.state === "playing" && room.phase === "DAY_DISCUSSION") {
      startVotePhase(room);
    }
  }, 90000);

  emitRoom(room);
}

function startVotePhase(room) {
  room.phase = "DAY_VOTE";
  room.votes.clear();
  room.phaseData = {
    startedAt: Date.now(),
    duration: 60000 // 60 secondes pour voter
  };

  logEvent(room, "phase_start", { phase: "DAY_VOTE", day: room.day });

  // Timer pour forcer la résolution
  room.phaseTimer = setTimeout(() => {
    if (room.state === "playing" && room.phase === "DAY_VOTE") {
      resolveVotes(room);
    }
  }, 60000);

  emitRoom(room);
}

function resolveVotes(room) {
  if (room.phaseTimer) {
    clearTimeout(room.phaseTimer);
    room.phaseTimer = null;
  }

  const votes = {};
  let skipVotes = 0;

  for (const [voterId, targetId] of room.votes) {
    if (targetId === null) {
      skipVotes++;
    } else {
      votes[targetId] = (votes[targetId] || 0) + 1;
    }
  }

  // Trouver le joueur avec le plus de votes
  let maxVotes = 0;
  let eliminated = null;
  let tied = [];

  for (const [targetId, count] of Object.entries(votes)) {
    if (count > maxVotes) {
      maxVotes = count;
      eliminated = targetId;
      tied = [targetId];
    } else if (count === maxVotes) {
      tied.push(targetId);
    }
  }

  // Si égalité ou skip majoritaire, personne n'est éliminé
  if (tied.length > 1 || skipVotes >= maxVotes) {
    logEvent(room, "vote_result", { result: "no_elimination", reason: tied.length > 1 ? "tie" : "skip_majority" });
    room.phaseData = { result: "no_elimination", reason: tied.length > 1 ? "Égalité !" : "Majorité pour passer" };
  } else if (eliminated) {
    killPlayer(room, eliminated, "vote");
    const player = getPlayer(room, eliminated);
    room.phaseData = { 
      result: "elimination", 
      eliminatedId: eliminated,
      eliminatedName: player?.name,
      eliminatedRole: player?.role
    };
  }

  // Vérifier condition de victoire
  const winCondition = checkWinCondition(room);
  if (winCondition) {
    endGame(room, winCondition.winner, winCondition.reason);
    return;
  }

  // Passer à la nuit après un délai
  room.phase = "DAY_RESULT";
  emitRoom(room);

  setTimeout(() => {
    if (room.state === "playing") {
      startNightPhase(room);
    }
  }, 5000);
}

function startNightPhase(room) {
  room.phase = "NIGHT";
  room.nightActions = {};
  room.phaseData = {
    startedAt: Date.now(),
    duration: 45000 // 45 secondes pour les actions
  };

  logEvent(room, "phase_start", { phase: "NIGHT", day: room.day });

  // Timer pour forcer la résolution
  room.phaseTimer = setTimeout(() => {
    if (room.state === "playing" && room.phase === "NIGHT") {
      resolveNightActions(room);
    }
  }, 45000);

  emitRoom(room);
}

function resolveNightActions(room) {
  if (room.phaseTimer) {
    clearTimeout(room.phaseTimer);
    room.phaseTimer = null;
  }

  const actions = room.nightActions;
  let killed = null;
  let saved = null;

  // Récupérer les actions des saboteurs
  const saboteurActions = Object.entries(actions).filter(([id, action]) => action.role === "saboteur");
  if (saboteurActions.length > 0) {
    // Prendre la cible du premier saboteur (ou vote majoritaire si plusieurs)
    const targets = saboteurActions.map(([, action]) => action.targetId).filter(Boolean);
    if (targets.length > 0) {
      // Compter les votes des saboteurs
      const targetCounts = {};
      for (const t of targets) {
        targetCounts[t] = (targetCounts[t] || 0) + 1;
      }
      killed = Object.entries(targetCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
    }
  }

  // Récupérer l'action du médecin
  const doctorAction = Object.entries(actions).find(([id, action]) => action.role === "doctor");
  if (doctorAction) {
    saved = doctorAction[1].targetId;
  }

  // Appliquer les résultats
  if (killed && killed !== saved) {
    killPlayer(room, killed, "saboteur_kill");
    const player = getPlayer(room, killed);
    room.phaseData = {
      result: "death",
      killedId: killed,
      killedName: player?.name,
      killedRole: player?.role
    };
  } else if (killed && killed === saved) {
    room.phaseData = { result: "saved", savedId: saved };
    logEvent(room, "doctor_save", { savedId: saved });
  } else {
    room.phaseData = { result: "no_death" };
  }

  // Vérifier condition de victoire
  const winCondition = checkWinCondition(room);
  if (winCondition) {
    endGame(room, winCondition.winner, winCondition.reason);
    return;
  }

  // Nouvelle journée
  room.day++;
  room.round++;
  room.phase = "NIGHT_RESULT";
  emitRoom(room);

  setTimeout(() => {
    if (room.state === "playing") {
      startDayPhase(room);
    }
  }, 5000);
}

function endGame(room, winner, reason) {
  room.state = "ended";
  room.phase = null;
  room.winner = winner;
  room.endedAt = Date.now();
  room.phaseData = { winner, reason };

  if (room.phaseTimer) {
    clearTimeout(room.phaseTimer);
    room.phaseTimer = null;
  }

  logEvent(room, "game_end", { winner, reason, duration: room.endedAt - room.startedAt });

  // Mettre à jour les stats des joueurs
  for (const player of room.players.values()) {
    const stats = ensurePlayerStats(player.name);
    stats.gamesPlayed++;
    
    const playerTeam = ROLES[player.role]?.team;
    if (playerTeam === winner) {
      stats.wins++;
    } else {
      stats.losses++;
    }

    stats.gamesByRole[player.role] = (stats.gamesByRole[player.role] || 0) + 1;
    if (playerTeam === winner) {
      stats.winsByRole[player.role] = (stats.winsByRole[player.role] || 0) + 1;
    }
  }

  saveStatsFile(statsDb);

  console.log(`🏆 Partie terminée dans ${room.code}: ${winner} gagne ! (${reason})`);

  emitRoom(room);

  // Supprimer la room après 5 minutes
  setTimeout(() => {
    if (rooms.has(room.code) && room.state === "ended") {
      rooms.delete(room.code);
      console.log(`🗑️ Room ${room.code} nettoyée`);
    }
  }, 5 * 60 * 1000);
}


// ============================================================================
// SECTION 15: ROUTES STATIQUES ET API DIVERSES
// ============================================================================

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    version: BUILD_ID,
    uptime: process.uptime(),
    rooms: rooms.size,
    features: [
      "auth",
      "email-verification",
      "avatars-ai",
      "multiplayer-game",
      "video-mode",
      "anti-fraud"
    ]
  });
});

// Stats globales (admin)
app.get("/api/admin/stats", authenticateToken, (req, res) => {
  const user = dbGet("SELECT * FROM users WHERE id = ?", [req.user.id]);
  if (user?.account_type !== "admin") {
    return res.status(403).json({ error: "Admin requis" });
  }

  const totalUsers = dbGet("SELECT COUNT(*) as count FROM users")?.count || 0;
  const verifiedUsers = dbGet("SELECT COUNT(*) as count FROM users WHERE email_verified = 1")?.count || 0;
  const totalGames = dbGet("SELECT COUNT(*) as count FROM games_played")?.count || 0;
  const totalAvatars = dbGet("SELECT COUNT(*) as count FROM avatars")?.count || 0;

  res.json({
    users: {
      total: totalUsers,
      verified: verifiedUsers,
      unverified: totalUsers - verifiedUsers
    },
    games: {
      total: totalGames,
      activeRooms: rooms.size
    },
    avatars: {
      total: totalAvatars
    }
  });
});

// ADMIN: Upgrade un compte avec code secret
app.post("/api/admin/upgrade", async (req, res) => {
  const { email, secretCode } = req.body;

  // Code secret pour upgrader (change-le en production !)
  const ADMIN_SECRET = process.env.ADMIN_SECRET || "SABOTEUR-ADMIN-2024-SECRET";

  if (secretCode !== ADMIN_SECRET) {
    return res.status(403).json({ error: "Code secret invalide" });
  }

  if (!email) {
    return res.status(400).json({ error: "Email requis" });
  }

  const user = dbGet("SELECT * FROM users WHERE email = ?", [email.toLowerCase()]);
  if (!user) {
    return res.status(404).json({ error: "Utilisateur non trouvé" });
  }

  // Upgrader vers admin avec crédits illimités
  dbRun(`
    UPDATE users SET 
      account_type = 'admin',
      email_verified = 1,
      video_credits = 99999,
      avatars_used = 0
    WHERE id = ?
  `, [user.id]);

  saveDatabase();

  console.log(`👑 ADMIN: ${email} upgradé vers admin`);

  res.json({
    success: true,
    message: `${user.username} est maintenant admin !`,
    user: {
      email: user.email,
      username: user.username,
      accountType: 'admin',
      videoCredits: 99999
    }
  });
});

// ADMIN: Voir tous les utilisateurs
app.get("/api/admin/users", (req, res) => {
  const { secretCode } = req.query;
  const ADMIN_SECRET = process.env.ADMIN_SECRET || "SABOTEUR-ADMIN-2024-SECRET";

  if (secretCode !== ADMIN_SECRET) {
    return res.status(403).json({ error: "Code secret invalide" });
  }

  const users = dbAll(`
    SELECT id, email, username, account_type, email_verified, video_credits, avatars_used, created_at, last_login
    FROM users ORDER BY created_at DESC LIMIT 100
  `);

  res.json({ users });
});

// ADMIN: Supprimer un utilisateur (pour tests)
app.delete("/api/admin/user", (req, res) => {
  const { secretCode, email } = req.query;
  const ADMIN_SECRET = process.env.ADMIN_SECRET || "SABOTEUR-ADMIN-2024-SECRET";

  if (secretCode !== ADMIN_SECRET) {
    return res.status(403).json({ error: "Code secret invalide" });
  }

  if (!email) {
    return res.status(400).json({ error: "Email requis" });
  }

  const user = dbGet("SELECT * FROM users WHERE email = ?", [email.toLowerCase()]);
  if (!user) {
    return res.status(404).json({ error: "Utilisateur non trouvé" });
  }

  // Supprimer les avatars associés
  dbRun("DELETE FROM avatars WHERE user_id = ?", [user.id]);
  
  // Supprimer le log de création (pour permettre de recréer un compte)
  dbRun("DELETE FROM account_creation_log WHERE email = ?", [email.toLowerCase()]);
  
  // Supprimer l'utilisateur
  dbRun("DELETE FROM users WHERE id = ?", [user.id]);
  
  saveDatabase();

  console.log(`🗑️ ADMIN: Utilisateur ${email} supprimé`);

  res.json({ success: true, message: `Utilisateur ${user.username} (${email}) supprimé` });
});

// ADMIN: Supprimer un utilisateur (version POST, plus facile depuis console)
app.post("/api/admin/delete-user", express.json(), (req, res) => {
  const { secretCode, email } = req.body;
  const ADMIN_SECRET = process.env.ADMIN_SECRET || "SABOTEUR-ADMIN-2024-SECRET";

  if (secretCode !== ADMIN_SECRET) {
    return res.status(403).json({ error: "Code secret invalide" });
  }

  if (!email) {
    return res.status(400).json({ error: "Email requis" });
  }

  const user = dbGet("SELECT * FROM users WHERE email = ?", [email.toLowerCase()]);
  if (!user) {
    return res.status(404).json({ error: "Utilisateur non trouvé" });
  }

  // Supprimer les avatars associés
  dbRun("DELETE FROM avatars WHERE user_id = ?", [user.id]);
  
  // Supprimer le log de création (pour permettre de recréer un compte)
  dbRun("DELETE FROM account_creation_log WHERE email = ?", [email.toLowerCase()]);
  
  // Supprimer l'utilisateur
  dbRun("DELETE FROM users WHERE id = ?", [user.id]);
  
  saveDatabase();

  console.log(`🗑️ ADMIN: Utilisateur ${email} supprimé`);

  res.json({ success: true, message: `Utilisateur ${user.username} (${email}) supprimé` });
});

// ADMIN: Effacer les logs de création de comptes (reset limites IP)
app.post("/api/admin/clear-ip-logs", express.json(), (req, res) => {
  const { secretCode, ip } = req.body;
  const ADMIN_SECRET = process.env.ADMIN_SECRET || "SABOTEUR-ADMIN-2024-SECRET";

  if (secretCode !== ADMIN_SECRET) {
    return res.status(403).json({ error: "Code secret invalide" });
  }

  if (ip) {
    // Effacer uniquement pour une IP spécifique
    const result = dbRun("DELETE FROM account_creation_log WHERE ip_address = ?", [ip]);
    console.log(`🧹 ADMIN: Logs IP ${ip} effacés`);
    res.json({ success: true, message: `Logs pour IP ${ip} effacés` });
  } else {
    // Effacer tous les logs
    dbRun("DELETE FROM account_creation_log");
    console.log(`🧹 ADMIN: Tous les logs de création effacés`);
    res.json({ success: true, message: "Tous les logs de création effacés" });
  }

  saveDatabase();
});

// ADMIN: Voir les logs de création (debug)
app.get("/api/admin/ip-logs", (req, res) => {
  const { secretCode } = req.query;
  const ADMIN_SECRET = process.env.ADMIN_SECRET || "SABOTEUR-ADMIN-2024-SECRET";

  if (secretCode !== ADMIN_SECRET) {
    return res.status(403).json({ error: "Code secret invalide" });
  }

  const logs = dbAll("SELECT * FROM account_creation_log ORDER BY created_at DESC LIMIT 100");
  res.json({ logs });
});

// Liste des rooms actives (pour debug/admin)
app.get("/api/rooms", (req, res) => {
  const roomList = Array.from(rooms.values()).map(r => ({
    code: r.code,
    state: r.state,
    playerCount: r.players.size,
    theme: r.theme,
    videoEnabled: r.videoEnabled
  }));
  res.json({ rooms: roomList });
});

// API: Liste des thèmes de jeu disponibles
app.get("/api/themes", (req, res) => {
  const themes = [
    { id: "default", name: "Spatial", icon: "🚀", premium: false },
    { id: "werewolf", name: "Loup-Garou", icon: "🐺", premium: false },
    { id: "wizard-academy", name: "Académie des Sorciers", icon: "🧙", premium: true },
    { id: "mythic-realms", name: "Royaumes Mythiques", icon: "⚔️", premium: true }
  ];
  // Retourner le tableau directement (format attendu par client.js)
  res.json(themes);
});

// Récupérer son rôle (pendant la partie)
app.get("/api/game/my-role", (req, res) => {
  const { roomCode, playerId } = req.query;
  const room = rooms.get(roomCode);
  
  if (!room) {
    return res.status(404).json({ error: "Room introuvable" });
  }

  const player = getPlayer(room, playerId);
  if (!player) {
    return res.status(404).json({ error: "Joueur introuvable" });
  }

  if (room.state !== "playing" && room.state !== "ended") {
    return res.json({ role: null, message: "Partie pas encore commencée" });
  }

  const roleInfo = ROLES[player.role];
  
  res.json({
    role: player.role,
    roleLabel: roleInfo?.label || player.role,
    team: roleInfo?.team,
    wakeAtNight: roleInfo?.wakeAtNight
  });
});

// Récupérer les stats d'un joueur
app.get("/api/stats/:playerName", (req, res) => {
  const { playerName } = req.params;
  const stats = statsDb[playerName];

  if (!stats) {
    return res.status(404).json({ error: "Joueur non trouvé" });
  }

  res.json({
    playerName,
    stats: {
      gamesPlayed: stats.gamesPlayed,
      wins: stats.wins,
      losses: stats.losses,
      winRate: stats.gamesPlayed > 0 ? Math.round((stats.wins / stats.gamesPlayed) * 100) : 0,
      winsByRole: stats.winsByRole,
      gamesByRole: stats.gamesByRole
    }
  });
});

// Page d'accueil par défaut
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ============================================================================
// SECTION 16: DÉMARRAGE DU SERVEUR
// ============================================================================

async function startServer() {
  console.log(`
╔═══════════════════════════════════════════════════════════════════════════╗
║                    🎮 SABOTEUR - DÉMARRAGE DU SERVEUR                      ║
╚═══════════════════════════════════════════════════════════════════════════╝
  `);

  // Initialiser la base de données
  await initDatabase();

  // Démarrer le serveur
  server.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════════════════════════════════╗
║                    🎮 SABOTEUR - SERVEUR UNIFIÉ V1.0                       ║
╠═══════════════════════════════════════════════════════════════════════════╣
║  🌐 URL: ${APP_URL.padEnd(58)}║
║  🔌 Port: ${String(PORT).padEnd(57)}║
╠═══════════════════════════════════════════════════════════════════════════╣
║  📦 Fonctionnalités:                                                      ║
║     ✅ Authentification (login/register/email)                            ║
║     ✅ Vérification email ${resend ? "(Resend)" : "(simulé)"}                                       ║
║     ✅ Génération d'avatars IA ${replicate ? "(Replicate)" : "(non configuré)"}                         ║
║     ✅ Jeu multijoueur temps réel (Socket.IO)                             ║
║     ✅ Mode vidéo (2 parties gratuites)                                   ║
║     ✅ Anti-fraude (email vérifié + limite IP)                            ║
║     ✅ Base de données SQLite persistante                                 ║
╠═══════════════════════════════════════════════════════════════════════════╣
║  💰 Monétisation:                                                         ║
║     🆓 Gratuit: 2 parties vidéo + 1 avatar + 2 thèmes                     ║
║     💎 Abo 1.49€: Vidéo illimitée + 30 avatars + 4 thèmes                ║
║     📦 Pack 4.99€: 50 parties + 50 avatars + 6 thèmes                    ║
║     👨‍👩‍👧‍👦 Famille 9.99€: 6 comptes + illimité + 10 thèmes                   ║
╠═══════════════════════════════════════════════════════════════════════════╣
║  🎨 Thèmes:                                                               ║
║     🆓 🚀 Spatial | 🆓 🐺 Loups-Garous                                     ║
║     💎 🧙 Sorciers | 💎 ⚔️ Mythique                                        ║
╚═══════════════════════════════════════════════════════════════════════════╝
    `);
  });
}

// Gestion des erreurs non capturées
process.on("uncaughtException", (err) => {
  console.error("❌ Uncaught Exception:", err);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Rejection:", reason);
});

// Sauvegarde périodique de la base de données
setInterval(() => {
  saveDatabase();
}, 5 * 60 * 1000); // Toutes les 5 minutes

// Démarrer
startServer().catch(console.error);

module.exports = { app, server, io };
