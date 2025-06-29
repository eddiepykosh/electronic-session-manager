class DarkModeManager {
  constructor() {
    this.darkModeSwitch = document.getElementById('dark-mode-switch');
    this.isDarkMode = false;
    
    this.init();
  }

  init() {
    // Load saved preference
    this.loadDarkModePreference();
    
    // Add event listener
    this.darkModeSwitch.addEventListener('change', () => {
      this.toggleDarkMode();
    });
    
    // Apply initial theme
    this.applyTheme();
  }

  loadDarkModePreference() {
    try {
      const saved = localStorage.getItem('darkMode');
      this.isDarkMode = saved === 'true';
      this.darkModeSwitch.checked = this.isDarkMode;
    } catch (error) {
      console.warn('Could not load dark mode preference:', error);
      this.isDarkMode = false;
    }
  }

  saveDarkModePreference() {
    try {
      localStorage.setItem('darkMode', this.isDarkMode.toString());
    } catch (error) {
      console.warn('Could not save dark mode preference:', error);
    }
  }

  toggleDarkMode() {
    this.isDarkMode = this.darkModeSwitch.checked;
    this.applyTheme();
    this.saveDarkModePreference();
  }

  applyTheme() {
    const root = document.documentElement;
    
    if (this.isDarkMode) {
      root.classList.add('dark-mode');
    } else {
      root.classList.remove('dark-mode');
    }
  }

  isDarkModeEnabled() {
    return this.isDarkMode;
  }
}

export default DarkModeManager; 