# Electronic Session Manager - Project Reference

## Project Overview
**Electronic Session Manager** is an Electron-based desktop application designed to provide a graphical user interface for managing AWS EC2 instances through the AWS CLI Session Manager plugin. The application will allow users to describe, start/stop, and establish port forwarding connections to EC2 instances.

## Current Project State

### Project Structure
```
electronic-session-manager/
├── forge.config.js          # Electron Forge configuration
├── package.json             # Project dependencies and scripts
├── package-lock.json        # Locked dependency versions
├── README.md               # Project documentation
├── REFERENCE.md            # This reference document
├── .gitignore              # Git ignore patterns (CLEANED UP)
├── docs/                   # Documentation
│   └── DEVELOPMENT.md      # Development guide
├── scripts/                # Build and utility scripts
├── tests/                  # Test files
├── build/                  # Build artifacts
├── dist/                   # Distribution files
└── src/                    # Source code
    ├── main/               # Main process files
    │   └── main.js         # Main process entry point
    ├── renderer/           # Renderer process files
    │   ├── index.html      # Main HTML file with tabbed interface
    │   └── renderer.js     # Renderer process logic with console
    ├── preload/            # Preload scripts
    │   └── preload.js      # Secure API exposure
    ├── services/           # Business logic services
    │   ├── awsService.js   # AWS CLI operations
    │   └── sessionService.js # Session management (future)
    ├── utils/              # Utility functions
    │   └── logger.js       # Logging utility
    ├── config/             # Configuration management
    │   └── config.js       # App configuration
    ├── components/         # UI components (future)
    ├── styles/             # CSS styles
    │   └── main.css        # Main stylesheet with tabbed UI
    ├── assets/             # Static assets
    └── shared/             # Shared code between processes
```

### Current Dependencies
- **Runtime Dependencies:**
  - `electron-squirrel-startup`: Windows installer integration

- **Development Dependencies:**
  - `@electron-forge/cli`: Electron Forge CLI tools
  - `@electron-forge/maker-*`: Platform-specific build tools
  - `@electron-forge/plugin-auto-unpack-natives`: Native module handling
  - `@electron-forge/plugin-fuses`: Electron security features
  - `@electron/fuses`: Fuse configuration utilities
  - `electron`: Electron runtime (v36.5.0)

### Current Application State
- **Main Process (`src/main/main.js`):** Enhanced with IPC handlers, service initialization, and log forwarding to renderer
- **Renderer Process (`src/renderer/index.html`):** Tabbed interface with Instances and Console tabs, **NEW: Refresh Instances button**
- **Renderer Process (`src/renderer/renderer.js`):** **NEW: Complete EC2 instance loading and display functionality, NEW: Instance details panel implementation**
- **Preload Script (`src/preload/preload.js`):** Complete API exposure including log message handling
- **Styling (`src/styles/main.css`):** Modern CSS with tabbed interface, console styling, **NEW: Instance list styling and action buttons, NEW: Comprehensive instance details panel styling**
- **AWS Service (`src/services/awsService.js`):** Complete AWS CLI integration with graceful CLI availability handling
- **Configuration (`src/config/config.js`):** Configuration management with file persistence
- **Logging (`src/utils/logger.js`):** Structured logging utility with file output support
- **Console Tab:** Real-time log viewer with export functionality

### Build Configuration
- **Forge Config:** Configured for multiple platforms (Windows, macOS, Linux)
- **Security Features:** Fuses enabled for enhanced security
- **Packaging:** ASAR packaging enabled for distribution
- **Main Entry:** Updated to point to `src/main/main.js`

## Planned Functionality

### Core Features
1. **EC2 Instance Management**
   - List and describe EC2 instances ✅ (Service implemented)
   - Start/stop EC2 instances ✅ (Service implemented)
   - View instance details (status, type, region, etc.) ✅ (Service implemented)

