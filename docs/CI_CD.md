# CI/CD Pipeline Documentation

## Overview

This project uses GitHub Actions to automatically build and release the Electronic Session Manager application for Windows, macOS, and Linux. The pipeline creates distributables for all platforms using Electron Forge.

## Workflow File

The CI/CD pipeline is defined in `.github/workflows/build.yml` and provides the following features:

- **Automated builds** on version tag pushes (v* pattern)
- **Multi-platform support** (Windows, macOS, Linux)
- **Parallel builds** across all platforms
- **Automatic GitHub releases** with all distributables
- **Artifact archiving** for each platform

## How to Use

### Automatic Releases

1. **Create a version tag:**
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

2. **The workflow will automatically:**
   - Build the application for Windows, macOS, and Linux in parallel
   - Create distributables for all platforms using Electron Forge
   - Archive build artifacts for each platform
   - Create a GitHub release with all distributables
   - Upload all platform-specific files to the release

### Manual Builds

**Note:** The current workflow only supports automatic builds on version tag pushes. Manual builds are not currently configured in the workflow.

To enable manual builds, the workflow would need to be modified to include:
```yaml
on:
  push:
    tags:
      - v*    # Triggers on version tags like v1.0.0
  workflow_dispatch:  # Add this for manual triggers
```

## Build Outputs

### Windows
- **Squirrel Installer:** `out/make/squirrel.windows/x64/*.exe` - Standard Windows installer
- **Zip Package:** `out/make/zip/win32/x64/*.zip` - Standard zip archive

### macOS
- **DMG Installer:** `out/make/dmg/x64/*.dmg` - Standard macOS disk image
- **Zip Package:** `out/make/zip/darwin/x64/*.zip` - Standard zip archive

### Linux
- **DEB Package:** `out/make/deb/x64/*.deb` - Debian/Ubuntu package
- **RPM Package:** `out/make/rpm/x64/*.rpm` - Red Hat/Fedora package
- **Zip Package:** `out/make/zip/linux/x64/*.zip` - Standard zip archive

## Platform-Specific Features

### Windows
- **Squirrel installer** for standard Windows installation
- **Zip package** for manual installation or distribution

### macOS
- **DMG installer** for standard macOS installation
- **Zip package** for manual installation

### Linux
- **DEB/RPM packages** for package manager installation
- **Zip archive** for manual installation

## Artifacts

All build artifacts are automatically uploaded to GitHub Actions with:
- **Separate artifact names** for each platform (`dist-ubuntu-latest`, `dist-windows-latest`, `dist-macos-latest`)
- **Automatic release creation** on tag pushes
- **All distributables included** in GitHub releases

## Requirements

### For Builds
- **Node.js 22 LTS** (automatically installed by workflow)
- **Windows environment** (provided by GitHub Actions)
- **macOS environment** (provided by GitHub Actions)
- **Ubuntu environment** (provided by GitHub Actions)
- **GitHub repository** with proper permissions

### For Releases
- **GitHub token** (automatically provided)
- **Version tags** following semantic versioning (e.g., `v1.0.0`)
- **Contents write permission** for creating releases

## Build Process

### Parallel Builds
The workflow runs three parallel jobs using matrix strategy:
1. **ubuntu-latest** - Creates Linux DEB, RPM, and zip packages
2. **windows-latest** - Creates Windows Squirrel installer and zip package
3. **macos-latest** - Creates macOS DMG and zip packages

### Build Steps
Each platform follows the same build process:
1. **Checkout repository** using actions/checkout@v4
2. **Set up Node.js 22 LTS** using actions/setup-node@v4
3. **Install dependencies** using `npm ci`
4. **Make distributables** using `npm run make` (Electron Forge)
5. **Archive distributables** using actions/upload-artifact@v4
6. **Create GitHub Release** (only on tag pushes) using softprops/action-gh-release@v2

### Release Creation
After all builds complete successfully:
- **Release creation** only triggers on version tag pushes (`v*` pattern)
- **All distributables** are uploaded to the GitHub release
- **Files included:** All .zip, .deb, .rpm, .exe, and .dmg files from build outputs

## Troubleshooting

### Common Issues

1. **Build fails on dependency installation:**
   - Check that `package.json` is valid
   - Ensure all dependencies are properly specified
   - Verify Node.js 22 compatibility

2. **Release not created:**
   - Ensure the tag follows the `v*` pattern (e.g., `v1.0.0`)
   - Check that the workflow has proper permissions
   - Verify all build jobs completed successfully
   - Check that the repository has contents write permission

3. **Platform-specific build failures:**
   - Check platform-specific dependencies in forge.config.js
   - Verify Electron Forge makers are properly configured
   - Ensure all required build tools are available

4. **Artifact upload failures:**
   - Check available disk space on runners
   - Verify artifact size limits
   - Ensure proper file permissions

### Debugging

The workflow includes standard GitHub Actions debugging:
- **Build logs** are available in the Actions tab
- **Artifact downloads** can be used to inspect build outputs
- **Release creation logs** show which files were uploaded

## Customization

### Adding Manual Builds

To enable manual builds, add `workflow_dispatch` to the triggers:
```yaml
on:
  push:
    tags:
      - v*
  workflow_dispatch:  # Add this for manual triggers
```

### Modifying Build Process

1. **Edit `.github/workflows/build.yml`** to change build steps
2. **Update forge.config.js** to modify Electron Forge configuration
3. **Test changes** by creating a test tag

### Adding More Platforms

The current setup supports:
- **Windows:** Squirrel installer, zip package
- **macOS:** DMG installer, zip package
- **Linux:** DEB, RPM, zip packages

Additional platforms can be added by:
1. **Adding to matrix.os** in the workflow
2. **Configuring appropriate makers** in forge.config.js
3. **Testing on the new platform**

## Security Considerations

- **No sensitive data** is included in builds
- **Dependencies** are installed from npm registry using `npm ci`
- **Build artifacts** are temporary and automatically cleaned up
- **GitHub token** has minimal required permissions (contents: write)
- **Multi-platform builds** run in isolated environments
- **Version tags** are required for release creation 