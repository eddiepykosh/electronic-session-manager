const path = require('path');
const fs = require('fs').promises;

class Logger {
  constructor() {
    this.logLevels = {
      ERROR: 0,
      WARN: 1,
      INFO: 2,
      DEBUG: 3
    };
    
    this.currentLevel = this.logLevels.INFO;
    this.logFile = null;
  }

  setLogLevel(level) {
    if (this.logLevels[level] !== undefined) {
      this.currentLevel = this.logLevels[level];
    }
  }

  async setLogFile(filePath) {
    try {
      await fs.access(path.dirname(filePath));
      this.logFile = filePath;
    } catch (error) {
      console.error('Invalid log file path:', error);
    }
  }

  async writeToFile(level, message, data = null) {
    if (!this.logFile) return;

    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      data
    };

    try {
      await fs.appendFile(this.logFile, JSON.stringify(logEntry) + '\n');
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  error(message, data = null) {
    if (this.currentLevel >= this.logLevels.ERROR) {
      console.error(`[ERROR] ${message}`, data || '');
      this.writeToFile('ERROR', message, data);
    }
  }

  warn(message, data = null) {
    if (this.currentLevel >= this.logLevels.WARN) {
      console.warn(`[WARN] ${message}`, data || '');
      this.writeToFile('WARN', message, data);
    }
  }

  info(message, data = null) {
    if (this.currentLevel >= this.logLevels.INFO) {
      console.info(`[INFO] ${message}`, data || '');
      this.writeToFile('INFO', message, data);
    }
  }

  debug(message, data = null) {
    if (this.currentLevel >= this.logLevels.DEBUG) {
      console.debug(`[DEBUG] ${message}`, data || '');
      this.writeToFile('DEBUG', message, data);
    }
  }

  // Specialized logging methods
  logAWSOperation(operation, instanceId = null, result = null) {
    this.info(`AWS Operation: ${operation}`, {
      instanceId,
      result: result ? 'success' : 'failed',
      timestamp: new Date().toISOString()
    });
  }

  logSessionEvent(event, sessionId, instanceId = null) {
    this.info(`Session Event: ${event}`, {
      sessionId,
      instanceId,
      timestamp: new Date().toISOString()
    });
  }

  logPortForwardingEvent(event, localPort, remotePort, instanceId = null) {
    this.info(`Port Forwarding Event: ${event}`, {
      localPort,
      remotePort,
      instanceId,
      timestamp: new Date().toISOString()
    });
  }
}

// Create a singleton instance
const logger = new Logger();

module.exports = logger; 