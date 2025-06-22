import React, { useState, useEffect, useMemo } from 'react';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown,
  Table as TableIcon,
  Key,
  Hash,
  Maximize,
  Minimize,
  Code
} from 'lucide-react';
import { QueryEditor } from './QueryEditor';
import { CrudOperations, RowActions } from './CrudOperations';

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

  const getSortIcon = (column: string) => {
    if (sortConfig?.column !== column) {
      return <ArrowUpDown className="h-4 w-4 text-gray-400" />;
    }
    return sortConfig.direction === 'asc' 
      ? <ArrowUp className="h-4 w-4 text-blue-600" />
      : <ArrowDown className="h-4 w-4 text-blue-600" />;
  };

  const getColumnIcon = (columnName: string) => {
    const column = tableInfo?.columns.find(col => col.name === columnName);
    if (column?.pk) {
      return <Key className="h-3 w-3 text-amber-500" />;
    }
    return <Hash className="h-3 w-3 text-gray-400" />;
  };

  const formatCellValue = (value: any) => {
    if (value === null) return <span className="text-gray-400 italic">NULL</span>;
    if (typeof value === 'string' && value.length > 100) {
      return value.substring(0, 100) + '...';
    }
    return String(value);
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
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowQueryEditor(!showQueryEditor)}
            >
              <Code className="h-4 w-4 mr-2" />
              {showQueryEditor ? 'Hide' : 'Show'} Query Editor
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsFullScreen(!isFullScreen)}
            >
              {isFullScreen ? (
                <Minimize className="h-4 w-4 mr-2" />
              ) : (
                <Maximize className="h-4 w-4 mr-2" />
              )}
              {isFullScreen ? 'Exit' : 'Full Screen'}
            </Button>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search data..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10 w-64"
                disabled={isQueryMode}
              />
            </div>
          </div>
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

        {/* Table */}
        <div className="border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {columns.map((column) => (
                    <th
                      key={column}
                      className="px-4 py-3 text-left text-sm font-medium text-gray-900 cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => !isQueryMode && handleSort(column)}
                    >
                      <div className="flex items-center gap-2">
                        {getColumnIcon(column)}
                        <span>{column}</span>
                        {!isQueryMode && getSortIcon(column)}
                      </div>
                    </th>
                  ))}
                  {!isQueryMode && tableInfo && (
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data.map((row, rowIndex) => (
                  <tr
                    key={rowIndex}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    {row.map((cell: any, cellIndex: number) => (
                      <td
                        key={cellIndex}
                        className="px-4 py-3 text-sm text-gray-900 max-w-xs"
                      >
                        {formatCellValue(cell)}
                      </td>
                    ))}
                    {!isQueryMode && tableInfo && (
                      <td className="px-4 py-3">
                        <RowActions
                          row={row}
                          onEdit={(row) => {
                            // This will be handled by the CrudOperations component
                          }}
                          onDelete={(row) => {
                            // This will be handled by the CrudOperations component
                          }}
                        />
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-gray-700">
              Showing {(currentPage - 1) * pageSize + 1} to{' '}
              {Math.min(currentPage * pageSize, totalRows)} of {totalRows} results
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                      className="w-10"
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {data.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            {searchTerm ? 'No data found matching your search.' : 'No data available.'}
          </div>
        )}
      </CardContent>
    </div>
  );
};
