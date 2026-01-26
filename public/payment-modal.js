/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║            💳 SABOTEUR - MODAL DE PAIEMENT STRIPE                         ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

// Afficher le modal de paiement (accessible à tous)
function showPaymentModal() {
  // Fermer si déjà ouvert
  closePaymentModal();
  
  const user = JSON.parse(localStorage.getItem('saboteur_user') || '{}');
  const isLoggedIn = !!user.id;
  
  const modal = document.createElement('div');
  modal.id = 'payment-modal';
  modal.innerHTML = `
    <div class="payment-modal-overlay" onclick="if(event.target === this) closePaymentModal()">
      <div class="payment-modal-content">
        <button class="payment-modal-close" onclick="closePaymentModal()">✕</button>
        
        <h2>🎉 Passe au niveau supérieur !</h2>
        <p class="payment-subtitle">Profite de la visioconférence et des avatars IA</p>
        
        <div class="payment-options">
          
          <div class="payment-card recommended">
            <div class="payment-badge">⭐ RECOMMANDÉ</div>
            <h3>🌟 Premium Mensuel</h3>
            <div class="payment-price">1,49 €<span>/mois</span></div>
            <ul class="payment-features">
              <li>✅ Visioconférence <strong>illimitée</strong></li>
              <li>✅ <strong>30 avatars IA</strong> / mois</li>
              <li>✅ <strong>4 univers</strong> de jeu</li>
              <li>✅ Sans engagement, annulable</li>
            </ul>
            <button class="payment-btn primary" onclick="startCheckout('subscription')">
              S'abonner maintenant
            </button>
          </div>
          
          <div class="payment-card">
            <h3>📦 Pack 50 Crédits</h3>
            <div class="payment-price">4,99 €<span> une fois</span></div>
            <ul class="payment-features">
              <li>✅ <strong>50 parties</strong> en vidéo</li>
              <li>✅ <strong>50 avatars IA</strong> à créer</li>
              <li>✅ Badge <strong>"Supporter"</strong></li>
              <li>✅ Crédits valables <strong>à vie</strong></li>
            </ul>
            <button class="payment-btn secondary" onclick="startCheckout('pack')">
              Acheter le pack
            </button>
          </div>
          
        </div>
        
        ${!isLoggedIn ? `
        <div class="payment-login-notice">
          💡 <strong>Astuce :</strong> Crée un compte gratuit pour profiter des offres !
          <a href="index.html" class="payment-login-link">Créer mon compte →</a>
        </div>
        ` : ''}
        
        <p class="payment-footer">
          🔒 Paiement sécurisé par Stripe<br>
          <small>Tu peux annuler ton abonnement à tout moment</small>
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
  clickedBtn.textContent = 'Chargement...';
  
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
    document.querySelector('.payment-btn.primary').textContent = "S'abonner maintenant";
    document.querySelector('.payment-btn.secondary').textContent = 'Acheter le pack';
  }
}

// Modal "Compte requis"
function showLoginRequiredModal() {
  closePaymentModal();
  
  const modal = document.createElement('div');
  modal.id = 'payment-modal';
  modal.innerHTML = `
    <div class="payment-modal-overlay" onclick="if(event.target === this) closePaymentModal()">
      <div class="payment-modal-content" style="max-width: 450px;">
        <button class="payment-modal-close" onclick="closePaymentModal()">✕</button>
        
        <div style="text-align: center; padding: 20px 0;">
          <div style="font-size: 60px; margin-bottom: 20px;">🔐</div>
          <h2 style="margin-bottom: 15px;">Compte requis</h2>
          <p style="color: rgba(255,255,255,0.8); margin-bottom: 25px; line-height: 1.6;">
            Pour acheter une offre Premium, tu dois d'abord créer un compte gratuit.<br>
            <strong>C'est rapide et ça prend 30 secondes !</strong>
          </p>
          
          <div style="display: flex; gap: 15px; justify-content: center; flex-wrap: wrap;">
            <a href="index.html" class="payment-btn primary" style="text-decoration: none; display: inline-block;">
              ✨ Créer mon compte
            </a>
            <button class="payment-btn secondary" onclick="showPaymentModal()">
              ← Voir les offres
            </button>
          </div>
          
          <p style="margin-top: 25px; font-size: 0.85em; color: rgba(255,255,255,0.5);">
            Tu as déjà un compte ? <a href="index.html" style="color: var(--neon-main, #00ffff);">Connecte-toi</a>
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
      <span style="color: #fff;">🎥 Tu as utilisé tes parties vidéo gratuites !</span>
      <button onclick="showPaymentModal()" style="
        padding: 8px 20px; 
        background: var(--neon-orange, #ff6600); 
        color: black; 
        border: none;
        border-radius: 5px; 
        cursor: pointer;
        font-weight: bold;
      ">
        Passer Premium →
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

