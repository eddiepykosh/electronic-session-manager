# Electronic Session Manager - Project Reference

## Project Overview
**Electronic Session Manager** is an Electron-based desktop application designed to provide a graphical user interface for managing AWS EC2 instances through the AWS CLI Session Manager plugin. The application allows users to describe, start/stop, and establish port forwarding connections to EC2 instances.

## Current Project State

### Project Structure
```
electronic-session-manager/
├── .github/                # GitHub Actions workflows
│   └── workflows/          # CI/CD pipeline definitions
│       └── build.yml       # Build and release workflow
├── forge.config.js          # Electron Forge configuration
├── package.json             # Project dependencies and scripts
├── package-lock.json        # Locked dependency versions
├── README.md               # Project documentation
├── REFERENCE.md            # This reference document
├── .gitignore              # Git ignore patterns
├── docs/                   # Documentation
│   ├── DEVELOPMENT.md      # Development guide (UPDATED)
│   └── CI_CD.md           # CI/CD documentation
├── scripts/                # Build and utility scripts
├── tests/                  # Test files
├── build/                  # Build artifacts
├── dist/                   # Distribution files
├── cli_bins/               # CLI binary files
└── src/                    # Source code
    ├── main/               # Main process files
    │   └── main.js         # Main process entry point with IPC handlers
    ├── renderer/           # Renderer process files
    │   ├── index.html      # Main HTML file with tabbed interface
    │   ├── renderer.js     # Main renderer coordinator
    │   ├── UIManager.js    # UI management and coordination
    │   ├── InstanceManager.js # EC2 instance management
    │   ├── ProfileManager.js # AWS profile management
    │   ├── ConsoleManager.js # Console/log viewer management
    │   ├── ConnectionManager.js # Port forwarding management
    │   ├── SessionManager.js # Session management dialog
    │   ├── StatusBarManager.js # Status bar management
    │   └── DarkModeManager.js # Dark mode toggle functionality
    ├── preload/            # Preload scripts
    │   └── preload.js      # Secure API exposure with contextBridge
    ├── services/           # Business logic services
    │   ├── awsService.js   # Main AWS service coordinator
    │   └── aws/            # AWS-specific services
    │       ├── common.js   # Common AWS utilities and CLI checking
    │       ├── ec2Service.js # EC2 instance operations
    │       ├── profileService.js # Profile management and SSO
    │       └── ssmService.js # Session Manager operations
    ├── utils/              # Utility functions
    │   └── logger.js       # Structured logging utility
    ├── config/             # Configuration management
    │   └── config.js       # App configuration with file persistence
    ├── components/         # UI components
    ├── styles/             # CSS styles
    │   └── main.css        # Main stylesheet with modern UI
    ├── assets/             # Static assets
    └── shared/             # Shared code between processes
```

### Current Dependencies
- **Runtime Dependencies:**
  - `electron-squirrel-startup`: Windows installer integration

- **Development Dependencies:**
  - `@electron-forge/cli`: Electron Forge CLI tools
  - `@electron-forge/maker-deb`: Linux DEB package maker
  - `@electron-forge/maker-rpm`: Linux RPM package maker
  - `@electron-forge/maker-squirrel`: Windows installer maker
  - `@electron-forge/maker-zip`: Cross-platform ZIP maker
  - `@electron-forge/maker-dmg`: macOS DMG maker
  - `@electron-forge/plugin-auto-unpack-natives`: Native module handling
  - `@electron-forge/plugin-fuses`: Electron security features
  - `@electron/fuses`: Fuse configuration utilities
  - `electron`: Electron runtime (v36.5.0)
  - `jest`: Testing framework (v29.7.0)
  - `jest-environment-node`: Node.js test environment (v29.7.0)

### Current Application State
- **Main Process (`src/main/main.js`):** Complete with IPC handlers, service initialization, and log forwarding to renderer. **FULLY COMMENTED** with detailed explanations of all IPC handlers, service initialization, and application lifecycle management.
- **Renderer Process (`src/renderer/index.html`):** Tabbed interface with Instances and Console tabs, refresh instances button, status bar. **FULLY COMMENTED** with comprehensive HTML structure documentation and component explanations.
- **Renderer Process (`src/renderer/renderer.js`):** Main coordinator for all UI manager components with delegation methods. **FULLY COMMENTED** with detailed architecture explanations and manager component integration.
- **UI Manager Components:** Specialized managers for different UI functionality:
  - `UIManager.js`: General UI state and dialog management
  - `InstanceManager.js`: EC2 instance management and display
  - `ProfileManager.js`: AWS profile management and validation
  - `ConsoleManager.js`: Log viewing and console functionality
  - `ConnectionManager.js`: Port forwarding and connection handling
  - `SessionManager.js`: Session management and cleanup
  - `StatusBarManager.js`: Real-time status display
  - `DarkModeManager.js`: Theme switching functionality
