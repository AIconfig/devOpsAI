import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Loader2, Copy, BookmarkPlus, Check } from 'lucide-react';
import { useToast } from './ui/use-toast';
import api, { ConfigRequest, ConfigResponse, SaveConfigRequest } from '../api/api';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";

// Тип для определения языка
const LANGUAGES = [
  { value: 'english', label: 'English' },
  { value: 'ukrainian', label: 'Українська' },
  { value: 'chinese', label: 'Chinese (中文)' },
  { value: 'spanish', label: 'Spanish (Español)' },
  { value: 'french', label: 'French (Français)' },
  { value: 'german', label: 'German (Deutsch)' },
];

// Популярные типы конфигурационных файлов
const CONFIG_TYPES = [
  { value: 'docker-compose', label: 'Docker Compose' },
  { value: 'dockerfile', label: 'Dockerfile' },
  { value: 'nginx', label: 'Nginx' },
  { value: 'kubernetes', label: 'Kubernetes' },
  { value: '.env', label: '.env file' },
  { value: 'webpack', label: 'Webpack' },
  { value: 'babel', label: 'Babel' },
  { value: 'eslint', label: 'ESLint' },
  { value: 'github-actions', label: 'GitHub Actions' },
  { value: 'gitlab-ci', label: 'GitLab CI' },
  { value: 'apache', label: 'Apache HTTP Server' },
  { value: 'terraform', label: 'Terraform' },
  { value: 'ansible-playbook', label: 'Ansible Playbook' },
  { value: 'docker-network', label: 'Docker Network' },
];

// Категории для сохранения конфигов
const CATEGORIES = [
  { value: 'docker', label: 'Docker' },
  { value: 'kubernetes', label: 'Kubernetes' },
  { value: 'nginx', label: 'Nginx' },
  { value: 'apache', label: 'Apache' },
  { value: 'database', label: 'Databases' },
  { value: 'security', label: 'Security' },
  { value: 'network', label: 'Networking' },
  { value: 'cicd', label: 'CI/CD' },
  { value: 'terraform', label: 'Terraform' },
  { value: 'ansible', label: 'Ansible' },
  { value: 'other', label: 'Other' },
];

// Шаблоны параметров для разных типов конфигов
const PARAMETER_TEMPLATES: Record<string, Record<string, any>> = {
  'docker-compose': {
    services: {
      app: {
        image: 'node:18-alpine',
        ports: ['3000:3000'],
        volumes: ['./:/app'],
        environment: {
          NODE_ENV: 'development',
        },
      },
      db: {
        image: 'postgres:latest',
        environment: {
          POSTGRES_USER: 'user',
          POSTGRES_PASSWORD: 'password',
          POSTGRES_DB: 'mydb',
        },
        volumes: ['postgres-data:/var/lib/postgresql/data'],
      },
    },
    volumes: {
      'postgres-data': {},
    },
  },
  'nginx': {
    server: {
      listen: 80,
      server_name: 'example.com',
      root: '/var/www/html',
      location: {
        '/': {
          try_files: '$uri $uri/ /index.html',
        },
        '/api/': {
          proxy_pass: 'http://backend:3000',
          proxy_set_header: {
            Host: '$host',
            'X-Real-IP': '$remote_addr',
          },
        },
      },
    },
  },
};

