
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import CheatsheetLayout from '@/components/CheatsheetLayout';
import { useTranslation } from '@/lib/useTranslation';
import { Server, Network, Dock, Database, Bell, Terminal, Shield, Code, Box, GitBranch, Globe, File, Key, Folder, List, Book, Phone } from 'lucide-react';

const categories = [
  { 
    id: 'basics', 
    icon: Terminal,
    description: 'Linux directory structure, essential commands, user management and system monitoring'
  },
  { 
    id: 'networking', 
    icon: Network,
    description: 'Network configuration, VPN setup, proxies, DNS settings and port forwarding'
  },
  { 
    id: 'services', 
    icon: Server,
    description: 'Web servers, FTP/SFTP, email servers and SSH tunneling configurations'
  },
  { 
    id: 'projects', 
    icon: Code,
    description: 'Project setup for Python, Java, PHP, C/C++, C# and other languages'
  },
  { 
    id: 'asterisk', 
    icon: Phone,
    description: 'Asterisk PBX setup, configuration and integration with other services'
  },
  { 
    id: 'containers', 
    icon: Dock,
    description: 'Docker, LXC/Proxmox, Vagrant and KVM/QEMU virtualization solutions'
  },
  { 
    id: 'cicd', 
    icon: GitBranch,
    description: 'Git, GitHub/GitLab actions, Jenkins and Ansible deployment configurations'
  },
  { 
    id: 'databases', 
    icon: Database,
    description: 'PostgreSQL, MySQL/MariaDB, SQLite, Redis/Memcached setup and management'
  },
  { 
    id: 'security', 
    icon: Shield,
    description: 'Fail2ban, firewalls, SSL certificates, security updates and auditing'
  },
  { 
    id: 'project_structure', 
    icon: Folder,
    description: 'Project structure examples for different frameworks and languages'
  },
  { 
    id: 'tools', 
    icon: Terminal,
    description: 'Useful command-line tools for system administration and development'
  },
  { 
    id: 'checklists', 
    icon: List,
    description: 'Step-by-step guides for common server administration tasks'
  },
  { 
    id: 'documentation', 
    icon: Book,
    description: 'Links to official documentation, helpful resources and community sites'
  },
  { 
    id: 'debian', 
    icon: Server,
    description: 'Basic system administration, package management and configuration tips'
  },
  { 
    id: 'nginx', 
    icon: Network,
    description: 'Web server setup, reverse proxy, load balancing and SSL configuration'
  },
  { 
    id: 'docker', 
    icon: Dock,
    description: 'Container management, Docker Compose, networking and volume configuration'
  },
  { 
    id: 'kubernetes', 
    icon: Dock,
    description: 'Orchestration, deployments, services, and cluster management'
  },
  { 
    id: 'ftp', 
    icon: Server,
    description: 'FTP server setup, user management, and security configurations'
  },
  { 
    id: 'vpn', 
    icon: Network,
    description: 'VPN server setup, client configuration, and security best practices'
  },
  { 
    id: 'monitoring', 
    icon: Bell,
    description: 'System monitoring, logging tools, alerts, and performance tracking'
  },
  { 
    id: 'deployment', 
    icon: Server,
    description: 'CI/CD pipelines, automated deployments, and release management'
  },
  { 
    id: 'virtualization', 
    icon: Box,
    description: 'Virtual machines setup, management and best practices'
  }
];

const CheatsheetListPage = () => {
  const { t } = useTranslation();

  return (
    <CheatsheetLayout>
      <div className="container mx-auto">
        <h1 className="text-3xl font-bold mb-6">{t.navigation.cheatsheets}</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <Link to={`/cheatsheets/${category.id}`} key={category.id}>
                <Card className="h-full hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="rounded-full bg-primary/10 p-2 w-10 h-10 flex items-center justify-center mb-2">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle>{t.categories[category.id as keyof typeof t.categories] || category.id}</CardTitle>
                    <CardDescription>{category.description}</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </CheatsheetLayout>
  );
};

export default CheatsheetListPage;
