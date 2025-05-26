import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { PageLayout } from '@/components/PageLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Copy, Eye, Trash2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import api, { ConfigSnippet } from '@/api/api';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Категории для фильтрации
const CATEGORIES = [
  { value: 'all', label: 'All' },
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

const ConfigSnippetsPage = () => {
  const [snippets, setSnippets] = useState<ConfigSnippet[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSnippet, setSelectedSnippet] = useState<ConfigSnippet | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  
  const { toast } = useToast();
  const { category } = useParams<{ category?: string }>();

  // Загрузка сниппетов при монтировании или изменении категории
  useEffect(() => {
    const fetchSnippets = async () => {
      setLoading(true);
      
      // Добавляем абортконтроллер и таймаут для запроса
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 секунд таймаут
      
      try {
        let data;
        
        try {
          if (category && category !== 'all') {
            setActiveTab(category);
            data = await api.config.getSnippetsByCategory(category);
          } else {
            setActiveTab('all');
            data = await api.config.getSnippets();
          }
          
          setSnippets(data || []);
          clearTimeout(timeoutId);
        } catch (fetchError) {
          console.error('Error loading configurations:', fetchError);
          // Если API вернул ошибку, устанавливаем пустой массив
          setSnippets([]);
          clearTimeout(timeoutId);
          
          toast({
            title: 'Notice',
            description: 'Temporary issues with loading configurations. Showing local data.',
            variant: 'default',
          });
        }
      } catch (error) {
        console.error('Error loading configurations:', error);
        // Устанавливаем пустой список конфигураций в случае ошибки
        setSnippets([]);
        
        toast({
          title: 'Loading issue',
          description: 'Failed to load saved configurations. Check your connection.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
        clearTimeout(timeoutId);
      }
    };

    fetchSnippets();
    
    // Очистка таймаута при размонтировании
    return () => {
      // Cleanup функция
    };
  }, [category, toast]);

  // Функция фильтрации сниппетов по активной категории
  const getFilteredSnippets = () => {
    if (activeTab === 'all') {
      return snippets;
    }
    return snippets.filter(snippet => snippet.category === activeTab);
  };

  // Открытие диалога просмотра конфига
  const handleViewSnippet = (snippet: ConfigSnippet) => {
    setSelectedSnippet(snippet);
    setViewDialogOpen(true);
  };

  // Открытие диалога удаления
  const handleDeleteClick = (id: number) => {
    setDeleteId(id);
    setDeleteDialogOpen(true);
  };

  // Удаление сниппета
  const handleDeleteSnippet = async () => {
    if (deleteId === null) return;
    
    try {
      await api.config.deleteSnippet(deleteId);
      setSnippets(snippets.filter(s => s.id !== deleteId));
      toast({
        title: 'Success',
        description: 'Configuration deleted',
      });
    } catch (error) {
      console.error('Error deleting configuration:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete configuration',
        variant: 'destructive',
      });
    } finally {
      setDeleteDialogOpen(false);
      setDeleteId(null);
    }
  };

  // Копирование конфига в буфер обмена
  const handleCopyConfig = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({
      title: 'Copied',
      description: 'Configuration copied to clipboard',
    });
  };

  return (
    <PageLayout>
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-8">Configuration Snippets</h1>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="flex flex-wrap h-auto p-1">
            {CATEGORIES.map((cat) => (
              <TabsTrigger 
                key={cat.value} 
                value={cat.value}
                className="mb-1"
              >
                {cat.label}
              </TabsTrigger>
            ))}
          </TabsList>
          
          {CATEGORIES.map((cat) => (
            <TabsContent key={cat.value} value={cat.value}>
              {loading ? (
                <div className="text-center py-10">Loading configurations...</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {getFilteredSnippets().length > 0 ? (
                    getFilteredSnippets().map((snippet) => (
                      <Card key={snippet.id} className="flex flex-col h-full">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">{snippet.title}</CardTitle>
                          <CardDescription className="text-xs text-muted-foreground">
                            {snippet.config_type} • {new Date(snippet.created_at || '').toLocaleDateString()}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="flex-grow">
                          <p className="text-sm line-clamp-3">{snippet.description}</p>
                        </CardContent>
                        <CardFooter className="pt-1 flex justify-end space-x-2">
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteClick(snippet.id || 0)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleCopyConfig(snippet.content)}>
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleViewSnippet(snippet)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Button>
                        </CardFooter>
                      </Card>
                    ))
                  ) : (
                    <div className="col-span-2 text-center py-10 text-muted-foreground">
                      {cat.value === 'all' 
                        ? 'You don\'t have any saved configurations yet. Generate and add a configuration in the generator.'
                        : `No saved configurations in the ${cat.label} category.`}
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {/* Configuration dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{selectedSnippet?.title}</DialogTitle>
            <DialogDescription>
              {selectedSnippet?.description}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-[60vh] overflow-auto">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Configuration</span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => selectedSnippet && handleCopyConfig(selectedSnippet.content)}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </Button>
            </div>
            <Textarea 
              value={selectedSnippet?.content} 
              readOnly 
              className="font-mono h-60"
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will permanently delete the configuration from your snippets.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSnippet}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageLayout>
  );
};

export default ConfigSnippetsPage; 