export default class StatusBarManager {
  constructor() {
    this.activeSessions = 0;
    this.initializeStatusBar();
  }

  initializeStatusBar() {
    console.log('Initializing status bar');
    
    this.updateStatusBar({
      awsCli: 'checking',
      profile: 'none',
      activeSessions: 0,
      appStatus: 'ready',
      lastUpdate: 'Never'
    });
    
    this.checkAWSCLIStatus();
    this.setupStatusBarUpdates();
  }

  async checkAWSCLIStatus() {
    try {
      this.updateStatusBar({ awsCli: 'checking' });
      
      if (window.electronAPI) {
        const result = await window.electronAPI.checkAWSCLI();
        const status = result.available ? 'available' : 'unavailable';
        const text = result.available ? 'Available' : 'Not Found';
        
        this.updateStatusBar({ 
          awsCli: status,
          awsCliText: text
        });
      } else {
        this.updateStatusBar({ 
          awsCli: 'unavailable',
          awsCliText: 'API Unavailable'
        });
      }
    } catch (error) {
      console.error('Error checking AWS CLI status:', error);
      this.updateStatusBar({ 
        awsCli: 'error',
        awsCliText: 'Error'
      });
    }
  }

  updateStatusBar(updates) {
    const statusElements = {
      awsCli: {
        indicator: document.querySelector('#aws-cli-status .status-indicator'),
        text: document.querySelector('#aws-cli-status .status-text')
      },
      profile: {
        indicator: document.querySelector('#current-profile-status .status-indicator'),
        text: document.querySelector('#current-profile-status .status-text')
      },
      activeSessions: {
        text: document.querySelector('#active-sessions-status .status-text')
      },
      appStatus: {
        indicator: document.querySelector('#app-status .status-indicator'),
        text: document.querySelector('#app-status .status-text')
      },
      lastUpdate: {
        text: document.querySelector('#last-update-time .status-text')
      }
    };

    if (updates.awsCli && statusElements.awsCli.indicator) {
      statusElements.awsCli.indicator.className = `status-indicator ${updates.awsCli}`;
      if (updates.awsCliText) {
        statusElements.awsCli.text.textContent = updates.awsCliText;
      }
    }

    if (updates.profile && statusElements.profile.indicator) {
      statusElements.profile.indicator.className = `status-indicator ${updates.profile}`;
      if (updates.profileText) {
        statusElements.profile.text.textContent = updates.profileText;
      }
    }

    if (updates.activeSessions !== undefined) {
        this.activeSessions = updates.activeSessions;
        if (statusElements.activeSessions.text) {
            statusElements.activeSessions.text.textContent = this.activeSessions.toString();
        }
    }

    if (updates.appStatus && statusElements.appStatus.indicator) {
      statusElements.appStatus.indicator.className = `status-indicator ${updates.appStatus}`;
      if (updates.appStatusText) {
        statusElements.appStatus.text.textContent = updates.appStatusText;
      }
    }

    if (updates.lastUpdate && statusElements.lastUpdate.text) {
      statusElements.lastUpdate.text.textContent = updates.lastUpdate;
    }
  }

  setupStatusBarUpdates() {
    setInterval(() => {
      this.updateStatusBar({ activeSessions: this.activeSessions });
    }, 5000);
  }
} 