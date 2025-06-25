
/**
 * TableRow Component
 * 
 * Purpose: Renders individual table rows with cells and optional action buttons.
 * Handles row-level interactions like copying and CRUD operations.
 * 
 * Features:
 * - Row hover effects
 * - Copy row functionality
 * - Integration with CRUD operations
 * - Responsive action button visibility
 */

import React from 'react';
import { Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RowActions } from '../CrudOperations';
import { TableCell } from './TableCell';

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

interface TableRowProps {
  row: any[];
  rowIndex: number;
  columns: string[];
  tableInfo?: TableInfo;
  isQueryMode: boolean;
  lockedColumns: Set<number>;
  onCellClick: (content: string, columnName: string) => void;
  onCopyRow: (row: any[]) => void;
}

export const TableRow: React.FC<TableRowProps> = ({
  row,
  rowIndex,
  columns,
  tableInfo,
  isQueryMode,
  lockedColumns,
  onCellClick,
  onCopyRow
}) => {
  return (
    <tr className="hover:bg-gray-50 transition-colors group">
      {row.map((cell: any, cellIndex: number) => (
        <TableCell
          key={cellIndex}
          cell={cell}
          columnIndex={cellIndex}
          columnName={columns[cellIndex]}
          lockedColumns={lockedColumns}
          onCellClick={onCellClick}
        />
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
  );
};
