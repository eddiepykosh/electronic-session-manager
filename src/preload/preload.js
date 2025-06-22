// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // AWS EC2 operations
  getInstances: () => ipcRenderer.invoke('aws:get-instances'),
  startInstance: (instanceId) => ipcRenderer.invoke('aws:start-instance', instanceId),
  stopInstance: (instanceId) => ipcRenderer.invoke('aws:stop-instance', instanceId),
  
  // AWS Session Manager operations
  startSession: (instanceId) => ipcRenderer.invoke('aws:start-session', instanceId),
  startPortForwarding: (instanceId, localPort, remotePort) => 
    ipcRenderer.invoke('aws:start-port-forwarding', { instanceId, localPort, remotePort }),
  stopPortForwarding: (instanceId, sessionId) => 
    ipcRenderer.invoke('aws:stop-port-forwarding', { instanceId, sessionId }),
  
  // AWS Profile operations
  getAvailableProfiles: () => ipcRenderer.invoke('aws:get-profiles'),
  getCurrentProfileInfo: () => ipcRenderer.invoke('aws:get-current-profile'),
  setCurrentProfile: (profile) => ipcRenderer.invoke('aws:set-profile', profile),
  testProfile: (profile) => ipcRenderer.invoke('aws:test-profile', profile),
  
  // Configuration operations
  getConfig: () => ipcRenderer.invoke('config:get'),
  saveConfig: (config) => ipcRenderer.invoke('config:save', config),
  
  // Utility operations
  showError: (message) => ipcRenderer.invoke('ui:show-error', message),
  showSuccess: (message) => ipcRenderer.invoke('ui:show-success', message),
  
  // Logging operations
  sendLogMessage: (level, message) => ipcRenderer.invoke('log:send', { level, message }),
  
  // Event listeners
  onInstancesUpdated: (callback) => ipcRenderer.on('instances:updated', callback),
  onSessionStarted: (callback) => ipcRenderer.on('session:started', callback),
  onSessionEnded: (callback) => ipcRenderer.on('session:ended', callback),
  onLogMessage: (callback) => ipcRenderer.on('log:message', callback),
  
  // Remove event listeners
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),
});
