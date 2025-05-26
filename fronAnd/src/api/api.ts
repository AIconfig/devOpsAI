import axios from 'axios';

const API_URL = '/api';

// Функция для повторных попыток запроса с таймаутом
const fetchWithRetry = async (url: string, options: any = {}, retries = 2, timeout = 5000) => {
  let lastError;

  for (let i = 0; i < retries; i++) {
    try {
      // Создаем абортконтроллер для таймаута
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      const signal = options.signal || controller.signal;
      const response = await fetch(url, { ...options, signal });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      lastError = error;
      console.warn(`Attempt ${i + 1} failed: ${error}`);
      
      // Если это не последняя попытка, подождем перед следующей
      if (i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }
  
  throw lastError;
};

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Добавляем таймаут для всех запросов
  timeout: 10000,
});

// Добавляем интерцепторы для глобальной обработки ошибок
api.interceptors.response.use(
  response => response,
  error => {
    // Проверяем ошибки сети или таймаута
    if (error.code === 'ECONNABORTED' || error.message === 'Network Error' || !error.response) {
      console.error('Сетевая ошибка или таймаут:', error);
      // В случае ошибки сети возвращаем заглушку или пустой ответ
      if (error.config.url.includes('/ollama/models/')) {
        // Для запроса моделей возвращаем дефолтные модели
        return Promise.resolve({ 
          data: [
            { name: 'ollama/llama2' },
            { name: 'fallback/model' }
          ]
        });
      }
      if (error.config.url.includes('/config-snippets/')) {
        // Для запроса сниппетов возвращаем пустой массив
        return Promise.resolve({ data: [] });
      }
    }
    
    return Promise.reject(error);
  }
);

// Task interface matching the backend model
export interface Task {
  id?: number;
  title: string;
  description: string;
  completed: boolean;
  created_at?: string;
}

// Configuration generator interfaces
export interface ConfigRequest {
  model: string;
  config_type: string;
  parameters: Record<string, any>;
  language?: string;
}

export interface ConfigResponse {
  config: string;
  config_type: string;
  language: string;
}

// Saved config snippet interface
export interface ConfigSnippet {
  id?: number;
  title: string;
  description: string;
  config_type: string;
  content: string;
  category: string;
  language: string;
  parameters?: Record<string, any>;
  created_at?: string;
}

// Config save request
export interface SaveConfigRequest {
  model: string;
  config_type: string;
  content: string;
  parameters: Record<string, any>;
  language: string;
  category: string;
}

// API endpoints for tasks
const TasksAPI = {
  // Get all tasks
  getAll: async (): Promise<Task[]> => {
    const response = await api.get('/tasks/');
    return response.data;
  },

  // Get a single task
  get: async (id: number): Promise<Task> => {
    const response = await api.get(`/tasks/${id}/`);
    return response.data;
  },

  // Create a new task
  create: async (task: Task): Promise<Task> => {
    const response = await api.post('/tasks/', task);
    return response.data;
  },

  // Update a task
  update: async (id: number, task: Task): Promise<Task> => {
    const response = await api.put(`/tasks/${id}/`, task);
    return response.data;
  },

  // Delete a task
  delete: async (id: number): Promise<void> => {
    await api.delete(`/tasks/${id}/`);
  },
};

// API endpoints for config generation
const ConfigAPI = {
  // Generate configuration file
  generate: async (request: ConfigRequest): Promise<ConfigResponse> => {
    const response = await api.post('/config/generate/', request);
    return response.data;
  },

  // Save configuration to cheatsheet
  saveToCheatsheet: async (request: SaveConfigRequest): Promise<ConfigSnippet> => {
    const response = await api.post('/config/save/', request);
    return response.data;
  },

  // Get all config snippets
  getSnippets: async (): Promise<ConfigSnippet[]> => {
    const response = await api.get('/config-snippets/');
    return response.data;
  },

  // Get snippets by category
  getSnippetsByCategory: async (category: string): Promise<ConfigSnippet[]> => {
    const response = await api.get(`/config-snippets/?category=${category}`);
    return response.data;
  },

  // Get a single snippet
  getSnippet: async (id: number): Promise<ConfigSnippet> => {
    const response = await api.get(`/config-snippets/${id}/`);
    return response.data;
  },

  // Delete a snippet
  deleteSnippet: async (id: number): Promise<void> => {
    await api.delete(`/config-snippets/${id}/`);
  },
};

export default {
  tasks: TasksAPI,
  config: ConfigAPI,
}; 