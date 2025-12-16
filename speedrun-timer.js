class SpeedrunTimer {
  constructor() {
    // Variables de temps
    this.startTime = 0; // Moment où le timer démarre (en millisecondes)
    this.elapsedTime = 0; // Temps écoulé total (pour gérer les pauses)
    this.isRunning = false; // Est-ce que le timer est actif ?
    this.intervalId = null; // ID du setInterval pour pouvoir l'arrêter
    this.isActive = false; // Est-ce que le timer a été démarré au moins une fois ?
    this.isPausedManually = false; // Est-ce que le timer est en pause manuelle ? (bouton pause ou checkpoint final passé)
    // Checkpoints
    this.currentCheckpoint = 0; // Index du checkpoint actuel (0 = welcome, 1 = about, 2 = projects)
    this.checkpointButtons = document.querySelectorAll('.checkpoint-button');
    this.observers = []; // Stocker les IntersectionObservers
    
    this.timerContainer = document.getElementById('speedrun-timer');
    this.displayElement = document.querySelector('.timer-display');
    this.buttonElement = document.getElementById('timer-start-btn');
    
    // Initialisation
    this.init();
  }
  
  init() {
    // Écouteur d'événement sur le bouton
    this.buttonElement.addEventListener('click', () => this.handleButtonClick());
    
    // Écouteur pour la visibilité de l'onglet
    document.addEventListener('visibilitychange', () => this.handleVisibilityChange());
  }
  
  // GESTION DU BOUTON
  handleButtonClick() {
    if (!this.isActive) {
      // Premier clic : on démarre et on active le mode fixed
      this.start();
      this.activateFixedMode();
    } else {
      // Clics suivants : pause/reprise
      if (this.isRunning) {
        this.pause();
      } else {
        this.resume();
      }
    }
  }
  
  // CONTRÔLES DU TIMER
  start() {
    if (this.isRunning) return; // Déjà lancé
    
    this.isRunning = true;
    this.isActive = true;
    this.startTime = performance.now() - this.elapsedTime;

    // Appliquer la couleur du premier segment dès le début
    this.displayElement.style.borderColor = '#FFD700';  // Jaune
    this.displayElement.style.color = '#FFD700';
    
    // Lance la mise à jour toutes les 10ms (centièmes de seconde)
    this.intervalId = setInterval(() => {
      this.update();
    }, 10);
    
    // Change le bouton en mode "Pause"
    this.updateButton('pause');

    // Afficher et observer le 1er bouton checkpoint
    this.showCheckpointButton(0);
  }
  
  pause() {
    if (!this.isRunning) return; // Déjà en pause
    
    this.isRunning = false;
    clearInterval(this.intervalId);
    this.elapsedTime = performance.now() - this.startTime;
    
    // Change le bouton en mode "Resume"
    this.updateButton('resume');

    // Marquer comme pause manuelle
    this.isPausedManually = true;
  }
  
  resume() {
    if (this.isRunning) return; // Déjà en cours
    
    this.isRunning = true;
    this.startTime = performance.now() - this.elapsedTime;
    
    this.intervalId = setInterval(() => {
      this.update();
    }, 10);
    
    this.updateButton('pause');

    // Ce n'est plus une pause manuelle
    this.isPausedManually = false;
  }
  
  // MISE À JOUR DE L'AFFICHAGE
  update() {
    const currentTime = performance.now() - this.startTime;
    this.elapsedTime = currentTime;
    
    // Convertir en minutes:secondes:centièmes
    const totalSeconds = Math.floor(currentTime / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const centiseconds = Math.floor((currentTime % 1000) / 10);
    
    // Formater l'affichage (ajouter des zéros si nécessaire)
    const formatted = `${this.pad(minutes, 2)}:${this.pad(seconds, 2)}:${this.pad(centiseconds, 2)}`;
    this.displayElement.textContent = formatted;
  }
  
  // Fonction helper pour ajouter des zéros devant (ex: 5 -> 05)
  pad(num, size) {
    let s = num.toString();
    while (s.length < size) s = '0' + s;
    return s;
  }
  
  // NOTIFICATIONS
  showNotification(message) {
    // Créer l'élément notification
    const notification = document.createElement('div');
    notification.className = 'timer-notification';
    notification.textContent = `✓ ${message}`;
    
    // Ajouter au body
    document.body.appendChild(notification);
    
    // Démarrer le fade out après 4 secondes
    setTimeout(() => {
      notification.classList.add('fade-out');
    }, 4000);
    
    // Supprimer complètement après 7 secondes
    setTimeout(() => {
      notification.remove();
    }, 7000);
  }
  
  // GESTION DU MODE FIXED
  activateFixedMode() {
    // Ajouter la classe pour passer en mode fixed
    this.timerContainer.classList.add('timer-active');
    
    // Réduire la taille du bouton
    this.buttonElement.classList.add('timer-button-small');
  }

  // GESTION DES CHECKPOINTS
  showCheckpointButton(index, colorName = 'yellow') {
    if (index >= this.checkpointButtons.length) return;
    
    const button = this.checkpointButtons[index];
    
    // Appliquer la couleur au bouton
    button.classList.add('checkpoint-' + colorName);
    
    // Afficher le bouton avec animation
    button.style.display = 'block';
    setTimeout(() => {
      button.classList.add('appear');
    }, 50);
    
    // Ajouter l'écouteur de clic manuel
    button.addEventListener('click', () => this.handleCheckpointClick(button));
    
    // Créer l'observer immédiatement
    this.createCheckpointObserver(button);
  }

  handleCheckpointClick(button) {
  // Empêcher de valider si déjà validé
  if (button.classList.contains('completed')) return;
  
  const checkpointName = button.dataset.checkpoint;
  const nextSection = button.dataset.nextSection;
  
  // Valider le checkpoint
  this.validateCheckpoint(button, checkpointName, nextSection);
}

createCheckpointObserver(button) {
  let visibilityTimer = null;  // Timer pour tracker le temps de visibilité
  let canAutoValidate = false;  // Peut-on valider automatiquement ?
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      // Vérifier que le bouton n'est pas complété
      if (button.classList.contains('completed')) return;
      
      // Le bouton est visible
      if (entry.isIntersecting) {
        
        // Démarrer un timer de 2 secondes (ajustable)
        visibilityTimer = setTimeout(() => {
          canAutoValidate = true;
        }, 2000);  // 2 secondes de visibilité requises
        
      } 
      // Le bouton n'est plus visible
      else {
        // Annuler le timer si le bouton disparaît trop vite
        if (visibilityTimer) {
          clearTimeout(visibilityTimer);
        }
        
        // Valider si validation auto activée et bouton sorti par le haut
        if (canAutoValidate && entry.boundingClientRect.top < 0) {
          const checkpointName = button.dataset.checkpoint;
          const nextSection = button.dataset.nextSection;
          
          // Valider le checkpoint
          this.validateCheckpoint(button, checkpointName, nextSection);
        }
      }
    });
  }, {
    threshold: 0,
    rootMargin: '0px'
  });
  
  // Observer le bouton
  observer.observe(button);
  
  // Stocker l'observer
  this.observers.push(observer);
}

