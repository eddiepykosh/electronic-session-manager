/**
 * Session Manager - Electronic Session Manager
 * 
 * This file manages the session management dialog and provides tools for monitoring
 * and controlling active port forwarding sessions. It handles session display,
 * termination, and cleanup operations.
 * 
 * Key Responsibilities:
 * - Displays active port forwarding sessions in a dialog
 * - Provides session termination capabilities
 * - Manages session duration tracking and display
 * - Handles orphaned session detection and cleanup
 * - Coordinates with connection manager for session operations
 * - Provides session management UI and controls
 * 
 * Architecture Role:
 * - Acts as the session monitoring and management component
 * - Provides session lifecycle management interface
 * - Coordinates session cleanup and maintenance operations
 * - Manages session dialog and user interactions
 * - Integrates with connection manager for session control
 * 
 * Features:
 * - Real-time session display and monitoring
 * - Session termination with detailed feedback
 * - Session duration calculation and display
 * - Orphaned session detection
 * - Force cleanup of stuck sessions
 * - Session management dialog interface
 * - Process termination status reporting
 * - Port release status monitoring
 * 
 * Session Information Displayed:
 * - Instance ID and connection type
 * - Local and remote port mappings
 * - Session start time and duration
 * - Session ID and status
 * - Process termination status
 * - Port release status
 * 
 * Dependencies:
 * - ConnectionManager: For session data and control operations
 * - UIManager: For notifications and UI utilities
 * - ConsoleManager: For logging operations
 * - electronAPI: For orphaned session operations
 */

export default class SessionManager {
  /**
   * Constructor initializes the session manager with dependencies
   * Sets up session dialog and control event listeners
   * @param {ConnectionManager} connectionManager - Connection management for session data
   * @param {UIManager} uiManager - UI management utilities
   * @param {ConsoleManager} consoleManager - Console logging
   */
  constructor(connectionManager, uiManager, consoleManager) {
    this.connectionManager = connectionManager;
    this.uiManager = uiManager;
    this.consoleManager = consoleManager;
    this.initializeSessionDialog();
  }

  /**
   * Initializes the session management dialog and sets up event listeners
   * Handles dialog controls, session operations, and cleanup functions
   */
  initializeSessionDialog() {
    // Add click handler to the active sessions status bar
    const activeSessionsStatus = document.getElementById('active-sessions-status');
    if (activeSessionsStatus) {
      activeSessionsStatus.addEventListener('click', () => {
        this.showSessionDialog();
      });
    }

    // Add close handler to the session dialog
    const closeSessionDialog = document.getElementById('close-session-dialog');
    if (closeSessionDialog) {
      closeSessionDialog.addEventListener('click', () => {
        this.hideSessionDialog();
      });
    }

    // Close dialog when clicking outside
    const sessionDialog = document.getElementById('session-management-dialog');
    if (sessionDialog) {
      sessionDialog.addEventListener('click', (e) => {
        if (e.target === sessionDialog) {
          this.hideSessionDialog();
        }
      });
    }

    // Add handler for orphaned session checking
    const checkOrphanedSessions = document.getElementById('check-orphaned-sessions');
    if (checkOrphanedSessions) {
      checkOrphanedSessions.addEventListener('click', () => {
        this.checkOrphanedSessions();
      });
    }

    // Add handler for force cleanup operations
    const forceCleanupSessions = document.getElementById('force-cleanup-sessions');
    if (forceCleanupSessions) {
      forceCleanupSessions.addEventListener('click', () => {
        this.forceCleanupSessions();
      });
    }

    // Add handler for session list refresh
    const refreshSessionsList = document.getElementById('refresh-sessions-list');
    if (refreshSessionsList) {
      refreshSessionsList.addEventListener('click', () => {
        this.forceRefreshSessionsList();
      });
    }

    // Add handler for force killing all session manager plugins
    const forceKillAllPlugins = document.getElementById('force-kill-all-plugins');
    if (forceKillAllPlugins) {
      forceKillAllPlugins.addEventListener('click', async () => {
        try {
          this.consoleManager.addConsoleEntry('System', 'Force killing all session-manager-plugin processes...', 'info');
          const result = await window.electronAPI.forceKillAllSessionManagerPlugins();
          if (result.success) {
            this.consoleManager.addConsoleEntry('SUCCESS', result.message, 'info');
            this.uiManager.showSuccess(result.message);
          } else {
            this.consoleManager.addConsoleEntry('ERROR', result.message, 'error');
            this.uiManager.showError(result.message);
          }
        } catch (error) {
          this.consoleManager.addConsoleEntry('ERROR', `Failed to force kill all session-manager-plugin processes: ${error.message}`, 'error');
          this.uiManager.showError(`Failed to force kill all session-manager-plugin processes: ${error.message}`);
        }
      });
    }
  }

