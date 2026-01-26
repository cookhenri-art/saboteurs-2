/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║            💳 SABOTEUR - MODAL DE PAIEMENT STRIPE                         ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

// Afficher le modal de paiement
function showPaymentModal() {
  const user = JSON.parse(localStorage.getItem('saboteur_user') || '{}');
  
  if (!user.id) {
    alert('Tu dois être connecté pour accéder aux offres premium !');
    window.location.href = 'index.html';
    return;
  }
  
  // Fermer si déjà ouvert
  closePaymentModal();
  
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
            <h3>Premium Mensuel</h3>
            <div class="payment-price">1,49 €<span>/mois</span></div>
            <ul class="payment-features">
              <li>✅ Visioconférence illimitée</li>
              <li>✅ 30 avatars IA / mois</li>
              <li>✅ Tous les thèmes</li>
              <li>✅ Sans engagement</li>
            </ul>
            <button class="payment-btn primary" onclick="startCheckout('subscription')">
              S'abonner maintenant
            </button>
          </div>
          
          <div class="payment-card">
            <h3>Pack 50 Crédits</h3>
            <div class="payment-price">4,99 €<span> une fois</span></div>
            <ul class="payment-features">
              <li>✅ 50 parties vidéo</li>
              <li>✅ 50 avatars IA</li>
              <li>✅ Badge "Supporter"</li>
              <li>✅ Valable à vie</li>
            </ul>
            <button class="payment-btn secondary" onclick="startCheckout('pack')">
              Acheter le pack
            </button>
          </div>
          
        </div>
        
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
  
  if (!user.id || !user.email) {
    alert('Erreur : utilisateur non connecté');
    return;
  }
  
  // Trouver le bouton cliqué et le désactiver
  const buttons = document.querySelectorAll('.payment-btn');
  buttons.forEach(btn => {
    btn.disabled = true;
    if (btn.textContent.includes(priceType === 'subscription' ? 'abonner' : 'Acheter')) {
      btn.textContent = 'Chargement...';
    }
  });
  
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
