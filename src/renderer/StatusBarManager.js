/**
 * Status Bar Manager - Electronic Session Manager
 * 
 * This file manages the real-time status bar at the bottom of the application.
 * It provides visual feedback about the application state, AWS CLI availability,
 * current profile status, active sessions, and last update time.
 * 
 * Key Responsibilities:
 * - Displays AWS CLI availability status
 * - Shows current AWS profile information
 * - Tracks and displays active session count
 * - Provides application status indicators
 * - Updates last operation timestamp
 * - Manages status bar visual states
 * 
 * Architecture Role:
 * - Acts as the real-time status display component
 * - Provides immediate feedback about system state
 * - Coordinates with electronAPI for status information
 * - Manages status bar DOM updates and styling
 * - Offers centralized status management interface
 * 
 * Status Indicators:
 * - AWS CLI: Available, unavailable, checking, error
 * - Profile: Valid, invalid, loading, none
 * - Active Sessions: Count of active port forwarding sessions
 * - App Status: Ready, busy, error states
 * - Last Update: Timestamp of last operation
 * 
 * Visual Features:
 * - Color-coded status indicators
 * - Real-time status updates
 * - Clickable session count for session management
 * - Automatic status refresh intervals
 * 
 * Dependencies:
 * - electronAPI: For AWS CLI status checking
 * - DOM: For status bar element manipulation
 * - CSS: For status indicator styling
 */

export default class StatusBarManager {
  /**
   * Constructor initializes the status bar manager
   * Sets up initial state and begins status bar initialization
   */
  constructor() {
    this.activeSessions = 0;  // Track number of active sessions
    this.initializeStatusBar();
  }

  /**
   * Initializes the status bar with default values and begins status checking
   * Sets up initial status display and starts AWS CLI status verification
   */
  initializeStatusBar() {
    console.log('Initializing status bar');
    
    // Set initial status bar state with default values
    this.updateStatusBar({
      awsCli: 'checking',
      profile: 'none',
      activeSessions: 0,
      appStatus: 'ready',
      lastUpdate: 'Never'
    });
    
    // Begin AWS CLI status checking
    this.checkAWSCLIStatus();
    
    // Set up periodic status bar updates
    this.setupStatusBarUpdates();
  }

  /**
   * Checks AWS CLI availability and updates status bar accordingly
   * Communicates with main process to verify AWS CLI installation
   */
  async checkAWSCLIStatus() {
    try {
      // Set status to checking while verification is in progress
      this.updateStatusBar({ awsCli: 'checking' });
      
      // Check if electronAPI is available for main process communication
      if (window.electronAPI) {
        // Request AWS CLI status from main process
        const result = await window.electronAPI.checkAWSCLI();
        
        // Determine status and display text based on result
        const status = result.available ? 'available' : 'unavailable';
        const text = result.available ? 'Available' : 'Not Found';
        
        // Update status bar with result
        this.updateStatusBar({ 
          awsCli: status,
          awsCliText: text
        });
      } else {
        // Handle case where electronAPI is not available
        this.updateStatusBar({ 
          awsCli: 'unavailable',
          awsCliText: 'API Unavailable'
        });
      }
    } catch (error) {
      // Handle errors during AWS CLI status checking
      console.error('Error checking AWS CLI status:', error);
      this.updateStatusBar({ 
        awsCli: 'error',
        awsCliText: 'Error'
      });
    }
  }

  /**
   * Updates the status bar with new information
   * Manages DOM updates for all status indicators
   * @param {Object} updates - Object containing status updates to apply
   */
  updateStatusBar(updates) {
    // Define status bar element selectors for easy access
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

    // Update AWS CLI status if provided
    if (updates.awsCli && statusElements.awsCli.indicator) {
      statusElements.awsCli.indicator.className = `status-indicator ${updates.awsCli}`;
      if (updates.awsCliText) {
        statusElements.awsCli.text.textContent = updates.awsCliText;
      }
    }

    // Update profile status if provided
    if (updates.profile && statusElements.profile.indicator) {
      statusElements.profile.indicator.className = `status-indicator ${updates.profile}`;
      if (updates.profileText) {
        statusElements.profile.text.textContent = updates.profileText;
      }
    }

    // Update active sessions count if provided
    if (updates.activeSessions !== undefined) {
        this.activeSessions = updates.activeSessions;
        if (statusElements.activeSessions.text) {
            statusElements.activeSessions.text.textContent = this.activeSessions.toString();
        }
    }

    // Update application status if provided
    if (updates.appStatus && statusElements.appStatus.indicator) {
      statusElements.appStatus.indicator.className = `status-indicator ${updates.appStatus}`;
      if (updates.appStatusText) {
        statusElements.appStatus.text.textContent = updates.appStatusText;
      }
    }

    // Update last update timestamp if provided
    if (updates.lastUpdate && statusElements.lastUpdate.text) {
      statusElements.lastUpdate.text.textContent = updates.lastUpdate;
    }
  }

  /**
   * Sets up periodic status bar updates
   * Refreshes status information at regular intervals
   * Currently updates active sessions count every 5 seconds
   */
  setupStatusBarUpdates() {
    // Set up interval for periodic status updates
    setInterval(() => {
      this.updateStatusBar({ activeSessions: this.activeSessions });
    }, 5000);  // Update every 5 seconds
  }
} 