// ============================================
// RORONOA GAMES - Site Vitrine JavaScript
// ============================================

// Mobile menu toggle
function toggleMobileMenu() {
  const nav = document.querySelector('.nav-links');
  nav.classList.toggle('active');
}

// Login modal
function openLoginModal() {
  const modal = document.getElementById('modal-login');
  if (modal) {
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }
}

function closeLoginModal() {
  const modal = document.getElementById('modal-login');
  if (modal) {
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
  }
}

// Forgot password modal (simple redirect pour l'instant)
function openForgotPasswordModal() {
  const email = document.querySelector('#login-form input[name="email"]')?.value || '';
  
  if (!email) {
    alert('Veuillez d\'abord entrer votre email dans le champ ci-dessus.');
    return;
  }
  
  // Demander confirmation
  if (confirm(`Un email de réinitialisation sera envoyé à :\n${email}\n\nContinuer ?`)) {
    // Envoyer la demande de réinitialisation
    fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    })
    .then(response => response.json())
    .then(data => {
      if (data.error) {
        alert('Erreur: ' + data.error);
      } else {
        alert('✅ Si un compte existe avec cet email, vous recevrez un lien de réinitialisation.');
      }
    })
    .catch(error => {
      console.error('Erreur:', error);
      alert('Erreur de connexion au serveur');
    });
  }
}

// Switch auth tabs
function switchAuthTab(tab) {
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const tabs = document.querySelectorAll('.auth-tab');
  
  tabs.forEach(t => t.classList.remove('active'));
  
  if (tab === 'login') {
    tabs[0].classList.add('active');
    loginForm.classList.add('active');
    loginForm.style.display = 'block';
    registerForm.classList.remove('active');
    registerForm.style.display = 'none';
  } else {
    tabs[1].classList.add('active');
    loginForm.classList.remove('active');
    loginForm.style.display = 'none';
    registerForm.classList.add('active');
    registerForm.style.display = 'block';
  }
}

// Toggle password visibility
function togglePassword(inputId, button) {
  const input = document.getElementById(inputId);
  if (!input) return;
  
  if (input.type === 'password') {
    input.type = 'text';
    button.textContent = '🙈';
  } else {
    input.type = 'password';
    button.textContent = '👁️';
  }
}

// Handle login
async function handleLogin(event) {
  event.preventDefault();
  const form = event.target;
  const formData = new FormData(form);
  const submitBtn = form.querySelector('button[type="submit"]');
  
  // Désactiver le bouton pendant la requête
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Connexion...';
  }
  
  const data = {
    email: formData.get('email'),
    password: formData.get('password')
  };
  
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    const result = await response.json();
    
    if (response.ok) {
      localStorage.setItem('token', result.token);
      localStorage.setItem('saboteur_token', result.token);
      if (result.user) {
        localStorage.setItem('saboteur_user', JSON.stringify(result.user));
      }
      
      closeLoginModal();
      
      // Rediriger vers la page compte
      window.location.href = '/account.html';
    } else {
      alert('Erreur: ' + (result.error || 'Identifiants invalides'));
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Se Connecter';
      }
    }
  } catch (error) {
    console.error('Erreur de connexion:', error);
    alert('Erreur de connexion au serveur');
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Se Connecter';
    }
  }
}

// Handle registration
async function handleRegister(event) {
  event.preventDefault();
  const form = event.target;
  const formData = new FormData(form);
  
  const password = formData.get('password');
  const confirmPassword = formData.get('confirm_password');
  
  if (password !== confirmPassword) {
    alert('Les mots de passe ne correspondent pas');
    return;
  }
  
  const data = {
    email: formData.get('email'),
    username: formData.get('username'),
    password: password,
    account_type: 'client_site'
  };
  
  try {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    const result = await response.json();
    
    if (response.ok) {
      alert('Inscription réussie ! Vous allez recevoir un email de vérification.');
      switchAuthTab('login');
      
      // Pré-remplir l'email
      const loginEmailInput = document.querySelector('#login-form input[name="email"]');
      if (loginEmailInput) {
        loginEmailInput.value = data.email;
      }
    } else {
      alert('Erreur: ' + (result.error || 'Inscription impossible'));
    }
  } catch (error) {
    console.error('Erreur d\'inscription:', error);
    alert('Erreur de connexion au serveur');
  }
}

