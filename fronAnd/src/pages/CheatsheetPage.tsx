import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import CheatsheetLayout from '@/components/CheatsheetLayout';
import CodeBlock from '@/components/CodeBlock';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTranslation } from '@/lib/useTranslation';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import AddConfigForm from '@/components/AddConfigForm';
import { useToast } from '@/hooks/use-toast';

// Определение типов для данных
interface Config {
  title: string;
  code: string;
  notes?: string;
}

interface Section {
  title: string;
  configs: Config[];
}

interface Category {
  title: string;
  sections: Section[];
}

// Extended data for cheatsheets
const cheatsheetData: Record<string, Category> = {
  basics: {
    title: 'Linux Basics',
    sections: [
      // Существующие секции
    ]
  },
  networking: {
    title: 'Networking & VPN',
    sections: [
      // Существующие секции
    ]
  },
  vpn: {
    title: 'VPN Configurations',
    sections: [
      // Существующие секции
    ]
  },
  asterisk: {
    title: 'Asterisk PBX',
    sections: [
      // Существующие секции
    ]
  },
  docker: {
    title: 'Docker',
    sections: [
      // Существующие секции
    ]
  },
  nginx: {
    title: 'Nginx Web Server',
    sections: [
      // Существующие секции
    ]
  },
  kubernetes: {
    title: 'Kubernetes',
    sections: [
      // Существующие секции
    ]
  },
  debian: {
    title: 'Debian',
    sections: [
      // Существующие секции
    ]
  },
  cicd: {
    title: 'CI/CD Systems',
    sections: [
      // Существующие секции
    ]
  },
  gitops: {
    title: 'GitOps',
    sections: [
      {
        title: 'ArgoCD',
        configs: [
          {
            title: 'ArgoCD Installation',
            code: `# Install ArgoCD in Kubernetes
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# Access ArgoCD UI
kubectl port-forward svc/argocd-server -n argocd 8080:443

# Login with admin user and password
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d

# Install ArgoCD CLI
# Linux
curl -sSL -o argocd-linux-amd64 https://github.com/argoproj/argo-cd/releases/latest/download/argocd-linux-amd64
sudo install -m 555 argocd-linux-amd64 /usr/local/bin/argocd
rm argocd-linux-amd64

# Mac
brew install argocd

# Login using CLI
argocd login <ARGOCD_SERVER>

# Create an application
argocd app create guestbook \\
  --repo https://github.com/argoproj/argocd-example-apps.git \\
  --path guestbook \\
  --dest-server https://kubernetes.default.svc \\
  --dest-namespace default`
          },
          {
            title: 'ArgoCD Application Example',
            code: `# application.yaml - for defining applications in ArgoCD
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: guestbook
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/argoproj/argocd-example-apps.git
    targetRevision: HEAD
    path: guestbook
  destination:
    server: https://kubernetes.default.svc
    namespace: guestbook
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
    syncOptions:
    - CreateNamespace=true`
          }
        ]
      },
      {
        title: 'Flux CD',
        configs: [
          {
            title: 'Flux Installation',
            code: `# Install Flux CLI
# Linux
curl -s https://fluxcd.io/install.sh | sudo bash

# Mac
brew install fluxcd/tap/flux

# Check cluster compatibility
flux check --pre

# Bootstrap with GitHub
flux bootstrap github \\
  --owner=<GITHUB_USER> \\
  --repository=<REPOSITORY_NAME> \\
  --branch=main \\
  --path=./clusters/my-cluster \\
  --personal

# Create a source for Git repository
flux create source git podinfo \\
  --url=https://github.com/stefanprodan/podinfo \\
  --branch=master \\
  --interval=30s \\
  --export > ./clusters/my-cluster/podinfo-source.yaml

# Create a Kustomization
flux create kustomization podinfo \\
  --source=podinfo \\
  --path="./kustomize" \\
  --prune=true \\
  --validation=client \\
  --interval=5m \\
  --export > ./clusters/my-cluster/podinfo-kustomization.yaml`
          },
          {
            title: 'Flux Kustomization Example',
            code: `# Example of GitOps repository structure for Flux CD
clusters/
└── production
    ├── flux-system/ # flux components
    │   ├── gotk-components.yaml
    │   ├── gotk-sync.yaml
    │   └── kustomization.yaml
    ├── namespaces/
    │   ├── kustomization.yaml
    │   └── monitoring.yaml
    ├── infrastructure/
    │   ├── kustomization.yaml
    │   ├── sources/
    │   │   ├── kustomization.yaml
    │   │   └── podinfo.yaml
    │   └── monitoring/
    │       ├── kustomization.yaml
    │       └── prometheus.yaml
    └── apps/
        ├── kustomization.yaml
        └── podinfo/
            ├── kustomization.yaml
            ├── release.yaml
            └── values.yaml`
          }
        ]
      },
      {
        title: 'GitOps Principles',
        configs: [
          {
            title: 'GitOps Best Practices',
            code: `# Core GitOps Principles

1. Declarative System Description
   - All system configurations are defined declaratively in Git
   - Infrastructure as Code (IaC) tools like Terraform, Ansible
   - Kubernetes manifests, Helm charts, Kustomize configurations

2. Version Controlled, Immutable Configuration
   - All changes tracked in Git history
   - Branches, commits, and tags to represent system state
   - Git hooks to enforce policy and validation

3. Automatic Pull-based Deployments
   - Agents inside the cluster pull from Git (not pushed)
   - Continuous reconciliation between Git and runtime state
   - Drift detection and self-healing

4. Approved Changes via Git Workflow
   - Pull Requests as change mechanism
   - CI validates changes before merging
   - Approvals and reviews through Git platform

# Typical GitOps Workflow

1. Developer commits code to application repository
2. CI system builds, tests, and pushes container image
3. Developer creates PR to update image tag in GitOps repo
4. After approval and merge, GitOps tool detects change
5. GitOps tool applies changes to the target environment

# Tools Ecosystem

- CD Tools: ArgoCD, Flux CD, Jenkins X
- Security: Sealed Secrets, Vault, SOPS
- Validation: OPA/Gatekeeper, Kyverno
- Monitoring: Prometheus + Grafana
- Progressive Delivery: Argo Rollouts, Flagger`
          }
        ]
      }
    ]
  },
  serverless: {
    title: 'Serverless',
    sections: [
      {
        title: 'AWS Lambda',
        configs: [
          {
            title: 'AWS Lambda Function (Node.js)',
            code: `// Basic AWS Lambda function with Node.js
exports.handler = async (event) => {
  console.log('Event: ', JSON.stringify(event, null, 2));
  
  try {
    // Process event data
    const records = event.Records || [];
    const results = [];
    
    for (const record of records) {
      // Example: process SQS messages or S3 events
      if (record.s3) {
        console.log('Processing S3 event');
        // Process S3 event
      } else if (record.eventSource === 'aws:sqs') {
        console.log('Processing SQS message');
        // Process SQS message
      }
      
      results.push({
        id: record.eventID || 'unknown',
        status: 'processed'
      });
    }
    
    // Return results
    const response = {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Successfully processed records',
        results: results
      })
    };
    
    return response;
  } catch (error) {
    console.error('Error:', error);
    
    // Return error response
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Error processing request',
        error: error.message
      })
    };
  }
};`
          },
          {
            title: 'PowerShell Scripts',
            code: `# PowerShell doesn't support && operator like bash
# Instead use semicolons or write multi-line commands

# Change directory and run a command (instead of cd folder && command)
cd backAnd; python manage.py runserver

# Alternative approach with multi-line commands
cd backAnd
python manage.py runserver

# For conditional execution (similar to && in bash)
cd backAnd; if ($?) { python manage.py runserver }

# Run front-end development server
cd fronAnd
npm run dev

# Running multiple services - use multiple PowerShell windows or jobs
# Start a background job
Start-Job -ScriptBlock {
    cd D:\\Проекты\\DevOps\\backAnd
    python manage.py runserver
}

# Start another process in the current shell
cd D:\\Проекты\\DevOps\\fronAnd
npm run dev

# View all running jobs
Get-Job

# Get output from a background job
Receive-Job -Id 1

# Stop a background job when done
Stop-Job -Id 1
Remove-Job -Id 1`
          }
        ]
      }
    ]
  },
  deployment: {
    title: 'Deployment',
    sections: [
      {
        title: 'Frontend Deployment',
        configs: [
          {
            title: 'React App Deployment (Nginx)',
            code: `#!/bin/bash
# Script for deploying React application with Nginx

# Install dependencies
apt update
apt install -y nginx nodejs npm

# Create directory structure
mkdir -p /var/www/myapp

# Clone repository
cd /tmp
git clone https://github.com/username/react-app.git
cd react-app

# Install dependencies and build
npm install
npm run build

# Copy build to web root
cp -r build/* /var/www/myapp/

# Create Nginx config
cat > /etc/nginx/sites-available/myapp << EOF
server {
    listen 80;
    server_name myapp.example.com;
    root /var/www/myapp;
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
    }
}
EOF

# Enable site and restart Nginx
ln -s /etc/nginx/sites-available/myapp /etc/nginx/sites-enabled/
nginx -t && systemctl restart nginx

# Setup SSL with Certbot (optional)
apt install -y certbot python3-certbot-nginx
certbot --nginx -d myapp.example.com
`
          },
          {
            title: 'Vue.js App Deployment',
            code: `#!/bin/bash
# Deploy Vue.js application to Apache

# Install dependencies
apt update
apt install -y apache2 nodejs npm

# Create directory structure
mkdir -p /var/www/vueapp

# Clone repository
cd /tmp
git clone https://github.com/username/vue-app.git
cd vue-app

# Install dependencies and build
npm install
npm run build

# Copy build to web root
cp -r dist/* /var/www/vueapp/

# Create Apache config
cat > /etc/apache2/sites-available/vueapp.conf << EOF
<VirtualHost *:80>
    ServerName vueapp.example.com
    DocumentRoot /var/www/vueapp
    
    <Directory /var/www/vueapp>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    # Rewrite rules for SPA
    RewriteEngine On
    RewriteBase /
    RewriteRule ^index\\.html$ - [L]
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule . /index.html [L]
    
    ErrorLog \${APACHE_LOG_DIR}/vueapp-error.log
    CustomLog \${APACHE_LOG_DIR}/vueapp-access.log combined
</VirtualHost>
EOF

# Enable site and modules
a2ensite vueapp.conf
a2enmod rewrite
systemctl restart apache2

# Setup SSL with Certbot (optional)
apt install -y certbot python3-certbot-apache
certbot --apache -d vueapp.example.com
`
          }
        ]
      }
    ]
  }
};

