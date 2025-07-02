export default class InstanceManager {
  constructor(uiManager, consoleManager, connectionManager, statusBarManager) {
    this.uiManager = uiManager;
    this.consoleManager = consoleManager;
    this.connectionManager = connectionManager;
    this.statusBarManager = statusBarManager;
    this.instances = [];
    this.setupInstanceControls();
    // Don't auto-load instances - wait for user to select profile and manually load
    this.displayNoProfileMessage();
  }

  setupInstanceControls() {
    const refreshButton = document.getElementById('refresh-instances');
    if (refreshButton) {
      refreshButton.addEventListener('click', () => this.loadInstances());
    }
  }

  displayNoProfileMessage() {
    const instanceList = document.getElementById('instance-list');
    if (instanceList) {
      instanceList.innerHTML = `
        <div class="no-profile-message">
          <div class="message-icon">🔐</div>
          <h3>Select an AWS Profile</h3>
          <p>Please select an AWS profile from the dropdown above to load your EC2 instances.</p>
          <p class="message-hint">The app will not automatically connect to any profile until you make a selection.</p>
        </div>
      `;
    }
  }

  displayProfileReadyMessage() {
    const instanceList = document.getElementById('instance-list');
    if (instanceList) {
      instanceList.innerHTML = `
        <div class="profile-ready-message">
          <div class="message-icon">✅</div>
          <h3>Profile Ready</h3>
          <p>Your AWS profile is ready. Click the "Refresh Instances" button above to load your EC2 instances.</p>
          <p class="message-hint">No instances will be loaded until you manually refresh.</p>
        </div>
      `;
    }
  }

  async loadInstances() {
    this.statusBarManager.updateStatusBar({ 
      appStatus: 'busy',
      appStatusText: 'Loading...'
    });
    try {
      this.consoleManager.addConsoleEntry('System', 'Loading EC2 instances...', 'info');
      
      if (window.electronAPI && window.electronAPI.getInstances) {
        const instances = await window.electronAPI.getInstances();
        this.consoleManager.addConsoleEntry('System', `Loaded ${instances.length} EC2 instances`, 'info');
        
        this.instances = instances;
        
        instances.forEach((instance, index) => {
          const nameTag = instance.tags?.find(tag => tag.Key === 'Name');
          const instanceName = nameTag?.Value || instance.id;
          this.consoleManager.addConsoleEntry('Debug', `Instance ${index + 1}: ${instanceName} (${instance.id}) - ${instance.state}`, 'debug');
        });
        
        this.displayInstances(instances);
        const now = new Date().toLocaleTimeString();
        this.statusBarManager.updateStatusBar({ 
          appStatus: 'ready',
          appStatusText: 'Ready',
          lastUpdate: now
        });
      } else {
        throw new Error('Electron API not available');
      }
    } catch (error) {
      this.consoleManager.addConsoleEntry('ERROR', `Failed to load instances: ${error.message}`, 'error');
      this.uiManager.showError('Failed to load instances');
      this.displayInstances([]);
      this.statusBarManager.updateStatusBar({ 
        appStatus: 'error',
        appStatusText: 'Error'
      });
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
    
    this.setupInstanceClickHandlers();
  }

  getStatusIcon(status) {
    switch (status?.toLowerCase()) {
      case 'running': return '🟢';
      case 'stopped': return '🔴';
      case 'pending': return '🟡';
      case 'stopping': return '🟠';
      case 'shutting-down': return '🟠';
      default: return '⚪';
    }
  }

  getActionButtons(instance) {
    const status = instance.state?.toLowerCase();
    let buttons = '';
    
    if (status === 'running') {
      buttons += `<button class="btn-action" onclick="app.stopInstance('${instance.id}')">⏹️ Stop</button>`;
    } else if (status === 'stopped') {
      buttons += `<button class="btn-action" onclick="app.startInstance('${instance.id}')">▶️ Start</button>`;
    }
    
    return buttons;
  }

  getDetailsActionButtons(instance) {
    const status = instance.state?.toLowerCase();
    let buttons = '';
    
    if (status === 'running') {
      buttons += `<button class="btn-action" onclick="app.stopInstance('${instance.id}')">⏹️ Stop</button>`;
      buttons += `<button class="btn-action btn-connect" onclick="app.connectViaRDP('${instance.id}')">🖥️ Connect via RDP</button>`;
      buttons += `<button class="btn-action btn-connect" onclick="app.connectViaSSH('${instance.id}')">💻 Connect via SSH</button>`;
      buttons += `<button class="btn-action btn-connect" onclick="app.connectViaCustom('${instance.id}')">🔧 Connect using Custom ports</button>`;
    } else if (status === 'stopped') {
      buttons += `<button class="btn-action" onclick="app.startInstance('${instance.id}')">▶️ Start</button>`;
    }
    
    return buttons;
  }

  setupInstanceClickHandlers() {
    const instanceItems = document.querySelectorAll('.instance-item');
    instanceItems.forEach(item => {
      item.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-action')) return;
        
        instanceItems.forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        
        const instanceId = item.getAttribute('data-instance-id');
        this.showInstanceDetails(instanceId);
      });
    });
  }

  showInstanceDetails(instanceId) {
    const instance = this.instances.find(inst => inst.id === instanceId);
    if (!instance) {
      console.error('Instance not found:', instanceId);
      return;
    }

    const nameTag = instance.tags?.find(tag => tag.Key === 'Name');
    const instanceName = nameTag?.Value || instance.id;
    const launchTime = instance.launchTime ? new Date(instance.launchTime).toLocaleString() : 'N/A';
    const statusIcon = this.getStatusIcon(instance.state);

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
              ${this.connectionManager.getPortForwardingActions(instance.id)}
            </div>
          </div>
          <div class="detail-section">
            <h3>Status & Configuration</h3>
            <div class="detail-grid">
              <div class="detail-item"><span class="detail-label">Status:</span><span class="detail-value status-${instance.state?.toLowerCase()}">${statusIcon} ${instance.state || 'Unknown'}</span></div>
              <div class="detail-item"><span class="detail-label">Instance Type:</span><span class="detail-value">${instance.type || 'Unknown'}</span></div>
              <div class="detail-item"><span class="detail-label">Platform:</span><span class="detail-value">${instance.platform || 'linux'}</span></div>
              <div class="detail-item"><span class="detail-label">Launch Time:</span><span class="detail-value">${launchTime}</span></div>
            </div>
          </div>
          <div class="detail-section">
            <h3>Network Information</h3>
            <div class="detail-grid">
              <div class="detail-item"><span class="detail-label">Public IP:</span><span class="detail-value">${instance.publicIp || 'N/A'}</span></div>
              <div class="detail-item"><span class="detail-label">Private IP:</span><span class="detail-value">${instance.privateIp || 'N/A'}</span></div>
              <div class="detail-item"><span class="detail-label">Availability Zone:</span><span class="detail-value">${instance.availabilityZone || 'Unknown'}</span></div>
              <div class="detail-item"><span class="detail-label">VPC ID:</span><span class="detail-value">${instance.vpcId || 'N/A'}</span></div>
              <div class="detail-item"><span class="detail-label">Subnet ID:</span><span class="detail-value">${instance.subnetId || 'N/A'}</span></div>
            </div>
          </div>
          ${instance.tags && instance.tags.length > 0 ? `
          <div class="detail-section">
            <h3>Tags</h3>
            <div class="tags-container">
              ${instance.tags.map(tag => `<div class="tag-item"><span class="tag-key">${tag.Key}:</span><span class="tag-value">${tag.Value}</span></div>`).join('')}
            </div>
          </div>
          ` : ''}
        </div>
      </div>
    `;

    const detailsPanel = document.getElementById('instance-details');
    if (detailsPanel) {
      detailsPanel.innerHTML = detailsHtml;
    }

    this.consoleManager.addConsoleEntry('System', `Displaying details for instance: ${instanceName} (${instanceId})`, 'info');
  }

  async startInstance(instanceId) {
    try {
      this.consoleManager.addConsoleEntry('System', `Starting instance: ${instanceId}`, 'info');
      
      if (window.electronAPI && window.electronAPI.startInstance) {
        await window.electronAPI.startInstance(instanceId);
        this.consoleManager.addConsoleEntry('System', `Instance ${instanceId} started successfully`, 'info');
        this.uiManager.showSuccess(`Instance ${instanceId} started successfully`);
        setTimeout(() => this.loadInstances(), 2000);
      }
    } catch (error) {
      this.consoleManager.addConsoleEntry('ERROR', `Failed to start instance ${instanceId}: ${error.message}`, 'error');
      this.uiManager.showError(`Failed to start instance: ${error.message}`);
    }
  }

  async stopInstance(instanceId) {
    try {
      this.consoleManager.addConsoleEntry('System', `Stopping instance: ${instanceId}`, 'info');
      
      if (window.electronAPI && window.electronAPI.stopInstance) {
        await window.electronAPI.stopInstance(instanceId);
        this.consoleManager.addConsoleEntry('System', `Instance ${instanceId} stopped successfully`, 'info');
        this.uiManager.showSuccess(`Instance ${instanceId} stopped successfully`);
        setTimeout(() => this.loadInstances(), 2000);
      }
    } catch (error) {
      this.consoleManager.addConsoleEntry('ERROR', `Failed to stop instance ${instanceId}: ${error.message}`, 'error');
      this.uiManager.showError(`Failed to stop instance: ${error.message}`);
    }
  }

  refreshInstanceDetails(instanceId) {
    this.showInstanceDetails(instanceId);
  }
} 