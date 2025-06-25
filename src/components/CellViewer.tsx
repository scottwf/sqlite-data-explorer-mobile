
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Copy, Check } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

interface CellViewerProps {
  isOpen: boolean;
  onClose: () => void;
  content: string;
  columnName?: string;
}

export const CellViewer: React.FC<CellViewerProps> = ({
  isOpen,
  onClose,
  content,
  columnName
}) => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Content copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Could not copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const formatContent = (rawContent: string) => {
    if (!rawContent || rawContent === "NULL") return rawContent;
    
    try {
      const parsed = JSON.parse(rawContent);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return rawContent;
    }
  };

  const isJson = (content: string) => {
    if (!content || content === "NULL") return false;
    try {
      JSON.parse(content);
      return true;
    } catch {
      return false;
    }
  };

  const formattedContent = formatContent(content);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[80vw] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Cell Content {columnName && `- ${columnName}`}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard(content)}
              className="ml-2"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? 'Copied!' : 'Copy'}
            </Button>
          </DialogTitle>
          <DialogDescription>
            {isJson(content) ? 'JSON content (formatted for readability)' : 'Cell content'}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="flex-grow p-1 border rounded-md max-h-[60vh]">
          <pre className="text-sm whitespace-pre-wrap break-all p-4 font-mono">
            {formattedContent}
          </pre>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
