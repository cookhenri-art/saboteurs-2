/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║            🌍 SABOTEUR - SYSTÈME DE TRADUCTIONS V2.0                      ║
 * ║                                                                           ║
 * ║  Langues supportées : FR, EN, ES, IT, DE, PT, NL                         ║
 * ║  V2.0 : Ajout game.html, règles, tutoriel, chat complets                 ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

const TRANSLATIONS = {
  // ============================================================================
  // LANGUES DISPONIBLES
  // ============================================================================
  _languages: {
    fr: { name: "Français", flag: "🇫🇷" },
    en: { name: "English", flag: "🇬🇧" },
    es: { name: "Español", flag: "🇪🇸" },
    it: { name: "Italiano", flag: "🇮🇹" },
    de: { name: "Deutsch", flag: "🇩🇪" },
    pt: { name: "Português", flag: "🇵🇹" },
    nl: { name: "Nederlands", flag: "🇳🇱" }
  },

  // ============================================================================
  // NOMS DES RÔLES PAR THÈME ET PAR LANGUE
  // Priorité: thème → langue (ex: Loup-Garou + Allemand = Werwolf)
  // ============================================================================
  themeRoles: {
    // ====== THÈME SPATIAL (default) ======
    default: {
      saboteur: {
        fr: "Saboteur", en: "Saboteur", es: "Saboteador", it: "Sabotatore", de: "Saboteur", pt: "Sabotador", nl: "Saboteur",
        fr_plural: "Saboteurs", en_plural: "Saboteurs", es_plural: "Saboteadores", it_plural: "Sabotatori", de_plural: "Saboteure", pt_plural: "Sabotadores", nl_plural: "Saboteurs"
      },
      astronaut: {
        fr: "Astronaute", en: "Astronaut", es: "Astronauta", it: "Astronauta", de: "Astronaut", pt: "Astronauta", nl: "Astronaut",
        fr_plural: "Astronautes", en_plural: "Astronauts", es_plural: "Astronautas", it_plural: "Astronauti", de_plural: "Astronauten", pt_plural: "Astronautas", nl_plural: "Astronauten"
      },
      doctor: {
        fr: "Docteur Bio", en: "Bio Doctor", es: "Doctor Bio", it: "Dottore Bio", de: "Bio-Arzt", pt: "Doutor Bio", nl: "Bio Dokter"
      },
      security: {
        fr: "Chef de Sécurité", en: "Security Chief", es: "Jefe de Seguridad", it: "Capo della Sicurezza", de: "Sicherheitschef", pt: "Chefe de Segurança", nl: "Beveiligingschef"
      },
      radar: {
        fr: "Officier Radar", en: "Radar Officer", es: "Oficial de Radar", it: "Ufficiale Radar", de: "Radaroffizier", pt: "Oficial de Radar", nl: "Radarofficier"
      },
      ai_agent: {
        fr: "Agent IA", en: "AI Agent", es: "Agente IA", it: "Agente IA", de: "KI-Agent", pt: "Agente IA", nl: "AI-agent"
      },
      engineer: {
        fr: "Ingénieur", en: "Engineer", es: "Ingeniero", it: "Ingegnere", de: "Ingenieur", pt: "Engenheiro", nl: "Ingenieur"
      },
      chameleon: {
        fr: "Caméléon", en: "Chameleon", es: "Camaleón", it: "Camaleonte", de: "Chamäleon", pt: "Camaleão", nl: "Kameleon"
      }
    },
    
    // ====== THÈME LOUP-GAROU (werewolf) ======
    werewolf: {
      saboteur: {
        fr: "Loup-Garou", en: "Werewolf", es: "Hombre Lobo", it: "Lupo Mannaro", de: "Werwolf", pt: "Lobisomem", nl: "Weerwolf",
        fr_plural: "Loups-Garous", en_plural: "Werewolves", es_plural: "Hombres Lobo", it_plural: "Lupi Mannari", de_plural: "Werwölfe", pt_plural: "Lobisomens", nl_plural: "Weerwolven"
      },
      astronaut: {
        fr: "Villageois", en: "Villager", es: "Aldeano", it: "Villico", de: "Dorfbewohner", pt: "Aldeão", nl: "Dorpeling",
        fr_plural: "Villageois", en_plural: "Villagers", es_plural: "Aldeanos", it_plural: "Villici", de_plural: "Dorfbewohner", pt_plural: "Aldeões", nl_plural: "Dorpelingen"
      },
      doctor: {
        fr: "Sorcière", en: "Witch", es: "Bruja", it: "Strega", de: "Hexe", pt: "Bruxa", nl: "Heks"
      },
      security: {
        fr: "Chasseur", en: "Hunter", es: "Cazador", it: "Cacciatore", de: "Jäger", pt: "Caçador", nl: "Jager"
      },
      radar: {
        fr: "Voyante", en: "Seer", es: "Vidente", it: "Veggente", de: "Seherin", pt: "Vidente", nl: "Ziener"
      },
      ai_agent: {
        fr: "L'Amoureux", en: "Cupid", es: "Cupido", it: "Cupido", de: "Amor", pt: "Cupido", nl: "Cupido"
      },
      engineer: {
        fr: "Petit Garçon", en: "Little Boy", es: "Niño Pequeño", it: "Ragazzino", de: "Kleiner Junge", pt: "Menino", nl: "Kleine Jongen"
      },
      chameleon: {
        fr: "Transformiste", en: "Shapeshifter", es: "Metamorfo", it: "Mutaforma", de: "Gestaltwandler", pt: "Metamorfo", nl: "Gedaanteverwisselaar"
      }
    },
    
    // ====== THÈME SORCIERS (wizard-academy) ======
    "wizard-academy": {
      saboteur: {
        fr: "Mage Noir", en: "Dark Wizard", es: "Mago Oscuro", it: "Mago Oscuro", de: "Schwarzmagier", pt: "Mago Negro", nl: "Zwarte Magiër",
        fr_plural: "Mages Noirs", en_plural: "Dark Wizards", es_plural: "Magos Oscuros", it_plural: "Maghi Oscuri", de_plural: "Schwarzmagier", pt_plural: "Magos Negros", nl_plural: "Zwarte Magiërs"
      },
      astronaut: {
        fr: "Élève", en: "Student", es: "Estudiante", it: "Studente", de: "Schüler", pt: "Estudante", nl: "Leerling",
        fr_plural: "Élèves", en_plural: "Students", es_plural: "Estudiantes", it_plural: "Studenti", de_plural: "Schüler", pt_plural: "Estudantes", nl_plural: "Leerlingen"
      },
      doctor: {
        fr: "Alchimiste", en: "Alchemist", es: "Alquimista", it: "Alchimista", de: "Alchemist", pt: "Alquimista", nl: "Alchemist"
      },
      security: {
        fr: "Duelliste", en: "Duelist", es: "Duelista", it: "Duellante", de: "Duellant", pt: "Duelista", nl: "Duellist"
      },
      radar: {
        fr: "Oracle", en: "Oracle", es: "Oráculo", it: "Oracolo", de: "Orakel", pt: "Oráculo", nl: "Orakel"
      },
      ai_agent: {
        fr: "Lien Mystique", en: "Mystic Bond", es: "Vínculo Místico", it: "Legame Mistico", de: "Mystische Bindung", pt: "Vínculo Místico", nl: "Mystieke Band"
      },
      engineer: {
        fr: "Espion", en: "Spy", es: "Espía", it: "Spia", de: "Spion", pt: "Espião", nl: "Spion"
      },
      chameleon: {
        fr: "Métamorphe", en: "Metamorph", es: "Metamorfo", it: "Metamorfo", de: "Metamorph", pt: "Metamorfo", nl: "Metamorf"
      }
    },
    
    // ====== THÈME MYTHIQUE (mythic-realms) ======
    "mythic-realms": {
      saboteur: {
        fr: "Titan", en: "Titan", es: "Titán", it: "Titano", de: "Titan", pt: "Titã", nl: "Titaan",
        fr_plural: "Titans", en_plural: "Titans", es_plural: "Titanes", it_plural: "Titani", de_plural: "Titanen", pt_plural: "Titãs", nl_plural: "Titanen"
      },
      astronaut: {
        fr: "Héros", en: "Hero", es: "Héroe", it: "Eroe", de: "Held", pt: "Herói", nl: "Held",
        fr_plural: "Héros", en_plural: "Heroes", es_plural: "Héroes", it_plural: "Eroi", de_plural: "Helden", pt_plural: "Heróis", nl_plural: "Helden"
      },
      doctor: {
        fr: "Guérisseur", en: "Healer", es: "Curandero", it: "Guaritore", de: "Heiler", pt: "Curandeiro", nl: "Genezer"
      },
      security: {
        fr: "Vengeur", en: "Avenger", es: "Vengador", it: "Vendicatore", de: "Rächer", pt: "Vingador", nl: "Wreker"
      },
      radar: {
        fr: "Prophète", en: "Prophet", es: "Profeta", it: "Profeta", de: "Prophet", pt: "Profeta", nl: "Profeet"
      },
      ai_agent: {
        fr: "Destin", en: "Fate", es: "Destino", it: "Destino", de: "Schicksal", pt: "Destino", nl: "Lot"
      },
      engineer: {
        fr: "Éclaireur", en: "Scout", es: "Explorador", it: "Esploratore", de: "Späher", pt: "Batedor", nl: "Verkenner"
      },
      chameleon: {
        fr: "Polymorphe", en: "Polymorph", es: "Polimorfo", it: "Polimorfo", de: "Polymorph", pt: "Polimorfo", nl: "Polymorf"
      }
    }
  },

  // ============================================================================
  // COMMUN / GLOBAL
  // ============================================================================
  common: {
    guest: {
      fr: "Invité",
      en: "Guest",
      es: "Invitado",
      it: "Ospite",
      de: "Gast",
      pt: "Convidado",
      nl: "Gast"
    },
    chatOnly: {
      fr: "Chat uniquement",
      en: "Chat only",
      es: "Solo chat",
      it: "Solo chat",
      de: "Nur Chat",
      pt: "Apenas chat",
      nl: "Alleen chat"
    },
    disconnect: {
      fr: "Déconnexion",
      en: "Disconnect",
      es: "Desconectar",
      it: "Disconnetti",
      de: "Abmelden",
      pt: "Desconectar",
      nl: "Uitloggen"
    },
    back: {
      fr: "Retour",
      en: "Back",
      es: "Volver",
      it: "Indietro",
      de: "Zurück",
      pt: "Voltar",
      nl: "Terug"
    },
    tip: {
      fr: "Astuce",
      en: "Tip",
      es: "Consejo",
      it: "Suggerimento",
      de: "Tipp",
      pt: "Dica",
      nl: "Tip"
    },
    connection: {
      fr: "Connexion",
      en: "Connection",
      es: "Conexión",
      it: "Connessione",
      de: "Verbindung",
      pt: "Conexão",
      nl: "Verbinding"
    },
    next: {
      fr: "Suivant →",
      en: "Next →",
      es: "Siguiente →",
      it: "Avanti →",
      de: "Weiter →",
      pt: "Próximo →",
      nl: "Volgende →"
    },
    previous: {
      fr: "← Précédent",
      en: "← Previous",
      es: "← Anterior",
      it: "← Precedente",
      de: "← Zurück",
      pt: "← Anterior",
      nl: "← Vorige"
    },
    start: {
      fr: "Commencer ! 🚀",
      en: "Start! 🚀",
      es: "¡Comenzar! 🚀",
      it: "Inizia! 🚀",
      de: "Starten! 🚀",
      pt: "Começar! 🚀",
      nl: "Starten! 🚀"
    }
  },

  // ============================================================================
  // INDEX.HTML - PAGE D'ACCUEIL
  // ============================================================================
  index: {
    // Titre et sous-titre
    title: {
      fr: "LES SABOTEURS",
      en: "THE SABOTEURS",
      es: "LOS SABOTEADORES",
      it: "I SABOTATORI",
      de: "DIE SABOTEURE",
      pt: "OS SABOTADORES",
      nl: "DE SABOTEURS"
    },
    subtitle: {
      fr: "JEU DE DÉDUCTION SOCIALE",
      en: "SOCIAL DEDUCTION GAME",
      es: "JUEGO DE DEDUCCIÓN SOCIAL",
      it: "GIOCO DI DEDUZIONE SOCIALE",
      de: "SOZIALES DEDUKTIONSSPIEL",
      pt: "JOGO DE DEDUÇÃO SOCIAL",
      nl: "SOCIAAL DEDUCTIESPEL"
    },
    subtitleSmall: {
      fr: "Jeu de déduction sociale multijoueur",
      en: "Multiplayer social deduction game",
      es: "Juego de deducción social multijugador",
      it: "Gioco di deduzione sociale multiplayer",
      de: "Multiplayer-Sozialdeduktionsspiel",
      pt: "Jogo de dedução social multiplayer",
      nl: "Multiplayer sociaal deductiespel"
    },
    missionRealtime: {
      fr: "⚡ MISSION TEMPS RÉEL ⚡",
      en: "⚡ REAL-TIME MISSION ⚡",
      es: "⚡ MISIÓN EN TIEMPO REAL ⚡",
      it: "⚡ MISSIONE IN TEMPO REALE ⚡",
      de: "⚡ ECHTZEIT-MISSION ⚡",
      pt: "⚡ MISSÃO EM TEMPO REAL ⚡",
      nl: "⚡ REAL-TIME MISSIE ⚡"
    },
    
    // Sélecteur de thème
    themeSelector: {
      title: {
        fr: "CHOISIS TON UNIVERS",
        en: "CHOOSE YOUR UNIVERSE",
        es: "ELIGE TU UNIVERSO",
        it: "SCEGLI IL TUO UNIVERSO",
        de: "WÄHLE DEIN UNIVERSUM",
        pt: "ESCOLHA SEU UNIVERSO",
        nl: "KIES JE UNIVERSUM"
      },
      subtitle: {
        fr: "Ce thème sera appliqué à ta partie",
        en: "This theme will be applied to your game",
        es: "Este tema se aplicará a tu partida",
        it: "Questo tema verrà applicato alla tua partita",
        de: "Dieses Thema wird auf dein Spiel angewendet",
        pt: "Este tema será aplicado ao seu jogo",
        nl: "Dit thema wordt toegepast op je spel"
      },
      selected: {
        fr: "Thème sélectionné",
        en: "Selected theme",
        es: "Tema seleccionado",
        it: "Tema selezionato",
        de: "Ausgewähltes Thema",
        pt: "Tema selecionado",
        nl: "Geselecteerd thema"
      },
      chooseTheme: {
        fr: "🎨 CHOIX DU THÈME",
        en: "🎨 CHOOSE THEME",
        es: "🎨 ELEGIR TEMA",
        it: "🎨 SCEGLI TEMA",
        de: "🎨 THEMA WÄHLEN",
        pt: "🎨 ESCOLHER TEMA",
        nl: "🎨 KIES THEMA"
      }
    },
    
    // Noms des thèmes
    themes: {
      spatial: {
        fr: "Spatial",
        en: "Space",
        es: "Espacial",
        it: "Spaziale",
        de: "Weltraum",
        pt: "Espacial",
        nl: "Ruimte"
      },
      werewolf: {
        fr: "Loup-Garou",
        en: "Werewolf",
        es: "Hombre Lobo",
        it: "Lupo Mannaro",
        de: "Werwolf",
        pt: "Lobisomem",
        nl: "Weerwolf"
      },
      wizardAcademy: {
        fr: "Sorciers",
        en: "Wizards",
        es: "Magos",
        it: "Maghi",
        de: "Zauberer",
        pt: "Bruxos",
        nl: "Tovenaars"
      },
      mythicRealms: {
        fr: "Mythique",
        en: "Mythic",
        es: "Mítico",
        it: "Mitico",
        de: "Mythisch",
        pt: "Mítico",
        nl: "Mythisch"
      }
    },
    
    // Sélecteur de langue
    languageSelector: {
      title: {
        fr: "LANGUE",
        en: "LANGUAGE",
        es: "IDIOMA",
        it: "LINGUA",
        de: "SPRACHE",
        pt: "IDIOMA",
        nl: "TAAL"
      }
    },
    
    // Authentification
    auth: {
      login: {
        fr: "CONNEXION",
        en: "LOGIN",
        es: "INICIAR SESIÓN",
        it: "ACCEDI",
        de: "ANMELDEN",
        pt: "ENTRAR",
        nl: "INLOGGEN"
      },
      register: {
        fr: "INSCRIPTION",
        en: "REGISTER",
        es: "REGISTRO",
        it: "REGISTRATI",
        de: "REGISTRIEREN",
        pt: "REGISTRAR",
        nl: "REGISTREREN"
      },
      email: {
        fr: "EMAIL",
        en: "EMAIL",
        es: "EMAIL",
        it: "EMAIL",
        de: "E-MAIL",
        pt: "EMAIL",
        nl: "E-MAIL"
      },
      emailPlaceholder: {
        fr: "ton@email.com",
        en: "your@email.com",
        es: "tu@email.com",
        it: "tua@email.com",
        de: "deine@email.com",
        pt: "seu@email.com",
        nl: "jouw@email.com"
      },
      password: {
        fr: "MOT DE PASSE",
        en: "PASSWORD",
        es: "CONTRASEÑA",
        it: "PASSWORD",
        de: "PASSWORT",
        pt: "SENHA",
        nl: "WACHTWOORD"
      },
      passwordPlaceholder: {
        fr: "••••••••",
        en: "••••••••",
        es: "••••••••",
        it: "••••••••",
        de: "••••••••",
        pt: "••••••••",
        nl: "••••••••"
      },
      username: {
        fr: "PSEUDO",
        en: "USERNAME",
        es: "NOMBRE DE USUARIO",
        it: "NOME UTENTE",
        de: "BENUTZERNAME",
        pt: "NOME DE USUÁRIO",
        nl: "GEBRUIKERSNAAM"
      },
      usernamePlaceholder: {
        fr: "Ton pseudo",
        en: "Your username",
        es: "Tu nombre de usuario",
        it: "Il tuo nome utente",
        de: "Dein Benutzername",
        pt: "Seu nome de usuário",
        nl: "Je gebruikersnaam"
      },
      confirmPassword: {
        fr: "CONFIRMER MOT DE PASSE",
        en: "CONFIRM PASSWORD",
        es: "CONFIRMAR CONTRASEÑA",
        it: "CONFERMA PASSWORD",
        de: "PASSWORT BESTÄTIGEN",
        pt: "CONFIRMAR SENHA",
        nl: "WACHTWOORD BEVESTIGEN"
      },
      loginButton: {
        fr: "🚀 CONNEXION",
        en: "🚀 LOGIN",
        es: "🚀 INICIAR SESIÓN",
        it: "🚀 ACCEDI",
        de: "🚀 ANMELDEN",
        pt: "🚀 ENTRAR",
        nl: "🚀 INLOGGEN"
      },
      registerButton: {
        fr: "🚀 CRÉER MON COMPTE",
        en: "🚀 CREATE MY ACCOUNT",
        es: "🚀 CREAR MI CUENTA",
        it: "🚀 CREA IL MIO ACCOUNT",
        de: "🚀 MEIN KONTO ERSTELLEN",
        pt: "🚀 CRIAR MINHA CONTA",
        nl: "🚀 MIJN ACCOUNT AANMAKEN"
      },
      forgotPassword: {
        fr: "Mot de passe oublié ?",
        en: "Forgot password?",
        es: "¿Olvidaste tu contraseña?",
        it: "Password dimenticata?",
        de: "Passwort vergessen?",
        pt: "Esqueceu a senha?",
        nl: "Wachtwoord vergeten?"
      },
      or: {
        fr: "OU",
        en: "OR",
        es: "O",
        it: "O",
        de: "ODER",
        pt: "OU",
        nl: "OF"
      },
      playAsGuest: {
        fr: "🎮 Jouer en tant qu'invité",
        en: "🎮 Play as guest",
        es: "🎮 Jugar como invitado",
        it: "🎮 Gioca come ospite",
        de: "🎮 Als Gast spielen",
        pt: "🎮 Jogar como convidado",
        nl: "🎮 Spelen als gast"
      },
      guestLimitations: {
        fr: "Sans compte : pas de vidéo, pas de progression sauvegardée",
        en: "Without account: no video, no saved progress",
        es: "Sin cuenta: sin vídeo, sin progreso guardado",
        it: "Senza account: niente video, niente progressi salvati",
        de: "Ohne Konto: kein Video, kein gespeicherter Fortschritt",
        pt: "Sem conta: sem vídeo, sem progresso salvo",
        nl: "Zonder account: geen video, geen opgeslagen voortgang"
      }
    },
    
    // Profil connecté
    profile: {
      playNow: {
        fr: "🎮 JOUER MAINTENANT",
        en: "🎮 PLAY NOW",
        es: "🎮 JUGAR AHORA",
        it: "🎮 GIOCA ORA",
        de: "🎮 JETZT SPIELEN",
        pt: "🎮 JOGAR AGORA",
        nl: "🎮 NU SPELEN"
      },
      createAvatar: {
        fr: "🎨 CRÉER MON AVATAR IA",
        en: "🎨 CREATE MY AI AVATAR",
        es: "🎨 CREAR MI AVATAR IA",
        it: "🎨 CREA IL MIO AVATAR IA",
        de: "🎨 MEINEN KI-AVATAR ERSTELLEN",
        pt: "🎨 CRIAR MEU AVATAR IA",
        nl: "🎨 MIJN AI-AVATAR MAKEN"
      },
      changePassword: {
        fr: "🔐 MODIFIER MOT DE PASSE",
        en: "🔐 CHANGE PASSWORD",
        es: "🔐 CAMBIAR CONTRASEÑA",
        it: "🔐 CAMBIA PASSWORD",
        de: "🔐 PASSWORT ÄNDERN",
        pt: "🔐 ALTERAR SENHA",
        nl: "🔐 WACHTWOORD WIJZIGEN"
      },
      logout: {
        fr: "🚪 DÉCONNEXION",
        en: "🚪 LOGOUT",
        es: "🚪 CERRAR SESIÓN",
        it: "🚪 ESCI",
        de: "🚪 ABMELDEN",
        pt: "🚪 SAIR",
        nl: "🚪 UITLOGGEN"
      },
      videoCredits: {
        fr: "partie(s) vidéo",
        en: "video game(s)",
        es: "partida(s) de vídeo",
        it: "partita/e video",
        de: "Videospiel(e)",
        pt: "jogo(s) de vídeo",
        nl: "videospel(len)"
      },
      videoUnlimited: {
        fr: "Vidéo illimitée",
        en: "Unlimited video",
        es: "Vídeo ilimitado",
        it: "Video illimitato",
        de: "Unbegrenztes Video",
        pt: "Vídeo ilimitado",
        nl: "Onbeperkte video"
      },
      verifyEmail: {
        fr: "📧 Vérifie ton email pour activer ton compte",
        en: "📧 Verify your email to activate your account",
        es: "📧 Verifica tu email para activar tu cuenta",
        it: "📧 Verifica la tua email per attivare il tuo account",
        de: "📧 Bestätige deine E-Mail, um dein Konto zu aktivieren",
        pt: "📧 Verifique seu email para ativar sua conta",
        nl: "📧 Verifieer je e-mail om je account te activeren"
      },
      resendEmail: {
        fr: "Renvoyer l'email",
        en: "Resend email",
        es: "Reenviar email",
        it: "Reinvia email",
        de: "E-Mail erneut senden",
        pt: "Reenviar email",
        nl: "E-mail opnieuw verzenden"
      }
    },
    
    // Modal rejoindre/créer
    gameModal: {
      playerName: {
        fr: "NOM DU JOUEUR",
        en: "PLAYER NAME",
        es: "NOMBRE DEL JUGADOR",
        it: "NOME GIOCATORE",
        de: "SPIELERNAME",
        pt: "NOME DO JOGADOR",
        nl: "SPELERNAAM"
      },
      playerNamePlaceholder: {
        fr: "Entrez votre nom",
        en: "Enter your name",
        es: "Ingresa tu nombre",
        it: "Inserisci il tuo nome",
        de: "Gib deinen Namen ein",
        pt: "Digite seu nome",
        nl: "Voer je naam in"
      },
      createGame: {
        fr: "🚀 CRÉER UNE MISSION",
        en: "🚀 CREATE A MISSION",
        es: "🚀 CREAR UNA MISIÓN",
        it: "🚀 CREA UNA MISSIONE",
        de: "🚀 EINE MISSION ERSTELLEN",
        pt: "🚀 CRIAR UMA MISSÃO",
        nl: "🚀 EEN MISSIE MAKEN"
      },
      joinGame: {
        fr: "🔗 REJOINDRE UNE MISSION",
        en: "🔗 JOIN A MISSION",
        es: "🔗 UNIRSE A UNA MISIÓN",
        it: "🔗 UNISCITI A UNA MISSIONE",
        de: "🔗 EINER MISSION BEITRETEN",
        pt: "🔗 ENTRAR EM UMA MISSÃO",
        nl: "🔗 DEELNEMEN AAN EEN MISSIE"
      },
      gameCode: {
        fr: "CODE DE LA PARTIE",
        en: "GAME CODE",
        es: "CÓDIGO DE PARTIDA",
        it: "CODICE PARTITA",
        de: "SPIELCODE",
        pt: "CÓDIGO DO JOGO",
        nl: "SPELCODE"
      },
      gameCodePlaceholder: {
        fr: "Ex: 1234",
        en: "Ex: 1234",
        es: "Ej: 1234",
        it: "Es: 1234",
        de: "Z.B.: 1234",
        pt: "Ex: 1234",
        nl: "Bijv: 1234"
      },
      roomNumber: {
        fr: "Numéro de salle",
        en: "Room number",
        es: "Número de sala",
        it: "Numero stanza",
        de: "Raumnummer",
        pt: "Número da sala",
        nl: "Kamernummer"
      },
      generateCode: {
        fr: "Générer Code Mission",
        en: "Generate Mission Code",
        es: "Generar Código de Misión",
        it: "Genera Codice Missione",
        de: "Missionscode generieren",
        pt: "Gerar Código de Missão",
        nl: "Missiecode genereren"
      }
    },
    
    // Messages toast
    toasts: {
      loginSuccess: {
        fr: "Connexion réussie !",
        en: "Login successful!",
        es: "¡Inicio de sesión exitoso!",
        it: "Accesso riuscito!",
        de: "Anmeldung erfolgreich!",
        pt: "Login realizado com sucesso!",
        nl: "Succesvol ingelogd!"
      },
      registerSuccess: {
        fr: "Compte créé ! Vérifie ton email.",
        en: "Account created! Check your email.",
        es: "¡Cuenta creada! Revisa tu email.",
        it: "Account creato! Controlla la tua email.",
        de: "Konto erstellt! Überprüfe deine E-Mail.",
        pt: "Conta criada! Verifique seu email.",
        nl: "Account aangemaakt! Controleer je e-mail."
      },
      logoutSuccess: {
        fr: "Déconnexion réussie",
        en: "Logged out successfully",
        es: "Sesión cerrada correctamente",
        it: "Disconnessione riuscita",
        de: "Erfolgreich abgemeldet",
        pt: "Logout realizado com sucesso",
        nl: "Succesvol uitgelogd"
      },
      emailRequired: {
        fr: "Email requis",
        en: "Email required",
        es: "Email requerido",
        it: "Email richiesta",
        de: "E-Mail erforderlich",
        pt: "Email obrigatório",
        nl: "E-mail vereist"
      },
      passwordRequired: {
        fr: "Mot de passe requis",
        en: "Password required",
        es: "Contraseña requerida",
        it: "Password richiesta",
        de: "Passwort erforderlich",
        pt: "Senha obrigatória",
        nl: "Wachtwoord vereist"
      },
      passwordMismatch: {
        fr: "Les mots de passe ne correspondent pas",
        en: "Passwords do not match",
        es: "Las contraseñas no coinciden",
        it: "Le password non corrispondono",
        de: "Passwörter stimmen nicht überein",
        pt: "As senhas não coincidem",
        nl: "Wachtwoorden komen niet overeen"
      },
      usernameRequired: {
        fr: "Pseudo requis",
        en: "Username required",
        es: "Nombre de usuario requerido",
        it: "Nome utente richiesto",
        de: "Benutzername erforderlich",
        pt: "Nome de usuário obrigatório",
        nl: "Gebruikersnaam vereist"
      },
      invalidCredentials: {
        fr: "Email ou mot de passe incorrect",
        en: "Invalid email or password",
        es: "Email o contraseña incorrectos",
        it: "Email o password non validi",
        de: "Ungültige E-Mail oder Passwort",
        pt: "Email ou senha inválidos",
        nl: "Ongeldige e-mail of wachtwoord"
      },
      networkError: {
        fr: "Erreur réseau",
        en: "Network error",
        es: "Error de red",
        it: "Errore di rete",
        de: "Netzwerkfehler",
        pt: "Erro de rede",
        nl: "Netwerkfout"
      },
      gameCodeRequired: {
        fr: "Code de partie requis",
        en: "Game code required",
        es: "Código de partida requerido",
        it: "Codice partita richiesto",
        de: "Spielcode erforderlich",
        pt: "Código do jogo obrigatório",
        nl: "Spelcode vereist"
      },
      nameRequired: {
        fr: "Nom de joueur requis",
        en: "Player name required",
        es: "Nombre de jugador requerido",
        it: "Nome giocatore richiesto",
        de: "Spielername erforderlich",
        pt: "Nome do jogador obrigatório",
        nl: "Spelernaam vereist"
      },
      premiumThemeBlocked: {
        fr: "Ce thème est réservé aux abonnés Premium",
        en: "This theme is reserved for Premium subscribers",
        es: "Este tema está reservado para suscriptores Premium",
        it: "Questo tema è riservato agli abbonati Premium",
        de: "Dieses Thema ist Premium-Abonnenten vorbehalten",
        pt: "Este tema é reservado para assinantes Premium",
        nl: "Dit thema is gereserveerd voor Premium-abonnees"
      }
    },
    
    // Modal changement de mot de passe
    passwordModal: {
      title: {
        fr: "🔐 Changer le mot de passe",
        en: "🔐 Change password",
        es: "🔐 Cambiar contraseña",
        it: "🔐 Cambia password",
        de: "🔐 Passwort ändern",
        pt: "🔐 Alterar senha",
        nl: "🔐 Wachtwoord wijzigen"
      },
      currentPassword: {
        fr: "MOT DE PASSE ACTUEL",
        en: "CURRENT PASSWORD",
        es: "CONTRASEÑA ACTUAL",
        it: "PASSWORD ATTUALE",
        de: "AKTUELLES PASSWORT",
        pt: "SENHA ATUAL",
        nl: "HUIDIG WACHTWOORD"
      },
      newPassword: {
        fr: "NOUVEAU MOT DE PASSE",
        en: "NEW PASSWORD",
        es: "NUEVA CONTRASEÑA",
        it: "NUOVA PASSWORD",
        de: "NEUES PASSWORT",
        pt: "NOVA SENHA",
        nl: "NIEUW WACHTWOORD"
      },
      confirmPassword: {
        fr: "CONFIRMER",
        en: "CONFIRM",
        es: "CONFIRMAR",
        it: "CONFERMA",
        de: "BESTÄTIGEN",
        pt: "CONFIRMAR",
        nl: "BEVESTIGEN"
      },
      minChars: {
        fr: "Minimum 6 caractères",
        en: "Minimum 6 characters",
        es: "Mínimo 6 caracteres",
        it: "Minimo 6 caratteri",
        de: "Mindestens 6 Zeichen",
        pt: "Mínimo 6 caracteres",
        nl: "Minimaal 6 tekens"
      },
      retypePassword: {
        fr: "Retape le nouveau mot de passe",
        en: "Retype the new password",
        es: "Vuelve a escribir la nueva contraseña",
        it: "Riscrivi la nuova password",
        de: "Neues Passwort erneut eingeben",
        pt: "Digite novamente a nova senha",
        nl: "Typ het nieuwe wachtwoord opnieuw"
      },
      validate: {
        fr: "✅ Valider",
        en: "✅ Validate",
        es: "✅ Validar",
        it: "✅ Conferma",
        de: "✅ Bestätigen",
        pt: "✅ Validar",
        nl: "✅ Bevestigen"
      },
      cancel: {
        fr: "✖ Annuler",
        en: "✖ Cancel",
        es: "✖ Cancelar",
        it: "✖ Annulla",
        de: "✖ Abbrechen",
        pt: "✖ Cancelar",
        nl: "✖ Annuleren"
      }
    },
    
    // Règles
    rules: {
      title: {
        fr: "📜 RÈGLES DU JEU",
        en: "📜 GAME RULES",
        es: "📜 REGLAS DEL JUEGO",
        it: "📜 REGOLE DEL GIOCO",
        de: "📜 SPIELREGELN",
        pt: "📜 REGRAS DO JOGO",
        nl: "📜 SPELREGELS"
      },
      close: {
        fr: "Fermer",
        en: "Close",
        es: "Cerrar",
        it: "Chiudi",
        de: "Schließen",
        pt: "Fechar",
        nl: "Sluiten"
      }
    },
    
    // Bouton règles
    rulesButton: {
      fr: "📜 RÈGLES",
      en: "📜 RULES",
      es: "📜 REGLAS",
      it: "📜 REGOLE",
      de: "📜 REGELN",
      pt: "📜 REGRAS",
      nl: "📜 REGELS"
    },
    
    // Avantages compte gratuit
    features: {
      title: {
        fr: "✨ AVANTAGES DU COMPTE GRATUIT",
        en: "✨ FREE ACCOUNT BENEFITS",
        es: "✨ VENTAJAS DE LA CUENTA GRATUITA",
        it: "✨ VANTAGGI DELL'ACCOUNT GRATUITO",
        de: "✨ VORTEILE DES KOSTENLOSEN KONTOS",
        pt: "✨ VANTAGENS DA CONTA GRATUITA",
        nl: "✨ VOORDELEN VAN HET GRATIS ACCOUNT"
      },
      videoGames: {
        fr: "2 parties vidéo",
        en: "2 video games",
        es: "2 partidas de vídeo",
        it: "2 partite video",
        de: "2 Videospiele",
        pt: "2 jogos de vídeo",
        nl: "2 videospellen"
      },
      aiAvatar: {
        fr: "1 avatar IA",
        en: "1 AI avatar",
        es: "1 avatar IA",
        it: "1 avatar IA",
        de: "1 KI-Avatar",
        pt: "1 avatar IA",
        nl: "1 AI-avatar"
      },
      themes: {
        fr: "2 thèmes",
        en: "2 themes",
        es: "2 temas",
        it: "2 temi",
        de: "2 Themen",
        pt: "2 temas",
        nl: "2 thema's"
      },
      unlimitedChat: {
        fr: "Chat illimité",
        en: "Unlimited chat",
        es: "Chat ilimitado",
        it: "Chat illimitata",
        de: "Unbegrenzter Chat",
        pt: "Chat ilimitado",
        nl: "Onbeperkte chat"
      }
    },
    
    // Footer / PWA
    pwa: {
      installApp: {
        fr: "APP",
        en: "APP",
        es: "APP",
        it: "APP",
        de: "APP",
        pt: "APP",
        nl: "APP"
      },
      installMobileIOS: {
        fr: "📱 Pour installer :\n\n1. Appuie sur le bouton Partager (carré avec flèche)\n2. Choisis \"Sur l'écran d'accueil\"",
        en: "📱 To install:\n\n1. Tap the Share button (square with arrow)\n2. Choose \"Add to Home Screen\"",
        es: "📱 Para instalar:\n\n1. Pulsa el botón Compartir (cuadrado con flecha)\n2. Elige \"Añadir a pantalla de inicio\"",
        it: "📱 Per installare:\n\n1. Tocca il pulsante Condividi (quadrato con freccia)\n2. Scegli \"Aggiungi a Home\"",
        de: "📱 Zum Installieren:\n\n1. Tippe auf die Teilen-Taste (Quadrat mit Pfeil)\n2. Wähle \"Zum Home-Bildschirm\"",
        pt: "📱 Para instalar:\n\n1. Toque no botão Compartilhar (quadrado com seta)\n2. Escolha \"Adicionar à Tela Inicial\"",
        nl: "📱 Om te installeren:\n\n1. Tik op de Deel-knop (vierkant met pijl)\n2. Kies \"Zet op beginscherm\""
      },
      installMobileAndroid: {
        fr: "📱 Pour installer :\n\n1. Ouvre le menu ⋮ de ton navigateur\n2. Choisis \"Installer l'application\" ou \"Ajouter à l'écran d'accueil\"",
        en: "📱 To install:\n\n1. Open your browser menu ⋮\n2. Choose \"Install app\" or \"Add to Home screen\"",
        es: "📱 Para instalar:\n\n1. Abre el menú ⋮ de tu navegador\n2. Elige \"Instalar aplicación\" o \"Añadir a pantalla de inicio\"",
        it: "📱 Per installare:\n\n1. Apri il menu ⋮ del browser\n2. Scegli \"Installa app\" o \"Aggiungi a Home\"",
        de: "📱 Zum Installieren:\n\n1. Öffne das Browsermenü ⋮\n2. Wähle \"App installieren\" oder \"Zum Startbildschirm hinzufügen\"",
        pt: "📱 Para instalar:\n\n1. Abra o menu ⋮ do seu navegador\n2. Escolha \"Instalar aplicativo\" ou \"Adicionar à tela inicial\"",
        nl: "📱 Om te installeren:\n\n1. Open het browsermenu ⋮\n2. Kies \"App installeren\" of \"Toevoegen aan startscherm\""
      },
      installPC: {
        fr: "💻 Pour installer :\n\nClique sur l'icône d'installation dans la barre d'adresse de Chrome (⊕)",
        en: "💻 To install:\n\nClick the install icon in Chrome's address bar (⊕)",
        es: "💻 Para instalar:\n\nHaz clic en el icono de instalación en la barra de direcciones de Chrome (⊕)",
        it: "💻 Per installare:\n\nClicca sull'icona di installazione nella barra degli indirizzi di Chrome (⊕)",
        de: "💻 Zum Installieren:\n\nKlicke auf das Installations-Symbol in der Adressleiste von Chrome (⊕)",
        pt: "💻 Para instalar:\n\nClique no ícone de instalação na barra de endereços do Chrome (⊕)",
        nl: "💻 Om te installeren:\n\nKlik op het installatiepictogram in de adresbalk van Chrome (⊕)"
      }
    }
  },

  // ============================================================================
  // GAME.HTML - PAGE DE JEU
  // ============================================================================
  game: {
    // Main title
    mainTitle: {
      fr: "LES SABOTEURS",
      en: "THE SABOTEURS",
      es: "LOS SABOTEADORES",
      it: "I SABOTATORI",
      de: "DIE SABOTEURE",
      pt: "OS SABOTADORES",
      nl: "DE SABOTEURS"
    },
    
    // Main subtitle
    mainSubtitle: {
      fr: "Jeu de déduction sociale multijoueur",
      en: "Multiplayer social deduction game",
      es: "Juego de deducción social multijugador",
      it: "Gioco di deduzione sociale multiplayer",
      de: "Mehrspieler-Deduktionsspiel",
      pt: "Jogo de dedução social multijogador",
      nl: "Multiplayer sociaal deductiespel"
    },
    
    // Subtitle
    subtitle: {
      fr: "MISSION TEMPS RÉEL",
      en: "REAL-TIME MISSION",
      es: "MISIÓN EN TIEMPO REAL",
      it: "MISSIONE IN TEMPO REALE",
      de: "ECHTZEIT-MISSION",
      pt: "MISSÃO EM TEMPO REAL",
      nl: "REAL-TIME MISSIE"
    },
    
    // Theme titles (translations of theme names)
    themeTitles: {
      default: {
        fr: "INFILTRATION SPATIALE",
        en: "SPACE INFILTRATION",
        es: "INFILTRACIÓN ESPACIAL",
        it: "INFILTRAZIONE SPAZIALE",
        de: "WELTRAUM-INFILTRATION",
        pt: "INFILTRAÇÃO ESPACIAL",
        nl: "RUIMTE INFILTRATIE"
      },
      werewolf: {
        fr: "LA CHASSE AU LOUP",
        en: "THE WOLF HUNT",
        es: "LA CAZA DEL LOBO",
        it: "LA CACCIA AL LUPO",
        de: "DIE WOLFSJAGD",
        pt: "A CAÇA AO LOBO",
        nl: "DE WOLVENJACHT"
      },
      "wizard-academy": {
        fr: "L'ACADÉMIE DES SORCIERS",
        en: "THE WIZARD ACADEMY",
        es: "LA ACADEMIA DE MAGOS",
        it: "L'ACCADEMIA DEI MAGHI",
        de: "DIE ZAUBERER-AKADEMIE",
        pt: "A ACADEMIA DE FEITICEIROS",
        nl: "DE TOVENAARS ACADEMIE"
      },
      "mythic-realms": {
        fr: "ROYAUMES MYTHIQUES",
        en: "MYTHIC REALMS",
        es: "REINOS MÍTICOS",
        it: "REGNI MITICI",
        de: "MYTHISCHE REICHE",
        pt: "REINOS MÍTICOS",
        nl: "MYTHISCHE RIJKEN"
      }
    },
    
    // Audio
    audio: {
      clickToActivate: {
        fr: "CLIQUEZ POUR ACTIVER LE SON",
        en: "CLICK TO ACTIVATE SOUND",
        es: "HAZ CLIC PARA ACTIVAR EL SONIDO",
        it: "CLICCA PER ATTIVARE L'AUDIO",
        de: "KLICKEN SIE, UM DEN TON ZU AKTIVIEREN",
        pt: "CLIQUE PARA ATIVAR O SOM",
        nl: "KLIK OM GELUID TE ACTIVEREN"
      },
      activateAudio: {
        fr: "🎵 ACTIVER L'AUDIO",
        en: "🎵 ACTIVATE AUDIO",
        es: "🎵 ACTIVAR AUDIO",
        it: "🎵 ATTIVA AUDIO",
        de: "🎵 AUDIO AKTIVIEREN",
        pt: "🎵 ATIVAR ÁUDIO",
        nl: "🎵 AUDIO ACTIVEREN"
      }
    },
    
    // Role descriptions (full, shown under role name)
    roleDesc: {
      astronaut: {
        fr: "Aucun pouvoir spécial. Observe, débat et vote pour protéger la station.",
        en: "No special power. Observe, debate and vote to protect the station.",
        es: "Sin poder especial. Observa, debate y vota para proteger la estación.",
        it: "Nessun potere speciale. Osserva, dibatti e vota per proteggere la stazione.",
        de: "Keine besonderen Kräfte. Beobachte, diskutiere und stimme ab, um die Station zu schützen.",
        pt: "Sem poder especial. Observa, debate e vota para proteger a estação.",
        nl: "Geen speciale kracht. Observeer, debatteer en stem om het station te beschermen."
      },
      saboteur: {
        fr: "Chaque nuit, les saboteurs votent UNANIMEMENT une cible (impossible de viser un saboteur).",
        en: "Each night, saboteurs vote UNANIMOUSLY for a target (cannot target a saboteur).",
        es: "Cada noche, los saboteadores votan UNÁNIMEMENTE un objetivo (no pueden apuntar a un saboteador).",
        it: "Ogni notte, i sabotatori votano UNANIMEMENTE un bersaglio (non possono mirare a un sabotatore).",
        de: "Jede Nacht stimmen die Saboteure EINSTIMMIG für ein Ziel (kann keinen Saboteur anvisieren).",
        pt: "Cada noite, os sabotadores votam UNANIMEMENTE um alvo (não podem mirar um sabotador).",
        nl: "Elke nacht stemmen saboteurs UNANIEM op een doelwit (kunnen geen saboteur targeten)."
      },
      doctor: {
        fr: "Une seule fois : potion de vie (sauve la cible attaquée). Une seule fois : potion de mort (tue une cible).",
        en: "Once only: life potion (saves the attacked target). Once only: death potion (kills a target).",
        es: "Solo una vez: poción de vida (salva al objetivo atacado). Solo una vez: poción de muerte (mata un objetivo).",
        it: "Solo una volta: pozione di vita (salva il bersaglio attaccato). Solo una volta: pozione di morte (uccide un bersaglio).",
        de: "Nur einmal: Lebenstrank (rettet das angegriffene Ziel). Nur einmal: Todestrank (tötet ein Ziel).",
        pt: "Apenas uma vez: poção de vida (salva o alvo atacado). Apenas uma vez: poção de morte (mata um alvo).",
        nl: "Eenmalig: levensdrank (redt het aangevallen doelwit). Eenmalig: doodsdrank (doodt een doelwit)."
      },
      security: {
        fr: "Si tu meurs, tu tires une dernière fois (vengeance).",
        en: "If you die, you shoot one last time (revenge).",
        es: "Si mueres, disparas una última vez (venganza).",
        it: "Se muori, spari un'ultima volta (vendetta).",
        de: "Wenn du stirbst, schießt du ein letztes Mal (Rache).",
        pt: "Se você morrer, atira uma última vez (vingança).",
        nl: "Als je sterft, schiet je nog één keer (wraak)."
      },
      ai_agent: {
        fr: "Nuit 1 : choisis un joueur à lier avec TOI. Si l'un meurt, l'autre meurt aussi.",
        en: "Night 1: choose a player to link with YOU. If one dies, the other dies too.",
        es: "Noche 1: elige un jugador para enlazar CONTIGO. Si uno muere, el otro también muere.",
        it: "Notte 1: scegli un giocatore da legare a TE. Se uno muore, anche l'altro muore.",
        de: "Nacht 1: wähle einen Spieler, der mit DIR verbunden wird. Wenn einer stirbt, stirbt auch der andere.",
        pt: "Noite 1: escolha um jogador para ligar com VOCÊ. Se um morrer, o outro também morre.",
        nl: "Nacht 1: kies een speler om te linken met JOU. Als één sterft, sterft de ander ook."
      },
      radar: {
        fr: "Chaque nuit, inspecte un joueur et découvre son rôle.",
        en: "Each night, inspect a player and discover their role.",
        es: "Cada noche, inspecciona a un jugador y descubre su rol.",
        it: "Ogni notte, ispeziona un giocatore e scopri il suo ruolo.",
        de: "Jede Nacht, untersuche einen Spieler und entdecke seine Rolle.",
        pt: "Cada noite, inspecione um jogador e descubra seu papel.",
        nl: "Elke nacht, inspecteer een speler en ontdek hun rol."
      },
      engineer: {
        fr: "Peut espionner à ses risques et périls. Rappel discret en début de nuit tant qu'il est vivant.",
        en: "Can spy at their own risk. Discreet reminder at nightfall while alive.",
        es: "Puede espiar bajo su propio riesgo. Recordatorio discreto al anochecer mientras esté vivo.",
        it: "Può spiare a proprio rischio. Promemoria discreto all'inizio della notte finché è vivo.",
        de: "Kann auf eigenes Risiko spionieren. Dezente Erinnerung bei Einbruch der Nacht, solange er lebt.",
        pt: "Pode espionar por sua conta e risco. Lembrete discreto ao anoitecer enquanto vivo.",
        nl: "Kan spioneren op eigen risico. Discrete herinnering bij het vallen van de nacht zolang in leven."
      },
      chameleon: {
        fr: "Nuit 1 seulement : échange TON rôle avec un joueur. Après l'échange : revérification globale.",
        en: "Night 1 only: swap YOUR role with a player. After swap: global re-verification.",
        es: "Solo Noche 1: intercambia TU rol con un jugador. Después del intercambio: reverificación global.",
        it: "Solo Notte 1: scambia il TUO ruolo con un giocatore. Dopo lo scambio: ri-verifica globale.",
        de: "Nur Nacht 1: tausche DEINE Rolle mit einem Spieler. Nach dem Tausch: globale Neuüberprüfung.",
        pt: "Apenas Noite 1: troque SEU papel com um jogador. Após a troca: reverificação global.",
        nl: "Alleen Nacht 1: wissel JOUW rol met een speler. Na de wissel: globale herverificatie."
      }
    },
    
    // Phase titles
    phases: {
      roleVerification: {
        fr: "VÉRIFICATION DU RÔLE",
        en: "ROLE VERIFICATION",
        es: "VERIFICACIÓN DEL ROL",
        it: "VERIFICA DEL RUOLO",
        de: "ROLLENÜBERPRÜFUNG",
        pt: "VERIFICAÇÃO DO PAPEL",
        nl: "ROLVERIFICATIE"
      },
      captainCandidacy: {
        fr: "CANDIDATURE {captain}",
        en: "{captain} CANDIDACY",
        es: "CANDIDATURA {captain}",
        it: "CANDIDATURA {captain}",
        de: "{captain}-KANDIDATUR",
        pt: "CANDIDATURA {captain}",
        nl: "{captain} KANDIDATUUR"
      },
      captainVote: {
        fr: "VOTE {captain}",
        en: "{captain} VOTE",
        es: "VOTO {captain}",
        it: "VOTO {captain}",
        de: "{captain}-WAHL",
        pt: "VOTO {captain}",
        nl: "{captain} STEMMING"
      },
      nightStart: {
        fr: "NUIT {night} — DÉBUT",
        en: "NIGHT {night} — START",
        es: "NOCHE {night} — INICIO",
        it: "NOTTE {night} — INIZIO",
        de: "NACHT {night} — START",
        pt: "NOITE {night} — INÍCIO",
        nl: "NACHT {night} — START"
      },
      nightRole: {
        fr: "NUIT — {role}",
        en: "NIGHT — {role}",
        es: "NOCHE — {role}",
        it: "NOTTE — {role}",
        de: "NACHT — {role}",
        pt: "NOITE — {role}",
        nl: "NACHT — {role}"
      },
      nightRoleLiaison: {
        fr: "NUIT — {role} (LIAISON)",
        en: "NIGHT — {role} (LINK)",
        es: "NOCHE — {role} (ENLACE)",
        it: "NOTTE — {role} (LEGAME)",
        de: "NACHT — {role} (VERBINDUNG)",
        pt: "NOITE — {role} (LIGAÇÃO)",
        nl: "NACHT — {role} (LINK)"
      },
      nightExchangePrivate: {
        fr: "NUIT — ÉCHANGE {role} (PRIVÉ)",
        en: "NIGHT — {role} EXCHANGE (PRIVATE)",
        es: "NOCHE — INTERCAMBIO {role} (PRIVADO)",
        it: "NOTTE — SCAMBIO {role} (PRIVATO)",
        de: "NACHT — {role} AUSTAUSCH (PRIVAT)",
        pt: "NOITE — TROCA {role} (PRIVADO)",
        nl: "NACHT — {role} UITWISSELING (PRIVÉ)"
      },
      nightSaboteurs: {
        fr: "NUIT — {role} (UNANIMITÉ)",
        en: "NIGHT — {role} (UNANIMITY)",
        es: "NOCHE — {role} (UNANIMIDAD)",
        it: "NOTTE — {role} (UNANIMITÀ)",
        de: "NACHT — {role} (EINSTIMMIGKEIT)",
        pt: "NOITE — {role} (UNANIMIDADE)",
        nl: "NACHT — {role} (UNANIMITEIT)"
      },
      nightResults: {
        fr: "RÉSULTATS NUIT {night}",
        en: "NIGHT {night} RESULTS",
        es: "RESULTADOS NOCHE {night}",
        it: "RISULTATI NOTTE {night}",
        de: "NACHT {night} ERGEBNISSE",
        pt: "RESULTADOS NOITE {night}",
        nl: "NACHT {night} RESULTATEN"
      },
      dayWake: {
        fr: "JOUR {day} — RÉVEIL",
        en: "DAY {day} — WAKE UP",
        es: "DÍA {day} — DESPERTAR",
        it: "GIORNO {day} — RISVEGLIO",
        de: "TAG {day} — AUFWACHEN",
        pt: "DIA {day} — DESPERTAR",
        nl: "DAG {day} — ONTWAKEN"
      },
      dayCaptainTransfer: {
        fr: "JOUR {day} — TRANSMISSION DU {captain}",
        en: "DAY {day} — {captain} TRANSFER",
        es: "DÍA {day} — TRANSFERENCIA DEL {captain}",
        it: "GIORNO {day} — TRASFERIMENTO {captain}",
        de: "TAG {day} — {captain} ÜBERTRAGUNG",
        pt: "DIA {day} — TRANSFERÊNCIA DO {captain}",
        nl: "DAG {day} — {captain} OVERDRACHT"
      },
      dayVote: {
        fr: "JOUR {day} — VOTE D'ÉJECTION",
        en: "DAY {day} — EJECTION VOTE",
        es: "DÍA {day} — VOTO DE EXPULSIÓN",
        it: "GIORNO {day} — VOTO DI ESPULSIONE",
        de: "TAG {day} — ABSTIMMUNG ZUR AUSWEISUNG",
        pt: "DIA {day} — VOTO DE EJEÇÃO",
        nl: "DAG {day} — UITWERPINGSSTEMMING"
      },
      dayTiebreak: {
        fr: "JOUR {day} — DÉPARTAGE ({captain})",
        en: "DAY {day} — TIEBREAK ({captain})",
        es: "DÍA {day} — DESEMPATE ({captain})",
        it: "GIORNO {day} — SPAREGGIO ({captain})",
        de: "TAG {day} — STICHENTSCHEID ({captain})",
        pt: "DIA {day} — DESEMPATE ({captain})",
        nl: "DAG {day} — BESLISSING ({captain})"
      },
      dayResults: {
        fr: "JOUR {day} — RÉSULTATS",
        en: "DAY {day} — RESULTS",
        es: "DÍA {day} — RESULTADOS",
        it: "GIORNO {day} — RISULTATI",
        de: "TAG {day} — ERGEBNISSE",
        pt: "DIA {day} — RESULTADOS",
        nl: "DAG {day} — RESULTATEN"
      },
      revenge: {
        fr: "VENGEANCE — {role}",
        en: "REVENGE — {role}",
        es: "VENGANZA — {role}",
        it: "VENDETTA — {role}",
        de: "RACHE — {role}",
        pt: "VINGANÇA — {role}",
        nl: "WRAAK — {role}"
      },
      gameOver: {
        fr: "FIN DE PARTIE",
        en: "GAME OVER",
        es: "FIN DE PARTIDA",
        it: "FINE PARTITA",
        de: "SPIELENDE",
        pt: "FIM DE JOGO",
        nl: "EINDE SPEL"
      },
      gameAborted: {
        fr: "PARTIE INTERROMPUE",
        en: "GAME ABORTED",
        es: "PARTIDA INTERRUMPIDA",
        it: "PARTITA INTERROTTA",
        de: "SPIEL ABGEBROCHEN",
        pt: "JOGO INTERROMPIDO",
        nl: "SPEL AFGEBROKEN"
      },
      manualRolePick: {
        fr: "CHOIX MANUEL DES RÔLES",
        en: "MANUAL ROLE SELECTION",
        es: "SELECCIÓN MANUAL DE ROLES",
        it: "SELEZIONE MANUALE DEI RUOLI",
        de: "MANUELLE ROLLENWAHL",
        pt: "SELEÇÃO MANUAL DE PAPÉIS",
        nl: "HANDMATIGE ROLSELECTIE"
      }
    },
    
    // Phase descriptions
    phaseDesc: {
      roleReveal: {
        fr: "Regarde ton rôle et valide.",
        en: "Check your role and validate.",
        es: "Mira tu rol y valida.",
        it: "Guarda il tuo ruolo e conferma.",
        de: "Überprüfe deine Rolle und bestätige.",
        pt: "Verifique seu papel e valide.",
        nl: "Bekijk je rol en bevestig."
      },
      rolesChanged: {
        fr: "Les rôles ont pu changer. Revérifiez.",
        en: "Roles may have changed. Please re-check.",
        es: "Los roles pueden haber cambiado. Verifica de nuevo.",
        it: "I ruoli potrebbero essere cambiati. Ricontrolla.",
        de: "Rollen könnten sich geändert haben. Bitte erneut prüfen.",
        pt: "Os papéis podem ter mudado. Verifique novamente.",
        nl: "Rollen kunnen zijn veranderd. Controleer opnieuw."
      },
      captainCandidacy: {
        fr: "Choisis si tu te présentes au poste de capitaine.",
        en: "Choose whether to run for captain.",
        es: "Elige si te presentas al puesto de capitán.",
        it: "Scegli se candidarti a capitano.",
        de: "Entscheide, ob du für Kapitän kandidierst.",
        pt: "Escolha se vai se candidatar a capitão.",
        nl: "Kies of je je kandidaat stelt voor kapitein."
      },
      captainVote: {
        fr: "Vote pour élire le capitaine. En cas d'égalité : revote.",
        en: "Vote to elect the captain. In case of tie: revote.",
        es: "Vota para elegir al capitán. En caso de empate: revota.",
        it: "Vota per eleggere il capitano. In caso di parità: rivota.",
        de: "Stimme für den Kapitän ab. Bei Gleichstand: erneut abstimmen.",
        pt: "Vote para eleger o capitão. Em caso de empate: revote.",
        nl: "Stem om de kapitein te kiezen. Bij gelijkspel: herstemming."
      },
      nightStart: {
        fr: "Tout le monde ferme les yeux… puis valide pour démarrer la nuit.",
        en: "Everyone close your eyes… then validate to start the night.",
        es: "Todos cierran los ojos… luego validen para empezar la noche.",
        it: "Tutti chiudono gli occhi… poi conferma per iniziare la notte.",
        de: "Alle schließen die Augen… dann bestätigen, um die Nacht zu starten.",
        pt: "Todos fechem os olhos… depois validem para começar a noite.",
        nl: "Iedereen sluit de ogen… bevestig dan om de nacht te starten."
      },
      nightChameleon: {
        fr: "Caméléon : choisis un joueur pour échanger les rôles (Nuit 1 uniquement).",
        en: "Chameleon: choose a player to swap roles with (Night 1 only).",
        es: "Camaleón: elige un jugador para intercambiar roles (solo Noche 1).",
        it: "Camaleonte: scegli un giocatore per scambiare i ruoli (solo Notte 1).",
        de: "Chamäleon: wähle einen Spieler zum Rollentausch (nur Nacht 1).",
        pt: "Camaleão: escolha um jogador para trocar papéis (apenas Noite 1).",
        nl: "Kameleon: kies een speler om rollen mee te wisselen (alleen Nacht 1)."
      },
      nightAiAgent: {
        fr: "Agent IA : Nuit 1, choisis un joueur à lier avec TOI (liaison permanente).",
        en: "AI Agent: Night 1, choose a player to link with YOU (permanent link).",
        es: "Agente IA: Noche 1, elige un jugador para enlazar CONTIGO (enlace permanente).",
        it: "Agente IA: Notte 1, scegli un giocatore da legare a TE (legame permanente).",
        de: "KI-Agent: Nacht 1, wähle einen Spieler zum Verbinden mit DIR (dauerhafte Verbindung).",
        pt: "Agente IA: Noite 1, escolha um jogador para ligar com VOCÊ (ligação permanente).",
        nl: "AI Agent: Nacht 1, kies een speler om te linken met JOU (permanente link)."
      },
      nightAiExchange: {
        fr: "Échange privé entre Agent IA et son partenaire lié. Les deux doivent valider pour continuer.",
        en: "Private exchange between AI Agent and linked partner. Both must validate to continue.",
        es: "Intercambio privado entre Agente IA y su compañero enlazado. Ambos deben validar para continuar.",
        it: "Scambio privato tra Agente IA e il partner legato. Entrambi devono confermare per continuare.",
        de: "Privater Austausch zwischen KI-Agent und verbundenem Partner. Beide müssen bestätigen.",
        pt: "Troca privada entre Agente IA e parceiro ligado. Ambos devem validar para continuar.",
        nl: "Privé uitwisseling tussen AI Agent en gelinkte partner. Beiden moeten bevestigen."
      },
      nightRadar: {
        fr: "Officier Radar : inspecte un joueur et découvre son rôle.",
        en: "Radar Officer: inspect a player and discover their role.",
        es: "Oficial de Radar: inspecciona a un jugador y descubre su rol.",
        it: "Ufficiale Radar: ispeziona un giocatore e scopri il suo ruolo.",
        de: "Radaroffizier: untersuche einen Spieler und entdecke seine Rolle.",
        pt: "Oficial de Radar: inspecione um jogador e descubra seu papel.",
        nl: "Radarofficier: inspecteer een speler en ontdek hun rol."
      },
      nightSaboteurs: {
        fr: "Saboteurs : votez UNANIMEMENT une cible.",
        en: "Saboteurs: vote UNANIMOUSLY for a target.",
        es: "Saboteadores: voten UNÁNIMEMENTE un objetivo.",
        it: "Sabotatori: votate UNANIMEMENTE un bersaglio.",
        de: "Saboteure: stimmt EINSTIMMIG für ein Ziel.",
        pt: "Sabotadores: votem UNANIMEMENTE um alvo.",
        nl: "Saboteurs: stem UNANIEM op een doelwit."
      },
      nightDoctor: {
        fr: "Docteur : potion de vie (sauve la cible) OU potion de mort (tue une cible) OU rien.",
        en: "Doctor: life potion (save target) OR death potion (kill a target) OR nothing.",
        es: "Doctor: poción de vida (salva al objetivo) O poción de muerte (mata un objetivo) O nada.",
        it: "Dottore: pozione di vita (salva il bersaglio) O pozione di morte (uccidi un bersaglio) O niente.",
        de: "Arzt: Lebenstrank (Ziel retten) ODER Todestrank (Ziel töten) ODER nichts.",
        pt: "Doutor: poção de vida (salvar alvo) OU poção de morte (matar um alvo) OU nada.",
        nl: "Dokter: levensdrankje (red doelwit) OF doodsdrankje (dood een doelwit) OF niets."
      },
      nightResults: {
        fr: "Annonce des effets de la nuit, puis passage au jour.",
        en: "Announcement of night effects, then move to day.",
        es: "Anuncio de los efectos de la noche, luego paso al día.",
        it: "Annuncio degli effetti della notte, poi passaggio al giorno.",
        de: "Bekanntgabe der Nachteffekte, dann Übergang zum Tag.",
        pt: "Anúncio dos efeitos da noite, depois passagem para o dia.",
        nl: "Aankondiging van nachteffecten, dan overgang naar dag."
      },
      dayWake: {
        fr: "Réveil de la station. Validez pour passer à la suite.",
        en: "Station wake up. Validate to proceed.",
        es: "Despertar de la estación. Validen para continuar.",
        it: "Risveglio della stazione. Conferma per procedere.",
        de: "Station erwacht. Bestätigen, um fortzufahren.",
        pt: "Despertar da estação. Validem para prosseguir.",
        nl: "Station ontwaakt. Bevestig om door te gaan."
      },
      dayCaptainTransfer: {
        fr: "Le capitaine est mort : il transmet le poste à un joueur vivant.",
        en: "The captain is dead: they transfer the position to a living player.",
        es: "El capitán ha muerto: transfiere el puesto a un jugador vivo.",
        it: "Il capitano è morto: trasferisce la posizione a un giocatore vivo.",
        de: "Der Kapitän ist tot: er überträgt die Position an einen lebenden Spieler.",
        pt: "O capitão morreu: ele transfere o posto para um jogador vivo.",
        nl: "De kapitein is dood: hij draagt de positie over aan een levende speler."
      },
      dayVote: {
        fr: "Votez pour éjecter un joueur.",
        en: "Vote to eject a player.",
        es: "Voten para expulsar a un jugador.",
        it: "Votate per espellere un giocatore.",
        de: "Stimmt ab, um einen Spieler auszuweisen.",
        pt: "Votem para ejetar um jogador.",
        nl: "Stem om een speler uit te werpen."
      },
      dayTiebreak: {
        fr: "Égalité : le capitaine choisit l'éjecté.",
        en: "Tie: the captain chooses who to eject.",
        es: "Empate: el capitán elige al expulsado.",
        it: "Parità: il capitano sceglie chi espellere.",
        de: "Gleichstand: der Kapitän wählt, wer ausgewiesen wird.",
        pt: "Empate: o capitão escolhe o ejetado.",
        nl: "Gelijkspel: de kapitein kiest wie wordt uitgeworpen."
      },
      dayResults: {
        fr: "Résultats du jour, puis passage à la nuit.",
        en: "Day results, then move to night.",
        es: "Resultados del día, luego paso a la noche.",
        it: "Risultati del giorno, poi passaggio alla notte.",
        de: "Tagesergebnisse, dann Übergang zur Nacht.",
        pt: "Resultados do dia, depois passagem para a noite.",
        nl: "Dagresultaten, dan overgang naar nacht."
      },
      revenge: {
        fr: "Chef de Sécurité : tu as été éjecté, tu peux tirer sur quelqu'un.",
        en: "Security Chief: you were ejected, you can shoot someone.",
        es: "Jefe de Seguridad: fuiste expulsado, puedes disparar a alguien.",
        it: "Capo della Sicurezza: sei stato espulso, puoi sparare a qualcuno.",
        de: "Sicherheitschef: du wurdest ausgewiesen, du kannst auf jemanden schießen.",
        pt: "Chefe de Segurança: você foi ejetado, pode atirar em alguém.",
        nl: "Beveiligingschef: je bent uitgeworpen, je kunt op iemand schieten."
      },
      manualRolePick: {
        fr: "Mode manuel : chaque joueur choisit son rôle (cartes physiques), puis tout le monde valide.",
        en: "Manual mode: each player picks their role (physical cards), then everyone validates.",
        es: "Modo manual: cada jugador elige su rol (cartas físicas), luego todos validan.",
        it: "Modalità manuale: ogni giocatore sceglie il suo ruolo (carte fisiche), poi tutti confermano.",
        de: "Manueller Modus: jeder Spieler wählt seine Rolle (physische Karten), dann bestätigen alle.",
        pt: "Modo manual: cada jogador escolhe seu papel (cartas físicas), depois todos validam.",
        nl: "Handmatige modus: elke speler kiest hun rol (fysieke kaarten), dan bevestigt iedereen."
      },
      gameAborted: {
        fr: "Partie interrompue.",
        en: "Game aborted.",
        es: "Partida interrumpida.",
        it: "Partita interrotta.",
        de: "Spiel abgebrochen.",
        pt: "Jogo interrompido.",
        nl: "Spel afgebroken."
      }
    },
    
    // UI elements
    ui: {
      validations: {
        fr: "Validations",
        en: "Validations",
        es: "Validaciones",
        it: "Convalide",
        de: "Bestätigungen",
        pt: "Validações",
        nl: "Validaties"
      },
      mission: {
        fr: "MISSION",
        en: "MISSION",
        es: "MISIÓN",
        it: "MISSIONE",
        de: "MISSION",
        pt: "MISSÃO",
        nl: "MISSIE"
      },
      choosePlayerToLink: {
        fr: "Choisir le joueur à lier avec toi",
        en: "Choose the player to link with you",
        es: "Elegir el jugador a enlazar contigo",
        it: "Scegli il giocatore da legare a te",
        de: "Wähle den Spieler zum Verbinden",
        pt: "Escolha o jogador para ligar com você",
        nl: "Kies de speler om te linken met jou"
      },
      captain: {
        fr: "Capitaine",
        en: "Captain",
        es: "Capitán",
        it: "Capitano",
        de: "Kapitän",
        pt: "Capitão",
        nl: "Kapitein"
      },
      acting: {
        fr: "agit...",
        en: "acting...",
        es: "actúa...",
        it: "agisce...",
        de: "handelt...",
        pt: "agindo...",
        nl: "handelt..."
      },
      radar: {
        fr: "Radar",
        en: "Radar",
        es: "Radar",
        it: "Radar",
        de: "Radar",
        pt: "Radar",
        nl: "Radar"
      },
      linkedTo: {
        fr: "Lié à",
        en: "Linked to",
        es: "Enlazado a",
        it: "Legato a",
        de: "Verbunden mit",
        pt: "Ligado a",
        nl: "Gelinkt aan"
      },
      aiExchangeInProgress: {
        fr: "🤖 Échange Agent IA en cours…",
        en: "🤖 AI Agent exchange in progress…",
        es: "🤖 Intercambio Agente IA en curso…",
        it: "🤖 Scambio Agente IA in corso…",
        de: "🤖 KI-Agent Austausch läuft…",
        pt: "🤖 Troca do Agente IA em andamento…",
        nl: "🤖 AI Agent uitwisseling bezig…"
      },
      deciding: {
        fr: "tranche…",
        en: "deciding…",
        es: "decide…",
        it: "decide…",
        de: "entscheidet…",
        pt: "decide…",
        nl: "beslist…"
      },
      captainTransfer: {
        fr: "Transmission du capitaine…",
        en: "Captain transfer…",
        es: "Transferencia del capitán…",
        it: "Trasferimento del capitano…",
        de: "Kapitänsübertragung…",
        pt: "Transferência do capitão…",
        nl: "Kapitein overdracht…"
      },
      revenge: {
        fr: "se venge…",
        en: "takes revenge…",
        es: "se venga…",
        it: "si vendica…",
        de: "rächt sich…",
        pt: "se vinga…",
        nl: "neemt wraak…"
      },
      actionInProgress: {
        fr: "⏳ Action en cours…",
        en: "⏳ Action in progress…",
        es: "⏳ Acción en curso…",
        it: "⏳ Azione in corso…",
        de: "⏳ Aktion läuft…",
        pt: "⏳ Ação em andamento…",
        nl: "⏳ Actie bezig…"
      },
      isElectedCaptain: {
        fr: "est élu Capitaine !",
        en: "is elected Captain!",
        es: "es elegido Capitán!",
        it: "è eletto Capitano!",
        de: "ist zum Kapitän gewählt!",
        pt: "é eleito Capitão!",
        nl: "is gekozen als Kapitein!"
      },
      playerEliminated: {
        fr: "{name} a été éliminé !",
        en: "{name} has been eliminated!",
        es: "¡{name} ha sido eliminado!",
        it: "{name} è stato eliminato!",
        de: "{name} wurde eliminiert!",
        pt: "{name} foi eliminado!",
        nl: "{name} is geëlimineerd!"
      },
      playersEliminated: {
        fr: "{names} ont été éliminés !",
        en: "{names} have been eliminated!",
        es: "¡{names} han sido eliminados!",
        it: "{names} sono stati eliminati!",
        de: "{names} wurden eliminiert!",
        pt: "{names} foram eliminados!",
        nl: "{names} zijn geëlimineerd!"
      },
      choosingPartner: {
        fr: "choisit son partenaire...",
        en: "choosing partner...",
        es: "eligiendo compañero...",
        it: "sceglie il partner...",
        de: "wählt Partner...",
        pt: "escolhendo parceiro...",
        nl: "kiest partner..."
      },
      pleaseWait: {
        fr: "Veuillez patienter...",
        en: "Please wait...",
        es: "Por favor espere...",
        it: "Attendere prego...",
        de: "Bitte warten...",
        pt: "Por favor aguarde...",
        nl: "Even geduld..."
      },
      micDisabled: {
        fr: "🎤 Micro désactivé",
        en: "🎤 Mic disabled",
        es: "🎤 Micrófono desactivado",
        it: "🎤 Microfono disattivato",
        de: "🎤 Mikrofon deaktiviert",
        pt: "🎤 Microfone desativado",
        nl: "🎤 Microfoon uitgeschakeld"
      },
      cameraDisabled: {
        fr: "📹 Caméra désactivée",
        en: "📹 Camera disabled",
        es: "📹 Cámara desactivada",
        it: "📹 Fotocamera disattivata",
        de: "📹 Kamera deaktiviert",
        pt: "📹 Câmera desativada",
        nl: "📹 Camera uitgeschakeld"
      },
      saboteursCommunicate: {
        fr: "Les saboteurs communiquent...",
        en: "Saboteurs communicating...",
        es: "Los saboteadores se comunican...",
        it: "I sabotatori comunicano...",
        de: "Saboteure kommunizieren...",
        pt: "Sabotadores comunicando...",
        nl: "Saboteurs communiceren..."
      },
      radar: {
        fr: "Radar",
        en: "Radar",
        es: "Radar",
        it: "Radar",
        de: "Radar",
        pt: "Radar",
        nl: "Radar"
      },
      missionLabel: {
        fr: "MISSION",
        en: "MISSION",
        es: "MISIÓN",
        it: "MISSIONE",
        de: "MISSION",
        pt: "MISSÃO",
        nl: "MISSIE"
      },
      eliminated: {
        fr: "ÉLIMINÉS",
        en: "ELIMINATED",
        es: "ELIMINADOS",
        it: "ELIMINATI",
        de: "ELIMINIERT",
        pt: "ELIMINADOS",
        nl: "GEËLIMINEERD"
      }
    },
    
    // Buttons
    buttons: {
      validate: {
        fr: "VALIDER",
        en: "VALIDATE",
        es: "VALIDAR",
        it: "CONFERMA",
        de: "BESTÄTIGEN",
        pt: "VALIDAR",
        nl: "BEVESTIGEN"
      },
      validated: {
        fr: "VALIDÉ",
        en: "VALIDATED",
        es: "VALIDADO",
        it: "CONFERMATO",
        de: "BESTÄTIGT",
        pt: "VALIDADO",
        nl: "BEVESTIGD"
      },
      link: {
        fr: "Lier",
        en: "Link",
        es: "Enlazar",
        it: "Lega",
        de: "Verbinden",
        pt: "Ligar",
        nl: "Linken"
      },
      dontLink: {
        fr: "Ne pas lier (optionnel)",
        en: "Don't link (optional)",
        es: "No enlazar (opcional)",
        it: "Non legare (opzionale)",
        de: "Nicht verbinden (optional)",
        pt: "Não ligar (opcional)",
        nl: "Niet linken (optioneel)"
      },
      validateExchange: {
        fr: "VALIDER L'ÉCHANGE",
        en: "VALIDATE EXCHANGE",
        es: "VALIDAR INTERCAMBIO",
        it: "CONFERMA SCAMBIO",
        de: "AUSTAUSCH BESTÄTIGEN",
        pt: "VALIDAR TROCA",
        nl: "UITWISSELING BEVESTIGEN"
      },
      runForCaptain: {
        fr: "JE ME PRÉSENTE",
        en: "I'M RUNNING",
        es: "ME PRESENTO",
        it: "MI CANDIDO",
        de: "ICH KANDIDIERE",
        pt: "EU ME CANDIDATO",
        nl: "IK STEL ME KANDIDAAT"
      },
      dontRunForCaptain: {
        fr: "JE NE ME PRÉSENTE PAS",
        en: "I'M NOT RUNNING",
        es: "NO ME PRESENTO",
        it: "NON MI CANDIDO",
        de: "ICH KANDIDIERE NICHT",
        pt: "NÃO ME CANDIDATO",
        nl: "IK STEL ME NIET KANDIDAAT"
      }
    },
    
    // Errors
    errors: {
      choosePlayerToLink: {
        fr: "Choisis un joueur à lier.",
        en: "Choose a player to link.",
        es: "Elige un jugador a enlazar.",
        it: "Scegli un giocatore da legare.",
        de: "Wähle einen Spieler zum Verbinden.",
        pt: "Escolha um jogador para ligar.",
        nl: "Kies een speler om te linken."
      }
    },
    
    // Hints
    hints: {
      youAreDead: {
        fr: "💀 Vous êtes mort. Vous n'agissez plus.",
        en: "💀 You are dead. You no longer act.",
        es: "💀 Estás muerto. Ya no actúas.",
        it: "💀 Sei morto. Non agisci più.",
        de: "💀 Du bist tot. Du handelst nicht mehr.",
        pt: "💀 Você está morto. Você não age mais.",
        nl: "💀 Je bent dood. Je handelt niet meer."
      },
      chameleonHint: {
        fr: "Caméléon : Nuit 1 uniquement. Un seul usage dans toute la partie.",
        en: "Chameleon: Night 1 only. Single use in entire game.",
        es: "Camaleón: Solo Noche 1. Un solo uso en toda la partida.",
        it: "Camaleonte: Solo Notte 1. Un solo uso in tutta la partita.",
        de: "Chamäleon: Nur Nacht 1. Einmalige Verwendung im gesamten Spiel.",
        pt: "Camaleão: Apenas Noite 1. Um único uso em todo o jogo.",
        nl: "Kameleon: Alleen Nacht 1. Eenmalig gebruik in hele spel."
      },
      aiAgentHint: {
        fr: "Nuit 1 uniquement. La liaison est entre toi (Agent IA) et le joueur choisi.",
        en: "Night 1 only. The link is between you (AI Agent) and the chosen player.",
        es: "Solo Noche 1. El enlace es entre tú (Agente IA) y el jugador elegido.",
        it: "Solo Notte 1. Il legame è tra te (Agente IA) e il giocatore scelto.",
        de: "Nur Nacht 1. Die Verbindung ist zwischen dir (KI-Agent) und dem gewählten Spieler.",
        pt: "Apenas Noite 1. A ligação é entre você (Agente IA) e o jogador escolhido.",
        nl: "Alleen Nacht 1. De link is tussen jou (AI Agent) en de gekozen speler."
      },
      radarHint: {
        fr: "Choisis un joueur à inspecter. Ensuite, lis le résultat puis valide.",
        en: "Choose a player to inspect. Then read the result and validate.",
        es: "Elige un jugador a inspeccionar. Luego lee el resultado y valida.",
        it: "Scegli un giocatore da ispezionare. Poi leggi il risultato e conferma.",
        de: "Wähle einen Spieler zum Untersuchen. Dann lies das Ergebnis und bestätige.",
        pt: "Escolha um jogador para inspecionar. Depois leia o resultado e valide.",
        nl: "Kies een speler om te inspecteren. Lees dan het resultaat en bevestig."
      },
      readResultThenValidate: {
        fr: "Lis le résultat puis valide pour continuer.",
        en: "Read the result then validate to continue.",
        es: "Lee el resultado y valida para continuar.",
        it: "Leggi il risultato poi conferma per continuare.",
        de: "Lies das Ergebnis dann bestätige um fortzufahren.",
        pt: "Leia o resultado e valide para continuar.",
        nl: "Lees het resultaat en bevestig om door te gaan."
      },
      saboteursHint: {
        fr: "Vote UNANIME entre saboteurs. Impossible de viser un saboteur (ni toi-même).",
        en: "UNANIMOUS vote among saboteurs. Cannot target a saboteur (or yourself).",
        es: "Voto UNÁNIME entre saboteadores. No puedes apuntar a un saboteador (ni a ti mismo).",
        it: "Voto UNANIME tra sabotatori. Non puoi mirare a un sabotatore (né a te stesso).",
        de: "EINSTIMMIGE Abstimmung unter Saboteuren. Kann keinen Saboteur (oder dich selbst) anvisieren.",
        pt: "Voto UNÂNIME entre sabotadores. Não pode mirar em um sabotador (nem em você).",
        nl: "UNANIEME stemming onder saboteurs. Kan geen saboteur (of jezelf) targeten."
      },
      doctorHint: {
        fr: "La potion de vie protège automatiquement la cible des saboteurs (s'il y en a une).",
        en: "The life potion automatically protects the target from saboteurs (if there is one).",
        es: "La poción de vida protege automáticamente al objetivo de los saboteadores (si hay uno).",
        it: "La pozione di vita protegge automaticamente il bersaglio dai sabotatori (se ce n'è uno).",
        de: "Der Lebenstrank schützt das Ziel automatisch vor Saboteuren (falls vorhanden).",
        pt: "A poção de vida protege automaticamente o alvo dos sabotadores (se houver um).",
        nl: "Het levensdrankje beschermt automatisch het doelwit tegen saboteurs (indien aanwezig)."
      },
      captainTransferHint: {
        fr: "Le capitaine mort choisit sans connaître le rôle du joueur choisi.",
        en: "The dead captain chooses without knowing the chosen player's role.",
        es: "El capitán muerto elige sin conocer el rol del jugador elegido.",
        it: "Il capitano morto sceglie senza conoscere il ruolo del giocatore scelto.",
        de: "Der tote Kapitän wählt, ohne die Rolle des gewählten Spielers zu kennen.",
        pt: "O capitão morto escolhe sem conhecer o papel do jogador escolhido.",
        nl: "De dode kapitein kiest zonder de rol van de gekozen speler te kennen."
      },
      tiebreakHint: {
        fr: "En cas d'égalité, le capitaine tranche avant toute conséquence.",
        en: "In case of tie, the captain decides before any consequences.",
        es: "En caso de empate, el capitán decide antes de cualquier consecuencia.",
        it: "In caso di parità, il capitano decide prima di qualsiasi conseguenza.",
        de: "Bei Gleichstand entscheidet der Kapitän vor jeglichen Konsequenzen.",
        pt: "Em caso de empate, o capitão decide antes de qualquer consequência.",
        nl: "Bij gelijkspel beslist de kapitein voor enige gevolgen."
      }
    },
    
    // Lobby
    lobby: {
      title: {
        fr: "SALLE D'ATTENTE",
        en: "WAITING ROOM",
        es: "SALA DE ESPERA",
        it: "SALA D'ATTESA",
        de: "WARTERAUM",
        pt: "SALA DE ESPERA",
        nl: "WACHTKAMER"
      },
      gameCode: {
        fr: "Code de la partie",
        en: "Game code",
        es: "Código de partida",
        it: "Codice partita",
        de: "Spielcode",
        pt: "Código do jogo",
        nl: "Spelcode"
      },
      missionCode: {
        fr: "CODE MISSION",
        en: "MISSION CODE",
        es: "CÓDIGO DE MISIÓN",
        it: "CODICE MISSIONE",
        de: "MISSIONSCODE",
        pt: "CÓDIGO DA MISSÃO",
        nl: "MISSIECODE"
      },
      copyCode: {
        fr: "Copier",
        en: "Copy",
        es: "Copiar",
        it: "Copia",
        de: "Kopieren",
        pt: "Copiar",
        nl: "Kopiëren"
      },
      codeCopied: {
        fr: "Code copié !",
        en: "Code copied!",
        es: "¡Código copiado!",
        it: "Codice copiato!",
        de: "Code kopiert!",
        pt: "Código copiado!",
        nl: "Code gekopieerd!"
      },
      players: {
        fr: "Joueurs",
        en: "Players",
        es: "Jugadores",
        it: "Giocatori",
        de: "Spieler",
        pt: "Jogadores",
        nl: "Spelers"
      },
      crewMembers: {
        fr: "MEMBRES D'ÉQUIPAGE",
        en: "CREW MEMBERS",
        es: "MIEMBROS DE LA TRIPULACIÓN",
        it: "MEMBRI DELL'EQUIPAGGIO",
        de: "CREW-MITGLIEDER",
        pt: "MEMBROS DA TRIPULAÇÃO",
        nl: "BEMANNINGSLEDEN"
      },
      ready: {
        fr: "PRÊT",
        en: "READY",
        es: "LISTO",
        it: "PRONTO",
        de: "BEREIT",
        pt: "PRONTO",
        nl: "KLAAR"
      },
      notReady: {
        fr: "PAS PRÊT",
        en: "NOT READY",
        es: "NO LISTO",
        it: "NON PRONTO",
        de: "NICHT BEREIT",
        pt: "NÃO PRONTO",
        nl: "NIET KLAAR"
      },
      startGame: {
        fr: "🚀 LANCER LA PARTIE",
        en: "🚀 START GAME",
        es: "🚀 INICIAR PARTIDA",
        it: "🚀 INIZIA PARTITA",
        de: "🚀 SPIEL STARTEN",
        pt: "🚀 INICIAR JOGO",
        nl: "🚀 SPEL STARTEN"
      },
      launchMission: {
        fr: "🚀 Lancer Mission",
        en: "🚀 Launch Mission",
        es: "🚀 Iniciar Misión",
        it: "🚀 Avvia Missione",
        de: "🚀 Mission starten",
        pt: "🚀 Iniciar Missão",
        nl: "🚀 Missie starten"
      },
      waitingForPlayers: {
        fr: "En attente de joueurs...",
        en: "Waiting for players...",
        es: "Esperando jugadores...",
        it: "In attesa di giocatori...",
        de: "Warte auf Spieler...",
        pt: "Aguardando jogadores...",
        nl: "Wachten op spelers..."
      },
      minPlayers: {
        fr: "Minimum 5 joueurs requis",
        en: "Minimum 5 players required",
        es: "Se requieren mínimo 5 jugadores",
        it: "Minimo 5 giocatori richiesti",
        de: "Mindestens 5 Spieler erforderlich",
        pt: "Mínimo de 5 jogadores necessário",
        nl: "Minimaal 5 spelers vereist"
      },
      leaveGame: {
        fr: "Quitter",
        en: "Leave",
        es: "Salir",
        it: "Esci",
        de: "Verlassen",
        pt: "Sair",
        nl: "Verlaten"
      },
      host: {
        fr: "Hôte",
        en: "Host",
        es: "Anfitrión",
        it: "Host",
        de: "Gastgeber",
        pt: "Anfitrião",
        nl: "Gastheer"
      },
      connectedCrew: {
        fr: "ÉQUIPAGE CONNECTÉ",
        en: "CONNECTED CREW",
        es: "TRIPULACIÓN CONECTADA",
        it: "EQUIPAGGIO CONNESSO",
        de: "VERBUNDENE CREW",
        pt: "TRIPULAÇÃO CONECTADA",
        nl: "VERBONDEN CREW"
      },
      mission: {
        fr: "MISSION",
        en: "MISSION",
        es: "MISIÓN",
        it: "MISSIONE",
        de: "MISSION",
        pt: "MISSÃO",
        nl: "MISSIE"
      },
      missionBalanced: {
        fr: "MISSION ÉQUILIBRÉE",
        en: "MISSION BALANCED",
        es: "MISIÓN EQUILIBRADA",
        it: "MISSIONE BILANCIATA",
        de: "MISSION AUSBALANCIERT",
        pt: "MISSÃO EQUILIBRADA",
        nl: "MISSIE GEBALANCEERD"
      },
      distribution: {
        fr: "Répartition",
        en: "Distribution",
        es: "Distribución",
        it: "Distribuzione",
        de: "Verteilung",
        pt: "Distribuição",
        nl: "Verdeling"
      },
      connectedPlayers: {
        fr: "ÉQUIPAGE CONNECTÉ",
        en: "CONNECTED CREW",
        es: "TRIPULACIÓN CONECTADA",
        it: "EQUIPAGGIO CONNESSO",
        de: "VERBUNDENE CREW",
        pt: "TRIPULAÇÃO CONECTADA",
        nl: "VERBONDEN BEMANNING"
      },
      createMission: {
        fr: "CRÉER UNE MISSION",
        en: "CREATE A MISSION",
        es: "CREAR UNA MISIÓN",
        it: "CREA UNA MISSIONE",
        de: "MISSION ERSTELLEN",
        pt: "CRIAR UMA MISSÃO",
        nl: "MAAK EEN MISSIE"
      },
      joinMission: {
        fr: "REJOINDRE UNE MISSION",
        en: "JOIN A MISSION",
        es: "UNIRSE A UNA MISIÓN",
        it: "UNISCITI A UNA MISSIONE",
        de: "MISSION BEITRETEN",
        pt: "ENTRAR EM UMA MISSÃO",
        nl: "NEEM DEEL AAN EEN MISSIE"
      }
    },
    
    // Config
    config: {
      rolesConfig: {
        fr: "CONFIG RÔLES (HÔTE)",
        en: "ROLES CONFIG (HOST)",
        es: "CONFIG. ROLES (ANFITRIÓN)",
        it: "CONFIG. RUOLI (HOST)",
        de: "ROLLEN-KONFIG (GASTGEBER)",
        pt: "CONFIG. PAPÉIS (ANFITRIÃO)",
        nl: "ROLLEN CONFIG (GASTHEER)"
      },
      themeHost: {
        fr: "🎨 THÈME (HÔTE)",
        en: "🎨 THEME (HOST)",
        es: "🎨 TEMA (ANFITRIÓN)",
        it: "🎨 TEMA (HOST)",
        de: "🎨 THEMA (GASTGEBER)",
        pt: "🎨 TEMA (ANFITRIÃO)",
        nl: "🎨 THEMA (GASTHEER)"
      },
      videoOptions: {
        fr: "📹 OPTIONS VIDÉO (HÔTE)",
        en: "📹 VIDEO OPTIONS (HOST)",
        es: "📹 OPCIONES DE VÍDEO (ANFITRIÓN)",
        it: "📹 OPZIONI VIDEO (HOST)",
        de: "📹 VIDEO-OPTIONEN (GASTGEBER)",
        pt: "📹 OPÇÕES DE VÍDEO (ANFITRIÃO)",
        nl: "📹 VIDEO-OPTIES (GASTHEER)"
      },
      disableVideo: {
        fr: "Désactiver la vidéo pour cette partie",
        en: "Disable video for this game",
        es: "Desactivar el vídeo para esta partida",
        it: "Disattiva il video per questa partita",
        de: "Video für dieses Spiel deaktivieren",
        pt: "Desativar vídeo para este jogo",
        nl: "Video uitschakelen voor dit spel"
      },
      videoDescription: {
        fr: "Ce mode est idéal pour des parties avec cartes, sans maître du jeu. L'application remplacera ce dernier. L'hôte peut cocher le mode manuel dans la configuration des rôles, pour que chaque joueur renseigne sa carte de rôle reçue.",
        en: "This mode is ideal for card games without a game master. The app will replace them. The host can check manual mode in the roles configuration so each player enters their received role card.",
        es: "Este modo es ideal para partidas con cartas, sin director de juego. La aplicación lo reemplazará. El anfitrión puede marcar el modo manual en la configuración de roles para que cada jugador ingrese su carta de rol recibida.",
        it: "Questa modalità è ideale per partite con carte, senza master. L'app lo sostituirà. L'host può selezionare la modalità manuale nella configurazione dei ruoli per far inserire a ogni giocatore la propria carta ruolo.",
        de: "Dieser Modus ist ideal für Kartenspiele ohne Spielleiter. Die App ersetzt ihn. Der Gastgeber kann den manuellen Modus in der Rollenkonfiguration aktivieren, damit jeder Spieler seine erhaltene Rollenkarte eingibt.",
        pt: "Este modo é ideal para jogos com cartas, sem mestre de jogo. O aplicativo o substituirá. O anfitrião pode marcar o modo manual na configuração de papéis para que cada jogador insira sua carta de papel recebida.",
        nl: "Deze modus is ideaal voor kaartspellen zonder spelleider. De app vervangt hen. De gastheer kan de handmatige modus aanvinken in de rollenconfiguratie zodat elke speler zijn ontvangen rolkaart invoert."
      },
      noSpecialRoles: {
        fr: "Aucun rôle spécial activé",
        en: "No special roles enabled",
        es: "Sin roles especiales activados",
        it: "Nessun ruolo speciale attivato",
        de: "Keine Spezialrollen aktiviert",
        pt: "Nenhum papel especial ativado",
        nl: "Geen speciale rollen geactiveerd"
      },
      manualMode: {
        fr: "Mode manuel (cartes physiques)",
        en: "Manual mode (physical cards)",
        es: "Modo manual (cartas físicas)",
        it: "Modalità manuale (carte fisiche)",
        de: "Manueller Modus (physische Karten)",
        pt: "Modo manual (cartas físicas)",
        nl: "Handmatige modus (fysieke kaarten)"
      }
    },
    
    // Rôles (générique - les thèmes override)
    roles: {
      crewmate: {
        fr: "Équipier",
        en: "Crewmate",
        es: "Tripulante",
        it: "Membro dell'equipaggio",
        de: "Crewmitglied",
        pt: "Tripulante",
        nl: "Bemanningslid"
      },
      saboteur: {
        fr: "Saboteur",
        en: "Saboteur",
        es: "Saboteador",
        it: "Sabotatore",
        de: "Saboteur",
        pt: "Sabotador",
        nl: "Saboteur"
      },
      captain: {
        fr: "Capitaine",
        en: "Captain",
        es: "Capitán",
        it: "Capitano",
        de: "Kapitän",
        pt: "Capitão",
        nl: "Kapitein"
      },
      doctor: {
        fr: "Médecin",
        en: "Doctor",
        es: "Médico",
        it: "Medico",
        de: "Arzt",
        pt: "Médico",
        nl: "Dokter"
      },
      radar: {
        fr: "Officier Radar",
        en: "Radar Officer",
        es: "Oficial de Radar",
        it: "Ufficiale Radar",
        de: "Radaroffizier",
        pt: "Oficial de Radar",
        nl: "Radarofficier"
      },
      security: {
        fr: "Chef Sécurité",
        en: "Security Chief",
        es: "Jefe de Seguridad",
        it: "Capo della Sicurezza",
        de: "Sicherheitschef",
        pt: "Chefe de Segurança",
        nl: "Beveiligingschef"
      }
    },
    
    // Descriptions courtes des rôles (pour la config)
    roleDescriptions: {
      doctor: {
        fr: "Une potion de vie, une potion de mort.",
        en: "One life potion, one death potion.",
        es: "Una poción de vida, una poción de muerte.",
        it: "Una pozione vita, una pozione morte.",
        de: "Ein Lebenstrank, ein Todestrank.",
        pt: "Uma poção de vida, uma poção de morte.",
        nl: "Eén levensdrank, één doodsdrank."
      },
      security: {
        fr: "Vengeance si tué.",
        en: "Revenge if killed.",
        es: "Venganza si es asesinado.",
        it: "Vendetta se ucciso.",
        de: "Rache wenn getötet.",
        pt: "Vingança se morto.",
        nl: "Wraak als gedood."
      },
      radar: {
        fr: "Peut révéler un rôle.",
        en: "Can reveal a role.",
        es: "Puede revelar un rol.",
        it: "Può rivelare un ruolo.",
        de: "Kann eine Rolle aufdecken.",
        pt: "Pode revelar um papel.",
        nl: "Kan een rol onthullen."
      },
      ai_agent: {
        fr: "Se lie à un joueur.",
        en: "Links to a player.",
        es: "Se vincula a un jugador.",
        it: "Si collega a un giocatore.",
        de: "Verbindet sich mit einem Spieler.",
        pt: "Liga-se a um jogador.",
        nl: "Verbindt met een speler."
      },
      engineer: {
        fr: "Regarde discrètement lors des votes.",
        en: "Watches discreetly during votes.",
        es: "Observa discretamente durante los votos.",
        it: "Osserva discretamente durante i voti.",
        de: "Beobachtet diskret während der Abstimmungen.",
        pt: "Observa discretamente durante os votos.",
        nl: "Kijkt discreet tijdens stemmingen."
      },
      chameleon: {
        fr: "Échange son rôle avec 1 joueur.",
        en: "Swaps role with 1 player.",
        es: "Intercambia su rol con 1 jugador.",
        it: "Scambia il ruolo con 1 giocatore.",
        de: "Tauscht Rolle mit 1 Spieler.",
        pt: "Troca papel com 1 jogador.",
        nl: "Wisselt rol met 1 speler."
      }
    },
    
    // Actions
    actions: {
      vote: {
        fr: "Voter",
        en: "Vote",
        es: "Votar",
        it: "Vota",
        de: "Abstimmen",
        pt: "Votar",
        nl: "Stemmen"
      },
      skip: {
        fr: "Passer",
        en: "Skip",
        es: "Pasar",
        it: "Salta",
        de: "Überspringen",
        pt: "Pular",
        nl: "Overslaan"
      },
      inspect: {
        fr: "Inspecter",
        en: "Inspect",
        es: "Inspeccionar",
        it: "Ispeziona",
        de: "Untersuchen",
        pt: "Inspecionar",
        nl: "Inspecteren"
      },
      confirm: {
        fr: "Confirmer",
        en: "Confirm",
        es: "Confirmar",
        it: "Conferma",
        de: "Bestätigen",
        pt: "Confirmar",
        nl: "Bevestigen"
      },
      cancel: {
        fr: "Annuler",
        en: "Cancel",
        es: "Cancelar",
        it: "Annulla",
        de: "Abbrechen",
        pt: "Cancelar",
        nl: "Annuleren"
      },
      selectTarget: {
        fr: "Sélectionner une cible",
        en: "Select a target",
        es: "Seleccionar un objetivo",
        it: "Seleziona un obiettivo",
        de: "Ziel auswählen",
        pt: "Selecionar um alvo",
        nl: "Selecteer een doelwit"
      },
      chooseRole: {
        fr: "Choisis ton rôle (mode cartes physiques). Ton choix vaut validation.",
        en: "Choose your role (physical cards mode). Your choice is final.",
        es: "Elige tu rol (modo cartas físicas). Tu elección es definitiva.",
        it: "Scegli il tuo ruolo (modalità carte fisiche). La tua scelta è definitiva.",
        de: "Wähle deine Rolle (physische Karten-Modus). Deine Wahl ist endgültig.",
        pt: "Escolha seu papel (modo cartas físicas). Sua escolha é definitiva.",
        nl: "Kies je rol (fysieke kaarten modus). Je keuze is definitief."
      },
      choosePlayer: {
        fr: "Choisis un joueur",
        en: "Choose a player",
        es: "Elige un jugador",
        it: "Scegli un giocatore",
        de: "Wähle einen Spieler",
        pt: "Escolha um jogador",
        nl: "Kies een speler"
      },
      choosePlayerToLink: {
        fr: "Choisis un joueur à lier.",
        en: "Choose a player to link.",
        es: "Elige un jugador para vincular.",
        it: "Scegli un giocatore da collegare.",
        de: "Wähle einen Spieler zum Verbinden.",
        pt: "Escolha um jogador para vincular.",
        nl: "Kies een speler om te koppelen."
      },
      chooseTargetToKill: {
        fr: "Choisis une cible à tuer.",
        en: "Choose a target to kill.",
        es: "Elige un objetivo para matar.",
        it: "Scegli un bersaglio da uccidere.",
        de: "Wähle ein Ziel zum Töten.",
        pt: "Escolha um alvo para matar.",
        nl: "Kies een doelwit om te doden."
      },
      choosePlayerToInspect: {
        fr: "Choisis un joueur à inspecter. Ensuite, lis le résultat puis valide.",
        en: "Choose a player to inspect. Then read the result and confirm.",
        es: "Elige un jugador para inspeccionar. Luego lee el resultado y confirma.",
        it: "Scegli un giocatore da ispezionare. Poi leggi il risultato e conferma.",
        de: "Wähle einen Spieler zur Inspektion. Lies dann das Ergebnis und bestätige.",
        pt: "Escolha um jogador para inspecionar. Depois leia o resultado e confirme.",
        nl: "Kies een speler om te inspecteren. Lees dan het resultaat en bevestig."
      },
      doctorAction: {
        fr: "Action du docteur :",
        en: "Doctor's action:",
        es: "Acción del médico:",
        it: "Azione del dottore:",
        de: "Aktion des Arztes:",
        pt: "Ação do médico:",
        nl: "Actie van de dokter:"
      },
      actionNotRegistered: {
        fr: "Action non prise en compte (connexion instable?). Réessaie.",
        en: "Action not registered (unstable connection?). Try again.",
        es: "Acción no registrada (¿conexión inestable?). Inténtalo de nuevo.",
        it: "Azione non registrata (connessione instabile?). Riprova.",
        de: "Aktion nicht registriert (instabile Verbindung?). Versuche es erneut.",
        pt: "Ação não registrada (conexão instável?). Tente novamente.",
        nl: "Actie niet geregistreerd (instabiele verbinding?). Probeer opnieuw."
      },
      swap: {
        fr: "Échanger",
        en: "Swap",
        es: "Intercambiar",
        it: "Scambia",
        de: "Tauschen",
        pt: "Trocar",
        nl: "Wisselen"
      }
    },
    
    // Messages de jeu
    messages: {
      youAre: {
        fr: "Tu es",
        en: "You are",
        es: "Eres",
        it: "Sei",
        de: "Du bist",
        pt: "Você é",
        nl: "Je bent"
      },
      yourMission: {
        fr: "Ta mission",
        en: "Your mission",
        es: "Tu misión",
        it: "La tua missione",
        de: "Deine Mission",
        pt: "Sua missão",
        nl: "Je missie"
      },
      eliminated: {
        fr: "a été éliminé",
        en: "has been eliminated",
        es: "ha sido eliminado",
        it: "è stato eliminato",
        de: "wurde eliminiert",
        pt: "foi eliminado",
        nl: "is geëlimineerd"
      },
      playerEliminated: {
        fr: "Le joueur {name} ({role}) a été éliminé.",
        en: "Player {name} ({role}) has been eliminated.",
        es: "El jugador {name} ({role}) ha sido eliminado.",
        it: "Il giocatore {name} ({role}) è stato eliminato.",
        de: "Spieler {name} ({role}) wurde eliminiert.",
        pt: "O jogador {name} ({role}) foi eliminado.",
        nl: "Speler {name} ({role}) is geëlimineerd."
      },
      noElimination: {
        fr: "Personne n'a été éliminé",
        en: "No one was eliminated",
        es: "Nadie fue eliminado",
        it: "Nessuno è stato eliminato",
        de: "Niemand wurde eliminiert",
        pt: "Ninguém foi eliminado",
        nl: "Niemand is geëlimineerd"
      },
      victory: {
        fr: "VICTOIRE",
        en: "VICTORY",
        es: "VICTORIA",
        it: "VITTORIA",
        de: "SIEG",
        pt: "VITÓRIA",
        nl: "OVERWINNING"
      },
      defeat: {
        fr: "DÉFAITE",
        en: "DEFEAT",
        es: "DERROTA",
        it: "SCONFITTA",
        de: "NIEDERLAGE",
        pt: "DERROTA",
        nl: "NEDERLAAG"
      },
      crewmatesWin: {
        fr: "Les Équipiers ont gagné !",
        en: "The Crewmates won!",
        es: "¡Los Tripulantes ganaron!",
        it: "L'equipaggio ha vinto!",
        de: "Die Crew hat gewonnen!",
        pt: "Os Tripulantes venceram!",
        nl: "De bemanning heeft gewonnen!"
      },
      saboteursWin: {
        fr: "Les Saboteurs ont gagné !",
        en: "The Saboteurs won!",
        es: "¡Los Saboteadores ganaron!",
        it: "I Sabotatori hanno vinto!",
        de: "Die Saboteure haben gewonnen!",
        pt: "Os Sabotadores venceram!",
        nl: "De saboteurs hebben gewonnen!"
      },
      waitingForOthers: {
        fr: "En attente des autres joueurs...",
        en: "Waiting for other players...",
        es: "Esperando a otros jugadores...",
        it: "In attesa degli altri giocatori...",
        de: "Warte auf andere Spieler...",
        pt: "Aguardando outros jogadores...",
        nl: "Wachten op andere spelers..."
      },
      youAreDead: {
        fr: "Tu es mort",
        en: "You are dead",
        es: "Estás muerto",
        it: "Sei morto",
        de: "Du bist tot",
        pt: "Você está morto",
        nl: "Je bent dood"
      },
      youHaveBeenEliminated: {
        fr: "💀 Vous avez été éliminé",
        en: "💀 You have been eliminated",
        es: "💀 Has sido eliminado",
        it: "💀 Sei stato eliminato",
        de: "💀 Du wurdest eliminiert",
        pt: "💀 Você foi eliminado",
        nl: "💀 Je bent geëlimineerd"
      },
      youAreDeadNoAction: {
        fr: "💀 Vous êtes mort. Vous n'agissez plus.",
        en: "💀 You are dead. You can no longer act.",
        es: "💀 Estás muerto. Ya no puedes actuar.",
        it: "💀 Sei morto. Non puoi più agire.",
        de: "💀 Du bist tot. Du kannst nicht mehr handeln.",
        pt: "💀 Você está morto. Não pode mais agir.",
        nl: "💀 Je bent dood. Je kunt niet meer handelen."
      },
      spectating: {
        fr: "Mode spectateur",
        en: "Spectator mode",
        es: "Modo espectador",
        it: "Modalità spettatore",
        de: "Zuschauermodus",
        pt: "Modo espectador",
        nl: "Toeschouwermodus"
      },
      gameInterrupted: {
        fr: "Partie interrompue — pas assez de joueurs",
        en: "Game interrupted — not enough players",
        es: "Partida interrumpida — no hay suficientes jugadores",
        it: "Partita interrotta — non abbastanza giocatori",
        de: "Spiel unterbrochen — nicht genug Spieler",
        pt: "Jogo interrompido — jogadores insuficientes",
        nl: "Spel onderbroken — niet genoeg spelers"
      },
      gameAborted: {
        fr: "Partie interrompue.",
        en: "Game interrupted.",
        es: "Partida interrumpida.",
        it: "Partita interrotta.",
        de: "Spiel unterbrochen.",
        pt: "Jogo interrompido.",
        nl: "Spel onderbroken."
      },
      voteToEject: {
        fr: "Votez pour éjecter un joueur.",
        en: "Vote to eject a player.",
        es: "Vota para expulsar a un jugador.",
        it: "Vota per espellere un giocatore.",
        de: "Stimme ab, um einen Spieler auszuwerfen.",
        pt: "Vote para ejetar um jogador.",
        nl: "Stem om een speler te verwijderen."
      },
      radarResult: {
        fr: "🔎 Radar",
        en: "🔎 Radar",
        es: "🔎 Radar",
        it: "🔎 Radar",
        de: "🔎 Radar",
        pt: "🔎 Radar",
        nl: "🔎 Radar"
      },
      saboteurVotes: {
        fr: "🗳️ Votes des saboteurs",
        en: "🗳️ Saboteurs' votes",
        es: "🗳️ Votos de los saboteadores",
        it: "🗳️ Voti dei sabotatori",
        de: "🗳️ Stimmen der Saboteure",
        pt: "🗳️ Votos dos sabotadores",
        nl: "🗳️ Stemmen van de saboteurs"
      }
    },
    
    // Chat
    chat: {
      placeholder: {
        fr: "Écris ton message...",
        en: "Write your message...",
        es: "Escribe tu mensaje...",
        it: "Scrivi il tuo messaggio...",
        de: "Schreibe deine Nachricht...",
        pt: "Escreva sua mensagem...",
        nl: "Schrijf je bericht..."
      },
      send: {
        fr: "Envoyer",
        en: "Send",
        es: "Enviar",
        it: "Invia",
        de: "Senden",
        pt: "Enviar",
        nl: "Verzenden"
      },
      title: {
        fr: "Chat",
        en: "Chat",
        es: "Chat",
        it: "Chat",
        de: "Chat",
        pt: "Chat",
        nl: "Chat"
      }
    },
    
    // Vidéo
    video: {
      visioDiscussion: {
        fr: "📹 VISIO (discussion)",
        en: "📹 VIDEO (discussion)",
        es: "📹 VIDEO (discusión)",
        it: "📹 VIDEO (discussione)",
        de: "📹 VIDEO (Diskussion)",
        pt: "📹 VÍDEO (discussão)",
        nl: "📹 VIDEO (discussie)"
      },
      openWindow: {
        fr: "Ouvrir en fenêtre",
        en: "Open in window",
        es: "Abrir en ventana",
        it: "Apri in finestra",
        de: "In Fenster öffnen",
        pt: "Abrir em janela",
        nl: "Openen in venster"
      },
      hideVideo: {
        fr: "Masquer la visio",
        en: "Hide video",
        es: "Ocultar video",
        it: "Nascondi video",
        de: "Video ausblenden",
        pt: "Ocultar vídeo",
        nl: "Video verbergen"
      }
    },
    
    // Contrôles hôte
    hostControls: {
      title: {
        fr: "⚡ CONTRÔLES HÔTE",
        en: "⚡ HOST CONTROLS",
        es: "⚡ CONTROLES DEL ANFITRIÓN",
        it: "⚡ CONTROLLI HOST",
        de: "⚡ GASTGEBER-STEUERUNG",
        pt: "⚡ CONTROLES DO ANFITRIÃO",
        nl: "⚡ GASTHEER BESTURING"
      },
      phaseActiveSince: {
        fr: "Phase active depuis :",
        en: "Phase active since:",
        es: "Fase activa desde:",
        it: "Fase attiva da:",
        de: "Phase aktiv seit:",
        pt: "Fase ativa desde:",
        nl: "Fase actief sinds:"
      },
      forceAdvance: {
        fr: "⏭️ Forcer la suite (20s min)",
        en: "⏭️ Force advance (20s min)",
        es: "⏭️ Forzar avance (20s mín)",
        it: "⏭️ Forza avanzamento (20s min)",
        de: "⏭️ Weiter erzwingen (20s min)",
        pt: "⏭️ Forçar avanço (20s mín)",
        nl: "⏭️ Doorgaan forceren (20s min)"
      }
    },
    
    // Boutons
    buttons: {
      // Boutons de contrôle de jeu
      validate: {
        fr: "VALIDER",
        en: "VALIDATE",
        es: "VALIDAR",
        it: "CONFERMA",
        de: "BESTÄTIGEN",
        pt: "VALIDAR",
        nl: "BEVESTIGEN"
      },
      validated: {
        fr: "VALIDÉ",
        en: "VALIDATED",
        es: "VALIDADO",
        it: "CONFERMATO",
        de: "BESTÄTIGT",
        pt: "VALIDADO",
        nl: "BEVESTIGD"
      },
      link: {
        fr: "Lier",
        en: "Link",
        es: "Enlazar",
        it: "Lega",
        de: "Verbinden",
        pt: "Ligar",
        nl: "Linken"
      },
      dontLink: {
        fr: "Ne pas lier (optionnel)",
        en: "Don't link (optional)",
        es: "No enlazar (opcional)",
        it: "Non legare (opzionale)",
        de: "Nicht verbinden (optional)",
        pt: "Não ligar (opcional)",
        nl: "Niet linken (optioneel)"
      },
      validateExchange: {
        fr: "VALIDER L'ÉCHANGE",
        en: "VALIDATE EXCHANGE",
        es: "VALIDAR INTERCAMBIO",
        it: "CONFERMA SCAMBIO",
        de: "AUSTAUSCH BESTÄTIGEN",
        pt: "VALIDAR TROCA",
        nl: "UITWISSELING BEVESTIGEN"
      },
      runForCaptain: {
        fr: "JE ME PRÉSENTE",
        en: "I'M RUNNING",
        es: "ME PRESENTO",
        it: "MI CANDIDO",
        de: "ICH KANDIDIERE",
        pt: "EU ME CANDIDATO",
        nl: "IK STEL ME KANDIDAAT"
      },
      dontRunForCaptain: {
        fr: "JE NE ME PRÉSENTE PAS",
        en: "I'M NOT RUNNING",
        es: "NO ME PRESENTO",
        it: "NON MI CANDIDO",
        de: "ICH KANDIDIERE NICHT",
        pt: "NÃO ME CANDIDATO",
        nl: "IK STEL ME NIET KANDIDAAT"
      },
      // Boutons de navigation
      rules: {
        fr: "📜 RÈGLES",
        en: "📜 RULES",
        es: "📜 REGLAS",
        it: "📜 REGOLE",
        de: "📜 REGELN",
        pt: "📜 REGRAS",
        nl: "📜 REGELS"
      },
      mute: {
        fr: "🔇 MUET",
        en: "🔇 MUTE",
        es: "🔇 SILENCIO",
        it: "🔇 MUTO",
        de: "🔇 STUMM",
        pt: "🔇 MUDO",
        nl: "🔇 DEMPEN"
      },
      unmute: {
        fr: "🔊 SON",
        en: "🔊 SOUND",
        es: "🔊 SONIDO",
        it: "🔊 SUONO",
        de: "🔊 TON",
        pt: "🔊 SOM",
        nl: "🔊 GELUID"
      },
      leave: {
        fr: "🚪 QUITTER",
        en: "🚪 LEAVE",
        es: "🚪 SALIR",
        it: "🚪 ESCI",
        de: "🚪 VERLASSEN",
        pt: "🚪 SAIR",
        nl: "🚪 VERLATEN"
      },
      playAgain: {
        fr: "🔄 REJOUER",
        en: "🔄 PLAY AGAIN",
        es: "🔄 JUGAR DE NUEVO",
        it: "🔄 GIOCA ANCORA",
        de: "🔄 NOCHMAL SPIELEN",
        pt: "🔄 JOGAR NOVAMENTE",
        nl: "🔄 OPNIEUW SPELEN"
      },
      backToLobby: {
        fr: "🏠 RETOUR AU LOBBY",
        en: "🏠 BACK TO LOBBY",
        es: "🏠 VOLVER AL LOBBY",
        it: "🏠 TORNA ALLA LOBBY",
        de: "🏠 ZURÜCK ZUR LOBBY",
        pt: "🏠 VOLTAR AO LOBBY",
        nl: "🏠 TERUG NAAR LOBBY"
      },
      replayKeepStats: {
        fr: "🔁 Rejouer dans cette chambre (garder les stats)",
        en: "🔁 Replay in this room (keep stats)",
        es: "🔁 Volver a jugar en esta sala (mantener stats)",
        it: "🔁 Rigioca in questa stanza (mantieni statistiche)",
        de: "🔁 In diesem Raum erneut spielen (Statistiken behalten)",
        pt: "🔁 Jogar novamente nesta sala (manter stats)",
        nl: "🔁 Opnieuw spelen in deze kamer (statistieken behouden)"
      },
      newGameResetStats: {
        fr: "🆕 Nouvelle partie (réinitialiser les stats)",
        en: "🆕 New game (reset stats)",
        es: "🆕 Nueva partida (reiniciar stats)",
        it: "🆕 Nuova partita (reset statistiche)",
        de: "🆕 Neues Spiel (Statistiken zurücksetzen)",
        pt: "🆕 Novo jogo (resetar stats)",
        nl: "🆕 Nieuw spel (statistieken resetten)"
      },
      viewTutorial: {
        fr: "📖 Voir le tutoriel rapide",
        en: "📖 View quick tutorial",
        es: "📖 Ver tutorial rápido",
        it: "📖 Vedi tutorial rapido",
        de: "📖 Kurzes Tutorial ansehen",
        pt: "📖 Ver tutorial rápido",
        nl: "📖 Snelle tutorial bekijken"
      }
    },
    
    // Fin de partie
    endGame: {
      badgesUnlocked: {
        fr: "🏆 BADGES DÉBLOQUÉS",
        en: "🏆 BADGES UNLOCKED",
        es: "🏆 INSIGNIAS DESBLOQUEADAS",
        it: "🏆 BADGE SBLOCCATI",
        de: "🏆 ABZEICHEN FREIGESCHALTET",
        pt: "🏆 MEDALHAS DESBLOQUEADAS",
        nl: "🏆 BADGES ONTGRENDELD"
      },
      statsPersistedByName: {
        fr: "Stats persistées par NOM (serveur).",
        en: "Stats persisted by NAME (server).",
        es: "Stats guardadas por NOMBRE (servidor).",
        it: "Statistiche salvate per NOME (server).",
        de: "Statistiken gespeichert nach NAME (Server).",
        pt: "Stats persistidas por NOME (servidor).",
        nl: "Stats opgeslagen op NAAM (server)."
      },
      victoryOf: {
        fr: "⚔️ VICTOIRE DES",
        en: "⚔️ VICTORY OF THE",
        es: "⚔️ VICTORIA DE LOS",
        it: "⚔️ VITTORIA DEI",
        de: "⚔️ SIEG DER",
        pt: "⚔️ VITÓRIA DOS",
        nl: "⚔️ OVERWINNING VAN DE"
      },
      associationOfCriminals: {
        fr: "🤝 ASSOCIATION DE MALFAITEURS",
        en: "🤝 CRIMINAL ASSOCIATION",
        es: "🤝 ASOCIACIÓN DE MALHECHORES",
        it: "🤝 ASSOCIAZIONE CRIMINALE",
        de: "🤝 VERBRECHERVEREINIGUNG",
        pt: "🤝 ASSOCIAÇÃO CRIMINOSA",
        nl: "🤝 CRIMINELE VERENIGING"
      }
    },
    
    // Invité
    guest: {
      banner: {
        fr: "🎮 Mode Invité - Crée un compte pour la vidéo et sauvegarder ta progression !",
        en: "🎮 Guest Mode - Create an account for video and to save your progress!",
        es: "🎮 Modo Invitado - ¡Crea una cuenta para vídeo y guardar tu progreso!",
        it: "🎮 Modalità Ospite - Crea un account per video e salvare i tuoi progressi!",
        de: "🎮 Gastmodus - Erstelle ein Konto für Video und um deinen Fortschritt zu speichern!",
        pt: "🎮 Modo Convidado - Crie uma conta para vídeo e salvar seu progresso!",
        nl: "🎮 Gastmodus - Maak een account aan voor video en om je voortgang op te slaan!"
      },
      createAccount: {
        fr: "Créer un compte",
        en: "Create account",
        es: "Crear cuenta",
        it: "Crea account",
        de: "Konto erstellen",
        pt: "Criar conta",
        nl: "Account aanmaken"
      }
    }
  },

  // ============================================================================
  // RÈGLES DU JEU (MODAL)
  // ============================================================================
  rules: {
    rolesTitle: {
      fr: "Rôles",
      en: "Roles",
      es: "Roles",
      it: "Ruoli",
      de: "Rollen",
      pt: "Papéis",
      nl: "Rollen"
    },
    astronautDesc: {
      fr: "aucun pouvoir.",
      en: "no power.",
      es: "sin poder.",
      it: "nessun potere.",
      de: "keine Fähigkeit.",
      pt: "sem poder.",
      nl: "geen kracht."
    },
    saboteurDesc: {
      fr: "vote unanimement une cible la nuit.",
      en: "unanimously votes a target at night.",
      es: "vota unánimemente un objetivo por la noche.",
      it: "vota unanimemente un bersaglio di notte.",
      de: "stimmt nachts einstimmig für ein Ziel.",
      pt: "vota unanimemente um alvo à noite.",
      nl: "stemt 's nachts unaniem voor een doelwit."
    },
    radarDesc: {
      fr: "inspecte un joueur et découvre son rôle.",
      en: "inspects a player and discovers their role.",
      es: "inspecciona a un jugador y descubre su rol.",
      it: "ispeziona un giocatore e scopre il suo ruolo.",
      de: "inspiziert einen Spieler und entdeckt seine Rolle.",
      pt: "inspeciona um jogador e descobre seu papel.",
      nl: "inspecteert een speler en ontdekt zijn rol."
    },
    doctorDesc: {
      fr: "1 potion de vie (sauve la cible des saboteurs) et 1 potion de mort (éjecte une cible) sur toute la partie.",
      en: "1 life potion (saves the target from saboteurs) and 1 death potion (ejects a target) for the whole game.",
      es: "1 poción de vida (salva al objetivo de los saboteadores) y 1 poción de muerte (expulsa a un objetivo) durante toda la partida.",
      it: "1 pozione vita (salva il bersaglio dai sabotatori) e 1 pozione morte (espelle un bersaglio) per tutta la partita.",
      de: "1 Lebenstrank (rettet das Ziel vor Saboteuren) und 1 Todestrank (wirft ein Ziel raus) für das ganze Spiel.",
      pt: "1 poção de vida (salva o alvo dos sabotadores) e 1 poção de morte (ejeta um alvo) durante todo o jogo.",
      nl: "1 levensdrank (redt het doelwit van saboteurs) en 1 doodsdrank (verwijdert een doelwit) voor het hele spel."
    },
    chameleonDesc: {
      fr: "Nuit 1 : échange son rôle avec un joueur (1 seule fois). Ensuite, tout le monde revérifie son rôle.",
      en: "Night 1: swaps their role with a player (once only). Then everyone rechecks their role.",
      es: "Noche 1: intercambia su rol con un jugador (solo una vez). Luego todos revisan su rol.",
      it: "Notte 1: scambia il suo ruolo con un giocatore (una sola volta). Poi tutti ricontrollano il loro ruolo.",
      de: "Nacht 1: tauscht seine Rolle mit einem Spieler (nur einmal). Dann überprüft jeder seine Rolle erneut.",
      pt: "Noite 1: troca seu papel com um jogador (apenas uma vez). Depois todos verificam seu papel novamente.",
      nl: "Nacht 1: wisselt zijn rol met een speler (slechts één keer). Daarna controleert iedereen zijn rol opnieuw."
    },
    securityDesc: {
      fr: "si éjecté, tire une dernière fois (vengeance).",
      en: "if ejected, shoots one last time (revenge).",
      es: "si es expulsado, dispara una última vez (venganza).",
      it: "se espulso, spara un'ultima volta (vendetta).",
      de: "wenn rausgeworfen, schießt ein letztes Mal (Rache).",
      pt: "se ejetado, atira uma última vez (vingança).",
      nl: "indien verwijderd, schiet nog één keer (wraak)."
    },
    aiAgentDesc: {
      fr: "Nuit 1 : lie 2 joueurs. Si l'un est éjecté, l'autre l'est aussi.",
      en: "Night 1: links 2 players. If one is ejected, the other is too.",
      es: "Noche 1: vincula 2 jugadores. Si uno es expulsado, el otro también.",
      it: "Notte 1: collega 2 giocatori. Se uno viene espulso, anche l'altro.",
      de: "Nacht 1: verbindet 2 Spieler. Wenn einer rausgeworfen wird, der andere auch.",
      pt: "Noite 1: vincula 2 jogadores. Se um for ejetado, o outro também.",
      nl: "Nacht 1: koppelt 2 spelers. Als één wordt verwijderd, de ander ook."
    },
    captainTitle: {
      fr: "Chef de station",
      en: "Station Chief",
      es: "Jefe de estación",
      it: "Capo stazione",
      de: "Stationschef",
      pt: "Chefe de estação",
      nl: "Stationschef"
    },
    captainElectionRequired: {
      fr: "Élection obligatoire",
      en: "Mandatory election",
      es: "Elección obligatoria",
      it: "Elezione obbligatoria",
      de: "Pflichtwahl",
      pt: "Eleição obrigatória",
      nl: "Verplichte verkiezing"
    },
    atStartOfMission: {
      fr: "au début de la mission.",
      en: "at the start of the mission.",
      es: "al inicio de la misión.",
      it: "all'inizio della missione.",
      de: "zu Beginn der Mission.",
      pt: "no início da missão.",
      nl: "aan het begin van de missie."
    },
    captainTiebreaker: {
      fr: "En cas d'égalité au vote du jour, le chef de station <b>tranche</b> (sa voix compte double pour départager).",
      en: "In case of a tie in the day vote, the station chief <b>decides</b> (their vote counts double to break ties).",
      es: "En caso de empate en la votación del día, el jefe de estación <b>decide</b> (su voto cuenta doble para desempatar).",
      it: "In caso di pareggio nel voto diurno, il capo stazione <b>decide</b> (il suo voto conta doppio per spareggiare).",
      de: "Bei Stimmengleichheit in der Tagesabstimmung <b>entscheidet</b> der Stationschef (seine Stimme zählt doppelt).",
      pt: "Em caso de empate na votação do dia, o chefe de estação <b>decide</b> (seu voto conta em dobro para desempatar).",
      nl: "Bij gelijkspel in de dagstemming <b>beslist</b> de stationschef (zijn stem telt dubbel om te beslissen)."
    },
    captainTransfer: {
      fr: "Dès que le chef de station est éjecté, il <b>transmet</b> le rôle à un survivant <b>sans connaître son rôle</b>.",
      en: "As soon as the station chief is ejected, they <b>transfer</b> the role to a survivor <b>without knowing their role</b>.",
      es: "En cuanto el jefe de estación es expulsado, <b>transfiere</b> el rol a un sobreviviente <b>sin conocer su rol</b>.",
      it: "Non appena il capo stazione viene espulso, <b>trasferisce</b> il ruolo a un sopravvissuto <b>senza conoscere il suo ruolo</b>.",
      de: "Sobald der Stationschef rausgeworfen wird, <b>überträgt</b> er die Rolle an einen Überlebenden <b>ohne dessen Rolle zu kennen</b>.",
      pt: "Assim que o chefe de estação é ejetado, ele <b>transfere</b> o papel para um sobrevivente <b>sem conhecer seu papel</b>.",
      nl: "Zodra de stationschef wordt verwijderd, <b>draagt</b> hij de rol over aan een overlevende <b>zonder diens rol te kennen</b>."
    },
    nightOrderTitle: {
      fr: "Ordre de nuit",
      en: "Night order",
      es: "Orden nocturno",
      it: "Ordine notturno",
      de: "Nachtordnung",
      pt: "Ordem noturna",
      nl: "Nachtvolgorde"
    },
    nightN1: {
      fr: "(Nuit 1)",
      en: "(Night 1)",
      es: "(Noche 1)",
      it: "(Notte 1)",
      de: "(Nacht 1)",
      pt: "(Noite 1)",
      nl: "(Nacht 1)"
    },
    unanimity: {
      fr: "(unanimité)",
      en: "(unanimity)",
      es: "(unanimidad)",
      it: "(unanimità)",
      de: "(Einstimmigkeit)",
      pt: "(unanimidade)",
      nl: "(unanimiteit)"
    },
    resolutionVengeanceLink: {
      fr: "Résolution + vengeance + liaison",
      en: "Resolution + revenge + link",
      es: "Resolución + venganza + vínculo",
      it: "Risoluzione + vendetta + collegamento",
      de: "Auflösung + Rache + Verbindung",
      pt: "Resolução + vingança + vínculo",
      nl: "Resolutie + wraak + koppeling"
    },
    victoryTitle: {
      fr: "Victoire",
      en: "Victory",
      es: "Victoria",
      it: "Vittoria",
      de: "Sieg",
      pt: "Vitória",
      nl: "Overwinning"
    },
    astronautsWinCondition: {
      fr: "tous les saboteurs sont éjectés.",
      en: "all saboteurs are ejected.",
      es: "todos los saboteadores son expulsados.",
      it: "tutti i sabotatori sono espulsi.",
      de: "alle Saboteure sind rausgeworfen.",
      pt: "todos os sabotadores são ejetados.",
      nl: "alle saboteurs zijn verwijderd."
    },
    saboteursWinCondition: {
      fr: "supériorité numérique (parité ou plus).",
      en: "numerical superiority (parity or more).",
      es: "superioridad numérica (paridad o más).",
      it: "superiorità numerica (parità o più).",
      de: "numerische Überlegenheit (Gleichstand oder mehr).",
      pt: "superioridade numérica (paridade ou mais).",
      nl: "numerieke superioriteit (gelijkspel of meer)."
    },
    associationTitle: {
      fr: "Association de malfaiteurs",
      en: "Criminal Association",
      es: "Asociación criminal",
      it: "Associazione criminale",
      de: "Verbrechervereinigung",
      pt: "Associação criminosa",
      nl: "Criminele vereniging"
    },
    associationWinCondition: {
      fr: "s'il ne reste que 2 joueurs vivants, liés ensemble, et de camps différents, ils gagnent ensemble.",
      en: "if only 2 players remain alive, linked together, and from different camps, they win together.",
      es: "si solo quedan 2 jugadores vivos, vinculados, y de diferentes bandos, ganan juntos.",
      it: "se rimangono solo 2 giocatori vivi, collegati, e di campi diversi, vincono insieme.",
      de: "wenn nur noch 2 Spieler leben, verbunden sind, und aus verschiedenen Lagern kommen, gewinnen sie zusammen.",
      pt: "se apenas 2 jogadores permanecerem vivos, vinculados, e de campos diferentes, eles ganham juntos.",
      nl: "als slechts 2 spelers overblijven, gekoppeld zijn, en van verschillende kampen zijn, winnen ze samen."
    },
    saboteurCountTitle: {
      fr: "Nombre de saboteurs",
      en: "Number of saboteurs",
      es: "Número de saboteadores",
      it: "Numero di sabotatori",
      de: "Anzahl der Saboteure",
      pt: "Número de sabotadores",
      nl: "Aantal saboteurs"
    },
    saboteurCountAuto: {
      fr: "Le nombre de saboteurs est automatique :",
      en: "The number of saboteurs is automatic:",
      es: "El número de saboteadores es automático:",
      it: "Il numero di sabotatori è automatico:",
      de: "Die Anzahl der Saboteure ist automatisch:",
      pt: "O número de sabotadores é automático:",
      nl: "Het aantal saboteurs is automatisch:"
    },
    players06: {
      fr: "0–6 joueurs",
      en: "0–6 players",
      es: "0–6 jugadores",
      it: "0–6 giocatori",
      de: "0–6 Spieler",
      pt: "0–6 jogadores",
      nl: "0–6 spelers"
    },
    players711: {
      fr: "7–11 joueurs",
      en: "7–11 players",
      es: "7–11 jugadores",
      it: "7–11 giocatori",
      de: "7–11 Spieler",
      pt: "7–11 jogadores",
      nl: "7–11 spelers"
    },
    players12plus: {
      fr: "12+ joueurs",
      en: "12+ players",
      es: "12+ jugadores",
      it: "12+ giocatori",
      de: "12+ Spieler",
      pt: "12+ jogadores",
      nl: "12+ spelers"
    },
    oneSaboteur: {
      fr: "1 saboteur",
      en: "1 saboteur",
      es: "1 saboteador",
      it: "1 sabotatore",
      de: "1 Saboteur",
      pt: "1 sabotador",
      nl: "1 saboteur"
    },
    twoSaboteurs: {
      fr: "2 saboteurs",
      en: "2 saboteurs",
      es: "2 saboteadores",
      it: "2 sabotatori",
      de: "2 Saboteure",
      pt: "2 sabotadores",
      nl: "2 saboteurs"
    },
    threeSaboteurs: {
      fr: "3 saboteurs",
      en: "3 saboteurs",
      es: "3 saboteadores",
      it: "3 sabotatori",
      de: "3 Saboteure",
      pt: "3 sabotadores",
      nl: "3 saboteurs"
    }
  },

  // ============================================================================
  // TUTORIEL
  // ============================================================================
  tutorial: {
    welcome: {
      fr: "Bienvenue !",
      en: "Welcome!",
      es: "¡Bienvenido!",
      it: "Benvenuto!",
      de: "Willkommen!",
      pt: "Bem-vindo!",
      nl: "Welkom!"
    },
    gameDescription: {
      fr: "<strong>Les Saboteurs</strong> est un jeu de déduction sociale où des <span style=\"color: var(--neon-red);\">saboteurs</span> tentent d'éliminer les <span style=\"color: var(--neon-cyan);\">astronautes</span> sans être découverts.",
      en: "<strong>The Saboteurs</strong> is a social deduction game where <span style=\"color: var(--neon-red);\">saboteurs</span> try to eliminate the <span style=\"color: var(--neon-cyan);\">astronauts</span> without being discovered.",
      es: "<strong>Los Saboteadores</strong> es un juego de deducción social donde los <span style=\"color: var(--neon-red);\">saboteadores</span> intentan eliminar a los <span style=\"color: var(--neon-cyan);\">astronautas</span> sin ser descubiertos.",
      it: "<strong>I Sabotatori</strong> è un gioco di deduzione sociale dove i <span style=\"color: var(--neon-red);\">sabotatori</span> cercano di eliminare gli <span style=\"color: var(--neon-cyan);\">astronauti</span> senza essere scoperti.",
      de: "<strong>Die Saboteure</strong> ist ein soziales Deduktionsspiel, bei dem <span style=\"color: var(--neon-red);\">Saboteure</span> versuchen, die <span style=\"color: var(--neon-cyan);\">Astronauten</span> zu eliminieren, ohne entdeckt zu werden.",
      pt: "<strong>Os Sabotadores</strong> é um jogo de dedução social onde os <span style=\"color: var(--neon-red);\">sabotadores</span> tentam eliminar os <span style=\"color: var(--neon-cyan);\">astronautas</span> sem serem descobertos.",
      nl: "<strong>De Saboteurs</strong> is een sociaal deductiespel waar <span style=\"color: var(--neon-red);\">saboteurs</span> proberen de <span style=\"color: var(--neon-cyan);\">astronauten</span> te elimineren zonder ontdekt te worden."
    },
    phaseAlternation: {
      fr: "Le jeu alterne entre <strong>phases de nuit</strong> (actions secrètes) et <strong>phases de jour</strong> (discussions et votes).",
      en: "The game alternates between <strong>night phases</strong> (secret actions) and <strong>day phases</strong> (discussions and votes).",
      es: "El juego alterna entre <strong>fases de noche</strong> (acciones secretas) y <strong>fases de día</strong> (discusiones y votos).",
      it: "Il gioco alterna tra <strong>fasi notturne</strong> (azioni segrete) e <strong>fasi diurne</strong> (discussioni e voti).",
      de: "Das Spiel wechselt zwischen <strong>Nachtphasen</strong> (geheime Aktionen) und <strong>Tagphasen</strong> (Diskussionen und Abstimmungen).",
      pt: "O jogo alterna entre <strong>fases de noite</strong> (ações secretas) e <strong>fases de dia</strong> (discussões e votos).",
      nl: "Het spel wisselt af tussen <strong>nachtfasen</strong> (geheime acties) en <strong>dagfasen</strong> (discussies en stemmingen)."
    },
    nightPhase: {
      fr: "Phase de nuit",
      en: "Night phase",
      es: "Fase de noche",
      it: "Fase notturna",
      de: "Nachtphase",
      pt: "Fase de noite",
      nl: "Nachtfase"
    },
    nightSaboteurs: {
      fr: "<strong style=\"color: var(--neon-red);\">Saboteurs</strong> : choisissent une victime (unanimité requise)",
      en: "<strong style=\"color: var(--neon-red);\">Saboteurs</strong>: choose a victim (unanimity required)",
      es: "<strong style=\"color: var(--neon-red);\">Saboteadores</strong>: eligen una víctima (se requiere unanimidad)",
      it: "<strong style=\"color: var(--neon-red);\">Sabotatori</strong>: scelgono una vittima (unanimità richiesta)",
      de: "<strong style=\"color: var(--neon-red);\">Saboteure</strong>: wählen ein Opfer (Einstimmigkeit erforderlich)",
      pt: "<strong style=\"color: var(--neon-red);\">Sabotadores</strong>: escolhem uma vítima (unanimidade necessária)",
      nl: "<strong style=\"color: var(--neon-red);\">Saboteurs</strong>: kiezen een slachtoffer (unanimiteit vereist)"
    },
    nightRadar: {
      fr: "<strong style=\"color: var(--neon-cyan);\">Officier Radar</strong> : inspecte un joueur (saboteur ou non ?)",
      en: "<strong style=\"color: var(--neon-cyan);\">Radar Officer</strong>: inspects a player (saboteur or not?)",
      es: "<strong style=\"color: var(--neon-cyan);\">Oficial de Radar</strong>: inspecciona a un jugador (¿saboteador o no?)",
      it: "<strong style=\"color: var(--neon-cyan);\">Ufficiale Radar</strong>: ispeziona un giocatore (sabotatore o no?)",
      de: "<strong style=\"color: var(--neon-cyan);\">Radaroffizier</strong>: inspiziert einen Spieler (Saboteur oder nicht?)",
      pt: "<strong style=\"color: var(--neon-cyan);\">Oficial de Radar</strong>: inspeciona um jogador (sabotador ou não?)",
      nl: "<strong style=\"color: var(--neon-cyan);\">Radarofficier</strong>: inspecteert een speler (saboteur of niet?)"
    },
    nightDoctor: {
      fr: "<strong style=\"color: var(--neon-green);\">Docteur Bio</strong> : peut sauver OU tuer (1 vie + 1 mort max)",
      en: "<strong style=\"color: var(--neon-green);\">Bio Doctor</strong>: can save OR kill (1 life + 1 death max)",
      es: "<strong style=\"color: var(--neon-green);\">Doctor Bio</strong>: puede salvar O matar (1 vida + 1 muerte máx)",
      it: "<strong style=\"color: var(--neon-green);\">Dottore Bio</strong>: può salvare O uccidere (1 vita + 1 morte max)",
      de: "<strong style=\"color: var(--neon-green);\">Bio-Arzt</strong>: kann retten ODER töten (max 1 Leben + 1 Tod)",
      pt: "<strong style=\"color: var(--neon-green);\">Doutor Bio</strong>: pode salvar OU matar (1 vida + 1 morte máx)",
      nl: "<strong style=\"color: var(--neon-green);\">Bio Dokter</strong>: kan redden OF doden (max 1 leven + 1 dood)"
    },
    nightSpecial: {
      fr: "<strong style=\"color: var(--neon-orange);\">Rôles spéciaux</strong> : Caméléon, Agent IA, etc.",
      en: "<strong style=\"color: var(--neon-orange);\">Special roles</strong>: Chameleon, AI Agent, etc.",
      es: "<strong style=\"color: var(--neon-orange);\">Roles especiales</strong>: Camaleón, Agente IA, etc.",
      it: "<strong style=\"color: var(--neon-orange);\">Ruoli speciali</strong>: Camaleonte, Agente IA, ecc.",
      de: "<strong style=\"color: var(--neon-orange);\">Spezialrollen</strong>: Chamäleon, KI-Agent, usw.",
      pt: "<strong style=\"color: var(--neon-orange);\">Papéis especiais</strong>: Camaleão, Agente IA, etc.",
      nl: "<strong style=\"color: var(--neon-orange);\">Speciale rollen</strong>: Kameleon, AI-agent, enz."
    },
    // Actions séparées pour tutoriel (sans noms de rôles)
    nightSaboteursAction: {
      fr: "choisissent une victime (unanimité requise)",
      en: "choose a victim (unanimity required)",
      es: "eligen una víctima (se requiere unanimidad)",
      it: "scelgono una vittima (unanimità richiesta)",
      de: "wählen ein Opfer (Einstimmigkeit erforderlich)",
      pt: "escolhem uma vítima (unanimidade necessária)",
      nl: "kiezen een slachtoffer (unanimiteit vereist)"
    },
    nightRadarAction: {
      fr: "inspecte un joueur (saboteur ou non ?)",
      en: "inspects a player (saboteur or not?)",
      es: "inspecciona a un jugador (¿saboteador o no?)",
      it: "ispeziona un giocatore (sabotatore o no?)",
      de: "inspiziert einen Spieler (Saboteur oder nicht?)",
      pt: "inspeciona um jogador (sabotador ou não?)",
      nl: "inspecteert een speler (saboteur of niet?)"
    },
    nightDoctorAction: {
      fr: "peut sauver OU tuer (1 vie + 1 mort max)",
      en: "can save OR kill (1 life + 1 death max)",
      es: "puede salvar O matar (1 vida + 1 muerte máx)",
      it: "può salvare O uccidere (1 vita + 1 morte max)",
      de: "kann retten ODER töten (max 1 Leben + 1 Tod)",
      pt: "pode salvar OU matar (1 vida + 1 morte máx)",
      nl: "kan redden OF doden (max 1 leven + 1 dood)"
    },
    specialRolesLabel: {
      fr: "Rôles spéciaux",
      en: "Special roles",
      es: "Roles especiales",
      it: "Ruoli speciali",
      de: "Spezialrollen",
      pt: "Papéis especiais",
      nl: "Speciale rollen"
    },
    win: {
      fr: "gagnent",
      en: "win",
      es: "ganan",
      it: "vincono",
      de: "gewinnen",
      pt: "ganham",
      nl: "winnen"
    },
    dayPhase: {
      fr: "Phase de jour",
      en: "Day phase",
      es: "Fase de día",
      it: "Fase diurna",
      de: "Tagphase",
      pt: "Fase de dia",
      nl: "Dagfase"
    },
    dayResults: {
      fr: "Les résultats de la nuit sont révélés (qui est mort ?)",
      en: "The night results are revealed (who died?)",
      es: "Se revelan los resultados de la noche (¿quién murió?)",
      it: "I risultati della notte vengono rivelati (chi è morto?)",
      de: "Die Nachtergebnisse werden enthüllt (wer ist gestorben?)",
      pt: "Os resultados da noite são revelados (quem morreu?)",
      nl: "De nachtresultaten worden onthuld (wie is er gestorven?)"
    },
    dayDiscussion: {
      fr: "Tous les joueurs vivants <strong>discutent</strong> et <strong>débattent</strong>",
      en: "All living players <strong>discuss</strong> and <strong>debate</strong>",
      es: "Todos los jugadores vivos <strong>discuten</strong> y <strong>debaten</strong>",
      it: "Tutti i giocatori vivi <strong>discutono</strong> e <strong>dibattono</strong>",
      de: "Alle lebenden Spieler <strong>diskutieren</strong> und <strong>debattieren</strong>",
      pt: "Todos os jogadores vivos <strong>discutem</strong> e <strong>debatem</strong>",
      nl: "Alle levende spelers <strong>discussiëren</strong> en <strong>debatteren</strong>"
    },
    dayVote: {
      fr: "Un <strong>vote d'éjection</strong> a lieu pour éliminer un suspect",
      en: "An <strong>ejection vote</strong> takes place to eliminate a suspect",
      es: "Una <strong>votación de expulsión</strong> tiene lugar para eliminar a un sospechoso",
      it: "Si tiene una <strong>votazione di espulsione</strong> per eliminare un sospetto",
      de: "Eine <strong>Auswurfabstimmung</strong> findet statt, um einen Verdächtigen zu eliminieren",
      pt: "Uma <strong>votação de ejeção</strong> acontece para eliminar um suspeito",
      nl: "Er vindt een <strong>uitwerpstemming</strong> plaats om een verdachte te elimineren"
    },
    dayCaptain: {
      fr: "Le <strong>Capitaine</strong> tranche en cas d'égalité",
      en: "The <strong>Captain</strong> decides in case of a tie",
      es: "El <strong>Capitán</strong> decide en caso de empate",
      it: "Il <strong>Capitano</strong> decide in caso di pareggio",
      de: "Der <strong>Kapitän</strong> entscheidet bei Stimmengleichheit",
      pt: "O <strong>Capitão</strong> decide em caso de empate",
      nl: "De <strong>Kapitein</strong> beslist bij gelijkspel"
    },
    dayTip: {
      fr: "<strong>Astuce :</strong> Observez les comportements, cherchez les contradictions, et faites confiance à votre instinct !",
      en: "<strong>Tip:</strong> Observe behaviors, look for contradictions, and trust your instincts!",
      es: "<strong>Consejo:</strong> ¡Observa los comportamientos, busca contradicciones y confía en tu instinto!",
      it: "<strong>Suggerimento:</strong> Osserva i comportamenti, cerca le contraddizioni e fidati del tuo istinto!",
      de: "<strong>Tipp:</strong> Beobachte das Verhalten, suche nach Widersprüchen und vertraue deinem Instinkt!",
      pt: "<strong>Dica:</strong> Observe os comportamentos, procure contradições e confie em seus instintos!",
      nl: "<strong>Tip:</strong> Observeer gedragingen, zoek naar tegenstrijdigheden en vertrouw op je instinct!"
    },
    victoryConditions: {
      fr: "Conditions de victoire",
      en: "Victory conditions",
      es: "Condiciones de victoria",
      it: "Condizioni di vittoria",
      de: "Siegbedingungen",
      pt: "Condições de vitória",
      nl: "Overwinningsvoorwaarden"
    },
    astronautsWin: {
      fr: "Astronautes gagnent",
      en: "Astronauts win",
      es: "Astronautas ganan",
      it: "Astronauti vincono",
      de: "Astronauten gewinnen",
      pt: "Astronautas vencem",
      nl: "Astronauten winnen"
    },
    astronautsWinDesc: {
      fr: "Tous les saboteurs sont éliminés",
      en: "All saboteurs are eliminated",
      es: "Todos los saboteadores son eliminados",
      it: "Tutti i sabotatori sono eliminati",
      de: "Alle Saboteure sind eliminiert",
      pt: "Todos os sabotadores são eliminados",
      nl: "Alle saboteurs zijn geëlimineerd"
    },
    saboteursWin: {
      fr: "Saboteurs gagnent",
      en: "Saboteurs win",
      es: "Saboteadores ganan",
      it: "Sabotatori vincono",
      de: "Saboteure gewinnen",
      pt: "Sabotadores vencem",
      nl: "Saboteurs winnen"
    },
    saboteursWinDesc: {
      fr: "Nombre de saboteurs ≥ astronautes",
      en: "Number of saboteurs ≥ astronauts",
      es: "Número de saboteadores ≥ astronautas",
      it: "Numero di sabotatori ≥ astronauti",
      de: "Anzahl Saboteure ≥ Astronauten",
      pt: "Número de sabotadores ≥ astronautas",
      nl: "Aantal saboteurs ≥ astronauten"
    },
    readyToPlay: {
      fr: "Prêt à jouer ? Créez ou rejoignez une mission ! 🚀",
      en: "Ready to play? Create or join a mission! 🚀",
      es: "¿Listo para jugar? ¡Crea o únete a una misión! 🚀",
      it: "Pronto a giocare? Crea o unisciti a una missione! 🚀",
      de: "Bereit zu spielen? Erstelle oder tritt einer Mission bei! 🚀",
      pt: "Pronto para jogar? Crie ou entre em uma missão! 🚀",
      nl: "Klaar om te spelen? Maak of neem deel aan een missie! 🚀"
    },
    dontShowAgain: {
      fr: "Ne plus afficher ce tutoriel",
      en: "Don't show this tutorial again",
      es: "No mostrar este tutorial de nuevo",
      it: "Non mostrare più questo tutorial",
      de: "Dieses Tutorial nicht mehr anzeigen",
      pt: "Não mostrar este tutorial novamente",
      nl: "Deze tutorial niet meer tonen"
    },
    
    // Page 5 - Visioconférence
    videoConference: {
      title: {
        fr: "Visioconférence",
        en: "Video Conference",
        es: "Videoconferencia",
        it: "Videoconferenza",
        de: "Videokonferenz",
        pt: "Videoconferência",
        nl: "Videoconferentie"
      },
      videoControls: {
        fr: "🎥 Contrôles Vidéo",
        en: "🎥 Video Controls",
        es: "🎥 Controles de Vídeo",
        it: "🎥 Controlli Video",
        de: "🎥 Video-Steuerung",
        pt: "🎥 Controles de Vídeo",
        nl: "🎥 Video Bediening"
      },
      micro: {
        fr: "Micro : Cliquez pour activer/désactiver votre micro",
        en: "Mic: Click to enable/disable your microphone",
        es: "Micro: Haz clic para activar/desactivar tu micrófono",
        it: "Micro: Clicca per attivare/disattivare il microfono",
        de: "Mikro: Klicken zum Aktivieren/Deaktivieren",
        pt: "Micro: Clique para ativar/desativar seu microfone",
        nl: "Micro: Klik om je microfoon in/uit te schakelen"
      },
      camera: {
        fr: "Caméra : Cliquez pour activer/désactiver votre caméra",
        en: "Camera: Click to enable/disable your camera",
        es: "Cámara: Haz clic para activar/desactivar tu cámara",
        it: "Camera: Clicca per attivare/disattivare la telecamera",
        de: "Kamera: Klicken zum Aktivieren/Deaktivieren",
        pt: "Câmera: Clique para ativar/desativar sua câmera",
        nl: "Camera: Klik om je camera in/uit te schakelen"
      },
      maxMode: {
        fr: "Max : Mode plein écran (briefing étendu)",
        en: "Max: Full screen mode (extended briefing)",
        es: "Max: Modo pantalla completa (briefing extendido)",
        it: "Max: Modalità schermo intero (briefing esteso)",
        de: "Max: Vollbildmodus (erweitertes Briefing)",
        pt: "Max: Modo tela cheia (briefing estendido)",
        nl: "Max: Volledig scherm (uitgebreide briefing)"
      },
      splitMode: {
        fr: "Split : Mode 50/50 (jeu + vidéo)",
        en: "Split: 50/50 mode (game + video)",
        es: "Split: Modo 50/50 (juego + vídeo)",
        it: "Split: Modalità 50/50 (gioco + video)",
        de: "Split: 50/50 Modus (Spiel + Video)",
        pt: "Split: Modo 50/50 (jogo + vídeo)",
        nl: "Split: 50/50 modus (spel + video)"
      },
      autoActivation: {
        fr: "💡 Activation Automatique",
        en: "💡 Automatic Activation",
        es: "💡 Activación Automática",
        it: "💡 Attivazione Automatica",
        de: "💡 Automatische Aktivierung",
        pt: "💡 Ativação Automática",
        nl: "💡 Automatische Activering"
      },
      microCameraOn: {
        fr: "✅ Micro + Caméra ON",
        en: "✅ Mic + Camera ON",
        es: "✅ Micro + Cámara ON",
        it: "✅ Micro + Camera ON",
        de: "✅ Mikro + Kamera AN",
        pt: "✅ Micro + Câmera ON",
        nl: "✅ Micro + Camera AAN"
      },
      dayPhases: {
        fr: "Jour (débat/vote)",
        en: "Day (debate/vote)",
        es: "Día (debate/voto)",
        it: "Giorno (dibattito/voto)",
        de: "Tag (Debatte/Abstimmung)",
        pt: "Dia (debate/voto)",
        nl: "Dag (debat/stemming)"
      },
      endOfGame: {
        fr: "Fin de partie",
        en: "End of game",
        es: "Fin de partida",
        it: "Fine partita",
        de: "Spielende",
        pt: "Fim de jogo",
        nl: "Einde spel"
      },
      roleReveal: {
        fr: "Révélation des rôles",
        en: "Role reveal",
        es: "Revelación de roles",
        it: "Rivelazione dei ruoli",
        de: "Rollenaufdeckung",
        pt: "Revelação de papéis",
        nl: "Rol onthulling"
      },
      certainRoles: {
        fr: "🔒 Certains Rôles",
        en: "🔒 Certain Roles",
        es: "🔒 Ciertos Roles",
        it: "🔒 Certi Ruoli",
        de: "🔒 Bestimmte Rollen",
        pt: "🔒 Certos Papéis",
        nl: "🔒 Bepaalde Rollen"
      },
      onPhases: {
        fr: "• Jour (débat/vote)<br>• Fin de partie<br>• Révélation des rôles",
        en: "• Day (debate/vote)<br>• End of game<br>• Role reveal",
        es: "• Día (debate/voto)<br>• Fin de partida<br>• Revelación de roles",
        it: "• Giorno (dibattito/voto)<br>• Fine partita<br>• Rivelazione ruoli",
        de: "• Tag (Debatte/Abstimmung)<br>• Spielende<br>• Rollenaufdeckung",
        pt: "• Dia (debate/voto)<br>• Fim de jogo<br>• Revelação de papéis",
        nl: "• Dag (debat/stemming)<br>• Einde spel<br>• Rol onthulling"
      },
      saboteurNight: {
        fr: "Nuit des saboteurs",
        en: "Saboteur night",
        es: "Noche de saboteadores",
        it: "Notte dei sabotatori",
        de: "Saboteur-Nacht",
        pt: "Noite dos sabotadores",
        nl: "Saboteur nacht"
      },
      aiAgentExchange: {
        fr: "Échange Agent IA",
        en: "AI Agent exchange",
        es: "Intercambio Agente IA",
        it: "Scambio Agente IA",
        de: "KI-Agent Austausch",
        pt: "Troca Agente IA",
        nl: "AI Agent uitwisseling"
      },
      specialActions: {
        fr: "Actions spéciales",
        en: "Special actions",
        es: "Acciones especiales",
        it: "Azioni speciali",
        de: "Spezielle Aktionen",
        pt: "Ações especiais",
        nl: "Speciale acties"
      },
      tipManualControl: {
        fr: "Astuce : Vous pouvez désactiver votre micro/caméra manuellement à tout moment.",
        en: "Tip: You can disable your mic/camera manually at any time.",
        es: "Consejo: Puedes desactivar tu micro/cámara manualmente en cualquier momento.",
        it: "Suggerimento: Puoi disattivare micro/camera manualmente in qualsiasi momento.",
        de: "Tipp: Du kannst Mikro/Kamera jederzeit manuell deaktivieren.",
        pt: "Dica: Você pode desativar seu micro/câmera manualmente a qualquer momento.",
        nl: "Tip: Je kunt je micro/camera op elk moment handmatig uitschakelen."
      }
    },
    
    // Page 6 - Visio sur Mobile
    mobileVideo: {
      title: {
        fr: "Visio sur Mobile",
        en: "Video on Mobile",
        es: "Vídeo en Móvil",
        it: "Video su Mobile",
        de: "Video auf Handy",
        pt: "Vídeo no Celular",
        nl: "Video op Mobiel"
      },
      mobileActivation: {
        fr: "📱 Activation sur Mobile",
        en: "📱 Mobile Activation",
        es: "📱 Activación en Móvil",
        it: "📱 Attivazione su Mobile",
        de: "📱 Mobile Aktivierung",
        pt: "📱 Ativação no Celular",
        nl: "📱 Mobiele Activering"
      },
      firstConnection: {
        fr: "1ère connexion : Autoriser l'accès micro/caméra dans le navigateur",
        en: "1st connection: Allow mic/camera access in browser",
        es: "1ª conexión: Autorizar acceso micro/cámara en el navegador",
        it: "1ª connessione: Autorizza accesso micro/camera nel browser",
        de: "1. Verbindung: Mikro/Kamera-Zugriff im Browser erlauben",
        pt: "1ª conexão: Autorizar acesso micro/câmera no navegador",
        nl: "1e verbinding: Micro/camera toegang toestaan in browser"
      },
      videoEnabledButton: {
        fr: "Bouton \"📹 Visio activée\" : En bas à gauche pour activer/désactiver",
        en: "\"📹 Video enabled\" button: Bottom left to enable/disable",
        es: "Botón \"📹 Vídeo activado\": Abajo a la izquierda para activar/desactivar",
        it: "Pulsante \"📹 Video attivato\": In basso a sinistra per attivare/disattivare",
        de: "\"📹 Video aktiviert\" Button: Unten links zum Aktivieren/Deaktivieren",
        pt: "Botão \"📹 Vídeo ativado\": Canto inferior esquerdo para ativar/desativar",
        nl: "\"📹 Video ingeschakeld\" knop: Linksonder om in/uit te schakelen"
      },
      afterRefresh: {
        fr: "Après un refresh : Retaper sur \"Activer visio\" puis valider",
        en: "After refresh: Tap \"Enable video\" again then confirm",
        es: "Después de actualizar: Vuelve a pulsar \"Activar vídeo\" y confirma",
        it: "Dopo refresh: Tocca di nuovo \"Attiva video\" poi conferma",
        de: "Nach Refresh: \"Video aktivieren\" erneut tippen und bestätigen",
        pt: "Após atualizar: Toque em \"Ativar vídeo\" novamente e confirme",
        nl: "Na refresh: Tik opnieuw op \"Video activeren\" en bevestig"
      },
      onPC: {
        fr: "Sur PC : La visio s'active automatiquement",
        en: "On PC: Video activates automatically",
        es: "En PC: El vídeo se activa automáticamente",
        it: "Su PC: Il video si attiva automaticamente",
        de: "Am PC: Video aktiviert sich automatisch",
        pt: "No PC: O vídeo ativa automaticamente",
        nl: "Op PC: Video activeert automatisch"
      },
      onMobile: {
        fr: "Sur Mobile : Utiliser le bouton en bas à gauche",
        en: "On Mobile: Use the bottom left button",
        es: "En Móvil: Usar el botón abajo a la izquierda",
        it: "Su Mobile: Usa il pulsante in basso a sinistra",
        de: "Auf Handy: Button unten links verwenden",
        pt: "No Celular: Usar o botão no canto inferior esquerdo",
        nl: "Op Mobiel: Gebruik de knop linksonder"
      },
      tipVideoNotShowing: {
        fr: "Astuce : Si la vidéo ne s'affiche pas après refresh, vérifier que le bouton \"Visio activée\" est bien actif (vert).",
        en: "Tip: If video doesn't show after refresh, check that \"Video enabled\" button is active (green).",
        es: "Consejo: Si el vídeo no aparece después de actualizar, verifica que el botón \"Vídeo activado\" esté activo (verde).",
        it: "Suggerimento: Se il video non appare dopo refresh, verifica che il pulsante \"Video attivato\" sia attivo (verde).",
        de: "Tipp: Wenn Video nach Refresh nicht erscheint, prüfe ob \"Video aktiviert\" Button aktiv ist (grün).",
        pt: "Dica: Se o vídeo não aparecer após atualizar, verifique se o botão \"Vídeo ativado\" está ativo (verde).",
        nl: "Tip: Als video niet verschijnt na refresh, controleer of \"Video ingeschakeld\" knop actief is (groen)."
      }
    }
  },

  // ============================================================================
  // AVATAR.HTML - PAGE AVATAR
  // ============================================================================
  avatar: {
    // Titre
    title: {
      fr: "CRÉATEUR D'AVATAR IA",
      en: "AI AVATAR CREATOR",
      es: "CREADOR DE AVATAR IA",
      it: "CREATORE DI AVATAR IA",
      de: "KI-AVATAR-ERSTELLER",
      pt: "CRIADOR DE AVATAR IA",
      nl: "AI-AVATAR MAKER"
    },
    
    // Sections
    sections: {
      uploadPhoto: {
        fr: "Clique pour ajouter ta photo",
        en: "Click to add your photo",
        es: "Haz clic para añadir tu foto",
        it: "Clicca per aggiungere la tua foto",
        de: "Klicke, um dein Foto hinzuzufügen",
        pt: "Clique para adicionar sua foto",
        nl: "Klik om je foto toe te voegen"
      },
      selfieRecommended: {
        fr: "Selfie de face recommandé",
        en: "Front-facing selfie recommended",
        es: "Se recomienda selfie de frente",
        it: "Si consiglia un selfie frontale",
        de: "Frontalfoto empfohlen",
        pt: "Selfie de frente recomendado",
        nl: "Foto van voren aanbevolen"
      },
      takePhoto: {
        fr: "📷 Prendre une photo",
        en: "📷 Take a photo",
        es: "📷 Tomar una foto",
        it: "📷 Scatta una foto",
        de: "📷 Foto aufnehmen",
        pt: "📷 Tirar uma foto",
        nl: "📷 Foto maken"
      },
      theme: {
        fr: "🎨 THÈME DE L'AVATAR",
        en: "🎨 AVATAR THEME",
        es: "🎨 TEMA DEL AVATAR",
        it: "🎨 TEMA DELL'AVATAR",
        de: "🎨 AVATAR-THEMA",
        pt: "🎨 TEMA DO AVATAR",
        nl: "🎨 AVATAR THEMA"
      },
      character: {
        fr: "👤 PERSONNAGE",
        en: "👤 CHARACTER",
        es: "👤 PERSONAJE",
        it: "👤 PERSONAGGIO",
        de: "👤 CHARAKTER",
        pt: "👤 PERSONAGEM",
        nl: "👤 PERSONAGE"
      },
      style: {
        fr: "🔥 STYLE DE RENDU",
        en: "🔥 RENDER STYLE",
        es: "🔥 ESTILO DE RENDERIZADO",
        it: "🔥 STILE DI RENDERING",
        de: "🔥 RENDER-STIL",
        pt: "🔥 ESTILO DE RENDERIZAÇÃO",
        nl: "🔥 RENDERSTIJL"
      },
      customPrompt: {
        fr: "✨ PROMPT PERSONNALISÉ",
        en: "✨ CUSTOM PROMPT",
        es: "✨ PROMPT PERSONALIZADO",
        it: "✨ PROMPT PERSONALIZZATO",
        de: "✨ BENUTZERDEFINIERTER PROMPT",
        pt: "✨ PROMPT PERSONALIZADO",
        nl: "✨ AANGEPASTE PROMPT"
      },
      result: {
        fr: "🖼️ RÉSULTAT",
        en: "🖼️ RESULT",
        es: "🖼️ RESULTADO",
        it: "🖼️ RISULTATO",
        de: "🖼️ ERGEBNIS",
        pt: "🖼️ RESULTADO",
        nl: "🖼️ RESULTAAT"
      },
      myAvatars: {
        fr: "📁 MES AVATARS IA",
        en: "📁 MY AI AVATARS",
        es: "📁 MIS AVATARES IA",
        it: "📁 I MIEI AVATAR IA",
        de: "📁 MEINE KI-AVATARE",
        pt: "📁 MEUS AVATARES IA",
        nl: "📁 MIJN AI-AVATARS"
      },
      myCustomAvatar: {
        fr: "📤 MON AVATAR PERSO",
        en: "📤 MY CUSTOM AVATAR",
        es: "📤 MI AVATAR PERSONALIZADO",
        it: "📤 IL MIO AVATAR PERSONALIZZATO",
        de: "📤 MEIN EIGENER AVATAR",
        pt: "📤 MEU AVATAR PERSONALIZADO",
        nl: "📤 MIJN EIGEN AVATAR"
      },
      classicAvatars: {
        fr: "🎭 AVATARS CLASSIQUES",
        en: "🎭 CLASSIC AVATARS",
        es: "🎭 AVATARES CLÁSICOS",
        it: "🎭 AVATAR CLASSICI",
        de: "🎭 KLASSISCHE AVATARE",
        pt: "🎭 AVATARES CLÁSSICOS",
        nl: "🎭 KLASSIEKE AVATARS"
      }
    },
    
    // Styles de rendu
    styles: {
      standard: {
        name: {
          fr: "Standard",
          en: "Standard",
          es: "Estándar",
          it: "Standard",
          de: "Standard",
          pt: "Padrão",
          nl: "Standaard"
        },
        desc: {
          fr: "Équilibré",
          en: "Balanced",
          es: "Equilibrado",
          it: "Equilibrato",
          de: "Ausgewogen",
          pt: "Equilibrado",
          nl: "Gebalanceerd"
        }
      },
      transformed: {
        name: {
          fr: "Transformé",
          en: "Transformed",
          es: "Transformado",
          it: "Trasformato",
          de: "Transformiert",
          pt: "Transformado",
          nl: "Getransformeerd"
        },
        desc: {
          fr: "Plus stylisé",
          en: "More stylized",
          es: "Más estilizado",
          it: "Più stilizzato",
          de: "Stilisierter",
          pt: "Mais estilizado",
          nl: "Meer gestileerd"
        }
      },
      artistic: {
        name: {
          fr: "Artistique",
          en: "Artistic",
          es: "Artístico",
          it: "Artistico",
          de: "Künstlerisch",
          pt: "Artístico",
          nl: "Artistiek"
        },
        desc: {
          fr: "Très stylisé",
          en: "Very stylized",
          es: "Muy estilizado",
          it: "Molto stilizzato",
          de: "Sehr stilisiert",
          pt: "Muito estilizado",
          nl: "Zeer gestileerd"
        }
      }
    },
    
    // Boutons
    buttons: {
      generate: {
        fr: "🎨 GÉNÉRER MON AVATAR",
        en: "🎨 GENERATE MY AVATAR",
        es: "🎨 GENERAR MI AVATAR",
        it: "🎨 GENERA IL MIO AVATAR",
        de: "🎨 MEINEN AVATAR ERSTELLEN",
        pt: "🎨 GERAR MEU AVATAR",
        nl: "🎨 MIJN AVATAR GENEREREN"
      },
      generating: {
        fr: "⏳ Génération en cours...",
        en: "⏳ Generating...",
        es: "⏳ Generando...",
        it: "⏳ Generazione in corso...",
        de: "⏳ Wird erstellt...",
        pt: "⏳ Gerando...",
        nl: "⏳ Bezig met genereren..."
      },
      download: {
        fr: "📥 Télécharger",
        en: "📥 Download",
        es: "📥 Descargar",
        it: "📥 Scarica",
        de: "📥 Herunterladen",
        pt: "📥 Baixar",
        nl: "📥 Downloaden"
      },
      use: {
        fr: "✅ Utiliser",
        en: "✅ Use",
        es: "✅ Usar",
        it: "✅ Usa",
        de: "✅ Verwenden",
        pt: "✅ Usar",
        nl: "✅ Gebruiken"
      },
      delete: {
        fr: "🗑️ Supprimer",
        en: "🗑️ Delete",
        es: "🗑️ Eliminar",
        it: "🗑️ Elimina",
        de: "🗑️ Löschen",
        pt: "🗑️ Excluir",
        nl: "🗑️ Verwijderen"
      },
      backToGame: {
        fr: "🎮 Retour au jeu",
        en: "🎮 Back to game",
        es: "🎮 Volver al juego",
        it: "🎮 Torna al gioco",
        de: "🎮 Zurück zum Spiel",
        pt: "🎮 Voltar ao jogo",
        nl: "🎮 Terug naar spel"
      },
      importImage: {
        fr: "📁 Importer une image",
        en: "📁 Import an image",
        es: "📁 Importar una imagen",
        it: "📁 Importa un'immagine",
        de: "📁 Bild importieren",
        pt: "📁 Importar uma imagem",
        nl: "📁 Afbeelding importeren"
      }
    },
    
    // Messages
    messages: {
      avatarAppears: {
        fr: "Ton avatar apparaîtra ici",
        en: "Your avatar will appear here",
        es: "Tu avatar aparecerá aquí",
        it: "Il tuo avatar apparirà qui",
        de: "Dein Avatar erscheint hier",
        pt: "Seu avatar aparecerá aqui",
        nl: "Je avatar verschijnt hier"
      },
      noAvatars: {
        fr: "Aucun avatar pour le moment",
        en: "No avatars yet",
        es: "Aún no hay avatares",
        it: "Nessun avatar al momento",
        de: "Noch keine Avatare",
        pt: "Nenhum avatar ainda",
        nl: "Nog geen avatars"
      },
      noCustomAvatar: {
        fr: "Aucun avatar perso",
        en: "No custom avatar",
        es: "Sin avatar personalizado",
        it: "Nessun avatar personalizzato",
        de: "Kein eigener Avatar",
        pt: "Nenhum avatar personalizado",
        nl: "Geen eigen avatar"
      },
      myCustomAvatarLabel: {
        fr: "Mon avatar perso",
        en: "My custom avatar",
        es: "Mi avatar personalizado",
        it: "Il mio avatar personalizzato",
        de: "Mein eigener Avatar",
        pt: "Meu avatar personalizado",
        nl: "Mijn eigen avatar"
      },
      imageNotFound: {
        fr: "⚠️ Image introuvable",
        en: "⚠️ Image not found",
        es: "⚠️ Imagen no encontrada",
        it: "⚠️ Immagine non trovata",
        de: "⚠️ Bild nicht gefunden",
        pt: "⚠️ Imagem não encontrada",
        nl: "⚠️ Afbeelding niet gevonden"
      },
      confirmDeleteAvatar: {
        fr: "Supprimer cet avatar ?",
        en: "Delete this avatar?",
        es: "¿Eliminar este avatar?",
        it: "Eliminare questo avatar?",
        de: "Diesen Avatar löschen?",
        pt: "Excluir este avatar?",
        nl: "Deze avatar verwijderen?"
      },
      confirmDeleteCustom: {
        fr: "Supprimer ton avatar perso ?",
        en: "Delete your custom avatar?",
        es: "¿Eliminar tu avatar personalizado?",
        it: "Eliminare il tuo avatar personalizzato?",
        de: "Deinen eigenen Avatar löschen?",
        pt: "Excluir seu avatar personalizado?",
        nl: "Je eigen avatar verwijderen?"
      },
      quotaInfo: {
        fr: "avatars utilisés sur",
        en: "avatars used out of",
        es: "avatares usados de",
        it: "avatar usati su",
        de: "Avatare verwendet von",
        pt: "avatares usados de",
        nl: "avatars gebruikt van"
      },
      uploadInfo: {
        fr: "Importe ta propre photo (1 seul avatar perso autorisé)",
        en: "Upload your own photo (1 custom avatar allowed)",
        es: "Sube tu propia foto (1 avatar personalizado permitido)",
        it: "Carica la tua foto (1 avatar personalizzato consentito)",
        de: "Lade dein eigenes Foto hoch (1 eigener Avatar erlaubt)",
        pt: "Envie sua própria foto (1 avatar personalizado permitido)",
        nl: "Upload je eigen foto (1 eigen avatar toegestaan)"
      },
      formatInfo: {
        fr: "Formats acceptés : JPG, PNG, WebP • Max 5 Mo • Sera redimensionné en 256×256",
        en: "Accepted formats: JPG, PNG, WebP • Max 5 MB • Will be resized to 256×256",
        es: "Formatos aceptados: JPG, PNG, WebP • Máx 5 MB • Se redimensionará a 256×256",
        it: "Formati accettati: JPG, PNG, WebP • Max 5 MB • Verrà ridimensionato a 256×256",
        de: "Akzeptierte Formate: JPG, PNG, WebP • Max 5 MB • Wird auf 256×256 skaliert",
        pt: "Formatos aceitos: JPG, PNG, WebP • Máx 5 MB • Será redimensionado para 256×256",
        nl: "Geaccepteerde formaten: JPG, PNG, WebP • Max 5 MB • Wordt verkleind naar 256×256"
      },
      chooseEmoji: {
        fr: "Choisis un emoji comme avatar (sans photo)",
        en: "Choose an emoji as avatar (no photo)",
        es: "Elige un emoji como avatar (sin foto)",
        it: "Scegli un emoji come avatar (senza foto)",
        de: "Wähle ein Emoji als Avatar (ohne Foto)",
        pt: "Escolha um emoji como avatar (sem foto)",
        nl: "Kies een emoji als avatar (zonder foto)"
      },
      customPromptPlaceholder: {
        fr: "Décris ton personnage personnalisé...",
        en: "Describe your custom character...",
        es: "Describe tu personaje personalizado...",
        it: "Descrivi il tuo personaggio personalizzato...",
        de: "Beschreibe deinen eigenen Charakter...",
        pt: "Descreva seu personagem personalizado...",
        nl: "Beschrijf je eigen personage..."
      }
    },
    
    // Toasts
    toasts: {
      avatarGenerated: {
        fr: "✅ Avatar généré !",
        en: "✅ Avatar generated!",
        es: "✅ ¡Avatar generado!",
        it: "✅ Avatar generato!",
        de: "✅ Avatar erstellt!",
        pt: "✅ Avatar gerado!",
        nl: "✅ Avatar gegenereerd!"
      },
      avatarSelected: {
        fr: "✅ Avatar sélectionné !",
        en: "✅ Avatar selected!",
        es: "✅ ¡Avatar seleccionado!",
        it: "✅ Avatar selezionato!",
        de: "✅ Avatar ausgewählt!",
        pt: "✅ Avatar selecionado!",
        nl: "✅ Avatar geselecteerd!"
      },
      avatarDeleted: {
        fr: "🗑️ Avatar supprimé !",
        en: "🗑️ Avatar deleted!",
        es: "🗑️ ¡Avatar eliminado!",
        it: "🗑️ Avatar eliminato!",
        de: "🗑️ Avatar gelöscht!",
        pt: "🗑️ Avatar excluído!",
        nl: "🗑️ Avatar verwijderd!"
      },
      uploadSuccess: {
        fr: "✅ Avatar perso enregistré !",
        en: "✅ Custom avatar saved!",
        es: "✅ ¡Avatar personalizado guardado!",
        it: "✅ Avatar personalizzato salvato!",
        de: "✅ Eigener Avatar gespeichert!",
        pt: "✅ Avatar personalizado salvo!",
        nl: "✅ Eigen avatar opgeslagen!"
      },
      photoRequired: {
        fr: "📷 Ajoute d'abord une photo",
        en: "📷 Add a photo first",
        es: "📷 Añade una foto primero",
        it: "📷 Aggiungi prima una foto",
        de: "📷 Füge zuerst ein Foto hinzu",
        pt: "📷 Adicione uma foto primeiro",
        nl: "📷 Voeg eerst een foto toe"
      },
      quotaExceeded: {
        fr: "❌ Quota d'avatars atteint",
        en: "❌ Avatar quota reached",
        es: "❌ Cuota de avatares alcanzada",
        it: "❌ Quota avatar raggiunta",
        de: "❌ Avatar-Kontingent erreicht",
        pt: "❌ Cota de avatares atingida",
        nl: "❌ Avatar quotum bereikt"
      },
      loginRequired: {
        fr: "❌ Connecte-toi d'abord",
        en: "❌ Login first",
        es: "❌ Inicia sesión primero",
        it: "❌ Accedi prima",
        de: "❌ Melde dich zuerst an",
        pt: "❌ Faça login primeiro",
        nl: "❌ Log eerst in"
      },
      photoCaptured: {
        fr: "✅ Photo capturée !",
        en: "✅ Photo captured!",
        es: "✅ ¡Foto capturada!",
        it: "✅ Foto scattata!",
        de: "✅ Foto aufgenommen!",
        pt: "✅ Foto capturada!",
        nl: "✅ Foto gemaakt!"
      }
    }
  },

  // ============================================================================
  // EMAILS - TEMPLATES SERVER
  // ============================================================================
  emails: {
    verification: {
      subject: {
        fr: "🎮 Vérifie ton compte Saboteur",
        en: "🎮 Verify your Saboteur account",
        es: "🎮 Verifica tu cuenta de Saboteur",
        it: "🎮 Verifica il tuo account Saboteur",
        de: "🎮 Bestätige dein Saboteur-Konto",
        pt: "🎮 Verifique sua conta Saboteur",
        nl: "🎮 Verifieer je Saboteur-account"
      },
      title: {
        fr: "Bienvenue dans l'équipage !",
        en: "Welcome to the crew!",
        es: "¡Bienvenido a la tripulación!",
        it: "Benvenuto nell'equipaggio!",
        de: "Willkommen in der Crew!",
        pt: "Bem-vindo à tripulação!",
        nl: "Welkom bij de bemanning!"
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
        fr: "Clique sur le bouton ci-dessous pour activer ton compte et commencer à jouer !",
        en: "Click the button below to activate your account and start playing!",
        es: "¡Haz clic en el botón de abajo para activar tu cuenta y empezar a jugar!",
        it: "Clicca il pulsante qui sotto per attivare il tuo account e iniziare a giocare!",
        de: "Klicke auf den Button unten, um dein Konto zu aktivieren und zu spielen!",
        pt: "Clique no botão abaixo para ativar sua conta e começar a jogar!",
        nl: "Klik op de onderstaande knop om je account te activeren en te beginnen met spelen!"
      },
      button: {
        fr: "✅ Activer mon compte",
        en: "✅ Activate my account",
        es: "✅ Activar mi cuenta",
        it: "✅ Attiva il mio account",
        de: "✅ Mein Konto aktivieren",
        pt: "✅ Ativar minha conta",
        nl: "✅ Mijn account activeren"
      },
      linkExpires: {
        fr: "Ce lien expire dans 24 heures.",
        en: "This link expires in 24 hours.",
        es: "Este enlace caduca en 24 horas.",
        it: "Questo link scade tra 24 ore.",
        de: "Dieser Link läuft in 24 Stunden ab.",
        pt: "Este link expira em 24 horas.",
        nl: "Deze link verloopt over 24 uur."
      },
      notRequested: {
        fr: "Si tu n'as pas créé de compte, ignore cet email.",
        en: "If you didn't create an account, ignore this email.",
        es: "Si no creaste una cuenta, ignora este correo.",
        it: "Se non hai creato un account, ignora questa email.",
        de: "Wenn du kein Konto erstellt hast, ignoriere diese E-Mail.",
        pt: "Se você não criou uma conta, ignore este email.",
        nl: "Als je geen account hebt aangemaakt, negeer dan deze e-mail."
      }
    },
    
    passwordReset: {
      subject: {
        fr: "🔑 Réinitialise ton mot de passe Saboteur",
        en: "🔑 Reset your Saboteur password",
        es: "🔑 Restablece tu contraseña de Saboteur",
        it: "🔑 Reimposta la tua password Saboteur",
        de: "🔑 Setze dein Saboteur-Passwort zurück",
        pt: "🔑 Redefina sua senha Saboteur",
        nl: "🔑 Reset je Saboteur-wachtwoord"
      },
      title: {
        fr: "Mot de passe oublié ?",
        en: "Forgot your password?",
        es: "¿Olvidaste tu contraseña?",
        it: "Password dimenticata?",
        de: "Passwort vergessen?",
        pt: "Esqueceu sua senha?",
        nl: "Wachtwoord vergeten?"
      },
      message: {
        fr: "Clique sur le bouton ci-dessous pour créer un nouveau mot de passe.",
        en: "Click the button below to create a new password.",
        es: "Haz clic en el botón de abajo para crear una nueva contraseña.",
        it: "Clicca il pulsante qui sotto per creare una nuova password.",
        de: "Klicke auf den Button unten, um ein neues Passwort zu erstellen.",
        pt: "Clique no botão abaixo para criar uma nova senha.",
        nl: "Klik op de onderstaande knop om een nieuw wachtwoord aan te maken."
      },
      button: {
        fr: "🔑 Réinitialiser mon mot de passe",
        en: "🔑 Reset my password",
        es: "🔑 Restablecer mi contraseña",
        it: "🔑 Reimposta la mia password",
        de: "🔑 Mein Passwort zurücksetzen",
        pt: "🔑 Redefinir minha senha",
        nl: "🔑 Mijn wachtwoord resetten"
      }
    },
    
    welcome: {
      subject: {
        fr: "🎉 Compte activé ! Bienvenue sur Saboteur",
        en: "🎉 Account activated! Welcome to Saboteur",
        es: "🎉 ¡Cuenta activada! Bienvenido a Saboteur",
        it: "🎉 Account attivato! Benvenuto su Saboteur",
        de: "🎉 Konto aktiviert! Willkommen bei Saboteur",
        pt: "🎉 Conta ativada! Bem-vindo ao Saboteur",
        nl: "🎉 Account geactiveerd! Welkom bij Saboteur"
      },
      title: {
        fr: "Ton compte est activé !",
        en: "Your account is activated!",
        es: "¡Tu cuenta está activada!",
        it: "Il tuo account è attivato!",
        de: "Dein Konto ist aktiviert!",
        pt: "Sua conta está ativada!",
        nl: "Je account is geactiveerd!"
      },
      message: {
        fr: "Tu peux maintenant profiter de toutes les fonctionnalités du jeu.",
        en: "You can now enjoy all the game features.",
        es: "Ahora puedes disfrutar de todas las funciones del juego.",
        it: "Ora puoi goderti tutte le funzionalità del gioco.",
        de: "Du kannst jetzt alle Spielfunktionen genießen.",
        pt: "Agora você pode aproveitar todos os recursos do jogo.",
        nl: "Je kunt nu genieten van alle spelfuncties."
      },
      button: {
        fr: "🎮 Jouer maintenant",
        en: "🎮 Play now",
        es: "🎮 Jugar ahora",
        it: "🎮 Gioca ora",
        de: "🎮 Jetzt spielen",
        pt: "🎮 Jogar agora",
        nl: "🎮 Nu spelen"
      }
    },
    
    footer: {
      fr: "L'équipe Saboteur 🚀",
      en: "The Saboteur Team 🚀",
      es: "El equipo Saboteur 🚀",
      it: "Il team Saboteur 🚀",
      de: "Das Saboteur-Team 🚀",
      pt: "A equipe Saboteur 🚀",
      nl: "Het Saboteur Team 🚀"
    }
  },

  // ============================================================================
  // MESSAGES SYSTÈME (CHAT / PHASES)
  // ============================================================================
  system: {
    chat: {
      gameStarting: {
        fr: "🎭 La partie commence ! Les rôles sont distribués.",
        en: "🎭 The game is starting! Roles are being distributed.",
        es: "🎭 ¡La partida comienza! Se están distribuyendo los roles.",
        it: "🎭 La partita inizia! I ruoli vengono distribuiti.",
        de: "🎭 Das Spiel beginnt! Die Rollen werden verteilt.",
        pt: "🎭 O jogo está começando! Os papéis estão sendo distribuídos.",
        nl: "🎭 Het spel begint! De rollen worden verdeeld."
      },
      captainElection: {
        fr: "👑 Phase de candidature au poste de Capitaine.",
        en: "👑 Captain candidacy phase.",
        es: "👑 Fase de candidatura para Capitán.",
        it: "👑 Fase di candidatura per Capitano.",
        de: "👑 Kapitänskandidaturphase.",
        pt: "👑 Fase de candidatura para Capitão.",
        nl: "👑 Kapitein kandidatuursfase."
      },
      nightFalls: {
        fr: "🌙 La nuit tombe sur la station...",
        en: "🌙 Night falls on the station...",
        es: "🌙 La noche cae sobre la estación...",
        it: "🌙 La notte cala sulla stazione...",
        de: "🌙 Die Nacht bricht über die Station herein...",
        pt: "🌙 A noite cai sobre a estação...",
        nl: "🌙 De nacht valt over het station..."
      },
      dayBreaks: {
        fr: "☀️ Le jour se lève. Discussion ouverte !",
        en: "☀️ Day breaks. Discussion is open!",
        es: "☀️ Amanece. ¡La discusión está abierta!",
        it: "☀️ Sorge il giorno. Discussione aperta!",
        de: "☀️ Der Tag bricht an. Diskussion eröffnet!",
        pt: "☀️ O dia amanhece. Discussão aberta!",
        nl: "☀️ De dag breekt aan. Discussie is geopend!"
      },
      voteTime: {
        fr: "🗳️ C'est l'heure du vote !",
        en: "🗳️ It's time to vote!",
        es: "🗳️ ¡Es hora de votar!",
        it: "🗳️ È ora di votare!",
        de: "🗳️ Zeit zum Abstimmen!",
        pt: "🗳️ É hora de votar!",
        nl: "🗳️ Het is tijd om te stemmen!"
      }
    }
  }
};

