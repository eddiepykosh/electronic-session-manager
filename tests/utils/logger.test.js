/**
 * Logger Utility Tests
 * 
 * Basic tests for the structured logging utility
 */

const logger = require('../../src/utils/logger');

describe('Logger Utility', () => {
  let mockConsoleLog;
  let mockConsoleError;
  let mockConsoleWarn;
  let mockConsoleInfo;
  let mockConsoleDebug;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock console methods
    mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();
    mockConsoleError = jest.spyOn(console, 'error').mockImplementation();
    mockConsoleWarn = jest.spyOn(console, 'warn').mockImplementation();
    mockConsoleInfo = jest.spyOn(console, 'info').mockImplementation();
    mockConsoleDebug = jest.spyOn(console, 'debug').mockImplementation();
    
    // Reset logger to default state
    logger.setLogLevel('INFO');
  });

  afterEach(() => {
    // Restore console methods
    mockConsoleLog.mockRestore();
    mockConsoleError.mockRestore();
    mockConsoleWarn.mockRestore();
    mockConsoleInfo.mockRestore();
    mockConsoleDebug.mockRestore();
  });

  describe('Basic Logging', () => {
    test('should log info messages', () => {
      logger.info('Test info message');
      expect(mockConsoleInfo).toHaveBeenCalledWith('[INFO] Test info message', '');
    });

    test('should log error messages', () => {
      logger.error('Test error message');
      expect(mockConsoleError).toHaveBeenCalledWith('[ERROR] Test error message', '');
    });

    test('should log warning messages', () => {
      logger.warn('Test warning message');
      expect(mockConsoleWarn).toHaveBeenCalledWith('[WARN] Test warning message', '');
    });

    test('should log debug messages when level is set to DEBUG', () => {
      logger.setLogLevel('DEBUG');
      logger.debug('Test debug message');
      expect(mockConsoleDebug).toHaveBeenCalledWith('[DEBUG] Test debug message', '');
    });

    test('should not log debug messages by default', () => {
      // Ensure we're at INFO level
      logger.setLogLevel('INFO');
      logger.debug('Test debug message');
      expect(mockConsoleDebug).not.toHaveBeenCalled();
    });
  });

  describe('Log Level Management', () => {
    test('should set log level correctly', () => {
      logger.setLogLevel('DEBUG');
      expect(logger.currentLevel).toBe(logger.logLevels.DEBUG);
    });

    test('should handle invalid log level gracefully', () => {
      const originalLevel = logger.currentLevel;
      logger.setLogLevel('INVALID_LEVEL');
      expect(logger.currentLevel).toBe(originalLevel);
    });
  });

  describe('Specialized Logging', () => {
    test('should log AWS operations', () => {
      logger.logAWSOperation('start-instance', 'i-1234567890abcdef0', true);
      expect(mockConsoleInfo).toHaveBeenCalledWith(
        '[INFO] AWS Operation: start-instance',
        expect.objectContaining({
          instanceId: 'i-1234567890abcdef0',
          result: 'success'
        })
      );
    });

    test('should log session events', () => {
      logger.logSessionEvent('start', 'session-123', 'i-1234567890abcdef0');
      expect(mockConsoleInfo).toHaveBeenCalledWith(
        '[INFO] Session Event: start',
        expect.objectContaining({
          sessionId: 'session-123',
          instanceId: 'i-1234567890abcdef0'
        })
      );
    });

    test('should log port forwarding events', () => {
      logger.logPortForwardingEvent('start', 8080, 80, 'i-1234567890abcdef0');
      expect(mockConsoleInfo).toHaveBeenCalledWith(
        '[INFO] Port Forwarding Event: start',
        expect.objectContaining({
          localPort: 8080,
          remotePort: 80,
          instanceId: 'i-1234567890abcdef0'
        })
      );
    });
  });
}); 