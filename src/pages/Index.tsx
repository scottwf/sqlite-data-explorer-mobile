
import React, { useState, useCallback, useMemo, useEffect } from 'react'; // Added useMemo, useEffect
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'; // Added more Card components
import { Button } from '@/components/ui/button';
import { Upload, Database, Settings, X, Server, WifiOff, ChevronLeft, ChevronRight } from 'lucide-react'; // Added Settings, X, Server, WifiOff, Chevrons
import { SchemaBrowser } from '@/components/SchemaBrowser';
import { DataViewer } from '@/components/DataViewer';
import { DatabaseUpload } from '@/components/DatabaseUpload';
import { useToast } from '@/hooks/use-toast';
import { RemoteDatabaseConfig } from "@/components/RemoteDatabaseConfig"; // Added
import RemoteDatabaseManager from "@/services/RemoteDatabaseManager"; // Added
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"; // Added
import { Label } from '@/components/ui/label'; // Added
import type { Database as SqlJsDatabase } from 'sql.js'; // Added for typing sql.js database instance
// import { Sidebar, SidebarContent, SidebarTrigger, SidebarClose, SidebarHeader, SidebarFooter } from "@/components/ui/sidebar"; // Potentially for layout later
// import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"; // Potentially for layout later
// import { useMobile } from "@/hooks/use-mobile"; // Re-evaluate if needed, initial Index.tsx had its own isMobile

interface ColumnInfo { // Added ColumnInfo for completeness from previous attempt
  name: string;
  type: string;
  notnull: boolean;
  pk: boolean;
}

interface TableInfo { // Modified TableInfo from previous attempt
  name: string;
  columns: ColumnInfo[];
  rowCount: number;
}

interface DatabaseInfo {
  name: string;
  // tables: Array<{ // Original structure
  //   name: string;
  //   columns: Array<{
  //     name: string;
  //     type: string;
  //     notnull: boolean;
  //     pk: boolean;
  //   }>;
  //   rowCount: number;
  // }>;
  tables: TableInfo[]; // Using the more detailed TableInfo
}

type ConnectionMode = "local" | "remote"; // Added
// The following block was erroneously duplicated here from the original DatabaseInfo interface
// tables: Array<{
// name: string;
// columns: Array<{
// name: string;
// type: string;
// notnull: boolean;
// pk: boolean;
// }>;
// rowCount: number;
// }>;
// } // This closing brace also caused a syntax error.

