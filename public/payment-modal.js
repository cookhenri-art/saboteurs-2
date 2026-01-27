/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║            💳 SABOTEUR - MODAL DE PAIEMENT STRIPE                         ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

// V35: Traductions du modal de paiement
const PAYMENT_TRANSLATIONS = {
  title: {
    fr: '🎉 Passe au niveau supérieur !',
    en: '🎉 Level up your experience!',
    es: '🎉 ¡Sube de nivel!',
    de: '🎉 Steig auf ein neues Level!',
    it: '🎉 Passa al livello successivo!',
    pt: '🎉 Passe para o próximo nível!'
  },
  subtitle: {
    fr: 'Profite de la visioconférence et des avatars IA',
    en: 'Enjoy video conferencing and AI avatars',
    es: 'Disfruta de videoconferencias y avatares IA',
    de: 'Genieße Videokonferenzen und KI-Avatare',
    it: 'Goditi videoconferenze e avatar IA',
    pt: 'Aproveite videoconferência e avatares IA'
  },
  recommended: {
    fr: '⭐ RECOMMANDÉ',
    en: '⭐ RECOMMENDED',
    es: '⭐ RECOMENDADO',
    de: '⭐ EMPFOHLEN',
    it: '⭐ CONSIGLIATO',
    pt: '⭐ RECOMENDADO'
  },
  premiumTitle: {
    fr: '🌟 Premium Mensuel',
    en: '🌟 Monthly Premium',
    es: '🌟 Premium Mensual',
    de: '🌟 Monatliches Premium',
    it: '🌟 Premium Mensile',
    pt: '🌟 Premium Mensal'
  },
  perMonth: {
    fr: '/mois',
    en: '/month',
    es: '/mes',
    de: '/Monat',
    it: '/mese',
    pt: '/mês'
  },
  premiumFeatures: {
    fr: ['Visioconférence <strong>illimitée</strong>', '<strong>30 avatars IA</strong> / mois', '<strong>4 univers</strong> de jeu', 'Sans engagement, annulable'],
    en: ['<strong>Unlimited</strong> video conferencing', '<strong>30 AI avatars</strong> / month', '<strong>4 game universes</strong>', 'No commitment, cancelable'],
    es: ['Videoconferencia <strong>ilimitada</strong>', '<strong>30 avatares IA</strong> / mes', '<strong>4 universos</strong> de juego', 'Sin compromiso, cancelable'],
    de: ['<strong>Unbegrenzte</strong> Videokonferenzen', '<strong>30 KI-Avatare</strong> / Monat', '<strong>4 Spieluniversen</strong>', 'Ohne Bindung, kündbar'],
    it: ['Videoconferenza <strong>illimitata</strong>', '<strong>30 avatar IA</strong> / mese', '<strong>4 universi</strong> di gioco', 'Senza impegno, cancellabile'],
    pt: ['Videoconferência <strong>ilimitada</strong>', '<strong>30 avatares IA</strong> / mês', '<strong>4 universos</strong> de jogo', 'Sem compromisso, cancelável']
  },
  subscribeBtn: {
    fr: "S'abonner maintenant",
    en: 'Subscribe now',
    es: 'Suscribirse ahora',
    de: 'Jetzt abonnieren',
    it: 'Abbonati ora',
    pt: 'Assinar agora'
  },
  packTitle: {
    fr: '📦 Pack 50 Crédits',
    en: '📦 50 Credits Pack',
    es: '📦 Pack 50 Créditos',
    de: '📦 50 Credits Paket',
    it: '📦 Pack 50 Crediti',
    pt: '📦 Pack 50 Créditos'
  },
  oneTime: {
    fr: ' une fois',
    en: ' one time',
    es: ' una vez',
    de: ' einmalig',
    it: ' una volta',
    pt: ' uma vez'
  },
  packFeatures: {
    fr: ['<strong>50 parties</strong> en vidéo', '<strong>50 avatars IA</strong> à créer', 'Badge <strong>"Supporter"</strong>', 'Crédits valables <strong>à vie</strong>'],
    en: ['<strong>50 video</strong> games', '<strong>50 AI avatars</strong> to create', '<strong>"Supporter"</strong> badge', 'Credits valid <strong>forever</strong>'],
    es: ['<strong>50 partidas</strong> en video', '<strong>50 avatares IA</strong> para crear', 'Insignia <strong>"Supporter"</strong>', 'Créditos válidos <strong>de por vida</strong>'],
    de: ['<strong>50 Video</strong>-Spiele', '<strong>50 KI-Avatare</strong> zu erstellen', '<strong>"Supporter"</strong>-Abzeichen', 'Credits <strong>lebenslang</strong> gültig'],
    it: ['<strong>50 partite</strong> video', '<strong>50 avatar IA</strong> da creare', 'Badge <strong>"Supporter"</strong>', 'Crediti validi <strong>per sempre</strong>'],
    pt: ['<strong>50 jogos</strong> em vídeo', '<strong>50 avatares IA</strong> para criar', 'Badge <strong>"Supporter"</strong>', 'Créditos válidos <strong>para sempre</strong>']
  },
  buyPackBtn: {
    fr: 'Acheter le pack',
    en: 'Buy the pack',
    es: 'Comprar el pack',
    de: 'Paket kaufen',
    it: 'Acquista il pack',
    pt: 'Comprar o pack'
  },
  loginNotice: {
    fr: '💡 <strong>Astuce :</strong> Crée un compte gratuit pour profiter des offres !',
    en: '💡 <strong>Tip:</strong> Create a free account to enjoy the offers!',
    es: '💡 <strong>Consejo:</strong> ¡Crea una cuenta gratis para disfrutar de las ofertas!',
    de: '💡 <strong>Tipp:</strong> Erstelle ein kostenloses Konto, um die Angebote zu nutzen!',
    it: '💡 <strong>Suggerimento:</strong> Crea un account gratuito per approfittare delle offerte!',
    pt: '💡 <strong>Dica:</strong> Crie uma conta grátis para aproveitar as ofertas!'
  },
  createAccount: {
    fr: 'Créer mon compte →',
    en: 'Create my account →',
    es: 'Crear mi cuenta →',
    de: 'Mein Konto erstellen →',
    it: 'Crea il mio account →',
    pt: 'Criar minha conta →'
  },
  footer: {
    fr: '🔒 Paiement sécurisé par Stripe',
    en: '🔒 Secure payment by Stripe',
    es: '🔒 Pago seguro con Stripe',
    de: '🔒 Sichere Zahlung über Stripe',
    it: '🔒 Pagamento sicuro con Stripe',
    pt: '🔒 Pagamento seguro via Stripe'
  },
  footerSub: {
    fr: 'Tu peux annuler ton abonnement à tout moment',
    en: 'You can cancel your subscription anytime',
    es: 'Puedes cancelar tu suscripción en cualquier momento',
    de: 'Du kannst dein Abo jederzeit kündigen',
    it: 'Puoi annullare il tuo abbonamento in qualsiasi momento',
    pt: 'Você pode cancelar sua assinatura a qualquer momento'
  },
  loading: {
    fr: 'Chargement...',
    en: 'Loading...',
    es: 'Cargando...',
    de: 'Laden...',
    it: 'Caricamento...',
    pt: 'Carregando...'
  },
  accountRequired: {
    fr: 'Compte requis',
    en: 'Account required',
    es: 'Cuenta requerida',
    de: 'Konto erforderlich',
    it: 'Account richiesto',
    pt: 'Conta necessária'
  },
  accountRequiredText: {
    fr: 'Pour acheter une offre Premium, tu dois d\'abord créer un compte gratuit.<br><strong>C\'est rapide et ça prend 30 secondes !</strong>',
    en: 'To buy a Premium offer, you need to create a free account first.<br><strong>It\'s quick and takes 30 seconds!</strong>',
    es: 'Para comprar una oferta Premium, primero debes crear una cuenta gratis.<br><strong>¡Es rápido y toma 30 segundos!</strong>',
    de: 'Um ein Premium-Angebot zu kaufen, musst du zuerst ein kostenloses Konto erstellen.<br><strong>Es ist schnell und dauert 30 Sekunden!</strong>',
    it: 'Per acquistare un\'offerta Premium, devi prima creare un account gratuito.<br><strong>È veloce e richiede 30 secondi!</strong>',
    pt: 'Para comprar uma oferta Premium, você precisa criar uma conta grátis primeiro.<br><strong>É rápido e leva 30 segundos!</strong>'
  },
  createMyAccount: {
    fr: '✨ Créer mon compte',
    en: '✨ Create my account',
    es: '✨ Crear mi cuenta',
    de: '✨ Mein Konto erstellen',
    it: '✨ Crea il mio account',
    pt: '✨ Criar minha conta'
  },
  seeOffers: {
    fr: '← Voir les offres',
    en: '← See offers',
    es: '← Ver ofertas',
    de: '← Angebote sehen',
    it: '← Vedi offerte',
    pt: '← Ver ofertas'
  },
  alreadyAccount: {
    fr: 'Tu as déjà un compte ?',
    en: 'Already have an account?',
    es: '¿Ya tienes una cuenta?',
    de: 'Hast du schon ein Konto?',
    it: 'Hai già un account?',
    pt: 'Já tem uma conta?'
  },
  login: {
    fr: 'Connecte-toi',
    en: 'Log in',
    es: 'Inicia sesión',
    de: 'Anmelden',
    it: 'Accedi',
    pt: 'Entre'
  },
  usedFreeGames: {
    fr: '🎥 Tu as utilisé tes parties vidéo gratuites !',
    en: '🎥 You\'ve used your free video games!',
    es: '🎥 ¡Has usado tus partidas de video gratis!',
    de: '🎥 Du hast deine kostenlosen Videospiele aufgebraucht!',
    it: '🎥 Hai usato le tue partite video gratuite!',
    pt: '🎥 Você usou seus jogos de vídeo grátis!'
  },
  goPremium: {
    fr: 'Passer Premium →',
    en: 'Go Premium →',
    es: 'Hazte Premium →',
    de: 'Premium werden →',
    it: 'Passa a Premium →',
    pt: 'Seja Premium →'
  }
};

