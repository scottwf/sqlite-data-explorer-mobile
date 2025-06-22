
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Save, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Column {
  name: string;
  type: string;
  notnull: boolean;
  pk: boolean;
}

interface CrudOperationsProps {
  database: any;
  tableName: string;
  columns: Column[];
  onDataChange: () => void;
}

export const CrudOperations: React.FC<CrudOperationsProps> = ({
  database,
  tableName,
  columns,
  onDataChange
}) => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<any>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const { toast } = useToast();

  const initializeFormData = (row?: any) => {
    const data: Record<string, any> = {};
    columns.forEach(col => {
      data[col.name] = row ? row[col.name] : '';
    });
    setFormData(data);
  };

  const handleAdd = () => {
    initializeFormData();
    setEditingRow(null);
    setIsAddDialogOpen(true);
  };

  const handleEdit = (row: any) => {
    const rowData: Record<string, any> = {};
    columns.forEach((col, index) => {
      rowData[col.name] = row[index];
    });
    initializeFormData(rowData);
    setEditingRow(rowData);
    setIsAddDialogOpen(true);
  };

  const handleDelete = (row: any) => {
    if (!confirm('Are you sure you want to delete this row?')) return;

    try {
      const pkColumn = columns.find(col => col.pk);
      if (!pkColumn) {
        toast({
          title: "Cannot delete",
          description: "No primary key found for this table",
          variant: "destructive"
        });
        return;
      }

      const pkIndex = columns.findIndex(col => col.pk);
      const pkValue = row[pkIndex];

      database.exec(`DELETE FROM ${tableName} WHERE ${pkColumn.name} = ?`, [pkValue]);
      
      toast({
        title: "Row deleted successfully",
        description: "The record has been removed from the database"
      });
      
      onDataChange();
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: "Delete failed",
        description: error instanceof Error ? error.message : "Failed to delete row",
        variant: "destructive"
      });
    }
  };

  const handleSave = () => {
    try {
      if (editingRow) {
        // Update existing row
        const pkColumn = columns.find(col => col.pk);
        if (!pkColumn) {
          toast({
            title: "Cannot update",
            description: "No primary key found for this table",
            variant: "destructive"
          });
          return;
        }

        const setClauses = columns
          .filter(col => !col.pk)
          .map(col => `${col.name} = ?`)
          .join(', ');
        
        const values = columns
          .filter(col => !col.pk)
          .map(col => formData[col.name]);
        
        values.push(editingRow[pkColumn.name]);

        database.exec(
          `UPDATE ${tableName} SET ${setClauses} WHERE ${pkColumn.name} = ?`,
          values
        );
        
        toast({
          title: "Row updated successfully",
          description: "The record has been modified"
        });
      } else {
        // Insert new row
        const columnNames = columns.map(col => col.name).join(', ');
        const placeholders = columns.map(() => '?').join(', ');
        const values = columns.map(col => formData[col.name]);

        database.exec(
          `INSERT INTO ${tableName} (${columnNames}) VALUES (${placeholders})`,
          values
        );
        
        toast({
          title: "Row added successfully",
          description: "New record has been created"
        });
      }
      
      setIsAddDialogOpen(false);
      onDataChange();
    } catch (error) {
      console.error('Save error:', error);
      toast({
        title: "Save failed",
        description: error instanceof Error ? error.message : "Failed to save changes",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="flex items-center gap-2 mb-4">
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogTrigger asChild>
          <Button onClick={handleAdd} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Row
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingRow ? 'Edit Row' : 'Add New Row'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {columns.map((column) => (
              <div key={column.name} className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  {column.name}
                  {column.pk && <Badge variant="outline" className="text-xs">PK</Badge>}
                  {column.notnull && <Badge variant="outline" className="text-xs">NOT NULL</Badge>}
                  <span className="text-gray-500">({column.type})</span>
                </label>
                <Input
                  value={formData[column.name] || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    [column.name]: e.target.value
                  }))}
                  disabled={editingRow && column.pk}
                  placeholder={`Enter ${column.name}`}
                />
              </div>
            ))}
            <div className="flex justify-end gap-2 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setIsAddDialogOpen(false)}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleSave}>
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export const RowActions: React.FC<{
  row: any;
  onEdit: (row: any) => void;
  onDelete: (row: any) => void;
}> = ({ row, onEdit, onDelete }) => {
  return (
    <div className="flex items-center gap-1">
      <Button
        size="sm"
        variant="ghost"
        onClick={() => onEdit(row)}
        className="h-8 w-8 p-0"
      >
        <Edit className="h-3 w-3" />
      </Button>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => onDelete(row)}
        className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
      >
        <Trash2 className="h-3 w-3" />
      </Button>
    </div>
  );
};
