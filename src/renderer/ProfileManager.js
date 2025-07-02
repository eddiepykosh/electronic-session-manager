export default class ProfileManager {
  constructor(uiManager, consoleManager, statusBarManager, instanceManager) {
    this.uiManager = uiManager;
    this.consoleManager = consoleManager;
    this.statusBarManager = statusBarManager;
    this.instanceManager = instanceManager;
    this.initializeProfileManagement();
    this.setupProfileControls();
  }

  setupProfileControls() {
    const profileSelect = document.getElementById('profile-select');
    if (profileSelect) {
      profileSelect.addEventListener('change', async (event) => {
        const selectedProfile = event.target.value;
        if (selectedProfile) {
          await this.switchProfile(selectedProfile);
        }
      });
    }

    const manageProfilesBtn = document.getElementById('manage-profiles');
    if (manageProfilesBtn) {
      manageProfilesBtn.addEventListener('click', () => {
        this.showProfileManagementDialog();
      });
    }
  }

  async initializeProfileManagement() {
    try {
      this.consoleManager.addConsoleEntry('Info', 'Initializing profile management...', 'info');
      await this.loadAvailableProfiles();
      await this.loadCurrentProfileInfo();
    } catch (error) {
      this.consoleManager.addConsoleEntry('ERROR', `Profile initialization failed: ${error.message}`, 'error');
    }
  }

  async loadAvailableProfiles() {
    try {
      const profiles = await window.electronAPI.getAvailableProfiles();
      const profileSelect = document.getElementById('profile-select');
      if (profileSelect) {
        profileSelect.innerHTML = '';
        profiles.forEach(profile => {
          const option = document.createElement('option');
          option.value = profile;
          option.textContent = profile;
          profileSelect.appendChild(option);
        });
      }
    } catch (error) {
      this.consoleManager.addConsoleEntry('ERROR', `Failed to load profiles: ${error.message}`, 'error');
      const profileSelect = document.getElementById('profile-select');
      if (profileSelect) {
        profileSelect.innerHTML = '<option value="">Error loading profiles</option>';
      }
    }
  }

  async loadCurrentProfileInfo() {
    try {
      const profileInfo = await window.electronAPI.getCurrentProfileInfo();
      this.updateProfileStatus(profileInfo);
      const profileSelect = document.getElementById('profile-select');
      if (profileSelect) {
        profileSelect.value = profileInfo.profile;
      }
    } catch (error) {
      this.consoleManager.addConsoleEntry('ERROR', `Failed to load current profile info: ${error.message}`, 'error');
      this.updateProfileStatus({
        profile: 'unknown',
        valid: false,
        error: error.message
      });
    }
  }

  async switchProfile(profile) {
    try {
      this.consoleManager.addConsoleEntry('INFO', `Switching to AWS profile: ${profile}`, 'info');
      this.updateProfileStatus({
        profile: profile,
        valid: false,
        error: 'Loading...'
      });
      const profileInfo = await window.electronAPI.setCurrentProfile(profile);
      this.updateProfileStatus(profileInfo);
      
      // Don't automatically load instances - let user do it manually
      if (profileInfo.valid) {
        this.consoleManager.addConsoleEntry('SUCCESS', `Successfully switched to profile: ${profile}`, 'info');
        this.consoleManager.addConsoleEntry('INFO', `Profile ${profile} is ready. Click "Refresh Instances" to load your EC2 instances.`, 'info');
        // Update the instance list to show the profile is ready
        this.instanceManager.displayProfileReadyMessage();
      } else {
        this.consoleManager.addConsoleEntry('WARNING', `Profile ${profile} set but validation failed: ${profileInfo.error}`, 'warn');
        this.instanceManager.displayNoProfileMessage();
      }
    } catch (error) {
      this.consoleManager.addConsoleEntry('ERROR', `Failed to switch profile: ${error.message}`, 'error');
      this.updateProfileStatus({
        profile: profile,
        valid: false,
        error: error.message
      });
      this.instanceManager.displayNoProfileMessage();
    }
  }

  updateProfileStatus(profileInfo) {
    const statusIndicator = document.querySelector('#profile-status .status-indicator');
    const statusText = document.querySelector('#profile-status .status-text');
    
    if (!profileInfo) {
      statusIndicator.className = 'status-indicator';
      statusText.textContent = 'No profile selected';
      this.updateProfileStatusInStatusBar(null);
      return;
    }
    
    if (profileInfo.valid) {
      statusIndicator.className = 'status-indicator valid';
      statusText.textContent = `Connected as ${profileInfo.profile}`;
    } else {
      statusIndicator.className = 'status-indicator invalid';
      statusText.textContent = 'Invalid profile';
    }
    
    this.updateProfileStatusInStatusBar(profileInfo);
  }

  updateProfileStatusInStatusBar(profileInfo) {
    if (!profileInfo) {
      this.statusBarManager.updateStatusBar({
        profile: 'none',
        profileText: 'None'
      });
      return;
    }

    const status = profileInfo.valid ? 'available' : 'unavailable';
    const text = profileInfo.valid ? profileInfo.profile : 'Invalid';
    
    this.statusBarManager.updateStatusBar({
      profile: status,
      profileText: text
    });
  }

  showProfileManagementDialog() {
    const dialog = document.getElementById('profile-management-dialog');
    if (dialog) {
      dialog.classList.add('active');
      this.setupProfileDialogControls();
      this.loadExistingProfiles();
      this.loadSSOProfiles();
    }
  }

  hideProfileManagementDialog() {
    const dialog = document.getElementById('profile-management-dialog');
    if (dialog) {
      dialog.classList.remove('active');
    }
  }

  setupProfileDialogControls() {
    document.getElementById('close-profile-dialog')?.addEventListener('click', () => this.hideProfileManagementDialog());
    const dialog = document.getElementById('profile-management-dialog');
    dialog?.addEventListener('click', (event) => {
      if (event.target === dialog) this.hideProfileManagementDialog();
    });

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

    document.getElementById('iam-profile-form')?.addEventListener('submit', async (event) => {
      event.preventDefault();
      await this.createIAMProfile();
    });

    document.getElementById('sso-profile-form')?.addEventListener('submit', async (event) => {
      event.preventDefault();
      await this.createSSOProfile();
    });

    document.getElementById('refresh-sso-status')?.addEventListener('click', async () => this.loadSSOProfiles());
  }

  async createIAMProfile() {
    try {
      const profileName = document.getElementById('iam-profile-name').value.trim();
      const accessKeyId = document.getElementById('iam-access-key').value.trim();
      const secretAccessKey = document.getElementById('iam-secret-key').value.trim();
      const sessionToken = document.getElementById('iam-session-token').value.trim();
      const region = document.getElementById('iam-region').value;

      if (!profileName || !accessKeyId || !secretAccessKey) {
        this.uiManager.showError('Please fill in all required fields');
        return;
      }

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

  async createSSOProfile() {
    try {
      const profileName = document.getElementById('sso-profile-name').value.trim();
      const ssoStartUrl = document.getElementById('sso-start-url').value.trim();
      const ssoRegion = document.getElementById('sso-region').value;
      const accountId = document.getElementById('sso-account-id').value.trim();
      const roleName = document.getElementById('sso-role-name').value.trim();
      const region = document.getElementById('sso-aws-region').value;

      if (!profileName || !ssoStartUrl || !accountId || !roleName) {
        this.uiManager.showError('Please fill in all required fields');
        return;
      }

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

  createProfileItem(profileName, currentProfile) {
    const profileItem = document.createElement('div');
    profileItem.className = 'profile-item';
    if (profileName === currentProfile) {
      profileItem.classList.add('current');
    }

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

    const statusBadge = profileItem.querySelector('.profile-status-badge');
    profileItem.querySelector('.btn-test-profile').addEventListener('click', () => this.testProfile(profileName, statusBadge));
    profileItem.querySelector('.btn-delete-profile').addEventListener('click', () => this.deleteProfile(profileName, profileItem));

    this.testProfile(profileName, statusBadge);
    return profileItem;
  }

  async testProfile(profileName, statusBadge) {
    try {
      statusBadge.className = 'profile-status-badge unknown';
      statusBadge.textContent = 'Testing...';
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

  async deleteProfile(profileName, profileItem) {
    try {
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

  createSSOProfileItem(ssoProfile) {
    const ssoProfileItem = document.createElement('div');
    ssoProfileItem.className = 'sso-profile-item';
    const statusText = ssoProfile.authenticated ? 'Authenticated' : 'Not authenticated';
    const statusClass = ssoProfile.authenticated ? 'authenticated' : 'not-authenticated';
    
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