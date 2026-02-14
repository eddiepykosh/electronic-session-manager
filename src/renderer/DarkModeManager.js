/**
 * DarkModeManager - Theme Management System
 * 
 * Manages the application's dark/light theme switching functionality. This class
 * provides a centralized way to handle theme preferences, persistence, and
 * real-time theme application across the entire application.
 * 
 * Architecture Role:
 * - UI Component Manager: Coordinates theme switching with the DOM
 * - State Manager: Maintains current theme state and user preferences
 * - Persistence Layer: Handles saving/loading theme preferences to localStorage
 * 
 * Key Responsibilities:
 * - Initialize and manage the dark mode toggle switch
 * - Load and save user theme preferences to localStorage
 * - Apply theme changes to the document root element
 * - Provide theme state information to other components
 * 
 * Features:
 * - Automatic preference persistence across sessions
 * - Graceful error handling for localStorage operations
 * - Real-time theme switching without page reload
 * - CSS class-based theme application for performance
 * 
 * Dependencies:
 * - Requires a checkbox element with id 'dark-mode-switch' in the DOM
 * - Relies on CSS classes 'dark-mode' being defined in stylesheets
 * - Uses localStorage for preference persistence
 * 
 * Usage:
 * const darkModeManager = new DarkModeManager();
 * const isDark = darkModeManager.isDarkModeEnabled();
 * 
 * @author Electronic Session Manager
 * @version 1.0.0
 */

class DarkModeManager {
  /**
   * Initialize the DarkModeManager with DOM elements and state
   * 
   * Sets up the dark mode toggle switch reference and initializes
   * the theme system with saved preferences or defaults.
   */
  constructor() {
    // Reference to the dark mode toggle switch in the UI
    this.darkModeSwitch = document.getElementById('dark-mode-switch');
    
    // Internal state tracking for current theme mode
    this.isDarkMode = false;
    
    // Only initialize if the toggle switch element exists in the DOM
    if (!this.darkModeSwitch) {
      console.warn('DarkModeManager: dark-mode-switch element not found in DOM');
      return;
    }

    // Initialize the theme system
    this.init();
  }

  /**
   * Initialize the dark mode system
   * 
   * Sets up event listeners, loads saved preferences, and applies
   * the initial theme to the application.
   */
  init() {
    // Guard against missing DOM element
    if (!this.darkModeSwitch) {
      console.warn('DarkModeManager.init: dark-mode-switch element not found, skipping initialization');
      return;
    }

    // Load any previously saved theme preference from localStorage
    this.loadDarkModePreference();
    
    // Add event listener to the toggle switch for real-time theme changes
    this.darkModeSwitch.addEventListener('change', () => {
      this.toggleDarkMode();
    });
    
    // Apply the initial theme based on loaded preferences
    this.applyTheme();
  }

  /**
   * Load dark mode preference from localStorage
   * 
   * Attempts to retrieve the user's saved theme preference from
   * localStorage. Falls back to light mode if no preference is found
   * or if an error occurs during loading.
   */
  loadDarkModePreference() {
    try {
      // Retrieve saved preference from localStorage
      const saved = localStorage.getItem('darkMode');
      
      // Convert string to boolean and update internal state
      this.isDarkMode = saved === 'true';
      
      // Update the UI toggle switch to reflect the loaded preference
      this.darkModeSwitch.checked = this.isDarkMode;
    } catch (error) {
      // Log warning and fall back to light mode if localStorage is unavailable
      console.warn('Could not load dark mode preference:', error);
      this.isDarkMode = false;
    }
  }

  /**
   * Save current dark mode preference to localStorage
   * 
   * Persists the current theme state to localStorage for retrieval
   * on future application sessions. Handles errors gracefully if
   * localStorage is unavailable.
   */
  saveDarkModePreference() {
    try {
      // Convert boolean to string and save to localStorage
      localStorage.setItem('darkMode', this.isDarkMode.toString());
    } catch (error) {
      // Log warning if localStorage save fails (e.g., private browsing mode)
      console.warn('Could not save dark mode preference:', error);
    }
  }

  /**
   * Toggle between dark and light modes
   * 
   * Updates the internal state based on the toggle switch position,
   * applies the new theme immediately, and saves the preference
   * for future sessions.
   */
  toggleDarkMode() {
    // Update internal state based on toggle switch position
    this.isDarkMode = this.darkModeSwitch.checked;
    
    // Apply the new theme to the document
    this.applyTheme();
    
    // Persist the new preference to localStorage
    this.saveDarkModePreference();
  }

  /**
   * Apply the current theme to the document
   * 
   * Adds or removes the 'dark-mode' CSS class from the document root
   * element based on the current theme state. This triggers CSS
   * variable changes and theme-specific styling throughout the app.
   */
  applyTheme() {
    // Get reference to the document root element for class manipulation
    const root = document.documentElement;
    
    if (this.isDarkMode) {
      // Add dark-mode class to enable dark theme styling
      root.classList.add('dark-mode');
    } else {
      // Remove dark-mode class to enable light theme styling
      root.classList.remove('dark-mode');
    }
  }

  /**
   * Get the current dark mode state
   * 
   * Returns the current theme state for use by other components
   * that need to know the current theme for conditional logic.
   * 
   * @returns {boolean} True if dark mode is enabled, false otherwise
   */
  isDarkModeEnabled() {
    return this.isDarkMode;
  }
}

// Export the DarkModeManager class for use in other modules
export default DarkModeManager; 