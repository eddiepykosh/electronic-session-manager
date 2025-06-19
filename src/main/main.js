const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('node:path');

// Import services
const AWSService = require('../services/awsService');
const Config = require('../config/config');
const logger = require('../utils/logger');

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

let mainWindow;
let awsService;
let config;

const createWindow = () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, '..', 'preload', 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'));

  // Open the DevTools in development
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  // Send initial log message to renderer
  sendLogToRenderer('info', 'Main process initialized');
};

// Function to send log messages to renderer
const sendLogToRenderer = (level, message) => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('log:message', { level, message });
  }
};

// Set up IPC handlers
const setupIPCHandlers = () => {
  // AWS operations
  ipcMain.handle('aws:get-instances', async () => {
    try {
      sendLogToRenderer('info', 'Fetching EC2 instances...');
      const instances = await awsService.getInstances();
      sendLogToRenderer('info', `Found ${instances.length} instances`);
      return instances;
    } catch (error) {
      sendLogToRenderer('error', `Failed to get instances: ${error.message}`);
      throw error;
    }
  });

  ipcMain.handle('aws:start-instance', async (event, instanceId) => {
    try {
      sendLogToRenderer('info', `Starting instance: ${instanceId}`);
      const result = await awsService.startInstance(instanceId);
      sendLogToRenderer('info', `Instance ${instanceId} started successfully`);
      return result;
    } catch (error) {
      sendLogToRenderer('error', `Failed to start instance ${instanceId}: ${error.message}`);
      throw error;
    }
  });

  ipcMain.handle('aws:stop-instance', async (event, instanceId) => {
    try {
      sendLogToRenderer('info', `Stopping instance: ${instanceId}`);
      const result = await awsService.stopInstance(instanceId);
      sendLogToRenderer('info', `Instance ${instanceId} stopped successfully`);
      return result;
    } catch (error) {
      sendLogToRenderer('error', `Failed to stop instance ${instanceId}: ${error.message}`);
      throw error;
    }
  });

  ipcMain.handle('aws:start-session', async (event, instanceId) => {
    try {
      sendLogToRenderer('info', `Starting session for instance: ${instanceId}`);
      const result = await awsService.startSession(instanceId);
      sendLogToRenderer('info', `Session started for instance ${instanceId}`);
      return result;
    } catch (error) {
      sendLogToRenderer('error', `Failed to start session for instance ${instanceId}: ${error.message}`);
      throw error;
    }
  });

  ipcMain.handle('aws:start-port-forwarding', async (event, { instanceId, localPort, remotePort }) => {
    try {
      sendLogToRenderer('info', `Starting port forwarding: ${localPort} -> ${instanceId}:${remotePort}`);
      const result = await awsService.startPortForwarding(instanceId, localPort, remotePort);
      sendLogToRenderer('info', `Port forwarding started: ${localPort} -> ${instanceId}:${remotePort}`);
      return result;
    } catch (error) {
      sendLogToRenderer('error', `Failed to start port forwarding: ${error.message}`);
      throw error;
    }
  });

  ipcMain.handle('aws:stop-port-forwarding', async (event, { instanceId, sessionId }) => {
    try {
      sendLogToRenderer('info', `Stopping port forwarding for instance: ${instanceId}`);
      const result = await awsService.stopPortForwarding(instanceId, sessionId);
      sendLogToRenderer('info', `Port forwarding stopped for instance: ${instanceId}`);
      return result;
    } catch (error) {
      sendLogToRenderer('error', `Failed to stop port forwarding: ${error.message}`);
      throw error;
    }
  });

  // Configuration operations
  ipcMain.handle('config:get', async () => {
    try {
      sendLogToRenderer('debug', 'Loading configuration...');
      const configData = await config.load();
      sendLogToRenderer('debug', 'Configuration loaded successfully');
      return configData;
    } catch (error) {
      sendLogToRenderer('error', `Failed to load configuration: ${error.message}`);
      throw error;
    }
  });

  ipcMain.handle('config:save', async (event, configData) => {
    try {
      sendLogToRenderer('debug', 'Saving configuration...');
      await config.save(configData);
      sendLogToRenderer('info', 'Configuration saved successfully');
      return true;
    } catch (error) {
      sendLogToRenderer('error', `Failed to save configuration: ${error.message}`);
      throw error;
    }
  });

  // Log operations
  ipcMain.handle('log:send', async (event, { level, message }) => {
    sendLogToRenderer(level, message);
    return true;
  });

  // UI operations
  ipcMain.handle('ui:show-error', async (event, message) => {
    sendLogToRenderer('error', message);
    // TODO: Implement actual error display (toast, dialog, etc.)
    return true;
  });

  ipcMain.handle('ui:show-success', async (event, message) => {
    sendLogToRenderer('info', message);
    // TODO: Implement actual success display (toast, dialog, etc.)
    return true;
  });
};

// Initialize services
const initializeServices = async () => {
  try {
    sendLogToRenderer('info', 'Initializing services...');
    
    // Initialize configuration
    config = new Config();
    await config.load();
    sendLogToRenderer('info', 'Configuration service initialized');
    
    // Initialize AWS service (don't fail if AWS CLI is not available)
    try {
      awsService = new AWSService();
      // Check if AWS CLI is available but don't fail if it's not
      const awsCliAvailable = await awsService.checkAWSCLI();
      if (awsCliAvailable) {
        sendLogToRenderer('info', 'AWS service initialized with CLI available');
      } else {
        sendLogToRenderer('warn', 'AWS service initialized but CLI not available - AWS operations will fail');
      }
    } catch (error) {
      sendLogToRenderer('warn', `AWS service initialization warning: ${error.message}`);
      // Still create the service instance for later use
      awsService = new AWSService();
    }
    
    // Set up logger to send messages to renderer
    const originalInfo = logger.info;
    const originalError = logger.error;
    const originalWarn = logger.warn;
    const originalDebug = logger.debug;

    logger.info = (message, data) => {
      originalInfo.call(logger, message, data);
      sendLogToRenderer('info', message);
    };

    logger.error = (message, data) => {
      originalError.call(logger, message, data);
      sendLogToRenderer('error', message);
    };

    logger.warn = (message, data) => {
      originalWarn.call(logger, message, data);
      sendLogToRenderer('warn', message);
    };

    logger.debug = (message, data) => {
      originalDebug.call(logger, message, data);
      sendLogToRenderer('debug', message);
    };
    
    sendLogToRenderer('info', 'All services initialized successfully');
  } catch (error) {
    sendLogToRenderer('error', `Failed to initialize services: ${error.message}`);
    throw error;
  }
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
  try {
    await initializeServices();
    setupIPCHandlers();
    createWindow();
    sendLogToRenderer('info', 'Application ready');

    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  } catch (error) {
    console.error('Failed to initialize application:', error);
    app.quit();
  }
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Clean up on app quit
app.on('before-quit', () => {
  sendLogToRenderer('info', 'Application shutting down...');
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