// ============================================================================
// FONCTIONS UTILITAIRES
// ============================================================================

/**
 * Détecte la langue du navigateur
 * @returns {string} Code langue (fr, en, es, etc.)
 */
function detectBrowserLanguage() {
  const browserLang = navigator.language || navigator.userLanguage;
  const langCode = browserLang.split('-')[0].toLowerCase();
  
  // Vérifier si la langue est supportée
  if (TRANSLATIONS._languages[langCode]) {
    return langCode;
  }
  
  // Langue par défaut
  return 'fr';
}

/**
 * Récupère la langue actuelle (localStorage ou navigateur)
 * @returns {string} Code langue
 */
function getCurrentLanguage() {
  return localStorage.getItem('saboteur_language') || detectBrowserLanguage();
}

/**
 * Définit la langue actuelle
 * @param {string} langCode - Code langue (fr, en, es, etc.)
 */
function setCurrentLanguage(langCode) {
  if (TRANSLATIONS._languages[langCode]) {
    localStorage.setItem('saboteur_language', langCode);
    return true;
  }
  return false;
}

/**
 * Récupère une traduction (fonction principale)
 * @param {string} path - Chemin de la traduction (ex: "index.auth.login")
 * @param {string} [lang] - Code langue (optionnel, utilise la langue courante)
 * @returns {string} Texte traduit
 */
