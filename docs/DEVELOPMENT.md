# Development Guide

This document provides guidelines and information for developers contributing to the Electronic Session Manager project.

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
- **Main Process**: Handles AWS CLI operations, window management, and IPC
- **Renderer Process**: Manages the UI and user interactions
- **Preload Script**: Provides secure APIs for renderer-main communication

### Directory Structure
```
src/
├── main/           # Main process files
│   └── main.js     # Entry point for main process
├── renderer/       # Renderer process files
│   ├── index.html  # Main HTML file
│   └── renderer.js # Renderer process logic
├── preload/        # Preload scripts
│   └── preload.js  # Secure API exposure
├── services/       # Business logic
│   ├── awsService.js    # AWS operations
│   └── sessionService.js # Session management
├── utils/          # Utility functions
│   └── logger.js   # Logging utility
├── config/         # Configuration
│   └── config.js   # App configuration
├── components/     # UI components (future)
├── styles/         # CSS styles
│   └── main.css    # Main stylesheet
├── assets/         # Static assets
└── shared/         # Shared code
```

## Development Guidelines

### Code Style
- Use ES6+ features
- Follow consistent naming conventions
- Add JSDoc comments for functions
- Keep functions small and focused

### Security Best Practices
- Never expose Node.js APIs directly to renderer
- Use contextBridge for secure IPC
- Validate all user inputs
- Handle errors gracefully

### AWS Integration
- Use AWS CLI for operations
- Implement proper error handling
- Log all AWS operations
- Support multiple AWS profiles

### Testing
- Write unit tests for utilities
- Test AWS service functions
- Validate UI interactions
- Test cross-platform compatibility

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

## Debugging

### Main Process Debugging
- Use `console.log` for basic debugging
- Check the main process console output
- Use the logger utility for structured logging

### Renderer Process Debugging
- Use browser DevTools (F12)
- Check the renderer console
- Use the preload script for debugging IPC

### AWS Operations Debugging
- Check AWS CLI output
- Verify credentials and permissions
- Test commands manually in terminal

## Common Issues

### AWS CLI Not Found
- Ensure AWS CLI is installed and in PATH
- Check installation with `aws --version`
- Verify credentials with `aws sts get-caller-identity`

### Permission Errors
- Check AWS IAM permissions
- Verify instance permissions for Session Manager
- Ensure proper VPC and security group configuration

### Build Issues
- Clear node_modules and reinstall
- Check Electron Forge configuration
- Verify platform-specific requirements

## Contributing

### Pull Request Process
1. Create a feature branch
2. Make your changes
3. Add tests if applicable
4. Update documentation
5. Submit a pull request

### Commit Messages
- Use conventional commit format
- Be descriptive and clear
- Reference issues when applicable

### Code Review
- All changes require review
- Address feedback promptly
- Ensure tests pass
- Verify cross-platform compatibility

## Resources

### Documentation
- [Electron Documentation](https://www.electronjs.org/docs)
- [AWS CLI Documentation](https://docs.aws.amazon.com/cli/)
- [AWS Session Manager Documentation](https://docs.aws.amazon.com/systems-manager/latest/userguide/session-manager.html)

### Tools
- [Electron Forge](https://www.electronforge.io/)
- [AWS SDK for JavaScript](https://docs.aws.amazon.com/sdk-for-javascript/)
- [Node.js Documentation](https://nodejs.org/docs/)

## Support

For development questions:
- Check the documentation
- Review existing issues
- Ask in the project discussions
- Contact the maintainers 