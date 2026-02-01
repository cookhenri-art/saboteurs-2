/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║         🌍 RORONOA GAMES - SITE TRANSLATIONS V1.0                         ║
 * ║                                                                           ║
 * ║  Langues supportées : FR, EN, ES, IT, DE, PT, NL                         ║
 * ║  Pages concernées : index-site, products, account, pages légales         ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

const SITE_TRANSLATIONS = {
  // ============================================================================
  // LANGUES DISPONIBLES
  // ============================================================================
  _languages: {
    fr: { name: "Français", flag: "🇫🇷" },
    en: { name: "English", flag: "🇬🇧" },
    es: { name: "Español", flag: "🇪🇸" },
    de: { name: "Deutsch", flag: "🇩🇪" },
    it: { name: "Italiano", flag: "🇮🇹" },
    pt: { name: "Português", flag: "🇵🇹" },
    nl: { name: "Nederlands", flag: "🇳🇱" }
  },

  // ============================================================================
  // NAVIGATION (Header)
  // ============================================================================
  nav: {
    home: {
      fr: "Accueil", en: "Home", es: "Inicio", de: "Startseite", it: "Home", pt: "Início", nl: "Home"
    },
    about: {
      fr: "À Propos", en: "About", es: "Acerca de", de: "Über uns", it: "Chi siamo", pt: "Sobre", nl: "Over ons"
    },
    products: {
      fr: "Produits", en: "Products", es: "Productos", de: "Produkte", it: "Prodotti", pt: "Produtos", nl: "Producten"
    },
    contact: {
      fr: "Contact", en: "Contact", es: "Contacto", de: "Kontakt", it: "Contatto", pt: "Contato", nl: "Contact"
    },
    login: {
      fr: "Se Connecter", en: "Log In", es: "Iniciar Sesión", de: "Anmelden", it: "Accedi", pt: "Entrar", nl: "Inloggen"
    },
    logout: {
      fr: "Déconnexion", en: "Log Out", es: "Cerrar Sesión", de: "Abmelden", it: "Esci", pt: "Sair", nl: "Uitloggen"
    },
    my_account: {
      fr: "Mon Compte", en: "My Account", es: "Mi Cuenta", de: "Mein Konto", it: "Il Mio Account", pt: "Minha Conta", nl: "Mijn Account"
    }
  },

  // ============================================================================
  // PAGE D'ACCUEIL (index-site.html)
  // ============================================================================
  home: {
    // Hero Section
    hero_badge: {
      fr: "Studio de Création Vidéoludique",
      en: "Video Game Creation Studio",
      es: "Estudio de Creación de Videojuegos",
      de: "Videospiel-Entwicklungsstudio",
      it: "Studio di Creazione Videoludica",
      pt: "Estúdio de Criação de Videogames",
      nl: "Videogame Creatie Studio"
    },
    hero_title_1: {
      fr: "L'Art du Combat",
      en: "The Art of Combat",
      es: "El Arte del Combate",
      de: "Die Kunst des Kampfes",
      it: "L'Arte del Combattimento",
      pt: "A Arte do Combate",
      nl: "De Kunst van het Gevecht"
    },
    hero_title_2: {
      fr: "Rencontre le Jeu",
      en: "Meets Gaming",
      es: "Encuentra el Juego",
      de: "Trifft das Spiel",
      it: "Incontra il Gioco",
      pt: "Encontra o Jogo",
      nl: "Ontmoet het Spel"
    },
    hero_description: {
      fr: "Créateur d'expériences vidéoludiques uniques • Applications Web & Mobile • Jeux de Société Nouvelle Génération",
      en: "Creator of unique gaming experiences • Web & Mobile Apps • Next Generation Board Games",
      es: "Creador de experiencias de juego únicas • Apps Web y Móvil • Juegos de Mesa Nueva Generación",
      de: "Schöpfer einzigartiger Spielerlebnisse • Web & Mobile Apps • Brettspiele der neuen Generation",
      it: "Creatore di esperienze videoludiche uniche • App Web e Mobile • Giochi da Tavolo di Nuova Generazione",
      pt: "Criador de experiências de jogo únicas • Apps Web e Mobile • Jogos de Tabuleiro de Nova Geração",
      nl: "Maker van unieke game-ervaringen • Web & Mobiele Apps • Bordspellen van de Nieuwe Generatie"
    },
    hero_cta: {
      fr: "Découvrir nos Jeux",
      en: "Discover Our Games",
      es: "Descubrir Nuestros Juegos",
      de: "Unsere Spiele Entdecken",
      it: "Scopri i Nostri Giochi",
      pt: "Descobrir Nossos Jogos",
      nl: "Ontdek Onze Spellen"
    },
    stat_game: {
      fr: "Jeu Phare", en: "Flagship Game", es: "Juego Estrella", de: "Flaggschiff-Spiel", it: "Gioco di Punta", pt: "Jogo Principal", nl: "Vlaggenschip"
    },
    stat_universes: {
      fr: "Univers", en: "Universes", es: "Universos", de: "Universen", it: "Universi", pt: "Universos", nl: "Universums"
    },
    stat_possibilities: {
      fr: "Possibilités", en: "Possibilities", es: "Posibilidades", de: "Möglichkeiten", it: "Possibilità", pt: "Possibilidades", nl: "Mogelijkheden"
    },

    // About Section
    about_badge: {
      fr: "Notre Mission", en: "Our Mission", es: "Nuestra Misión", de: "Unsere Mission", it: "La Nostra Missione", pt: "Nossa Missão", nl: "Onze Missie"
    },
    about_title: {
      fr: "Créateur de Contenu Vidéoludique",
      en: "Video Game Content Creator",
      es: "Creador de Contenido Videoludico",
      de: "Videospiel-Inhalte-Ersteller",
      it: "Creatore di Contenuti Videoludici",
      pt: "Criador de Conteúdo de Videogames",
      nl: "Videogame Content Creator"
    },
    about_card1_title: {
      fr: "Applications Web & Mobile", en: "Web & Mobile Apps", es: "Apps Web y Móvil", de: "Web & Mobile Apps", it: "App Web e Mobile", pt: "Apps Web e Mobile", nl: "Web & Mobiele Apps"
    },
    about_card1_desc: {
      fr: "Des expériences de jeu accessibles partout, sur tous vos appareils. Technologies modernes pour une fluidité optimale.",
      en: "Gaming experiences accessible everywhere, on all your devices. Modern technologies for optimal fluidity.",
      es: "Experiencias de juego accesibles en todas partes, en todos tus dispositivos. Tecnologías modernas para una fluidez óptima.",
      de: "Spielerlebnisse überall zugänglich, auf allen Ihren Geräten. Moderne Technologien für optimale Flüssigkeit.",
      it: "Esperienze di gioco accessibili ovunque, su tutti i tuoi dispositivi. Tecnologie moderne per una fluidità ottimale.",
      pt: "Experiências de jogo acessíveis em qualquer lugar, em todos os seus dispositivos. Tecnologias modernas para fluidez ideal.",
      nl: "Game-ervaringen overal toegankelijk, op al je apparaten. Moderne technologieën voor optimale vloeiendheid."
    },
    about_card2_title: {
      fr: "Jeux de Société Digitaux", en: "Digital Board Games", es: "Juegos de Mesa Digitales", de: "Digitale Brettspiele", it: "Giochi da Tavolo Digitali", pt: "Jogos de Tabuleiro Digitais", nl: "Digitale Bordspellen"
    },
    about_card2_desc: {
      fr: "L'esprit convivial des jeux de société combiné à la puissance du digital. Jouez avec vos amis où que vous soyez.",
      en: "The friendly spirit of board games combined with digital power. Play with your friends wherever you are.",
      es: "El espíritu amigable de los juegos de mesa combinado con el poder digital. Juega con tus amigos donde quiera que estés.",
      de: "Der freundschaftliche Geist von Brettspielen kombiniert mit digitaler Kraft. Spielen Sie mit Ihren Freunden, wo immer Sie sind.",
      it: "Lo spirito conviviale dei giochi da tavolo combinato con la potenza del digitale. Gioca con i tuoi amici ovunque tu sia.",
      pt: "O espírito amigável dos jogos de tabuleiro combinado com o poder digital. Jogue com seus amigos onde quer que esteja.",
      nl: "De gezellige sfeer van bordspellen gecombineerd met digitale kracht. Speel met je vrienden waar je ook bent."
    },
    about_card3_title: {
      fr: "Univers Immersifs", en: "Immersive Universes", es: "Universos Inmersivos", de: "Immersive Universen", it: "Universi Immersivi", pt: "Universos Imersivos", nl: "Meeslepende Universums"
    },
    about_card3_desc: {
      fr: "4 thèmes riches avec visio intégrée : Spatial, Loup-Garou, Académie des Sorciers, Royaumes Mythiques.",
      en: "4 rich themes with integrated video: Space, Werewolf, Wizard Academy, Mythic Realms.",
      es: "4 temas ricos con video integrado: Espacial, Hombre Lobo, Academia de Magos, Reinos Míticos.",
      de: "4 reichhaltige Themen mit integriertem Video: Weltraum, Werwolf, Zaubererakademie, Mythische Reiche.",
      it: "4 temi ricchi con video integrato: Spaziale, Lupo Mannaro, Accademia dei Maghi, Regni Mitici.",
      pt: "4 temas ricos com vídeo integrado: Espacial, Lobisomem, Academia de Bruxos, Reinos Míticos.",
      nl: "4 rijke thema's met geïntegreerde video: Ruimte, Weerwolf, Tovenaarsacademie, Mythische Rijken."
    },
    philosophy_title: {
      fr: "Notre Philosophie", en: "Our Philosophy", es: "Nuestra Filosofía", de: "Unsere Philosophie", it: "La Nostra Filosofia", pt: "Nossa Filosofia", nl: "Onze Filosofie"
    },
    philosophy_text1: {
      fr: "Comme un guerrier qui perfectionne son art à travers trois sabres, nous créons des expériences à travers trois piliers : Innovation, Qualité, et Communauté.",
      en: "Like a warrior who perfects their art through three swords, we create experiences through three pillars: Innovation, Quality, and Community.",
      es: "Como un guerrero que perfecciona su arte a través de tres espadas, creamos experiencias a través de tres pilares: Innovación, Calidad y Comunidad.",
      de: "Wie ein Krieger, der seine Kunst durch drei Schwerter perfektioniert, erschaffen wir Erlebnisse durch drei Säulen: Innovation, Qualität und Gemeinschaft.",
      it: "Come un guerriero che perfeziona la sua arte attraverso tre spade, creiamo esperienze attraverso tre pilastri: Innovazione, Qualità e Comunità.",
      pt: "Como um guerreiro que aperfeiçoa sua arte através de três espadas, criamos experiências através de três pilares: Inovação, Qualidade e Comunidade.",
      nl: "Zoals een krijger die zijn kunst perfectioneert door drie zwaarden, creëren wij ervaringen door drie pijlers: Innovatie, Kwaliteit en Gemeenschap."
    },
    philosophy_text2: {
      fr: "Chaque jeu est conçu pour rassembler, divertir et créer des moments inoubliables. Notre ambition : devenir le studio de référence pour les jeux sociaux nouvelle génération.",
      en: "Each game is designed to bring together, entertain and create unforgettable moments. Our ambition: to become the reference studio for next-generation social games.",
      es: "Cada juego está diseñado para reunir, entretener y crear momentos inolvidables. Nuestra ambición: convertirnos en el estudio de referencia para juegos sociales de nueva generación.",
      de: "Jedes Spiel ist darauf ausgelegt, zusammenzubringen, zu unterhalten und unvergessliche Momente zu schaffen. Unser Ziel: das Referenzstudio für Social Games der nächsten Generation zu werden.",
      it: "Ogni gioco è progettato per riunire, intrattenere e creare momenti indimenticabili. La nostra ambizione: diventare lo studio di riferimento per i giochi sociali di nuova generazione.",
      pt: "Cada jogo é projetado para reunir, entreter e criar momentos inesquecíveis. Nossa ambição: tornar-se o estúdio de referência para jogos sociais de nova geração.",
      nl: "Elk spel is ontworpen om samen te brengen, te vermaken en onvergetelijke momenten te creëren. Onze ambitie: het referentiestudio worden voor sociale spellen van de nieuwe generatie."
    },

    // Featured Game
    featured_badge: {
      fr: "Jeu Phare", en: "Flagship Game", es: "Juego Estrella", de: "Flaggschiff-Spiel", it: "Gioco di Punta", pt: "Jogo Principal", nl: "Vlaggenschip"
    },
    featured_title: {
      fr: "Saboteurs : Le Jeu Social Ultime",
      en: "Saboteurs: The Ultimate Social Game",
      es: "Saboteadores: El Juego Social Definitivo",
      de: "Saboteure: Das ultimative Soziale Spiel",
      it: "Sabotatori: Il Gioco Sociale Definitivo",
      pt: "Sabotadores: O Jogo Social Definitivo",
      nl: "Saboteurs: Het Ultieme Sociale Spel"
    },
    featured_subtitle: {
      fr: "4 Univers • Stratégie & Déduction",
      en: "4 Universes • Strategy & Deduction",
      es: "4 Universos • Estrategia y Deducción",
      de: "4 Universen • Strategie & Deduktion",
      it: "4 Universi • Strategia e Deduzione",
      pt: "4 Universos • Estratégia e Dedução",
      nl: "4 Universums • Strategie & Deductie"
    },
    featured_desc: {
      fr: "Infiltrez-vous dans une équipe, déjouez les saboteurs, et menez votre camp à la victoire. Un jeu de rôle social addictif avec visioconférence intégrée et avatars IA personnalisés.",
      en: "Infiltrate a team, outsmart the saboteurs, and lead your side to victory. An addictive social role-playing game with integrated video conferencing and personalized AI avatars.",
      es: "Infiltra un equipo, supera a los saboteadores y lleva a tu bando a la victoria. Un juego de rol social adictivo con videoconferencia integrada y avatares IA personalizados.",
      de: "Infiltrieren Sie ein Team, überlisten Sie die Saboteure und führen Sie Ihre Seite zum Sieg. Ein süchtig machendes soziales Rollenspiel mit integrierter Videokonferenz und personalisierten KI-Avataren.",
      it: "Infiltrati in una squadra, supera in astuzia i sabotatori e porta la tua parte alla vittoria. Un gioco di ruolo sociale avvincente con videoconferenza integrata e avatar IA personalizzati.",
      pt: "Infiltre-se em uma equipe, supere os sabotadores e leve seu lado à vitória. Um jogo de RPG social viciante com videoconferência integrada e avatares de IA personalizados.",
      nl: "Infiltreer een team, slim de saboteurs af en leid je kant naar de overwinning. Een verslavend sociaal rollenspel met geïntegreerde videoconferentie en gepersonaliseerde AI-avatars."
    }
  },

  // ============================================================================
  // PAGE PRODUITS (products.html)
  // ============================================================================
  products: {
    hero_badge: {
      fr: "Notre Jeu Phare", en: "Our Flagship Game", es: "Nuestro Juego Estrella", de: "Unser Flaggschiff-Spiel", it: "Il Nostro Gioco di Punta", pt: "Nosso Jogo Principal", nl: "Ons Vlaggenschip"
    },
    hero_title: {
      fr: "LES SABOTEURS", en: "THE SABOTEURS", es: "LOS SABOTEADORES", de: "DIE SABOTEURE", it: "I SABOTATORI", pt: "OS SABOTADORES", nl: "DE SABOTEURS"
    },
    hero_tagline: {
      fr: "Infiltration • Déduction • Multijoueur",
      en: "Infiltration • Deduction • Multiplayer",
      es: "Infiltración • Deducción • Multijugador",
      de: "Infiltration • Deduktion • Mehrspieler",
      it: "Infiltrazione • Deduzione • Multigiocatore",
      pt: "Infiltração • Dedução • Multijogador",
      nl: "Infiltratie • Deductie • Multiplayer"
    },
    play_now: {
      fr: "🎮 Jouer Maintenant", en: "🎮 Play Now", es: "🎮 Jugar Ahora", de: "🎮 Jetzt Spielen", it: "🎮 Gioca Ora", pt: "🎮 Jogar Agora", nl: "🎮 Nu Spelen"
    },
    discover_packs: {
      fr: "💎 Découvrir les Packs", en: "💎 Discover Packs", es: "💎 Descubrir Packs", de: "💎 Packs Entdecken", it: "💎 Scopri i Pack", pt: "💎 Descobrir Packs", nl: "💎 Packs Ontdekken"
    },
    the_game: {
      fr: "Le Jeu", en: "The Game", es: "El Juego", de: "Das Spiel", it: "Il Gioco", pt: "O Jogo", nl: "Het Spel"
    },
    game_desc_1: {
      fr: "Les Saboteurs est un jeu de déduction sociale multijoueur qui plonge les joueurs dans une station spatiale en perdition.",
      en: "The Saboteurs is a multiplayer social deduction game that immerses players in a distressed space station.",
      es: "Los Saboteadores es un juego de deducción social multijugador que sumerge a los jugadores en una estación espacial en peligro.",
      de: "Die Saboteure ist ein Multiplayer-Sozialdeduktionsspiel, das Spieler in eine notleidende Raumstation eintauchen lässt.",
      it: "I Sabotatori è un gioco di deduzione sociale multiplayer che immerge i giocatori in una stazione spaziale in difficoltà.",
      pt: "Os Sabotadores é um jogo de dedução social multiplayer que mergulha os jogadores em uma estação espacial em perigo.",
      nl: "De Saboteurs is een multiplayer sociaal deductiespel dat spelers onderdompelt in een ruimtestation in nood."
    },
    
    // Features
    feature_players: { fr: "6-12 Joueurs", en: "6-12 Players", es: "6-12 Jugadores", de: "6-12 Spieler", it: "6-12 Giocatori", pt: "6-12 Jogadores", nl: "6-12 Spelers" },
    feature_players_desc: { fr: "6-9 sur mobile / 6-12 sur PC", en: "6-9 on mobile / 6-12 on PC", es: "6-9 en móvil / 6-12 en PC", de: "6-9 auf Handy / 6-12 auf PC", it: "6-9 su mobile / 6-12 su PC", pt: "6-9 no celular / 6-12 no PC", nl: "6-9 op mobiel / 6-12 op PC" },
    feature_themes: { fr: "Thèmes & Rôles", en: "Themes & Roles", es: "Temas y Roles", de: "Themen & Rollen", it: "Temi e Ruoli", pt: "Temas e Funções", nl: "Thema's & Rollen" },
    feature_themes_desc: { fr: "4 univers, rôles variés et spéciaux", en: "4 universes, varied and special roles", es: "4 universos, roles variados y especiales", de: "4 Universen, vielfältige und spezielle Rollen", it: "4 universi, ruoli vari e speciali", pt: "4 universos, funções variadas e especiais", nl: "4 universums, gevarieerde en speciale rollen" },
    feature_video: { fr: "Visio Intégrée", en: "Integrated Video", es: "Video Integrado", de: "Integriertes Video", it: "Video Integrato", pt: "Vídeo Integrado", nl: "Geïntegreerde Video" },
    feature_video_desc: { fr: "Sans téléchargement, mobile & PC", en: "No download, mobile & PC", es: "Sin descarga, móvil y PC", de: "Kein Download, Handy & PC", it: "Senza download, mobile e PC", pt: "Sem download, celular e PC", nl: "Geen download, mobiel & PC" },
    feature_duration: { fr: "15-45 Minutes", en: "15-45 Minutes", es: "15-45 Minutos", de: "15-45 Minuten", it: "15-45 Minuti", pt: "15-45 Minutos", nl: "15-45 Minuten" },
    feature_duration_desc: { fr: "Parties rapides et dynamiques", en: "Fast and dynamic games", es: "Partidas rápidas y dinámicas", de: "Schnelle und dynamische Spiele", it: "Partite veloci e dinamiche", pt: "Partidas rápidas e dinâmicas", nl: "Snelle en dynamische spellen" },
    feature_languages: { fr: "7 Langues", en: "7 Languages", es: "7 Idiomas", de: "7 Sprachen", it: "7 Lingue", pt: "7 Idiomas", nl: "7 Talen" },
    
    // Themes
    themes_badge: { fr: "Univers", en: "Universes", es: "Universos", de: "Universen", it: "Universi", pt: "Universos", nl: "Universums" },
    themes_title: { fr: "4 Thèmes Immersifs", en: "4 Immersive Themes", es: "4 Temas Inmersivos", de: "4 Immersive Themen", it: "4 Temi Immersivi", pt: "4 Temas Imersivos", nl: "4 Meeslepende Thema's" },
    theme_space_title: { fr: "Infiltration Spatiale", en: "Space Infiltration", es: "Infiltración Espacial", de: "Weltraum-Infiltration", it: "Infiltrazione Spaziale", pt: "Infiltração Espacial", nl: "Ruimte-Infiltratie" },
    theme_space_desc: {
      fr: "L'univers classique : une station spatiale, des astronautes, des saboteurs. Réparez la station avant qu'il ne soit trop tard !",
      en: "The classic universe: a space station, astronauts, saboteurs. Repair the station before it's too late!",
      es: "El universo clásico: una estación espacial, astronautas, saboteadores. ¡Repara la estación antes de que sea tarde!",
      de: "Das klassische Universum: eine Raumstation, Astronauten, Saboteure. Reparieren Sie die Station, bevor es zu spät ist!",
      it: "L'universo classico: una stazione spaziale, astronauti, sabotatori. Ripara la stazione prima che sia troppo tardi!",
      pt: "O universo clássico: uma estação espacial, astronautas, sabotadores. Repare a estação antes que seja tarde!",
      nl: "Het klassieke universum: een ruimtestation, astronauten, saboteurs. Repareer het station voordat het te laat is!"
    },
    theme_werewolf_title: { fr: "Loup-Garou", en: "Werewolf", es: "Hombre Lobo", de: "Werwolf", it: "Lupo Mannaro", pt: "Lobisomem", nl: "Weerwolf" },
    theme_werewolf_desc: {
      fr: "Un village médiéval hanté par les loups-garous. Villageois contre créatures de la nuit.",
      en: "A medieval village haunted by werewolves. Villagers against creatures of the night.",
      es: "Un pueblo medieval embrujado por hombres lobo. Aldeanos contra criaturas de la noche.",
      de: "Ein mittelalterliches Dorf, das von Werwölfen heimgesucht wird. Dorfbewohner gegen Kreaturen der Nacht.",
      it: "Un villaggio medievale infestato dai lupi mannari. Villici contro creature della notte.",
      pt: "Uma aldeia medieval assombrada por lobisomens. Aldeões contra criaturas da noite.",
      nl: "Een middeleeuws dorp achtervolgd door weerwolven. Dorpelingen tegen wezens van de nacht."
    },
    theme_wizard_title: { fr: "Académie des Sorciers", en: "Wizard Academy", es: "Academia de Magos", de: "Zaubererakademie", it: "Accademia dei Maghi", pt: "Academia de Bruxos", nl: "Tovenaarsacademie" },
    theme_wizard_desc: {
      fr: "Une école de magie infiltrée par des sorciers noirs. Maîtrisez la magie pour démasquer les traîtres !",
      en: "A magic school infiltrated by dark wizards. Master magic to unmask the traitors!",
      es: "Una escuela de magia infiltrada por magos oscuros. ¡Domina la magia para desenmascarar a los traidores!",
      de: "Eine Zauberschule, die von dunklen Zauberern infiltriert wurde. Beherrsche die Magie, um die Verräter zu entlarven!",
      it: "Una scuola di magia infiltrata da maghi oscuri. Padroneggia la magia per smascherare i traditori!",
      pt: "Uma escola de magia infiltrada por bruxos das trevas. Domine a magia para desmascarar os traidores!",
      nl: "Een magische school geïnfiltreerd door duistere tovenaars. Beheers magie om de verraders te ontmaskeren!"
    },
    theme_mythic_title: { fr: "Royaumes Mythiques", en: "Mythic Realms", es: "Reinos Míticos", de: "Mythische Reiche", it: "Regni Mitici", pt: "Reinos Míticos", nl: "Mythische Rijken" },
    theme_mythic_desc: {
      fr: "L'Olympe est menacé par les Titans. Dieux et héros doivent identifier les traîtres.",
      en: "Olympus is threatened by the Titans. Gods and heroes must identify the traitors.",
      es: "El Olimpo está amenazado por los Titanes. Dioses y héroes deben identificar a los traidores.",
      de: "Der Olymp wird von den Titanen bedroht. Götter und Helden müssen die Verräter identifizieren.",
      it: "L'Olimpo è minacciato dai Titani. Dei ed eroi devono identificare i traditori.",
      pt: "O Olimpo está ameaçado pelos Titãs. Deuses e heróis devem identificar os traidores.",
      nl: "De Olympus wordt bedreigd door de Titanen. Goden en helden moeten de verraders identificeren."
    }
  },

  // ============================================================================
  // PACKS & TARIFS
  // ============================================================================
  packs: {
    title: { fr: "💎 Nos Packs Premium", en: "💎 Our Premium Packs", es: "💎 Nuestros Packs Premium", de: "💎 Unsere Premium-Pakete", it: "💎 I Nostri Pack Premium", pt: "💎 Nossos Packs Premium", nl: "💎 Onze Premium Packs" },
    verified_required: {
      fr: "Compte vérifié requis pour accéder aux packs",
      en: "Verified account required to access packs",
      es: "Cuenta verificada requerida para acceder a los packs",
      de: "Verifiziertes Konto erforderlich, um auf Pakete zuzugreifen",
      it: "Account verificato richiesto per accedere ai pack",
      pt: "Conta verificada necessária para acessar os packs",
      nl: "Geverifieerd account vereist om toegang te krijgen tot packs"
    },
    
    // Pack 50+50
    pack50_badge: { fr: "PONCTUEL", en: "ONE-TIME", es: "PUNTUAL", de: "EINMALIG", it: "UNA TANTUM", pt: "PONTUAL", nl: "EENMALIG" },
    pack50_title: { fr: "Pack 50+50", en: "Pack 50+50", es: "Pack 50+50", de: "Pack 50+50", it: "Pack 50+50", pt: "Pack 50+50", nl: "Pack 50+50" },
    pack50_price: { fr: "4,99€", en: "€4.99", es: "4,99€", de: "4,99€", it: "4,99€", pt: "4,99€", nl: "€4,99" },
    pack50_period: { fr: "une fois", en: "one-time", es: "una vez", de: "einmalig", it: "una volta", pt: "uma vez", nl: "eenmalig" },
    pack50_feature1: { fr: "✅ 50 crédits vidéo", en: "✅ 50 video credits", es: "✅ 50 créditos de video", de: "✅ 50 Video-Credits", it: "✅ 50 crediti video", pt: "✅ 50 créditos de vídeo", nl: "✅ 50 video credits" },
    pack50_feature2: { fr: "✅ 50 avatars IA", en: "✅ 50 AI avatars", es: "✅ 50 avatares IA", de: "✅ 50 KI-Avatare", it: "✅ 50 avatar IA", pt: "✅ 50 avatares IA", nl: "✅ 50 AI-avatars" },
    pack50_feature3: { fr: "✅ Valables 12 mois", en: "✅ Valid 12 months", es: "✅ Válidos 12 meses", de: "✅ 12 Monate gültig", it: "✅ Validi 12 mesi", pt: "✅ Válidos por 12 meses", nl: "✅ 12 maanden geldig" },
    pack50_feature4: { fr: "✅ Tous les thèmes", en: "✅ All themes", es: "✅ Todos los temas", de: "✅ Alle Themen", it: "✅ Tutti i temi", pt: "✅ Todos os temas", nl: "✅ Alle thema's" },
    pack50_feature5: { fr: "✅ Support prioritaire", en: "✅ Priority support", es: "✅ Soporte prioritario", de: "✅ Prioritäts-Support", it: "✅ Supporto prioritario", pt: "✅ Suporte prioritário", nl: "✅ Prioriteitsondersteuning" },
    pack50_cta: { fr: "🛒 Acheter maintenant", en: "🛒 Buy now", es: "🛒 Comprar ahora", de: "🛒 Jetzt kaufen", it: "🛒 Acquista ora", pt: "🛒 Comprar agora", nl: "🛒 Nu kopen" },
    
    // Premium
    premium_badge: { fr: "⭐ POPULAIRE", en: "⭐ POPULAR", es: "⭐ POPULAR", de: "⭐ BELIEBT", it: "⭐ POPOLARE", pt: "⭐ POPULAR", nl: "⭐ POPULAIR" },
    premium_title: { fr: "Premium", en: "Premium", es: "Premium", de: "Premium", it: "Premium", pt: "Premium", nl: "Premium" },
    premium_price: { fr: "1,49€", en: "€1.49", es: "1,49€", de: "1,49€", it: "1,49€", pt: "1,49€", nl: "€1,49" },
    premium_period: { fr: "/mois", en: "/month", es: "/mes", de: "/Monat", it: "/mese", pt: "/mês", nl: "/maand" },
    premium_feature1: { fr: "✅ Visio illimitée", en: "✅ Unlimited video", es: "✅ Video ilimitado", de: "✅ Unbegrenztes Video", it: "✅ Video illimitato", pt: "✅ Vídeo ilimitado", nl: "✅ Onbeperkte video" },
    premium_feature2: { fr: "✅ 30 avatars IA/mois", en: "✅ 30 AI avatars/month", es: "✅ 30 avatares IA/mes", de: "✅ 30 KI-Avatare/Monat", it: "✅ 30 avatar IA/mese", pt: "✅ 30 avatares IA/mês", nl: "✅ 30 AI-avatars/maand" },
    premium_feature3: { fr: "✅ 4 thèmes complets", en: "✅ 4 complete themes", es: "✅ 4 temas completos", de: "✅ 4 vollständige Themen", it: "✅ 4 temi completi", pt: "✅ 4 temas completos", nl: "✅ 4 volledige thema's" },
    premium_feature4: { fr: "✅ Badge exclusif", en: "✅ Exclusive badge", es: "✅ Insignia exclusiva", de: "✅ Exklusives Abzeichen", it: "✅ Badge esclusivo", pt: "✅ Distintivo exclusivo", nl: "✅ Exclusieve badge" },
    premium_feature5: { fr: "✅ Support VIP 24/7", en: "✅ VIP support 24/7", es: "✅ Soporte VIP 24/7", de: "✅ VIP-Support 24/7", it: "✅ Supporto VIP 24/7", pt: "✅ Suporte VIP 24/7", nl: "✅ VIP-ondersteuning 24/7" },
    premium_cta: { fr: "🚀 S'abonner", en: "🚀 Subscribe", es: "🚀 Suscribirse", de: "🚀 Abonnieren", it: "🚀 Abbonati", pt: "🚀 Assinar", nl: "🚀 Abonneren" },
    
    // Pack Famille
    family_badge: { fr: "FAMILLE", en: "FAMILY", es: "FAMILIA", de: "FAMILIE", it: "FAMIGLIA", pt: "FAMÍLIA", nl: "FAMILIE" },
    family_title: { fr: "Pack Famille", en: "Family Pack", es: "Pack Familia", de: "Familienpaket", it: "Pack Famiglia", pt: "Pack Família", nl: "Familiepakket" },
    family_price: { fr: "9,99€", en: "€9.99", es: "9,99€", de: "9,99€", it: "9,99€", pt: "9,99€", nl: "€9,99" },
    family_feature1: { fr: "✅ Jusqu'à 9 comptes", en: "✅ Up to 9 accounts", es: "✅ Hasta 9 cuentas", de: "✅ Bis zu 9 Konten", it: "✅ Fino a 9 account", pt: "✅ Até 9 contas", nl: "✅ Tot 9 accounts" },
    family_feature2: { fr: "✅ Visio illimitée pour tous", en: "✅ Unlimited video for all", es: "✅ Video ilimitado para todos", de: "✅ Unbegrenztes Video für alle", it: "✅ Video illimitato per tutti", pt: "✅ Vídeo ilimitado para todos", nl: "✅ Onbeperkte video voor iedereen" },
    family_feature3: { fr: "✅ 30 avatars/mois par utilisateur", en: "✅ 30 avatars/month per user", es: "✅ 30 avatares/mes por usuario", de: "✅ 30 Avatare/Monat pro Benutzer", it: "✅ 30 avatar/mese per utente", pt: "✅ 30 avatares/mês por usuário", nl: "✅ 30 avatars/maand per gebruiker" },
    family_feature4: { fr: "✅ Gestion centralisée", en: "✅ Centralized management", es: "✅ Gestión centralizada", de: "✅ Zentrale Verwaltung", it: "✅ Gestione centralizzata", pt: "✅ Gestão centralizada", nl: "✅ Gecentraliseerd beheer" },
    family_feature5: { fr: "✅ Économie de 85%", en: "✅ 85% savings", es: "✅ Ahorro del 85%", de: "✅ 85% Ersparnis", it: "✅ Risparmio dell'85%", pt: "✅ Economia de 85%", nl: "✅ 85% besparing" },
    family_cta: { fr: "👨‍👩‍👧‍👦 S'abonner en famille", en: "👨‍👩‍👧‍👦 Subscribe as family", es: "👨‍👩‍👧‍👦 Suscribirse en familia", de: "👨‍👩‍👧‍👦 Als Familie abonnieren", it: "👨‍👩‍👧‍👦 Abbonati in famiglia", pt: "👨‍👩‍👧‍👦 Assinar em família", nl: "👨‍👩‍👧‍👦 Abonneren als familie" },
    
    // Promo code
    promo_label: { fr: "🎁 Tu as un code promo ?", en: "🎁 Do you have a promo code?", es: "🎁 ¿Tienes un código promocional?", de: "🎁 Hast du einen Promo-Code?", it: "🎁 Hai un codice promozionale?", pt: "🎁 Você tem um código promocional?", nl: "🎁 Heb je een promotiecode?" },
    promo_placeholder: { fr: "Entre ton code ici", en: "Enter your code here", es: "Ingresa tu código aquí", de: "Gib deinen Code hier ein", it: "Inserisci il tuo codice qui", pt: "Digite seu código aqui", nl: "Voer je code hier in" },
    promo_validate: { fr: "Valider", en: "Validate", es: "Validar", de: "Bestätigen", it: "Convalida", pt: "Validar", nl: "Valideren" },
    
    // Footer modal
    payment_secure: {
      fr: "🔒 Paiement sécurisé via Stripe • 💳 CB, Apple Pay, Google Pay acceptés • 🔄 Annulation à tout moment",
      en: "🔒 Secure payment via Stripe • 💳 Card, Apple Pay, Google Pay accepted • 🔄 Cancel anytime",
      es: "🔒 Pago seguro vía Stripe • 💳 Tarjeta, Apple Pay, Google Pay aceptados • 🔄 Cancelar en cualquier momento",
      de: "🔒 Sichere Zahlung über Stripe • 💳 Karte, Apple Pay, Google Pay akzeptiert • 🔄 Jederzeit kündbar",
      it: "🔒 Pagamento sicuro tramite Stripe • 💳 Carta, Apple Pay, Google Pay accettati • 🔄 Annulla in qualsiasi momento",
      pt: "🔒 Pagamento seguro via Stripe • 💳 Cartão, Apple Pay, Google Pay aceitos • 🔄 Cancelar a qualquer momento",
      nl: "🔒 Veilige betaling via Stripe • 💳 Kaart, Apple Pay, Google Pay geaccepteerd • 🔄 Op elk moment opzeggen"
    }
  },

  // ============================================================================
  // AUTHENTIFICATION (Login/Register)
  // ============================================================================
  auth: {
    login_title: { fr: "Connexion", en: "Login", es: "Iniciar Sesión", de: "Anmeldung", it: "Accesso", pt: "Login", nl: "Inloggen" },
    login_subtitle: {
      fr: "Accédez à votre compte RORONOA GAMES",
      en: "Access your RORONOA GAMES account",
      es: "Accede a tu cuenta RORONOA GAMES",
      de: "Greifen Sie auf Ihr RORONOA GAMES-Konto zu",
      it: "Accedi al tuo account RORONOA GAMES",
      pt: "Acesse sua conta RORONOA GAMES",
      nl: "Toegang tot je RORONOA GAMES-account"
    },
    register_title: { fr: "Inscription", en: "Sign Up", es: "Registro", de: "Registrierung", it: "Registrazione", pt: "Cadastro", nl: "Registratie" },
    tab_login: { fr: "Connexion", en: "Login", es: "Iniciar Sesión", de: "Anmelden", it: "Accesso", pt: "Entrar", nl: "Inloggen" },
    tab_register: { fr: "Inscription", en: "Sign Up", es: "Registro", de: "Registrieren", it: "Registrati", pt: "Cadastrar", nl: "Registreren" },
    email_placeholder: { fr: "Email", en: "Email", es: "Correo electrónico", de: "E-Mail", it: "Email", pt: "E-mail", nl: "E-mail" },
    password_placeholder: { fr: "Mot de passe", en: "Password", es: "Contraseña", de: "Passwort", it: "Password", pt: "Senha", nl: "Wachtwoord" },
    username_placeholder: { fr: "Pseudo", en: "Username", es: "Nombre de usuario", de: "Benutzername", it: "Nome utente", pt: "Nome de usuário", nl: "Gebruikersnaam" },
    confirm_password_placeholder: { fr: "Confirmer mot de passe", en: "Confirm password", es: "Confirmar contraseña", de: "Passwort bestätigen", it: "Conferma password", pt: "Confirmar senha", nl: "Wachtwoord bevestigen" },
    login_btn: { fr: "Se Connecter", en: "Log In", es: "Iniciar Sesión", de: "Anmelden", it: "Accedi", pt: "Entrar", nl: "Inloggen" },
    register_btn: { fr: "S'Inscrire", en: "Sign Up", es: "Registrarse", de: "Registrieren", it: "Registrati", pt: "Cadastrar", nl: "Registreren" },
    forgot_password: { fr: "Mot de passe oublié ?", en: "Forgot password?", es: "¿Olvidaste tu contraseña?", de: "Passwort vergessen?", it: "Password dimenticata?", pt: "Esqueceu a senha?", nl: "Wachtwoord vergeten?" },
    account_created_info: { fr: "Compte créé pour accéder aux produits", en: "Account created to access products", es: "Cuenta creada para acceder a los productos", de: "Konto erstellt, um auf Produkte zuzugreifen", it: "Account creato per accedere ai prodotti", pt: "Conta criada para acessar os produtos", nl: "Account aangemaakt om toegang te krijgen tot producten" }
  },

  // ============================================================================
  // FOOTER
  // ============================================================================
  footer: {
    description: {
      fr: "Studio indépendant de création de jeux sociaux nouvelle génération.",
      en: "Independent studio creating next-generation social games.",
      es: "Estudio independiente de creación de juegos sociales de nueva generación.",
      de: "Unabhängiges Studio für Social Games der neuen Generation.",
      it: "Studio indipendente di creazione di giochi sociali di nuova generazione.",
      pt: "Estúdio independente de criação de jogos sociais de nova geração.",
      nl: "Onafhankelijke studio voor sociale spellen van de nieuwe generatie."
    },
    quick_links: { fr: "Navigation", en: "Quick Links", es: "Enlaces Rápidos", de: "Schnelllinks", it: "Link Rapidi", pt: "Links Rápidos", nl: "Snelle Links" },
    legal: { fr: "Légal", en: "Legal", es: "Legal", de: "Rechtliches", it: "Legale", pt: "Legal", nl: "Juridisch" },
    privacy_policy: { fr: "Politique de Confidentialité", en: "Privacy Policy", es: "Política de Privacidad", de: "Datenschutzrichtlinie", it: "Informativa sulla Privacy", pt: "Política de Privacidade", nl: "Privacybeleid" },
    terms_of_service: { fr: "Conditions d'Utilisation", en: "Terms of Service", es: "Términos de Servicio", de: "Nutzungsbedingungen", it: "Termini di Servizio", pt: "Termos de Serviço", nl: "Servicevoorwaarden" },
    legal_notice: { fr: "Mentions Légales", en: "Legal Notice", es: "Aviso Legal", de: "Impressum", it: "Note Legali", pt: "Aviso Legal", nl: "Juridische Kennisgeving" },
    copyright: {
      fr: "© 2026 RORONOA GAMES. Tous droits réservés.",
      en: "© 2026 RORONOA GAMES. All rights reserved.",
      es: "© 2026 RORONOA GAMES. Todos los derechos reservados.",
      de: "© 2026 RORONOA GAMES. Alle Rechte vorbehalten.",
      it: "© 2026 RORONOA GAMES. Tutti i diritti riservati.",
      pt: "© 2026 RORONOA GAMES. Todos os direitos reservados.",
      nl: "© 2026 RORONOA GAMES. Alle rechten voorbehouden."
    }
  },

  // ============================================================================
  // CONTACT
  // ============================================================================
  contact: {
    title: { fr: "Contact", en: "Contact", es: "Contacto", de: "Kontakt", it: "Contatto", pt: "Contato", nl: "Contact" },
    subtitle: {
      fr: "Une question ? Un partenariat ? Contactez-nous !",
      en: "A question? A partnership? Contact us!",
      es: "¿Una pregunta? ¿Una asociación? ¡Contáctanos!",
      de: "Eine Frage? Eine Partnerschaft? Kontaktieren Sie uns!",
      it: "Una domanda? Una partnership? Contattaci!",
      pt: "Uma pergunta? Uma parceria? Entre em contato!",
      nl: "Een vraag? Een partnerschap? Neem contact met ons op!"
    },
    name_placeholder: { fr: "Votre nom", en: "Your name", es: "Tu nombre", de: "Ihr Name", it: "Il tuo nome", pt: "Seu nome", nl: "Je naam" },
    email_placeholder: { fr: "Votre email", en: "Your email", es: "Tu correo", de: "Ihre E-Mail", it: "La tua email", pt: "Seu e-mail", nl: "Je e-mail" },
    subject_placeholder: { fr: "Sujet du message", en: "Message subject", es: "Asunto del mensaje", de: "Betreff", it: "Oggetto del messaggio", pt: "Assunto da mensagem", nl: "Onderwerp" },
    subject_support: { fr: "Support technique", en: "Technical support", es: "Soporte técnico", de: "Technischer Support", it: "Supporto tecnico", pt: "Suporte técnico", nl: "Technische ondersteuning" },
    subject_commercial: { fr: "Question commerciale", en: "Commercial question", es: "Pregunta comercial", de: "Kommerzielle Frage", it: "Domanda commerciale", pt: "Pergunta comercial", nl: "Commerciële vraag" },
    subject_partnership: { fr: "Partenariat", en: "Partnership", es: "Asociación", de: "Partnerschaft", it: "Partnership", pt: "Parceria", nl: "Partnerschap" },
    subject_other: { fr: "Autre", en: "Other", es: "Otro", de: "Andere", it: "Altro", pt: "Outro", nl: "Anders" },
    message_placeholder: { fr: "Votre message", en: "Your message", es: "Tu mensaje", de: "Ihre Nachricht", it: "Il tuo messaggio", pt: "Sua mensagem", nl: "Je bericht" },
    send_btn: { fr: "Envoyer", en: "Send", es: "Enviar", de: "Senden", it: "Invia", pt: "Enviar", nl: "Verzenden" },
    success_message: { fr: "Message envoyé avec succès !", en: "Message sent successfully!", es: "¡Mensaje enviado con éxito!", de: "Nachricht erfolgreich gesendet!", it: "Messaggio inviato con successo!", pt: "Mensagem enviada com sucesso!", nl: "Bericht succesvol verzonden!" }
  },

  // ============================================================================
  // PAGE MON COMPTE (account.html)
  // ============================================================================
  account: {
    page_title: { fr: "Mon Compte - RORONOA GAMES", en: "My Account - RORONOA GAMES", es: "Mi Cuenta - RORONOA GAMES", de: "Mein Konto - RORONOA GAMES", it: "Il Mio Account - RORONOA GAMES", pt: "Minha Conta - RORONOA GAMES", nl: "Mijn Account - RORONOA GAMES" },
    welcome: { fr: "Bienvenue", en: "Welcome", es: "Bienvenido", de: "Willkommen", it: "Benvenuto", pt: "Bem-vindo", nl: "Welkom" },
    my_profile: { fr: "Mon Profil", en: "My Profile", es: "Mi Perfil", de: "Mein Profil", it: "Il Mio Profilo", pt: "Meu Perfil", nl: "Mijn Profiel" },
    my_subscription: { fr: "Mon Abonnement", en: "My Subscription", es: "Mi Suscripción", de: "Mein Abonnement", it: "Il Mio Abbonamento", pt: "Minha Assinatura", nl: "Mijn Abonnement" },
    my_avatars: { fr: "Mes Avatars", en: "My Avatars", es: "Mis Avatares", de: "Meine Avatare", it: "I Miei Avatar", pt: "Meus Avatares", nl: "Mijn Avatars" },
    my_stats: { fr: "Mes Statistiques", en: "My Statistics", es: "Mis Estadísticas", de: "Meine Statistiken", it: "Le Mie Statistiche", pt: "Minhas Estatísticas", nl: "Mijn Statistieken" },
    video_credits: { fr: "Crédits Vidéo", en: "Video Credits", es: "Créditos de Video", de: "Video-Credits", it: "Crediti Video", pt: "Créditos de Vídeo", nl: "Video Credits" },
    avatar_credits: { fr: "Crédits Avatars", en: "Avatar Credits", es: "Créditos de Avatares", de: "Avatar-Credits", it: "Crediti Avatar", pt: "Créditos de Avatares", nl: "Avatar Credits" },
    games_played: { fr: "Parties Jouées", en: "Games Played", es: "Partidas Jugadas", de: "Gespielte Spiele", it: "Partite Giocate", pt: "Partidas Jogadas", nl: "Gespeelde Spellen" },
    account_type: { fr: "Type de Compte", en: "Account Type", es: "Tipo de Cuenta", de: "Kontotyp", it: "Tipo di Account", pt: "Tipo de Conta", nl: "Accounttype" },
    free: { fr: "Gratuit", en: "Free", es: "Gratis", de: "Kostenlos", it: "Gratuito", pt: "Grátis", nl: "Gratis" },
    premium: { fr: "Premium", en: "Premium", es: "Premium", de: "Premium", it: "Premium", pt: "Premium", nl: "Premium" },
    family: { fr: "Famille", en: "Family", es: "Familia", de: "Familie", it: "Famiglia", pt: "Família", nl: "Familie" },
    manage_subscription: { fr: "Gérer mon abonnement", en: "Manage my subscription", es: "Gestionar mi suscripción", de: "Mein Abonnement verwalten", it: "Gestisci il mio abbonamento", pt: "Gerenciar minha assinatura", nl: "Mijn abonnement beheren" },
    upgrade: { fr: "Passer Premium", en: "Upgrade to Premium", es: "Pasar a Premium", de: "Auf Premium upgraden", it: "Passa a Premium", pt: "Fazer upgrade para Premium", nl: "Upgraden naar Premium" },
    email_verified: { fr: "Email vérifié", en: "Email verified", es: "Email verificado", de: "E-Mail verifiziert", it: "Email verificata", pt: "E-mail verificado", nl: "E-mail geverifieerd" },
    email_not_verified: { fr: "Email non vérifié", en: "Email not verified", es: "Email no verificado", de: "E-Mail nicht verifiziert", it: "Email non verificata", pt: "E-mail não verificado", nl: "E-mail niet geverifieerd" },
    resend_verification: { fr: "Renvoyer l'email de vérification", en: "Resend verification email", es: "Reenviar email de verificación", de: "Bestätigungs-E-Mail erneut senden", it: "Rinvia email di verifica", pt: "Reenviar e-mail de verificação", nl: "Verificatie-e-mail opnieuw verzenden" },
    change_password: { fr: "Changer le mot de passe", en: "Change password", es: "Cambiar contraseña", de: "Passwort ändern", it: "Cambia password", pt: "Alterar senha", nl: "Wachtwoord wijzigen" },
    delete_account: { fr: "Supprimer mon compte", en: "Delete my account", es: "Eliminar mi cuenta", de: "Mein Konto löschen", it: "Elimina il mio account", pt: "Excluir minha conta", nl: "Mijn account verwijderen" }
  },

  // ============================================================================
  // MESSAGES D'ERREUR & SUCCÈS
  // ============================================================================
  messages: {
    login_success: { fr: "Connexion réussie !", en: "Login successful!", es: "¡Inicio de sesión exitoso!", de: "Anmeldung erfolgreich!", it: "Accesso riuscito!", pt: "Login bem-sucedido!", nl: "Inloggen succesvol!" },
    register_success: { fr: "Inscription réussie ! Vérifiez votre email.", en: "Registration successful! Check your email.", es: "¡Registro exitoso! Verifica tu correo.", de: "Registrierung erfolgreich! Überprüfen Sie Ihre E-Mail.", it: "Registrazione riuscita! Controlla la tua email.", pt: "Cadastro bem-sucedido! Verifique seu e-mail.", nl: "Registratie succesvol! Controleer je e-mail." },
    logout_success: { fr: "Déconnexion réussie", en: "Logout successful", es: "Cierre de sesión exitoso", de: "Abmeldung erfolgreich", it: "Disconnessione riuscita", pt: "Logout bem-sucedido", nl: "Uitloggen succesvol" },
    error_generic: { fr: "Une erreur est survenue", en: "An error occurred", es: "Ocurrió un error", de: "Ein Fehler ist aufgetreten", it: "Si è verificato un errore", pt: "Ocorreu um erro", nl: "Er is een fout opgetreden" },
    error_login: { fr: "Email ou mot de passe incorrect", en: "Incorrect email or password", es: "Correo o contraseña incorrectos", de: "Falsche E-Mail oder Passwort", it: "Email o password errati", pt: "E-mail ou senha incorretos", nl: "Onjuiste e-mail of wachtwoord" },
    error_email_exists: { fr: "Cet email est déjà utilisé", en: "This email is already in use", es: "Este correo ya está en uso", de: "Diese E-Mail wird bereits verwendet", it: "Questa email è già in uso", pt: "Este e-mail já está em uso", nl: "Dit e-mailadres is al in gebruik" },
    error_password_mismatch: { fr: "Les mots de passe ne correspondent pas", en: "Passwords do not match", es: "Las contraseñas no coinciden", de: "Passwörter stimmen nicht überein", it: "Le password non corrispondono", pt: "As senhas não coincidem", nl: "Wachtwoorden komen niet overeen" },
    error_network: { fr: "Erreur de connexion au serveur", en: "Server connection error", es: "Error de conexión al servidor", de: "Server-Verbindungsfehler", it: "Errore di connessione al server", pt: "Erro de conexão com o servidor", nl: "Server verbindingsfout" },
    promo_applied: { fr: "Code promo appliqué !", en: "Promo code applied!", es: "¡Código promocional aplicado!", de: "Promo-Code angewendet!", it: "Codice promozionale applicato!", pt: "Código promocional aplicado!", nl: "Promotiecode toegepast!" },
    promo_invalid: { fr: "Code promo invalide", en: "Invalid promo code", es: "Código promocional inválido", de: "Ungültiger Promo-Code", it: "Codice promozionale non valido", pt: "Código promocional inválido", nl: "Ongeldige promotiecode" }
  },

  // ============================================================================
  // PAGES LÉGALES
  // ============================================================================
  legal: {
    privacy_title: { fr: "Politique de Confidentialité", en: "Privacy Policy", es: "Política de Privacidad", de: "Datenschutzrichtlinie", it: "Informativa sulla Privacy", pt: "Política de Privacidade", nl: "Privacybeleid" },
    terms_title: { fr: "Conditions Générales d'Utilisation", en: "Terms of Service", es: "Términos de Servicio", de: "Nutzungsbedingungen", it: "Termini di Servizio", pt: "Termos de Serviço", nl: "Servicevoorwaarden" },
    legal_notice_title: { fr: "Mentions Légales", en: "Legal Notice", es: "Aviso Legal", de: "Impressum", it: "Note Legali", pt: "Aviso Legal", nl: "Juridische Kennisgeving" },
    last_updated: { fr: "Dernière mise à jour", en: "Last updated", es: "Última actualización", de: "Zuletzt aktualisiert", it: "Ultimo aggiornamento", pt: "Última atualização", nl: "Laatst bijgewerkt" }
  },

  // ============================================================================
  // PAGES PAIEMENT
  // ============================================================================
  payment: {
    success_title: { fr: "Paiement Réussi !", en: "Payment Successful!", es: "¡Pago Exitoso!", de: "Zahlung Erfolgreich!", it: "Pagamento Riuscito!", pt: "Pagamento Bem-sucedido!", nl: "Betaling Geslaagd!" },
    success_message: {
      fr: "Merci pour votre achat ! Votre compte a été mis à jour.",
      en: "Thank you for your purchase! Your account has been updated.",
      es: "¡Gracias por tu compra! Tu cuenta ha sido actualizada.",
      de: "Vielen Dank für Ihren Kauf! Ihr Konto wurde aktualisiert.",
      it: "Grazie per il tuo acquisto! Il tuo account è stato aggiornato.",
      pt: "Obrigado pela sua compra! Sua conta foi atualizada.",
      nl: "Bedankt voor je aankoop! Je account is bijgewerkt."
    },
    cancel_title: { fr: "Paiement Annulé", en: "Payment Cancelled", es: "Pago Cancelado", de: "Zahlung Abgebrochen", it: "Pagamento Annullato", pt: "Pagamento Cancelado", nl: "Betaling Geannuleerd" },
    cancel_message: {
      fr: "Votre paiement a été annulé. Aucun montant n'a été débité.",
      en: "Your payment has been cancelled. No amount has been charged.",
      es: "Tu pago ha sido cancelado. No se ha cobrado ningún monto.",
      de: "Ihre Zahlung wurde abgebrochen. Es wurde kein Betrag belastet.",
      it: "Il tuo pagamento è stato annullato. Nessun importo è stato addebitato.",
      pt: "Seu pagamento foi cancelado. Nenhum valor foi cobrado.",
      nl: "Je betaling is geannuleerd. Er is geen bedrag in rekening gebracht."
    },
    back_to_home: { fr: "Retour à l'accueil", en: "Back to home", es: "Volver al inicio", de: "Zurück zur Startseite", it: "Torna alla home", pt: "Voltar ao início", nl: "Terug naar home" },
    try_again: { fr: "Réessayer", en: "Try again", es: "Intentar de nuevo", de: "Erneut versuchen", it: "Riprova", pt: "Tentar novamente", nl: "Opnieuw proberen" }
  },

  // ============================================================================
  // EMAIL VERIFICATION & PASSWORD RESET
  // ============================================================================
  email_verification: {
    title: { fr: "Vérification de l'email", en: "Email Verification", es: "Verificación de correo", de: "E-Mail-Verifizierung", it: "Verifica email", pt: "Verificação de e-mail", nl: "E-mailverificatie" },
    verifying: { fr: "Vérification en cours...", en: "Verifying...", es: "Verificando...", de: "Verifizierung läuft...", it: "Verifica in corso...", pt: "Verificando...", nl: "Verifiëren..." },
    success: { fr: "Email vérifié avec succès !", en: "Email verified successfully!", es: "¡Correo verificado con éxito!", de: "E-Mail erfolgreich verifiziert!", it: "Email verificata con successo!", pt: "E-mail verificado com sucesso!", nl: "E-mail succesvol geverifieerd!" },
    error: { fr: "Le lien de vérification est invalide ou a expiré.", en: "The verification link is invalid or has expired.", es: "El enlace de verificación es inválido o ha expirado.", de: "Der Verifizierungslink ist ungültig oder abgelaufen.", it: "Il link di verifica non è valido o è scaduto.", pt: "O link de verificação é inválido ou expirou.", nl: "De verificatielink is ongeldig of verlopen." }
  },
  reset_password: {
    title: { fr: "Réinitialiser le mot de passe", en: "Reset password", es: "Restablecer contraseña", de: "Passwort zurücksetzen", it: "Reimposta password", pt: "Redefinir senha", nl: "Wachtwoord resetten" },
    new_password: { fr: "Nouveau mot de passe", en: "New password", es: "Nueva contraseña", de: "Neues Passwort", it: "Nuova password", pt: "Nova senha", nl: "Nieuw wachtwoord" },
    confirm_new_password: { fr: "Confirmer le nouveau mot de passe", en: "Confirm new password", es: "Confirmar nueva contraseña", de: "Neues Passwort bestätigen", it: "Conferma nuova password", pt: "Confirmar nova senha", nl: "Nieuw wachtwoord bevestigen" },
    submit: { fr: "Réinitialiser", en: "Reset", es: "Restablecer", de: "Zurücksetzen", it: "Reimposta", pt: "Redefinir", nl: "Resetten" },
    success: { fr: "Mot de passe réinitialisé avec succès !", en: "Password reset successfully!", es: "¡Contraseña restablecida con éxito!", de: "Passwort erfolgreich zurückgesetzt!", it: "Password reimpostata con successo!", pt: "Senha redefinida com sucesso!", nl: "Wachtwoord succesvol gereset!" }
  },
  forgot_password: {
    title: { fr: "Mot de passe oublié", en: "Forgot password", es: "Olvidé mi contraseña", de: "Passwort vergessen", it: "Password dimenticata", pt: "Esqueci a senha", nl: "Wachtwoord vergeten" },
    description: {
      fr: "Entrez votre email pour recevoir un lien de réinitialisation.",
      en: "Enter your email to receive a reset link.",
      es: "Ingresa tu correo para recibir un enlace de restablecimiento.",
      de: "Geben Sie Ihre E-Mail ein, um einen Reset-Link zu erhalten.",
      it: "Inserisci la tua email per ricevere un link di reimpostazione.",
      pt: "Digite seu e-mail para receber um link de redefinição.",
      nl: "Voer je e-mail in om een resetlink te ontvangen."
    },
    submit: { fr: "Envoyer le lien", en: "Send link", es: "Enviar enlace", de: "Link senden", it: "Invia link", pt: "Enviar link", nl: "Link verzenden" },
    back_to_login: { fr: "Retour à la connexion", en: "Back to login", es: "Volver al inicio de sesión", de: "Zurück zur Anmeldung", it: "Torna al login", pt: "Voltar ao login", nl: "Terug naar inloggen" }
  }
};

