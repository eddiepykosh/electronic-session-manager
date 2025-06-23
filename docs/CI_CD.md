# CI/CD Pipeline Documentation

## Overview

This project uses GitHub Actions to automatically build and release the Electronic Session Manager application for Windows. The pipeline creates both installer and portable versions of the application.

## Workflow File

The CI/CD pipeline is defined in `.github/workflows/build.yml` and provides the following features:

- **Automated builds** on version tag pushes
- **Manual builds** via workflow dispatch
- **Windows installer** creation
- **Portable version** creation
- **Automatic GitHub releases**

## How to Use

### Automatic Releases

1. **Create a version tag:**
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

2. **The workflow will automatically:**
   - Build the application for Windows
   - Create installer and portable versions
   - Upload artifacts to GitHub
   - Create a GitHub release with all files

### Manual Builds

1. **Go to GitHub Actions:**
   - Navigate to your repository on GitHub
   - Click on the "Actions" tab
   - Select the "Build and Release" workflow

2. **Trigger manual build:**
   - Click "Run workflow"
   - Select the branch to build from
   - Click "Run workflow"

## Build Outputs

### Windows Installer
- **Location:** `out/make/squirrel.windows/x64/*.exe`
- **Purpose:** Standard Windows installer for easy installation
- **Features:** Automatic updates, start menu integration, uninstall support

### Windows Portable
- **Location:** `electronic-session-manager-portable-windows.zip`
- **Purpose:** Self-contained application that doesn't require installation
- **Features:**
  - Extract and run from any location
  - Includes `run.bat` launcher script
  - No registry entries or system modifications
  - Perfect for USB drives or restricted environments

### Standard Zip Package
- **Location:** `out/make/zip/win32/x64/*.zip`
- **Purpose:** Standard Electron Forge zip package
- **Features:** Basic zip archive of the application

## Artifacts

All build artifacts are automatically uploaded to GitHub Actions with:
- **30-day retention** period
- **Separate artifact names** for easy identification
- **Automatic release creation** on tag pushes

## Requirements

### For Builds
- **Node.js 18** (automatically installed by workflow)
- **Windows environment** (provided by GitHub Actions)
- **GitHub repository** with proper permissions

### For Releases
- **GitHub token** (automatically provided)
- **Version tags** following semantic versioning (e.g., `v1.0.0`)

## Troubleshooting

### Common Issues

1. **Build fails on dependency installation:**
   - Check that `package.json` is valid
   - Ensure all dependencies are properly specified

2. **Portable version not created:**
   - Verify the build completed successfully
   - Check that the main executable was found in the build output

3. **Release not created:**
   - Ensure the tag follows the `v*` pattern
   - Check that the workflow has proper permissions

### Debugging

The workflow includes debug steps that:
- List all build outputs
- Provide detailed error messages
- Show the location of built applications

## Customization

### Adding More Platforms

To add support for macOS or Linux:

1. **Update forge.config.js** to include additional makers
2. **Modify the workflow** to run on multiple platforms
3. **Add platform-specific build steps**

### Modifying Build Process

1. **Edit `.github/workflows/build.yml** to change build steps
2. **Update forge.config.js** to modify Electron Forge configuration
3. **Test changes** using manual workflow dispatch

## Security Considerations

- **No sensitive data** is included in builds
- **Dependencies** are installed from npm registry
- **Build artifacts** are temporary and automatically cleaned up
- **GitHub token** has minimal required permissions 