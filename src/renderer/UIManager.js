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

  showError(message) {
    // TODO: Implement a better error display, e.g., a toast notification
    console.error(message);
    alert(`ERROR: ${message}`); // Simple alert for now
  }

  showSuccess(message) {
    // TODO: Implement a better success display, e.g., a toast notification
    console.log(message);
    alert(message); // Simple alert for now
  }

  closeSuccessPopup() {
    const popup = document.querySelector('.success-popup');
    if (popup) {
      popup.remove();
    }
  }

  closeCustomPortDialog() {
    const dialog = document.querySelector('.custom-port-dialog');
    if (dialog) {
      dialog.remove();
    }
  }
} 