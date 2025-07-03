/**
 * Logger Utility Tests
 * 
 * HIGH-LEVEL SUMMARY:
 * This test suite validates the structured logging utility used throughout the Electronic Session Manager.
 * It tests basic logging functionality, log level management, and specialized logging methods
 * for AWS operations, session events, and port forwarding events.
 * 
 * Test coverage includes:
 * - Basic logging methods (info, error, warn, debug)
 * - Log level configuration and filtering
 * - Specialized logging for AWS operations
 * - Specialized logging for session events
 * - Specialized logging for port forwarding events
 * - Console output verification
 * - Log level validation and error handling
 */

const logger = require('../../src/utils/logger');

describe('Logger Utility', () => {
  // Mock console methods to capture and verify log output
  let mockConsoleLog;
  let mockConsoleError;
  let mockConsoleWarn;
  let mockConsoleInfo;
  let mockConsoleDebug;

  // Set up mocks before each test
  beforeEach(() => {
    // Reset mocks to ensure clean state
    jest.clearAllMocks();
    
    // Mock console methods to capture log output without actually printing
    mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();
    mockConsoleError = jest.spyOn(console, 'error').mockImplementation();
    mockConsoleWarn = jest.spyOn(console, 'warn').mockImplementation();
    mockConsoleInfo = jest.spyOn(console, 'info').mockImplementation();
    mockConsoleDebug = jest.spyOn(console, 'debug').mockImplementation();
    
    // Reset logger to default state (INFO level)
    logger.setLogLevel('INFO');
  });

  // Clean up mocks after each test
  afterEach(() => {
    // Restore console methods to their original implementations
    mockConsoleLog.mockRestore();
    mockConsoleError.mockRestore();
    mockConsoleWarn.mockRestore();
    mockConsoleInfo.mockRestore();
    mockConsoleDebug.mockRestore();
  });

  describe('Basic Logging', () => {
    /**
     * Test: Info level logging
     * 
     * Verifies that info messages are logged correctly with proper formatting
     * and that they appear in the console output.
     */
    test('should log info messages', () => {
      logger.info('Test info message');
      
      // Verify that console.info was called with the expected formatted message
      expect(mockConsoleInfo).toHaveBeenCalledWith('[INFO] Test info message', '');
    });

    /**
     * Test: Error level logging
     * 
     * Verifies that error messages are logged correctly with proper formatting
     * and that they appear in the console error output.
     */
    test('should log error messages', () => {
      logger.error('Test error message');
      
      // Verify that console.error was called with the expected formatted message
      expect(mockConsoleError).toHaveBeenCalledWith('[ERROR] Test error message', '');
    });

    /**
     * Test: Warning level logging
     * 
     * Verifies that warning messages are logged correctly with proper formatting
     * and that they appear in the console warning output.
     */
    test('should log warning messages', () => {
      logger.warn('Test warning message');
      
      // Verify that console.warn was called with the expected formatted message
      expect(mockConsoleWarn).toHaveBeenCalledWith('[WARN] Test warning message', '');
    });

    /**
     * Test: Debug level logging when level is set to DEBUG
     * 
     * Verifies that debug messages are logged when the log level is set to DEBUG,
     * ensuring that debug output is properly controlled by log level settings.
     */
    test('should log debug messages when level is set to DEBUG', () => {
      logger.setLogLevel('DEBUG'); // Set log level to DEBUG
      logger.debug('Test debug message');
      
      // Verify that console.debug was called with the expected formatted message
      expect(mockConsoleDebug).toHaveBeenCalledWith('[DEBUG] Test debug message', '');
    });

    /**
     * Test: Debug level logging suppression by default
     * 
     * Verifies that debug messages are not logged when the log level is set to INFO
     * (the default), ensuring that debug output is properly filtered.
     */
    test('should not log debug messages by default', () => {
      // Ensure we're at INFO level (default)
      logger.setLogLevel('INFO');
      logger.debug('Test debug message');
      
      // Verify that console.debug was NOT called
      expect(mockConsoleDebug).not.toHaveBeenCalled();
    });
  });

  describe('Log Level Management', () => {
    /**
     * Test: Setting log level correctly
     * 
     * Verifies that the log level can be changed successfully and that
     * the logger's internal state is updated accordingly.
     */
    test('should set log level correctly', () => {
      logger.setLogLevel('DEBUG');
      
      // Verify that the logger's current level was updated
      expect(logger.currentLevel).toBe(logger.logLevels.DEBUG);
    });

    /**
     * Test: Handling invalid log level gracefully
     * 
     * Verifies that the logger handles invalid log level inputs gracefully
     * by maintaining the current log level instead of crashing.
     */
    test('should handle invalid log level gracefully', () => {
      const originalLevel = logger.currentLevel; // Store current level
      logger.setLogLevel('INVALID_LEVEL'); // Try to set invalid level
      
      // Verify that the level remains unchanged
      expect(logger.currentLevel).toBe(originalLevel);
    });
  });

  describe('Specialized Logging', () => {
    /**
     * Test: AWS operation logging
     * 
     * Verifies that AWS operations are logged with structured data including
     * operation name, instance ID, and result status.
     */
    test('should log AWS operations', () => {
      logger.logAWSOperation('start-instance', 'i-1234567890abcdef0', true);
      
      // Verify that the AWS operation was logged with structured data
      expect(mockConsoleInfo).toHaveBeenCalledWith(
        '[INFO] AWS Operation: start-instance',
        expect.objectContaining({
          instanceId: 'i-1234567890abcdef0',
          result: 'success'
        })
      );
    });

    /**
     * Test: Session event logging
     * 
     * Verifies that session events are logged with structured data including
     * event type, session ID, and instance ID.
     */
    test('should log session events', () => {
      logger.logSessionEvent('start', 'session-123', 'i-1234567890abcdef0');
      
      // Verify that the session event was logged with structured data
      expect(mockConsoleInfo).toHaveBeenCalledWith(
        '[INFO] Session Event: start',
        expect.objectContaining({
          sessionId: 'session-123',
          instanceId: 'i-1234567890abcdef0'
        })
      );
    });

    /**
     * Test: Port forwarding event logging
     * 
     * Verifies that port forwarding events are logged with structured data including
     * event type, local port, remote port, and instance ID.
     */
    test('should log port forwarding events', () => {
      logger.logPortForwardingEvent('start', 8080, 80, 'i-1234567890abcdef0');
      
      // Verify that the port forwarding event was logged with structured data
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