2. **AWS Session Manager Integration**
   - Connect to EC2 instances via Session Manager ✅ (Service implemented)
   - Establish secure shell connections (UI pending)
   - Manage multiple concurrent sessions (UI pending)

3. **Port Forwarding**
   - Configure port forwarding rules ✅ (Service implemented)
   - Establish local-to-remote port mappings ✅ (Service implemented)
   - Monitor active port forwarding sessions (UI pending)

4. **Console/Logging System** ✅ **NEWLY IMPLEMENTED**
   - Real-time log viewer with tabbed interface ✅
   - Color-coded log levels (ERROR, WARN, INFO, DEBUG) ✅
   - Log export functionality ✅
   - Console clearing capabilities ✅
   - Main process to renderer log forwarding ✅

### Technical Requirements

#### AWS CLI Integration ✅ COMPLETED
- **Prerequisites:** AWS CLI and Session Manager plugin must be installed
- **Authentication:** AWS credentials configuration
- **Commands Integrated:**
  - `aws ec2 describe-instances` - List instances ✅
  - `aws ec2 start-instances` - Start instances ✅
  - `aws ec2 stop-instances` - Stop instances ✅
  - `aws ssm start-session` - Start Session Manager session ✅
  - `aws ssm describe-instance-information` - Get instance info ✅
- **Graceful CLI Handling:** App starts even if AWS CLI is not available ✅

#### UI/UX Requirements
- **Tabbed Interface:** Instances and Console tabs ✅
- **Instance List View:** Table/grid showing EC2 instances (HTML structure ready)
- **Instance Details Panel:** Detailed information about selected instances (HTML structure ready)
- **Console Tab:** Real-time log viewer with controls ✅
- **Session Management:** Interface for managing active sessions (pending)
- **Port Forwarding Configuration:** Form for setting up port forwarding (pending)
- **Status Indicators:** Visual feedback for instance states and connections (pending)

#### Security Considerations ✅ IMPLEMENTED
- **Credential Management:** Secure handling of AWS credentials ✅
- **Session Security:** Proper session isolation and cleanup ✅
- **Network Security:** Secure port forwarding implementation ✅
- **Context Isolation:** Enabled by default ✅
- **Node Integration:** Disabled for security ✅
- **Secure IPC:** All communication through preload script ✅

### Development Roadmap

#### Phase 1: Foundation ✅ COMPLETED
- [x] Set up AWS CLI integration
- [x] Create basic UI framework
- [x] Implement instance listing functionality
- [x] Set up proper project structure
- [x] Implement configuration management
- [x] Add logging system
- [x] Create console/log viewer tab ✅ **NEW**

#### Phase 2: Core Features (IN PROGRESS)
- [x] Add start/stop instance functionality
- [x] Implement Session Manager connection
- [x] Create console management interface ✅ **NEW**
- [x] **NEW: Implement EC2 instance loading and display** ✅ **JUST COMPLETED**
- [x] **NEW: Add Refresh Instances button and functionality** ✅ **JUST COMPLETED**
- [x] **NEW: Implement instance list rendering with status indicators** ✅ **JUST COMPLETED**
- [x] **NEW: Add instance action buttons (Start/Stop/Connect)** ✅ **JUST COMPLETED**
- [x] **NEW: Add instance details display** ✅ **JUST COMPLETED**
- [x] **NEW: Implement comprehensive port forwarding system** ✅ **JUST COMPLETED**
- [x] **NEW: Add port forwarding session management** ✅ **JUST COMPLETED**

#### Phase 3: Advanced Features (PENDING)
- [x] Add port forwarding capabilities (service level) ✅ **JUST COMPLETED**
- [x] Implement session persistence ✅ **JUST COMPLETED**
- [ ] Add configuration management UI
- [x] Create port forwarding UI ✅ **JUST COMPLETED**

#### Phase 4: Polish (PENDING)
- [ ] Error handling and user feedback
- [ ] Performance optimization
- [ ] Documentation and testing
- [ ] Cross-platform testing

