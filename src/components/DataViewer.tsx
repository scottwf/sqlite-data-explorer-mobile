
import React, { useState, useEffect } from 'react';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table as TableIcon } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { QueryEditor } from './QueryEditor';
import { CrudOperations } from './CrudOperations';
import { CellViewer } from './CellViewer';
import { TableControls } from './TableControls';
import { DataTable } from './DataTable';

interface Column {
  name: string;
  type: string;
  notnull: boolean;
  pk: boolean;
}

interface TableInfo {
  name: string;
  columns: Column[];
  rowCount: number;
}

interface DataViewerProps {
  database: any;
  tableName: string;
  tableInfo?: TableInfo;
  allTables?: TableInfo[];
}

interface SortConfig {
  column: string;
  direction: 'asc' | 'desc';
}

export const DataViewer: React.FC<DataViewerProps> = ({
  database,
  tableName,
  tableInfo,
  allTables = []
}) => {
  const [data, setData] = useState<any[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  const [pageSize] = useState(50);
  const [totalRows, setTotalRows] = useState(0);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showQueryEditor, setShowQueryEditor] = useState(false);
  const [isQueryMode, setIsQueryMode] = useState(false);
  const [selectedCellContent, setSelectedCellContent] = useState<string | null>(null);
  const [selectedColumnName, setSelectedColumnName] = useState<string>('');
  const [isCellDialogOpen, setIsCellDialogOpen] = useState(false);
  
  const { toast } = useToast();

  useEffect(() => {
    if (!database || !tableName) return;
    
    setCurrentPage(1);
    setSearchTerm('');
    setSortConfig(null);
    setIsQueryMode(false);
    loadData();
  }, [database, tableName]);

  useEffect(() => {
    loadData();
  }, [searchTerm, currentPage, sortConfig]);

  const loadData = () => {
    if (!database || !tableName || isQueryMode) return;

    try {
      // Build query with search, sort, and pagination
      let query = `SELECT * FROM ${tableName}`;
      let countQuery = `SELECT COUNT(*) FROM ${tableName}`;
      
      // Add search filtering
      if (searchTerm) {
        const searchConditions = tableInfo?.columns
          .map(col => `${col.name} LIKE '%${searchTerm}%'`)
          .join(' OR ');
        
        if (searchConditions) {
          query += ` WHERE ${searchConditions}`;
          countQuery += ` WHERE ${searchConditions}`;
        }
      }
      
      // Add sorting
      if (sortConfig) {
        query += ` ORDER BY ${sortConfig.column} ${sortConfig.direction.toUpperCase()}`;
      }
      
      // Add pagination
      const offset = (currentPage - 1) * pageSize;
      query += ` LIMIT ${pageSize} OFFSET ${offset}`;

      // Execute queries
      const result = database.exec(query)[0];
      const countResult = database.exec(countQuery)[0];
      
      if (result) {
        setColumns(result.columns);
        setData(result.values);
      } else {
        setColumns([]);
        setData([]);
      }
      
      if (countResult) {
        setTotalRows(countResult.values[0][0] as number);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      setData([]);
      setColumns([]);
      setTotalRows(0);
    }
  };

  const handleQueryResult = (result: any[]) => {
    setData(result);
    setIsQueryMode(true);
    setTotalRows(result.length);
    setCurrentPage(1);
  };

  const handleQueryColumns = (queryColumns: string[]) => {
    setColumns(queryColumns);
  };

  const handleDataChange = () => {
    loadData();
  };

  const handleSort = (column: string) => {
    setSortConfig(current => {
      if (current?.column === column) {
        return current.direction === 'asc' 
          ? { column, direction: 'desc' }
          : null;
      }
      return { column, direction: 'asc' };
    });
    setCurrentPage(1);
  };

  const handleCellClick = (fullValue: string, columnName: string) => {
    setSelectedCellContent(fullValue);
    setSelectedColumnName(columnName);
    setIsCellDialogOpen(true);
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const copyToClipboard = async (text: string, description: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: `${description} copied to clipboard`,
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Could not copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const handleCopyRow = (row: any[]) => {
    const rowText = row.join('\t');
    copyToClipboard(rowText, 'Row data');
  };

  const handleCopyColumn = (columnIndex: number) => {
    const columnData = data.map(row => row[columnIndex]).join('\n');
    copyToClipboard(columnData, `Column "${columns[columnIndex]}"`);
  };

  const totalPages = Math.ceil(totalRows / pageSize);

  const containerClasses = isFullScreen 
    ? "fixed inset-0 z-50 bg-white p-6 overflow-auto"
    : "p-6";

  return (
    <div className={containerClasses}>
      <CardHeader className="px-0 pt-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-2 text-xl">
            <TableIcon className="h-6 w-6 text-blue-600" />
            {isQueryMode ? 'Query Results' : tableName}
            <Badge variant="secondary" className="ml-2">
              {totalRows} rows
            </Badge>
          </CardTitle>
          
          <TableControls
            searchTerm={searchTerm}
            onSearchChange={handleSearchChange}
            showQueryEditor={showQueryEditor}
            onToggleQueryEditor={() => setShowQueryEditor(!showQueryEditor)}
            isFullScreen={isFullScreen}
            onToggleFullScreen={() => setIsFullScreen(!isFullScreen)}
            totalRows={totalRows}
            isQueryMode={isQueryMode}
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
          />
        </div>
      </CardHeader>

      <CardContent className="px-0">
        {showQueryEditor && (
          <QueryEditor
            database={database}
            onQueryResult={handleQueryResult}
            onQueryColumns={handleQueryColumns}
            tableInfo={allTables}
          />
        )}

        {!isQueryMode && tableInfo && (
          <CrudOperations
            database={database}
            tableName={tableName}
            columns={tableInfo.columns}
            onDataChange={handleDataChange}
          />
        )}

        <DataTable
          data={data}
          columns={columns}
          tableInfo={tableInfo}
          isQueryMode={isQueryMode}
          sortConfig={sortConfig}
          onSort={handleSort}
          onCellClick={handleCellClick}
          onCopyRow={handleCopyRow}
          onCopyColumn={handleCopyColumn}
        />

        <TableControls
          searchTerm={searchTerm}
          onSearchChange={handleSearchChange}
          showQueryEditor={showQueryEditor}
          onToggleQueryEditor={() => setShowQueryEditor(!showQueryEditor)}
          isFullScreen={isFullScreen}
          onToggleFullScreen={() => setIsFullScreen(!isFullScreen)}
          totalRows={totalRows}
          isQueryMode={isQueryMode}
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
        />

        {data.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            {searchTerm ? 'No data found matching your search.' : 'No data available.'}
          </div>
        )}
      </CardContent>

      <CellViewer
        isOpen={isCellDialogOpen}
        onClose={() => setIsCellDialogOpen(false)}
        content={selectedCellContent || ''}
        columnName={selectedColumnName}
      />
    </div>
  );
};