// Компонент страницы шпаргалок
const CheatsheetPage: React.FC = () => {
  const { categoryId } = useParams<{ categoryId: string }>();
  const { t, locale } = useTranslation();
  const [currentCategory, setCurrentCategory] = useState<Category | null>(null);
  const [showForm, setShowForm] = useState(false);
  const { toast } = useToast();
  
  // Retrieve saved configs from local storage
  const getSavedConfigs = () => {
    const saved = localStorage.getItem(`cheatsheet-${categoryId}`);
    return saved ? JSON.parse(saved) : null;
  };

  useEffect(() => {
    if (categoryId) {
      // Добавляем проверку загрузки данных с таймаутом
      const loadTimeout = setTimeout(() => {
        // Если данные не загрузились за 3 секунды, показываем пустой шаблон
        if (!currentCategory) {
          setCurrentCategory({
            title: t.categories[categoryId as keyof typeof t.categories] || categoryId,
            sections: []
          });
          
          toast({
            title: "Information",
            description: "Data for this category not found. You can add your own configurations.",
          });
        }
      }, 3000);
      
      // Merge default data with any saved user configs
      const defaultData = cheatsheetData[categoryId];
      const savedData = getSavedConfigs();
      
      if (defaultData && savedData) {
        // Combine default data with saved user configurations
        const merged = {
          ...defaultData,
          sections: [
            ...defaultData.sections,
            ...savedData.sections.filter((section: Section) => 
              !defaultData.sections.some((s: Section) => s.title === section.title)
            )
          ]
        };
        setCurrentCategory(merged);
        clearTimeout(loadTimeout);
      } else if (defaultData) {
        setCurrentCategory(defaultData);
        clearTimeout(loadTimeout);
      } else if (savedData) {
        setCurrentCategory(savedData);
        clearTimeout(loadTimeout);
      } else {
        // Если данные не найдены, не устанавливаем null,
        // таймаут выше создаст пустой шаблон через 3 секунды
      }
      
      return () => clearTimeout(loadTimeout);
    }
  }, [categoryId, t.categories]);

  const handleAddConfig = (data: { sectionTitle: string; configTitle: string; configCode: string; notes: string }) => {
    if (!categoryId) return;

    const newConfig: Config = {
      title: data.configTitle,
      code: data.configCode,
      notes: data.notes
    };

    let updatedCategory: Category;
    if (currentCategory) {
      // Check if section already exists
      const existingSection = currentCategory.sections.find(
        (section: Section) => section.title === data.sectionTitle
      );

      if (existingSection) {
        // Add config to existing section
        updatedCategory = {
          ...currentCategory,
          sections: currentCategory.sections.map((section: Section) => {
            if (section.title === data.sectionTitle) {
              return {
                ...section,
                configs: [...section.configs, newConfig]
              };
            }
            return section;
          })
        };
      } else {
        // Create new section with the new config
        updatedCategory = {
          ...currentCategory,
          sections: [
            ...currentCategory.sections,
            {
              title: data.sectionTitle,
              configs: [newConfig]
            }
          ]
        };
      }
    } else {
      // Create a completely new category
      updatedCategory = {
        title: t.categories[categoryId as keyof typeof t.categories] || categoryId,
        sections: [
          {
            title: data.sectionTitle,
            configs: [newConfig]
          }
        ]
      };
    }

    // Save to state
    setCurrentCategory(updatedCategory);
    
    // Save to local storage
    localStorage.setItem(`cheatsheet-${categoryId}`, JSON.stringify(updatedCategory));
    
    // Show success message
    toast({
      title: "Config Added",
      description: `Added ${data.configTitle} to ${data.sectionTitle}`,
    });

    // Close the form
    setShowForm(false);
  };

  if (!currentCategory) {
    return (
      <CheatsheetLayout>
        <div className="max-w-4xl mx-auto p-4">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold">
              {t.categories[categoryId as keyof typeof t.categories] || categoryId}
            </h1>
            <Button onClick={() => setShowForm(true)} variant="outline">
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Config
            </Button>
          </div>
          
          {showForm ? (
            <AddConfigForm onSubmit={handleAddConfig} onCancel={() => setShowForm(false)} />
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                Cheatsheet content is not available yet for this category. Add your own configs!
              </p>
            </div>
          )}
        </div>
      </CheatsheetLayout>
    );
  }

  return (
    <CheatsheetLayout>
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">
            {t.categories[categoryId as keyof typeof t.categories] || currentCategory.title}
          </h1>
          <Button onClick={() => setShowForm(true)} variant="outline">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Config
          </Button>
        </div>

        {showForm && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <AddConfigForm onSubmit={handleAddConfig} onCancel={() => setShowForm(false)} />
            </CardContent>
          </Card>
        )}

        {currentCategory.sections.map((section: Section, index: number) => (
          <Card key={index} className="mb-6 overflow-hidden">
            <CardHeader className="bg-muted">
              <CardTitle>{section.title}</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {section.configs.length > 1 ? (
                <Tabs defaultValue={`${index}-0`}>
                  <TabsList className="mb-4">
                    {section.configs.map((config: Config, configIndex: number) => (
                      <TabsTrigger key={configIndex} value={`${index}-${configIndex}`}>
                        {config.title}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  {section.configs.map((config: Config, configIndex: number) => (
                    <TabsContent key={configIndex} value={`${index}-${configIndex}`}>
                      <CodeBlock code={config.code} title={config.title} />
                      {config.notes && (
                        <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                          <h4 className="font-medium mb-2">Notes:</h4>
                          <p className="text-sm">{config.notes}</p>
                        </div>
                      )}
                    </TabsContent>
                  ))}
                </Tabs>
              ) : (
                section.configs.map((config: Config, configIndex: number) => (
                  <div key={configIndex}>
                    <CodeBlock code={config.code} title={config.title} />
                    {config.notes && (
                      <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                        <h4 className="font-medium mb-2">Notes:</h4>
                        <p className="text-sm">{config.notes}</p>
                      </div>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </CheatsheetLayout>
  );
};

export default CheatsheetPage; 