/**
 * Logging Utility - Electronic Session Manager
 * 
 * This file provides a centralized logging system for the application with support
 * for multiple log levels, file output, and specialized logging methods for
 * different types of operations.
 * 
 * Key Features:
 * - Multiple log levels (ERROR, WARN, INFO, DEBUG)
 * - Configurable log level filtering
 * - File-based logging with JSON format
 * - Console output for immediate feedback
 * - Specialized logging methods for AWS operations
 * - Session and port forwarding event logging
 * - Timestamp-based log entries
 * 
 * Architecture Role:
 * - Provides consistent logging across the application
 * - Enables debugging and troubleshooting
 * - Supports audit trails for AWS operations
 * - Offers structured logging for analysis
 * - Maintains application state visibility
 * 
 * Log Levels:
 * - ERROR: Critical errors that prevent operation
 * - WARN: Warning conditions that may need attention
 * - INFO: General information about application state
 * - DEBUG: Detailed debugging information
 * 
 * Usage:
 * - Import as singleton: const logger = require('./utils/logger')
 * - Use standard methods: logger.info(), logger.error(), etc.
 * - Use specialized methods for domain-specific logging
 * - Configure log level and file output as needed
 */

const path = require('path');
const fs = require('fs').promises;

/**
 * Logger class that provides structured logging capabilities
 * Supports multiple log levels, file output, and specialized logging methods
 */
class Logger {
  /**
   * Constructor initializes the logger with default settings
   * Sets up log levels and initial configuration
   */
  constructor() {
    // Define log levels with numeric values for comparison
    this.logLevels = {
      ERROR: 0,  // Highest priority - critical errors
      WARN: 1,   // Warning conditions
      INFO: 2,   // General information
      DEBUG: 3   // Detailed debugging information
    };
    
    // Set default log level to INFO
    this.currentLevel = this.logLevels.INFO;
    
    // Log file path (null means no file logging)
    this.logFile = null;
  }

  /**
   * Sets the current log level
   * Only messages at or above this level will be logged
   * @param {string} level - Log level name (ERROR, WARN, INFO, DEBUG)
   */
  setLogLevel(level) {
    if (this.logLevels[level] !== undefined) {
      this.currentLevel = this.logLevels[level];
    }
  }

  /**
   * Sets the log file for persistent logging
   * Validates the directory exists before setting the file path
   * @param {string} filePath - Path to the log file
   */
  async setLogFile(filePath) {
    try {
      // Ensure the directory exists
      await fs.access(path.dirname(filePath));
      this.logFile = filePath;
    } catch (error) {
      console.error('Invalid log file path:', error);
    }
  }

  /**
   * Writes a log entry to the configured log file
   * Creates structured JSON log entries with timestamps
   * @param {string} level - Log level
   * @param {string} message - Log message
   * @param {*} data - Additional data to log (optional)
   */
  async writeToFile(level, message, data = null) {
    if (!this.logFile) return;

    // Create timestamp for the log entry
    const timestamp = new Date().toISOString();
    
    // Structure the log entry
    const logEntry = {
      timestamp,
      level,
      message,
      data
    };

    try {
      // Append the log entry to the file with newline
      await fs.appendFile(this.logFile, JSON.stringify(logEntry) + '\n');
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  // ===== STANDARD LOGGING METHODS =====
  
  /**
   * Logs an error message
   * Always logged regardless of current log level
   * @param {string} message - Error message
   * @param {*} data - Additional error data (optional)
   */
  error(message, data = null) {
    if (this.currentLevel >= this.logLevels.ERROR) {
      console.error(`[ERROR] ${message}`, data || '');
      this.writeToFile('ERROR', message, data);
    }
  }

  /**
   * Logs a warning message
   * Logged if current level is WARN or higher
   * @param {string} message - Warning message
   * @param {*} data - Additional warning data (optional)
   */
  warn(message, data = null) {
    if (this.currentLevel >= this.logLevels.WARN) {
      console.warn(`[WARN] ${message}`, data || '');
      this.writeToFile('WARN', message, data);
    }
  }

  /**
   * Logs an info message
   * Logged if current level is INFO or higher
   * @param {string} message - Information message
   * @param {*} data - Additional information data (optional)
   */
  info(message, data = null) {
    if (this.currentLevel >= this.logLevels.INFO) {
      console.info(`[INFO] ${message}`, data || '');
      this.writeToFile('INFO', message, data);
    }
  }

  /**
   * Logs a debug message
   * Logged if current level is DEBUG
   * @param {string} message - Debug message
   * @param {*} data - Additional debug data (optional)
   */
  debug(message, data = null) {
    if (this.currentLevel >= this.logLevels.DEBUG) {
      console.debug(`[DEBUG] ${message}`, data || '');
      this.writeToFile('DEBUG', message, data);
    }
  }

  // ===== SPECIALIZED LOGGING METHODS =====
  // These methods provide structured logging for specific application domains
  
  /**
   * Logs AWS operations with structured data
   * Provides consistent logging format for AWS-related activities
   * @param {string} operation - Name of the AWS operation
   * @param {string} instanceId - EC2 instance ID (optional)
   * @param {boolean} result - Operation success status (optional)
   */
  logAWSOperation(operation, instanceId = null, result = null) {
    this.info(`AWS Operation: ${operation}`, {
      instanceId,
      result: result ? 'success' : 'failed',
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Logs session-related events
   * Tracks session lifecycle events for debugging and auditing
   * @param {string} event - Session event type (start, stop, error, etc.)
   * @param {string} sessionId - Session identifier
   * @param {string} instanceId - EC2 instance ID (optional)
   */
  logSessionEvent(event, sessionId, instanceId = null) {
    this.info(`Session Event: ${event}`, {
      sessionId,
      instanceId,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Logs port forwarding events
   * Tracks port forwarding operations for debugging and monitoring
   * @param {string} event - Port forwarding event type (start, stop, error, etc.)
   * @param {number} localPort - Local port number
   * @param {number} remotePort - Remote port number
   * @param {string} instanceId - EC2 instance ID (optional)
   */
  logPortForwardingEvent(event, localPort, remotePort, instanceId = null) {
    this.info(`Port Forwarding Event: ${event}`, {
      localPort,
      remotePort,
      instanceId,
      timestamp: new Date().toISOString()
    });
  }
}

// ===== SINGLETON INSTANCE =====
// Create a singleton instance to ensure consistent logging across the application
const logger = new Logger();

module.exports = logger; 