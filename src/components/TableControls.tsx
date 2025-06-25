
import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, ChevronLeft, ChevronRight, Code, Maximize, Minimize } from 'lucide-react';

interface TableControlsProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  showQueryEditor: boolean;
  onToggleQueryEditor: () => void;
  isFullScreen: boolean;
  onToggleFullScreen: () => void;
  totalRows: number;
  isQueryMode: boolean;
  currentPage: number;
  totalPages: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export const TableControls: React.FC<TableControlsProps> = ({
  searchTerm,
  onSearchChange,
  showQueryEditor,
  onToggleQueryEditor,
  isFullScreen,
  onToggleFullScreen,
  totalRows,
  isQueryMode,
  currentPage,
  totalPages,
  pageSize,
  onPageChange
}) => {
  return (
    <>
      {/* Header Controls */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onToggleQueryEditor}
        >
          <Code className="h-4 w-4 mr-2" />
          {showQueryEditor ? 'Hide' : 'Show'} Query Editor
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onToggleFullScreen}
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
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 w-64"
            disabled={isQueryMode}
          />
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
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
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
                    onClick={() => onPageChange(pageNum)}
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
              onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
};
