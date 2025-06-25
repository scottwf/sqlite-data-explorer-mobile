import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Play, Bot, Settings, CheckCircle, XCircle, AlertTriangle, HelpCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type OllamaStatus = 'idle' | 'connecting' | 'success' | 'error';

interface QueryEditorProps {
  database: any;
  onQueryResult: (result: any[]) => void;
  onQueryColumns: (columns: string[]) => void;
  tableInfo: any[];
}

export const QueryEditor: React.FC<QueryEditorProps> = ({
  database,
  onQueryResult,
  onQueryColumns,
  tableInfo
}) => {
  const [query, setQuery] = useState('');
  const [naturalLanguage, setNaturalLanguage] = useState('');
  const [ollamaUrl, setOllamaUrl] = useState('http://localhost:11434');
  const [ollamaStatus, setOllamaStatus] = useState<OllamaStatus>('idle');
  const [ollamaStatusMessage, setOllamaStatusMessage] = useState('Ollama status unknown.');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const { toast } = useToast();
  const OLLAMA_TIMEOUT_MS = 15000; // 15 seconds timeout

  const checkOllamaStatus = async (url: string) => {
    setOllamaStatus('connecting');
    setOllamaStatusMessage('Checking Ollama connection...');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), OLLAMA_TIMEOUT_MS);

    try {
      const response = await fetch(`${url}/api/tags`, {
        method: 'GET',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        setOllamaStatus('success');
        setOllamaStatusMessage('Ollama connection successful.');
        toast({ title: "Ollama Connected", description: "Successfully connected to Ollama server." });
      } else {
        setOllamaStatus('error');
        setOllamaStatusMessage(`Ollama server error: ${response.status}. Check URL and if Ollama is running.`);
        toast({ title: "Ollama Connection Error", description: `Server responded with status ${response.status}.`, variant: "destructive" });
      }
    } catch (error: any) {
      clearTimeout(timeoutId);
      setOllamaStatus('error');
      if (error.name === 'AbortError') {
        setOllamaStatusMessage('Ollama connection timed out. Ensure server is responsive.');
        toast({ title: "Ollama Timeout", description: "Connection to Ollama server timed out.", variant: "destructive" });
      } else {
        setOllamaStatusMessage('Ollama connection failed. Check URL and if Ollama is running.');
        toast({ title: "Ollama Connection Failed", description: "Could not connect to Ollama server.", variant: "destructive" });
      }
      console.error('Error checking Ollama status:', error);
    }
  };

  useEffect(() => {
    if (ollamaUrl) {
      checkOllamaStatus(ollamaUrl);
    } else {
      setOllamaStatus('idle');
      setOllamaStatusMessage('Enter Ollama URL to check status.');
    }
  }, [ollamaUrl]);

  const generateQuery = async () => {
    if (ollamaStatus !== 'success') {
      toast({
        title: "Ollama Not Connected",
        description: "Please ensure Ollama is connected and the URL is correct before generating queries.",
        variant: "destructive"
      });
      checkOllamaStatus(ollamaUrl); // Re-check status
      return;
    }
    if (!naturalLanguage.trim()) {
      toast({
        title: "Please enter a description",
        description: "Describe what you want to query in natural language.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), OLLAMA_TIMEOUT_MS + 15000); // Longer timeout for generation

    try {
      const schemaInfo = tableInfo.map(table => 
        `Table: ${table.name}\nColumns: ${table.columns.map(col => 
          `${col.name} (${col.type}${col.pk ? ', PRIMARY KEY' : ''}${col.notnull ? ', NOT NULL' : ''})`
        ).join(', ')}`
      ).join('\n\n');

      const prompt = `Given this SQLite database schema:

${schemaInfo}

Convert this natural language request to a SQL query:
"${naturalLanguage}"

Return ONLY the SQL query, no explanations or markdown formatting.`;

      const response = await fetch(`${ollamaUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama3.2', // Consider making this configurable
          prompt: prompt,
          stream: false
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Ollama server error: ${response.status}. ${errorBody}`);
      }

      const data = await response.json();
      if (data.response) {
        setQuery(data.response.trim());
        toast({
          title: "Query generated successfully",
          description: "Review and execute the generated SQL query."
        });
      } else {
        throw new Error("Ollama response did not contain a query.");
      }
      
    } catch (error: any) {
      clearTimeout(timeoutId);
      console.error('Error generating query:', error);
      let description = "An unknown error occurred while generating the query.";
      if (error.name === 'AbortError') {
        description = "Query generation timed out. The Ollama server might be too busy or the request too complex.";
      } else if (error.message.includes("Ollama server error")) {
        description = error.message;
      } else if (ollamaStatus !== 'success') {
        description = "Failed to generate query. Ollama is not connected. Please check the URL and server status.";
      } else {
        description = `Error: ${error.message || "Please check Ollama server logs."}`;
      }
      toast({
        title: "Failed to generate query",
        description: description,
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const executeQuery = () => {
    if (!query.trim()) {
      toast({
        title: "No query to execute",
        description: "Enter a SQL query or generate one from natural language",
        variant: "destructive"
      });
      return;
    }

    setIsExecuting(true);
    try {
      const result = database.exec(query)[0];
      
      if (result) {
        onQueryColumns(result.columns);
        onQueryResult(result.values);
        toast({
          title: "Query executed successfully",
          description: `Returned ${result.values.length} rows`
        });
      } else {
        onQueryColumns([]);
        onQueryResult([]);
        toast({
          title: "Query executed",
          description: "No results returned"
        });
      }
    } catch (error) {
      console.error('Query execution error:', error);
      toast({
        title: "Query execution failed",
        description: error instanceof Error ? error.message : "Invalid SQL query",
        variant: "destructive"
      });
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-blue-600" />
          AI Query Generator & SQL Editor
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Settings className="h-5 w-5 text-gray-500 mr-2" />
          <Input
            id="ollamaUrl"
            placeholder="Ollama URL (e.g., http://localhost:11434)"
            value={ollamaUrl}
            onChange={(e) => setOllamaUrl(e.target.value)}
            className="flex-1"
          />
          <TooltipProvider delayDuration={100}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={() => checkOllamaStatus(ollamaUrl)} className="ml-2">
                  {ollamaStatus === 'connecting' && <HelpCircle className="h-5 w-5 text-yellow-500 animate-spin" />}
                  {ollamaStatus === 'success' && <CheckCircle className="h-5 w-5 text-green-500" />}
                  {ollamaStatus === 'error' && <XCircle className="h-5 w-5 text-red-500" />}
                  {ollamaStatus === 'idle' && <HelpCircle className="h-5 w-5 text-gray-400" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{ollamaStatusMessage}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium">Natural Language Query</label>
          <Textarea
            placeholder="e.g., Show me all users who registered in the last 30 days"
            value={naturalLanguage}
            onChange={(e) => setNaturalLanguage(e.target.value)}
            rows={2}
          />
          <Button 
            onClick={generateQuery} 
            disabled={isGenerating || ollamaStatus !== 'success'}
            className="w-full"
          >
            <Bot className="h-4 w-4 mr-2" />
            {isGenerating ? 'Generating...' : (ollamaStatus !== 'success' ? 'Ollama Not Ready' : 'Generate SQL Query')}
          </Button>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">SQL Query</label>
          <Textarea
            placeholder="SELECT * FROM table_name WHERE condition;"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            rows={4}
            className="font-mono text-sm"
          />
          <Button 
            onClick={executeQuery} 
            disabled={isExecuting}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            <Play className="h-4 w-4 mr-2" />
            {isExecuting ? 'Executing...' : 'Execute Query'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
