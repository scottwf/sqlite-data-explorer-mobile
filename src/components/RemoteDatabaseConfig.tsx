// src/components/RemoteDatabaseConfig.tsx
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import RemoteDatabaseManager from '@/services/RemoteDatabaseManager'; // Adjust path as needed
import { Globe, Zap, XCircle, CheckCircle2 } from 'lucide-react';

interface RemoteDatabaseConfigProps {
  remoteDbManager: RemoteDatabaseManager;
  onConnectionChange: (isConnected: boolean, url?: string) => void;
}

export const RemoteDatabaseConfig: React.FC<RemoteDatabaseConfigProps> = ({ remoteDbManager, onConnectionChange }) => {
  const [url, setUrl] = useState<string>('');
  const [currentUrl, setCurrentUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    const config = remoteDbManager.getConnectionConfig();
    if (config) {
      setUrl(config.url);
      setCurrentUrl(config.url);
      onConnectionChange(true, config.url); // Assume connected if config exists
    }
  }, [remoteDbManager, onConnectionChange]);

  const handleUrlChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(event.target.value);
    setTestStatus('idle'); // Reset test status when URL changes
  };

  const handleSetConnection = async () => {
    setIsLoading(true);
    setTestStatus('idle');
    if (!remoteDbManager.setConnectionConfig(url)) {
      toast({
        title: 'Invalid URL',
        description: 'Please enter a valid HTTP or HTTPS URL for the remote database server.',
        variant: 'destructive',
      });
      setIsLoading(false);
      setTestStatus('error');
      return;
    }

    // Test the new connection
    const success = await remoteDbManager.testConnection();
    if (success) {
      toast({
        title: 'Connection Successful',
        description: `Successfully connected to ${url}.`,
        variant: 'default',
      });
      setCurrentUrl(url);
      setTestStatus('success');
      onConnectionChange(true, url);
    } else {
      toast({
        title: 'Connection Failed',
        description: `Could not connect to ${url}. Please check the URL and server status.`,
        variant: 'destructive',
      });
      // Optional: Clear config if test fails, or allow saving anyway
      // remoteDbManager.clearConnectionConfig();
      // setCurrentUrl(null);
      setTestStatus('error');
      onConnectionChange(false);
    }
    setIsLoading(false);
  };

  const handleClearConnection = () => {
    remoteDbManager.clearConnectionConfig();
    setUrl('');
    setCurrentUrl(null);
    setTestStatus('idle');
    toast({
      title: 'Connection Cleared',
      description: 'Remote database connection configuration has been cleared.',
    });
    onConnectionChange(false);
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Globe className="mr-2 h-5 w-5" />
          Remote Database Configuration
        </CardTitle>
        <CardDescription>
          Connect to a remote Flask server to access SQLite databases.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="remote-db-url">Server URL</Label>
          <div className="flex items-center space-x-2">
            <Input
              id="remote-db-url"
              type="url"
              placeholder="https://your-flask-server.com"
              value={url}
              onChange={handleUrlChange}
              disabled={isLoading}
            />
            {testStatus === 'success' && <CheckCircle2 className="h-5 w-5 text-green-500" />}
            {testStatus === 'error' && <XCircle className="h-5 w-5 text-red-500" />}
          </div>
          {currentUrl && testStatus !== 'error' && (
            <p className="text-sm text-muted-foreground">
              Currently connected to: {currentUrl}
            </p>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button
          onClick={handleClearConnection}
          variant="outline"
          disabled={isLoading || !currentUrl}
        >
          <XCircle className="mr-2 h-4 w-4" />
          Disconnect
        </Button>
        <Button
          onClick={handleSetConnection}
          disabled={isLoading || !url || url === currentUrl && testStatus === 'success'}
        >
          {isLoading ? 'Testing...' : (currentUrl === url && testStatus === 'success' ? 'Connected' : 'Connect & Test')}
          <Zap className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
};
