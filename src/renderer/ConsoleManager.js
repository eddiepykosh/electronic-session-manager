/**
 * Console Manager - Electronic Session Manager
 * 
 * This file manages the console/log viewer functionality of the application.
 * It provides real-time log display, console output capture, and log export
 * capabilities for debugging and monitoring application activity.
 * 
 * Key Responsibilities:
 * - Displays real-time log messages from main process
 * - Captures and displays console.log output from renderer process
 * - Provides log export functionality
 * - Manages console clearing and maintenance
 * - Handles log message formatting and display
 * 
 * Architecture Role:
 * - Acts as the log viewer component for the Console tab
 * - Bridges main process logging with renderer display
 * - Provides debugging and monitoring capabilities
 * - Manages log message lifecycle and storage
 * - Coordinates with UIManager for secure HTML rendering
 * 
 * Features:
 * - Real-time log streaming from main process
 * - Console output interception and display
 * - Log level color coding (ERROR, WARN, INFO, DEBUG)
 * - Automatic scrolling to latest entries
 * - Log export to text files
 * - Console clearing functionality
 * - Memory management (limits to 1000 entries)
 * 
 * Dependencies:
 * - UIManager: For HTML escaping and security
 * - electronAPI: For receiving log messages from main process
 * - DOM: For console output display and controls
 */

export default class ConsoleManager {
  /**
   * Constructor initializes the console manager
   * Sets up console functionality and establishes log message handling
   * @param {UIManager} uiManager - Reference to UI manager for HTML escaping
   */
  constructor(uiManager) {
    this.uiManager = uiManager;
    this.initializeConsole();
    this.setupConsoleControls();
  }

  /**
   * Initializes the console with test messages and log message handling
   * Sets up IPC listener for main process log messages and captures console output
   */
  initializeConsole() {
    // Add initial test messages to demonstrate console functionality
    this.addConsoleEntry('System', 'Console initialized. Ready to display logs.', 'info');
    this.addConsoleEntry('Test', 'Testing console functionality...', 'debug');
    this.addConsoleEntry('Test', 'This is a test info message', 'info');
    this.addConsoleEntry('Test', 'This is a test warning message', 'warn');
    this.addConsoleEntry('Test', 'This is a test error message', 'error');
    
    // Set up listener for log messages from main process
    if (window.electronAPI) {
      window.electronAPI.onLogMessage((event, logData) => {
        this.addConsoleEntry(logData.level, logData.message, logData.level);
      });
    }
    
    // Capture console output from renderer process
    this.captureConsoleLogs();
  }

  /**
   * Sets up console control button event listeners
   * Handles clear console and export logs functionality
   */
  setupConsoleControls() {
    // Set up clear console button
    const clearButton = document.getElementById('clear-console');
    if (clearButton) {
      clearButton.addEventListener('click', () => this.clearConsole());
    }

    // Set up export logs button
    const exportButton = document.getElementById('export-logs');
    if (exportButton) {
      exportButton.addEventListener('click', () => this.exportLogs());
    }
  }

  /**
   * Captures console output from the renderer process
   * Intercepts console.log, console.error, etc. and displays them in the console
   * Maintains original console functionality while adding display capability
   */
  captureConsoleLogs() {
    // Store original console methods
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;
    const originalInfo = console.info;
    const originalDebug = console.debug;

    // Override console.log to capture and display
    console.log = (...args) => {
      originalLog.apply(console, args);
      this.addConsoleEntry('INFO', args.join(' '), 'info');
    };

    // Override console.error to capture and display
    console.error = (...args) => {
      originalError.apply(console, args);
      this.addConsoleEntry('ERROR', args.join(' '), 'error');
    };

    // Override console.warn to capture and display
    console.warn = (...args) => {
      originalWarn.apply(console, args);
      this.addConsoleEntry('WARN', args.join(' '), 'warn');
    };

    // Override console.info to capture and display
    console.info = (...args) => {
      originalInfo.apply(console, args);
      this.addConsoleEntry('INFO', args.join(' '), 'info');
    };

    // Override console.debug to capture and display
    console.debug = (...args) => {
      originalDebug.apply(console, args);
      this.addConsoleEntry('DEBUG', args.join(' '), 'debug');
    };
  }

  /**
   * Adds a new console entry to the display
   * Creates formatted log entries with timestamps and proper styling
   * @param {string} level - Log level identifier
   * @param {string} message - Log message content
   * @param {string} logLevel - CSS class for styling (info, warn, error, debug)
   */
  addConsoleEntry(level, message, logLevel = 'info') {
    const consoleOutput = document.getElementById('console-output');
    if (!consoleOutput) return;

    // Create timestamp for the log entry
    const timestamp = new Date().toLocaleTimeString();
    
    // Create the console entry element
    const entry = document.createElement('div');
    entry.className = `console-entry ${logLevel}`;
    
    // Set the HTML content with escaped message for security
    entry.innerHTML = `<span class="timestamp">[${timestamp}] ${level}</span> <span class="message">${this.uiManager.escapeHtml(message)}</span>`;

    // Add entry to console output
    consoleOutput.appendChild(entry);
    
    // Auto-scroll to the bottom to show latest entries
    consoleOutput.scrollTop = consoleOutput.scrollHeight;
    
    // Memory management: limit to 1000 entries to prevent memory issues
    const entries = consoleOutput.querySelectorAll('.console-entry');
    if (entries.length > 1000) {
      entries[0].remove();
    }
  }

  /**
   * Clears all console entries
   * Removes all log entries and adds a confirmation message
   */
  clearConsole() {
    const consoleOutput = document.getElementById('console-output');
    if (consoleOutput) {
      // Clear all console entries
      consoleOutput.innerHTML = '';
      
      // Add confirmation message
      this.addConsoleEntry('System', 'Console cleared.', 'info');
    }
  }

  /**
   * Exports console logs to a text file
   * Creates a downloadable file with all current log entries
   * Includes timestamp and formatted log content
   */
  async exportLogs() {
    try {
      const consoleOutput = document.getElementById('console-output');
      if (!consoleOutput) return;

      // Get all console entries
      const entries = consoleOutput.querySelectorAll('.console-entry');
      
      // Build log content with header information
      let logContent = 'Electronic Session Manager - Console Logs\n';
      logContent += `Exported on: ${new Date().toLocaleString()}\n`;
      logContent += '='.repeat(50) + '\n\n';

      // Add each log entry to the export content
      entries.forEach(entry => {
        const timestamp = entry.querySelector('.timestamp').textContent;
        const message = entry.querySelector('.message').textContent;
        logContent += `${timestamp} ${message}\n`;
      });

      // Create and download the log file
      const blob = new Blob([logContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      // Generate filename with timestamp
      a.download = `electronic-session-manager-logs-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.txt`;
      
      // Trigger download
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      // Clean up the object URL
      URL.revokeObjectURL(url);

      // Add success message to console
      this.addConsoleEntry('System', 'Logs exported successfully.', 'info');
    } catch (error) {
      // Add error message to console if export fails
      this.addConsoleEntry('ERROR', `Failed to export logs: ${error.message}`, 'error');
    }
  }
} 