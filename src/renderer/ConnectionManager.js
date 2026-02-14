/**
 * Connection Manager - Electronic Session Manager
 * 
 * This file manages port forwarding connections to EC2 instances using AWS Session Manager.
 * It handles RDP, SSH, and custom port forwarding connections, tracks active sessions,
 * and provides connection lifecycle management.
 * 
 * Key Responsibilities:
 * - Manages port forwarding connections to EC2 instances
 * - Handles RDP, SSH, and custom port forwarding
 * - Tracks active sessions and their lifecycle
 * - Provides session termination capabilities
 * - Manages custom port forwarding dialogs
 * - Coordinates with AWS Session Manager
 * - Updates status bar with session counts
 * 
 * Architecture Role:
 * - Acts as the port forwarding and connection management component
 * - Coordinates between UI and AWS Session Manager services
 * - Manages session state and lifecycle
 * - Provides connection interface for instance management
 * - Integrates with session manager for monitoring
 * 
 * Connection Types Supported:
 * - RDP: Remote Desktop Protocol (port 13389 → 3389)
 * - SSH: Secure Shell (port 2222 → 22)
 * - Custom: User-defined port mappings
 * 
 * Features:
 * - One-click RDP and SSH connections
 * - Custom port forwarding with user input
 * - Session tracking and management
 * - Connection success notifications
 * - Session termination with cleanup
 * - Status bar integration
 * - Instance details refresh
 * 
 * Session Management:
 * - Unique session key generation
 * - Active session tracking with Map
 * - Session metadata storage
 * - Session lifecycle management
 * - Port availability checking
 * 
 * Dependencies:
 * - UIManager: For notifications and UI utilities
 * - ConsoleManager: For logging operations
 * - StatusBarManager: For status updates
 * - electronAPI: For AWS Session Manager operations
 */

export default class ConnectionManager {
  /**
   * Constructor initializes the connection manager with dependencies
   * Sets up active sessions tracking and management
   * @param {UIManager} uiManager - UI management utilities
   * @param {ConsoleManager} consoleManager - Console logging
   * @param {StatusBarManager} statusBarManager - Status bar updates
   */
  constructor(uiManager, consoleManager, statusBarManager) {
    this.uiManager = uiManager;
    this.consoleManager = consoleManager;
    this.statusBarManager = statusBarManager;
    this.activeSessions = new Map();  // Track active port forwarding sessions
  }

  /**
   * Generates a unique session key for tracking port forwarding sessions
   * @param {string} instanceId - EC2 instance ID
   * @param {number} localPort - Local port number
   * @param {number} remotePort - Remote port number
   * @returns {string} Unique session key
   */
  getSessionKey(instanceId, localPort, remotePort) {
    return `${instanceId}-${localPort}-${remotePort}`;
  }

  /**
   * Initiates RDP connection to an EC2 instance
   * Sets up port forwarding from local port 13389 to remote port 3389
   * @param {string} instanceId - EC2 instance ID to connect to
   */
  async connectViaRDP(instanceId) {
    try {
      this.consoleManager.addConsoleEntry('System', `Starting RDP connection for instance: ${instanceId}`, 'info');
      
      // Check if electronAPI is available for AWS operations
      if (window.electronAPI && window.electronAPI.startPortForwarding) {
        // Start port forwarding for RDP (local:13389 → remote:3389)
        const result = await window.electronAPI.startPortForwarding(instanceId, 13389, 3389);
        this.consoleManager.addConsoleEntry('System', `RDP connection started for instance ${instanceId}`, 'info');
        
        // Create session key and store session information
        const key = this.getSessionKey(instanceId, 13389, 3389);
        this.activeSessions.set(key, {
          sessionId: result.sessionId,
          connectionType: 'RDP',
          localPort: 13389,
          remotePort: 3389,
          startTime: new Date(),
          instanceId: instanceId
        });
        
        // Show success notification and update UI
        this.uiManager.showConnectionSuccess('RDP', instanceId, 13389, 3389);
        this.statusBarManager.updateStatusBar({ activeSessions: this.activeSessions.size });
        app.refreshInstanceDetails(instanceId);
      }
    } catch (error) {
      this.consoleManager.addConsoleEntry('ERROR', `Failed to start RDP connection for instance ${instanceId}: ${error.message}`, 'error');
      this.uiManager.showError(`Failed to start RDP connection: ${error.message}`);
    }
  }