// ============================================================================
// FONCTIONS UTILITAIRES
// ============================================================================

/**
 * Obtient la langue actuelle
 */
function getSiteLanguage() {
  const stored = localStorage.getItem('site_language');
  if (stored && SITE_TRANSLATIONS._languages[stored]) return stored;
  const browserLang = navigator.language.split('-')[0];
  if (SITE_TRANSLATIONS._languages[browserLang]) return browserLang;
  return 'fr';
}

/**
 * Définit la langue du site
 */
function setSiteLanguage(lang) {
  if (SITE_TRANSLATIONS._languages[lang]) {
    localStorage.setItem('site_language', lang);
    applySiteTranslations(lang);
    return true;
  }
  return false;
}

/**
 * Obtient une traduction par clé
 */
function getSiteText(key, lang) {
  lang = lang || getSiteLanguage();
  const keys = key.split('.');
  let result = SITE_TRANSLATIONS;
  for (const k of keys) {
    if (result && result[k]) result = result[k];
    else return key;
  }
  return (typeof result === 'object' && result[lang]) ? result[lang] : key;
}

/**
 * Applique les traductions à tous les éléments
 */
function applySiteTranslations(lang) {
  lang = lang || getSiteLanguage();
  document.documentElement.lang = lang;
  
  document.querySelectorAll('[data-i18n-site]').forEach(el => {
    const key = el.getAttribute('data-i18n-site');
    const text = getSiteText(key, lang);
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
      el.placeholder = text;
    } else if (el.tagName === 'OPTION' && el.value === '') {
      el.textContent = text;
    } else {
      el.textContent = text;
    }
  });
  
  document.querySelectorAll('[data-i18n-site-html]').forEach(el => {
    const key = el.getAttribute('data-i18n-site-html');
    el.innerHTML = getSiteText(key, lang);
  });
  
  const selector = document.getElementById('site-language-selector');
  if (selector) selector.value = lang;
  
  console.log('✅ Site translations applied:', lang);
}

