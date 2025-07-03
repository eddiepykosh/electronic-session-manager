/**
 * Test Setup Configuration
 * 
 * This file configures the testing environment for the Electronic Session Manager.
 * It sets up global mocks, test utilities, and environment variables needed for testing.
 */

// Mock Electron modules for testing
jest.mock('electron', () => ({
  app: {
    getPath: jest.fn((name) => {
      switch (name) {
        case 'userData':
          return '/tmp/test-user-data';
        case 'temp':
          return '/tmp';
        default:
          return '/tmp';
      }
    }),
    on: jest.fn(),
    whenReady: jest.fn().mockResolvedValue(),
    quit: jest.fn(),
    isPackaged: false
  },
  BrowserWindow: jest.fn().mockImplementation(() => ({
    loadFile: jest.fn(),
    webContents: {
      on: jest.fn(),
      send: jest.fn()
    },
    on: jest.fn(),
    close: jest.fn(),
    destroy: jest.fn(),
    isDestroyed: jest.fn().mockReturnValue(false),
    isVisible: jest.fn().mockReturnValue(true)
  })),
  ipcMain: {
    handle: jest.fn(),
    on: jest.fn(),
    removeAllListeners: jest.fn()
  },
  ipcRenderer: {
    invoke: jest.fn(),
    on: jest.fn(),
    removeAllListeners: jest.fn()
  },
  contextBridge: {
    exposeInMainWorld: jest.fn()
  }
}));

// Mock child_process for testing CLI commands
jest.mock('child_process', () => ({
  exec: jest.fn(),
  spawn: jest.fn(),
  execSync: jest.fn()
}));

// Mock fs module for file operations
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  readFileSync: jest.fn(),
  writeFileSync: jest.fn(),
  mkdirSync: jest.fn(),
  promises: {
    readFile: jest.fn(),
    writeFile: jest.fn(),
    mkdir: jest.fn()
  }
}));

// Mock path module
jest.mock('path', () => ({
  join: jest.fn((...args) => args.join('/')),
  dirname: jest.fn((path) => path.split('/').slice(0, -1).join('/')),
  basename: jest.fn((path) => path.split('/').pop())
}));

// Set up global test utilities
global.console = {
  ...console,
  // Suppress console output during tests unless explicitly needed
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

// Global test timeout
jest.setTimeout(30000);

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});

// Global test environment variables
process.env.NODE_ENV = 'test';
process.env.AWS_PROFILE = 'test-profile'; 