- **Preload Script (`src/preload/preload.js`):** Complete API exposure including AWS operations, configuration, and logging. **FULLY COMMENTED** with comprehensive security architecture documentation and API method explanations.
- **Styling (`src/styles/main.css`):** Modern CSS with tabbed interface, console styling, instance list styling, comprehensive instance details panel styling, status bar styling with responsive design, profile selection message styling. **FULLY COMMENTED** with detailed CSS variable documentation and component styling explanations.
- **AWS Services:**
  - `src/services/awsService.js`: Main AWS service coordinator with graceful CLI availability handling. **FULLY COMMENTED** with comprehensive service architecture documentation and method explanations.
  - `src/services/aws/ec2Service.js`: EC2 instance operations
  - `src/services/aws/profileService.js`: Profile management and SSO integration
  - `src/services/aws/ssmService.js`: Session Manager operations
  - `src/services/aws/common.js`: Common AWS utilities and CLI checking
- **Configuration (`src/config/config.js`):** Configuration management with file persistence. **FULLY COMMENTED** with detailed configuration schema documentation and method explanations.
- **Logging (`src/utils/logger.js`):** Structured logging utility with file output support. **FULLY COMMENTED** with comprehensive logging architecture documentation and specialized method explanations.
- **Console Tab:** Real-time log viewer with export functionality
- **Status Bar:** Real-time status tracking for AWS CLI, profiles, active sessions, app status, and last update time
- **Profile Selection:** Manual profile selection required before instance loading - no auto-connection on app startup

### Code Documentation Status
**COMPLETED:** All JavaScript, HTML, and CSS files have been comprehensively commented with:
- Detailed header comments explaining file purpose and architecture role
- Inline comments explaining complex logic and business rules
- JSDoc-style documentation for all methods and functions
- Section headers organizing code by functionality
- Parameter and return value documentation
- Security and architectural considerations documented
- Cross-references to related components and dependencies
- **FULLY COMMENTED FILES:**
  - Main process (`src/main/main.js`)
  - Renderer process (`src/renderer/renderer.js`)
  - HTML interface (`src/renderer/index.html`)
  - Preload script (`src/preload/preload.js`)
  - Main stylesheet (`src/styles/main.css`)
  - AWS service integration (`src/services/awsService.js`)
  - AWS utilities (`src/services/aws/common.js`)
  - EC2 service (`src/services/aws/ec2Service.js`)
  - Profile service (`src/services/aws/profileService.js`)
  - SSM service (`src/services/aws/ssmService.js`)
  - Configuration management (`src/config/config.js`)
  - Logging utility (`src/utils/logger.js`)
  - UI management (`src/renderer/UIManager.js`)
  - Instance management (`src/renderer/InstanceManager.js`)
  - Profile management (`src/renderer/ProfileManager.js`)
  - Console management (`src/renderer/ConsoleManager.js`)
  - Connection management (`src/renderer/ConnectionManager.js`)
  - Session management (`src/renderer/SessionManager.js`)
  - Status bar management (`src/renderer/StatusBarManager.js`)
  - Dark mode management (`src/renderer/DarkModeManager.js`)

### Build Configuration
- **Forge Config:** Configured for multiple platforms (Windows, macOS, Linux)
- **Security Features:** Fuses enabled for enhanced security
- **Packaging:** ASAR packaging enabled for distribution
- **Main Entry:** Updated to point to `src/main/main.js`
- **Executable Name:** Configured as 'electronic-session-manager' to match package.json name field
- **Linux Build Fix:** Added explicit executableName configuration to resolve Linux deb/rpm build issues

## Planned Functionality

### Core Features
1. **EC2 Instance Management**
   - List and describe EC2 instances (Service implemented)
   - Start/stop EC2 instances (Service implemented)
   - View instance details (status, type, region, etc.) (Service implemented)

