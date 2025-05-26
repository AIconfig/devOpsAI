
import React, { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/lib/useTranslation';
import { cn } from '@/lib/utils';

interface CodeBlockProps {
  code: string;
  language?: string;
  title?: string;
  minified?: boolean;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ code, language, title, minified = false }) => {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  // Function to detect and highlight comment lines
  const formatCode = () => {
    return code.split('\n').map((line, index) => {
      // Detect comment lines based on common comment markers
      const isComment = line.trimStart().startsWith('#') || 
                       line.trimStart().startsWith('//') || 
                       line.trimStart().startsWith(';') ||
                       line.trimStart().startsWith('--');
      
      // Apply appropriate styling
      return (
        <div key={index} className={`${isComment ? 'text-muted-foreground' : ''}`}>
          {line}
        </div>
      );
    });
  };

  // For inline or table cell code snippets
  if (minified) {
    return (
      <div className="group relative bg-muted p-2 rounded-md">
        <pre className="font-mono text-xs whitespace-pre-wrap overflow-x-auto max-h-24">{code}</pre>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={copyToClipboard}
          className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
        </Button>
      </div>
    );
  }

  const hasHeader = title || language;
  
  return (
    <div className={cn("rounded-lg border border-border overflow-hidden mb-4", !hasHeader && "mt-4")}>
      {hasHeader && (
        <div className="flex justify-between items-center px-4 py-2 bg-muted">
          <div className="text-sm font-medium">
            {title || (language ? `${language} snippet` : 'Code snippet')}
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={copyToClipboard}
            className="flex items-center gap-2 h-8"
          >
            {copied ? (
              <>
                <Check size={14} />
                <span className="text-xs">{t.common.copied}</span>
              </>
            ) : (
              <>
                <Copy size={14} />
                <span className="text-xs">{t.common.copyCode}</span>
              </>
            )}
          </Button>
        </div>
      )}
      <div className="code-block bg-black text-white p-4 overflow-x-auto">
        <pre className="whitespace-pre font-mono text-sm">
          {formatCode()}
        </pre>
      </div>
    </div>
  );
};

export default CodeBlock;
