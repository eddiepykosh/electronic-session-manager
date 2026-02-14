/**
 * AWS Session Manager Service - Electronic Session Manager
 * 
 * This file provides AWS Session Manager (SSM) services for establishing
 * secure connections to EC2 instances. It handles port forwarding, session
 * management, and process lifecycle management.
 * 
 * Key Responsibilities:
 * - Manages AWS Session Manager connections to EC2 instances
 * - Handles port forwarding setup and teardown
 * - Manages session-manager-plugin process lifecycle
 * - Provides session monitoring and cleanup
 * - Handles orphaned session detection and termination
 * - Manages cross-platform process operations
 * 
 * Architecture Role:
 * - Acts as the AWS Session Manager service layer
 * - Coordinates between application and AWS SSM
 * - Manages process spawning and termination
 * - Provides session lifecycle management
 * - Handles cross-platform compatibility
 * 
 * Session Operations:
 * - Start interactive SSM sessions
 * - Establish port forwarding tunnels
 * - Monitor session status and health
 * - Gracefully terminate sessions
 * - Clean up orphaned processes
 * 
 * Port Forwarding Features:
 * - Local to remote port mapping
 * - Session ID tracking
 * - Process PID monitoring
 * - Port availability verification
 * - Graceful termination handling
 * 
 * Cross-Platform Support:
 * - Windows: PowerShell process management
 * - Unix/Linux: Standard process operations
 * - Platform-specific port verification
 * - Session-manager-plugin detection
 * 
 * Process Management:
 * - Child process spawning and monitoring
 * - Graceful termination with timeouts
 * - Force kill fallback mechanisms
 * - Orphaned process detection
 * - Plugin process tracking (Windows)
 * 
 * Dependencies:
 * - common.js: For AWS CLI utilities and command building
 * - Node.js child_process: For process spawning and management
 * - Node.js os: For platform detection
 * - AWS CLI: For SSM operations
 * - session-manager-plugin: For port forwarding
 */

const { spawn, execSync, execFile } = require('child_process');
const {
  ensureAWSCLI,
  getAWSExecutablePath,
  execAWSCommand,
  getProfileRegion,
} = require('./common');
const os = require('os');
const { promisify } = require('util');

/**
 * Retrieves SSM instance information for a profile
 * Gets list of instances available for Session Manager
 * @param {string} profile - AWS profile name
 * @returns {Promise<Array>} Array of SSM instance information
 */
async function getInstanceInformation(profile) {
  try {
    await ensureAWSCLI();
    const { stdout } = await execAWSCommand(['ssm', 'describe-instance-information', '--output', 'json'], profile);
    const data = JSON.parse(stdout);
    return data.InstanceInformationList || [];
  } catch (error) {
    console.error('Error fetching instance information:', error);
    throw new Error(`Failed to fetch instance information: ${error.message}`);
  }
}

/**
 * Starts an interactive SSM session with an instance
 * @param {string} instanceId - EC2 instance ID
 * @param {string} profile - AWS profile name
 * @returns {Promise<Object>} Session information object
 */
async function startSession(instanceId, profile) {
  try {
    await ensureAWSCLI();
    // This will start an interactive session
    // const command = await buildAWSCommand(`aws ssm start-session --target ${instanceId}`, profile);
    console.log(`Starting session with instance ${instanceId}`);
    
    // For now, we'll just return success - actual session handling will be implemented later
    return {
      success: true,
      instanceId,
      sessionId: `session-${Date.now()}`
    };
  } catch (error) {
    console.error('Error starting session:', error);
    throw new Error(`Failed to start session: ${error.message}`);
  }
}

/**
 * Starts port forwarding from local port to remote port on an EC2 instance
 * @param {string} instanceId - EC2 instance ID
 * @param {number} localPort - Local port number
 * @param {number} remotePort - Remote port number
 * @param {string} profile - AWS profile name
 * @returns {Promise<Object>} Port forwarding session object
 */