2. **AWS Session Manager Integration**
   - Connect to EC2 instances via Session Manager (Service implemented)
   - Establish secure shell connections (UI pending)
   - Manage multiple concurrent sessions (UI pending)

3. **Port Forwarding**
   - Configure port forwarding rules (Service implemented)
   - Establish local-to-remote port mappings (Service implemented)
   - Monitor active port forwarding sessions (UI pending)

4. **Console/Logging System**
   - Real-time log viewer with tabbed interface
   - Color-coded log levels (ERROR, WARN, INFO, DEBUG)
   - Log export functionality
   - Console clearing capabilities
   - Main process to renderer log forwarding

### Technical Requirements

#### AWS CLI Integration
- **Prerequisites:** AWS CLI and Session Manager plugin must be installed
- **Authentication:** AWS credentials configuration with profile support
- **Profile Management:** Support for multiple AWS profiles including SSO profiles
- **Profile Selection:** Manual profile selection required - no automatic connection on app startup
- **Commands Integrated:**
  - `aws ec2 describe-instances` - List instances
  - `aws ec2 start-instances` - Start instances
  - `aws ec2 stop-instances` - Stop instances
  - `aws ssm start-session` - Start Session Manager session
  - `aws ssm describe-instance-information` - Get instance info
  - `aws sts get-caller-identity` - Validate profile credentials
  - `aws configure list-profiles` - List available profiles
- **Graceful CLI Handling:** App starts even if AWS CLI is not available
- **Profile Switching:** Seamless switching between different AWS accounts

#### UI/UX Requirements
- **Tabbed Interface:** Instances and Console tabs
- **Instance List View:** Table/grid showing EC2 instances (HTML structure ready)
- **Instance Details Panel:** Detailed information about selected instances (HTML structure ready)
- **Console Tab:** Real-time log viewer with controls
- **Session Management:** Interface for managing active sessions (pending)
- **Port Forwarding Configuration:** Form for setting up port forwarding (pending)
- **Status Indicators:** Visual feedback for instance states and connections (pending)

#### Security Considerations
- **Credential Management:** Secure handling of AWS credentials
- **Session Security:** Proper session isolation and cleanup
- **Network Security:** Secure port forwarding implementation
- **Context Isolation:** Enabled by default
- **Node Integration:** Disabled for security
- **Secure IPC:** All communication through preload script

### Development Roadmap

#### Phase 1: Foundation
- [x] Set up AWS CLI integration
- [x] Create basic UI framework
- [x] Implement instance listing functionality
- [x] Set up proper project structure
- [x] Implement configuration management
- [x] Add logging system
- [x] Create console/log viewer tab

#### Phase 2: Core Features
- [x] Add start/stop instance functionality
- [x] Implement Session Manager connection
- [x] Create console management interface
- [x] Implement EC2 instance loading and display
- [x] Add Refresh Instances button and functionality
- [x] Implement instance list rendering with status indicators
- [x] Add instance action buttons (Start/Stop/Connect)
- [x] Add instance details display
- [x] Implement comprehensive port forwarding system
- [x] Add port forwarding session management
- [x] Implement manual profile selection - no auto-connection on startup

#### Phase 3: Advanced Features
- [x] Add port forwarding capabilities (service level)
- [x] Implement session persistence
- [ ] Add configuration management UI
- [x] Create port forwarding UI
- [x] Fix Custom Portforward dialog visibility issue

#### Phase 4: Polish
- [ ] Error handling and user feedback
- [ ] Performance optimization
- [ ] Documentation and testing
- [ ] Cross-platform testing

### Architecture Notes
- **Main Process:** Handles AWS CLI command execution
- **Renderer Process:** Provides the user interface with tabbed layout
- **Preload Script:** Exposes secure APIs for AWS operations
- **IPC Communication:** Used for main-renderer process communication
- **Service Layer:** AWS operations abstracted into service classes
- **Configuration:** Persistent configuration management
- **Logging:** Structured logging with file output and console display
- **Console System:** Real-time log viewing with export capabilities
- **Session Management:** Port forwarding session tracking and process management