### Architecture Notes ✅ IMPLEMENTED
- **Main Process:** Handles AWS CLI command execution ✅
- **Renderer Process:** Provides the user interface with tabbed layout ✅
- **Preload Script:** Exposes secure APIs for AWS operations ✅
- **IPC Communication:** Used for main-renderer process communication ✅
- **Service Layer:** AWS operations abstracted into service classes ✅
- **Configuration:** Persistent configuration management ✅
- **Logging:** Structured logging with file output and console display ✅
- **Console System:** Real-time log viewing with export capabilities ✅
- **Session Management:** Port forwarding session tracking and process management ✅
- **Process Management:** Interactive AWS CLI session handling with proper cleanup ✅

### Dependencies to Add (FUTURE)
- **AWS SDK:** For programmatic AWS access (optional alternative to CLI)
- **UI Framework:** Consider adding a UI library (React, Vue, or vanilla)
- **Terminal Integration:** For Session Manager terminal sessions
- **Testing Framework:** Jest or Mocha for unit testing
- **Linting:** ESLint for code quality

## Recent Updates ✅ **NEW SECTION**

### .gitignore Cleanup ✅ **JUST COMPLETED**
- **Removed Duplicates:** Eliminated all duplicate entries throughout the file
- **Added Missing Patterns:** Added modern Node.js, npm, and Electron-specific patterns
- **Enhanced Organization:** Organized into clear sections (Dependencies, Runtime, Build, OS, IDE, etc.)
- **Electron-Specific:** Added comprehensive Electron Forge build artifact patterns
- **Development Tools:** Added patterns for testing frameworks, linting, and modern development tools
- **Cross-Platform:** Enhanced OS-specific patterns for Windows, macOS, and Linux
- **IDE Support:** Added comprehensive IDE and editor patterns
- **File Size:** Reduced from 208 lines to ~120 lines while improving coverage

### EC2 Instance Loading and Display ✅ **JUST IMPLEMENTED**
- **Refresh Instances Button:** Manual trigger to load/check/list all available EC2 instances
- **Real-time Instance Display:** Shows all EC2 instances with their current status
- **Status Indicators:** Color-coded status badges (Running 🟢, Stopped 🔴, Pending 🟡, etc.)
- **Instance Information:** Displays instance name, type, availability zone, and status
- **Action Buttons:** Context-aware buttons for Start/Stop/Connect based on instance state
- **Interactive UI:** Click to select instances, hover effects, and visual feedback
- **Error Handling:** Graceful handling of AWS CLI errors and network issues
- **Console Integration:** All operations logged to the console tab for debugging

### Instance Details Panel ✅ **NEWLY IMPLEMENTED**
- **Click-to-View Details:** Click on any instance in the sidebar to display comprehensive details on the right
- **Comprehensive Information Display:** Shows all available instance data including:
  - **Status & Configuration:** Instance status, type, platform, and launch time
  - **Network Information:** Public/private IPs, availability zone, VPC, and subnet IDs
  - **Tags Section:** All instance tags displayed in organized format
  - **Action Buttons:** Context-aware actions (Start/Stop/Connect) based on instance state
- **Beautiful UI Design:** Modern card-based layout with organized sections
- **Responsive Design:** Adapts to different screen sizes
- **Visual Status Indicators:** Color-coded status values matching the sidebar
- **Professional Styling:** Clean, organized layout with proper spacing and typography
- **Real-time Updates:** Details panel updates when instances are refreshed

### Port Forwarding System ✅ **NEWLY IMPLEMENTED**
- **Three Connection Options:**
  - **🖥️ Connect via RDP:** Forwards remote port 3389 to local port 13389
  - **💻 Connect via SSH:** Forwards remote port 22 to local port 2222
  - **🔧 Connect using Custom ports:** User-defined local and remote ports
