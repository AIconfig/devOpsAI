import React from 'react';
import OllamaChat from '@/components/OllamaChat';

const OllamaPage: React.FC = () => {
  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col gap-4">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight">Ollama AI</h2>
          <p className="text-muted-foreground">
            Interact with local AI models powered by Ollama
          </p>
        </div>
        <div className="py-4">
          <OllamaChat />
        </div>
      </div>
    </div>
  );
};

export default OllamaPage; 