/**
 * Crée le sélecteur de langue
 */
function createLanguageSelector() {
  const current = getSiteLanguage();
  let html = '<select id="site-language-selector" onchange="setSiteLanguage(this.value)" class="language-selector">';
  for (const [code, info] of Object.entries(SITE_TRANSLATIONS._languages)) {
    html += `<option value="${code}" ${code === current ? 'selected' : ''}>${info.flag} ${info.name}</option>`;
  }
  return html + '</select>';
}

// Auto-init
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => applySiteTranslations());
} else {
  applySiteTranslations();
}

// ============================================================================
// ACCOUNT PAGE - ADDITIONAL TRANSLATIONS
// ============================================================================

// Ajouter ces clés dans la section account de SITE_TRANSLATIONS
SITE_TRANSLATIONS.account = {
  ...SITE_TRANSLATIONS.account,
  
  // Page
  page_title_h1: { fr: "⚔️ Mon Compte", en: "⚔️ My Account", es: "⚔️ Mi Cuenta", de: "⚔️ Mein Konto", it: "⚔️ Il Mio Account", pt: "⚔️ Minha Conta", nl: "⚔️ Mijn Account" },
  
  // Tabs
  tab_profile: { fr: "👤 Profil", en: "👤 Profile", es: "👤 Perfil", de: "👤 Profil", it: "👤 Profilo", pt: "👤 Perfil", nl: "👤 Profiel" },
  tab_avatars: { fr: "🎨 Avatars", en: "🎨 Avatars", es: "🎨 Avatares", de: "🎨 Avatare", it: "🎨 Avatar", pt: "🎨 Avatares", nl: "🎨 Avatars" },
  tab_subscriptions: { fr: "💎 Abonnements", en: "💎 Subscriptions", es: "💎 Suscripciones", de: "💎 Abonnements", it: "💎 Abbonamenti", pt: "💎 Assinaturas", nl: "💎 Abonnementen" },
  tab_credits: { fr: "📦 Crédits", en: "📦 Credits", es: "📦 Créditos", de: "📦 Credits", it: "📦 Crediti", pt: "📦 Créditos", nl: "📦 Credits" },
  tab_history: { fr: "📜 Historique", en: "📜 History", es: "📜 Historial", de: "📜 Verlauf", it: "📜 Cronologia", pt: "📜 Histórico", nl: "📜 Geschiedenis" },
  
  // Card titles
  personal_info: { fr: "👤 Informations personnelles", en: "👤 Personal Information", es: "👤 Información Personal", de: "👤 Persönliche Informationen", it: "👤 Informazioni Personali", pt: "👤 Informações Pessoais", nl: "👤 Persoonlijke Informatie" },
  change_password_title: { fr: "🔒 Changer le mot de passe", en: "🔒 Change Password", es: "🔒 Cambiar Contraseña", de: "🔒 Passwort ändern", it: "🔒 Cambia Password", pt: "🔒 Alterar Senha", nl: "🔒 Wachtwoord Wijzigen" },
  my_avatars_title: { fr: "🎨 Mes Avatars IA", en: "🎨 My AI Avatars", es: "🎨 Mis Avatares IA", de: "🎨 Meine KI-Avatare", it: "🎨 I Miei Avatar IA", pt: "🎨 Meus Avatares IA", nl: "🎨 Mijn AI Avatars" },
  manage_payments: { fr: "📋 Gérer mes paiements", en: "📋 Manage Payments", es: "📋 Gestionar Pagos", de: "📋 Zahlungen verwalten", it: "📋 Gestisci Pagamenti", pt: "📋 Gerenciar Pagamentos", nl: "📋 Betalingen Beheren" },
  pack_5050_title: { fr: "🎁 Pack 50+50", en: "🎁 Pack 50+50", es: "🎁 Pack 50+50", de: "🎁 Pack 50+50", it: "🎁 Pack 50+50", pt: "🎁 Pack 50+50", nl: "🎁 Pack 50+50" },
  purchase_history: { fr: "📜 Historique des achats", en: "📜 Purchase History", es: "📜 Historial de Compras", de: "📜 Kaufverlauf", it: "📜 Cronologia Acquisti", pt: "📜 Histórico de Compras", nl: "📜 Aankoopgeschiedenis" },
  
  // Form labels
  label_email: { fr: "Email", en: "Email", es: "Correo electrónico", de: "E-Mail", it: "Email", pt: "E-mail", nl: "E-mail" },
  label_username: { fr: "Pseudo", en: "Username", es: "Nombre de usuario", de: "Benutzername", it: "Nome utente", pt: "Nome de usuário", nl: "Gebruikersnaam" },
  label_account_type: { fr: "Type de compte", en: "Account Type", es: "Tipo de Cuenta", de: "Kontotyp", it: "Tipo di Account", pt: "Tipo de Conta", nl: "Accounttype" },
  label_current_password: { fr: "Mot de passe actuel", en: "Current Password", es: "Contraseña Actual", de: "Aktuelles Passwort", it: "Password Attuale", pt: "Senha Atual", nl: "Huidig Wachtwoord" },
  label_new_password: { fr: "Nouveau mot de passe", en: "New Password", es: "Nueva Contraseña", de: "Neues Passwort", it: "Nuova Password", pt: "Nova Senha", nl: "Nieuw Wachtwoord" },
  label_confirm_password: { fr: "Confirmer le nouveau mot de passe", en: "Confirm New Password", es: "Confirmar Nueva Contraseña", de: "Neues Passwort bestätigen", it: "Conferma Nuova Password", pt: "Confirmar Nova Senha", nl: "Nieuw Wachtwoord Bevestigen" },
  
  // Buttons
  btn_save: { fr: "💾 Sauvegarder", en: "💾 Save", es: "💾 Guardar", de: "💾 Speichern", it: "💾 Salva", pt: "💾 Salvar", nl: "💾 Opslaan" },
  btn_change_password: { fr: "🔐 Modifier le mot de passe", en: "🔐 Change Password", es: "🔐 Cambiar Contraseña", de: "🔐 Passwort ändern", it: "🔐 Cambia Password", pt: "🔐 Alterar Senha", nl: "🔐 Wachtwoord Wijzigen" },
  btn_subscribe: { fr: "S'abonner", en: "Subscribe", es: "Suscribirse", de: "Abonnieren", it: "Abbonati", pt: "Assinar", nl: "Abonneren" },
  btn_cancel: { fr: "❌ Résilier l'abonnement", en: "❌ Cancel Subscription", es: "❌ Cancelar Suscripción", de: "❌ Abonnement kündigen", it: "❌ Annulla Abbonamento", pt: "❌ Cancelar Assinatura", nl: "❌ Abonnement Opzeggen" },
  btn_billing_portal: { fr: "🔗 Accéder au portail de paiement", en: "🔗 Access Billing Portal", es: "🔗 Acceder al Portal de Pago", de: "🔗 Zum Zahlungsportal", it: "🔗 Accedi al Portale Pagamenti", pt: "🔗 Acessar Portal de Pagamento", nl: "🔗 Naar Betaalportaal" },
  btn_buy_pack: { fr: "🛒 Acheter le Pack", en: "🛒 Buy Pack", es: "🛒 Comprar Pack", de: "🛒 Pack kaufen", it: "🛒 Acquista Pack", pt: "🛒 Comprar Pack", nl: "🛒 Pack Kopen" },
  
  // Subscription names
  pack_premium: { fr: "Pack Premium", en: "Premium Pack", es: "Pack Premium", de: "Premium-Paket", it: "Pack Premium", pt: "Pack Premium", nl: "Premium Pack" },
  pack_family: { fr: "Pack Famille", en: "Family Pack", es: "Pack Familia", de: "Familienpaket", it: "Pack Famiglia", pt: "Pack Família", nl: "Familiepakket" },
  
  // Features
  feat_unlimited_video: { fr: "Vidéo illimitée", en: "Unlimited Video", es: "Video Ilimitado", de: "Unbegrenztes Video", it: "Video Illimitato", pt: "Vídeo Ilimitado", nl: "Onbeperkte Video" },
  feat_30_avatars: { fr: "30 avatars IA / mois", en: "30 AI avatars / month", es: "30 avatares IA / mes", de: "30 KI-Avatare / Monat", it: "30 avatar IA / mese", pt: "30 avatares IA / mês", nl: "30 AI avatars / maand" },
  feat_all_themes: { fr: "Tous les thèmes", en: "All themes", es: "Todos los temas", de: "Alle Themen", it: "Tutti i temi", pt: "Todos os temas", nl: "Alle thema's" },
  feat_premium_badge: { fr: "Badge Premium", en: "Premium Badge", es: "Insignia Premium", de: "Premium-Abzeichen", it: "Badge Premium", pt: "Distintivo Premium", nl: "Premium Badge" },
  feat_priority_support: { fr: "Support prioritaire", en: "Priority Support", es: "Soporte Prioritario", de: "Prioritäts-Support", it: "Supporto Prioritario", pt: "Suporte Prioritário", nl: "Prioriteitsondersteuning" },
  feat_8_accounts: { fr: "Jusqu'à 8 comptes", en: "Up to 8 accounts", es: "Hasta 8 cuentas", de: "Bis zu 8 Konten", it: "Fino a 8 account", pt: "Até 8 contas", nl: "Tot 8 accounts" },
  feat_video_all: { fr: "Vidéo illimitée pour tous", en: "Unlimited video for all", es: "Video ilimitado para todos", de: "Unbegrenztes Video für alle", it: "Video illimitato per tutti", pt: "Vídeo ilimitado para todos", nl: "Onbeperkte video voor iedereen" },
  feat_30_avatars_each: { fr: "30 avatars IA / mois chacun", en: "30 AI avatars / month each", es: "30 avatares IA / mes cada uno", de: "30 KI-Avatare / Monat pro Person", it: "30 avatar IA / mese ciascuno", pt: "30 avatares IA / mês cada", nl: "30 AI avatars / maand elk" },
  feat_member_management: { fr: "Gestion des membres", en: "Member Management", es: "Gestión de Miembros", de: "Mitgliederverwaltung", it: "Gestione Membri", pt: "Gestão de Membros", nl: "Ledenbeheer" },
  
  // Family code
  family_code_share: { fr: "Code famille à partager :", en: "Family code to share:", es: "Código familiar para compartir:", de: "Familiencode zum Teilen:", it: "Codice famiglia da condividere:", pt: "Código família para compartilhar:", nl: "Familiecode om te delen:" }
};

