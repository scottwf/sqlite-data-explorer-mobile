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

    let testUrl = this.connectionConfig.url;

    // Ensure the URL doesn't end with a slash for consistency,
    // as we are now testing the root path.
    if (testUrl.endsWith('/')) {
      testUrl = testUrl.slice(0, -1);
    }

    // Test the root path '/'
    const endpointToTest = '/';
    const fullTestUrl = `${testUrl}${endpointToTest}`;

    try {
      console.log(`Attempting to connect to: ${fullTestUrl}`);
      const response = await fetch(fullTestUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // Add any other headers if required, e.g., API keys, auth tokens
        },
        signal: AbortSignal.timeout(5000), // 5-second timeout
      });

      if (response.ok) { // Status code 200-299
        console.log(`Connection test to ${fullTestUrl} successful. Status: ${response.status}`);
        return true;
      } else {
        let responseBody = '';
        try {
          responseBody = await response.text();
        } catch (textError) {
          console.warn(`Could not read response body from ${fullTestUrl}:`, textError);
        }
        console.error(`Connection test to ${fullTestUrl} failed with status: ${response.status} ${response.statusText}. Body: ${responseBody}`);
        return false;
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.error(`Connection test to ${fullTestUrl} timed out.`, error);
      } else {
        console.error(`Connection test to ${fullTestUrl} failed:`, error);
      }
      return false;
    }
  }
}

export default RemoteDatabaseManager;
