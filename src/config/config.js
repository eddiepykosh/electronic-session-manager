const path = require('path');
const fs = require('fs').promises;

class Config {
  constructor() {
    this.configPath = path.join(process.env.APPDATA || process.env.HOME, '.electronic-session-manager');
    this.configFile = path.join(this.configPath, 'config.json');
    this.defaultConfig = {
      aws: {
        region: 'us-east-1',
        profile: 'default'
      },
      ui: {
        theme: 'light',
        windowSize: {
          width: 1200,
          height: 800
        }
      },
      sessions: {
        autoReconnect: false,
        maxSessions: 5
      },
      portForwarding: {
        defaultLocalPort: 8080,
        defaultRemotePort: 80
      }
    };
  }

  async load() {
    try {
      await this.ensureConfigDirectory();
      const data = await fs.readFile(this.configFile, 'utf8');
      const config = JSON.parse(data);
      return { ...this.defaultConfig, ...config };
    } catch (error) {
      console.log('No config file found, using defaults');
      return this.defaultConfig;
    }
  }

  async save(config) {
    try {
      await this.ensureConfigDirectory();
      await fs.writeFile(this.configFile, JSON.stringify(config, null, 2));
      return true;
    } catch (error) {
      console.error('Error saving config:', error);
      throw new Error(`Failed to save config: ${error.message}`);
    }
  }

  async ensureConfigDirectory() {
    try {
      await fs.access(this.configPath);
    } catch (error) {
      await fs.mkdir(this.configPath, { recursive: true });
    }
  }

  async getAwsConfig() {
    const config = await this.load();
    return config.aws;
  }

  async setAwsConfig(awsConfig) {
    const config = await this.load();
    config.aws = { ...config.aws, ...awsConfig };
    await this.save(config);
  }

  async getUIConfig() {
    const config = await this.load();
    return config.ui;
  }

  async setUIConfig(uiConfig) {
    const config = await this.load();
    config.ui = { ...config.ui, ...uiConfig };
    await this.save(config);
  }

  async getSessionConfig() {
    const config = await this.load();
    return config.sessions;
  }

  async setSessionConfig(sessionConfig) {
    const config = await this.load();
    config.sessions = { ...config.sessions, ...sessionConfig };
    await this.save(config);
  }

  async getPortForwardingConfig() {
    const config = await this.load();
    return config.portForwarding;
  }

  async setPortForwardingConfig(portForwardingConfig) {
    const config = await this.load();
    config.portForwarding = { ...config.portForwarding, ...portForwardingConfig };
    await this.save(config);
  }
}

module.exports = Config; 