// src/services/RemoteDatabaseManager.ts

interface RemoteConnectionConfig {
  url: string;
}

class RemoteDatabaseManager {
  private connectionConfig: RemoteConnectionConfig | null = null;

  constructor() {
    // Load saved configuration on initialization
    this.loadConfiguration();
  }

  public setConnectionConfig(url: string): boolean {
    if (!this.isValidUrl(url)) {
      console.error("Invalid URL provided for remote database connection.");
      return false;
    }
    this.connectionConfig = { url };
    this.saveConfiguration();
    return true;
  }

  public getConnectionConfig(): RemoteConnectionConfig | null {
    return this.connectionConfig;
  }

  public clearConnectionConfig(): void {
    this.connectionConfig = null;
    localStorage.removeItem('remoteDbConfig');
    console.log("Remote database configuration cleared.");
  }

  private saveConfiguration(): void {
    if (this.connectionConfig) {
      localStorage.setItem('remoteDbConfig', JSON.stringify(this.connectionConfig));
      console.log("Remote database configuration saved.");
    }
  }

  private loadConfiguration(): void {
    const savedConfig = localStorage.getItem('remoteDbConfig');
    if (savedConfig) {
      try {
        this.connectionConfig = JSON.parse(savedConfig);
        console.log("Loaded remote database configuration:", this.connectionConfig);
      } catch (error) {
        console.error("Error loading remote database configuration from localStorage:", error);
        localStorage.removeItem('remoteDbConfig'); // Clear corrupted data
      }
    }
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      // Further checks can be added, e.g., ensuring it's http or https
      return url.startsWith('http://') || url.startsWith('https://');
    } catch (_) {
      return false;
    }
  }

  public async testConnection(): Promise<boolean> {
    if (!this.connectionConfig || !this.connectionConfig.url) {
      console.warn("No remote database URL configured to test.");
      return false;
    }

    const PING_ENDPOINT = '/ping'; // Standardized ping endpoint
    let testUrl = this.connectionConfig.url;

    // Ensure the URL doesn't end with a slash, then append the ping endpoint.
    if (testUrl.endsWith('/')) {
      testUrl = testUrl.slice(0, -1);
    }

    try {
      console.log(`Attempting to connect to: ${testUrl}${PING_ENDPOINT}`);
      const response = await fetch(`${testUrl}${PING_ENDPOINT}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // Add any other headers if required, e.g., API keys, auth tokens
        },
        // It's good practice to set a timeout for fetch requests.
        // AbortController can be used for this.
        signal: AbortSignal.timeout(5000), // 5-second timeout
      });

      if (response.ok) { // Status code 200-299
        console.log(`Connection test to ${testUrl}${PING_ENDPOINT} successful.`);
        // Optionally, you could check the response body if the ping endpoint returns specific data.
        // const data = await response.json();
        // if (data.status === 'ok') return true;
        return true;
      } else {
        console.error(`Connection test to ${testUrl}${PING_ENDPOINT} failed with status: ${response.status} ${response.statusText}`);
        return false;
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.error(`Connection test to ${testUrl}${PING_ENDPOINT} timed out.`, error);
      } else {
        console.error(`Connection test to ${testUrl}${PING_ENDPOINT} failed:`, error);
      }
      return false;
    }
  }
}

export default RemoteDatabaseManager;