// ============================================================================
// LEGAL PAGES - COMPLETE TRANSLATIONS
// ============================================================================

SITE_TRANSLATIONS.legal_pages = {
  // Common
  back_to_home: {
    fr: "← Retour à l'accueil",
    en: "← Back to Home",
    es: "← Volver al Inicio",
    de: "← Zurück zur Startseite",
    it: "← Torna alla Home",
    pt: "← Voltar ao Início",
    nl: "← Terug naar Home"
  },
  last_updated: {
    fr: "Dernière mise à jour : Janvier 2025",
    en: "Last updated: January 2025",
    es: "Última actualización: Enero 2025",
    de: "Zuletzt aktualisiert: Januar 2025",
    it: "Ultimo aggiornamento: Gennaio 2025",
    pt: "Última atualização: Janeiro 2025",
    nl: "Laatst bijgewerkt: Januari 2025"
  },

  // PRIVACY POLICY
  privacy: {
    title: {
      fr: "🔒 Politique de Confidentialité",
      en: "🔒 Privacy Policy",
      es: "🔒 Política de Privacidad",
      de: "🔒 Datenschutzrichtlinie",
      it: "🔒 Informativa sulla Privacy",
      pt: "🔒 Política de Privacidade",
      nl: "🔒 Privacybeleid"
    },
    commitment_title: {
      fr: "🛡️ Notre engagement",
      en: "🛡️ Our Commitment",
      es: "🛡️ Nuestro Compromiso",
      de: "🛡️ Unsere Verpflichtung",
      it: "🛡️ Il Nostro Impegno",
      pt: "🛡️ Nosso Compromisso",
      nl: "🛡️ Onze Toezegging"
    },
    commitment_text: {
      fr: "Vos données ne sont jamais vendues, jamais partagées à des fins commerciales, jamais utilisées pour de la publicité ciblée.",
      en: "Your data is never sold, never shared for commercial purposes, never used for targeted advertising.",
      es: "Sus datos nunca se venden, nunca se comparten con fines comerciales, nunca se utilizan para publicidad dirigida.",
      de: "Ihre Daten werden niemals verkauft, niemals für kommerzielle Zwecke weitergegeben, niemals für gezielte Werbung verwendet.",
      it: "I tuoi dati non vengono mai venduti, mai condivisi per scopi commerciali, mai utilizzati per pubblicità mirata.",
      pt: "Seus dados nunca são vendidos, nunca compartilhados para fins comerciais, nunca usados para publicidade direcionada.",
      nl: "Uw gegevens worden nooit verkocht, nooit gedeeld voor commerciële doeleinden, nooit gebruikt voor gerichte advertenties."
    },
    section1_title: { fr: "1. Responsable du traitement", en: "1. Data Controller", es: "1. Responsable del Tratamiento", de: "1. Verantwortlicher", it: "1. Titolare del Trattamento", pt: "1. Responsável pelo Tratamento", nl: "1. Verwerkingsverantwoordelijke" },
    section1_text: { fr: "Le responsable du traitement des données personnelles est :", en: "The data controller is:", es: "El responsable del tratamiento de datos personales es:", de: "Der Verantwortliche für die Verarbeitung personenbezogener Daten ist:", it: "Il titolare del trattamento dei dati personali è:", pt: "O responsável pelo tratamento de dados pessoais é:", nl: "De verwerkingsverantwoordelijke is:" },
    section2_title: { fr: "2. Données collectées", en: "2. Data Collected", es: "2. Datos Recopilados", de: "2. Erfasste Daten", it: "2. Dati Raccolti", pt: "2. Dados Coletados", nl: "2. Verzamelde Gegevens" },
    section2_text: { fr: "Nous collectons uniquement les données strictement nécessaires au fonctionnement de nos services :", en: "We only collect data strictly necessary for the operation of our services:", es: "Recopilamos únicamente los datos estrictamente necesarios para el funcionamiento de nuestros servicios:", de: "Wir erfassen nur die für den Betrieb unserer Dienste unbedingt erforderlichen Daten:", it: "Raccogliamo solo i dati strettamente necessari per il funzionamento dei nostri servizi:", pt: "Coletamos apenas os dados estritamente necessários para o funcionamento dos nossos serviços:", nl: "We verzamelen alleen gegevens die strikt noodzakelijk zijn voor de werking van onze diensten:" },
    table_data: { fr: "Donnée", en: "Data", es: "Dato", de: "Daten", it: "Dato", pt: "Dado", nl: "Gegeven" },
    table_purpose: { fr: "Finalité", en: "Purpose", es: "Finalidad", de: "Zweck", it: "Finalità", pt: "Finalidade", nl: "Doel" },
    table_retention: { fr: "Conservation", en: "Retention", es: "Conservación", de: "Aufbewahrung", it: "Conservazione", pt: "Retenção", nl: "Bewaartermijn" },
    section3_title: { fr: "3. Base légale du traitement", en: "3. Legal Basis", es: "3. Base Legal", de: "3. Rechtsgrundlage", it: "3. Base Giuridica", pt: "3. Base Legal", nl: "3. Rechtsgrondslag" },
    section4_title: { fr: "4. Ce que nous ne faisons PAS", en: "4. What We Do NOT Do", es: "4. Lo que NO Hacemos", de: "4. Was wir NICHT tun", it: "4. Cosa NON Facciamo", pt: "4. O que NÃO Fazemos", nl: "4. Wat We NIET Doen" },
    section5_title: { fr: "5. Partage des données", en: "5. Data Sharing", es: "5. Compartir Datos", de: "5. Datenweitergabe", it: "5. Condivisione Dati", pt: "5. Compartilhamento de Dados", nl: "5. Gegevens Delen" },
    section6_title: { fr: "6. Sécurité des données", en: "6. Data Security", es: "6. Seguridad de Datos", de: "6. Datensicherheit", it: "6. Sicurezza dei Dati", pt: "6. Segurança de Dados", nl: "6. Gegevensbeveiliging" },
    section7_title: { fr: "7. Vos droits (RGPD)", en: "7. Your Rights (GDPR)", es: "7. Sus Derechos (RGPD)", de: "7. Ihre Rechte (DSGVO)", it: "7. I Tuoi Diritti (GDPR)", pt: "7. Seus Direitos (RGPD)", nl: "7. Uw Rechten (AVG)" },
    section8_title: { fr: "8. Cookies", en: "8. Cookies", es: "8. Cookies", de: "8. Cookies", it: "8. Cookie", pt: "8. Cookies", nl: "8. Cookies" },
    section9_title: { fr: "9. Conservation des données", en: "9. Data Retention", es: "9. Conservación de Datos", de: "9. Datenaufbewahrung", it: "9. Conservazione dei Dati", pt: "9. Retenção de Dados", nl: "9. Gegevensbewaring" },
    section10_title: { fr: "10. Transferts internationaux", en: "10. International Transfers", es: "10. Transferencias Internacionales", de: "10. Internationale Übermittlungen", it: "10. Trasferimenti Internazionali", pt: "10. Transferências Internacionais", nl: "10. Internationale Overdrachten" },
    section11_title: { fr: "11. Protection des mineurs", en: "11. Protection of Minors", es: "11. Protección de Menores", de: "11. Schutz von Minderjährigen", it: "11. Protezione dei Minori", pt: "11. Proteção de Menores", nl: "11. Bescherming van Minderjarigen" },
    section12_title: { fr: "12. Réclamation", en: "12. Complaints", es: "12. Reclamación", de: "12. Beschwerde", it: "12. Reclamo", pt: "12. Reclamação", nl: "12. Klachten" },
    section13_title: { fr: "13. Modifications", en: "13. Changes", es: "13. Modificaciones", de: "13. Änderungen", it: "13. Modifiche", pt: "13. Modificações", nl: "13. Wijzigingen" },
    section14_title: { fr: "14. Contact", en: "14. Contact", es: "14. Contacto", de: "14. Kontakt", it: "14. Contatto", pt: "14. Contato", nl: "14. Contact" }
  },

  // LEGAL NOTICE
  legal_notice: {
    title: {
      fr: "📋 Mentions Légales",
      en: "📋 Legal Notice",
      es: "📋 Aviso Legal",
      de: "📋 Impressum",
      it: "📋 Note Legali",
      pt: "📋 Aviso Legal",
      nl: "📋 Juridische Kennisgeving"
    },
    section1_title: { fr: "1. Éditeur du site", en: "1. Website Publisher", es: "1. Editor del Sitio", de: "1. Herausgeber", it: "1. Editore del Sito", pt: "1. Editor do Site", nl: "1. Website Uitgever" },
    section2_title: { fr: "2. Hébergeur", en: "2. Host", es: "2. Alojamiento", de: "2. Hosting", it: "2. Hosting", pt: "2. Hospedagem", nl: "2. Hosting" },
    section3_title: { fr: "3. Propriété intellectuelle", en: "3. Intellectual Property", es: "3. Propiedad Intelectual", de: "3. Geistiges Eigentum", it: "3. Proprietà Intellettuale", pt: "3. Propriedade Intelectual", nl: "3. Intellectueel Eigendom" },
    section4_title: { fr: "4. Responsabilité", en: "4. Liability", es: "4. Responsabilidad", de: "4. Haftung", it: "4. Responsabilità", pt: "4. Responsabilidade", nl: "4. Aansprakelijkheid" },
    section5_title: { fr: "5. Droit applicable", en: "5. Applicable Law", es: "5. Ley Aplicable", de: "5. Anwendbares Recht", it: "5. Legge Applicabile", pt: "5. Lei Aplicável", nl: "5. Toepasselijk Recht" },
    section6_title: { fr: "6. Contact", en: "6. Contact", es: "6. Contacto", de: "6. Kontakt", it: "6. Contatto", pt: "6. Contato", nl: "6. Contact" }
  },

  // TERMS OF SERVICE
  terms: {
    title: {
      fr: "📜 Conditions Générales d'Utilisation",
      en: "📜 Terms of Service",
      es: "📜 Términos de Servicio",
      de: "📜 Nutzungsbedingungen",
      it: "📜 Termini di Servizio",
      pt: "📜 Termos de Serviço",
      nl: "📜 Servicevoorwaarden"
    },
    section1_title: { fr: "1. Objet", en: "1. Purpose", es: "1. Objeto", de: "1. Gegenstand", it: "1. Oggetto", pt: "1. Objeto", nl: "1. Doel" },
    section2_title: { fr: "2. Accès aux services", en: "2. Access to Services", es: "2. Acceso a los Servicios", de: "2. Zugang zu den Diensten", it: "2. Accesso ai Servizi", pt: "2. Acesso aos Serviços", nl: "2. Toegang tot Diensten" },
    section3_title: { fr: "3. Inscription et compte", en: "3. Registration and Account", es: "3. Registro y Cuenta", de: "3. Registrierung und Konto", it: "3. Registrazione e Account", pt: "3. Registro e Conta", nl: "3. Registratie en Account" },
    section4_title: { fr: "4. Services gratuits", en: "4. Free Services", es: "4. Servicios Gratuitos", de: "4. Kostenlose Dienste", it: "4. Servizi Gratuiti", pt: "4. Serviços Gratuitos", nl: "4. Gratis Diensten" },
    section5_title: { fr: "5. Services payants", en: "5. Paid Services", es: "5. Servicios de Pago", de: "5. Kostenpflichtige Dienste", it: "5. Servizi a Pagamento", pt: "5. Serviços Pagos", nl: "5. Betaalde Diensten" },
    section6_title: { fr: "6. Règles de conduite", en: "6. Code of Conduct", es: "6. Reglas de Conducta", de: "6. Verhaltensregeln", it: "6. Regole di Condotta", pt: "6. Regras de Conduta", nl: "6. Gedragsregels" },
    section7_title: { fr: "7. Propriété intellectuelle", en: "7. Intellectual Property", es: "7. Propiedad Intelectual", de: "7. Geistiges Eigentum", it: "7. Proprietà Intellettuale", pt: "7. Propriedade Intelectual", nl: "7. Intellectueel Eigendom" },
    section8_title: { fr: "8. Limitation de responsabilité", en: "8. Limitation of Liability", es: "8. Limitación de Responsabilidad", de: "8. Haftungsbeschränkung", it: "8. Limitazione di Responsabilità", pt: "8. Limitação de Responsabilidade", nl: "8. Beperking van Aansprakelijkheid" },
    section9_title: { fr: "9. Suspension et résiliation", en: "9. Suspension and Termination", es: "9. Suspensión y Terminación", de: "9. Aussetzung und Kündigung", it: "9. Sospensione e Risoluzione", pt: "9. Suspensão e Rescisão", nl: "9. Schorsing en Beëindiging" },
    section10_title: { fr: "10. Modifications des CGU", en: "10. Changes to Terms", es: "10. Cambios en los Términos", de: "10. Änderungen der AGB", it: "10. Modifiche ai Termini", pt: "10. Alterações nos Termos", nl: "10. Wijzigingen in Voorwaarden" },
    section11_title: { fr: "11. Droit applicable", en: "11. Applicable Law", es: "11. Ley Aplicable", de: "11. Anwendbares Recht", it: "11. Legge Applicabile", pt: "11. Lei Aplicável", nl: "11. Toepasselijk Recht" },
    section12_title: { fr: "12. Contact", en: "12. Contact", es: "12. Contacto", de: "12. Kontakt", it: "12. Contatto", pt: "12. Contato", nl: "12. Contact" }
  }
};
