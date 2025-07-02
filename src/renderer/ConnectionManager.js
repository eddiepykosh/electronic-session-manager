export default class ConnectionManager {
  constructor(uiManager, consoleManager, statusBarManager) {
    this.uiManager = uiManager;
    this.consoleManager = consoleManager;
    this.statusBarManager = statusBarManager;
    this.activeSessions = new Map();
  }

  // Helper to generate a unique session key
  getSessionKey(instanceId, localPort, remotePort) {
    return `${instanceId}-${localPort}-${remotePort}`;
  }

  // Called from a delegated method on the main app object
  async connectViaRDP(instanceId) {
    try {
      this.consoleManager.addConsoleEntry('System', `Starting RDP connection for instance: ${instanceId}`, 'info');
      
      if (window.electronAPI && window.electronAPI.startPortForwarding) {
        const result = await window.electronAPI.startPortForwarding(instanceId, 13389, 3389);
        this.consoleManager.addConsoleEntry('System', `RDP connection started for instance ${instanceId}`, 'info');
        
        const key = this.getSessionKey(instanceId, 13389, 3389);
        this.activeSessions.set(key, {
          sessionId: result.sessionId,
          connectionType: 'RDP',
          localPort: 13389,
          remotePort: 3389,
          startTime: new Date(),
          instanceId: instanceId
        });
        
        this.uiManager.showConnectionSuccess('RDP', instanceId, 13389, 3389);
        this.statusBarManager.updateStatusBar({ activeSessions: this.activeSessions.size });
        app.refreshInstanceDetails(instanceId);
      }
    } catch (error) {
      this.consoleManager.addConsoleEntry('ERROR', `Failed to start RDP connection for instance ${instanceId}: ${error.message}`, 'error');
      this.uiManager.showError(`Failed to start RDP connection: ${error.message}`);
    }
  }

  async connectViaSSH(instanceId) {
    try {
      this.consoleManager.addConsoleEntry('System', `Starting SSH connection for instance: ${instanceId}`, 'info');
      
      if (window.electronAPI && window.electronAPI.startPortForwarding) {
        const result = await window.electronAPI.startPortForwarding(instanceId, 2222, 22);
        this.consoleManager.addConsoleEntry('System', `SSH connection started for instance ${instanceId}`, 'info');
        
        const key = this.getSessionKey(instanceId, 2222, 22);
        this.activeSessions.set(key, {
          sessionId: result.sessionId,
          connectionType: 'SSH',
          localPort: 2222,
          remotePort: 22,
          startTime: new Date(),
          instanceId: instanceId
        });
        
        this.uiManager.showConnectionSuccess('SSH', instanceId, 2222, 22);
        this.statusBarManager.updateStatusBar({ activeSessions: this.activeSessions.size });
        app.refreshInstanceDetails(instanceId);
      }
    } catch (error) {
      this.consoleManager.addConsoleEntry('ERROR', `Failed to start SSH connection for instance ${instanceId}: ${error.message}`, 'error');
      this.uiManager.showError(`Failed to start SSH connection: ${error.message}`);
    }
  }

  connectViaCustom(instanceId) {
    const customPortDialog = document.createElement('div');
    customPortDialog.className = 'custom-port-dialog';
    customPortDialog.innerHTML = `
      <div class="custom-port-content">
        <h3>Custom Port Forwarding</h3>
        <p>Enter the ports for port forwarding:</p>
        <div class="port-inputs">
          <div class="port-input-group">
            <label for="local-port">Local Port:</label>
            <input type="number" id="local-port" placeholder="e.g., 8080" min="1024" max="65535" value="8080">
          </div>
          <div class="port-input-group">
            <label for="remote-port">Remote Port:</label>
            <input type="number" id="remote-port" placeholder="e.g., 80" min="1" max="65535" value="80">
          </div>
        </div>
        <div class="dialog-buttons">
          <button class="btn-secondary" onclick="app.closeCustomPortDialog()">Cancel</button>
          <button class="btn-primary" onclick="app.startCustomPortForwarding('${instanceId}')">Start Connection</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(customPortDialog);
    
    // Add the active class to make the dialog visible
    setTimeout(() => {
      customPortDialog.classList.add('active');
      const localPortInput = document.getElementById('local-port');
      if (localPortInput) localPortInput.focus();
    }, 100);
  }

  async startCustomPortForwarding(instanceId) {
    try {
      const localPort = document.getElementById('local-port').value;
      const remotePort = document.getElementById('remote-port').value;
      
      if (!localPort || !remotePort) {
        this.uiManager.showError('Please enter both local and remote ports');
        return;
      }
      
      this.statusBarManager.updateStatusBar({ 
        appStatus: 'busy',
        appStatusText: 'Starting port forwarding...'
      });
      
      const result = await window.electronAPI.startPortForwarding(instanceId, parseInt(localPort), parseInt(remotePort));
      
      if (result.success) {
        const key = this.getSessionKey(instanceId, localPort, remotePort);
        this.activeSessions.set(key, {
          sessionId: result.sessionId,
          localPort: localPort,
          remotePort: remotePort,
          startTime: new Date(),
          instanceId: instanceId
        });
        
        this.statusBarManager.updateStatusBar({ 
          appStatus: 'ready',
          appStatusText: 'Ready',
          activeSessions: this.activeSessions.size
        });
        
        this.uiManager.showConnectionSuccess('Custom Port Forwarding', instanceId, localPort, remotePort);
        app.closeCustomPortDialog();
        app.refreshInstanceDetails(instanceId);
      } else {
        this.statusBarManager.updateStatusBar({ 
          appStatus: 'error',
          appStatusText: 'Error'
        });
        this.consoleManager.addConsoleEntry('ERROR', `Error starting port forwarding: ${result.error || 'Failed to start port forwarding'}`, 'error');
        this.uiManager.showError(result.error || 'Failed to start port forwarding');
      }
    } catch (error) {
      this.statusBarManager.updateStatusBar({ 
        appStatus: 'error',
        appStatusText: 'Error'
      });
      this.consoleManager.addConsoleEntry('ERROR', `Error starting port forwarding: ${error.message}`, 'error');
      this.uiManager.showError(`Failed to start port forwarding: ${error.message}`);
    }
  }

  async stopPortForwarding(instanceId, localPort, remotePort) {
    // Find the session key
    let key = null;
    let session = null;
    console.log('Attempting to stop session:', { instanceId, localPort, remotePort });
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
    if (!session) {
      this.uiManager.showError('No active session found for this instance/port combination');
      return;
    }
    this.statusBarManager.updateStatusBar({ 
      appStatus: 'busy',
      appStatusText: 'Stopping session...'
    });
    const result = await window.electronAPI.stopPortForwarding(instanceId, session.sessionId);
    if (result && result.success) {
      this.activeSessions.delete(key);
      this.statusBarManager.updateStatusBar({ 
        appStatus: 'ready',
        appStatusText: 'Ready',
        activeSessions: this.activeSessions.size
      });
      app.refreshInstanceDetails(instanceId);
      return result;
    } else {
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

  showPortForwardingSuccess(connectionType, instanceId, localPort, remotePort, sessionId) {
    // This method is now replaced by uiManager.showConnectionSuccess
    // It's kept here to avoid breaking any potential calls, but should be considered deprecated.
    this.uiManager.showConnectionSuccess(connectionType, instanceId, localPort, remotePort);
  }

  getPortForwardingActions(instanceId) {
    // Show stop buttons for all sessions for this instance
    let actions = '';
    for (const [key, session] of this.activeSessions.entries()) {
      if (session.instanceId === instanceId) {
        actions += `
          <button class="btn-action btn-stop" onclick="app.stopPortForwarding('${instanceId}', '${session.localPort}', '${session.remotePort}')">⏹️ Stop Port Forwarding (${session.localPort}→${session.remotePort})</button>
        `;
      }
    }
    return actions;
  }
} 