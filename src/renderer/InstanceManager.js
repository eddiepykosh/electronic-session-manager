/**
 * Instance Manager - Electronic Session Manager
 * 
 * This file manages the display and interaction with EC2 instances in the application.
 * It handles instance loading, display, details viewing, and instance control operations
 * such as starting and stopping instances.
 * 
 * Key Responsibilities:
 * - Loads and displays EC2 instances from AWS
 * - Manages instance list rendering and updates
 * - Handles instance selection and details display
 * - Provides instance control operations (start/stop)
 * - Manages instance status indicators and icons
 * - Coordinates with connection manager for port forwarding
 * - Handles profile-dependent instance loading
 * 
 * Architecture Role:
 * - Acts as the main EC2 instance management component
 * - Coordinates between AWS services and UI display
 * - Manages instance state and user interactions
 * - Provides instance details and action buttons
 * - Integrates with connection management for port forwarding
 * 
 * Features:
 * - Manual instance loading (no auto-load on profile selection)
 * - Real-time instance status display
 * - Detailed instance information panels
 * - Instance control operations
 * - Connection options for running instances
 * - Status-based action button generation
 * - Instance selection and highlighting
 * 
 * Dependencies:
 * - UIManager: For notifications and UI utilities
 * - ConsoleManager: For logging operations
 * - ConnectionManager: For port forwarding actions
 * - StatusBarManager: For status updates
 * - electronAPI: For AWS operations
 */

export default class InstanceManager {
  /**
   * Constructor initializes the instance manager with dependencies
   * Sets up instance controls and displays initial profile message
   * @param {UIManager} uiManager - UI management utilities
   * @param {ConsoleManager} consoleManager - Console logging
   * @param {ConnectionManager} connectionManager - Port forwarding management
   * @param {StatusBarManager} statusBarManager - Status bar updates
   */
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

  /**
   * Sets up instance control button event listeners
   * Handles refresh instances button functionality
   */
  setupInstanceControls() {
    const refreshButton = document.getElementById('refresh-instances');
    if (refreshButton) {
      refreshButton.addEventListener('click', () => this.loadInstances());
    }
  }

  /**
   * Displays message when no AWS profile is selected
   * Informs user they need to select a profile before loading instances
   */
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

  /**
   * Displays message when profile is ready but instances haven't been loaded
   * Prompts user to manually refresh instances
   */
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

  /**
   * Loads EC2 instances from AWS and updates the display
   * Handles loading states, error handling, and status updates
   */
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