- **Custom Port Dialog:** Interactive form for specifying custom port mappings
- **Input Validation:** Ensures valid port ranges (local: 1024-65535, remote: 1-65535)
- **Success Popups:** Beautiful popup notifications showing connection details and instructions
- **Connection Instructions:** Clear guidance on how to connect using the forwarded ports
- **Persistent Popups:** Success popups stay open until user clicks OK (no auto-close)
- **Error Handling:** Comprehensive error messages for common issues (SSM agent, permissions, etc.)
- **SSM Agent Validation:** Checks if instance has Session Manager agent before attempting connection
- **Real-time Logging:** All port forwarding operations logged to console tab

### Port Forwarding Session Management ✅ **NEWLY IMPLEMENTED**
- **Session Tracking:** Active sessions tracked by instanceId with metadata (sessionId, connectionType, ports)
- **Stop Port Forwarding:** Red "⏹️ Stop Port Forwarding" button in instance details panel
- **Dynamic UI:** Stop button appears/disappears based on active session status
- **Session Termination:** Graceful process termination with SIGTERM/SIGKILL fallback
- **Backend Process Management:** Proper cleanup of AWS CLI port forwarding processes
- **Instance Details Integration:** Stop button integrated into Actions section of instance details
- **Auto-refresh:** Instance details update automatically when sessions start/stop
- **Session Persistence:** Sessions tracked across UI interactions until manually stopped
- **Visual Feedback:** Clear success/error messages for session management operations

### Console Tab Implementation
- **Improved Readability:** Reduced spacing between log entries for a more compact and readable view.
- **Real-time Log Display:** Shows logs from both main and renderer processes
- **Color-coded Log Levels:** ERROR (red), WARN (yellow), INFO (green), DEBUG (blue)
- **Console Controls:** Clear and export functionality
- **Auto-scroll:** Automatically scrolls to latest entries
- **Memory Management:** Limits to 1000 entries to prevent memory issues

### Import Path Fixes
- **Corrected Module Imports:** Fixed relative paths in main process
- **Service Integration:** Proper import of AWS service, config, and logger
- **Error Resolution:** Resolved "Cannot find module" errors

### AWS CLI Handling Improvements
- **Lazy CLI Checking:** Only checks for AWS CLI when operations are needed
- **Graceful Degradation:** Application starts even without AWS CLI
- **Clear Status Messages:** Console shows AWS CLI availability status
- **Error Prevention:** Prevents startup failures due to missing AWS CLI

### Enhanced Error Handling
- **Service Initialization:** Robust error handling during startup
- **Console Logging:** Clear status and error messages
- **IPC Communication:** Proper error forwarding between processes

## Development Guidelines ✅ IMPLEMENTED
- Follow Electron security best practices ✅
- Implement proper error handling for AWS operations ✅
- Ensure cross-platform compatibility ✅
- Maintain clean separation between main and renderer processes ✅
- Use secure IPC communication patterns ✅
- Structured logging for debugging ✅
- Configuration persistence ✅
- Real-time console monitoring ✅ **NEW**

## Current Status
- **Date:** Console tab implementation and bug fixes completed
- **Version:** 1.0.0
- **Status:** Foundation complete with console functionality, ready for UI implementation
- **Next Steps:** Implement instance list rendering and session management UI
- **Recent Fixes:** Import path corrections, AWS CLI handling, console tab implementation

### Port Forwarding Session Management ✅ **JUST COMPLETED**
- **Moved Stop Button:** Relocated from popup to instance details panel for better accessibility
- **Session Tracking:** Implemented comprehensive session tracking in both renderer and main processes
- **Dynamic UI Updates:** Instance details automatically refresh to show/hide stop button
- **Process Management:** Proper handling of interactive AWS CLI sessions with graceful termination
- **User Experience:** Persistent popups that stay open until user dismisses them
- **Visual Design:** Red gradient styling for stop button to indicate destructive action
- **Error Handling:** Comprehensive error handling for session management operations
- **Console Integration:** All session operations logged to console tab for debugging
