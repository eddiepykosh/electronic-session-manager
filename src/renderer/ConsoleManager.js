export default class ConsoleManager {
  constructor(uiManager) {
    this.uiManager = uiManager;
    this.initializeConsole();
    this.setupConsoleControls();
  }

  initializeConsole() {
    this.addConsoleEntry('System', 'Console initialized. Ready to display logs.', 'info');
    this.addConsoleEntry('Test', 'Testing console functionality...', 'debug');
    this.addConsoleEntry('Test', 'This is a test info message', 'info');
    this.addConsoleEntry('Test', 'This is a test warning message', 'warn');
    this.addConsoleEntry('Test', 'This is a test error message', 'error');
    
    if (window.electronAPI) {
      window.electronAPI.onLogMessage((event, logData) => {
        this.addConsoleEntry(logData.level, logData.message, logData.level);
      });
    }
    
    this.captureConsoleLogs();
  }

  setupConsoleControls() {
    const clearButton = document.getElementById('clear-console');
    if (clearButton) {
      clearButton.addEventListener('click', () => this.clearConsole());
    }

    const exportButton = document.getElementById('export-logs');
    if (exportButton) {
      exportButton.addEventListener('click', () => this.exportLogs());
    }
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
    
    entry.innerHTML = `<span class="timestamp">[${timestamp}] ${level}</span> <span class="message">${this.uiManager.escapeHtml(message)}</span>`;

    consoleOutput.appendChild(entry);
    
    consoleOutput.scrollTop = consoleOutput.scrollHeight;
    
    const entries = consoleOutput.querySelectorAll('.console-entry');
    if (entries.length > 1000) {
      entries[0].remove();
    }
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
} 