async function startPortForwarding(instanceId, localPort, remotePort, profile) {
  try {
    await ensureAWSCLI();
    
    const instanceInfo = await getInstanceInformation(profile);
    const hasSSM = instanceInfo.some(info => info.InstanceId === instanceId);
    
    // Note: We might skip this check if the instance is not in the list but we know it's valid
    // For now, let's trust the check or make it optional
    
    const parameters = `portNumber=${remotePort},localPortNumber=${localPort}`;
    console.log(`Starting port forwarding for ${instanceId} ${localPort}:${remotePort}`);
    
    return new Promise(async (resolve, reject) => {
      const args = [
        'ssm', 'start-session',
        '--target', instanceId,
        '--document-name', 'AWS-StartPortForwardingSession',
        '--parameters', parameters
      ];
      
      // Add region
      const region = await getProfileRegion(profile || 'default');
      args.push('--region', region);
      
      // Add profile if specified and not default
      if (profile && profile !== 'default') {
        args.push('--profile', profile);
      }
      
      const awsPath = await getAWSExecutablePath();
      const child = spawn(awsPath, args, {
        stdio: ['pipe', 'pipe', 'pipe']
      });
      
      let sessionId = null;
      let output = '';
      let pluginPid = null;
      
      // On Windows, try to find the session-manager-plugin child process
      if (os.platform() === 'win32') {
        child.stdout.on('data', () => {
          // After a short delay, try to find the plugin child process
          setTimeout(() => {
            try {
              // Use PowerShell to find the child process
              const psCmd = `powershell -Command "Get-CimInstance Win32_Process | Where-Object { $_.ParentProcessId -eq ${child.pid} -and $_.Name -eq 'session-manager-plugin.exe' } | Select-Object -ExpandProperty ProcessId"`;
              const result = execSync(psCmd).toString();
              const lines = result.split('\n').map(l => l.trim()).filter(Boolean);
              for (const line of lines) {
                if (/^\d+$/.test(line)) {
                  pluginPid = parseInt(line, 10);
                  console.log('Found session-manager-plugin.exe PID:', pluginPid);
                }
              }
            } catch (e) {
              console.warn('Could not find session-manager-plugin child process:', e.message);
            }
          }, 2000); // Wait 2s for child to spawn
        });
      }
      
      child.stdout.on('data', (data) => {
        const outputChunk = data.toString();
        output += outputChunk;
        console.log('Port forwarding output:', outputChunk);
        
        const sessionMatch = outputChunk.match(/Starting session with SessionId:\s*([^\s]+)/);
        if (sessionMatch && !sessionId) {
          sessionId = sessionMatch[1];
          console.log('Found SessionId:', sessionId);
          
          setTimeout(() => {
            resolve({
              process: child,
              sessionId: sessionId,
              instanceId: instanceId,
              localPort: localPort,
              remotePort: remotePort,
              startTime: new Date(),
              pluginPid: pluginPid // Track plugin PID if found
            });
          }, 1000);
        }
      });
      
      child.stderr.on('data', (data) => {
        const errorChunk = data.toString();
        console.error('Port forwarding error:', errorChunk);
        
        if (errorChunk.includes('SessionManagerPlugin is not found')) {
          reject(new Error('Session Manager plugin is not installed. Please install the AWS Session Manager plugin.'));
        } else if (errorChunk.includes('AccessDenied')) {
          reject(new Error('Access denied. Please check your AWS permissions and ensure the instance is running.'));
        } else if (errorChunk.includes('TargetNotConnected')) {
          reject(new Error('Instance is not connected to Session Manager. Please ensure the instance is running and has the SSM agent installed.'));
        }
      });
      
      child.on('error', (error) => {
        console.error('Port forwarding process error:', error);
        reject(new Error(`Port forwarding process error: ${error.message}`));
      });
      
      child.on('close', (code) => {
        console.log(`Port forwarding process closed with code: ${code}`);
        if (code !== 0 && !sessionId) {
          reject(new Error(`Port forwarding process exited with code: ${code}`));
        }
      });
      
      setTimeout(() => {
        if (!sessionId) {
          child.kill();
          reject(new Error('Port forwarding session timed out'));
        }
      }, 30000);
    });
  } catch (error) {
    console.error('Error starting port forwarding:', error);
    throw new Error(`Failed to start port forwarding: ${error.message}`);
  }
}

