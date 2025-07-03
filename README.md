# Electronic Session Manager

A modern Electron-based desktop application for managing AWS EC2 instances through the AWS CLI Session Manager plugin.

## Features

- **EC2 Instance Management**: List, describe, start, and stop EC2 instances
- **AWS Session Manager Integration**: Connect to instances via Session Manager
- **Port Forwarding**: Configure and manage port forwarding sessions
- **Modern UI**: Clean, responsive interface built with modern web technologies
- **Cross-Platform**: Works on Windows, macOS, and Linux

## Prerequisites

- **Node.js** (v22 LTS but probably anything >16 will work)
- **AWS CLI** (v2 or higher)
- **AWS Session Manager Plugin**

### Installing Prerequisites

#### AWS CLI
```bash
# Windows (using MSI installer)
# Download from: https://awscli.amazonaws.com/AWSCLIV2.msi

# macOS
curl "https://awscli.amazonaws.com/AWSCLIV2.pkg" -o "AWSCLIV2.pkg"
sudo installer -pkg AWSCLIV2.pkg -target /

# Linux
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install
```

#### AWS Session Manager Plugin
```bash
# Windows
# Download from: https://s3.amazonaws.com/session-manager-downloads/plugin/latest/windows/SessionManagerPluginSetup.exe

# macOS
curl "https://s3.amazonaws.com/session-manager-downloads/plugin/latest/mac/sessionmanager-bundle.zip" -o "sessionmanager-bundle.zip"
unzip sessionmanager-bundle.zip
sudo ./sessionmanager-bundle/install -i /usr/local/sessionmanagerplugin -b /usr/local/bin/session-manager-plugin

# Linux
curl "https://s3.amazonaws.com/session-manager-downloads/plugin/latest/linux_64bit/session-manager-plugin.rpm" -o "session-manager-plugin.rpm"
sudo yum install -y session-manager-plugin.rpm
```

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd electronic-session-manager
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

## Development

### Running in Development Mode
```bash
npm start
```

### Building for Production
```bash
# Package the application
npm run package

# Create distributable
npm run make
```

### Available Scripts
- `npm start` - Start the application in development mode
- `npm run package` - Package the application
- `npm run make` - Create distributable packages
- `npm run publish` - Publish the application
- `npm run lint` - Run linting (currently not configured)

## Project Structure

```
electronic-session-manager/
├── src/
│   ├── main/           # Main process files
│   ├── renderer/       # Renderer process files
│   ├── preload/        # Preload scripts
│   ├── services/       # Business logic services
│   ├── utils/          # Utility functions
│   ├── config/         # Configuration management
│   ├── components/     # UI components
│   ├── styles/         # CSS styles
│   ├── assets/         # Static assets
│   └── shared/         # Shared code between processes
├── docs/               # Documentation
├── scripts/            # Build and utility scripts
├── tests/              # Test files
├── build/              # Build artifacts
└── dist/               # Distribution files
```

## Configuration

*Most of the config stuff is irrelevant for now*

The application stores configuration in:
- **Windows**: `%APPDATA%\.electronic-session-manager\config.json`
- **macOS/Linux**: `~/.electronic-session-manager/config.json`

### Configuration Options

```json
{
  "aws": {
    "region": "us-east-1",
    "profile": "default"
  },
  "ui": {
    "theme": "light",
    "windowSize": {
      "width": 1200,
      "height": 800
    }
  },
  "sessions": {
    "autoReconnect": false,
    "maxSessions": 5
  },
  "portForwarding": {
    "defaultLocalPort": 8080,
    "defaultRemotePort": 80
  }
}
```

## Usage

1. **Launch the application**
2. **View EC2 instances** in the sidebar
3. **Select an instance** to view details
4. **Start/Stop instances** using the action buttons
5. **Connect via Session Manager** for shell access
6. **Configure port forwarding** for remote service access

## Security

- **Context Isolation**: Enabled by default
- **Node Integration**: Disabled for security
- **Preload Scripts**: Used for secure IPC communication
- **AWS Credentials**: Managed through AWS CLI configuration

## Contributing

1. PLEASE

## License

MIT License - see LICENSE file for details
 