validateCheckpoint(button, checkpointName, nextSection) {
  // Marquer le bouton comme complété
  button.classList.add('completed');
  button.classList.remove('appear');
  
  // Afficher une notification
  this.showNotification(`✓ ${checkpointName} completed!`);
  
  // Incrémenter le checkpoint actuel
  this.currentCheckpoint++;
  
  // Si c'est le dernier checkpoint (Projects)
  if (nextSection === 'end') {
    this.finishSpeedrun();
  } else {
    // Déterminer la couleur pour le prochain segment
    let nextColorName;
    if (this.currentCheckpoint === 1) {
      nextColorName = 'orange'; // Orange pour About Me
    } else if (this.currentCheckpoint === 2) {
      nextColorName = 'red'; // Rouge pour Projects
    }
    
    // Changer la couleur du timer
    this.displayElement.classList.remove('timer-yellow', 'timer-orange', 'timer-red');
    this.displayElement.classList.add('timer-' + nextColorName);
    
    // Afficher le prochain bouton checkpoint avec la bonne couleur
    this.showCheckpointButton(this.currentCheckpoint, nextColorName);
  }
}

finishSpeedrun() {
  // Arrêter le timer
  this.pause();
  this.isPausedManually = true; // Empêcher toute reprise si pause manuel
  
  // Animation de victoire
  this.displayElement.style.borderColor = '#00FFD4';
  this.displayElement.style.color = '#00FFD4';
  this.displayElement.style.boxShadow = '0 0 25px rgba(0, 255, 212, 0.8), 0 0 50px rgba(0, 255, 212, 0.4)';
  this.displayElement.style.animation = 'victory-pulse 1s ease-in-out infinite';
  
  // Notification finale (plus longue)
  this.showFinalNotification();
  
  // Déconnecter tous les observers
  this.observers.forEach(obs => obs.disconnect());
}

showFinalNotification() {
  const notification = document.createElement('div');
  notification.className = 'timer-notification timer-notification-final';
  notification.textContent = '🎉 Portfolio completed! Thank you for visiting!';
  
  document.body.appendChild(notification);
  
  // Fade out après 8 secondes (au lieu de 4)
  setTimeout(() => {
    notification.classList.add('fade-out');
  }, 8000);
  
  // Supprimer après 11 secondes (au lieu de 7)
  setTimeout(() => {
    notification.remove();
  }, 11000);
}
  
  // GESTION DU BOUTON
  updateButton(state) {
    if (state === 'pause') {
      this.buttonElement.innerHTML = '❚❚'; // Symbole pause
    } else if (state === 'resume') {
      this.buttonElement.innerHTML = '▶'; // Symbole play
    }
  }
  
  // GESTION DE L'ONGLET ACTIF
  handleVisibilityChange() {
    if (document.hidden) {
      // L'utilisateur a changé d'onglet
      if (this.isRunning) {
        this.pause();
        this.isPausedManually = false; // Vérification que ce n'est pas une pause manuelle
      }
    } else {
      // L'utilisateur est revenu sur l'onglet, le timer est actif et il n'y a pas de pause manuelle
      if (this.isActive && !this.isRunning && !this.isPausedManually) {
        this.resume();
      }
    }
  }
}

// INITIALISATION AU CHARGEMENT DE LA PAGE
// Attendre que le DOM soit complètement chargé
document.addEventListener('DOMContentLoaded', () => {
    const timer = new SpeedrunTimer();
});