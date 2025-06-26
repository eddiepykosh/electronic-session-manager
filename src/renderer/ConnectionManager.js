export default class ConnectionManager {
  constructor(uiManager, consoleManager, statusBarManager) {
    this.uiManager = uiManager;
    this.consoleManager = consoleManager;
    this.statusBarManager = statusBarManager;
    this.activeSessions = new Map();
  }

  // Called from a delegated method on the main app object
  async connectViaRDP(instanceId) {
    try {
      this.consoleManager.addConsoleEntry('System', `Starting RDP connection for instance: ${instanceId}`, 'info');
      
      if (window.electronAPI && window.electronAPI.startPortForwarding) {
        const result = await window.electronAPI.startPortForwarding(instanceId, 13389, 3389);
        this.consoleManager.addConsoleEntry('System', `RDP connection started for instance ${instanceId}`, 'info');
        
        this.activeSessions.set(instanceId, {
          sessionId: result.sessionId,
          connectionType: 'RDP',
          localPort: 13389,
          remotePort: 3389
        });
        
        this.showPortForwardingSuccess('RDP', instanceId, 13389, 3389, result.sessionId);
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
        
        this.activeSessions.set(instanceId, {
          sessionId: result.sessionId,
          connectionType: 'SSH',
          localPort: 2222,
          remotePort: 22
        });
        
        this.showPortForwardingSuccess('SSH', instanceId, 2222, 22, result.sessionId);
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
    
    setTimeout(() => {
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
        this.activeSessions.set(instanceId, {
          sessionId: result.sessionId,
          localPort: localPort,
          remotePort: remotePort,
          startTime: new Date()
        });
        
        this.statusBarManager.updateStatusBar({ 
          appStatus: 'ready',
          appStatusText: 'Ready',
          activeSessions: this.activeSessions.size
        });
        
        this.showPortForwardingSuccess('Custom Port Forwarding', instanceId, localPort, remotePort, result.sessionId);
        this.uiManager.closeCustomPortDialog();
        app.refreshInstanceDetails(instanceId);
      } else {
        this.statusBarManager.updateStatusBar({ 
          appStatus: 'error',
          appStatusText: 'Error'
        });
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

  async stopPortForwarding(instanceId) {
    try {
      const session = this.activeSessions.get(instanceId);
      if (!session) {
        this.uiManager.showError('No active session found for this instance');
        return;
      }
      
      this.statusBarManager.updateStatusBar({ 
        appStatus: 'busy',
        appStatusText: 'Stopping session...'
      });
      
      const result = await window.electronAPI.stopPortForwarding(instanceId, session.sessionId);
      
      if (result.success) {
        this.activeSessions.delete(instanceId);
        
        this.statusBarManager.updateStatusBar({ 
          appStatus: 'ready',
          appStatusText: 'Ready',
          activeSessions: this.activeSessions.size
        });
        
        this.uiManager.showSuccess(`Port forwarding stopped for instance ${instanceId}`);
        app.refreshInstanceDetails(instanceId);
      } else {
        this.statusBarManager.updateStatusBar({ 
          appStatus: 'error',
          appStatusText: 'Error'
        });
        this.uiManager.showError(result.error || 'Failed to stop port forwarding');
      }
    } catch (error) {
      this.statusBarManager.updateStatusBar({ 
        appStatus: 'error',
        appStatusText: 'Error'
      });
      this.consoleManager.addConsoleEntry('ERROR', `Error stopping port forwarding: ${error.message}`, 'error');
      this.uiManager.showError(`Failed to stop port forwarding: ${error.message}`);
    }
  }

  showPortForwardingSuccess(connectionType, instanceId, localPort, remotePort, sessionId) {
    const successPopup = document.createElement('div');
    successPopup.className = 'success-popup';
    
    let connectionInstructions = '';
    if (connectionType === 'RDP') {
      connectionInstructions = `Connect to: localhost:${localPort}`;
    } else if (connectionType === 'SSH') {
      connectionInstructions = `SSH to: localhost -p ${localPort}`;
    } else {
      connectionInstructions = `Connect to: localhost:${localPort}`;
    }
    
    successPopup.innerHTML = `
      <div class="success-content">
        <div class="success-header">
          <span class="success-icon">✅</span>
          <h3>Port Forwarding Started</h3>
        </div>
        <div class="success-details">
          <p><strong>Instance:</strong> ${instanceId}</p>
          <p><strong>Connection Type:</strong> ${connectionType}</p>
          <p><strong>Port Mapping:</strong> localhost:${localPort} → remote:${remotePort}</p>
          ${sessionId ? `<p><strong>Session ID:</strong> <code>${sessionId}</code></p>` : ''}
          <div class="connection-instructions">
            <p><strong>To connect:</strong></p>
            <code>${connectionInstructions}</code>
          </div>
          <div class="session-info">
            <p><strong>Status:</strong> <span class="status-running">🟢 Active</span></p>
            <p class="session-note">The port forwarding session is now active. You can connect using the instructions above.</p>
          </div>
        </div>
        <button class="btn-primary" onclick="app.closeSuccessPopup()">OK</button>
      </div>
    `;
    
    document.body.appendChild(successPopup);
  }

  getPortForwardingActions(instanceId) {
    const session = this.activeSessions.get(instanceId);
    if (session) {
      return `
        <button class="btn-action btn-stop" onclick="app.stopPortForwarding('${instanceId}')">⏹️ Stop Port Forwarding</button>
      `;
    } else {
      return '';
    }
  }
} 