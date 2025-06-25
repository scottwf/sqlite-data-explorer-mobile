
/**
 * TableCell Component
 * 
 * Purpose: Renders individual table cells with proper formatting, truncation,
 * and click handling. Supports various data types including JSON objects
 * and handles null/undefined values with appropriate styling.
 * 
 * Features:
 * - Smart content truncation with full content preview on click
 * - JSON formatting and display
 * - NULL value indicators
 * - Hover effects and click interactions
 * - Support for locked column positioning
 */

import React from 'react';

interface TableCellProps {
  cell: any;
  columnIndex: number;
  columnName: string;
  lockedColumns: Set<number>;
  onCellClick: (content: string, columnName: string) => void;
}

const CELL_TRUNCATE_LENGTH = 100;

export const TableCell: React.FC<TableCellProps> = ({
  cell,
  columnIndex,
  columnName,
  lockedColumns,
  onCellClick
}) => {
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

  const { display, fullValue } = formatCellValue(cell);

  return (
    <td
      className={`px-4 py-3 text-sm text-gray-900 max-w-xs overflow-hidden text-ellipsis whitespace-nowrap relative ${
        lockedColumns.has(columnIndex) ? 'sticky bg-white z-10 shadow-lg' : ''
      }`}
      style={lockedColumns.has(columnIndex) ? { left: `${Array.from(lockedColumns).filter(i => i < columnIndex).length * 200}px` } : {}}
      title={typeof cell === 'string' && cell.length > CELL_TRUNCATE_LENGTH ? String(cell) : undefined}
    >
      <span
        className="cursor-pointer hover:underline"
        onClick={() => onCellClick(fullValue, columnName)}
      >
        {display}
      </span>
    </td>
  );
};
