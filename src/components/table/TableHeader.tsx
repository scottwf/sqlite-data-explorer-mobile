
/**
 * TableHeader Component
 * 
 * Purpose: Renders the sticky table header with sortable columns, column locking,
 * and copy functionality. Handles column icons (primary key indicators) and 
 * provides visual feedback for sorting state.
 * 
 * Features:
 * - Sticky positioning for better UX during scrolling
 * - Column locking with visual indicators
 * - Sort functionality with directional icons
 * - Copy column data functionality
 * - Primary key and column type indicators
 */

import React from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown, Key, Hash, Copy, Lock, Unlock } from 'lucide-react';
import { Button } from '@/components/ui/button';

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

interface TableHeaderProps {
  columns: string[];
  tableInfo?: TableInfo;
  isQueryMode: boolean;
  sortConfig: SortConfig | null;
  lockedColumns: Set<number>;
  onSort: (column: string) => void;
  onToggleColumnLock: (columnIndex: number) => void;
  onCopyColumn: (columnIndex: number) => void;
}

export const TableHeader: React.FC<TableHeaderProps> = ({
  columns,
  tableInfo,
  isQueryMode,
  sortConfig,
  lockedColumns,
  onSort,
  onToggleColumnLock,
  onCopyColumn
}) => {
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

  return (
    <thead className="bg-gray-50 border-b sticky top-0 z-10">
      <tr>
        {columns.map((column, index) => (
          <th
            key={column}
            className={`px-4 py-3 text-left text-sm font-medium text-gray-900 cursor-pointer hover:bg-gray-100 transition-colors group ${
              lockedColumns.has(index) ? 'sticky z-20 shadow-lg' : ''
            }`}
            style={lockedColumns.has(index) ? { 
              left: `${Array.from(lockedColumns).filter(i => i < index).length * 200}px`,
              backgroundColor: lockedColumns.has(index) ? '#f3f4f6' : undefined
            } : {}}
            onClick={() => !isQueryMode && onSort(column)}
          >
            <div className="flex items-center justify-between min-w-[150px]">
              <div className="flex items-center gap-2">
                {getColumnIcon(column)}
                <span className="truncate">{column}</span>
                {!isQueryMode && getSortIcon(column)}
              </div>
              <div className={`flex items-center gap-1 transition-opacity ${
                lockedColumns.has(index) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
              }`}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleColumnLock(index);
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
  );
};
