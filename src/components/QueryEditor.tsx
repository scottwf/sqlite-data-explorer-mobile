
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Play, Bot, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const { toast } = useToast();

  const generateQuery = async () => {
    if (!naturalLanguage.trim()) {
      toast({
        title: "Please enter a description",
        description: "Describe what you want to query in natural language",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
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
          model: 'llama3.2',
          prompt: prompt,
          stream: false
        })
      });

      if (!response.ok) {
        throw new Error(`Ollama server error: ${response.status}`);
      }

      const data = await response.json();
      setQuery(data.response.trim());
      
      toast({
        title: "Query generated successfully",
        description: "Review and execute the generated SQL query"
      });
    } catch (error) {
      console.error('Error generating query:', error);
      toast({
        title: "Failed to generate query",
        description: "Make sure Ollama is running on the specified URL",
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
          <Settings className="h-4 w-4 text-gray-500" />
          <Input
            placeholder="Ollama URL (e.g., http://localhost:11434)"
            value={ollamaUrl}
            onChange={(e) => setOllamaUrl(e.target.value)}
            className="flex-1"
          />
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
            disabled={isGenerating}
            className="w-full"
          >
            <Bot className="h-4 w-4 mr-2" />
            {isGenerating ? 'Generating...' : 'Generate SQL Query'}
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
