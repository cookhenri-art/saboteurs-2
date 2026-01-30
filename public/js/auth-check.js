/**
 * AUTH-CHECK.JS
 * Script de vérification d'authentification pour les paiements et accès compte
 * À inclure dans toutes les pages avec des boutons de paiement
 */

// ==========================================
// VÉRIFICATION DE CONNEXION
// ==========================================

/**
 * Vérifie si l'utilisateur est connecté
 * @returns {boolean} True si connecté, False sinon
 */
function isUserLoggedIn() {
  const token = localStorage.getItem('saboteur_token');
  
  if (!token) {
    return false;
  }
  
  try {
    // Décoder le JWT pour vérifier l'expiration
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expirationDate = payload.exp * 1000; // Convertir en millisecondes
    
    if (Date.now() >= expirationDate) {
      // Token expiré
      localStorage.removeItem('saboteur_token');
      return false;
    }
    
    return true;
  } catch (error) {
    // Token invalide
    localStorage.removeItem('saboteur_token');
    return false;
  }
}

/**
 * Redirige vers la page de connexion avec un message et une URL de retour
 * @param {string} returnUrl - URL vers laquelle retourner après connexion
 * @param {string} message - Message à afficher sur la page de connexion
 */
function redirectToLogin(returnUrl, message = null) {
  const loginUrl = new URL('/index.html', window.location.origin);
  
  if (returnUrl) {
    loginUrl.searchParams.set('redirect', returnUrl);
  }
  
  if (message) {
    loginUrl.searchParams.set('message', message);
  }
  
  window.location.href = loginUrl.toString();
}

// ==========================================
// PROTECTION DES BOUTONS DE PAIEMENT
// ==========================================

/**
 * Protège un bouton de paiement en vérifiant la connexion
 * @param {string} buttonId - ID du bouton à protéger
 * @param {string} targetUrl - URL vers laquelle rediriger si connecté
 */
function protectPaymentButton(buttonId, targetUrl) {
  const button = document.getElementById(buttonId);
  
  if (!button) {
    console.warn(`[Auth-Check] Bouton ${buttonId} introuvable`);
    return;
  }
  
  button.addEventListener('click', function(e) {
    e.preventDefault();
    
    if (!isUserLoggedIn()) {
      // Pas connecté → Rediriger vers inscription/connexion
      redirectToLogin(
        targetUrl,
        'Veuillez vous connecter pour effectuer cet achat'
      );
    } else {
      // Connecté → Rediriger vers le checkout
      window.location.href = targetUrl;
    }
  });
}

/**
 * Protège tous les liens Stripe Checkout sur la page
 */
function protectAllCheckoutLinks() {
  // Sélectionner tous les liens/boutons vers Stripe Checkout
  const checkoutLinks = document.querySelectorAll('a[href*="/api/stripe/checkout"], button[onclick*="checkout"]');
  
  checkoutLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      if (!isUserLoggedIn()) {
        e.preventDefault();
        
        // Récupérer l'URL cible
        let targetUrl = this.href || this.getAttribute('data-checkout-url');
        
        redirectToLogin(
          targetUrl,
          'Veuillez vous connecter pour effectuer cet achat'
        );
      }
    });
  });
}

// ==========================================
// MISE À JOUR DU BOUTON "MON COMPTE"
// ==========================================

/**
 * Met à jour le bouton "Mon Compte" dans le header
 */
function updateAccountButton() {
  // Chercher le bouton "Mon Compte" dans le header
  const accountButtons = document.querySelectorAll('a[href="#"], button');
  
  accountButtons.forEach(button => {
    const text = button.textContent.trim().toUpperCase();
    
    if (text.includes('MON COMPTE') || text.includes('COMPTE')) {
      // Mettre à jour le lien
      if (button.tagName === 'A') {
        button.href = '/account.html';
      } else {
        button.onclick = function(e) {
          e.preventDefault();
          
          if (!isUserLoggedIn()) {
            redirectToLogin('/account.html', 'Veuillez vous connecter pour accéder à votre compte');
          } else {
            window.location.href = '/account.html';
          }
        };
      }
    }
  });
}

/**
 * Met à jour tous les liens vers "Mon Compte"
 */
function updateAllAccountLinks() {
  const accountLinks = document.querySelectorAll('a[href*="account"], a[href="#compte"]');
  
  accountLinks.forEach(link => {
    link.href = '/account.html';
    
    link.addEventListener('click', function(e) {
      if (!isUserLoggedIn()) {
        e.preventDefault();
        redirectToLogin('/account.html', 'Veuillez vous connecter pour accéder à votre compte');
      }
    });
  });
}

// ==========================================
// PROTECTION DES PAGES
// ==========================================

/**
 * Protège une page entière (redirige si pas connecté)
 */
function protectPage() {
  if (!isUserLoggedIn()) {
    redirectToLogin(window.location.pathname);
  }
}

/**
 * Affiche/masque des éléments selon l'état de connexion
 */
function toggleElementsByAuth() {
  const isLoggedIn = isUserLoggedIn();
  
  // Afficher les éléments pour utilisateurs connectés
  document.querySelectorAll('[data-auth="logged-in"]').forEach(el => {
    el.style.display = isLoggedIn ? '' : 'none';
  });
  
  // Afficher les éléments pour utilisateurs non connectés
  document.querySelectorAll('[data-auth="logged-out"]').forEach(el => {
    el.style.display = isLoggedIn ? 'none' : '';
  });
}

// ==========================================
// INITIALISATION AUTOMATIQUE
// ==========================================

/**
 * Initialise automatiquement les protections au chargement de la page
 */
function initAuthCheck() {
  // Mettre à jour le bouton "Mon Compte"
  updateAccountButton();
  updateAllAccountLinks();
  
  // Protéger les liens de checkout
  protectAllCheckoutLinks();
  
  // Afficher/masquer les éléments selon l'authentification
  toggleElementsByAuth();
  
  console.log('[Auth-Check] Initialisé - User logged in:', isUserLoggedIn());
}

// Initialiser au chargement de la page
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAuthCheck);
} else {
  initAuthCheck();
}

// ==========================================
// EXPORTS (si utilisé comme module)
// ==========================================

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    isUserLoggedIn,
    redirectToLogin,
    protectPaymentButton,
    protectAllCheckoutLinks,
    protectPage,
    toggleElementsByAuth,
    updateAccountButton,
    updateAllAccountLinks
  };
}