  /**
   * Shows the session management dialog
   * Opens the dialog and populates the sessions list
   */
  showSessionDialog() {
    const dialog = document.getElementById('session-management-dialog');
    if (dialog) {
      dialog.classList.add('active');
      this.populateSessionsList();
    }
  }

  /**
   * Hides the session management dialog
   * Closes the dialog and cleans up
   */
  hideSessionDialog() {
    const dialog = document.getElementById('session-management-dialog');
    if (dialog) {
      dialog.classList.remove('active');
    }
  }

  /**
   * Populates the sessions list in the dialog
   * Displays all active sessions or shows a no sessions message
   */
  populateSessionsList() {
    const sessionsList = document.getElementById('active-sessions-list');
    const noSessionsMessage = document.getElementById('no-sessions-message');
    
    if (!sessionsList || !noSessionsMessage) return;

    // Get active sessions from connection manager
    const activeSessions = this.connectionManager.activeSessions;
    
    console.log('Populating sessions list. Active sessions:', activeSessions.size);
    activeSessions.forEach((session, key) => {
      console.log('Session key:', key, 'Session:', session);
    });
    
    // Handle empty sessions list
    if (activeSessions.size === 0) {
      sessionsList.style.display = 'none';
      noSessionsMessage.style.display = 'block';
      return;
    }

    // Show sessions list and hide no sessions message
    sessionsList.style.display = 'flex';
    noSessionsMessage.style.display = 'none';
    
    // Clear existing sessions and add current ones
    sessionsList.innerHTML = '';

    activeSessions.forEach((session, sessionKey) => {
      const sessionItem = this.createSessionItem(session.instanceId, session.localPort, session.remotePort, session);
      sessionsList.appendChild(sessionItem);
    });
  }

  /**
   * Creates a session item element for display in the sessions list
   * @param {string} instanceId - EC2 instance ID
   * @param {number} localPort - Local port number
   * @param {number} remotePort - Remote port number
   * @param {Object} session - Session object with additional details
   * @returns {HTMLElement} Session item element
   */
  createSessionItem(instanceId, localPort, remotePort, session) {
    const sessionItem = document.createElement('div');
    sessionItem.className = 'session-item';

    // Calculate session timing information
    const startTime = session.startTime ? new Date(session.startTime).toLocaleString() : 'Unknown';
    const duration = session.startTime ? this.calculateDuration(session.startTime) : 'Unknown';

    // Create session item HTML with detailed information
    sessionItem.innerHTML = `
      <div class="session-header">
        <div class="session-info">
          <div class="session-title">
            ${session.connectionType || 'Custom Port Forwarding'} - ${instanceId}
          </div>
          <div class="session-details">
            <div class="session-detail">
              <span class="session-detail-label">Instance ID</span>
              <span class="session-detail-value">${instanceId}</span>
            </div>
            <div class="session-detail">
              <span class="session-detail-label">Local Port</span>
              <span class="session-detail-value">${localPort}</span>
            </div>
            <div class="session-detail">
              <span class="session-detail-label">Remote Port</span>
              <span class="session-detail-value">${remotePort}</span>
            </div>
            <div class="session-detail">
              <span class="session-detail-label">Started</span>
              <span class="session-detail-value">${startTime}</span>
            </div>
            <div class="session-detail">
              <span class="session-detail-label">Duration</span>
              <span class="session-detail-value">${duration}</span>
            </div>
            <div class="session-detail">
              <span class="session-detail-label">Session ID</span>
              <span class="session-detail-value">${session.sessionId || 'N/A'}</span>
            </div>
          </div>
        </div>
        <div class="session-actions">
          <button class="btn-stop-session" onclick="app.stopSessionFromDialog('${instanceId}', '${localPort}', '${remotePort}')">
            ⏹️ Stop Session
          </button>
        </div>
      </div>
    `;

    return sessionItem;
  }

  /**
   * Calculates the duration of a session from its start time
   * @param {string|Date} startTime - Session start time
   * @returns {string} Formatted duration string
   */
  calculateDuration(startTime) {
    const now = new Date();
    const start = new Date(startTime);
    const diffMs = now - start;
    
    // Calculate hours, minutes, and seconds
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
    
    // Return formatted duration string
    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  }

