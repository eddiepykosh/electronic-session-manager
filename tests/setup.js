/**
 * Test Setup Configuration
 * 
 * HIGH-LEVEL SUMMARY:
 * This file configures the testing environment for the Electronic Session Manager application.
 * It provides comprehensive mocks for Electron modules, file system operations, and other
 * dependencies to enable isolated unit testing without requiring actual Electron runtime
 * or external system dependencies.
 * 
 * Key responsibilities:
 * - Mock Electron main process modules (app, BrowserWindow, ipcMain)
 * - Mock Electron renderer process modules (ipcRenderer, contextBridge)
 * - Mock Node.js built-in modules (fs, path, child_process)
 * - Configure global test utilities and environment variables
 * - Set up test cleanup and timeout configurations
 */

// Mock Electron modules for testing
// This section provides mock implementations of all Electron modules used in the application
// to avoid requiring the actual Electron runtime during testing
jest.mock('electron', () => ({
  // Mock the main Electron app object with common methods and properties
  app: {
    getPath: jest.fn((name) => {
      // Return predictable test paths for different directory types
      switch (name) {
        case 'userData':
          return '/tmp/test-user-data'; // Test user data directory
        case 'temp':
          return '/tmp'; // Test temp directory
        default:
          return '/tmp'; // Default fallback
      }
    }),
    on: jest.fn(), // Mock event listener registration
    whenReady: jest.fn().mockResolvedValue(), // Mock app ready promise
    quit: jest.fn(), // Mock app quit method
    isPackaged: false // Mock as development mode
  },
  
  // Mock BrowserWindow constructor and instance methods
  BrowserWindow: jest.fn().mockImplementation(() => ({
    loadFile: jest.fn(), // Mock loading HTML files
    webContents: {
      on: jest.fn(), // Mock webContents event listeners
      send: jest.fn() // Mock IPC communication to renderer
    },
    on: jest.fn(), // Mock window event listeners
    close: jest.fn(), // Mock window close method
    destroy: jest.fn(), // Mock window destroy method
    isDestroyed: jest.fn().mockReturnValue(false), // Mock window state check
    isVisible: jest.fn().mockReturnValue(true) // Mock window visibility check
  })),
  
  // Mock IPC main process handlers
  ipcMain: {
    handle: jest.fn(), // Mock IPC handler registration
    on: jest.fn(), // Mock IPC event listeners
    removeAllListeners: jest.fn() // Mock cleanup method
  },
  
  // Mock IPC renderer process methods
  ipcRenderer: {
    invoke: jest.fn(), // Mock IPC invocation to main process
    on: jest.fn(), // Mock IPC event listeners
    removeAllListeners: jest.fn() // Mock cleanup method
  },
  
  // Mock context bridge for secure IPC communication
  contextBridge: {
    exposeInMainWorld: jest.fn() // Mock exposing APIs to renderer
  }
}));

// Mock child_process for testing CLI commands
// This enables testing AWS CLI operations without requiring actual CLI execution
jest.mock('child_process', () => {
  const { promisify } = require('util');
  const execFn = jest.fn();
  const execFileFn = jest.fn();
  // Custom promisify so promisify(execFile) returns { stdout, stderr } like the real execFile
  execFileFn[promisify.custom] = (...args) => {
    return new Promise((resolve, reject) => {
      execFileFn(...args, (err, stdout, stderr) => {
        if (err) {
          err.stdout = stdout;
          err.stderr = stderr;
          reject(err);
        } else {
          resolve({ stdout, stderr });
        }
      });
    });
  };
  return {
    exec: execFn,
    execFile: execFileFn,
    spawn: jest.fn(),
    execSync: jest.fn()
  };
});

// Mock fs module for file operations
// This allows testing file operations without touching the actual filesystem
jest.mock('fs', () => ({
  existsSync: jest.fn(), // Mock synchronous file existence check
  readFileSync: jest.fn(), // Mock synchronous file reading
  writeFileSync: jest.fn(), // Mock synchronous file writing
  mkdirSync: jest.fn(), // Mock synchronous directory creation
  promises: {
    readFile: jest.fn(), // Mock asynchronous file reading
    writeFile: jest.fn(), // Mock asynchronous file writing
    mkdir: jest.fn() // Mock asynchronous directory creation
  }
}));

// Mock path module for cross-platform path operations
// This ensures consistent path handling across different operating systems in tests
jest.mock('path', () => ({
  join: jest.fn((...args) => args.join('/')), // Mock path joining with forward slashes
  dirname: jest.fn((path) => path.split('/').slice(0, -1).join('/')), // Mock directory name extraction
  basename: jest.fn((path) => path.split('/').pop()) // Mock filename extraction
}));

// Set up global test utilities
// Configure console methods to suppress output during tests unless explicitly needed
global.console = {
  ...console,
  // Suppress console output during tests unless explicitly needed
  log: jest.fn(), // Mock console.log to prevent test output noise
  warn: jest.fn(), // Mock console.warn to prevent test output noise
  error: jest.fn() // Mock console.error to prevent test output noise
};

// Global test timeout configuration
// Set a reasonable timeout for all tests to prevent hanging
jest.setTimeout(30000); // 30 seconds timeout for all tests

// Clean up after each test
// This ensures each test starts with a clean slate
afterEach(() => {
  jest.clearAllMocks(); // Clear all mock function calls and implementations
});

// Global test environment variables
// Set up consistent environment for all tests
process.env.NODE_ENV = 'test'; // Indicate test environment
process.env.AWS_PROFILE = 'test-profile'; // Set default AWS profile for testing 