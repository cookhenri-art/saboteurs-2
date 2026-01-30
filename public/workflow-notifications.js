// ============================================
// SYSTÈME DE POP-UPS WORKFLOWS
// À ajouter dans public/index.html
// ============================================

// Vérifier les notifications au chargement
async function checkWorkflowNotifications() {
  const token = localStorage.getItem('token');
  if (!token) return;
  
  try {
    const response = await fetch('/api/notifications', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) return;
    
    const notifications = await response.json();
    
    // Afficher chaque notification avec un délai
    notifications.forEach((notif, index) => {
      setTimeout(() => {
        showWorkflowPopup(notif.message);
      }, index * 1000); // 1 seconde entre chaque
    });
    
  } catch (error) {
    console.error('[Workflows] Erreur notifications:', error);
  }
}

// Afficher un pop-up
function showWorkflowPopup(message) {
  // Créer le conteneur du pop-up
  const popup = document.createElement('div');
  popup.className = 'workflow-notification';
  popup.innerHTML = `
    <div class="workflow-notification-content">
      <div class="workflow-notification-icon">🎉</div>
      <div class="workflow-notification-message">${message}</div>
      <button class="workflow-notification-close" onclick="this.closest('.workflow-notification').remove()">✕</button>
    </div>
  `;
  
  // Ajouter au body
  document.body.appendChild(popup);
  
  // Animation d'entrée
  setTimeout(() => {
    popup.classList.add('show');
  }, 10);
  
  // Auto-fermer après 10 secondes
  setTimeout(() => {
    popup.classList.add('hide');
    setTimeout(() => {
      popup.remove();
    }, 300);
  }, 10000);
}

// Appeler au chargement de la page (après login)
document.addEventListener('DOMContentLoaded', () => {
  // Attendre un peu que l'utilisateur soit connecté
  setTimeout(checkWorkflowNotifications, 1000);
});

// Appeler aussi après un login réussi
// (À ajouter dans ta fonction de login existante)
/*
function handleLoginSuccess() {
  // ... ton code de login existant ...
  
  // Vérifier les notifications
  checkWorkflowNotifications();
}
*/
