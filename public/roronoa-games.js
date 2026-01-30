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

// Switch auth tabs
function switchAuthTab(tab) {
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const tabs = document.querySelectorAll('.auth-tab');
  
  tabs.forEach(t => t.classList.remove('active'));
  
  if (tab === 'login') {
    tabs[0].classList.add('active');
    loginForm.classList.add('active');
    registerForm.classList.remove('active');
  } else {
    tabs[1].classList.add('active');
    loginForm.classList.remove('active');
    registerForm.classList.add('active');
  }
}

// Handle login
async function handleLogin(event) {
  event.preventDefault();
  const form = event.target;
  const formData = new FormData(form);
  
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
      
      alert('Connexion réussie ! Redirection...');
      window.location.href = '/index.html';
    } else {
      alert('Erreur: ' + (result.error || 'Identifiants invalides'));
    }
  } catch (error) {
    console.error('Erreur de connexion:', error);
    alert('Erreur de connexion au serveur');
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
        window.location.href = '/index.html';
      };
    }
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
