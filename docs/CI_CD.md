# CI/CD Pipeline Documentation

## Overview

This project uses GitHub Actions to automatically build and release the Electronic Session Manager application for Windows, macOS, and Linux. The pipeline creates installers for all platforms and a portable version for Windows.

## Workflow File

The CI/CD pipeline is defined in `.github/workflows/build.yml` and provides the following features:

- **Automated builds** on version tag pushes
- **Manual builds** via workflow dispatch
- **Multi-platform support** (Windows, macOS, Linux)
- **Windows installer and portable** creation
- **macOS installer** creation
- **Linux installer** creation
- **Automatic GitHub releases**

## How to Use

### Automatic Releases

1. **Create a version tag:**
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

2. **The workflow will automatically:**
   - Build the application for Windows, macOS, and Linux
   - Create installers for all platforms
   - Create a portable version for Windows
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

### Windows
- **Installer:** `out/make/squirrel.windows/x64/*.exe` - Standard Windows installer
- **Zip Package:** `out/make/zip/win32/x64/*.zip` - Standard zip archive
- **Portable:** `electronic-session-manager-portable-windows.zip` - Self-contained portable version

### macOS
- **DMG Installer:** `out/make/dmg/x64/*.dmg` - Standard macOS disk image
- **Zip Package:** `out/make/zip/darwin/x64/*.zip` - Standard zip archive

### Linux
- **DEB Package:** `out/make/deb/x64/*.deb` - Debian/Ubuntu package
- **RPM Package:** `out/make/rpm/x64/*.rpm` - Red Hat/Fedora package
- **AppImage:** `out/make/appimage/x64/*.AppImage` - Universal Linux package
- **Zip Package:** `out/make/zip/linux/x64/*.zip` - Standard zip archive

## Platform-Specific Features

### Windows Portable Version
- **Self-contained application** with `run.bat` launcher
- **No installation required** - extract and run
- **Perfect for USB drives** or restricted environments
- **Includes README** with usage instructions

### macOS DMG
- **Standard macOS installer** format
- **Drag-and-drop installation** to Applications folder
- **Code signing ready** (requires Apple Developer account)

### Linux Packages
- **DEB/RPM packages** for package manager installation
- **AppImage** for universal Linux compatibility
- **Zip archive** for manual installation

## Artifacts

All build artifacts are automatically uploaded to GitHub Actions with:
- **30-day retention** period
- **Separate artifact names** for each platform
- **Automatic release creation** on tag pushes

## Requirements

### For Builds
- **Node.js 18** (automatically installed by workflow)
- **Windows environment** (provided by GitHub Actions)
- **macOS environment** (provided by GitHub Actions)
- **Ubuntu environment** (provided by GitHub Actions)
- **GitHub repository** with proper permissions

### For Releases
- **GitHub token** (automatically provided)
- **Version tags** following semantic versioning (e.g., `v1.0.0`)

## Build Process

### Parallel Builds
The workflow runs three parallel jobs:
1. **build-windows** - Creates Windows installer and portable version
2. **build-macos** - Creates macOS DMG and zip packages
3. **build-linux** - Creates Linux DEB, RPM, AppImage, and zip packages

### Release Creation
After all builds complete successfully:
- **create-release** job downloads all artifacts
- **Creates GitHub release** with all platform-specific installers
- **Includes all distribution formats** for maximum compatibility

## Troubleshooting

### Common Issues

1. **Build fails on dependency installation:**
   - Check that `package.json` is valid
   - Ensure all dependencies are properly specified

2. **Portable version not created (Windows only):**
   - Verify the build completed successfully
   - Check that the main executable was found in the build output

3. **Release not created:**
   - Ensure the tag follows the `v*` pattern
   - Check that the workflow has proper permissions
   - Verify all build jobs completed successfully

4. **Platform-specific build failures:**
   - Check platform-specific dependencies
   - Verify Electron Forge makers are properly configured

### Debugging

The workflow includes debug steps that:
- List all build outputs for each platform
- Provide detailed error messages
- Show the location of built applications

## Customization

### Adding More Platforms

The current setup supports:
- **Windows:** Squirrel installer, zip package, portable version
- **macOS:** DMG installer, zip package
- **Linux:** DEB, RPM, AppImage, zip packages

### Modifying Build Process

1. **Edit `.github/workflows/build.yml`** to change build steps
2. **Update forge.config.js** to modify Electron Forge configuration
3. **Test changes** using manual workflow dispatch

## Security Considerations

- **No sensitive data** is included in builds
- **Dependencies** are installed from npm registry
- **Build artifacts** are temporary and automatically cleaned up
- **GitHub token** has minimal required permissions
- **Multi-platform builds** run in isolated environments 