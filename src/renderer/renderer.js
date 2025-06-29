// Renderer process script
// This file handles the UI interactions and communicates with the main process

import UIManager from './UIManager.js';
import ConsoleManager from './ConsoleManager.js';
import StatusBarManager from './StatusBarManager.js';
import ConnectionManager from './ConnectionManager.js';
import InstanceManager from './InstanceManager.js';
import ProfileManager from './ProfileManager.js';
import DarkModeManager from './DarkModeManager.js';

class ElectronicSessionManager {
  constructor() {
    this.darkModeManager = new DarkModeManager();
    this.uiManager = new UIManager();
    this.consoleManager = new ConsoleManager(this.uiManager);
    this.statusBarManager = new StatusBarManager();
    this.connectionManager = new ConnectionManager(this.uiManager, this.consoleManager, this.statusBarManager);
    this.instanceManager = new InstanceManager(this.uiManager, this.consoleManager, this.connectionManager, this.statusBarManager);
    this.profileManager = new ProfileManager(this.uiManager, this.consoleManager, this.statusBarManager, this.instanceManager);
    
    console.log('Electronic Session Manager initialized');
  }

  // --- Delegated methods to preserve onclick functionality ---

  // InstanceManager delegations
  startInstance(instanceId) { this.instanceManager.startInstance(instanceId); }
  stopInstance(instanceId) { this.instanceManager.stopInstance(instanceId); }
  refreshInstanceDetails(instanceId) { this.instanceManager.refreshInstanceDetails(instanceId); }

  // ConnectionManager delegations
  connectViaRDP(instanceId) { this.connectionManager.connectViaRDP(instanceId); }
  connectViaSSH(instanceId) { this.connectionManager.connectViaSSH(instanceId); }
  connectViaCustom(instanceId) { this.connectionManager.connectViaCustom(instanceId); }
  startCustomPortForwarding(instanceId) { this.connectionManager.startCustomPortForwarding(instanceId); }
  stopPortForwarding(instanceId) { this.connectionManager.stopPortForwarding(instanceId); }
  
  // UIManager delegations
  closeCustomPortDialog() { this.uiManager.closeCustomPortDialog(); }
  closeSuccessPopup() { this.uiManager.closeSuccessPopup(); }
}

// Initialize the application and expose it to the window
const app = new ElectronicSessionManager();
window.app = app;