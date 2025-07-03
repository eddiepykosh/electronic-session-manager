/**
 * Profile Manager - Electronic Session Manager
 * 
 * This file manages AWS profile configuration and authentication for the application.
 * It handles both IAM and SSO profile types, provides profile creation, validation,
 * switching, and management capabilities.
 * 
 * Key Responsibilities:
 * - Manages AWS profile selection and switching
 * - Handles IAM profile creation and validation
 * - Manages SSO profile setup and authentication
 * - Provides profile testing and validation
 * - Coordinates profile status with status bar
 * - Manages profile management dialog
 * - Handles profile deletion and cleanup
 * 
 * Architecture Role:
 * - Acts as the AWS authentication and profile management component
 * - Coordinates between AWS services and UI for profile operations
 * - Manages profile state and validation
 * - Provides profile management interface
 * - Integrates with instance manager for profile-dependent operations
 * 
 * Profile Types Supported:
 * - IAM Profiles: Access key/secret key based authentication
 * - SSO Profiles: Single Sign-On based authentication
 * - Default Profile: System default AWS profile
 * 
 * Features:
 * - Profile creation (IAM and SSO)
 * - Profile validation and testing
 * - Profile switching and management
 * - SSO login/logout functionality
 * - Profile status monitoring
 * - Profile deletion (with safeguards)
 * - Real-time profile status updates
 * 
 * Security Features:
 * - Secure credential handling
 * - Profile validation before use
 * - Confirmation dialogs for destructive operations
 * - SSO session management
 * 
 * Dependencies:
 * - UIManager: For notifications and UI utilities
 * - ConsoleManager: For logging operations
 * - StatusBarManager: For status updates
 * - InstanceManager: For profile-dependent operations
 * - electronAPI: For AWS profile operations
 */

export default class ProfileManager {
  /**
   * Constructor initializes the profile manager with dependencies
   * Sets up profile management and control event listeners
   * @param {UIManager} uiManager - UI management utilities
   * @param {ConsoleManager} consoleManager - Console logging
   * @param {StatusBarManager} statusBarManager - Status bar updates
   * @param {InstanceManager} instanceManager - Instance management
   */
  constructor(uiManager, consoleManager, statusBarManager, instanceManager) {
    this.uiManager = uiManager;
    this.consoleManager = consoleManager;
    this.statusBarManager = statusBarManager;
    this.instanceManager = instanceManager;
    this.initializeProfileManagement();
    this.setupProfileControls();
  }

  /**
   * Sets up profile control event listeners
   * Handles profile selection dropdown and management button
   */
  setupProfileControls() {
    // Set up profile selection dropdown
    const profileSelect = document.getElementById('profile-select');
    if (profileSelect) {
      profileSelect.addEventListener('change', async (event) => {
        const selectedProfile = event.target.value;
        if (selectedProfile) {
          await this.switchProfile(selectedProfile);
        }
      });
    }

    // Set up profile management button
    const manageProfilesBtn = document.getElementById('manage-profiles');
    if (manageProfilesBtn) {
      manageProfilesBtn.addEventListener('click', () => {
        this.showProfileManagementDialog();
      });
    }
  }

  /**
   * Initializes profile management system
   * Loads available profiles and current profile information
   */
  async initializeProfileManagement() {
    try {
      this.consoleManager.addConsoleEntry('Info', 'Initializing profile management...', 'info');
      await this.loadAvailableProfiles();
      await this.loadCurrentProfileInfo();
    } catch (error) {
      this.consoleManager.addConsoleEntry('ERROR', `Profile initialization failed: ${error.message}`, 'error');
    }
  }

  /**
   * Loads available AWS profiles and populates the dropdown
   * Fetches profiles from AWS configuration and updates UI
   */
  async loadAvailableProfiles() {
    try {
      // Get available profiles from AWS configuration
      const profiles = await window.electronAPI.getAvailableProfiles();
      const profileSelect = document.getElementById('profile-select');
      if (profileSelect) {
        // Clear existing options and add new ones
        profileSelect.innerHTML = '';
        profiles.forEach(profile => {
          const option = document.createElement('option');
          option.value = profile;
          option.textContent = profile;
          profileSelect.appendChild(option);
        });
      }
    } catch (error) {
      // Handle errors loading profiles
      this.consoleManager.addConsoleEntry('ERROR', `Failed to load profiles: ${error.message}`, 'error');
      const profileSelect = document.getElementById('profile-select');
      if (profileSelect) {
        profileSelect.innerHTML = '<option value="">Error loading profiles</option>';
      }
    }
  }

