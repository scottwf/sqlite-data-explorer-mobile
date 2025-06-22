
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, Key, Hash } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

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
  // Keep track of the currently open accordion item for styling and selection
  // The accordion itself can be uncontrolled for open/close state if we don't set value/onValueChange
  // Or, we can control it if selection should dictate open state strictly.
  // For now, let user control accordion, and click on trigger also selects table.

  return (
    <div className="p-4">
      <CardHeader className="px-0 pt-0">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Table className="h-5 w-5 text-blue-600" />
          Schema Browser
        </CardTitle>
      </CardHeader>
      <CardContent className="px-0">
        <Accordion type="multiple" className="w-full space-y-1">
          {tables.map((table) => (
            <AccordionItem
              value={table.name}
              key={table.name}
              className={`rounded-lg border transition-all duration-200
                ${selectedTable === table.name
                  ? 'bg-blue-50 border-blue-200 shadow-sm'
                  : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                }
                data-[state=open]:bg-slate-50
              `}
            >
              <AccordionTrigger
                className="p-3 hover:no-underline w-full"
                onClick={(e) => {
                  // Prevent accordion from toggling if already selected and clicking for selection.
                  // However, standard accordion trigger behavior is to toggle.
                  // Let's simplify: clicking trigger always selects the table.
                  // Accordion will handle its open/close state.
                  onTableSelect(table.name);
                }}
              >
                <div className="flex items-center justify-between w-full">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Table className="h-4 w-4" />
                    {table.name}
                  </h3>
                  <Badge variant="secondary" className="text-xs">
                    {table.rowCount} rows
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="p-3 pt-0 space-y-1.5">
                {table.columns.map((column) => ( // Show all columns when expanded
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
                {table.columns.length === 0 && (
                    <p className="text-xs text-gray-500">No columns defined for this table.</p>
                )}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
        {tables.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-4">No tables found in the database.</p>
        )}
      </CardContent>
    </div>
  );
};