function t(path, lang = null) {
  const currentLang = lang || getCurrentLanguage();
  const keys = path.split('.');
  
  let value = TRANSLATIONS;
  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = value[key];
    } else {
      console.warn(`Translation not found: ${path}`);
      return path; // Retourner le chemin si non trouvé
    }
  }
  
  // Si c'est un objet avec des langues, retourner la traduction
  if (value && typeof value === 'object' && currentLang in value) {
    return value[currentLang];
  }
  
  // Si c'est déjà une string, la retourner
  if (typeof value === 'string') {
    return value;
  }
  
  // Fallback sur français
  if (value && typeof value === 'object' && 'fr' in value) {
    return value.fr;
  }
  
  console.warn(`Translation not found: ${path}`);
  return path;
}

/**
 * Alias de t() pour éviter conflits avec client.js
 * Utiliser i18n() dans client.js pour les traductions UI
 */
function i18n(path, lang = null) {
  return t(path, lang);
}

/**
 * Traduit tous les éléments avec l'attribut data-i18n
 * @param {string} [lang] - Code langue (optionnel)
 */
function translatePage(lang = null) {
  const currentLang = lang || getCurrentLanguage();
  
  // Éléments avec data-i18n
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const translation = t(key, currentLang);
    
    if (translation && translation !== key) {
      el.textContent = translation;
    }
  });
  
  // innerHTML avec data-i18n-html (pour le HTML)
  document.querySelectorAll('[data-i18n-html]').forEach(el => {
    const key = el.getAttribute('data-i18n-html');
    const translation = t(key, currentLang);
    
    if (translation && translation !== key) {
      el.innerHTML = translation;
    }
  });
  
  // Placeholders avec data-i18n-placeholder
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    const translation = t(key, currentLang);
    
    if (translation && translation !== key) {
      el.placeholder = translation;
    }
  });
  
  // Titres avec data-i18n-title
  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    const key = el.getAttribute('data-i18n-title');
    const translation = t(key, currentLang);
    
    if (translation && translation !== key) {
      el.title = translation;
    }
  });
}

