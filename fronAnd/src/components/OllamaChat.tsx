import React, { useState, useEffect, useRef } from 'react';
import aiApiClient, { OllamaModel, AIProvider, AIProviderInfo } from '@/api/ollama';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Loader2, Send, BrainCircuit, Settings2, X } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";

// Примеры подсказок для пользователя
const EXAMPLE_PROMPTS = [
  "Как настроить виртуальные хосты в Nginx?",
  "Как поднять VPN сервер на Ubuntu?",
  "Объясни процесс загрузки Linux системы",
  "Напиши скрипт для мониторинга свободного места на диске",
  "Как настроить SSH ключи для безопасного доступа?",
  "Как настроить «луковичный» протокол (Tor) для анонимного доступа?",
  "Как создать и настроить Docker контейнер?",
  "Объясни, как работает RAID и какие есть уровни RAID",
];

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface TeamSettings {
  enabled: boolean;
  providers: string[];
  models: {[key: string]: string};
}

const AIChat: React.FC = () => {
  // Провайдеры и модели
  const [availableProviders, setAvailableProviders] = useState<AIProviderInfo[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<AIProvider>('ollama');
  const [models, setModels] = useState<OllamaModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');
  
  // Командные настройки
  const [teamSettings, setTeamSettings] = useState<TeamSettings>({
    enabled: false,
    providers: [],
    models: {}
  });
  
  // Состояние чата
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: 'system', 
      content: 'Я - ассистент DevOps, который может отвечать на вопросы о UNIX-системах, сетях, безопасности, контейнеризации, CI/CD и других аспектах DevOps. Я могу объяснять сложные концепции и предоставлять примеры команд и конфигурационных файлов.'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [temperature, setTemperature] = useState(0.7);
  const [isLoadingModels, setIsLoadingModels] = useState(true);
  const [isLoadingProviders, setIsLoadingProviders] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Refs
  const chatEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Загрузка провайдеров при инициализации
  useEffect(() => {
    fetchProviders();
  }, []);

  // Загрузка моделей при изменении провайдера
  useEffect(() => {
    if (selectedProvider === 'team') {
      setIsLoadingModels(false);
      return;
    }
    fetchModels();
  }, [selectedProvider]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Автоматически увеличивать размер текстовой области при вводе
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  const fetchProviders = async () => {
    setIsLoadingProviders(true);
    try {
      const providers = await aiApiClient.listProviders();
      setAvailableProviders(providers);
      
      // Автоматически выбрать первый доступный провайдер
      const availableProvider = providers.find(p => p.available);
      if (availableProvider) {
        setSelectedProvider(availableProvider.name as AIProvider);
      }
    } catch (error) {
      console.error("Failed to fetch providers:", error);
    } finally {
      setIsLoadingProviders(false);
    }
  };

  const fetchModels = async () => {
    setIsLoadingModels(true);
    setErrorMessage(null);
    try {
      const modelList = await aiApiClient.listModels(selectedProvider);
      setModels(modelList);
      if (modelList.length > 0) {
        setSelectedModel(modelList[0].name);
      }
    } catch (error) {
      console.error(`Failed to fetch models from ${selectedProvider}:`, error);
      setErrorMessage(`Не удалось загрузить список моделей от провайдера ${selectedProvider}.`);
    } finally {
      setIsLoadingModels(false);
    }
  };

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;
    
    // Проверяем, выбрана ли модель (если не режим команды)
    if (selectedProvider !== 'team' && !selectedModel) {
      setErrorMessage("Пожалуйста, выберите модель");
      return;
    }

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev.filter(m => m.role !== 'system'), userMessage]);
    setInput('');
    setIsLoading(true);
    setErrorMessage(null);

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    try {
      const assistantMessage: Message = { role: 'assistant', content: '' };
      setMessages(prev => [...prev, assistantMessage]);

      // Генерация запроса в зависимости от выбранного режима
      const request = selectedProvider === 'team' 
        ? {
            model: "",
            prompt: input,
            provider: 'team',
            options: { temperature },
            team_settings: {
              providers: teamSettings.providers,
              models: Object.values(teamSettings.models)
            }
          }
        : {
            model: selectedModel,
            prompt: input,
            provider: selectedProvider,
            options: { temperature }
          };

      await aiApiClient.streamCompletion(
        request,
        (chunk) => {
          setMessages(prev => {
            const newMessages = [...prev];
            const lastMessage = newMessages[newMessages.length - 1];
            lastMessage.content += chunk;
            return newMessages;
          });
        },
        () => {
          setIsLoading(false);
        }
      );
    } catch (error) {
      console.error('Error generating response:', error);
      setIsLoading(false);
      setErrorMessage(`Ошибка генерации ответа. Возможно, сервер ${selectedProvider} недоступен.`);
      setMessages(prev => {
        const newMessages = [...prev];
        const lastIndex = newMessages.length - 1;
        // Если последнее сообщение пустое, добавляем сообщение об ошибке
        if (lastIndex >= 0 && newMessages[lastIndex].role === 'assistant' && !newMessages[lastIndex].content.trim()) {
          newMessages[lastIndex].content = 'Извините, произошла ошибка при генерации ответа. Пожалуйста, попробуйте еще раз или выберите другого провайдера ИИ.';
        }
        return newMessages;
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleExampleClick = (example: string) => {
    setInput(example);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };
  
  // Обработчик для настроек команды AI
  const handleProviderToggle = (provider: string, checked: boolean) => {
    setTeamSettings(prev => {
      let updatedProviders = [...prev.providers];
      let updatedModels = {...prev.models};
      
      if (checked) {
        // Добавляем провайдера и выбираем первую модель
        updatedProviders.push(provider);
        const providerInfo = availableProviders.find(p => p.name === provider);
        if (providerInfo && providerInfo.default_model) {
          updatedModels[provider] = providerInfo.default_model;
        }
      } else {
        // Удаляем провайдера и его модель
        updatedProviders = updatedProviders.filter(p => p !== provider);
        delete updatedModels[provider];
      }
      
      return {
        ...prev,
        providers: updatedProviders,
        models: updatedModels
      };
    });
  };
  
  // Обработчик для выбора модели в настройках команды
  const handleTeamModelChange = (provider: string, model: string) => {
    setTeamSettings(prev => ({
      ...prev,
      models: {
        ...prev.models,
        [provider]: model
      }
    }));
  };

  const visibleMessages = messages.filter(m => m.role !== 'system');

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BrainCircuit className="h-6 w-6" />
          DevOps AI Chat
        </CardTitle>
        <CardDescription>
          Задавайте вопросы о UNIX системах, сетях, инфраструктуре и DevOps
        </CardDescription>

        <Tabs 
          defaultValue={selectedProvider} 
          value={selectedProvider}
          onValueChange={(value) => setSelectedProvider(value as AIProvider)}
          className="mt-2"
        >
          <TabsList className="grid grid-cols-4 mb-2">
            <TabsTrigger value="ollama" disabled={isLoadingProviders || !availableProviders.some(p => p.name === 'ollama' && p.available)}>
              Ollama
            </TabsTrigger>
            <TabsTrigger value="openai" disabled={isLoadingProviders || !availableProviders.some(p => p.name === 'openai' && p.available)}>
              OpenAI
            </TabsTrigger>
            <TabsTrigger value="team" disabled={isLoadingProviders}>
              AI Team
            </TabsTrigger>
            <TabsTrigger value="fallback" disabled={isLoadingProviders || !availableProviders.some(p => p.name === 'fallback' && p.available)}>
              Локальный ИИ
            </TabsTrigger>
          </TabsList>
          
          <div className="mt-2">
            {/* Для командного режима показываем диалог настройки */}
            {selectedProvider === 'team' && (
              <div className="border rounded-md p-3 mb-3 bg-muted/20">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium">AI Team - командный режим</h3>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Settings2 className="h-4 w-4 mr-1" />
                        Настроить
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Настройка AI Team</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 my-2">
                        <p className="text-sm text-muted-foreground">
                          Выберите провайдеры ИИ, которые будут работать вместе над вашим запросом.
                          Результаты от разных моделей будут объединены в единый ответ.
                        </p>
                        <div className="space-y-2">
                          {availableProviders
                            .filter(p => p.name !== 'team' && p.available)
                            .map(provider => (
                              <div key={provider.name} className="flex flex-col space-y-2 p-2 border rounded-md">
                                <div className="flex justify-between items-center">
                                  <div className="flex items-center space-x-2">
                                    <Checkbox 
                                      id={`use-${provider.name}`}
                                      checked={teamSettings.providers.includes(provider.name)}
                                      onCheckedChange={(checked) => 
                                        handleProviderToggle(provider.name, checked as boolean)
                                      }
                                    />
                                    <Label htmlFor={`use-${provider.name}`}>{provider.display_name}</Label>
                                  </div>
                                  <Badge variant="outline">
                                    {provider.models_count || 0} моделей
                                  </Badge>
                                </div>
                                
                                {teamSettings.providers.includes(provider.name) && (
                                  <div className="ml-6">
                                    <Label htmlFor={`model-${provider.name}`} className="text-xs">
                                      Модель
                                    </Label>
                                    <Select 
                                      value={teamSettings.models[provider.name] || ''}
                                      onValueChange={(value) => handleTeamModelChange(provider.name, value)}
                                    >
                                      <SelectTrigger id={`model-${provider.name}`} className="mt-1">
                                        <SelectValue placeholder="Выберите модель" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value={provider.default_model || ''}>
                                          {provider.default_model || "Модель по умолчанию"}
                                        </SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                )}
                              </div>
                            ))}
                        </div>
                      </div>
                      <DialogClose asChild>
                        <Button className="w-full">Применить</Button>
                      </DialogClose>
                    </DialogContent>
                  </Dialog>
                </div>
                
                <div className="flex flex-wrap gap-2 mt-2">
                  {teamSettings.providers.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Нажмите "Настроить" чтобы выбрать провайдеров для команды ИИ
                    </p>
                  ) : (
                    teamSettings.providers.map(provider => {
                      const providerInfo = availableProviders.find(p => p.name === provider);
                      return (
                        <Badge key={provider} variant="secondary" className="flex items-center gap-1">
                          {providerInfo?.display_name || provider}
                          <X 
                            className="h-3 w-3 cursor-pointer" 
                            onClick={() => handleProviderToggle(provider, false)}
                          />
                        </Badge>
                      );
                    })
                  )}
                </div>
              </div>
            )}
            
            {/* Для обычных моделей показываем выбор модели */}
            {selectedProvider !== 'team' && (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="model-select">Модель</Label>
                  <Select value={selectedModel} onValueChange={setSelectedModel} disabled={isLoadingModels}>
                    <SelectTrigger id="model-select">
                      <SelectValue placeholder={isLoadingModels ? "Загрузка моделей..." : "Выберите модель"} />
                    </SelectTrigger>
                    <SelectContent position="popper">
                      {models.map((model) => (
                        <SelectItem key={model.name} value={model.name}>
                          {model.description || model.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>
        </Tabs>
        
        <div className="flex flex-col gap-4 mt-2">
          <div className="flex flex-col space-y-1.5">
            <Label htmlFor="temperature-slider">
              Креативность: {temperature.toFixed(1)}
            </Label>
            <Slider
              id="temperature-slider"
              min={0}
              max={1}
              step={0.1}
              value={[temperature]}
              onValueChange={(values) => setTemperature(values[0])}
            />
          </div>
          {errorMessage && (
            <div className="text-red-500 text-sm mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
              {errorMessage}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 h-[400px] overflow-y-auto p-4 border rounded-lg bg-background">
          {visibleMessages.length === 0 ? (
            <div className="text-center text-muted-foreground h-full flex flex-col items-center justify-center gap-4">
              <p className="text-lg">Задайте вопрос о UNIX, Linux, сетях или DevOps</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 w-full max-w-2xl">
                {EXAMPLE_PROMPTS.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => handleExampleClick(prompt)}
                    className="text-sm text-left px-3 py-2 border rounded-md hover:bg-muted transition-colors"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            visibleMessages.map((message, index) => (
              <div
                key={index}
                className={`flex flex-col ${
                  message.role === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))
          )}
          <div ref={chatEndRef} />
        </div>
      </CardContent>
      <CardFooter>
        <div className="flex w-full space-x-2">
          <Textarea
            ref={textareaRef}
            placeholder="Спросите что-либо о Linux/Unix, сетях, VPN, Docker..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={
              isLoading || 
              !input.trim() || 
              (selectedProvider !== 'team' && !selectedModel) || 
              isLoadingModels || 
              (selectedProvider === 'team' && teamSettings.providers.length === 0)
            }
            className="flex-1 min-h-[80px] max-h-[200px] resize-none"
          />
          <Button
            onClick={handleSendMessage}
            disabled={
              isLoading || 
              !input.trim() || 
              (selectedProvider !== 'team' && !selectedModel) || 
              isLoadingModels || 
              (selectedProvider === 'team' && teamSettings.providers.length === 0)
            }
            className="self-end h-10 w-10 p-2"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default AIChat; 