const ConfigGenerator = () => {
  const [models, setModels] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingToCheatsheet, setSavingToCheatsheet] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [selectedModel, setSelectedModel] = useState('');
  const [configType, setConfigType] = useState('docker-compose');
  const [language, setLanguage] = useState('english');
  const [parameters, setParameters] = useState('');
  const [generatedConfig, setGeneratedConfig] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const { toast } = useToast();

  // Загрузка моделей при инициализации
  useEffect(() => {
    const fetchModels = async () => {
      try {
        // Добавляю обработку ошибок и таймаут
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 секунд таймаут
        
        try {
          const response = await fetch('/api/ollama/models/', {
            signal: controller.signal
          });
          clearTimeout(timeoutId);
          
          if (!response.ok) {
            throw new Error(`HTTP error ${response.status}`);
          }
          
          const data = await response.json();
          // Получаем только названия моделей
          const modelNames = data.map((model: any) => model.name || model);
          setModels(modelNames);
          if (modelNames.length > 0) {
            setSelectedModel(modelNames[0]);
          } else {
            // Установка дефолтной модели если API вернул пустой список
            setModels(['ollama/llama2', 'fallback/model']);
            setSelectedModel('ollama/llama2');
          }
        } catch (fetchError) {
          // Если не удалось получить модели, установим дефолтные
          console.error('Failed to load models:', fetchError);
          setModels(['ollama/llama2', 'fallback/model']);
          setSelectedModel('ollama/llama2');
          clearTimeout(timeoutId);
        }
      } catch (error) {
        console.error('Error loading models:', error);
        // Установка дефолтных моделей в случае ошибки
        setModels(['ollama/llama2', 'fallback/model']);
        setSelectedModel('ollama/llama2');
        
        toast({
          title: 'Attention',
          description: 'Failed to load model list. Using default models.',
          variant: 'default',
        });
      }
    };

    fetchModels();
  }, [toast]);

  // Устанавливаем шаблон параметров при изменении типа конфига
  useEffect(() => {
    if (configType && PARAMETER_TEMPLATES[configType]) {
      setParameters(JSON.stringify(PARAMETER_TEMPLATES[configType], null, 2));
    } else {
      setParameters('{\n  // Add parameters here in JSON format\n}');
    }

    // Устанавливаем соответствующую категорию для сохранения
    if (configType.includes('docker')) {
      setSelectedCategory('docker');
    } else if (configType.includes('kubernetes')) {
      setSelectedCategory('kubernetes');
    } else if (configType.includes('nginx')) {
      setSelectedCategory('nginx');
    } else if (configType.includes('apache')) {
      setSelectedCategory('apache');
    } else if (configType.includes('terraform')) {
      setSelectedCategory('terraform');
    } else if (configType.includes('ansible')) {
      setSelectedCategory('ansible');
    } else if (configType.includes('ci') || configType.includes('cd')) {
      setSelectedCategory('cicd');
    } else {
      setSelectedCategory('other');
    }
  }, [configType]);

  // Генерация конфига
  const handleGenerateConfig = async () => {
    if (!selectedModel) {
      toast({
        title: 'Error',
        description: 'Please select a model for generation',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    setSavedSuccess(false);
    try {
      let parsedParams = {};
      try {
        parsedParams = JSON.parse(parameters);
      } catch (e) {
        toast({
          title: 'Error in parameters',
          description: 'Check the JSON format of parameters',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      const request: ConfigRequest = {
        model: selectedModel,
        config_type: configType,
        parameters: parsedParams,
        language,
      };

      const response = await api.config.generate(request);
      setGeneratedConfig(response.config);
    } catch (error) {
      console.error('Ошибка при генерации конфига:', error);
      toast({
        title: 'Error',
        description: 'Не удалось сгенерировать конфигурацию',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Открытие диалога сохранения в шпаргалку
  const handleOpenSaveDialog = () => {
    if (!generatedConfig) {
      toast({
        title: 'Error',
        description: 'Сначала сгенерируйте конфигурацию',
        variant: 'destructive',
      });
      return;
    }
    setSaveDialogOpen(true);
  };

  // Сохранение конфига в шпаргалку
  const handleSaveToCheatsheet = async () => {
    if (!selectedModel || !generatedConfig || !configType || !selectedCategory) {
      toast({
        title: 'Error',
        description: 'Не все поля заполнены',
        variant: 'destructive',
      });
      return;
    }

    setSavingToCheatsheet(true);
    try {
      let parsedParams = {};
      try {
        parsedParams = JSON.parse(parameters);
      } catch (e) {
        // В случае ошибки парсинга используем пустой объект
        console.error('Ошибка при парсинге параметров:', e);
      }

      const saveRequest: SaveConfigRequest = {
        model: selectedModel,
        config_type: configType,
        content: generatedConfig,
        parameters: parsedParams,
        language,
        category: selectedCategory,
      };

      await api.config.saveToCheatsheet(saveRequest);
      setSavedSuccess(true);
      setSaveDialogOpen(false);
      toast({
        title: 'Success',
        description: 'Configuration added to snippets',
      });
    } catch (error) {
      console.error('Error saving config:', error);
      toast({
        title: 'Error',
        description: 'Failed to save configuration',
        variant: 'destructive',
      });
    } finally {
      setSavingToCheatsheet(false);
    }
  };

  // Копирование конфига в буфер обмена
  const handleCopyConfig = () => {
    navigator.clipboard.writeText(generatedConfig);
    toast({
      title: 'Copied',
      description: 'Configuration copied to clipboard',
    });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Configuration Generator</CardTitle>
        <CardDescription>
          Create configuration files using AI for various technologies and in different languages
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="input" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="input">Parameters</TabsTrigger>
            <TabsTrigger value="output">Result</TabsTrigger>
          </TabsList>
          
          <TabsContent value="input" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="model">AI Model</Label>
              <Select value={selectedModel} onValueChange={setSelectedModel}>
                <SelectTrigger id="model">
                  <SelectValue placeholder="Select a model" />
                </SelectTrigger>
                <SelectContent>
                  {models.map((model) => (
                    <SelectItem key={model} value={model}>
                      {model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="configType">Configuration Type</Label>
              <Select value={configType} onValueChange={setConfigType}>
                <SelectTrigger id="configType">
                  <SelectValue placeholder="Select configuration type" />
                </SelectTrigger>
                <SelectContent>
                  {CONFIG_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="language">Documentation Language</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger id="language">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((lang) => (
                    <SelectItem key={lang.value} value={lang.value}>
                      {lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="parameters">Parameters (JSON)</Label>
              <Textarea
                id="parameters"
                value={parameters}
                onChange={(e) => setParameters(e.target.value)}
                className="font-mono h-60"
              />
            </div>
          </TabsContent>
          
          <TabsContent value="output">
            <div className="space-y-4">
              {generatedConfig ? (
                <>
                  <div className="flex justify-between items-center">
                    <Label>Generated Configuration</Label>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" onClick={handleCopyConfig}>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleOpenSaveDialog} 
                        className={savedSuccess ? "bg-green-50 text-green-600 border-green-200" : ""}
                      >
                        {savedSuccess ? (
                          <Check className="h-4 w-4 mr-2" />
                        ) : (
                          <BookmarkPlus className="h-4 w-4 mr-2" />
                        )}
                        {savedSuccess ? "Added" : "Add to Snippets"}
                      </Button>
                    </div>
                  </div>
                  <Textarea
                    value={generatedConfig}
                    readOnly
                    className="font-mono h-60"
                  />
                </>
              ) : (
                <div className="text-center p-6 text-muted-foreground">
                  The generated configuration file will be displayed here. Fill in the parameters and click "Generate".
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Save to snippets dialog */}
        <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add to Snippets</DialogTitle>
              <DialogDescription>
                Select a category to save the configuration. AI will automatically create a title and description.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>Cancel</Button>
              <Button 
                onClick={handleSaveToCheatsheet} 
                disabled={savingToCheatsheet || !selectedCategory} 
              >
                {savingToCheatsheet && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {savingToCheatsheet ? 'Saving...' : 'Save'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleGenerateConfig} 
          disabled={loading || !selectedModel} 
          className="w-full"
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {loading ? 'Generating...' : 'Generate Configuration'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ConfigGenerator; 