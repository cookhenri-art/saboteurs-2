/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║            🌍 SABOTEUR - SYSTÈME DE TRADUCTIONS V1.0                      ║
 * ║                                                                           ║
 * ║  Langues supportées : FR, EN, ES, IT, DE, PT, NL                         ║
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
      ready: {
        fr: "Prêt",
        en: "Ready",
        es: "Listo",
        it: "Pronto",
        de: "Bereit",
        pt: "Pronto",
        nl: "Klaar"
      },
      notReady: {
        fr: "Pas prêt",
        en: "Not ready",
        es: "No listo",
        it: "Non pronto",
        de: "Nicht bereit",
        pt: "Não pronto",
        nl: "Niet klaar"
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
      }
    },
    
    // Phases de jeu
    phases: {
      roleReveal: {
        fr: "RÉVÉLATION DES RÔLES",
        en: "ROLE REVEAL",
        es: "REVELACIÓN DE ROLES",
        it: "RIVELAZIONE DEI RUOLI",
        de: "ROLLENAUFDECKUNG",
        pt: "REVELAÇÃO DE PAPÉIS",
        nl: "ROLONTHULLING"
      },
      captainElection: {
        fr: "ÉLECTION DU CAPITAINE",
        en: "CAPTAIN ELECTION",
        es: "ELECCIÓN DEL CAPITÁN",
        it: "ELEZIONE DEL CAPITANO",
        de: "KAPITÄNSWAHL",
        pt: "ELEIÇÃO DO CAPITÃO",
        nl: "KAPITEINVERKIEZING"
      },
      night: {
        fr: "NUIT",
        en: "NIGHT",
        es: "NOCHE",
        it: "NOTTE",
        de: "NACHT",
        pt: "NOITE",
        nl: "NACHT"
      },
      day: {
        fr: "JOUR",
        en: "DAY",
        es: "DÍA",
        it: "GIORNO",
        de: "TAG",
        pt: "DIA",
        nl: "DAG"
      },
      discussion: {
        fr: "DISCUSSION",
        en: "DISCUSSION",
        es: "DISCUSIÓN",
        it: "DISCUSSIONE",
        de: "DISKUSSION",
        pt: "DISCUSSÃO",
        nl: "DISCUSSIE"
      },
      vote: {
        fr: "VOTE",
        en: "VOTE",
        es: "VOTACIÓN",
        it: "VOTAZIONE",
        de: "ABSTIMMUNG",
        pt: "VOTAÇÃO",
        nl: "STEMMING"
      },
      gameOver: {
        fr: "FIN DE PARTIE",
        en: "GAME OVER",
        es: "FIN DEL JUEGO",
        it: "FINE PARTITA",
        de: "SPIELENDE",
        pt: "FIM DE JOGO",
        nl: "EINDE SPEL"
      }
    },
    
    // Rôles (thème spatial par défaut)
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
      spectating: {
        fr: "Mode spectateur",
        en: "Spectator mode",
        es: "Modo espectador",
        it: "Modalità spettatore",
        de: "Zuschauermodus",
        pt: "Modo espectador",
        nl: "Toeschouwermodus"
      }
    },
    
    // Chat
    chat: {
      placeholder: {
        fr: "Écrire un message...",
        en: "Write a message...",
        es: "Escribe un mensaje...",
        it: "Scrivi un messaggio...",
        de: "Nachricht schreiben...",
        pt: "Escreva uma mensagem...",
        nl: "Schrijf een bericht..."
      },
      send: {
        fr: "Envoyer",
        en: "Send",
        es: "Enviar",
        it: "Invia",
        de: "Senden",
        pt: "Enviar",
        nl: "Verzenden"
      }
    },
    
    // Boutons
    buttons: {
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
 * Récupère une traduction
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

// Export pour utilisation dans d'autres fichiers
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { TRANSLATIONS, t, getCurrentLanguage, setCurrentLanguage, translatePage, createLanguageSelector, changeLanguage, detectBrowserLanguage };
}