### Recent Fixes
- **Custom Portforward Dialog Issue:** Fixed the custom port forwarding dialog not appearing when clicked. The issue was that the dialog was created with `display: none` by default and the `.active` class was never added to make it visible. Fixed by adding `customPortDialog.classList.add('active')` in the `connectViaCustom` method and updating the close method to properly handle the animation.
- **AWS Region Configuration Issue:** Fixed port forwarding and EC2 operations failing due to missing region specification. Added `getProfileRegion()` function to extract region from AWS profile configuration and updated `buildAWSCommand()` to automatically include region parameter in all AWS CLI commands. This resolves the "You must specify a region" error that was occurring during port forwarding sessions.
- **Session Management Enhancement:** Added clickable status bar for active sessions with comprehensive session management dialog. Users can now click on the "Active Sessions" count in the status bar to view all active port forwarding sessions, see session details (instance ID, ports, start time, duration), and stop sessions directly from the dialog.
- **Session Termination Validation:** Enhanced session termination with comprehensive validation. Added process termination verification, port release checking, timeout handling, and detailed feedback. Users now receive confirmation that sessions are actually terminated and ports are released. Added orphaned session detection and force cleanup capabilities for better session management.
- **Session Manager Bug Fixes:** Fixed session termination errors in the Session Manager dialog. Resolved issues with undefined properties in termination results, session key mismatches between AWS service and ConnectionManager, and UI refresh problems. Added debugging capabilities and refresh button for better session management troubleshooting.
- **Process Management:** Interactive AWS CLI session handling with proper cleanup

### Dependencies to Add (FUTURE)
- **AWS SDK:** For programmatic AWS access (optional alternative to CLI)
- **UI Framework:** Consider adding a UI library (React, Vue, or vanilla)
- **Terminal Integration:** For Session Manager terminal sessions
- **Testing Framework:** Jest or Mocha for unit testing
- **Linting:** ESLint for code quality

## Recent Updates

### GitHub Actions CI/CD Pipeline
- **Workflow File:** `.github/workflows/build.yml` - Automated multi-platform build and release pipeline
- **Triggers:** 
  - Automatic builds on version tag pushes (e.g., `v1.0.0`)
  - Manual workflow dispatch for testing builds
- **Multi-Platform Support:** Windows, macOS, and Linux builds
- **Build Process:**
  - **Windows:** Node.js 18 on Windows latest with Squirrel installer and portable version
  - **macOS:** Node.js 18 on macOS latest with DMG installer
  - **Linux:** Node.js 18 on Ubuntu latest with DEB and RPM packages
  - Dependency installation with npm caching
  - Electron Forge build using `npm run make`
- **Artifacts Generated:**
  - **Windows:** Squirrel installer (.exe), zip package, and portable version
  - **macOS:** DMG installer (.dmg) and zip package
  - **Linux:** DEB package (.deb), RPM package (.rpm), and zip package
- **Portable Version Features (Windows only):**
  - Self-contained application with all dependencies
  - `run.bat` launcher script for easy execution
  - README.md with usage instructions
  - No installation required - extract and run
- **Release Management:**
  - Automatic GitHub releases on tag pushes
  - Artifact uploads with 30-day retention
  - Includes all platform variants and distribution formats
- **Build Outputs:**
  - **Windows:** `out/make/squirrel.windows/x64/*.exe`, `out/make/zip/win32/x64/*.zip`, `electronic-session-manager-portable-windows.zip`
  - **macOS:** `out/make/dmg/x64/*.dmg`, `out/make/zip/darwin/x64/*.zip`
  - **Linux:** `out/make/deb/x64/*.deb`, `out/make/rpm/x64/*.rpm`, `out/make/zip/linux/x64/*.zip`

### Status Bar Feature
- **Status Bar Location:** Added at the bottom of the application with dark theme
- **AWS CLI Status Tracking:** Real-time monitoring of AWS CLI availability with visual indicators
- **Profile Status Display:** Shows current AWS profile and validation status
- **Active Sessions Counter:** Tracks number of active port forwarding sessions in real-time
- **App Status Monitoring:** Shows application state (ready, busy, error) with appropriate indicators
- **Last Update Timestamp:** Displays when instances were last refreshed
- **Responsive Design:** Status bar adapts to different screen sizes and orientations
- **Integration:** Seamlessly integrated with existing profile management and session tracking systems
- **Real-time Updates:** Automatic updates every 5 seconds for session count, event-driven updates for other statuses
- **Error Handling:** Graceful handling of API failures and network connectivity issues