function getPaymentText(key, lang) {
  const text = PAYMENT_TRANSLATIONS[key];
  if (!text) return key;
  return text[lang] || text['fr'];
}

// Afficher le modal de paiement (accessible à tous)
function showPaymentModal() {
  // Fermer si déjà ouvert
  closePaymentModal();
  
  const user = JSON.parse(localStorage.getItem('saboteur_user') || '{}');
  const isLoggedIn = !!user.id;
  const lang = window.getCurrentLanguage ? window.getCurrentLanguage() : 'fr';
  
  const premiumFeatures = getPaymentText('premiumFeatures', lang);
  const packFeatures = getPaymentText('packFeatures', lang);
  
  const modal = document.createElement('div');
  modal.id = 'payment-modal';
  modal.innerHTML = `
    <div class="payment-modal-overlay" onclick="if(event.target === this) closePaymentModal()">
      <div class="payment-modal-content">
        <button class="payment-modal-close" onclick="closePaymentModal()">✕</button>
        
        <h2>${getPaymentText('title', lang)}</h2>
        <p class="payment-subtitle">${getPaymentText('subtitle', lang)}</p>
        
        <div class="payment-options">
          
          <div class="payment-card recommended">
            <div class="payment-badge">${getPaymentText('recommended', lang)}</div>
            <h3>${getPaymentText('premiumTitle', lang)}</h3>
            <div class="payment-price">1,49 €<span>${getPaymentText('perMonth', lang)}</span></div>
            <ul class="payment-features">
              <li>✅ ${premiumFeatures[0]}</li>
              <li>✅ ${premiumFeatures[1]}</li>
              <li>✅ ${premiumFeatures[2]}</li>
              <li>✅ ${premiumFeatures[3]}</li>
            </ul>
            <button class="payment-btn primary" onclick="startCheckout('subscription')">
              ${getPaymentText('subscribeBtn', lang)}
            </button>
          </div>
          
          <div class="payment-card">
            <h3>${getPaymentText('packTitle', lang)}</h3>
            <div class="payment-price">4,99 €<span>${getPaymentText('oneTime', lang)}</span></div>
            <ul class="payment-features">
              <li>✅ ${packFeatures[0]}</li>
              <li>✅ ${packFeatures[1]}</li>
              <li>✅ ${packFeatures[2]}</li>
              <li>✅ ${packFeatures[3]}</li>
            </ul>
            <button class="payment-btn secondary" onclick="startCheckout('pack')">
              ${getPaymentText('buyPackBtn', lang)}
            </button>
          </div>
          
        </div>
        
        ${!isLoggedIn ? `
        <div class="payment-login-notice">
          ${getPaymentText('loginNotice', lang)}
          <a href="index.html" class="payment-login-link">${getPaymentText('createAccount', lang)}</a>
        </div>
        ` : ''}
        
        <p class="payment-footer">
          ${getPaymentText('footer', lang)}<br>
          <small>${getPaymentText('footerSub', lang)}</small>
        </p>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Empêcher le scroll du body
  document.body.style.overflow = 'hidden';
}

// Fermer le modal
function closePaymentModal() {
  const modal = document.getElementById('payment-modal');
  if (modal) {
    modal.remove();
    document.body.style.overflow = '';
  }
}

// Lancer le checkout Stripe
async function startCheckout(priceType) {
  const user = JSON.parse(localStorage.getItem('saboteur_user') || '{}');
  const lang = window.getCurrentLanguage ? window.getCurrentLanguage() : 'fr';
  
  // Vérifier si connecté
  if (!user.id || !user.email) {
    showLoginRequiredModal();
    return;
  }
  
  // Trouver le bouton cliqué et le désactiver
  const buttons = document.querySelectorAll('.payment-btn');
  buttons.forEach(btn => {
    btn.disabled = true;
  });
  
  const clickedBtn = event.target;
  clickedBtn.textContent = getPaymentText('loading', lang);
  
  try {
    const response = await fetch('/api/stripe/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        priceType: priceType,
        userId: user.id,
        userEmail: user.email
      })
    });
    
    const data = await response.json();
    
    if (data.url) {
      // Rediriger vers Stripe Checkout
      window.location.href = data.url;
    } else {
      throw new Error(data.error || 'Impossible de créer la session de paiement');
    }
  } catch (error) {
    console.error('Erreur checkout:', error);
    alert('Erreur : ' + error.message);
    
    // Réactiver les boutons
    buttons.forEach(btn => {
      btn.disabled = false;
    });
    document.querySelector('.payment-btn.primary').textContent = getPaymentText('subscribeBtn', lang);
    document.querySelector('.payment-btn.secondary').textContent = getPaymentText('buyPackBtn', lang);
  }
}

// Modal "Compte requis"
function showLoginRequiredModal() {
  closePaymentModal();
  
  const lang = window.getCurrentLanguage ? window.getCurrentLanguage() : 'fr';
  
  const modal = document.createElement('div');
  modal.id = 'payment-modal';
  modal.innerHTML = `
    <div class="payment-modal-overlay" onclick="if(event.target === this) closePaymentModal()">
      <div class="payment-modal-content" style="max-width: 450px;">
        <button class="payment-modal-close" onclick="closePaymentModal()">✕</button>
        
        <div style="text-align: center; padding: 20px 0;">
          <div style="font-size: 60px; margin-bottom: 20px;">🔐</div>
          <h2 style="margin-bottom: 15px;">${getPaymentText('accountRequired', lang)}</h2>
          <p style="color: rgba(255,255,255,0.8); margin-bottom: 25px; line-height: 1.6;">
            ${getPaymentText('accountRequiredText', lang)}
          </p>
          
          <div style="display: flex; gap: 15px; justify-content: center; flex-wrap: wrap;">
            <a href="index.html" class="payment-btn primary" style="text-decoration: none; display: inline-block;">
              ${getPaymentText('createMyAccount', lang)}
            </a>
            <button class="payment-btn secondary" onclick="showPaymentModal()">
              ${getPaymentText('seeOffers', lang)}
            </button>
          </div>
          
          <p style="margin-top: 25px; font-size: 0.85em; color: rgba(255,255,255,0.5);">
            ${getPaymentText('alreadyAccount', lang)} <a href="index.html" style="color: var(--neon-main, #00ffff);">${getPaymentText('login', lang)}</a>
          </p>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  document.body.style.overflow = 'hidden';
}

