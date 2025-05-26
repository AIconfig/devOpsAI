
import React, { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTranslation } from '@/lib/useTranslation';
import CodeBlock from './CodeBlock';
import { toast } from 'sonner';

// Mock response generator for demonstration
const generateMockResponse = async (prompt: string): Promise<string> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Example responses based on keywords in prompt
  if (prompt.toLowerCase().includes('nginx')) {
    return `Here's a basic Nginx configuration for a web server:

\`\`\`nginx
server {
    listen 80;
    server_name example.com www.example.com;

    location / {
        root /var/www/html;
        index index.html index.htm;
        try_files $uri $uri/ =404;
    }

    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
\`\`\``;
  } 
  
  if (prompt.toLowerCase().includes('docker')) {
    return `Here's a simple Docker Compose configuration for a web app with a database:

\`\`\`yaml
version: '3'
services:
  app:
    image: node:14-alpine
    container_name: web-app
    restart: always
    working_dir: /app
    volumes:
      - ./:/app
    ports:
      - "3000:3000"
    command: npm start
    environment:
      - NODE_ENV=production
      - DB_HOST=db
      - DB_USER=postgres
      - DB_PASS=password
      - DB_NAME=myapp
    depends_on:
      - db

  db:
    image: postgres:13
    container_name: postgres-db
    restart: always
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=myapp
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
\`\`\``;
  }

  return `Sorry, I don't have specific information about that. Please try asking about common DevOps tools like Nginx, Docker, or Kubernetes configurations.`;
};

type Message = {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
};

const AiChat: React.FC = () => {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [inputHeight, setInputHeight] = useState(56);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (currentMessage.trim() === '' || isGenerating) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: currentMessage,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prevMessages => [...prevMessages, userMessage]);
    setCurrentMessage('');
    setIsGenerating(true);

    try {
      const aiResponse = await generateMockResponse(userMessage.content);
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: aiResponse,
        sender: 'ai',
        timestamp: new Date(),
      };

      setMessages(prevMessages => [...prevMessages, aiMessage]);
    } catch (err) {
      console.error('Error generating response:', err);
      toast.error(t.chat.errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  const renderMessageContent = (message: Message) => {
    const parts = message.content.split(/```([^`]+)```/);
    
    return (
      <>
        {parts.map((part, index) => {
          if (index % 2 === 0) {
            return (
              <div key={index} className="whitespace-pre-wrap">
                {part}
              </div>
            );
          } else {
            // Extract language if specified as ```language
            const [language, ...code] = part.split('\n');
            return (
              <CodeBlock
                key={index}
                code={code.join('\n')}
                language={language || 'bash'}
              />
            );
          }
        })}
      </>
    );
  };

  const handleTextareaResize = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCurrentMessage(e.target.value);
    // Auto expand the textarea as content grows
    setInputHeight(Math.min(e.target.scrollHeight, 150));
  };

  return (
    <div className="flex flex-col h-full rounded-lg border border-border overflow-hidden">
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          {messages.length > 0 ? (
            <div className="p-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`mb-4 ${
                    message.sender === 'user'
                      ? 'ml-auto mr-0 max-w-[80%]'
                      : 'ml-0 mr-auto max-w-[80%]'
                  }`}
                >
                  <div
                    className={`rounded-lg p-3 ${
                      message.sender === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    {renderMessageContent(message)}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 px-1">
                    {message.timestamp.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          ) : (
            <div className="h-full flex items-center justify-center p-8">
              <div className="text-center max-w-md">
                <h3 className="font-semibold text-xl mb-2">{t.common.chat}</h3>
                <p className="text-muted-foreground">{t.chat.aiHelp}</p>
              </div>
            </div>
          )}
        </ScrollArea>
      </div>

      <div className="p-4 border-t border-border">
        <form onSubmit={handleSend} className="flex gap-2">
          <Textarea
            value={currentMessage}
            onChange={handleTextareaResize}
            placeholder={t.chat.placeholder}
            className="flex-1 min-h-[56px] resize-none"
            style={{ height: `${inputHeight}px` }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <Button
            type="submit"
            size="icon"
            disabled={currentMessage.trim() === '' || isGenerating}
          >
            <Send size={18} />
          </Button>
        </form>
      </div>
    </div>
  );
};

export default AiChat;