  /**
   * Loads current profile information and updates UI
   * Validates current profile and updates status indicators
   */
  async loadCurrentProfileInfo() {
    try {
      // Get current profile information from AWS
      const profileInfo = await window.electronAPI.getCurrentProfileInfo();
      this.updateProfileStatus(profileInfo);
      
      // Update profile selection dropdown
      const profileSelect = document.getElementById('profile-select');
      if (profileSelect) {
        profileSelect.value = profileInfo.profile;
      }
    } catch (error) {
      // Handle errors loading current profile
      this.consoleManager.addConsoleEntry('ERROR', `Failed to load current profile info: ${error.message}`, 'error');
      this.updateProfileStatus({
        profile: 'unknown',
        valid: false,
        error: error.message
      });
    }
  }

  /**
   * Switches to a different AWS profile
   * Validates the profile and updates application state
   * @param {string} profile - Name of the profile to switch to
   */
  async switchProfile(profile) {
    try {
      this.consoleManager.addConsoleEntry('INFO', `Switching to AWS profile: ${profile}`, 'info');
      
      // Update status to show loading state
      this.updateProfileStatus({
        profile: profile,
        valid: false,
        error: 'Loading...'
      });
      
      // Switch to the selected profile
      const profileInfo = await window.electronAPI.setCurrentProfile(profile);
      this.updateProfileStatus(profileInfo);
      
      // Handle successful profile switch
      if (profileInfo.valid) {
        this.consoleManager.addConsoleEntry('SUCCESS', `Successfully switched to profile: ${profile}`, 'info');
        this.consoleManager.addConsoleEntry('INFO', `Profile ${profile} is ready. Click "Refresh Instances" to load your EC2 instances.`, 'info');
        // Update instance list to show profile is ready
        this.instanceManager.displayProfileReadyMessage();
      } else {
        // Handle invalid profile
        this.consoleManager.addConsoleEntry('WARNING', `Profile ${profile} set but validation failed: ${profileInfo.error}`, 'warn');
        this.instanceManager.displayNoProfileMessage();
      }
    } catch (error) {
      // Handle errors during profile switch
      this.consoleManager.addConsoleEntry('ERROR', `Failed to switch profile: ${error.message}`, 'error');
      this.updateProfileStatus({
        profile: profile,
        valid: false,
        error: error.message
      });
      this.instanceManager.displayNoProfileMessage();
    }
  }

  /**
   * Updates profile status display in the UI
   * Updates status indicators and text based on profile validity
   * @param {Object} profileInfo - Profile information object
   */
  updateProfileStatus(profileInfo) {
    const statusIndicator = document.querySelector('#profile-status .status-indicator');
    const statusText = document.querySelector('#profile-status .status-text');
    
    // Handle null profile info
    if (!profileInfo) {
      statusIndicator.className = 'status-indicator';
      statusText.textContent = 'No profile selected';
      this.updateProfileStatusInStatusBar(null);
      return;
    }
    
    // Update status based on profile validity
    if (profileInfo.valid) {
      statusIndicator.className = 'status-indicator valid';
      statusText.textContent = `Connected as ${profileInfo.profile}`;
    } else {
      statusIndicator.className = 'status-indicator invalid';
      statusText.textContent = 'Invalid profile';
    }
    
    // Update status bar with profile information
    this.updateProfileStatusInStatusBar(profileInfo);
  }

  /**
   * Updates profile status in the status bar
   * Provides real-time profile status feedback
   * @param {Object} profileInfo - Profile information object
   */
  updateProfileStatusInStatusBar(profileInfo) {
    if (!profileInfo) {
      this.statusBarManager.updateStatusBar({
        profile: 'none',
        profileText: 'None'
      });
      return;
    }

    // Determine status and text for status bar
    const status = profileInfo.valid ? 'available' : 'unavailable';
    const text = profileInfo.valid ? profileInfo.profile : 'Invalid';
    
    this.statusBarManager.updateStatusBar({
      profile: status,
      profileText: text
    });
  }

  /**
   * Shows the profile management dialog
   * Opens the dialog for creating and managing profiles
   */
  showProfileManagementDialog() {
    const dialog = document.getElementById('profile-management-dialog');
    if (dialog) {
      dialog.classList.add('active');
      this.setupProfileDialogControls();
      this.loadExistingProfiles();
      this.loadSSOProfiles();
    }
  }

