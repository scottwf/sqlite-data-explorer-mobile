
import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import initSqlJs from 'sql.js';

interface DatabaseUploadProps {
  onDatabaseLoad: (database: any, info: any) => void;
}

export const DatabaseUpload: React.FC<DatabaseUploadProps> = ({ onDatabaseLoad }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Show loading toast for large files
    const loadingToast = toast({
      title: "Loading database...",
      description: `Processing ${file.name} (${Math.round(file.size / 1024 / 1024)}MB)`,
    });

    try {
      console.log('Initializing SQL.js...');
      const SQL = await initSqlJs({
        locateFile: (file) => `https://sql.js.org/dist/${file}`
      });

      console.log('Reading file...');
      const arrayBuffer = await file.arrayBuffer();
      console.log('Creating database instance...');
      const db = new SQL.Database(new Uint8Array(arrayBuffer));

      console.log('Getting database schema...');
      // Get database schema information
      const tables = db.exec(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name NOT LIKE 'sqlite_%'
        ORDER BY name
      `)[0];

      if (!tables || tables.values.length === 0) {
        toast({
          title: "No tables found",
          description: "The database appears to be empty or invalid",
          variant: "destructive"
        });
        return;
      }

      console.log(`Found ${tables.values.length} tables`);
      const databaseInfo = {
        name: file.name,
        tables: await Promise.all(
          tables.values.map(async ([tableName]) => {
            // Get column information
            const columnInfo = db.exec(`PRAGMA table_info(${tableName})`)[0];
            
            // Get row count
            const rowCountResult = db.exec(`SELECT COUNT(*) FROM ${tableName}`)[0];
            const rowCount = rowCountResult?.values[0]?.[0] || 0;

            return {
              name: tableName as string,
              rowCount: rowCount as number,
              columns: columnInfo.values.map(([, name, type, notnull, , pk]) => ({
                name: name as string,
                type: type as string,
                notnull: Boolean(notnull),
                pk: Boolean(pk)
              }))
            };
          })
        )
      };

      console.log('Database loaded successfully:', databaseInfo);
      onDatabaseLoad(db, databaseInfo);
    } catch (error) {
      console.error('Error loading database:', error);
      toast({
        title: "Error loading database",
        description: "Please make sure the file is a valid SQLite database",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="text-center space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold text-gray-900">Upload SQLite Database</h2>
        <p className="text-gray-600">
          Select a .db, .sqlite, or .sqlite3 file to explore its contents
        </p>
      </div>

      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 hover:border-blue-500 transition-colors">
        <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <div className="space-y-4">
          <p className="text-gray-500">
            Drag and drop your SQLite file here, or click to browse
          </p>
          <Button
            onClick={() => fileInputRef.current?.click()}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Upload className="h-4 w-4 mr-2" />
            Choose File
          </Button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".db,.sqlite,.sqlite3"
        onChange={handleFileUpload}
        className="hidden"
      />

      <div className="text-sm text-gray-500 space-y-1">
        <p>Supported formats: .db, .sqlite, .sqlite3</p>
        <p>All processing happens locally in your browser</p>
        <p>Large files may take a moment to load</p>
      </div>
    </div>
  );
};
