# Development Guide

This document provides guidelines and information for developers contributing to the Electronic Session Manager project.

## Project Overview

**Electronic Session Manager** is an Electron-based desktop application designed to provide a graphical user interface for managing AWS EC2 instances through the AWS CLI Session Manager plugin. The application allows users to describe, start/stop, and establish port forwarding connections to EC2 instances.

## Development Environment Setup

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Git
- AWS CLI (for testing)
- AWS Session Manager Plugin (for testing)

### Local Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd electronic-session-manager
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure AWS credentials**
   ```bash
   aws configure
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

## Project Architecture

### Process Model
- **Main Process**: Handles AWS CLI operations, window management, IPC, and service coordination
- **Renderer Process**: Manages the UI and user interactions through specialized manager components
- **Preload Script**: Provides secure APIs for renderer-main communication with context isolation

### Current Directory Structure
```
src/
├── main/           # Main process files
│   └── main.js     # Entry point for main process with IPC handlers
├── renderer/       # Renderer process files
│   ├── index.html  # Main HTML file with tabbed interface
│   ├── renderer.js # Main renderer coordinator
│   ├── UIManager.js # UI management and coordination
│   ├── InstanceManager.js # EC2 instance management
│   ├── ProfileManager.js # AWS profile management
│   ├── ConsoleManager.js # Console/log viewer management
│   ├── ConnectionManager.js # Port forwarding management
│   ├── SessionManager.js # Session management dialog
│   ├── StatusBarManager.js # Status bar management
│   └── DarkModeManager.js # Dark mode toggle functionality
├── preload/        # Preload scripts
│   └── preload.js  # Secure API exposure with contextBridge
├── services/       # Business logic services
│   ├── awsService.js # Main AWS service coordinator
│   └── aws/        # AWS-specific services
│       ├── common.js # Common AWS utilities and CLI checking
│       ├── ec2Service.js # EC2 instance operations
│       ├── profileService.js # Profile management and SSO
│       └── ssmService.js # Session Manager operations
├── utils/          # Utility functions
│   └── logger.js   # Structured logging utility
├── config/         # Configuration management
│   └── config.js   # App configuration with file persistence
├── components/     # UI components (future)
├── styles/         # CSS styles
│   └── main.css    # Main stylesheet with modern UI
├── assets/         # Static assets
└── shared/         # Shared code between processes
```

## Current Dependencies

### Runtime Dependencies
- `electron-squirrel-startup`: Windows installer integration

### Development Dependencies
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

## Current Implementation Status

### ✅ Completed Features

#### Core Infrastructure
- **Main Process**: Complete with IPC handlers, service initialization, and log forwarding
- **Renderer Process**: Tabbed interface with Instances and Console tabs
- **Preload Script**: Secure API exposure with comprehensive AWS operations
- **Configuration Management**: File-based configuration with persistence
- **Logging System**: Structured logging with file output and real-time console
- **Security**: Context isolation, Node integration disabled, secure IPC

#### AWS Integration
- **AWS CLI Integration**: Complete with graceful CLI availability handling
- **EC2 Operations**: Instance listing, starting, stopping
- **Profile Management**: Multiple profile support including SSO
- **Session Manager**: Basic session operations and port forwarding
- **Profile Selection**: Manual profile selection required

#### UI Components
- **Tabbed Interface**: Instances and Console tabs
- **Instance Management**: Instance list with details panel
- **Console Tab**: Real-time log viewer with export functionality
- **Status Bar**: Real-time status tracking for AWS CLI, profiles, sessions
- **Dark Mode**: Theme switching functionality
- **Profile Management**: Profile selection and validation

### 🔄 In Progress Features
- **Port Forwarding UI**: Configuration dialogs and session management
- **Session Management**: Active session tracking and cleanup
- **Connection Management**: RDP, SSH, and custom connection types

### 📋 Planned Features
- **Enhanced Session Management**: Multiple concurrent sessions
- **Advanced Port Forwarding**: Rule management and monitoring
- **Instance Monitoring**: Real-time status updates
- **Profile Auto-Detection**: Automatic profile discovery

## Development Guidelines

### Code Style
- Use ES6+ features
- Follow consistent naming conventions
- Add comprehensive JSDoc comments for all functions
- Keep functions small and focused
- Use manager pattern for UI components

### Security Best Practices
- Never expose Node.js APIs directly to renderer
- Use contextBridge for secure IPC
- Validate all user inputs
- Handle errors gracefully
- Enable Electron security fuses

### AWS Integration
- Use AWS CLI for operations
- Implement proper error handling
- Log all AWS operations
- Support multiple AWS profiles
- Graceful CLI availability handling

### Architecture Patterns
- **Manager Pattern**: UI components organized into specialized managers
- **Service Layer**: Business logic separated into service modules
- **IPC Communication**: All main-renderer communication through preload
- **Configuration Management**: Centralized configuration with file persistence
- **Logging**: Structured logging with multiple output formats

## Building and Packaging

### Development Build
```bash
npm run dev
```

### Production Build
```bash
npm run build
```

### Package for Distribution
```bash
npm run dist
```

### Platform-Specific Builds
The project supports building for multiple platforms:
- **Windows**: Squirrel installer and ZIP
- **macOS**: DMG and ZIP
- **Linux**: DEB, RPM, and ZIP packages

## Debugging

### Main Process Debugging
- Use `console.log` for basic debugging
- Check the main process console output
- Use the logger utility for structured logging
- Monitor IPC communication

### Renderer Process Debugging
- Use browser DevTools (F12)
- Check the renderer console
- Use the preload script for debugging IPC
- Monitor manager component interactions

### AWS Operations Debugging
- Check AWS CLI output
- Verify credentials and permissions
- Test commands manually in terminal
- Monitor profile validation

## Common Issues

### AWS CLI Not Found
- Ensure AWS CLI is installed and in PATH
- Check installation with `aws --version`
- Verify credentials with `aws sts get-caller-identity`
- Application gracefully handles missing CLI

### Permission Errors
- Check AWS IAM permissions
- Verify instance permissions for Session Manager
- Ensure proper VPC and security group configuration
- Validate profile credentials

### Build Issues
- Clear node_modules and reinstall
- Check Electron Forge configuration
- Verify platform-specific requirements
- Ensure proper Node.js version

### Profile Issues
- Verify AWS credentials configuration
- Check profile validity with `aws sts get-caller-identity`
- Ensure SSO profiles are properly configured
- Validate profile permissions

## Testing

### Current Testing Status
- Manual testing of AWS CLI integration
- UI component testing
- Cross-platform compatibility testing
- Security validation

### Testing Requirements
- Unit tests for utilities and services
- Integration tests for AWS operations
- UI component testing
- Cross-platform compatibility testing
- Security testing for IPC communication

## Contributing

### Pull Request Process
1. Create a feature branch
2. Make your changes following the established patterns
3. Add tests if applicable
4. Update documentation
5. Ensure all manager components are properly integrated
6. Submit a pull request

### Commit Messages
- Use conventional commit format
- Be descriptive and clear
- Reference issues when applicable
- Include scope for manager components

### Code Review
- All changes require review
- Address feedback promptly
- Ensure tests pass
- Verify cross-platform compatibility
- Check manager component integration

## Resources

### Documentation
- [Electron Documentation](https://www.electronjs.org/docs)
- [AWS CLI Documentation](https://docs.aws.amazon.com/cli/)
- [AWS Session Manager Documentation](https://docs.aws.amazon.com/systems-manager/latest/userguide/session-manager.html)
- [Electron Forge Documentation](https://www.electronforge.io/)

### Tools
- [Electron Forge](https://www.electronforge.io/)
- [AWS SDK for JavaScript](https://docs.aws.amazon.com/sdk-for-javascript/)
- [Node.js Documentation](https://nodejs.org/docs/)

### Project-Specific
- Check `REFERENCE.md` for detailed project state
- Review manager component documentation
- Examine service layer architecture
- Understand IPC communication patterns

## Support

For development questions:
- Check the documentation
- Review existing issues
- Ask in the project discussions
- Contact the maintainers
- Examine the comprehensive code comments 