  /**
   * Hides the profile management dialog
   * Closes the dialog and cleans up
   */
  hideProfileManagementDialog() {
    const dialog = document.getElementById('profile-management-dialog');
    if (dialog) {
      dialog.classList.remove('active');
    }
  }

  /**
   * Sets up controls within the profile management dialog
   * Handles form submissions, tab switching, and dialog interactions
   */
  setupProfileDialogControls() {
    // Set up dialog close functionality
    document.getElementById('close-profile-dialog')?.addEventListener('click', () => this.hideProfileManagementDialog());
    const dialog = document.getElementById('profile-management-dialog');
    dialog?.addEventListener('click', (event) => {
      if (event.target === dialog) this.hideProfileManagementDialog();
    });

    // Set up profile type tab switching
    const profileTypeBtns = document.querySelectorAll('.profile-type-btn');
    profileTypeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const profileType = btn.getAttribute('data-type');
        profileTypeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        document.querySelectorAll('.profile-form').forEach(form => {
          form.classList.remove('active');
          if (form.id === `${profileType}-profile-form`) {
            form.classList.add('active');
          }
        });
      });
    });

    // Set up IAM profile form submission
    document.getElementById('iam-profile-form')?.addEventListener('submit', async (event) => {
      event.preventDefault();
      await this.createIAMProfile();
    });

    // Set up SSO profile form submission
    document.getElementById('sso-profile-form')?.addEventListener('submit', async (event) => {
      event.preventDefault();
      await this.createSSOProfile();
    });

    // Set up SSO status refresh button
    document.getElementById('refresh-sso-status')?.addEventListener('click', async () => this.loadSSOProfiles());
  }

  /**
   * Creates a new IAM profile
   * Handles IAM profile creation with access key authentication
   */
  async createIAMProfile() {
    try {
      // Get form values
      const profileName = document.getElementById('iam-profile-name').value.trim();
      const accessKeyId = document.getElementById('iam-access-key').value.trim();
      const secretAccessKey = document.getElementById('iam-secret-key').value.trim();
      const sessionToken = document.getElementById('iam-session-token').value.trim();
      const region = document.getElementById('iam-region').value;

      // Validate required fields
      if (!profileName || !accessKeyId || !secretAccessKey) {
        this.uiManager.showError('Please fill in all required fields');
        return;
      }

      // Create the IAM profile
      const result = await window.electronAPI.createProfile(profileName, 'iam', {
        accessKeyId, secretAccessKey, sessionToken, region
      });

      if (result.success) {
        this.consoleManager.addConsoleEntry('SUCCESS', `IAM profile "${profileName}" created successfully`, 'info');
        this.uiManager.showSuccess(`IAM profile "${profileName}" created successfully`);
        document.getElementById('iam-profile-form').reset();
        await this.loadAvailableProfiles();
        await this.loadExistingProfiles();
      }
    } catch (error) {
      this.consoleManager.addConsoleEntry('ERROR', `Failed to create IAM profile: ${error.message}`, 'error');
      this.uiManager.showError(`Failed to create IAM profile: ${error.message}`);
    }
  }

  /**
   * Creates a new SSO profile
   * Handles SSO profile creation with SSO configuration
   */
  async createSSOProfile() {
    try {
      // Get form values
      const profileName = document.getElementById('sso-profile-name').value.trim();
      const ssoStartUrl = document.getElementById('sso-start-url').value.trim();
      const ssoRegion = document.getElementById('sso-region').value;
      const accountId = document.getElementById('sso-account-id').value.trim();
      const roleName = document.getElementById('sso-role-name').value.trim();
      const region = document.getElementById('sso-aws-region').value;

      // Validate required fields
      if (!profileName || !ssoStartUrl || !accountId || !roleName) {
        this.uiManager.showError('Please fill in all required fields');
        return;
      }

      // Create the SSO profile
      const result = await window.electronAPI.createProfile(profileName, 'sso', {
        ssoStartUrl, ssoRegion, accountId, roleName, region
      });

      if (result.success) {
        this.consoleManager.addConsoleEntry('SUCCESS', `SSO profile "${profileName}" created successfully`, 'info');
        this.uiManager.showSuccess(`SSO profile "${profileName}" created successfully`);
        document.getElementById('sso-profile-form').reset();
        await this.loadAvailableProfiles();
        await this.loadExistingProfiles();
      }
    } catch (error) {
      this.consoleManager.addConsoleEntry('ERROR', `Failed to create SSO profile: ${error.message}`, 'error');
      this.uiManager.showError(`Failed to create SSO profile: ${error.message}`);
    }
  }

  /**
   * Loads existing profiles for display in management dialog
   * Shows all available profiles with their current status
   */
  async loadExistingProfiles() {
    try {
      const profiles = await window.electronAPI.getAvailableProfiles();
      const currentProfile = await window.electronAPI.getCurrentProfileInfo();
      const profilesList = document.getElementById('existing-profiles-list');
      if (profilesList) {
        profilesList.innerHTML = '';
        for (const profile of profiles) {
          const profileItem = this.createProfileItem(profile, currentProfile.profile);
          profilesList.appendChild(profileItem);
        }
      }
    } catch (error) {
      this.consoleManager.addConsoleEntry('ERROR', `Failed to load existing profiles: ${error.message}`, 'error');
    }
  }

  /**
   * Creates a profile item element for the management dialog
   * @param {string} profileName - Name of the profile
   * @param {string} currentProfile - Currently selected profile
   * @returns {HTMLElement} Profile item element
   */
  createProfileItem(profileName, currentProfile) {
    const profileItem = document.createElement('div');
    profileItem.className = 'profile-item';
    if (profileName === currentProfile) {
      profileItem.classList.add('current');
    }

    // Create profile item HTML
    profileItem.innerHTML = `
      <div class="profile-info">
        <div class="profile-name">${profileName}</div>
        <div class="profile-type">${profileName === 'default' ? 'Default' : 'Custom'}</div>
        <span class="profile-status-badge unknown">Unknown</span>
      </div>
      <div class="profile-actions">
        <button class="btn-test-profile">Test</button>
        <button class="btn-delete-profile" ${profileName === 'default' ? 'disabled' : ''}>Delete</button>
      </div>
    `;

    // Set up event listeners for profile actions
    const statusBadge = profileItem.querySelector('.profile-status-badge');
    profileItem.querySelector('.btn-test-profile').addEventListener('click', () => this.testProfile(profileName, statusBadge));
    profileItem.querySelector('.btn-delete-profile').addEventListener('click', () => this.deleteProfile(profileName, profileItem));

    // Automatically test the profile
    this.testProfile(profileName, statusBadge);
    return profileItem;
  }

  /**
   * Tests a profile's validity
   * Validates profile credentials and updates status badge
   * @param {string} profileName - Name of the profile to test
   * @param {HTMLElement} statusBadge - Status badge element to update
   */
  async testProfile(profileName, statusBadge) {
    try {
      // Set status to testing
      statusBadge.className = 'profile-status-badge unknown';
      statusBadge.textContent = 'Testing...';
      
      // Test the profile
      const profileInfo = await window.electronAPI.testProfile(profileName);
      if (profileInfo.valid) {
        statusBadge.className = 'profile-status-badge valid';
        statusBadge.textContent = 'Valid';
      } else {
        statusBadge.className = 'profile-status-badge invalid';
        statusBadge.textContent = 'Invalid';
        this.consoleManager.addConsoleEntry('WARN', `Profile "${profileName}" is invalid: ${profileInfo.error}`, 'warn');
      }
    } catch (error) {
      statusBadge.className = 'profile-status-badge invalid';
      statusBadge.textContent = 'Error';
      this.consoleManager.addConsoleEntry('ERROR', `Failed to test profile "${profileName}": ${error.message}`, 'error');
    }
  }

  /**
   * Deletes a profile
   * Removes profile from AWS configuration with confirmation
   * @param {string} profileName - Name of the profile to delete
   * @param {HTMLElement} profileItem - Profile item element to remove
   */
  async deleteProfile(profileName, profileItem) {
    try {
      // Prevent deletion of default profile and require confirmation
      if (profileName === 'default' || !confirm(`Are you sure you want to delete the profile "${profileName}"? This action cannot be undone.`)) {
        return;
      }
      
      const result = await window.electronAPI.deleteProfile(profileName);
      if (result.success) {
        this.consoleManager.addConsoleEntry('SUCCESS', `Profile "${profileName}" deleted successfully`, 'info');
        this.uiManager.showSuccess(`Profile "${profileName}" deleted successfully`);
        profileItem.remove();
        await this.loadAvailableProfiles();
        await this.loadCurrentProfileInfo();
      }
    } catch (error) {
      this.consoleManager.addConsoleEntry('ERROR', `Failed to delete profile: ${error.message}`, 'error');
      this.uiManager.showError(`Failed to delete profile: ${error.message}`);
    }
  }

  /**
   * Loads SSO profiles and their authentication status
   * Displays SSO profiles in the management dialog
   */
  async loadSSOProfiles() {
    try {
      const ssoProfiles = await window.electronAPI.getAllSSOLoginStatus();
      const ssoProfilesList = document.getElementById('sso-profiles-list');
      if (ssoProfilesList) {
        ssoProfilesList.innerHTML = '';
        if (ssoProfiles.length === 0) {
          ssoProfilesList.innerHTML = '<p class="no-sso-profiles">No SSO profiles found. Create an SSO profile first.</p>';
          return;
        }
        for (const ssoProfile of ssoProfiles) {
          const ssoProfileItem = this.createSSOProfileItem(ssoProfile);
          ssoProfilesList.appendChild(ssoProfileItem);
        }
      }
    } catch (error) {
      this.consoleManager.addConsoleEntry('ERROR', `Failed to load SSO profiles: ${error.message}`, 'error');
    }
  }

  /**
   * Creates an SSO profile item element for the management dialog
   * @param {Object} ssoProfile - SSO profile information
   * @returns {HTMLElement} SSO profile item element
   */
  createSSOProfileItem(ssoProfile) {
    const ssoProfileItem = document.createElement('div');
    ssoProfileItem.className = 'sso-profile-item';
    const statusText = ssoProfile.authenticated ? 'Authenticated' : 'Not authenticated';
    const statusClass = ssoProfile.authenticated ? 'authenticated' : 'not-authenticated';
    
    // Create SSO profile item HTML
    ssoProfileItem.innerHTML = `
      <div class="sso-profile-info">
        <div class="sso-profile-name">${ssoProfile.profileName}</div>
        <div class="sso-profile-status">
          ${statusText} <span class="sso-login-status ${statusClass}">${ssoProfile.authenticated ? '✓' : '✗'}</span>
          ${ssoProfile.accountId ? `<br><small>Account: ${ssoProfile.accountId}</small>` : ''}
        </div>
      </div>
      <div class="sso-profile-actions">
        ${ssoProfile.authenticated 
          ? `<button class="btn-sso-logout">Logout</button>`
          : `<button class="btn-sso-login">Login</button>`
        }
      </div>
    `;

    // Set up event listeners for SSO actions
    if (ssoProfile.authenticated) {
      ssoProfileItem.querySelector('.btn-sso-logout').addEventListener('click', () => this.logoutSSOProfile(ssoProfile.profileName));
    } else {
      ssoProfileItem.querySelector('.btn-sso-login').addEventListener('click', (e) => {
        const loginBtn = e.target;
        loginBtn.innerHTML = '<span class="sso-login-loading"></span>Logging in...';
        loginBtn.disabled = true;
        this.loginSSOProfile(ssoProfile.profileName).finally(() => {
            loginBtn.textContent = 'Login';
            loginBtn.disabled = false;
        });
      });
    }

    return ssoProfileItem;
  }

  /**
   * Initiates SSO login for a profile
   * Handles SSO authentication process
   * @param {string} profileName - Name of the SSO profile to login
   */
  async loginSSOProfile(profileName) {
    try {
      this.consoleManager.addConsoleEntry('INFO', `Starting SSO login for profile: ${profileName}`, 'info');
      const result = await window.electronAPI.performSSOLogin(profileName);
      if (result.success) {
        this.consoleManager.addConsoleEntry('SUCCESS', `SSO login successful for profile: ${profileName}`, 'info');
        this.uiManager.showSuccess(`SSO login successful for profile: ${profileName}`);
        await this.loadSSOProfiles();
      }
    } catch (error) {
      this.consoleManager.addConsoleEntry('ERROR', `Failed to login SSO profile: ${error.message}`, 'error');
      this.uiManager.showError(`Failed to login SSO profile: ${error.message}`);
    }
  }

  /**
   * Initiates SSO logout for a profile
   * Handles SSO session termination
   * @param {string} profileName - Name of the SSO profile to logout
   */
  async logoutSSOProfile(profileName) {
    try {
      if (!confirm(`Are you sure you want to logout from profile "${profileName}"?`)) return;
      
      this.consoleManager.addConsoleEntry('INFO', `Logging out from SSO profile: ${profileName}. Session will expire naturally.`, 'info');
      this.uiManager.showSuccess(`SSO logout initiated for profile: ${profileName}`);
      await this.loadSSOProfiles();
    } catch (error) {
      this.consoleManager.addConsoleEntry('ERROR', `Failed to logout SSO profile: ${error.message}`, 'error');
      this.uiManager.showError(`Failed to logout SSO profile: ${error.message}`);
    }
  }
} 