// Vérifier si l'utilisateur doit voir le prompt d'upgrade
function shouldShowUpgradePrompt() {
  const user = JSON.parse(localStorage.getItem('saboteur_user') || '{}');
  return user.id && user.tier === 'free' && (user.videoCredits || 0) <= 0;
}

// Afficher le bandeau d'upgrade si nécessaire
function showUpgradeBannerIfNeeded() {
  if (!shouldShowUpgradePrompt()) return;
  
  // Ne pas afficher si déjà présent
  if (document.getElementById('upgrade-banner')) return;
  
  const lang = window.getCurrentLanguage ? window.getCurrentLanguage() : 'fr';
  
  const banner = document.createElement('div');
  banner.id = 'upgrade-banner';
  banner.innerHTML = `
    <div style="
      background: linear-gradient(135deg, #1a1a2e, #16213e); 
      border: 1px solid var(--neon-orange, #ff6600); 
      border-radius: 10px; 
      padding: 12px 20px; 
      margin: 10px; 
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 15px;
      flex-wrap: wrap;
    ">
      <span style="color: #fff;">${getPaymentText('usedFreeGames', lang)}</span>
      <button onclick="showPaymentModal()" style="
        padding: 8px 20px; 
        background: var(--neon-orange, #ff6600); 
        color: black; 
        border: none;
        border-radius: 5px; 
        cursor: pointer;
        font-weight: bold;
      ">
        ${getPaymentText('goPremium', lang)}
      </button>
      <button onclick="this.parentElement.parentElement.remove()" style="
        padding: 8px 12px;
        background: transparent;
        color: #888;
        border: 1px solid #444;
        border-radius: 5px;
        cursor: pointer;
      ">✕</button>
    </div>
  `;
  
  // Insérer en haut du body ou après le header
  const header = document.querySelector('header, .header, #header');
  if (header) {
    header.after(banner);
  } else {
    document.body.prepend(banner);
  }
}

// Gérer mon abonnement (portail Stripe)
async function manageSubscription() {
  const user = JSON.parse(localStorage.getItem('saboteur_user') || '{}');
  
  if (!user.stripeCustomerId) {
    alert('Pas d\'abonnement actif à gérer');
    return;
  }
  
  try {
    const response = await fetch('/api/stripe/create-portal-session', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('saboteur_token')}`
      }
    });
    
    const data = await response.json();
    
    if (data.url) {
      window.location.href = data.url;
    } else {
      throw new Error(data.error || 'Erreur');
    }
  } catch (error) {
    console.error('Erreur portail:', error);
    alert('Erreur : ' + error.message);
  }
}

// Auto-init au chargement si dans game.html
document.addEventListener('DOMContentLoaded', () => {
  // Afficher le bandeau si nécessaire (avec délai pour laisser le temps au DOM)
  setTimeout(showUpgradeBannerIfNeeded, 1000);
});

console.log('[Payment] Module de paiement chargé');