  /**
   * Initiates SSH connection to an EC2 instance
   * Sets up port forwarding from local port 2222 to remote port 22
   * @param {string} instanceId - EC2 instance ID to connect to
   */
  async connectViaSSH(instanceId) {
    try {
      this.consoleManager.addConsoleEntry('System', `Starting SSH connection for instance: ${instanceId}`, 'info');
      
      // Check if electronAPI is available for AWS operations
      if (window.electronAPI && window.electronAPI.startPortForwarding) {
        // Start port forwarding for SSH (local:2222 → remote:22)
        const result = await window.electronAPI.startPortForwarding(instanceId, 2222, 22);
        this.consoleManager.addConsoleEntry('System', `SSH connection started for instance ${instanceId}`, 'info');
        
        // Create session key and store session information
        const key = this.getSessionKey(instanceId, 2222, 22);
        this.activeSessions.set(key, {
          sessionId: result.sessionId,
          connectionType: 'SSH',
          localPort: 2222,
          remotePort: 22,
          startTime: new Date(),
          instanceId: instanceId
        });
        
        // Show success notification and update UI
        this.uiManager.showConnectionSuccess('SSH', instanceId, 2222, 22);
        this.statusBarManager.updateStatusBar({ activeSessions: this.activeSessions.size });
        app.refreshInstanceDetails(instanceId);
      }
    } catch (error) {
      this.consoleManager.addConsoleEntry('ERROR', `Failed to start SSH connection for instance ${instanceId}: ${error.message}`, 'error');
      this.uiManager.showError(`Failed to start SSH connection: ${error.message}`);
    }
  }

  /**
   * Shows custom port forwarding dialog for user-defined port mappings
   * Creates a modal dialog for entering local and remote ports
   * @param {string} instanceId - EC2 instance ID to connect to
   */
  connectViaCustom(instanceId) {
    // Create custom port forwarding dialog
    const customPortDialog = document.createElement('div');
    customPortDialog.className = 'custom-port-dialog';
    
    const content = document.createElement('div');
    content.className = 'custom-port-content';
    
    const h3 = document.createElement('h3');
    h3.textContent = 'Custom Port Forwarding';
    content.appendChild(h3);
    
    const p = document.createElement('p');
    p.textContent = 'Enter the ports for port forwarding:';
    content.appendChild(p);
    
    const portInputs = document.createElement('div');
    portInputs.className = 'port-inputs';
    
    // Local Port
    const localGroup = document.createElement('div');
    localGroup.className = 'port-input-group';
    const localLabel = document.createElement('label');
    localLabel.htmlFor = 'local-port';
    localLabel.textContent = 'Local Port:';
    const localInput = document.createElement('input');
    localInput.type = 'number';
    localInput.id = 'local-port';
    localInput.placeholder = 'e.g., 8080';
    localInput.min = '1024';
    localInput.max = '65535';
    localInput.value = '8080';
    localGroup.appendChild(localLabel);
    localGroup.appendChild(localInput);
    portInputs.appendChild(localGroup);
    
    // Remote Port
    const remoteGroup = document.createElement('div');
    remoteGroup.className = 'port-input-group';
    const remoteLabel = document.createElement('label');
    remoteLabel.htmlFor = 'remote-port';
    remoteLabel.textContent = 'Remote Port:';
    const remoteInput = document.createElement('input');
    remoteInput.type = 'number';
    remoteInput.id = 'remote-port';
    remoteInput.placeholder = 'e.g., 80';
    remoteInput.min = '1';
    remoteInput.max = '65535';
    remoteInput.value = '80';
    remoteGroup.appendChild(remoteLabel);
    remoteGroup.appendChild(remoteInput);
    portInputs.appendChild(remoteGroup);
    
    content.appendChild(portInputs);
    
    // Buttons
    const buttons = document.createElement('div');
    buttons.className = 'dialog-buttons';
    
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'btn-secondary';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.addEventListener('click', () => this.uiManager.closeCustomPortDialog());
    buttons.appendChild(cancelBtn);
    
    const startBtn = document.createElement('button');
    startBtn.className = 'btn-primary';
    startBtn.textContent = 'Start Connection';
    startBtn.addEventListener('click', () => this.startCustomPortForwarding(instanceId));
    buttons.appendChild(startBtn);
    
    content.appendChild(buttons);
    customPortDialog.appendChild(content);
    
    // Add dialog to DOM and show it
    document.body.appendChild(customPortDialog);
    
    // Add the active class to make the dialog visible with animation
    setTimeout(() => {
      customPortDialog.classList.add('active');
      const localInput = document.getElementById('local-port');
      if (localInput) localInput.focus();
    }, 100);
  }