/**
 * Stops a port forwarding session
 * @param {Object} sessionToStop - Session object to stop
 * @returns {Promise<Object>} Stop operation result
 */
async function stopPortForwarding(sessionToStop) {
  try {
    console.log('Stopping port forwarding for instance:', sessionToStop.instanceId, 'session:', sessionToStop.sessionId);
    
    if (!sessionToStop) {
      throw new Error(`No active port forwarding session found.`);
    }
    
    let processTerminated = false;
    let portReleased = false;
    
    // Step 1: Terminate the process
    if (sessionToStop.process && !sessionToStop.process.killed) {
      console.log('Sending SIGTERM to port forwarding process...');
      sessionToStop.process.kill('SIGTERM');
      
      // Wait for graceful termination
      processTerminated = await waitForProcessTermination(sessionToStop.process, 5000);
      
      if (!processTerminated) {
        console.log('Process did not terminate gracefully, sending SIGKILL...');
        sessionToStop.process.kill('SIGKILL');
        processTerminated = await waitForProcessTermination(sessionToStop.process, 3000);
      }
    } else {
      processTerminated = true; // Process already terminated or doesn't exist
    }
    
    // Step 1b: On Windows, try to kill the session-manager-plugin child if tracked
    if (os.platform() === 'win32') {
      let pluginPidToKill = sessionToStop.pluginPid;
      // If not tracked, try to find it now
      if (!pluginPidToKill && sessionToStop.process && sessionToStop.process.pid) {
        try {
          const psCmd = `powershell -Command "Get-CimInstance Win32_Process | Where-Object { $_.ParentProcessId -eq ${sessionToStop.process.pid} -and $_.Name -eq 'session-manager-plugin.exe' } | Select-Object -ExpandProperty ProcessId"`;
          const result = execSync(psCmd).toString();
          const lines = result.split('\n').map(l => l.trim()).filter(Boolean);
          for (const line of lines) {
            if (/^\d+$/.test(line)) {
              pluginPidToKill = parseInt(line, 10);
              console.log('Dynamically found session-manager-plugin.exe PID at stop time:', pluginPidToKill);
            }
          }
        } catch (e) {
          console.warn('Could not dynamically find session-manager-plugin child process at stop time:', e.message);
        }
      }
      if (pluginPidToKill) {
        try {
          execSync(`taskkill /F /PID ${pluginPidToKill}`);
          console.log('Killed session-manager-plugin.exe with PID', pluginPidToKill);
        } catch (e) {
          console.warn('Failed to kill session-manager-plugin.exe:', e.message);
        }
      }
    }
    
    // Step 2: Verify port is released
    if (sessionToStop.localPort) {
      portReleased = await verifyPortReleased(sessionToStop.localPort);
    } else {
      portReleased = true; // No port to verify
    }
    
    // Step 3: Validate termination
    if (!processTerminated) {
      throw new Error('Failed to terminate port forwarding process');
    }
    
    if (!portReleased) {
      console.warn('Warning: Port may still be in use after process termination');
    }
    
    console.log('Port forwarding session successfully terminated');
    
    return {
      success: true,
      instanceId: sessionToStop.instanceId,
      sessionId: sessionToStop.sessionId,
      message: `Port forwarding stopped for instance ${sessionToStop.instanceId}`,
      stoppedAt: new Date(),
      processTerminated,
      portReleased
    };
    
  } catch (error) {
    console.error('Error stopping port forwarding:', error);
    throw new Error(`Failed to stop port forwarding: ${error.message}`);
  }
}

/**
 * Waits for a process to terminate with timeout
 * @param {ChildProcess} process - Process to monitor
 * @param {number} timeoutMs - Timeout in milliseconds
 * @returns {Promise<boolean>} True if process terminated, false if timeout
 */
function waitForProcessTermination(process, timeoutMs) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    
    const checkTermination = () => {
      if (process.killed) {
        console.log('Process terminated successfully');
        resolve(true);
        return;
      }
      
      if (Date.now() - startTime > timeoutMs) {
        console.log('Process termination timeout');
        resolve(false);
        return;
      }
      
      setTimeout(checkTermination, 100);
    };
    
    checkTermination();
  });
}

