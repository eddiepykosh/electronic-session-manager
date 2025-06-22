// Renderer process script
// This file handles the UI interactions and communicates with the main process

class ElectronicSessionManager {
  constructor() {
    this.instances = []; // Store instances data
    this.activeSessions = new Map(); // Track active port forwarding sessions
    this.initializeApp();
  }

  initializeApp() {
    console.log('Electronic Session Manager initialized');
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Initialize profile management
    this.initializeProfileManagement();
    
    // Load initial data
    this.loadInstances();
    
    // Initialize console
    this.initializeConsole();
  }

  setupEventListeners() {
    // Add event listeners for UI interactions
    document.addEventListener('DOMContentLoaded', () => {
      console.log('DOM loaded, setting up event listeners');
      
      // Tab switching
      this.setupTabSwitching();
      
      // Console controls
      this.setupConsoleControls();
      
      // Instance controls
      this.setupInstanceControls();
      
      // Profile controls
      this.setupProfileControls();
    });
  }

  setupTabSwitching() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabPanels = document.querySelectorAll('.tab-panel');

    tabButtons.forEach(button => {
      button.addEventListener('click', () => {
        const targetTab = button.getAttribute('data-tab');
        
        // Remove active class from all buttons and panels
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabPanels.forEach(panel => panel.classList.remove('active'));
        
        // Add active class to clicked button and corresponding panel
        button.classList.add('active');
        document.getElementById(`${targetTab}-tab`).classList.add('active');
      });
    });
  }

  setupConsoleControls() {
    // Clear console button
    const clearButton = document.getElementById('clear-console');
    if (clearButton) {
      clearButton.addEventListener('click', () => {
        this.clearConsole();
      });
    }

    // Export logs button
    const exportButton = document.getElementById('export-logs');
    if (exportButton) {
      exportButton.addEventListener('click', () => {
        this.exportLogs();
      });
    }
  }

  setupInstanceControls() {
    // Refresh instances button
    const refreshButton = document.getElementById('refresh-instances');
    if (refreshButton) {
      refreshButton.addEventListener('click', () => {
        this.loadInstances();
      });
    }
  }

  setupProfileControls() {
    const profileSelect = document.getElementById('profile-select');
    if (profileSelect) {
      profileSelect.addEventListener('change', async (event) => {
        const selectedProfile = event.target.value;
        if (selectedProfile) {
          await this.switchProfile(selectedProfile);
        }
      });
    }

    // Manage profiles button
    const manageProfilesBtn = document.getElementById('manage-profiles');
    if (manageProfilesBtn) {
      manageProfilesBtn.addEventListener('click', () => {
        this.showProfileManagementDialog();
      });
    }
  }

  initializeConsole() {
    // Add initial console message
    this.addConsoleEntry('System', 'Console initialized. Ready to display logs.', 'info');
    
    // Add some test messages to verify console is working
    this.addConsoleEntry('Test', 'Testing console functionality...', 'debug');
    this.addConsoleEntry('Test', 'This is a test info message', 'info');
    this.addConsoleEntry('Test', 'This is a test warning message', 'warn');
    this.addConsoleEntry('Test', 'This is a test error message', 'error');
    
    // Set up log capture from main process
    if (window.electronAPI) {
      // Listen for log messages from main process
      window.electronAPI.onLogMessage((event, logData) => {
        this.addConsoleEntry(logData.level, logData.message, logData.level);
      });
    }
    
    // Capture console.log, console.error, etc. from renderer
    this.captureConsoleLogs();
  }

  captureConsoleLogs() {
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;
    const originalInfo = console.info;
    const originalDebug = console.debug;

    console.log = (...args) => {
      originalLog.apply(console, args);
      this.addConsoleEntry('INFO', args.join(' '), 'info');
    };

    console.error = (...args) => {
      originalError.apply(console, args);
      this.addConsoleEntry('ERROR', args.join(' '), 'error');
    };

    console.warn = (...args) => {
      originalWarn.apply(console, args);
      this.addConsoleEntry('WARN', args.join(' '), 'warn');
    };

    console.info = (...args) => {
      originalInfo.apply(console, args);
      this.addConsoleEntry('INFO', args.join(' '), 'info');
    };

    console.debug = (...args) => {
      originalDebug.apply(console, args);
      this.addConsoleEntry('DEBUG', args.join(' '), 'debug');
    };
  }

  addConsoleEntry(level, message, logLevel = 'info') {
    const consoleOutput = document.getElementById('console-output');
    if (!consoleOutput) return;

    const timestamp = new Date().toLocaleTimeString();
    const entry = document.createElement('div');
    entry.className = `console-entry ${logLevel}`;
    
    entry.innerHTML = `<span class="timestamp">[${timestamp}] ${level}</span> <span class="message">${this.escapeHtml(message)}</span>`;

    consoleOutput.appendChild(entry);
    
    // Auto-scroll to bottom
    consoleOutput.scrollTop = consoleOutput.scrollHeight;
    
    // Limit console entries to prevent memory issues
    const entries = consoleOutput.querySelectorAll('.console-entry');
    if (entries.length > 1000) {
      entries[0].remove();
    }
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  clearConsole() {
    const consoleOutput = document.getElementById('console-output');
    if (consoleOutput) {
      consoleOutput.innerHTML = '';
      this.addConsoleEntry('System', 'Console cleared.', 'info');
    }
  }

  async exportLogs() {
    try {
      const consoleOutput = document.getElementById('console-output');
      if (!consoleOutput) return;

      const entries = consoleOutput.querySelectorAll('.console-entry');
      let logContent = 'Electronic Session Manager - Console Logs\n';
      logContent += `Exported on: ${new Date().toLocaleString()}\n`;
      logContent += '='.repeat(50) + '\n\n';

      entries.forEach(entry => {
        const timestamp = entry.querySelector('.timestamp').textContent;
        const message = entry.querySelector('.message').textContent;
        logContent += `${timestamp} ${message}\n`;
      });

      // Create and download file
      const blob = new Blob([logContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `electronic-session-manager-logs-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      this.addConsoleEntry('System', 'Logs exported successfully.', 'info');
    } catch (error) {
      this.addConsoleEntry('ERROR', `Failed to export logs: ${error.message}`, 'error');
    }
  }

  async loadInstances() {
    try {
      console.log('Loading EC2 instances...');
      this.addConsoleEntry('System', 'Loading EC2 instances...', 'info');
      
      // Call the main process to get instances from AWS
      if (window.electronAPI && window.electronAPI.getInstances) {
        const instances = await window.electronAPI.getInstances();
        console.log('Instances loaded:', instances);
        this.addConsoleEntry('System', `Loaded ${instances.length} EC2 instances`, 'info');
        
        // Store instances data for later use
        this.instances = instances;
        
        // Log instance details for debugging
        instances.forEach((instance, index) => {
          const nameTag = instance.tags?.find(tag => tag.Key === 'Name');
          const instanceName = nameTag?.Value || instance.id;
          this.addConsoleEntry('Debug', `Instance ${index + 1}: ${instanceName} (${instance.id}) - ${instance.state}`, 'debug');
        });
        
        this.displayInstances(instances);
      } else {
        throw new Error('Electron API not available');
      }
    } catch (error) {
      console.error('Error loading instances:', error);
      this.addConsoleEntry('ERROR', `Failed to load instances: ${error.message}`, 'error');
      this.showError('Failed to load instances');
      this.displayInstances([]);
    }
  }

  displayInstances(instances) {
    const instanceList = document.getElementById('instance-list');
    
    if (!instances || instances.length === 0) {
      instanceList.innerHTML = '<p class="no-instances">No instances found</p>';
      return;
    }

    const instancesHtml = instances.map(instance => {
      const statusClass = instance.state?.toLowerCase() || 'unknown';
      const statusIcon = this.getStatusIcon(instance.state);
      
      // Get instance name from tags if available
      const nameTag = instance.tags?.find(tag => tag.Key === 'Name');
      const instanceName = nameTag?.Value || instance.id;
      
      return `
        <div class="instance-item" data-instance-id="${instance.id}">
          <div class="instance-header">
            <span class="instance-name">${instanceName}</span>
            <span class="instance-status ${statusClass}">
              ${statusIcon} ${instance.state || 'Unknown'}
            </span>
          </div>
          <div class="instance-details">
            <div class="instance-info">
              <span class="instance-type">${instance.type || 'Unknown'}</span>
              <span class="instance-zone">${instance.availabilityZone || 'Unknown'}</span>
            </div>
            <div class="instance-actions">
              ${this.getActionButtons(instance)}
            </div>
          </div>
        </div>
      `;
    }).join('');

    instanceList.innerHTML = instancesHtml;
    
    // Add click handlers for instance selection
    this.setupInstanceClickHandlers();
  }

  getStatusIcon(status) {
    switch (status?.toLowerCase()) {
      case 'running':
        return '🟢';
      case 'stopped':
        return '🔴';
      case 'pending':
        return '🟡';
      case 'stopping':
        return '🟠';
      case 'shutting-down':
        return '🟠';
      default:
        return '⚪';
    }
  }

  getActionButtons(instance) {
    const status = instance.state?.toLowerCase();
    const instanceId = instance.id;
    
    let buttons = '';
    
    if (status === 'running') {
      buttons += `<button class="btn-action" onclick="app.stopInstance('${instanceId}')">⏹️ Stop</button>`;
    } else if (status === 'stopped') {
      buttons += `<button class="btn-action" onclick="app.startInstance('${instanceId}')">▶️ Start</button>`;
    }
    
    return buttons;
  }

  getDetailsActionButtons(instance) {
    const status = instance.state?.toLowerCase();
    const instanceId = instance.id;
    
    let buttons = '';
    
    if (status === 'running') {
      buttons += `<button class="btn-action" onclick="app.stopInstance('${instanceId}')">⏹️ Stop</button>`;
      buttons += `<button class="btn-action btn-connect" onclick="app.connectViaRDP('${instanceId}')">🖥️ Connect via RDP</button>`;
      buttons += `<button class="btn-action btn-connect" onclick="app.connectViaSSH('${instanceId}')">💻 Connect via SSH</button>`;
      buttons += `<button class="btn-action btn-connect" onclick="app.connectViaCustom('${instanceId}')">🔧 Connect using Custom ports</button>`;
    } else if (status === 'stopped') {
      buttons += `<button class="btn-action" onclick="app.startInstance('${instanceId}')">▶️ Start</button>`;
    }
    
    return buttons;
  }

  setupInstanceClickHandlers() {
    const instanceItems = document.querySelectorAll('.instance-item');
    instanceItems.forEach(item => {
      item.addEventListener('click', (e) => {
        // Don't trigger if clicking on action buttons
        if (e.target.classList.contains('btn-action')) {
          return;
        }
        
        // Remove active class from all instances
        instanceItems.forEach(i => i.classList.remove('active'));
        
        // Add active class to clicked instance
        item.classList.add('active');
        
        // Show instance details
        const instanceId = item.getAttribute('data-instance-id');
        this.showInstanceDetails(instanceId);
      });
    });
  }

  showInstanceDetails(instanceId) {
    // Find the instance data
    const instance = this.instances.find(inst => inst.id === instanceId);
    
    if (!instance) {
      console.error('Instance not found:', instanceId);
      return;
    }

    // Get instance name from tags
    const nameTag = instance.tags?.find(tag => tag.Key === 'Name');
    const instanceName = nameTag?.Value || instance.id;

    // Format launch time
    const launchTime = instance.launchTime ? new Date(instance.launchTime).toLocaleString() : 'N/A';

    // Get status icon
    const statusIcon = this.getStatusIcon(instance.state);

    // Create detailed HTML
    const detailsHtml = `
      <div class="instance-details-panel">
        <div class="instance-details-header">
          <h2>${instanceName}</h2>
          <span class="instance-id">${instance.id}</span>
        </div>
        
        <div class="instance-details-content">
          <div class="detail-section">
            <h3>Actions</h3>
            <div class="action-buttons">
              ${this.getDetailsActionButtons(instance)}
              ${this.getPortForwardingActions(instance.id)}
            </div>
          </div>

          <div class="detail-section">
            <h3>Status & Configuration</h3>
            <div class="detail-grid">
              <div class="detail-item">
                <span class="detail-label">Status:</span>
                <span class="detail-value status-${instance.state?.toLowerCase()}">
                  ${statusIcon} ${instance.state || 'Unknown'}
                </span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Instance Type:</span>
                <span class="detail-value">${instance.type || 'Unknown'}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Platform:</span>
                <span class="detail-value">${instance.platform || 'linux'}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Launch Time:</span>
                <span class="detail-value">${launchTime}</span>
              </div>
            </div>
          </div>

          <div class="detail-section">
            <h3>Network Information</h3>
            <div class="detail-grid">
              <div class="detail-item">
                <span class="detail-label">Public IP:</span>
                <span class="detail-value">${instance.publicIp || 'N/A'}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Private IP:</span>
                <span class="detail-value">${instance.privateIp || 'N/A'}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Availability Zone:</span>
                <span class="detail-value">${instance.availabilityZone || 'Unknown'}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">VPC ID:</span>
                <span class="detail-value">${instance.vpcId || 'N/A'}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Subnet ID:</span>
                <span class="detail-value">${instance.subnetId || 'N/A'}</span>
              </div>
            </div>
          </div>

          ${instance.tags && instance.tags.length > 0 ? `
          <div class="detail-section">
            <h3>Tags</h3>
            <div class="tags-container">
              ${instance.tags.map(tag => `
                <div class="tag-item">
                  <span class="tag-key">${tag.Key}:</span>
                  <span class="tag-value">${tag.Value}</span>
                </div>
              `).join('')}
            </div>
          </div>
          ` : ''}
        </div>
      </div>
    `;

    // Update the instance details panel
    const detailsPanel = document.getElementById('instance-details');
    if (detailsPanel) {
      detailsPanel.innerHTML = detailsHtml;
    }

    console.log('Showing details for instance:', instanceId);
    this.addConsoleEntry('System', `Displaying details for instance: ${instanceName} (${instanceId})`, 'info');
  }

  async startInstance(instanceId) {
    try {
      console.log('Starting instance:', instanceId);
      this.addConsoleEntry('System', `Starting instance: ${instanceId}`, 'info');
      
      if (window.electronAPI && window.electronAPI.startInstance) {
        await window.electronAPI.startInstance(instanceId);
        this.addConsoleEntry('System', `Instance ${instanceId} started successfully`, 'info');
        this.showSuccess(`Instance ${instanceId} started successfully`);
        
        // Refresh the instance list to show updated status
        setTimeout(() => this.loadInstances(), 2000);
      }
    } catch (error) {
      console.error('Error starting instance:', error);
      this.addConsoleEntry('ERROR', `Failed to start instance ${instanceId}: ${error.message}`, 'error');
      this.showError(`Failed to start instance: ${error.message}`);
    }
  }

  async stopInstance(instanceId) {
    try {
      console.log('Stopping instance:', instanceId);
      this.addConsoleEntry('System', `Stopping instance: ${instanceId}`, 'info');
      
      if (window.electronAPI && window.electronAPI.stopInstance) {
        await window.electronAPI.stopInstance(instanceId);
        this.addConsoleEntry('System', `Instance ${instanceId} stopped successfully`, 'info');
        this.showSuccess(`Instance ${instanceId} stopped successfully`);
        
        // Refresh the instance list to show updated status
        setTimeout(() => this.loadInstances(), 2000);
      }
    } catch (error) {
      console.error('Error stopping instance:', error);
      this.addConsoleEntry('ERROR', `Failed to stop instance ${instanceId}: ${error.message}`, 'error');
      this.showError(`Failed to stop instance: ${error.message}`);
    }
  }

  async connectViaRDP(instanceId) {
    try {
      console.log('Starting RDP connection for instance:', instanceId);
      this.addConsoleEntry('System', `Starting RDP connection for instance: ${instanceId}`, 'info');
      
      if (window.electronAPI && window.electronAPI.startPortForwarding) {
        const result = await window.electronAPI.startPortForwarding(instanceId, 13389, 3389);
        this.addConsoleEntry('System', `RDP connection started for instance ${instanceId}`, 'info');
        
        // Track the active session
        this.activeSessions.set(instanceId, {
          sessionId: result.sessionId,
          connectionType: 'RDP',
          localPort: 13389,
          remotePort: 3389
        });
        
        this.showPortForwardingSuccess('RDP', instanceId, 13389, 3389, result.sessionId);
        
        // Refresh instance details to show stop button
        this.refreshInstanceDetails(instanceId);
      }
    } catch (error) {
      console.error('Error starting RDP connection:', error);
      this.addConsoleEntry('ERROR', `Failed to start RDP connection for instance ${instanceId}: ${error.message}`, 'error');
      this.showError(`Failed to start RDP connection: ${error.message}`);
    }
  }

  async connectViaSSH(instanceId) {
    try {
      console.log('Starting SSH connection for instance:', instanceId);
      this.addConsoleEntry('System', `Starting SSH connection for instance: ${instanceId}`, 'info');
      
      if (window.electronAPI && window.electronAPI.startPortForwarding) {
        const result = await window.electronAPI.startPortForwarding(instanceId, 2222, 22);
        this.addConsoleEntry('System', `SSH connection started for instance ${instanceId}`, 'info');
        
        // Track the active session
        this.activeSessions.set(instanceId, {
          sessionId: result.sessionId,
          connectionType: 'SSH',
          localPort: 2222,
          remotePort: 22
        });
        
        this.showPortForwardingSuccess('SSH', instanceId, 2222, 22, result.sessionId);
        
        // Refresh instance details to show stop button
        this.refreshInstanceDetails(instanceId);
      }
    } catch (error) {
      console.error('Error starting SSH connection:', error);
      this.addConsoleEntry('ERROR', `Failed to start SSH connection for instance ${instanceId}: ${error.message}`, 'error');
      this.showError(`Failed to start SSH connection: ${error.message}`);
    }
  }

  async connectViaCustom(instanceId) {
    // Create custom port input dialog
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
    
    // Focus on first input
    setTimeout(() => {
      const localPortInput = document.getElementById('local-port');
      if (localPortInput) localPortInput.focus();
    }, 100);
  }

  async startCustomPortForwarding(instanceId) {
    const localPort = parseInt(document.getElementById('local-port').value);
    const remotePort = parseInt(document.getElementById('remote-port').value);
    
    // Validate inputs
    if (!localPort || !remotePort) {
      this.showError('Please enter valid port numbers');
      return;
    }
    
    if (localPort < 1024 || localPort > 65535) {
      this.showError('Local port must be between 1024 and 65535');
      return;
    }
    
    if (remotePort < 1 || remotePort > 65535) {
      this.showError('Remote port must be between 1 and 65535');
      return;
    }
    
    try {
      console.log('Starting custom port forwarding for instance:', instanceId);
      this.addConsoleEntry('System', `Starting custom port forwarding for instance: ${instanceId} (${localPort} -> ${remotePort})`, 'info');
      
      if (window.electronAPI && window.electronAPI.startPortForwarding) {
        const result = await window.electronAPI.startPortForwarding(instanceId, localPort, remotePort);
        this.addConsoleEntry('System', `Custom port forwarding started for instance ${instanceId}`, 'info');
        
        // Track the active session
        this.activeSessions.set(instanceId, {
          sessionId: result.sessionId,
          connectionType: 'Custom',
          localPort: localPort,
          remotePort: remotePort
        });
        
        this.showPortForwardingSuccess('Custom', instanceId, localPort, remotePort, result.sessionId);
        this.closeCustomPortDialog();
        
        // Refresh instance details to show stop button
        this.refreshInstanceDetails(instanceId);
      }
    } catch (error) {
      console.error('Error starting custom port forwarding:', error);
      this.addConsoleEntry('ERROR', `Failed to start custom port forwarding for instance ${instanceId}: ${error.message}`, 'error');
      this.showError(`Failed to start custom port forwarding: ${error.message}`);
    }
  }

  async stopPortForwarding(instanceId) {
    const session = this.activeSessions.get(instanceId);
    if (!session) {
      this.showError('No active port forwarding session found for this instance');
      return;
    }
    
    try {
      console.log('Stopping port forwarding for instance:', instanceId, 'session:', session.sessionId);
      this.addConsoleEntry('System', `Stopping port forwarding for instance: ${instanceId}`, 'info');
      
      if (window.electronAPI && window.electronAPI.stopPortForwarding) {
        const result = await window.electronAPI.stopPortForwarding(instanceId, session.sessionId);
        this.addConsoleEntry('System', `Port forwarding stopped for instance ${instanceId}`, 'info');
        
        // Remove from active sessions
        this.activeSessions.delete(instanceId);
        
        // Show success message
        this.showSuccess(`Port forwarding stopped for instance ${instanceId}`);
        
        // Refresh instance details to remove stop button
        this.refreshInstanceDetails(instanceId);
      }
    } catch (error) {
      console.error('Error stopping port forwarding:', error);
      this.addConsoleEntry('ERROR', `Failed to stop port forwarding for instance ${instanceId}: ${error.message}`, 'error');
      this.showError(`Failed to stop port forwarding: ${error.message}`);
    }
  }

  closeCustomPortDialog() {
    const dialog = document.querySelector('.custom-port-dialog');
    if (dialog) {
      dialog.remove();
    }
  }

  showPortForwardingSuccess(connectionType, instanceId, localPort, remotePort, sessionId) {
    // Create success popup
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
    
    // Popup stays open until user clicks OK (no auto-close)
  }

  closeSuccessPopup() {
    const popup = document.querySelector('.success-popup');
    if (popup) {
      popup.remove();
    }
  }

  showError(message) {
    // TODO: Implement error display
    console.error(message);
  }

  showSuccess(message) {
    // TODO: Implement success display
    console.log(message);
  }

  refreshInstanceDetails(instanceId) {
    // Re-display the instance details to show/hide the stop button
    this.showInstanceDetails(instanceId);
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

  // Profile Management
  async initializeProfileManagement() {
    try {
      console.log('Initializing profile management...');
      
      // Load available profiles
      await this.loadAvailableProfiles();
      
      // Get current profile info
      await this.loadCurrentProfileInfo();
      
    } catch (error) {
      console.error('Failed to initialize profile management:', error);
      this.addConsoleEntry('ERROR', `Profile initialization failed: ${error.message}`, 'error');
    }
  }

  async loadAvailableProfiles() {
    try {
      console.log('Loading available AWS profiles...');
      const profiles = await window.electronAPI.getAvailableProfiles();
      
      const profileSelect = document.getElementById('profile-select');
      if (profileSelect) {
        // Clear existing options
        profileSelect.innerHTML = '';
        
        // Add profiles
        profiles.forEach(profile => {
          const option = document.createElement('option');
          option.value = profile;
          option.textContent = profile;
          profileSelect.appendChild(option);
        });
        
        console.log(`Loaded ${profiles.length} profiles:`, profiles);
      }
    } catch (error) {
      console.error('Failed to load profiles:', error);
      this.addConsoleEntry('ERROR', `Failed to load profiles: ${error.message}`, 'error');
      
      // Set fallback option
      const profileSelect = document.getElementById('profile-select');
      if (profileSelect) {
        profileSelect.innerHTML = '<option value="">Error loading profiles</option>';
      }
    }
  }

  async loadCurrentProfileInfo() {
    try {
      console.log('Loading current profile information...');
      const profileInfo = await window.electronAPI.getCurrentProfileInfo();
      
      this.updateProfileStatus(profileInfo);
      
      // Set the current profile in the dropdown
      const profileSelect = document.getElementById('profile-select');
      if (profileSelect) {
        profileSelect.value = profileInfo.profile;
      }
      
      console.log('Current profile info:', profileInfo);
    } catch (error) {
      console.error('Failed to load current profile info:', error);
      this.addConsoleEntry('ERROR', `Failed to load current profile info: ${error.message}`, 'error');
      
      // Set error status
      this.updateProfileStatus({
        profile: 'unknown',
        valid: false,
        error: error.message
      });
    }
  }

  async switchProfile(profile) {
    try {
      console.log(`Switching to profile: ${profile}`);
      this.addConsoleEntry('INFO', `Switching to AWS profile: ${profile}`, 'info');
      
      // Update status to loading
      this.updateProfileStatus({
        profile: profile,
        valid: false,
        error: 'Loading...'
      });
      
      // Set the profile
      const profileInfo = await window.electronAPI.setCurrentProfile(profile);
      
      // Update status with result
      this.updateProfileStatus(profileInfo);
      
      // Refresh instances with new profile
      await this.loadInstances();
      
      if (profileInfo.valid) {
        this.addConsoleEntry('SUCCESS', `Successfully switched to profile: ${profile}`, 'info');
      } else {
        this.addConsoleEntry('WARNING', `Profile ${profile} set but validation failed: ${profileInfo.error}`, 'warn');
      }
      
    } catch (error) {
      console.error('Failed to switch profile:', error);
      this.addConsoleEntry('ERROR', `Failed to switch profile: ${error.message}`, 'error');
      
      // Update status to error
      this.updateProfileStatus({
        profile: profile,
        valid: false,
        error: error.message
      });
    }
  }

  updateProfileStatus(profileInfo) {
    const statusIndicator = document.querySelector('.status-indicator');
    const statusText = document.querySelector('.status-text');
    
    if (statusIndicator && statusText) {
      // Remove all status classes
      statusIndicator.classList.remove('valid', 'invalid', 'loading');
      
      if (profileInfo.valid) {
        statusIndicator.classList.add('valid');
        statusText.textContent = `${profileInfo.profile} (${profileInfo.accountId || 'Valid'})`;
      } else if (profileInfo.error === 'Loading...') {
        statusIndicator.classList.add('loading');
        statusText.textContent = 'Loading...';
      } else {
        statusIndicator.classList.add('invalid');
        statusText.textContent = `${profileInfo.profile} (Invalid)`;
      }
    }
  }

  // Profile Management Dialog
  showProfileManagementDialog() {
    const dialog = document.getElementById('profile-management-dialog');
    if (dialog) {
      dialog.classList.add('active');
      this.setupProfileDialogControls();
      this.loadExistingProfiles();
      this.loadSSOProfiles();
    }
  }

  hideProfileManagementDialog() {
    const dialog = document.getElementById('profile-management-dialog');
    if (dialog) {
      dialog.classList.remove('active');
    }
  }

  setupProfileDialogControls() {
    // Close button
    const closeBtn = document.getElementById('close-profile-dialog');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        this.hideProfileManagementDialog();
      });
    }

    // Close on backdrop click
    const dialog = document.getElementById('profile-management-dialog');
    if (dialog) {
      dialog.addEventListener('click', (event) => {
        if (event.target === dialog) {
          this.hideProfileManagementDialog();
        }
      });
    }

    // Profile type selector
    const profileTypeBtns = document.querySelectorAll('.profile-type-btn');
    const profileForms = document.querySelectorAll('.profile-form');
    
    profileTypeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const profileType = btn.getAttribute('data-type');
        
        // Update active button
        profileTypeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // Show corresponding form
        profileForms.forEach(form => {
          form.classList.remove('active');
          if (form.id === `${profileType}-profile-form`) {
            form.classList.add('active');
          }
        });
      });
    });

    // Form submissions
    const iamForm = document.getElementById('iam-profile-form');
    const ssoForm = document.getElementById('sso-profile-form');

    if (iamForm) {
      iamForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        await this.createIAMProfile();
      });
    }

    if (ssoForm) {
      ssoForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        await this.createSSOProfile();
      });
    }

    // SSO refresh button
    const refreshSSOBtn = document.getElementById('refresh-sso-status');
    if (refreshSSOBtn) {
      refreshSSOBtn.addEventListener('click', async () => {
        await this.loadSSOProfiles();
      });
    }
  }

  async createIAMProfile() {
    try {
      const profileName = document.getElementById('iam-profile-name').value.trim();
      const accessKeyId = document.getElementById('iam-access-key').value.trim();
      const secretAccessKey = document.getElementById('iam-secret-key').value.trim();
      const sessionToken = document.getElementById('iam-session-token').value.trim();
      const region = document.getElementById('iam-region').value;

      if (!profileName || !accessKeyId || !secretAccessKey) {
        this.showError('Please fill in all required fields');
        return;
      }

      console.log('Creating IAM profile:', profileName);
      this.addConsoleEntry('INFO', `Creating IAM profile: ${profileName}`, 'info');

      const result = await window.electronAPI.createProfile(profileName, 'iam', {
        accessKeyId,
        secretAccessKey,
        sessionToken,
        region
      });

      if (result.success) {
        this.addConsoleEntry('SUCCESS', `IAM profile "${profileName}" created successfully`, 'info');
        this.showSuccess(`IAM profile "${profileName}" created successfully`);
        
        // Clear form
        document.getElementById('iam-profile-form').reset();
        
        // Refresh profiles
        await this.loadAvailableProfiles();
        await this.loadExistingProfiles();
      }
    } catch (error) {
      console.error('Failed to create IAM profile:', error);
      this.addConsoleEntry('ERROR', `Failed to create IAM profile: ${error.message}`, 'error');
      this.showError(`Failed to create IAM profile: ${error.message}`);
    }
  }

  async createSSOProfile() {
    try {
      const profileName = document.getElementById('sso-profile-name').value.trim();
      const ssoStartUrl = document.getElementById('sso-start-url').value.trim();
      const ssoRegion = document.getElementById('sso-region').value;
      const accountId = document.getElementById('sso-account-id').value.trim();
      const roleName = document.getElementById('sso-role-name').value.trim();
      const region = document.getElementById('sso-aws-region').value;

      if (!profileName || !ssoStartUrl || !accountId || !roleName) {
        this.showError('Please fill in all required fields');
        return;
      }

      console.log('Creating SSO profile:', profileName);
      this.addConsoleEntry('INFO', `Creating SSO profile: ${profileName}`, 'info');

      const result = await window.electronAPI.createProfile(profileName, 'sso', {
        ssoStartUrl,
        ssoRegion,
        accountId,
        roleName,
        region
      });

      if (result.success) {
        this.addConsoleEntry('SUCCESS', `SSO profile "${profileName}" created successfully`, 'info');
        this.showSuccess(`SSO profile "${profileName}" created successfully`);
        
        // Clear form
        document.getElementById('sso-profile-form').reset();
        
        // Refresh profiles
        await this.loadAvailableProfiles();
        await this.loadExistingProfiles();
      }
    } catch (error) {
      console.error('Failed to create SSO profile:', error);
      this.addConsoleEntry('ERROR', `Failed to create SSO profile: ${error.message}`, 'error');
      this.showError(`Failed to create SSO profile: ${error.message}`);
    }
  }

  async loadExistingProfiles() {
    try {
      const profiles = await window.electronAPI.getAvailableProfiles();
      const currentProfile = await window.electronAPI.getCurrentProfileInfo();
      
      const profilesList = document.getElementById('existing-profiles-list');
      if (profilesList) {
        profilesList.innerHTML = '';
        
        for (const profile of profiles) {
          const profileItem = this.createProfileItem(profile, currentProfile.profile);
          profilesList.appendChild(profileItem);
        }
      }
    } catch (error) {
      console.error('Failed to load existing profiles:', error);
      this.addConsoleEntry('ERROR', `Failed to load existing profiles: ${error.message}`, 'error');
    }
  }

  createProfileItem(profileName, currentProfile) {
    const profileItem = document.createElement('div');
    profileItem.className = 'profile-item';
    if (profileName === currentProfile) {
      profileItem.classList.add('current');
    }

    const profileInfo = document.createElement('div');
    profileInfo.className = 'profile-info';

    const profileNameEl = document.createElement('div');
    profileNameEl.className = 'profile-name';
    profileNameEl.textContent = profileName;

    const profileTypeEl = document.createElement('div');
    profileTypeEl.className = 'profile-type';
    profileTypeEl.textContent = profileName === 'default' ? 'Default' : 'Custom';

    const statusBadge = document.createElement('span');
    statusBadge.className = 'profile-status-badge unknown';
    statusBadge.textContent = 'Unknown';

    profileInfo.appendChild(profileNameEl);
    profileInfo.appendChild(profileTypeEl);
    profileInfo.appendChild(statusBadge);

    const profileActions = document.createElement('div');
    profileActions.className = 'profile-actions';

    const testBtn = document.createElement('button');
    testBtn.className = 'btn-test-profile';
    testBtn.textContent = 'Test';
    testBtn.addEventListener('click', () => this.testProfile(profileName, statusBadge));

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn-delete-profile';
    deleteBtn.textContent = 'Delete';
    deleteBtn.addEventListener('click', () => this.deleteProfile(profileName, profileItem));
    
    // Disable delete for default profile
    if (profileName === 'default') {
      deleteBtn.disabled = true;
    }

    profileActions.appendChild(testBtn);
    profileActions.appendChild(deleteBtn);

    profileItem.appendChild(profileInfo);
    profileItem.appendChild(profileActions);

    // Test profile status on creation
    this.testProfile(profileName, statusBadge);

    return profileItem;
  }

  async testProfile(profileName, statusBadge) {
    try {
      statusBadge.className = 'profile-status-badge unknown';
      statusBadge.textContent = 'Testing...';

      const profileInfo = await window.electronAPI.testProfile(profileName);
      
      if (profileInfo.valid) {
        statusBadge.className = 'profile-status-badge valid';
        statusBadge.textContent = 'Valid';
        this.addConsoleEntry('INFO', `Profile "${profileName}" is valid`, 'info');
      } else {
        statusBadge.className = 'profile-status-badge invalid';
        statusBadge.textContent = 'Invalid';
        this.addConsoleEntry('WARN', `Profile "${profileName}" is invalid: ${profileInfo.error}`, 'warn');
      }
    } catch (error) {
      console.error('Failed to test profile:', error);
      statusBadge.className = 'profile-status-badge invalid';
      statusBadge.textContent = 'Error';
      this.addConsoleEntry('ERROR', `Failed to test profile "${profileName}": ${error.message}`, 'error');
    }
  }

  async deleteProfile(profileName, profileItem) {
    try {
      if (profileName === 'default') {
        this.showError('Cannot delete the default profile');
        return;
      }

      const confirmed = confirm(`Are you sure you want to delete the profile "${profileName}"? This action cannot be undone.`);
      if (!confirmed) {
        return;
      }

      console.log('Deleting profile:', profileName);
      this.addConsoleEntry('INFO', `Deleting profile: ${profileName}`, 'info');

      const result = await window.electronAPI.deleteProfile(profileName);

      if (result.success) {
        this.addConsoleEntry('SUCCESS', `Profile "${profileName}" deleted successfully`, 'info');
        this.showSuccess(`Profile "${profileName}" deleted successfully`);
        
        // Remove from UI
        profileItem.remove();
        
        // Refresh profiles
        await this.loadAvailableProfiles();
        await this.loadCurrentProfileInfo();
      }
    } catch (error) {
      console.error('Failed to delete profile:', error);
      this.addConsoleEntry('ERROR', `Failed to delete profile: ${error.message}`, 'error');
      this.showError(`Failed to delete profile: ${error.message}`);
    }
  }

  // SSO Login Management
  async loadSSOProfiles() {
    try {
      console.log('Loading SSO profiles...');
      const ssoProfiles = await window.electronAPI.getAllSSOLoginStatus();
      
      const ssoProfilesList = document.getElementById('sso-profiles-list');
      if (ssoProfilesList) {
        ssoProfilesList.innerHTML = '';
        
        if (ssoProfiles.length === 0) {
          ssoProfilesList.innerHTML = '<p class="no-sso-profiles">No SSO profiles found. Create an SSO profile first.</p>';
          return;
        }
        
        for (const ssoProfile of ssoProfiles) {
          const ssoProfileItem = this.createSSOProfileItem(ssoProfile);
          ssoProfilesList.appendChild(ssoProfileItem);
        }
      }
      
      console.log(`Loaded ${ssoProfiles.length} SSO profiles`);
    } catch (error) {
      console.error('Failed to load SSO profiles:', error);
      this.addConsoleEntry('ERROR', `Failed to load SSO profiles: ${error.message}`, 'error');
    }
  }

  createSSOProfileItem(ssoProfile) {
    const ssoProfileItem = document.createElement('div');
    ssoProfileItem.className = 'sso-profile-item';

    const ssoProfileInfo = document.createElement('div');
    ssoProfileInfo.className = 'sso-profile-info';

    const ssoProfileName = document.createElement('div');
    ssoProfileName.className = 'sso-profile-name';
    ssoProfileName.textContent = ssoProfile.profileName;

    const ssoProfileStatus = document.createElement('div');
    ssoProfileStatus.className = 'sso-profile-status';
    
    const statusText = ssoProfile.authenticated ? 'Authenticated' : 'Not authenticated';
    const statusClass = ssoProfile.authenticated ? 'authenticated' : 'not-authenticated';
    
    ssoProfileStatus.innerHTML = `
      ${statusText}
      <span class="sso-login-status ${statusClass}">${ssoProfile.authenticated ? '✓' : '✗'}</span>
    `;

    if (ssoProfile.accountId) {
      ssoProfileStatus.innerHTML += `<br><small>Account: ${ssoProfile.accountId}</small>`;
    }

    ssoProfileInfo.appendChild(ssoProfileName);
    ssoProfileInfo.appendChild(ssoProfileStatus);

    const ssoProfileActions = document.createElement('div');
    ssoProfileActions.className = 'sso-profile-actions';

    if (ssoProfile.authenticated) {
      // Show logout button for authenticated profiles
      const logoutBtn = document.createElement('button');
      logoutBtn.className = 'btn-sso-logout';
      logoutBtn.textContent = 'Logout';
      logoutBtn.addEventListener('click', () => this.logoutSSOProfile(ssoProfile.profileName, ssoProfileItem));
      ssoProfileActions.appendChild(logoutBtn);
    } else {
      // Show login button for unauthenticated profiles
      const loginBtn = document.createElement('button');
      loginBtn.className = 'btn-sso-login';
      loginBtn.textContent = 'Login';
      loginBtn.addEventListener('click', () => this.loginSSOProfile(ssoProfile.profileName, ssoProfileItem));
      ssoProfileActions.appendChild(loginBtn);
    }

    ssoProfileItem.appendChild(ssoProfileInfo);
    ssoProfileItem.appendChild(ssoProfileActions);

    return ssoProfileItem;
  }

  async loginSSOProfile(profileName, profileItem) {
    try {
      console.log(`Starting SSO login for profile: ${profileName}`);
      this.addConsoleEntry('INFO', `Starting SSO login for profile: ${profileName}`, 'info');
      
      // Update button to show loading state
      const loginBtn = profileItem.querySelector('.btn-sso-login');
      const originalText = loginBtn.textContent;
      loginBtn.innerHTML = '<span class="sso-login-loading"></span>Logging in...';
      loginBtn.disabled = true;
      
      const result = await window.electronAPI.performSSOLogin(profileName);
      
      if (result.success) {
        this.addConsoleEntry('SUCCESS', `SSO login successful for profile: ${profileName}`, 'info');
        this.showSuccess(`SSO login successful for profile: ${profileName}`);
        
        // Refresh the SSO profiles list
        await this.loadSSOProfiles();
      }
    } catch (error) {
      console.error('Failed to login SSO profile:', error);
      this.addConsoleEntry('ERROR', `Failed to login SSO profile: ${error.message}`, 'error');
      this.showError(`Failed to login SSO profile: ${error.message}`);
      
      // Reset button state
      const loginBtn = profileItem.querySelector('.btn-sso-login');
      loginBtn.textContent = 'Login';
      loginBtn.disabled = false;
    }
  }

  async logoutSSOProfile(profileName, profileItem) {
    try {
      const confirmed = confirm(`Are you sure you want to logout from profile "${profileName}"?`);
      if (!confirmed) {
        return;
      }

      console.log(`Logging out from SSO profile: ${profileName}`);
      this.addConsoleEntry('INFO', `Logging out from SSO profile: ${profileName}`, 'info');
      
      // For now, we'll just refresh the status since AWS CLI doesn't have a direct logout command
      // The session will expire naturally, or users can clear their AWS SSO cache manually
      this.addConsoleEntry('INFO', `SSO logout initiated for profile: ${profileName}. Session will expire naturally.`, 'info');
      this.showSuccess(`SSO logout initiated for profile: ${profileName}`);
      
      // Refresh the SSO profiles list
      await this.loadSSOProfiles();
    } catch (error) {
      console.error('Failed to logout SSO profile:', error);
      this.addConsoleEntry('ERROR', `Failed to logout SSO profile: ${error.message}`, 'error');
      this.showError(`Failed to logout SSO profile: ${error.message}`);
    }
  }
}

// Initialize the application when the script loads
const app = new ElectronicSessionManager();