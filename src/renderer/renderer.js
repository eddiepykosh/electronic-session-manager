// Renderer process script
// This file handles the UI interactions and communicates with the main process

class ElectronicSessionManager {
  constructor() {
    this.initializeApp();
  }

  initializeApp() {
    console.log('Electronic Session Manager initialized');
    
    // Set up event listeners
    this.setupEventListeners();
    
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
    
    entry.innerHTML = `
      <span class="timestamp">[${timestamp}] ${level}</span>
      <span class="message">${this.escapeHtml(message)}</span>
    `;

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
      buttons += `<button class="btn-action" onclick="app.startSession('${instanceId}')">🔗 Connect</button>`;
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
    // TODO: Implement instance details display
    console.log('Showing details for instance:', instanceId);
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

  async startSession(instanceId) {
    try {
      console.log('Starting session for instance:', instanceId);
      this.addConsoleEntry('System', `Starting session for instance: ${instanceId}`, 'info');
      
      if (window.electronAPI && window.electronAPI.startSession) {
        await window.electronAPI.startSession(instanceId);
        this.addConsoleEntry('System', `Session started for instance ${instanceId}`, 'info');
        this.showSuccess(`Session started for instance ${instanceId}`);
      }
    } catch (error) {
      console.error('Error starting session:', error);
      this.addConsoleEntry('ERROR', `Failed to start session for instance ${instanceId}: ${error.message}`, 'error');
      this.showError(`Failed to start session: ${error.message}`);
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
}

// Initialize the application when the script loads
const app = new ElectronicSessionManager();