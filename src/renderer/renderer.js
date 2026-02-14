/**
 * Main Renderer Process Script - Electronic Session Manager
 * 
 * This file serves as the main entry point for the renderer process (UI layer) of the application.
 * It initializes and coordinates all UI managers and provides the bridge between the HTML interface
 * and the business logic components.
 * 
 * Key Responsibilities:
 * - Initializes all UI manager components
 * - Provides delegation methods for HTML onclick handlers
 * - Coordinates communication between different UI components
 * - Exposes the application instance to the global window object
 * 
 * Architecture Role:
 * - Acts as the main coordinator for all UI functionality
 * - Provides a clean interface for HTML event handlers
 * - Manages the lifecycle of all UI manager components
 * - Serves as the entry point for the renderer process
 * 
 * Component Dependencies:
 * - UIManager: General UI state and dialog management
 * - ConsoleManager: Log viewing and console functionality
 * - StatusBarManager: Real-time status display
 * - ConnectionManager: Port forwarding and connection handling
 * - InstanceManager: EC2 instance management and display
 * - ProfileManager: AWS profile management
 * - DarkModeManager: Theme switching functionality
 * - SessionManager: Session management and cleanup
 */

// Import all UI manager components that handle specific functionality
import UIManager from './UIManager.js';           // General UI state and dialog management
import ConsoleManager from './ConsoleManager.js'; // Log viewing and console functionality
import StatusBarManager from './StatusBarManager.js'; // Real-time status display
import ConnectionManager from './ConnectionManager.js'; // Port forwarding and connection handling
import InstanceManager from './InstanceManager.js'; // EC2 instance management and display
import ProfileManager from './ProfileManager.js'; // AWS profile management
import DarkModeManager from './DarkModeManager.js'; // Theme switching functionality
import SessionManager from './SessionManager.js'; // Session management and cleanup

/**
 * Main application class that coordinates all UI components
 * This class serves as the central coordinator for all user interface functionality
 */
class ElectronicSessionManager {
  /**
   * Constructor initializes all UI manager components
   * Sets up the dependency chain and initializes the application
   */
  constructor() {
    // Initialize dark mode manager first (no dependencies)
    this.darkModeManager = new DarkModeManager();
    
    // Initialize UI manager (no dependencies)
    this.uiManager = new UIManager();
    
    // Initialize console manager (depends on UI manager)
    this.consoleManager = new ConsoleManager(this.uiManager);
    
    // Initialize status bar manager (no dependencies)
    this.statusBarManager = new StatusBarManager();
    
    // Initialize connection manager (depends on UI, console, and status bar managers)
    this.connectionManager = new ConnectionManager(this.uiManager, this.consoleManager, this.statusBarManager);
    
    // Initialize session manager (depends on connection, UI, and console managers)
    this.sessionManager = new SessionManager(this.connectionManager, this.uiManager, this.consoleManager);
    
    // Initialize instance manager (depends on UI, console, connection, and status bar managers)
    this.instanceManager = new InstanceManager(this.uiManager, this.consoleManager, this.connectionManager, this.statusBarManager);
    
    // Initialize profile manager (depends on UI, console, status bar, and instance managers)
    this.profileManager = new ProfileManager(this.uiManager, this.consoleManager, this.statusBarManager, this.instanceManager);
    
    // Log successful initialization
    console.log('Electronic Session Manager initialized');
  }

  // ===== DELEGATION METHODS =====
  // These methods provide a clean interface for HTML onclick handlers
  // They delegate to the appropriate manager component

  // ===== INSTANCE MANAGER DELEGATIONS =====
  // Methods for managing EC2 instances
  
  /**
   * Starts an EC2 instance
   * @param {string} instanceId - The ID of the instance to start
   */
  startInstance(instanceId) { 
    this.instanceManager.startInstance(instanceId); 
  }
  
  /**
   * Stops an EC2 instance
   * @param {string} instanceId - The ID of the instance to stop
   */
  stopInstance(instanceId) { 
    this.instanceManager.stopInstance(instanceId); 
  }
  
  /**
   * Refreshes the details for a specific instance
   * @param {string} instanceId - The ID of the instance to refresh
   */
  refreshInstanceDetails(instanceId) { 
    this.instanceManager.refreshInstanceDetails(instanceId); 
  }

  // ===== CONNECTION MANAGER DELEGATIONS =====
  // Methods for managing connections and port forwarding
  
  /**
   * Initiates an RDP connection to an EC2 instance
   * @param {string} instanceId - The ID of the instance to connect to
   */
  connectViaRDP(instanceId) { 
    this.connectionManager.connectViaRDP(instanceId); 
  }
  
  /**
   * Initiates an SSH connection to an EC2 instance
   * @param {string} instanceId - The ID of the instance to connect to
   */
  connectViaSSH(instanceId) { 
    this.connectionManager.connectViaSSH(instanceId); 
  }
  
  /**
   * Opens the custom connection dialog for an EC2 instance
   * @param {string} instanceId - The ID of the instance to connect to
   */
  connectViaCustom(instanceId) { 
    this.connectionManager.connectViaCustom(instanceId); 
  }
  
  /**
   * Starts custom port forwarding for an EC2 instance
   * @param {string} instanceId - The ID of the instance to forward ports for
   */
  startCustomPortForwarding(instanceId) { 
    this.connectionManager.startCustomPortForwarding(instanceId); 
  }
  
  /**
   * Stops port forwarding for an EC2 instance
   * @param {string} instanceId - The ID of the instance to stop forwarding for
   */
  stopPortForwarding(instanceId) { 
    this.connectionManager.stopPortForwarding(instanceId); 
  }
  
  // ===== SESSION MANAGER DELEGATIONS =====
  // Methods for managing active sessions
  
  /**
   * Stops a session from the session management dialog
   * @param {string} instanceId - The ID of the instance whose session to stop
   */
  stopSessionFromDialog(instanceId) { 
    this.sessionManager.stopSessionFromDialog(instanceId); 
  }
  
  // ===== UI MANAGER DELEGATIONS =====
  // Methods for general UI operations
  
  /**
   * Closes the custom port forwarding dialog
   */
  closeCustomPortDialog() { 
    this.uiManager.closeCustomPortDialog(); 
  }
  
  /**
   * Closes the success popup dialog
   */
  closeSuccessPopup() { 
    this.uiManager.closeSuccessPopup(); 
  }
}

// ===== APPLICATION INITIALIZATION =====

/**
 * Initialize the application once the DOM is ready.
 * Since this script is loaded as type="module" (deferred), the DOM may already
 * be parsed by the time execution begins. We check document.readyState to handle
 * both cases: if still loading, we wait for DOMContentLoaded; otherwise we
 * initialize immediately.
 */
function initializeApp() {
  try {
    // Create the main application instance
    const app = new ElectronicSessionManager();

    // Expose the application instance to the global window object
    // This allows HTML onclick handlers to access the application methods
    window.app = app;
  } catch (error) {
    console.error('Failed to initialize Electronic Session Manager:', error);
  }
}

if (document.readyState === 'loading') {
  // DOM is still loading — wait for it to be ready
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  // DOM is already parsed (module scripts are deferred) — initialize immediately
  initializeApp();
}