  /**
   * Helper to create DOM elements
   */
  createElement(tag, className, text) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text) el.textContent = text;
    return el;
  }

  /**
   * Displays the list of EC2 instances in the sidebar
   * Creates DOM elements for each instance with status and action buttons
   * @param {Array} instances - Array of EC2 instance objects
   */
  displayInstances(instances) {
    const instanceList = document.getElementById('instance-list');
    instanceList.innerHTML = '';
    
    if (!instances || instances.length === 0) {
      instanceList.appendChild(this.createElement('p', 'no-instances', 'No instances found'));
      return;
    }

    instances.forEach(instance => {
      const statusClass = instance.state?.toLowerCase() || 'unknown';
      const statusIcon = this.getStatusIcon(instance.state);
      
      const nameTag = instance.tags?.find(tag => tag.Key === 'Name');
      const instanceName = nameTag?.Value || instance.id;
      
      const item = this.createElement('div', 'instance-item');
      item.dataset.instanceId = instance.id;
      
      const header = this.createElement('div', 'instance-header');
      header.appendChild(this.createElement('span', 'instance-name', instanceName));
      
      const statusSpan = this.createElement('span', `instance-status ${statusClass}`, `${statusIcon} ${instance.state || 'Unknown'}`);
      header.appendChild(statusSpan);
      item.appendChild(header);
      
      const details = this.createElement('div', 'instance-details');
      const info = this.createElement('div', 'instance-info');
      info.appendChild(this.createElement('span', 'instance-type', instance.type || 'Unknown'));
      info.appendChild(this.createElement('span', 'instance-zone', instance.availabilityZone || 'Unknown'));
      details.appendChild(info);
      
      const actions = this.createElement('div', 'instance-actions');
      this.appendActionButtons(actions, instance);
      details.appendChild(actions);
      
      item.appendChild(details);
      instanceList.appendChild(item);
    });

    this.setupInstanceClickHandlers();
  }

  /**
   * Appends action buttons to a container based on instance state
   * @param {HTMLElement} container - The container to append buttons to
   * @param {Object} instance - EC2 instance object
   */
  appendActionButtons(container, instance) {
    const status = instance.state?.toLowerCase();
    
    if (status === 'running') {
      const stopBtn = this.createElement('button', 'btn-action', '⏹️ Stop');
      stopBtn.onclick = (e) => {
        e.stopPropagation(); // prevent item click handler
        this.stopInstance(instance.id);
      };
      container.appendChild(stopBtn);
    } else if (status === 'stopped') {
      const startBtn = this.createElement('button', 'btn-action', '▶️ Start');
      startBtn.onclick = (e) => {
        e.stopPropagation();
        this.startInstance(instance.id);
      };
      container.appendChild(startBtn);
    }
  }


  /**
   * Returns the appropriate status icon for an instance state
   * @param {string} status - Instance state (running, stopped, etc.)
   * @returns {string} Unicode emoji icon for the status
   */
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

  /**
   * Generates action buttons for instance list items
   * Shows appropriate buttons based on instance state
   * @param {Object} instance - EC2 instance object
   * @returns {string} HTML string of action buttons
   */
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

  /**
   * Generates detailed action buttons for instance details panel
   * Includes connection options for running instances
   * @param {Object} instance - EC2 instance object
   * @returns {string} HTML string of detailed action buttons
   */
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

  /**
   * Sets up click handlers for instance list items
   * Handles instance selection and details display
   */
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

  /**
   * Displays detailed information for a selected instance
   * Shows comprehensive instance information in the details panel
   * @param {string} instanceId - ID of the instance to show details for
   */
  showInstanceDetails(instanceId) {
    const instance = this.instances.find(inst => inst.id === instanceId);
    if (!instance) {
      console.error('Instance not found:', instanceId);
      return;
    }
    
    const detailsPanel = document.getElementById('instance-details');
    if (!detailsPanel) return;
    
    detailsPanel.innerHTML = '';
    
    const nameTag = instance.tags?.find(tag => tag.Key === 'Name');
    const instanceName = nameTag?.Value || instance.id;
    const launchTime = instance.launchTime ? new Date(instance.launchTime).toLocaleString() : 'N/A';
    const statusIcon = this.getStatusIcon(instance.state);
    
    const header = this.createElement('div', 'instance-details-header');
    header.appendChild(this.createElement('h2', null, instanceName));
    header.appendChild(this.createElement('span', 'instance-id', instance.id));
    detailsPanel.appendChild(header);
    
    const content = this.createElement('div', 'instance-details-content');
    
    // Actions Section
    const actionsSection = this.createElement('div', 'detail-section');
    actionsSection.appendChild(this.createElement('h3', null, 'Actions'));
    const actionButtons = this.createElement('div', 'action-buttons');
    this.appendDetailsActionButtons(actionButtons, instance);
    this.connectionManager.renderPortForwardingActions(actionButtons, instance.id);
    actionsSection.appendChild(actionButtons);
    content.appendChild(actionsSection);
    
    // Status Section
    const statusSection = this.createElement('div', 'detail-section');
    statusSection.appendChild(this.createElement('h3', null, 'Status & Configuration'));
    const statusGrid = this.createElement('div', 'detail-grid');
    
    this.addDetailItem(statusGrid, 'Status:', `${statusIcon} ${instance.state || 'Unknown'}`, `status-${instance.state?.toLowerCase()}`);
    this.addDetailItem(statusGrid, 'Instance Type:', instance.type || 'Unknown');
    this.addDetailItem(statusGrid, 'Platform:', instance.platform || 'linux');
    this.addDetailItem(statusGrid, 'Launch Time:', launchTime);
    
    statusSection.appendChild(statusGrid);
    content.appendChild(statusSection);
    
    // Network Section
    const networkSection = this.createElement('div', 'detail-section');
    networkSection.appendChild(this.createElement('h3', null, 'Network Information'));
    const networkGrid = this.createElement('div', 'detail-grid');
    
    this.addDetailItem(networkGrid, 'Public IP:', instance.publicIp || 'N/A');
    this.addDetailItem(networkGrid, 'Private IP:', instance.privateIp || 'N/A');
    this.addDetailItem(networkGrid, 'Availability Zone:', instance.availabilityZone || 'Unknown');
    this.addDetailItem(networkGrid, 'VPC ID:', instance.vpcId || 'N/A');
    this.addDetailItem(networkGrid, 'Subnet ID:', instance.subnetId || 'N/A');
    
    networkSection.appendChild(networkGrid);
    content.appendChild(networkSection);
    
    // Tags Section
    if (instance.tags && instance.tags.length > 0) {
      const tagsSection = this.createElement('div', 'detail-section');
      tagsSection.appendChild(this.createElement('h3', null, 'Tags'));
      const tagsContainer = this.createElement('div', 'tags-container');
      
      instance.tags.forEach(tag => {
        const tagItem = this.createElement('div', 'tag-item');
        const keySpan = this.createElement('span', 'tag-key', `${tag.Key}:`);
        const valueSpan = this.createElement('span', 'tag-value', tag.Value);
        tagItem.appendChild(keySpan);
        tagItem.appendChild(valueSpan);
        tagsContainer.appendChild(tagItem);
      });
      
      tagsSection.appendChild(tagsContainer);
      content.appendChild(tagsSection);
    }
    
    detailsPanel.appendChild(content);

    this.consoleManager.addConsoleEntry('System', `Displaying details for instance: ${instanceName} (${instanceId})`, 'info');
  }

  addDetailItem(container, label, value, valueClass) {
    const item = this.createElement('div', 'detail-item');
    item.appendChild(this.createElement('span', 'detail-label', label));
    const valSpan = this.createElement('span', `detail-value ${valueClass || ''}`, value);
    item.appendChild(valSpan);
    container.appendChild(item);
  }

  /**
   * Appends detailed action buttons to container
   */
  appendDetailsActionButtons(container, instance) {
    const status = instance.state?.toLowerCase();
    
    if (status === 'running') {
      const stopBtn = this.createElement('button', 'btn-action', '⏹️ Stop');
      stopBtn.onclick = () => this.stopInstance(instance.id);
      container.appendChild(stopBtn);
      
      const rdpBtn = this.createElement('button', 'btn-action btn-connect', '🖥️ Connect via RDP');
      rdpBtn.onclick = () => this.connectionManager.connectViaRDP(instance.id);
      container.appendChild(rdpBtn);
      
      const sshBtn = this.createElement('button', 'btn-action btn-connect', '💻 Connect via SSH');
      sshBtn.onclick = () => this.connectionManager.connectViaSSH(instance.id);
      container.appendChild(sshBtn);
      
      const customBtn = this.createElement('button', 'btn-action btn-connect', '🔧 Connect using Custom ports');
      customBtn.onclick = () => this.connectionManager.connectViaCustom(instance.id);
      container.appendChild(customBtn);
      
    } else if (status === 'stopped') {
      const startBtn = this.createElement('button', 'btn-action', '▶️ Start');
      startBtn.onclick = () => this.startInstance(instance.id);
      container.appendChild(startBtn);
    }
  }



  /**
   * Starts an EC2 instance
   * Handles the start operation and provides user feedback
   * @param {string} instanceId - ID of the instance to start
   */
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

  /**
   * Stops an EC2 instance
   * Handles the stop operation and provides user feedback
   * @param {string} instanceId - ID of the instance to stop
   */
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

  /**
   * Refreshes the details display for a specific instance
   * Updates the instance details panel with current information
   * @param {string} instanceId - ID of the instance to refresh
   */
  refreshInstanceDetails(instanceId) {
    this.showInstanceDetails(instanceId);
  }
} 