export default class SessionManager {
  constructor(connectionManager, uiManager, consoleManager) {
    this.connectionManager = connectionManager;
    this.uiManager = uiManager;
    this.consoleManager = consoleManager;
    this.initializeSessionDialog();
  }

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

    // Add handlers for cleanup buttons
    const checkOrphanedSessions = document.getElementById('check-orphaned-sessions');
    if (checkOrphanedSessions) {
      checkOrphanedSessions.addEventListener('click', () => {
        this.checkOrphanedSessions();
      });
    }

    const forceCleanupSessions = document.getElementById('force-cleanup-sessions');
    if (forceCleanupSessions) {
      forceCleanupSessions.addEventListener('click', () => {
        this.forceCleanupSessions();
      });
    }

    const refreshSessionsList = document.getElementById('refresh-sessions-list');
    if (refreshSessionsList) {
      refreshSessionsList.addEventListener('click', () => {
        this.forceRefreshSessionsList();
      });
    }
  }

  showSessionDialog() {
    const dialog = document.getElementById('session-management-dialog');
    if (dialog) {
      dialog.classList.add('active');
      this.populateSessionsList();
    }
  }

  hideSessionDialog() {
    const dialog = document.getElementById('session-management-dialog');
    if (dialog) {
      dialog.classList.remove('active');
    }
  }

  populateSessionsList() {
    const sessionsList = document.getElementById('active-sessions-list');
    const noSessionsMessage = document.getElementById('no-sessions-message');
    
    if (!sessionsList || !noSessionsMessage) return;

    const activeSessions = this.connectionManager.activeSessions;
    
    console.log('Populating sessions list. Active sessions:', activeSessions.size);
    activeSessions.forEach((session, key) => {
      console.log('Session key:', key, 'Session:', session);
    });
    
    if (activeSessions.size === 0) {
      sessionsList.style.display = 'none';
      noSessionsMessage.style.display = 'block';
      return;
    }

    sessionsList.style.display = 'flex';
    noSessionsMessage.style.display = 'none';
    
    sessionsList.innerHTML = '';

    activeSessions.forEach((session, sessionKey) => {
      const sessionItem = this.createSessionItem(session.instanceId, session.localPort, session.remotePort, session);
      sessionsList.appendChild(sessionItem);
    });
  }

  createSessionItem(instanceId, localPort, remotePort, session) {
    const sessionItem = document.createElement('div');
    sessionItem.className = 'session-item';

    const startTime = session.startTime ? new Date(session.startTime).toLocaleString() : 'Unknown';
    const duration = session.startTime ? this.calculateDuration(session.startTime) : 'Unknown';

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

  calculateDuration(startTime) {
    const now = new Date();
    const start = new Date(startTime);
    const diffMs = now - start;
    
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  }

  async stopSessionFromDialog(instanceId, localPort, remotePort) {
    try {
      this.consoleManager.addConsoleEntry('System', `Stopping session for instance: ${instanceId} (localPort: ${localPort}, remotePort: ${remotePort})`, 'info');
      
      console.log('Stopping session for instanceId:', instanceId, 'localPort:', localPort, 'remotePort:', remotePort);
      console.log('Current active sessions before stop:', this.connectionManager.activeSessions.size);
      
      const result = await this.connectionManager.stopPortForwarding(instanceId, localPort, remotePort);
      
      console.log('Stop result:', result);
      console.log('Active sessions after stop:', this.connectionManager.activeSessions.size);
      
      // Provide detailed feedback about termination
      let consoleMessage = `Session stopped for instance: ${instanceId}`;
      let uiMessage = `Session stopped for instance: ${instanceId}`;
      
      if (result && result.processTerminated !== undefined) {
        consoleMessage += ` | Process terminated: ${result.processTerminated ? 'Yes' : 'No'}`;
        uiMessage += `\nProcess terminated: ${result.processTerminated ? '✅ Yes' : '❌ No'}`;
      }
      if (result && result.portReleased !== undefined) {
        consoleMessage += ` | Port released: ${result.portReleased ? 'Yes' : 'May still be in use'}`;
        uiMessage += `\nPort released: ${result.portReleased ? '✅ Yes' : '⚠️ May still be in use'}`;
      }
      
      this.consoleManager.addConsoleEntry('SUCCESS', consoleMessage, 'info');
      this.uiManager.showSuccess(uiMessage);
      
      // Refresh the sessions list immediately
      this.populateSessionsList();
      
      // Update status bar
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

  forceRefreshSessionsList() {
    console.log('Force refreshing sessions list');
    this.populateSessionsList();
    this.connectionManager.statusBarManager.updateStatusBar({ 
      activeSessions: this.connectionManager.activeSessions.size 
    });
  }

  async checkOrphanedSessions() {
    try {
      this.consoleManager.addConsoleEntry('System', 'Checking for orphaned sessions...', 'info');
      
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

  async forceCleanupSessions() {
    try {
      this.consoleManager.addConsoleEntry('System', 'Force cleaning up all orphaned sessions...', 'info');
      
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