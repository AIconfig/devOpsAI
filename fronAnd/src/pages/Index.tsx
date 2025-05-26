
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import CheatsheetLayout from '@/components/CheatsheetLayout';
import { useTranslation } from '@/lib/useTranslation';
import { Server, Dock, MessageCircle, Network, Terminal, Database, Shield, Code } from 'lucide-react';

const Index = () => {
  const { t } = useTranslation();

  const featuredCategories = [
    { id: 'basics', icon: Terminal },
    { id: 'networking', icon: Network },
    { id: 'services', icon: Server },
    { id: 'projects', icon: Code },
    { id: 'security', icon: Shield },
    { id: 'databases', icon: Database },
    { id: 'docker', icon: Dock },
    { id: 'kubernetes', icon: Dock },
  ];

  return (
    <CheatsheetLayout>
      <div className="container mx-auto">
        {/* Hero Section */}
        <div className="flex flex-col items-center text-center mb-12 py-12 px-4 border border-border rounded-lg glass">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{t.home.title}</h1>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl">
            {t.home.subtitle}
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button asChild size="lg">
              <Link to="/cheatsheets">{t.home.getStarted}</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/assistant">
                <MessageCircle className="mr-2 h-4 w-4" />
                {t.navigation.aiAssistant}
              </Link>
            </Button>
          </div>
        </div>

        {/* Popular Categories */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">{t.home.popularCheatsheets}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredCategories.map((category) => {
              const Icon = category.icon;
              return (
                <Card key={category.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="rounded-full bg-primary/10 p-2 w-10 h-10 flex items-center justify-center mb-2">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle>{t.categories[category.id as keyof typeof t.categories]}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>
                      {category.id === 'basics' && 'Linux directory structure, user management, SSH, cron, logs and monitoring'}
                      {category.id === 'networking' && 'Network setup, VPN configuration, proxies, DNS and port forwarding'}
                      {category.id === 'services' && 'Web servers, FTP, email servers and SSH tunneling configurations'}
                      {category.id === 'projects' && 'Deployment guides for Python, Java, PHP, C/C#, and more'}
                      {category.id === 'security' && 'Firewalls, SSL certificates, security updates and auditing tools'}
                      {category.id === 'databases' && 'PostgreSQL, MySQL, SQLite, Redis setup and management'}
                      {category.id === 'docker' && 'Container management and Compose configurations'}
                      {category.id === 'kubernetes' && 'Container orchestration and cluster management'}
                    </CardDescription>
                    <Button asChild className="mt-4" variant="outline">
                      <Link to={`/cheatsheets/${category.id}`}>View Cheatsheet</Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* AI Assistant Showcase */}
        <section className="mb-12">
          <Card className="overflow-hidden border-primary/50">
            <div className="grid grid-cols-1 md:grid-cols-2">
              <div className="p-6 md:p-8 flex flex-col justify-center">
                <h2 className="text-2xl font-bold mb-4">{t.navigation.aiAssistant}</h2>
                <p className="mb-6 text-muted-foreground">
                  {t.chat.aiHelp}
                </p>
                <Button asChild>
                  <Link to="/assistant">{t.navigation.aiAssistant}</Link>
                </Button>
              </div>
              <div className="bg-muted p-6 md:p-8 border-l border-border">
                <div className="bg-background rounded-lg p-4 shadow-sm">
                  <div className="font-mono text-sm">
                    <span className="text-primary">{'>'}</span> How to configure Nginx as a reverse proxy?
                  </div>
                </div>
                <div className="mt-4 bg-primary/10 rounded-lg p-4">
                  <div className="font-mono text-sm">
                    <p className="mb-2">Here's a basic Nginx reverse proxy configuration:</p>
                    <pre className="bg-muted p-2 rounded text-xs overflow-x-auto">
{`server {
    listen 80;
    server_name example.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
    }
}`}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </section>
      </div>
    </CheatsheetLayout>
  );
};

export default Index;