// Handle contact form
async function sendContact(event) {
  event.preventDefault();
  const form = event.target;
  const formData = new FormData(form);
  
  const data = {
    name: formData.get('name'),
    email: formData.get('email'),
    message: formData.get('message')
  };
  
  try {
    const response = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    if (response.ok) {
      alert('Message envoyé avec succès ! Nous vous répondrons bientôt.');
      form.reset();
    } else {
      const result = await response.json();
      alert('Erreur: ' + (result.error || 'Envoi impossible'));
    }
  } catch (error) {
    console.error('Erreur d\'envoi:', error);
    alert('Erreur de connexion au serveur');
  }
}

// Smooth scroll
document.addEventListener('DOMContentLoaded', function() {
  // Smooth scroll pour les ancres
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (href === '#') return;
      
      e.preventDefault();
      const target = document.querySelector(href);
      
      if (target) {
        const headerOffset = 80;
        const elementPosition = target.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
        
        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
        
        // Fermer le menu mobile
        const nav = document.querySelector('.nav-links');
        if (nav) nav.classList.remove('active');
      }
    });
  });
  
  // Fermer le modal en cliquant en dehors
  const modal = document.getElementById('modal-login');
  if (modal) {
    const overlay = modal.querySelector('.modal-overlay');
    if (overlay) {
      overlay.addEventListener('click', closeLoginModal);
    }
  }
  
  // Échapper pour fermer le modal
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      closeLoginModal();
    }
  });
  
  // Vérifier si l'utilisateur est déjà connecté
  checkAuthStatus();
});

// Vérifier si l'utilisateur est déjà connecté
function checkAuthStatus() {
  const token = localStorage.getItem('token') || localStorage.getItem('saboteur_token');
  
  if (token) {
    const loginBtn = document.querySelector('.btn-login');
    if (loginBtn) {
      loginBtn.textContent = 'Mon Compte';
      loginBtn.onclick = function() {
        // Rediriger vers la page Mon Compte
        window.location.href = '/account.html';
      };
    }
  }
}

// Toggle password visibility
function togglePasswordVisibility(inputId, button) {
  const input = document.getElementById(inputId);
  if (!input) return;
  
  if (input.type === 'password') {
    input.type = 'text';
    button.textContent = '🙈';
  } else {
    input.type = 'password';
    button.textContent = '👁️';
  }
}

// Parallax effect pour le hero (optionnel)
let ticking = false;

window.addEventListener('scroll', function() {
  if (!ticking) {
    window.requestAnimationFrame(function() {
      const scrolled = window.pageYOffset;
      const slashes = document.querySelectorAll('.slash-element');
      
      slashes.forEach((slash, index) => {
        const speed = 0.3 + (index * 0.1);
        slash.style.transform = `rotate(-45deg) translateX(${scrolled * speed}px)`;
      });
      
      ticking = false;
    });
    
    ticking = true;
  }
});

// Helper function pour échapper HTML (utilisé dans admin)
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Console Easter Egg
console.log('%c⚔️ RORONOA GAMES ⚔️', 'color: #6B9D3A; font-size: 24px; font-weight: bold;');
console.log('%c三刀流 Santōryū Style', 'color: #4A7C28; font-size: 14px;');
console.log('%cBienvenue dans le code source !', 'color: #2D5016; font-size: 12px;');

// ==========================================
// PREPARE GAME LINK
// ==========================================

/**
 * Prépare le lien vers le jeu - vérifie la connexion et ouvre dans une nouvelle fenêtre
 */
function prepareGameLink(event) {
  // Ne pas empêcher l'ouverture du lien, mais afficher un message si pas connecté
  const token = localStorage.getItem('saboteur_token') || localStorage.getItem('token');
  
  if (!token) {
    // Pas connecté - informer l'utilisateur mais laisser accéder au jeu
    console.log('[Auth] Utilisateur non connecté - redirection vers le jeu');
  } else {
    console.log('[Auth] Utilisateur connecté - ouverture du jeu');
  }
  
  // Le lien s'ouvre normalement avec target="_blank"
  // Le localStorage est partagé entre les pages du même domaine
}

/**
 * Ouvre le modal de connexion pour les non-connectés qui veulent acheter
 */
function requireLoginForPurchase(targetUrl) {
  const token = localStorage.getItem('saboteur_token') || localStorage.getItem('token');
  
  if (!token) {
    // Pas connecté - ouvrir le modal de connexion
    alert('⚠️ Vous devez être connecté pour effectuer cet achat.');
    openLoginModal();
    return false;
  }
  
  // Connecté - autoriser l'achat
  return true;
}
