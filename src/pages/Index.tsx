
import React, { useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, Database } from 'lucide-react';
import { SchemaBrowser } from '@/components/SchemaBrowser';
import { DataViewer } from '@/components/DataViewer';
import { DatabaseUpload } from '@/components/DatabaseUpload';
import { useToast } from '@/hooks/use-toast';

interface DatabaseInfo {
  name: string;
  tables: Array<{
    name: string;
    columns: Array<{
      name: string;
      type: string;
      notnull: boolean;
      pk: boolean;
    }>;
    rowCount: number;
  }>;
}

const Index = () => {
  const [database, setDatabase] = useState<any>(null);
  const [databaseInfo, setDatabaseInfo] = useState<DatabaseInfo | null>(null);
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [activeTab, setActiveTab] = useState<'schema' | 'data'>('schema');
  const { toast } = useToast();

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleDatabaseLoad = useCallback((db: any, info: DatabaseInfo) => {
    setDatabase(db);
    setDatabaseInfo(info);
    if (info.tables.length > 0) {
      setSelectedTable(info.tables[0].name);
      setActiveTab('data');
    }
    toast({
      title: "Database loaded successfully",
      description: `Found ${info.tables.length} tables`,
    });
  }, [toast]);

  const handleTableSelect = useCallback((tableName: string) => {
    setSelectedTable(tableName);
    if (isMobile) {
      setActiveTab('data');
    }
  }, [isMobile]);

  if (!database) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8 pt-12">
            <div className="flex items-center justify-center mb-4">
              <Database className="h-12 w-12 text-blue-600 mr-3" />
              <h1 className="text-4xl font-bold text-gray-900">SQLite Viewer</h1>
            </div>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Upload and explore your SQLite databases with powerful search, filtering, and sorting capabilities
            </p>
          </div>
          
          <Card className="max-w-2xl mx-auto p-8 shadow-lg border-0 bg-white/80 backdrop-blur">
            <DatabaseUpload onDatabaseLoad={handleDatabaseLoad} />
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Database className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">SQLite Viewer</h1>
                <p className="text-sm text-gray-500">{databaseInfo?.name}</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setDatabase(null);
                setDatabaseInfo(null);
                setSelectedTable('');
              }}
              className="flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              New Database
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Tabs */}
      {isMobile && (
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

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-4">
        <div className={`grid gap-6 ${isMobile ? 'grid-cols-1' : 'grid-cols-12'}`}>
          {/* Schema Browser */}
          <div className={`${
            isMobile 
              ? activeTab === 'schema' ? 'block' : 'hidden'
              : 'col-span-3'
          }`}>
            <Card className="h-fit sticky top-24 shadow-lg border-0 bg-white/80 backdrop-blur">
              <SchemaBrowser
                tables={databaseInfo?.tables || []}
                selectedTable={selectedTable}
                onTableSelect={handleTableSelect}
              />
            </Card>
          </div>

          {/* Data Viewer */}
          <div className={`${
            isMobile 
              ? activeTab === 'data' ? 'block' : 'hidden'
              : 'col-span-9'
          }`}>
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur">
              {selectedTable && database && (
                <DataViewer
                  database={database}
                  tableName={selectedTable}
                  tableInfo={databaseInfo?.tables.find(t => t.name === selectedTable)}
                />
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
