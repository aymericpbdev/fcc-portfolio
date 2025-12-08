class SpeedrunTimer {
  constructor() {
    // Variables de temps
    this.startTime = 0;           // Moment où le timer démarre (en millisecondes)
    this.elapsedTime = 0;         // Temps écoulé total (pour gérer les pauses)
    this.isRunning = false;       // Est-ce que le timer est actif ?
    this.intervalId = null;       // ID du setInterval pour pouvoir l'arrêter
    this.isActive = false;        // Est-ce que le timer a été démarré au moins une fois ?
    
    // Segments (5min, 10min, 15min en millisecondes)
    this.segments = [
      { time: 5 * 1000, reached: false, name: '1st segment', color: '#FFD700' },   // Jaune/Or
      { time: 10 * 1000, reached: false, name: '2nd segment', color: '#FFA500' },  // Orange
      { time: 15 * 1000, reached: false, name: 'Final time', color: '#FF4444' }    // Rouge
    ];
    
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
  }
  
  pause() {
    if (!this.isRunning) return; // Déjà en pause
    
    this.isRunning = false;
    clearInterval(this.intervalId);
    this.elapsedTime = performance.now() - this.startTime;
    
    // Change le bouton en mode "Resume"
    this.updateButton('resume');
  }
  
  resume() {
    if (this.isRunning) return; // Déjà en cours
    
    this.isRunning = true;
    this.startTime = performance.now() - this.elapsedTime;
    
    this.intervalId = setInterval(() => {
      this.update();
    }, 10);
    
    this.updateButton('pause');
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
    
    // Vérifier les segments
    this.checkSegments(currentTime);
  }
  
  // Fonction helper pour ajouter des zéros devant (ex: 5 -> 05)
  pad(num, size) {
    let s = num.toString();
    while (s.length < size) s = '0' + s;
    return s;
  }
  
  // GESTION DES SEGMENTS
  checkSegments(currentTime) {
    this.segments.forEach((segment, index) => {
      if (!segment.reached && currentTime >= segment.time) {
        segment.reached = true;
        this.onSegmentReached(segment, index);
      }
    });
  }
  
 onSegmentReached(segment, index) {
  // Afficher une notification
  this.showNotification(segment.name);
  
  // Changer la couleur pour le prochain segment
  if (index === 0) {
    // à 5min => orange (2ème segment)
    this.displayElement.style.borderColor = '#FFA500';
    this.displayElement.style.color = '#FFA500';
  } else if (index === 1) {
    // à 10min => rouge (3ème segment)
    this.displayElement.style.borderColor = '#FF4444';
    this.displayElement.style.color = '#FF4444';
  } else if (index === 2) {
    // à 15min => cyan (couleur finale)
    this.displayElement.style.borderColor = '#00FFD4';  // Cyan brillant
    this.displayElement.style.color = '#00FFD4';
    this.displayElement.style.boxShadow = '0 0 25px rgba(0, 255, 212, 0.8), 0 0 50px rgba(0, 255, 212, 0.4)';
    // Animation de pulsation lente et "calme"
    this.displayElement.style.animation = 'victory-pulse 2s ease-in-out infinite';
  }
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
      }
    } else {
      // L'utilisateur est revenu sur l'onglet
      if (this.isActive && !this.isRunning) {
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