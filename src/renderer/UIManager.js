/**
 * UI Manager - Electronic Session Manager
 * 
 * This file manages general UI interactions and provides utility functions for
 * user interface operations across the application. It handles tab switching,
 * notifications, and dialog management.
 * 
 * Key Responsibilities:
 * - Manages tab switching between Instances and Console views
 * - Provides notification system for user feedback
 * - Handles HTML escaping for security
 * - Manages dialog visibility and animations
 * - Provides connection success notifications with instructions
 * 
 * Architecture Role:
 * - Acts as a utility layer for common UI operations
 * - Provides centralized notification management
 * - Handles DOM manipulation for tab switching
 * - Ensures secure HTML rendering
 * - Coordinates UI state changes
 * 
 * UI Components Managed:
 * - Tab Navigation: Switching between application tabs
 * - Notifications: User feedback and status messages
 * - Dialogs: Modal windows and popups
 * - Connection Feedback: Port forwarding success messages
 * 
 * Security Features:
 * - HTML escaping to prevent XSS attacks
 * - Safe DOM manipulation practices
 * - Controlled notification content rendering
 */

export default class UIManager {
  /**
   * Constructor initializes the UI manager
   * Sets up tab switching functionality on initialization
   */
  constructor() {
    this.setupTabSwitching();
  }

  /**
   * Sets up tab switching functionality
   * Handles the switching between Instances and Console tabs
   * Manages active states and panel visibility
   */
  setupTabSwitching() {
    // Get all tab buttons and panels
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabPanels = document.querySelectorAll('.tab-panel');

    // Add click event listeners to each tab button
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

  /**
   * Escapes HTML content to prevent XSS attacks
   * Converts special characters to HTML entities
   * @param {string} text - Text to escape
   * @returns {string} Escaped HTML string
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Shows a notification message to the user
   * Creates and displays a notification with optional auto-dismiss
   * @param {string} message - Message to display
   * @param {string} type - Notification type (info, success, error)
   * @param {number} duration - Auto-dismiss duration in milliseconds
   */
  showNotification(message, type = 'info', duration = 5000) {
    const container = document.getElementById('notification-container');
    if (!container) return;

    // Create notification element with appropriate styling
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    const header = document.createElement('div');
    header.className = 'notification-header';
    
    const title = document.createElement('span');
    title.className = 'notification-title';
    title.textContent = `${type === 'success' ? '✅' : '❌'} ${type.charAt(0).toUpperCase() + type.slice(1)}`;
    header.appendChild(title);
    
    const closeBtn = document.createElement('button');
    closeBtn.className = 'notification-close-btn';
    closeBtn.innerHTML = '&times;';
    closeBtn.onclick = () => {
        clearTimeout(timer);
        close();
    };
    header.appendChild(closeBtn);
    
    notification.appendChild(header);
    
    const content = document.createElement('div');
    content.className = 'notification-content';
    const p = document.createElement('p');
    p.textContent = message;
    content.appendChild(p);
    
    notification.appendChild(content);

    // Add notification to container
    container.appendChild(notification);

    // Trigger the show animation after a brief delay
    setTimeout(() => notification.classList.add('show'), 10);

    // Define close function for notification removal
    const close = () => {
      notification.classList.remove('show');
      notification.classList.add('hide');
      setTimeout(() => notification.remove(), 500);
    };

    // Set up auto-dismiss timer
    const timer = setTimeout(close, duration);
    
    // Add click handler for manual close button
    notification.querySelector('.notification-close-btn').addEventListener('click', () => {
      clearTimeout(timer);
      close();
    });
  }

  /**
   * Shows an error notification
   * Convenience method for error-type notifications
   * @param {string} message - Error message to display
   */
  showError(message) {
    this.showNotification(message, 'error');
  }

  /**
   * Shows a success notification
   * Convenience method for success-type notifications
   * @param {string} message - Success message to display
   */
  showSuccess(message) {
    this.showNotification(message, 'success');
  }

  /**
   * Shows a specialized connection success notification
   * Displays port forwarding information with connection instructions
   * @param {string} connectionType - Type of connection (RDP, SSH, etc.)
   * @param {string} instanceId - EC2 instance ID
   * @param {number} localPort - Local port number
   * @param {number} remotePort - Remote port number
   */
  showConnectionSuccess(connectionType, instanceId, localPort, remotePort) {
    const container = document.getElementById('notification-container');
    if (!container) return;

    // Generate connection instructions based on connection type
    let connectionInstructions = '';
    if (connectionType === 'RDP') {
      connectionInstructions = `Connect to: <code>localhost:${localPort}</code>`;
    } else if (connectionType === 'SSH') {
      connectionInstructions = `SSH to: <code>localhost -p ${localPort}</code>`;
    } else {
      connectionInstructions = `Connect to: <code>localhost:${localPort}</code>`;
    }

    // Create specialized notification with connection details
    const notification = document.createElement('div');
    notification.className = 'notification success';
    notification.innerHTML = `
      <div class="notification-header">
        <span class="notification-title">✅ Port Forwarding Started</span>
        <button class="notification-close-btn">&times;</button>
      </div>
      <div class="notification-content">
        <p><strong>Instance:</strong> ${instanceId}</p>
        <p><strong>Type:</strong> ${connectionType}</p>
        <p><strong>Mapping:</strong> localhost:${localPort} → remote:${remotePort}</p>
        <p>${connectionInstructions}</p>
      </div>
    `;
    
    // Add notification to container
    container.appendChild(notification);

    // Trigger show animation
    setTimeout(() => notification.classList.add('show'), 10);

    // Define close function
    const close = () => {
      notification.classList.remove('show');
      notification.classList.add('hide');
      setTimeout(() => notification.remove(), 500);
    };

    // Connection success notifications stay until manually closed
    notification.querySelector('.notification-close-btn').addEventListener('click', close);
  }

  /**
   * Legacy method for closing success popups
   * Kept for backward compatibility with existing code
   * The new notification system handles its own closing
   */
  closeSuccessPopup() {
    // This method is no longer needed for the new notification system,
    // but we keep it to prevent errors from old calls if any exist.
    // The new notifications close themselves.
  }

  /**
   * Closes the custom port forwarding dialog
   * Handles the animation and cleanup of the port forwarding dialog
   */
  closeCustomPortDialog() {
    const dialog = document.querySelector('.custom-port-dialog');
    if (dialog) {
      // Remove active class to trigger hide animation
      dialog.classList.remove('active');
      
      // Remove element from DOM after animation completes
      setTimeout(() => {
        dialog.remove();
      }, 300); // Wait for the animation to complete
    }
  }
} 