/**
 * Crée le sélecteur de langue avec drapeaux
 * @param {string} containerId - ID du conteneur
 */
function createLanguageSelector(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  const currentLang = getCurrentLanguage();
  
  let html = '<div class="language-selector">';
  
  for (const [code, info] of Object.entries(TRANSLATIONS._languages)) {
    const isActive = code === currentLang ? 'active' : '';
    html += `<button class="lang-flag ${isActive}" data-lang="${code}" title="${info.name}" onclick="changeLanguage('${code}')">${info.flag}</button>`;
  }
  
  html += '</div>';
  container.innerHTML = html;
}

/**
 * Change la langue et retraduit la page
 * @param {string} langCode - Code langue
 */
function changeLanguage(langCode) {
  if (setCurrentLanguage(langCode)) {
    translatePage(langCode);
    
    // Mettre à jour le sélecteur
    document.querySelectorAll('.lang-flag').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.lang === langCode);
    });
    
    // Émettre un événement pour les composants qui ont besoin de réagir
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang: langCode } }));
  }
}

// Exposer globalement
// Note: window.t sera écrasé par client.js dans game.html (pour les thèmes)
// mais reste disponible dans index.html pour les traductions
window.TRANSLATIONS = TRANSLATIONS;
window.t = t;         // Pour index.html et autres pages sans client.js
window.i18n = i18n;   // Alias robuste pour toutes les pages
window.getCurrentLanguage = getCurrentLanguage;
window.setCurrentLanguage = setCurrentLanguage;
window.translatePage = translatePage;
window.createLanguageSelector = createLanguageSelector;
window.changeLanguage = changeLanguage;
window.detectBrowserLanguage = detectBrowserLanguage;

// Export pour utilisation dans d'autres fichiers (Node.js)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { TRANSLATIONS, t, i18n, getCurrentLanguage, setCurrentLanguage, translatePage, createLanguageSelector, changeLanguage, detectBrowserLanguage };
}
