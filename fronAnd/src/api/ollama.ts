import axios from 'axios';

// Базовый URL для Django API через прокси
const API_URL = '/api';

// Доступные провайдеры ИИ
export type AIProvider = 'ollama' | 'openai' | 'fallback' | 'anthropic' | 'gemini' | 'azure_openai' | 'huggingface' | 'team';

export interface OllamaModel {
  name: string;
  size?: number;
  modified_at?: string;
  token_limit?: number;
  description?: string;
}

export interface AIProviderInfo {
  name: string;
  display_name: string;
  available: boolean;
  default_model?: string;
  models_count?: number;
}

export interface OllamaGenerateRequest {
  model: string;
  prompt: string;
  provider?: AIProvider;
  stream?: boolean;
  options?: {
    temperature?: number;
    system_prompt?: string;
  };
  team_settings?: {
    providers?: string[];
    models?: string[];
  };
}

export interface OllamaGenerateResponse {
  model?: string;
  created_at?: string;
  response: string;
  done?: boolean;
  error?: string;
}

const aiApiClient = {
  // Получение списка моделей через Django API
  listModels: async (provider: AIProvider = 'ollama'): Promise<OllamaModel[]> => {
    try {
      const response = await axios.get(`${API_URL}/ollama/models/`, {
        params: { provider }
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching models from ${provider}:`, error);
      // Возвращаем набор резервных моделей в случае ошибки
      if (provider === 'openai') {
        return [
          { name: "gpt-3.5-turbo", description: "GPT-3.5 Turbo" },
          { name: "gpt-4", description: "GPT-4" }
        ];
      } else if (provider === 'anthropic') {
        return [
          { name: "claude-3-sonnet-20240229", description: "Claude 3 Sonnet" },
          { name: "claude-3-haiku-20240307", description: "Claude 3 Haiku" }
        ];
      } else if (provider === 'gemini') {
        return [
          { name: "gemini-pro", description: "Gemini Pro" }
        ];
      } else if (provider === 'huggingface') {
        return [
          { name: "mistralai/Mistral-7B-Instruct-v0.2", description: "Mistral 7B" }
        ];
      }
      return [
        { name: "llama3", description: "Meta Llama 3" },
        { name: "mistral", description: "Mistral AI" },
        { name: "codellama", description: "Code Llama" }
      ];
    }
  },

  // Получение списка доступных провайдеров
  listProviders: async (): Promise<AIProviderInfo[]> => {
    try {
      const response = await axios.get(`${API_URL}/ai/providers/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching AI providers:', error);
      // Резервный набор провайдеров
      return [
        { name: 'ollama', display_name: 'Ollama', available: true },
        { name: 'fallback', display_name: 'Локальный ИИ', available: true },
        { name: 'team', display_name: 'AI Team', available: true }
      ];
    }
  },

  // Генерация текста (не потоковая) через Django API
  generateCompletion: async (request: OllamaGenerateRequest): Promise<string> => {
    try {
      // Выбираем соответствующий эндпоинт в зависимости от провайдера
      const endpoint = request.provider === 'team' 
        ? `${API_URL}/ai/team/generate/` 
        : `${API_URL}/ollama/generate/`;
      
      const payload = request.provider === 'team' 
        ? {
            prompt: request.prompt,
            temperature: request.options?.temperature || 0.7,
            providers: request.team_settings?.providers,
            models: request.team_settings?.models
          }
        : {
            model: request.model,
            prompt: request.prompt,
            temperature: request.options?.temperature || 0.7,
            provider: request.provider || 'ollama'
          };
      
      const response = await axios.post(endpoint, payload);
      return response.data.response;
    } catch (error) {
      console.error(`Error generating completion:`, error);
      throw error;
    }
  },

  // Потоковая генерация текста через Django API
  streamCompletion: async (
    request: OllamaGenerateRequest,
    onChunk: (chunk: string) => void,
    onComplete: (fullResponse: string) => void
  ): Promise<void> => {
    // Команда AI не поддерживает потоковую генерацию, поэтому используем обычную
    if (request.provider === 'team') {
      try {
        const response = await aiApiClient.generateCompletion(request);
        
        // Эмулируем стриминговую генерацию
        const chunkSize = Math.max(5, response.length / 10);
        let start = 0;
        
        // Функция для имитации стриминга
        const simulateStream = () => {
          if (start < response.length) {
            const end = Math.min(start + chunkSize, response.length);
            const chunk = response.substring(start, end);
            onChunk(chunk);
            start = end;
            
            setTimeout(simulateStream, 50);
          } else {
            onComplete(response);
          }
        };
        
        simulateStream();
      } catch (error) {
        console.error('Error generating team completion:', error);
        onChunk('\n\nПроизошла ошибка при получении ответа от AI Team.');
        onComplete('\n\nПроизошла ошибка при получении ответа от AI Team.');
      }
      return;
    }
    
    try {
      const abortController = new AbortController();
      const timeoutId = setTimeout(() => abortController.abort(), 30000); // 30-секундный таймаут

      const response = await fetch(`${API_URL}/ollama/stream/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: request.model,
          prompt: request.prompt,
          temperature: request.options?.temperature || 0.7,
          provider: request.provider || 'ollama'
        }),
        signal: abortController.signal
      });

      clearTimeout(timeoutId);

      if (!response.body) {
        throw new Error('ReadableStream not supported in this browser.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';
      let errorOccurred = false;

      const processStream = async (): Promise<void> => {
        try {
          const { done, value } = await reader.read();
          
          if (done) {
            onComplete(fullResponse);
            return;
          }

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n').filter(Boolean);
          
          for (const line of lines) {
            try {
              const data = JSON.parse(line);
              
              // Обработка сообщений об ошибках
              if (data.error) {
                console.error('Error from API:', data.error);
                errorOccurred = true;
                fullResponse += `\n\nОшибка: ${data.error}`;
                onChunk(`\n\nОшибка: ${data.error}`);
                onComplete(fullResponse);
                return;
              }
              
              if (data.response) {
                fullResponse += data.response;
                onChunk(data.response);
              }
              
              if (data.done) {
                onComplete(fullResponse);
                return;
              }
            } catch (error) {
              console.error('Error parsing JSON:', error);
            }
          }
          
          await processStream();
        } catch (error) {
          if (!errorOccurred) {
            console.error('Error in stream processing:', error);
            const errorMessage = '\n\nПроизошла ошибка при получении ответа. Пожалуйста, попробуйте снова.';
            fullResponse += errorMessage;
            onChunk(errorMessage);
            onComplete(fullResponse);
          }
        }
      };

      await processStream();
    } catch (error) {
      console.error('Error streaming completion:', error);
      onChunk('\n\nСервер не отвечает. Пожалуйста, проверьте подключение или попробуйте позже.');
      onComplete('\n\nСервер не отвечает. Пожалуйста, проверьте подключение или попробуйте позже.');
    }
  }
};

export default aiApiClient; 