/**
 * Verifies that a port is no longer in use
 * @param {number} port - Port number to check
 * @param {number} retries - Number of retry attempts
 * @param {number} delayMs - Delay between retries in milliseconds
 * @returns {Promise<boolean>} True if port is available, false otherwise
 */
async function verifyPortReleased(port, retries = 5, delayMs = 500) {
  try {
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);

    let command;
    if (process.platform === 'win32') {
      command = `netstat -an | findstr :${port}`;
    } else {
      command = `lsof -i :${port}`;
    }

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const { stdout } = await execAsync(command);
        const isPortInUse = stdout.trim().length > 0;
        if (!isPortInUse) {
          console.log(`Port ${port} is available (attempt ${attempt})`);
          return true;
        } else {
          console.log(`Port ${port} is still in use (attempt ${attempt})`);
        }
      } catch (error) {
        // If command fails, it usually means port is not in use
        console.log(`Port ${port} is available (netstat/findstr returned no matches, which is expected if the port is free) (attempt ${attempt})`);
        return true;
      }
      // Wait before next attempt
      if (attempt < retries) {
        await new Promise(res => setTimeout(res, delayMs));
      }
    }
    // After all retries, port is still in use
    return false;
  } catch (error) {
    console.error('Error verifying port release:', error);
    return false;
  }
}

/**
 * Finds orphaned AWS SSM session processes
 * @returns {Promise<Array>} Array of orphaned process information
 */
async function findOrphanedSessions() {
  try {
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);
    
    let command;
    if (process.platform === 'win32') {
      command = 'tasklist /FI "IMAGENAME eq aws.exe" /FO CSV';
    } else {
      command = 'ps aux | grep aws | grep -v grep';
    }
    
    try {
      const { stdout } = await execAsync(command);
      const lines = stdout.trim().split('\n').filter(line => line.trim());
      
      const orphanedProcesses = [];
      for (const line of lines) {
        if (line.includes('ssm') && line.includes('start-session')) {
          orphanedProcesses.push(line);
        }
      }
      
      return orphanedProcesses;
    } catch (error) {
      console.log('No orphaned AWS processes found or unable to check');
      return [];
    }
  } catch (error) {
    console.error('Error finding orphaned sessions:', error);
    return [];
  }
}

/**
 * Force kills all orphaned SSM session processes
 * @returns {Promise<Object>} Result of force kill operation
 */
async function forceKillOrphanedSessions() {
  try {
    const orphanedProcesses = await findOrphanedSessions();
    
    if (orphanedProcesses.length === 0) {
      return { success: true, message: 'No orphaned sessions found' };
    }
    
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);
    
    let command;
    if (process.platform === 'win32') {
      command = 'taskkill /F /IM aws.exe';
    } else {
      command = 'pkill -f "aws.*ssm.*start-session"';
    }
    
    await execAsync(command);
    
    return {
      success: true,
      message: `Force killed ${orphanedProcesses.length} orphaned session(s)`,
      killedCount: orphanedProcesses.length
    };
  } catch (error) {
    console.error('Error force killing orphaned sessions:', error);
    throw new Error(`Failed to force kill orphaned sessions: ${error.message}`);
  }
}

/**
 * Force kills all session-manager-plugin processes
 * @returns {Promise<Object>} Result of force kill operation
 */
async function forceKillAllSessionManagerPlugins() {
  try {
    if (os.platform() === 'win32') {
      execSync('taskkill /F /IM session-manager-plugin.exe');
      return { success: true, message: 'Killed all session-manager-plugin.exe processes' };
    } else {
      execSync('pkill -f session-manager-plugin');
      return { success: true, message: 'Killed all session-manager-plugin processes' };
    }
  } catch (error) {
    return { success: false, message: `Failed to kill all session-manager-plugin processes: ${error.message}` };
  }
}

// Export all SSM service functions
module.exports = {
  getInstanceInformation,
  startSession,
  startPortForwarding,
  stopPortForwarding,
  findOrphanedSessions,
  forceKillOrphanedSessions,
  forceKillAllSessionManagerPlugins,
}; 