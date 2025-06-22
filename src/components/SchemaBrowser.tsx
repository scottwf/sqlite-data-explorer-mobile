
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, Key, Hash, Type } from 'lucide-react';

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

interface SchemaBrowserProps {
  tables: TableInfo[];
  selectedTable: string;
  onTableSelect: (tableName: string) => void;
}

export const SchemaBrowser: React.FC<SchemaBrowserProps> = ({
  tables,
  selectedTable,
  onTableSelect
}) => {
  return (
    <div className="p-4">
      <CardHeader className="px-0 pt-0">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Table className="h-5 w-5 text-blue-600" />
          Schema Browser
        </CardTitle>
      </CardHeader>
      <CardContent className="px-0 space-y-3">
        {tables.map((table) => (
          <div
            key={table.name}
            className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
              selectedTable === table.name
                ? 'bg-blue-50 border-blue-200 shadow-sm'
                : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300'
            }`}
            onClick={() => onTableSelect(table.name)}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Table className="h-4 w-4" />
                {table.name}
              </h3>
              <Badge variant="secondary" className="text-xs">
                {table.rowCount} rows
              </Badge>
            </div>
            
            <div className="space-y-1.5">
              {table.columns.slice(0, 3).map((column) => (
                <div
                  key={column.name}
                  className="flex items-center gap-2 text-xs text-gray-600"
                >
                  {column.pk ? (
                    <Key className="h-3 w-3 text-amber-500" />
                  ) : (
                    <Hash className="h-3 w-3 text-gray-400" />
                  )}
                  <span className="font-medium">{column.name}</span>
                  <span className="text-gray-500">({column.type})</span>
                  {column.notnull && (
                    <Badge variant="outline" className="text-xs px-1 py-0">
                      NOT NULL
                    </Badge>
                  )}
                </div>
              ))}
              {table.columns.length > 3 && (
                <div className="text-xs text-gray-500 mt-1">
                  +{table.columns.length - 3} more columns
                </div>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </div>
  );
};