### .gitignore Cleanup
- **Removed Duplicates:** Eliminated all duplicate entries throughout the file
- **Added Missing Patterns:** Added modern Node.js, npm, and Electron-specific patterns
- **Enhanced Organization:** Organized into clear sections (Dependencies, Runtime, Build, OS, IDE, etc.)
- **Electron-Specific:** Added comprehensive Electron Forge build artifact patterns
- **Development Tools:** Added patterns for testing frameworks, linting, and modern development tools
- **Cross-Platform:** Enhanced OS-specific patterns for Windows, macOS, and Linux
- **IDE Support:** Added comprehensive IDE and editor patterns
- **File Size:** Reduced from 208 lines to ~120 lines while improving coverage

### EC2 Instance Loading and Display
- **Refresh Instances Button:** Manual trigger to load/check/list all available EC2 instances
- **Real-time Instance Display:** Shows all EC2 instances with their current status
- **Status Indicators:** Color-coded status badges (Running, Stopped, Pending, etc.)
- **Instance Information:** Displays instance name, type, availability zone, and status
- **Action Buttons:** Context-aware buttons for Start/Stop/Connect based on instance state
- **Interactive UI:** Click to select instances, hover effects, and visual feedback
- **Error Handling:** Graceful handling of AWS CLI errors and network issues
- **Console Integration:** All operations logged to the console tab for debugging

### Instance Details Panel
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

### Port Forwarding System
- **Three Connection Options:**
  - **Connect via RDP:** Forwards remote port 3389 to local port 13389
  - **Connect via SSH:** Forwards remote port 22 to local port 2222
  - **Connect using Custom ports:** User-defined local and remote ports
- **Custom Port Dialog:** Interactive form for specifying custom port mappings
- **Input Validation:** Ensures valid port ranges (local: 1024-65535, remote: 1-65535)
- **Success Popups:** Beautiful popup notifications showing connection details and instructions
- **Connection Instructions:** Clear guidance on how to connect using the forwarded ports
- **Persistent Popups:** Success popups stay open until user clicks OK (no auto-close)
- **Error Handling:** Comprehensive error messages for common issues (SSM agent, permissions, etc.)
- **SSM Agent Validation:** Checks if instance has Session Manager agent before attempting connection
- **Real-time Logging:** All port forwarding operations logged to console tab

### Port Forwarding Session Management
- **Moved Stop Button:** Relocated from popup to instance details panel for better accessibility
- **Session Tracking:** Implemented comprehensive session tracking in both renderer and main processes
- **Dynamic UI Updates:** Instance details automatically refresh to show/hide stop button
- **Process Management:** Proper handling of interactive AWS CLI sessions with graceful termination
- **User Experience:** Persistent popups that stay open until user dismisses them
- **Visual Design:** Red gradient styling for stop button to indicate destructive action
- **Error Handling:** Comprehensive error handling for session management operations
- **Console Integration:** All session operations logged to console tab for debugging

### AWS SSO Profile Support
- **Profile Management:** Complete AWS profile support including SSO profiles
- **Profile Detection:** Automatic detection of available profiles from AWS credentials and config files
- **Profile Validation:** Real-time validation of profile credentials using AWS STS
- **Profile Switching:** Seamless switching between different AWS profiles
- **SSO Integration:** Full support for AWS SSO profiles configured in `~/.aws/config`
- **Profile Status Display:** Visual status indicator showing profile validity and account information
- **Header Integration:** Profile selector integrated into application header for easy access
- **Cross-Platform Support:** Works on Windows, macOS, and Linux with proper path handling
- **Error Handling:** Graceful handling of invalid profiles and authentication failures
- **Console Logging:** All profile operations logged to console for debugging
- **UI Components:**
  - **Profile Dropdown:** Dropdown selector showing all available profiles
  - **Status Indicator:** Color-coded status dot (green=valid, red=invalid, yellow=loading)
  - **Account Display:** Shows account ID for valid profiles
  - **Responsive Design:** Profile selector adapts to different screen sizes
- **Backend Features:**
  - **Profile Discovery:** Reads from `~/.aws/credentials` and `~/.aws/config` files
  - **CLI Integration:** Uses `aws configure list-profiles` for comprehensive profile detection
  - **Command Building:** All AWS CLI commands automatically include profile parameter
  - **Session Persistence:** Profile selection persists across application sessions
  - **Validation System:** Tests profile validity before allowing operations

