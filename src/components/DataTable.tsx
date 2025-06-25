
import React, { useState } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown, Key, Hash, Copy, Lock, Unlock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast";
import { RowActions } from './CrudOperations';

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

interface SortConfig {
  column: string;
  direction: 'asc' | 'desc';
}

interface DataTableProps {
  data: any[][];
  columns: string[];
  tableInfo?: TableInfo;
  isQueryMode: boolean;
  sortConfig: SortConfig | null;
  onSort: (column: string) => void;
  onCellClick: (content: string, columnName: string) => void;
  onCopyRow: (row: any[]) => void;
  onCopyColumn: (columnIndex: number) => void;
}

export const DataTable: React.FC<DataTableProps> = ({
  data,
  columns,
  tableInfo,
  isQueryMode,
  sortConfig,
  onSort,
  onCellClick,
  onCopyRow,
  onCopyColumn
}) => {
  const { toast } = useToast();
  const [lockedColumns, setLockedColumns] = useState<Set<number>>(new Set());
  const CELL_TRUNCATE_LENGTH = 100;

  const toggleColumnLock = (columnIndex: number) => {
    setLockedColumns(prev => {
      const newSet = new Set(prev);
      if (newSet.has(columnIndex)) {
        newSet.delete(columnIndex);
      } else {
        newSet.add(columnIndex);
      }
      return newSet;
    });
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

  const formatCellValue = (value: any, truncateLength: number = CELL_TRUNCATE_LENGTH) => {
    const fullValue = String(value);
    if (value === null || value === undefined) {
      return { display: <span className="text-gray-400 italic">NULL</span>, isTruncated: false, fullValue: "NULL" };
    }
    if (typeof value === 'object') {
      try {
        const jsonString = JSON.stringify(value, null, 2);
        if (jsonString.length > truncateLength) {
          return { display: jsonString.substring(0, truncateLength) + '...', isTruncated: true, fullValue: jsonString };
        }
        return { display: jsonString, isTruncated: false, fullValue: jsonString };
      } catch {
        const strVal = String(value);
        if (strVal.length > truncateLength) {
          return { display: strVal.substring(0, truncateLength) + '...', isTruncated: true, fullValue: strVal };
        }
        return { display: strVal, isTruncated: false, fullValue: strVal };
      }
    }

    const strValue = String(value);
    if (strValue.length > truncateLength) {
      return { display: strValue.substring(0, truncateLength) + '...', isTruncated: true, fullValue: strValue };
    }
    return { display: strValue, isTruncated: false, fullValue: strValue };
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

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="overflow-auto max-h-[70vh]">
        <table className="w-full relative">
          <thead className="bg-gray-50 border-b sticky top-0 z-10">
            <tr>
              {columns.map((column, index) => (
                <th
                  key={column}
                  className={`px-4 py-3 text-left text-sm font-medium text-gray-900 cursor-pointer hover:bg-gray-100 transition-colors group ${
                    lockedColumns.has(index) ? 'sticky bg-gray-100 z-20 shadow-lg' : ''
                  }`}
                  style={lockedColumns.has(index) ? { left: `${Array.from(lockedColumns).filter(i => i < index).length * 200}px` } : {}}
                  onClick={() => !isQueryMode && onSort(column)}
                >
                  <div className="flex items-center justify-between min-w-[150px]">
                    <div className="flex items-center gap-2">
                      {getColumnIcon(column)}
                      <span className="truncate">{column}</span>
                      {!isQueryMode && getSortIcon(column)}
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleColumnLock(index);
                        }}
                        title={lockedColumns.has(index) ? 'Unlock column' : 'Lock column'}
                      >
                        {lockedColumns.has(index) ? <Lock className="h-3 w-3 text-blue-600" /> : <Unlock className="h-3 w-3" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onCopyColumn(index);
                        }}
                        title="Copy column"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </th>
              ))}
              {!isQueryMode && tableInfo && (
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 sticky top-0 bg-gray-50">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className="hover:bg-gray-50 transition-colors group"
              >
                {row.map((cell: any, cellIndex: number) => (
                  <td
                    key={cellIndex}
                    className={`px-4 py-3 text-sm text-gray-900 max-w-xs overflow-hidden text-ellipsis whitespace-nowrap relative ${
                      lockedColumns.has(cellIndex) ? 'sticky bg-white z-10 shadow-lg' : ''
                    }`}
                    style={lockedColumns.has(cellIndex) ? { left: `${Array.from(lockedColumns).filter(i => i < cellIndex).length * 200}px` } : {}}
                    title={typeof cell === 'string' && cell.length > CELL_TRUNCATE_LENGTH ? String(cell) : undefined}
                  >
                    {(() => {
                      const { display, isTruncated, fullValue } = formatCellValue(cell);
                      if (isTruncated) {
                        return (
                          <span
                            className="cursor-pointer hover:underline"
                            onClick={() => onCellClick(fullValue, columns[cellIndex])}
                          >
                            {display}
                          </span>
                        );
                      }
                      return (
                        <span
                          className="cursor-pointer hover:underline"
                          onClick={() => onCellClick(fullValue, columns[cellIndex])}
                        >
                          {display}
                        </span>
                      );
                    })()}
                  </td>
                ))}
                {!isQueryMode && tableInfo && (
                  <td className="px-4 py-3 sticky right-0 bg-white">
                    <div className="flex items-center gap-2">
                      <RowActions
                        row={row}
                        onEdit={(row) => {
                          // This will be handled by the CrudOperations component
                        }}
                        onDelete={(row) => {
                          // This will be handled by the CrudOperations component
                        }}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => onCopyRow(row)}
                        title="Copy row"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
