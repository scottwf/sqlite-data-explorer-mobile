
/**
 * DataTable Component
 * 
 * Purpose: Main data table component that orchestrates the display of tabular data
 * with advanced features like sorting, column locking, and copy functionality.
 * Serves as the container for table header and rows.
 * 
 * Features:
 * - Sticky table headers for better UX
 * - Column locking and unlocking
 * - Sort functionality with visual indicators
 * - Copy operations (rows and columns)
 * - Responsive design with scroll handling
 * - Integration with CRUD operations
 * 
 * Routes: Used in DataViewer component for displaying database table data
 */

import React, { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { TableHeader } from './table/TableHeader';
import { TableRow } from './table/TableRow';

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

  const handleCopyColumn = (columnIndex: number) => {
    const columnData = data.map(row => row[columnIndex]).join('\n');
    copyToClipboard(columnData, `Column "${columns[columnIndex]}"`);
    onCopyColumn(columnIndex);
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="overflow-auto max-h-[70vh]">
        <table className="w-full relative">
          <TableHeader
            columns={columns}
            tableInfo={tableInfo}
            isQueryMode={isQueryMode}
            sortConfig={sortConfig}
            lockedColumns={lockedColumns}
            onSort={onSort}
            onToggleColumnLock={toggleColumnLock}
            onCopyColumn={handleCopyColumn}
          />
          <tbody className="divide-y divide-gray-200">
            {data.map((row, rowIndex) => (
              <TableRow
                key={rowIndex}
                row={row}
                rowIndex={rowIndex}
                columns={columns}
                tableInfo={tableInfo}
                isQueryMode={isQueryMode}
                lockedColumns={lockedColumns}
                onCellClick={onCellClick}
                onCopyRow={onCopyRow}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