  /**
   * Starts custom port forwarding with user-specified ports
   * Handles the custom port forwarding connection process
   * @param {string} instanceId - EC2 instance ID to connect to
   */
  async startCustomPortForwarding(instanceId) {
    try {
      // Get port values from dialog inputs
      const localPort = document.getElementById('local-port').value;
      const remotePort = document.getElementById('remote-port').value;
      
      // Validate that both ports are provided
      if (!localPort || !remotePort) {
        this.uiManager.showError('Please enter both local and remote ports');
        return;
      }
      
      // Update status bar to show busy state
      this.statusBarManager.updateStatusBar({ 
        appStatus: 'busy',
        appStatusText: 'Starting port forwarding...'
      });
      
      // Start port forwarding with specified ports
      const result = await window.electronAPI.startPortForwarding(instanceId, parseInt(localPort), parseInt(remotePort));
      
      if (result.success) {
        // Create session key and store session information
        const key = this.getSessionKey(instanceId, localPort, remotePort);
        this.activeSessions.set(key, {
          sessionId: result.sessionId,
          localPort: localPort,
          remotePort: remotePort,
          startTime: new Date(),
          instanceId: instanceId
        });
        
        // Update status bar and show success notification
        this.statusBarManager.updateStatusBar({ 
          appStatus: 'ready',
          appStatusText: 'Ready',
          activeSessions: this.activeSessions.size
        });
        
        this.uiManager.showConnectionSuccess('Custom Port Forwarding', instanceId, localPort, remotePort);
        app.closeCustomPortDialog();
        app.refreshInstanceDetails(instanceId);
      } else {
        // Handle port forwarding failure
        this.statusBarManager.updateStatusBar({ 
          appStatus: 'error',
          appStatusText: 'Error'
        });
        this.consoleManager.addConsoleEntry('ERROR', `Error starting port forwarding: ${result.error || 'Failed to start port forwarding'}`, 'error');
        this.uiManager.showError(result.error || 'Failed to start port forwarding');
      }
    } catch (error) {
      // Handle errors during port forwarding
      this.statusBarManager.updateStatusBar({ 
        appStatus: 'error',
        appStatusText: 'Error'
      });
      this.consoleManager.addConsoleEntry('ERROR', `Error starting port forwarding: ${error.message}`, 'error');
      this.uiManager.showError(`Failed to start port forwarding: ${error.message}`);
    }
  }

  /**
   * Stops port forwarding for a specific session
   * Terminates the session and cleans up resources
   * @param {string} instanceId - EC2 instance ID
   * @param {number} localPort - Local port number (optional for matching)
   * @param {number} remotePort - Remote port number (optional for matching)
   * @returns {Object} Result of the stop operation
   */
  async stopPortForwarding(instanceId, localPort, remotePort) {
    // Find the session key and session data
    let key = null;
    let session = null;
    console.log('Attempting to stop session:', { instanceId, localPort, remotePort });
    
    // Search through active sessions to find matching session
    for (const [k, s] of this.activeSessions.entries()) {
      console.log('Checking session:', {
        key: k,
        sInstanceId: s.instanceId,
        sLocalPort: s.localPort,
        sRemotePort: s.remotePort
      });
      if (
        s.instanceId === instanceId &&
        (localPort === undefined || String(s.localPort) === String(localPort)) &&
        (remotePort === undefined || String(s.remotePort) === String(remotePort))
      ) {
        key = k;
        session = s;
        break;
      }
    }
    
    // Handle case where no matching session is found
    if (!session) {
      this.uiManager.showError('No active session found for this instance/port combination');
      return;
    }
    
    // Update status bar to show busy state
    this.statusBarManager.updateStatusBar({ 
      appStatus: 'busy',
      appStatusText: 'Stopping session...'
    });
    
    // Stop the port forwarding session
    const result = await window.electronAPI.stopPortForwarding(instanceId, session.sessionId);
    if (result && result.success) {
      // Remove session from tracking and update UI
      this.activeSessions.delete(key);
      this.statusBarManager.updateStatusBar({ 
        appStatus: 'ready',
        appStatusText: 'Ready',
        activeSessions: this.activeSessions.size
      });
      app.refreshInstanceDetails(instanceId);
      return result;
    } else {
      // Handle stop operation failure
      this.statusBarManager.updateStatusBar({ 
        appStatus: 'error',
        appStatusText: 'Error'
      });
      const errorMessage = result?.error || 'Failed to stop port forwarding';
      this.consoleManager.addConsoleEntry('ERROR', `Error stopping port forwarding: ${errorMessage}`, 'error');
      this.uiManager.showError(errorMessage);
      throw new Error(errorMessage);
    }
  }