const Index = () => {
  const [database, setDatabase] = useState<SqlJsDatabase | null>(null); // Typed SqlJsDatabase
  const [databaseInfo, setDatabaseInfo] = useState<DatabaseInfo | null>(null);
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [activeTab, setActiveTab] = useState<'schema' | 'data'>('schema'); // For mobile view
  const { toast } = useToast();

  // Settings and Connection State
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [ollamaUrl, setOllamaUrl] = useState<string>(localStorage.getItem("ollamaUrl") || "http://localhost:11434"); // Default Ollama URL
  const [connectionMode, setConnectionMode] = useState<ConnectionMode>("local");
  const [isRemoteConnected, setIsRemoteConnected] = useState<boolean>(false);
  const [remoteDbUrl, setRemoteDbUrl] = useState<string | undefined>(undefined);

  const remoteDbManager = useMemo(() => new RemoteDatabaseManager(), []);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Load initial remote config if present
  useEffect(() => {
    const config = remoteDbManager.getConnectionConfig();
    if (config && config.url) {
      // We don't automatically connect or switch mode, just pre-fill and flag
      // User must explicitly connect via settings
      setRemoteDbUrl(config.url);
      // setIsRemoteConnected(true); // This should be set by a successful test/connect action
    }
  }, [remoteDbManager]);


  useEffect(() => {
    localStorage.setItem("ollamaUrl", ollamaUrl);
  }, [ollamaUrl]);


  const handleDatabaseLoad = useCallback((db: SqlJsDatabase, info: DatabaseInfo) => { // Typed db parameter
    setDatabase(db);
    setDatabaseInfo(info);
    if (info.tables.length > 0) {
      setSelectedTable(info.tables[0].name);
      setActiveTab(isMobile ? 'data' : 'schema'); // Keep schema for desktop, data for mobile
    }
    // This handler is for LOCAL files.
    setConnectionMode("local"); // Explicitly set to local mode on local file upload
    setIsRemoteConnected(false); // Ensure remote is disconnected
    toast({
      title: "Local Database Loaded",
      description: `${info.name} loaded with ${info.tables.length} tables.`,
    });
  }, [toast, isMobile]);

  const handleTableSelect = useCallback((tableName: string) => {
    setSelectedTable(tableName);
    if (isMobile) {
      setActiveTab('data');
    }
  }, [isMobile]);

  const handleResetApp = useCallback(() => {
    setDatabase(null);
    setDatabaseInfo(null);
    setSelectedTable('');
    // Do not clear remoteDbManager config here, only UI state
    // Do not change connectionMode here, user does that in settings
    toast({
      title: "View Cleared",
      description: "Database view has been reset.",
    });
  }, [toast]);

  const handleRemoteConnectionChange = useCallback((isConnected: boolean, url?: string) => {
    setIsRemoteConnected(isConnected);
    setRemoteDbUrl(url);
    if (isConnected && url) {
      // If connected remotely, clear any local DB
      setDatabase(null);
      setDatabaseInfo(null);
      setSelectedTable('');
      setConnectionMode("remote"); // Switch to remote mode
      toast({
        title: "Remote Connection Active",
        description: `Connected to ${url}.`,
      });
    } else if (!isConnected && connectionMode === "remote") {
      // If was remote and now disconnected, clear remote data and potentially switch to local
      // For now, just show disconnected state. User can switch to local mode via settings.
      toast({
        title: "Remote Connection Lost/Ended",
        description: "Disconnected from remote server.",
        variant: "destructive",
      });
    }
  }, [toast, connectionMode]);


  // Determine what to show in the main area
  const renderMainContent = () => {
    if (connectionMode === 'local') {
      if (!database) {
        return (
          <div className="flex flex-col items-center justify-center h-full p-4 md:p-6">
            <Card className="max-w-2xl w-full mx-auto p-8 shadow-lg border-0 bg-white/80 backdrop-blur">
              <DatabaseUpload onDatabaseLoad={handleDatabaseLoad} />
            </Card>
          </div>
        );
      }
      // If local DB is loaded, show schema/data (handled by existing layout below)
      return null;
    }

    if (connectionMode === 'remote') {
      if (!isRemoteConnected || !remoteDbUrl) {
        return (
          <div className="flex flex-col items-center justify-center h-full p-4 md:p-6 text-center">
            <WifiOff className="h-16 w-16 text-gray-400 mb-4" />
            <h2 className="text-2xl font-semibold">Remote Server Disconnected</h2>
            <p className="text-gray-500 mb-4">
              Configure and connect to a remote database server via Settings.
            </p>
            <Button onClick={() => setIsSettingsOpen(true)}>
              <Settings className="mr-2 h-4 w-4" /> Configure Connection
            </Button>
          </div>
        );
      }
      // Remote and connected: Phase 2 will handle loading remote DBs.
      // For now, show a placeholder or specific UI for remote DB selection.
      // If a remote DB *were* loaded, databaseInfo would be populated.
      if (!databaseInfo) { // Assuming databaseInfo is cleared when switching to remote or disconnecting
        return (
          <div className="flex flex-col items-center justify-center h-full text-center p-4 md:p-6">
            <Server className="h-16 w-16 text-green-500 mb-4" />
            <h2 className="text-2xl font-semibold">Connected to Remote Server</h2>
            <p className="text-gray-500">
              {remoteDbUrl ? new URL(remoteDbUrl).hostname : 'Remote Server'}.
            </p>
            <p className="text-gray-600 mt-2">
              Database loading from remote server will be implemented in Phase 2.
            </p>
            {/* Placeholder for future remote database list/loader */}
          </div>
        );
      }
      // If remote DB *is* loaded, show schema/data (handled by existing layout)
      return null;
    }
    return null; // Should not happen
  };


  const mainContent = renderMainContent();
  const showDatabaseView = (connectionMode === 'local' && database && databaseInfo) ||
                           (connectionMode === 'remote' && isRemoteConnected && database && databaseInfo);


  const ActiveConnectionIcon = connectionMode === 'remote' ? (isRemoteConnected ? Server : WifiOff) : Upload;
  const connectionStatusText = connectionMode === 'remote'
    ? (isRemoteConnected && remoteDbUrl ? `Remote: ${new URL(remoteDbUrl).hostname}` : 'Remote: Disconnected')
    : (databaseInfo ? `Local: ${databaseInfo.name}` : 'Local Mode');


  // Initial screen if no mode decided or nothing loaded.
  // This replaces the original `if (!database)` block
  if (!showDatabaseView && mainContent) {
     return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 flex flex-col">
        {/* Simplified Header for initial/disconnected states */}
        <div className="bg-white/80 backdrop-blur border-b border-gray-200 py-4 px-4 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
             <div className="flex items-center">
                <Database className="h-8 w-8 text-blue-600 mr-3" />
                <h1 className="text-2xl font-bold text-gray-900">SQLite Viewer</h1>
              </div>
            <Button variant="outline" size="sm" onClick={() => setIsSettingsOpen(true)}>
              <Settings className="mr-2 h-4 w-4" /> Settings
            </Button>
          </div>
        </div>
        <div className="flex-grow flex items-center justify-center">
          {mainContent}
        </div>
         {/* Status Bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-gray-100 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 py-1.5 text-xs text-gray-700 dark:text-gray-300 flex items-center justify-between z-50">
          <div className="flex items-center">
            <ActiveConnectionIcon className={`h-4 w-4 mr-2 ${isRemoteConnected && connectionMode === 'remote' ? 'text-green-500' : 'text-gray-500'}`} />
            <span>{connectionStatusText}</span>
          </div>
          <div>{/* Other status info placeholder */}</div>
        </div>
         {isSettingsOpen && (
          <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
            <Card className="w-full max-w-lg bg-white dark:bg-gray-900 shadow-2xl">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Settings</CardTitle>
                  <Button variant="ghost" size="icon" onClick={() => setIsSettingsOpen(false)}>
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="connection" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="connection">Connection</TabsTrigger>
                    <TabsTrigger value="ollama">Ollama AI</TabsTrigger>
                  </TabsList>
                  <TabsContent value="connection">
                    <div className="space-y-3 mb-6">
                      <Label htmlFor="connectionMode">Connection Mode</Label>
                      <select
                        id="connectionMode"
                        value={connectionMode}
                        onChange={(e) => {
                          const newMode = e.target.value as ConnectionMode;
                          setConnectionMode(newMode);
                          if (newMode === 'local' && isRemoteConnected) {
                            // Optional: decide if switching to local should auto-disconnect remote
                            // remoteDbManager.clearConnectionConfig(); // Or just clear UI state:
                            // setIsRemoteConnected(false);
                            // setRemoteDbUrl(undefined);
                          } else if (newMode === 'remote' && database) {
                            // If switching to remote and a local DB is loaded, clear it
                            setDatabase(null);
                            setDatabaseInfo(null);
                            setSelectedTable('');
                          }
                        }}
                        className="w-full mt-1 block px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      >
                        <option value="local">Local File Mode</option>
                        <option value="remote">Remote Server Mode</option>
                      </select>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                          Choose to load SQLite files from your computer or connect to a remote server.
                      </p>
                    </div>
                    {connectionMode === 'remote' && (
                      <RemoteDatabaseConfig
                        remoteDbManager={remoteDbManager}
                        onConnectionChange={handleRemoteConnectionChange}
                      />
                    )}
                    {connectionMode === 'local' && (
                      <div className="text-sm text-muted-foreground p-4 border dark:border-gray-700 rounded-md bg-slate-50 dark:bg-gray-800">
                        <p>Currently in Local File Mode.</p>
                        <p className="mt-1">Upload an SQLite file directly from your computer using the main screen.</p>
                      </div>
                    )}
                  </TabsContent>
                  <TabsContent value="ollama">
                    <div>
                      <Label htmlFor="ollamaUrl" className="block text-sm font-medium">Ollama Server URL</Label>
                      <input
                        type="url"
                        id="ollamaUrl"
                        value={ollamaUrl}
                        onChange={(e) => setOllamaUrl(e.target.value)}
                        placeholder="http://localhost:11434"
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        URL for Ollama server (for AI-assisted query generation - feature external to this task).
                      </p>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button onClick={() => setIsSettingsOpen(false)}>Close</Button>
              </CardFooter>
            </Card>
          </div>
        )}
      </div>
    );
  }


  // This is the main view when a database (local or remote) is loaded and selected
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex flex-col">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Database className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">SQLite Viewer</h1>
                <p className="text-sm text-gray-500">
                  {connectionMode === 'local' && databaseInfo ? databaseInfo.name : ''}
                  {connectionMode === 'remote' && remoteDbUrl ? new URL(remoteDbUrl).hostname : ''}
                  {connectionMode === 'remote' && databaseInfo ? ` - ${databaseInfo.name}` : ''}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetApp}
                className="flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                Clear View
              </Button>
              <Button variant="outline" size="sm" onClick={() => setIsSettingsOpen(true)}>
                <Settings className="mr-2 h-4 w-4" /> Settings
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Tabs for Schema/Data Toggle */}
      {isMobile && showDatabaseView && (
        <div className="bg-white border-b border-gray-200">
          <div className="flex">
            <button
              onClick={() => setActiveTab('schema')}
              className={`flex-1 py-3 px-4 text-center font-medium transition-colors ${
                activeTab === 'schema'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Schema
            </button>
            <button
              onClick={() => setActiveTab('data')}
              className={`flex-1 py-3 px-4 text-center font-medium transition-colors ${
                activeTab === 'data'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Data
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area (Schema and Data Viewer) */}
      {showDatabaseView && (
        <div className="max-w-7xl mx-auto p-4 flex-grow w-full">
          <div className={`grid gap-6 ${isMobile ? 'grid-cols-1' : 'grid-cols-12'} h-full`}>
            {/* Schema Browser */}
            <div className={`${
              isMobile
                ? activeTab === 'schema' ? 'block' : 'hidden'
                : 'col-span-3'
            } ${isMobile ? '' : 'sticky top-[calc(theme(spacing.16)_+_1px)]'}`} // Adjust sticky top based on header height
               style={!isMobile ? { height: 'calc(100vh - 5rem - 32px)', overflowY: 'auto' } : {}} // Adjusted height
            >
              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur h-full">
                {databaseInfo && (
                  <SchemaBrowser
                    tables={databaseInfo.tables || []}
                    selectedTable={selectedTable}
                    onTableSelect={handleTableSelect}
                  />
                )}
              </Card>
            </div>

            {/* Data Viewer */}
            <div className={`${
              isMobile
                ? activeTab === 'data' ? 'block' : 'hidden'
                : 'col-span-9'
            } ${isMobile ? '' : ''}`}
               style={!isMobile ? { height: 'calc(100vh - 5rem - 32px)', overflowY: 'auto' } : {}} // Adjusted height
            >
              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur h-full">
                {selectedTable && database && databaseInfo && (
                  <DataViewer
                    database={database} // This will be null for remote until Phase 2/3
                    tableName={selectedTable}
                    tableInfo={databaseInfo.tables.find(t => t.name === selectedTable)}
                    allTables={databaseInfo.tables || []}
                    // Key props for DataViewer if it needs to re-render on remote changes later:
                    // key={connectionMode === 'remote' ? `${remoteDbUrl}-${selectedTable}` : selectedTable}
                  />
                )}
                {!selectedTable && databaseInfo && (
                   <div className="p-6 text-center text-gray-500">
                     Select a table from the schema browser to view its data.
                   </div>
                )}
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* Fallback for unexpected states or if mainContent is needed but not shown by showDatabaseView */}
      {!showDatabaseView && mainContent && (
         <div className="flex-grow flex items-center justify-center p-4">
           {mainContent}
         </div>
      )}


      {/* Settings Modal (re-uses same structure as above for consistency) */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <Card className="w-full max-w-lg bg-white dark:bg-gray-900 shadow-2xl">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Settings</CardTitle>
                <Button variant="ghost" size="icon" onClick={() => setIsSettingsOpen(false)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="connection" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="connection">Connection</TabsTrigger>
                  <TabsTrigger value="ollama">Ollama AI</TabsTrigger>
                </TabsList>
                <TabsContent value="connection">
                  <div className="space-y-3 mb-6">
                    <Label htmlFor="connectionModeSelectInModal">Connection Mode</Label> {/* Ensure unique ID if needed */}
                    <select
                      id="connectionModeSelectInModal"
                      value={connectionMode}
                      onChange={(e) => {
                        const newMode = e.target.value as ConnectionMode;
                        setConnectionMode(newMode);
                         if (newMode === 'local' && isRemoteConnected) {
                            // setIsRemoteConnected(false);
                            // setRemoteDbUrl(undefined);
                          } else if (newMode === 'remote' && database) {
                            setDatabase(null);
                            setDatabaseInfo(null);
                            setSelectedTable('');
                          }
                      }}
                      className="w-full mt-1 block px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                      <option value="local">Local File Mode</option>
                      <option value="remote">Remote Server Mode</option>
                    </select>
                     <p className="text-xs text-gray-500 dark:text-gray-400">
                        Choose to load SQLite files from your computer or connect to a remote server.
                    </p>
                  </div>
                  {connectionMode === 'remote' && (
                    <RemoteDatabaseConfig
                      remoteDbManager={remoteDbManager}
                      onConnectionChange={handleRemoteConnectionChange}
                    />
                  )}
                  {connectionMode === 'local' && (
                     <div className="text-sm text-muted-foreground p-4 border dark:border-gray-700 rounded-md bg-slate-50 dark:bg-gray-800">
                        <p>Currently in Local File Mode.</p>
                        <p className="mt-1">To connect to a remote server, switch Connection Mode to "Remote Server Mode". If you want to load a new local file, close settings and use the main screen if no database is loaded, or click "Clear View" then "Upload New".</p>
                      </div>
                  )}
                </TabsContent>
                <TabsContent value="ollama">
                  <div>
                    <Label htmlFor="ollamaUrlInputInModal">Ollama Server URL</Label> {/* Ensure unique ID */}
                    <input
                      type="url"
                      id="ollamaUrlInputInModal"
                      value={ollamaUrl}
                      onChange={(e) => setOllamaUrl(e.target.value)}
                      placeholder="http://localhost:11434"
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      URL for Ollama server (for AI-assisted query generation).
                    </p>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button onClick={() => setIsSettingsOpen(false)}>Close</Button>
            </CardFooter>
          </Card>
        </div>
      )}

      {/* Status Bar - ensure it's always at the bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-100 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 py-1.5 text-xs text-gray-700 dark:text-gray-300 flex items-center justify-between z-50">
        <div className="flex items-center">
          <ActiveConnectionIcon className={`h-4 w-4 mr-2 ${connectionMode === 'remote' && isRemoteConnected ? 'text-green-500' : 'text-gray-500'}`} />
          <span>{connectionStatusText}</span>
        </div>
        <div className="flex items-center">
          {databaseInfo && selectedTable && (
            <span className="mr-2 hidden sm:inline">Table: {selectedTable} ({databaseInfo.tables.find(t=>t.name === selectedTable)?.rowCount} rows)</span>
          )}
          <span className="hidden sm:inline">| UI v1.0</span>
          {/* Placeholder for version or other info */}
        </div>
      </div>
    </div>
  );
};

export default Index;