### Profile Creation and Management
- **Profile Creation UI:** Complete interface for creating new AWS profiles
- **IAM Profile Support:** Create traditional IAM profiles with access keys
- **SSO Profile Support:** Create AWS SSO profiles with portal configuration
- **Profile Validation:** Real-time validation of new profiles during creation
- **Profile Deletion:** Safe deletion of profiles with confirmation dialogs
- **Profile Testing:** Test profile validity directly from the management interface
- **Form Validation:** Comprehensive input validation for all profile fields
- **Error Handling:** Detailed error messages for profile creation failures
- **Security Features:** Secure handling of sensitive credentials
- **UI Components:**
  - **Profile Management Dialog:** Modal dialog for profile operations
  - **Tabbed Forms:** Separate forms for IAM and SSO profile creation
  - **Profile List:** Display of existing profiles with status indicators
  - **Action Buttons:** Test and delete buttons for each profile
  - **Status Badges:** Visual indicators for profile validity (Valid/Invalid/Unknown)
  - **Responsive Design:** Works on all screen sizes
- **Backend Features:**
  - **File Management:** Automatic creation and modification of AWS config files
  - **Profile Validation:** Comprehensive validation of profile credentials
  - **Safe Deletion:** Proper cleanup of profile entries from config files
  - **Directory Creation:** Automatic creation of AWS config directory if needed
  - **Input Sanitization:** Validation of profile names and configuration data
  - **Error Recovery:** Graceful handling of file system errors

### AWS SSO Login Integration
- **SSO Login UI:** Complete interface for performing AWS SSO login
- **Profile Detection:** Automatic detection of SSO profiles vs IAM profiles
- **Login Status Monitoring:** Real-time monitoring of SSO authentication status
- **One-Click Login:** Simple login button for each SSO profile
- **Status Indicators:** Visual indicators showing authentication status
- **Account Information:** Display of AWS account ID for authenticated profiles
- **Session Management:** Proper handling of SSO sessions and authentication
- **Error Handling:** Comprehensive error handling for login failures
- **UI Components:**
  - **SSO Login Section:** Dedicated section in profile management dialog
  - **SSO Profile List:** Display of all SSO profiles with login status
  - **Login/Logout Buttons:** Context-aware buttons based on authentication status
  - **Status Badges:** Color-coded authentication status (Authenticated/Not authenticated)
  - **Loading Indicators:** Visual feedback during login operations
  - **Account Display:** Shows AWS account ID for authenticated profiles
- **Backend Features:**
  - **SSO Profile Detection:** Identifies SSO profiles by checking config file
  - **Login Execution:** Executes `aws sso login` commands for authentication
  - **Status Checking:** Validates authentication using AWS STS
  - **Session Validation:** Real-time checking of SSO session validity
  - **Error Recovery:** Graceful handling of authentication failures
  - **CLI Integration:** Seamless integration with AWS CLI SSO commands

### Console Tab Implementation
- **Improved Readability:** Reduced spacing between log entries for a more compact and readable view
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

### Dark Mode Toggle Feature
- **Toggle Switch Location:** Added to the header next to the profile selector for easy access
- **Visual Design:** Modern toggle switch with moon icon and smooth animations
- **Theme Persistence:** Dark mode preference is saved to localStorage and restored on app restart
- **CSS Variables:** Complete theming system using CSS custom properties for consistent colors
- **Smooth Transitions:** All UI elements transition smoothly between light and dark modes
- **Comprehensive Coverage:** All components, dialogs, and UI elements support dark mode
- **Color Scheme:**
  - **Light Mode:** Clean, modern light theme with subtle shadows and borders
  - **Dark Mode:** Professional dark theme with proper contrast ratios for readability
- **Accessibility:** Ensures proper contrast ratios and readable text in both modes
- **Responsive Design:** Dark mode toggle and styling work on all screen sizes
- **Technical Implementation:**
  - **DarkModeManager Class:** Handles toggle functionality and theme persistence
  - **CSS Variables:** Complete color system with light/dark variants
  - **Local Storage:** Saves user preference across sessions
  - **Smooth Transitions:** 0.3s ease transitions for all color changes
- **UI Components Updated:**
  - **Header:** Gradient background adapts to theme
  - **Sidebar:** Background, borders, and text colors
  - **Content Area:** Background and text colors
  - **Tabs:** Background, borders, and active states
  - **Buttons:** All button variants with proper contrast
  - **Dialogs:** Profile management, port forwarding, and success popups
  - **Status Bar:** Background, borders, and text colors
  - **Console:** Background, text, and log level colors
  - **Instance Details:** All panels, sections, and data displays
  - **Forms:** Input fields, labels, and validation messages
  - **Notifications:** Background, borders, and text colors