  /**
   * Shows port forwarding success notification
   * @deprecated This method is replaced by uiManager.showConnectionSuccess
   * @param {string} connectionType - Type of connection (RDP, SSH, etc.)
   * @param {string} instanceId - EC2 instance ID
   * @param {number} localPort - Local port number
   * @param {number} remotePort - Remote port number
   * @param {string} sessionId - Session ID
   */
  showPortForwardingSuccess(connectionType, instanceId, localPort, remotePort, sessionId) {
    // This method is now replaced by uiManager.showConnectionSuccess
    // It's kept here to avoid breaking any potential calls, but should be considered deprecated.
    this.uiManager.showConnectionSuccess(connectionType, instanceId, localPort, remotePort);
  }

  /**
   * Renders port forwarding action buttons into a container element
   * Creates stop buttons for all active sessions for a specific instance
   * @param {HTMLElement} container - The container to append buttons to
   * @param {string} instanceId - EC2 instance ID
   */
  renderPortForwardingActions(container, instanceId) {
    // Show stop buttons for all sessions for this instance
    for (const [key, session] of this.activeSessions.entries()) {
      if (session.instanceId === instanceId) {
        const button = document.createElement('button');
        button.className = 'btn-action btn-stop';
        button.textContent = `⏹️ Stop Port Forwarding (${session.localPort}→${session.remotePort})`;
        button.onclick = () => this.stopPortForwarding(instanceId, session.localPort, session.remotePort);
        container.appendChild(button);
      }
    }
  }

  /**
   * Stops port forwarding for a specific session
   * Terminate the process and update the UI
   * @param {string} instanceId - EC2 instance ID
   * @param {number} localPort - Local port number
   * @param {number} remotePort - Remote port number
   * @returns {Promise<Object>} Stop operation result
   */
  async stopPortForwarding(instanceId, localPort, remotePort) {
    const key = this.getSessionKey(instanceId, localPort, remotePort);
    const session = this.activeSessions.get(key);
    
    if (!session) {
      this.uiManager.showError('Session not found');
      return;
    }

    this.statusBarManager.updateStatusBar({ 
      appStatus: 'busy',
      appStatusText: 'Stopping session...'
    });
    
    try {
      // Stop the port forwarding session
      const result = await window.electronAPI.stopPortForwarding(instanceId, session.sessionId);
      if (result && result.success) {
        // Remove session from tracking and update UI
        this.activeSessions.delete(key);
        this.statusBarManager.updateStatusBar({ 
          appStatus: 'ready',
          appStatusText: 'Ready',
          activeSessions: this.activeSessions.size
        });
        
        // Refresh instance details if possible
        const instanceManager = window.app?.instanceManager;
        if (instanceManager) {
            instanceManager.refreshInstanceDetails(instanceId);
        }
        
        return result;
      } else {
        throw new Error('Stop operation returned failure');
      }
    } catch (error) {
      // Handle stop operation failure
      this.statusBarManager.updateStatusBar({ 
        appStatus: 'error',
        appStatusText: 'Error'
      });
      const errorMessage = error.message || 'Failed to stop port forwarding';
      this.consoleManager.addConsoleEntry('ERROR', `Error stopping port forwarding: ${errorMessage}`, 'error');
      this.uiManager.showError(errorMessage);
    }
  }
}