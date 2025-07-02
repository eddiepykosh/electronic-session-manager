export default class UIManager {
  constructor() {
    this.setupTabSwitching();
  }

  setupTabSwitching() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabPanels = document.querySelectorAll('.tab-panel');

    tabButtons.forEach(button => {
      button.addEventListener('click', () => {
        const targetTab = button.getAttribute('data-tab');
        
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabPanels.forEach(panel => panel.classList.remove('active'));
        
        button.classList.add('active');
        document.getElementById(`${targetTab}-tab`).classList.add('active');
      });
    });
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  showNotification(message, type = 'info', duration = 5000) {
    const container = document.getElementById('notification-container');
    if (!container) return;

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-header">
            <span class="notification-title">${type === 'success' ? '✅' : '❌'} ${type.charAt(0).toUpperCase() + type.slice(1)}</span>
            <button class="notification-close-btn">&times;</button>
        </div>
        <div class="notification-content">
            <p>${message}</p>
        </div>
    `;

    container.appendChild(notification);

    // Trigger the show animation
    setTimeout(() => notification.classList.add('show'), 10);

    const close = () => {
      notification.classList.remove('show');
      notification.classList.add('hide');
      setTimeout(() => notification.remove(), 500);
    };

    const timer = setTimeout(close, duration);
    
    notification.querySelector('.notification-close-btn').addEventListener('click', () => {
      clearTimeout(timer);
      close();
    });
  }

  showError(message) {
    this.showNotification(message, 'error');
  }

  showSuccess(message) {
    this.showNotification(message, 'success');
  }

  showConnectionSuccess(connectionType, instanceId, localPort, remotePort) {
    const container = document.getElementById('notification-container');
    if (!container) return;

    let connectionInstructions = '';
    if (connectionType === 'RDP') {
      connectionInstructions = `Connect to: <code>localhost:${localPort}</code>`;
    } else if (connectionType === 'SSH') {
      connectionInstructions = `SSH to: <code>localhost -p ${localPort}</code>`;
    } else {
      connectionInstructions = `Connect to: <code>localhost:${localPort}</code>`;
    }

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
    
    container.appendChild(notification);

    setTimeout(() => notification.classList.add('show'), 10);

    const close = () => {
      notification.classList.remove('show');
      notification.classList.add('hide');
      setTimeout(() => notification.remove(), 500);
    };

    // This type of notification stays until closed
    notification.querySelector('.notification-close-btn').addEventListener('click', close);
  }

  closeSuccessPopup() {
    // This method is no longer needed for the new notification system,
    // but we keep it to prevent errors from old calls if any exist.
    // The new notifications close themselves.
  }

  closeCustomPortDialog() {
    const dialog = document.querySelector('.custom-port-dialog');
    if (dialog) {
      dialog.classList.remove('active');
      setTimeout(() => {
        dialog.remove();
      }, 300); // Wait for the animation to complete
    }
  }
} 