## Development Guidelines
- Follow Electron security best practices
- Implement proper error handling for AWS operations
- Ensure cross-platform compatibility
- Maintain clean separation between main and renderer processes
- Use secure IPC communication patterns
- Structured logging for debugging
- Configuration persistence
- Real-time console monitoring

## Current Status
- **Date:** Profile creation and management implementation completed
- **Version:** 1.0.0
- **Status:** Foundation complete with console functionality, AWS SSO profile support, and profile management, ready for advanced features
- **Next Steps:** Implement configuration management UI and advanced session features
- **Recent Fixes:** Import path corrections, AWS CLI handling, console tab implementation, AWS SSO profile integration, profile creation and management

### Status Bar Management
- **Initialization:** Status bar initializes on app startup with default values
- **AWS CLI Check:** Automatically checks AWS CLI availability on startup
- **Profile Integration:** Updates when profiles are switched or validated
- **Session Tracking:** Updates when port forwarding sessions start or stop
- **App State Management:** Updates during loading operations and error states

### Recent Build Pipeline Fixes
- **Linux Build Issue:** Fixed executable name mismatch causing deb/rpm build failures
- **Root Cause:** Product name "Electronic Session Manager" vs executable name "electronic-session-manager"
- **Solution:** Added `executableName: 'electronic-session-manager'` to forge.config.js packagerConfig
- **Additional Config:** Enhanced deb and rpm maker configurations with maintainer and homepage info
- **Expected Result:** Linux builds should now complete successfully for both .deb and .rpm packages

### Release Pipeline Fixes
- **403 Forbidden Error:** Added `permissions: contents: write` to workflow for release creation
- **File Pattern Issues:** Updated artifact upload paths to include more file types and be more flexible
- **Artifact Download:** Added explicit download path configuration and debugging output
- **Release Creation:** Added `fail_on_unmatched_files: false` and `generate_release_notes: true`
- **File Patterns:** Simplified to use wildcard patterns (`artifacts/*-installer/*`) for better compatibility

### Testing Framework Implementation
- **Jest Configuration:** Complete Jest setup with Node.js test environment
- **Test Coverage:** 70% threshold for branches, functions, lines, and statements
- **Mocking Strategy:** Comprehensive mocking of Electron, file system, and child processes
- **Test Structure:**
  - **Unit Tests:** Individual module testing with isolated mocks
  - **Integration Tests:** Multi-service coordination testing
  - **Test Categories:** Logger, configuration, AWS services, and service integration
- **Test Runner:** Custom test runner script with multiple execution options
- **Coverage Reports:** Text, LCOV, and HTML coverage output formats
- **Test Documentation:** Comprehensive README with usage examples and best practices
- **CI/CD Ready:** Designed for continuous integration with fast, deterministic execution
- **Test Files Created:**
  - `jest.config.js`: Jest configuration with coverage and mocking setup
  - `tests/setup.js`: Global test setup with Electron and process mocks
  - `tests/utils/logger.test.js`: Logger utility unit tests
  - `tests/config/config.test.js`: Configuration management unit tests
  - `tests/services/aws/common.test.js`: AWS common utilities unit tests
  - `tests/services/aws/ec2Service.test.js`: EC2 service unit tests
  - `tests/integration/awsService.integration.test.js`: AWS service integration tests
  - `tests/run-tests.js`: Custom test runner with multiple execution modes
  - `tests/README.md`: Comprehensive test suite documentation
- **NPM Scripts Added:**
  - `npm test`: Run all tests
  - `npm run test:watch`: Run tests in watch mode
  - `npm run test:coverage`: Run tests with coverage report
- **Mocking Coverage:**
  - **Electron:** app, BrowserWindow, ipcMain, ipcRenderer, contextBridge
  - **File System:** fs, path modules with file operations
  - **Process:** child_process.exec, child_process.spawn for CLI commands
  - **Console:** console.log, console.error, console.warn for controlled output
- **Test Data:** Comprehensive mock data for EC2 instances, AWS profiles, and configuration
- **Error Testing:** Both success and failure scenarios with proper error handling
- **Async Testing:** Proper async/await usage with promise rejection testing