  /**
   * Stops a session from the dialog interface
   * Handles session termination with detailed feedback
   * @param {string} instanceId - EC2 instance ID
   * @param {number} localPort - Local port number
   * @param {number} remotePort - Remote port number
   */
  async stopSessionFromDialog(instanceId, localPort, remotePort) {
    try {
      this.consoleManager.addConsoleEntry('System', `Stopping session for instance: ${instanceId} (localPort: ${localPort}, remotePort: ${remotePort})`, 'info');
      
      console.log('Stopping session for instanceId:', instanceId, 'localPort:', localPort, 'remotePort:', remotePort);
      console.log('Current active sessions before stop:', this.connectionManager.activeSessions.size);
      
      // Stop the port forwarding session
      const result = await this.connectionManager.stopPortForwarding(instanceId, localPort, remotePort);
      
      console.log('Stop result:', result);
      console.log('Active sessions after stop:', this.connectionManager.activeSessions.size);
      
      // Provide detailed feedback about termination
      let consoleMessage = `Session stopped for instance: ${instanceId}`;
      let uiMessage = `Session stopped for instance: ${instanceId}`;
      
      // Add process termination status to feedback
      if (result && result.processTerminated !== undefined) {
        consoleMessage += ` | Process terminated: ${result.processTerminated ? 'Yes' : 'No'}`;
        uiMessage += `\nProcess terminated: ${result.processTerminated ? '✅ Yes' : '❌ No'}`;
      }
      
      // Add port release status to feedback
      if (result && result.portReleased !== undefined) {
        consoleMessage += ` | Port released: ${result.portReleased ? 'Yes' : 'May still be in use'}`;
        uiMessage += `\nPort released: ${result.portReleased ? '✅ Yes' : '⚠️ May still be in use'}`;
      }
      
      this.consoleManager.addConsoleEntry('SUCCESS', consoleMessage, 'info');
      this.uiManager.showSuccess(uiMessage);
      
      // Refresh the sessions list immediately
      this.populateSessionsList();
      
      // Update status bar with new session count
      this.connectionManager.statusBarManager.updateStatusBar({ 
        activeSessions: this.connectionManager.activeSessions.size 
      });
      
    } catch (error) {
      this.consoleManager.addConsoleEntry('ERROR', `Failed to stop session for instance ${instanceId}: ${error.message}`, 'error');
      this.uiManager.showError(`Failed to stop session: ${error.message}`);
      
      // Even on error, refresh the sessions list to ensure UI is up to date
      this.populateSessionsList();
    }
  }

  /**
   * Updates the session display across the application
   * Updates status bar count and refreshes dialog if open
   */
  updateSessionDisplay() {
    // Update the status bar count
    const activeSessionsCount = this.connectionManager.activeSessions.size;
    this.connectionManager.statusBarManager.updateStatusBar({ 
      activeSessions: activeSessionsCount 
    });

    // If the dialog is open, refresh the sessions list
    const dialog = document.getElementById('session-management-dialog');
    if (dialog && dialog.classList.contains('active')) {
      this.populateSessionsList();
    }
  }

  /**
   * Forces a refresh of the sessions list
   * Updates both the dialog and status bar
   */
  forceRefreshSessionsList() {
    console.log('Force refreshing sessions list');
    this.populateSessionsList();
    this.connectionManager.statusBarManager.updateStatusBar({ 
      activeSessions: this.connectionManager.activeSessions.size 
    });
  }

  /**
   * Checks for orphaned sessions
   * Detects sessions that may be stuck or orphaned
   */
  async checkOrphanedSessions() {
    try {
      this.consoleManager.addConsoleEntry('System', 'Checking for orphaned sessions...', 'info');
      
      // Check for orphaned sessions using electronAPI
      const orphanedSessions = await window.electronAPI.findOrphanedSessions();
      
      if (orphanedSessions.length === 0) {
        this.consoleManager.addConsoleEntry('SUCCESS', 'No orphaned sessions found', 'info');
        this.uiManager.showSuccess('No orphaned sessions found');
      } else {
        this.consoleManager.addConsoleEntry('WARN', `Found ${orphanedSessions.length} orphaned session(s)`, 'warn');
        this.uiManager.showError(`Found ${orphanedSessions.length} orphaned session(s). Use Force Cleanup to terminate them.`);
      }
    } catch (error) {
      this.consoleManager.addConsoleEntry('ERROR', `Failed to check for orphaned sessions: ${error.message}`, 'error');
      this.uiManager.showError(`Failed to check for orphaned sessions: ${error.message}`);
    }
  }

  /**
   * Forces cleanup of all orphaned sessions
   * Terminates stuck or orphaned session processes
   */
  async forceCleanupSessions() {
    try {
      this.consoleManager.addConsoleEntry('System', 'Force cleaning up all orphaned sessions...', 'info');
      
      // Force kill orphaned sessions using electronAPI
      const result = await window.electronAPI.forceKillOrphanedSessions();
      
      this.consoleManager.addConsoleEntry('SUCCESS', result.message, 'info');
      this.uiManager.showSuccess(result.message);
      
      // Refresh the sessions list after cleanup
      this.populateSessionsList();
      
    } catch (error) {
      this.consoleManager.addConsoleEntry('ERROR', `Failed to force cleanup sessions: ${error.message}`, 'error');
      this.uiManager.showError(`Failed to force cleanup sessions: ${error.message}`);
    }
  }
} 