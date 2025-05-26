from django.shortcuts import render
from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework.decorators import api_view
from .models import Task, ConfigSnippet
from .serializers import TaskSerializer, ConfigSnippetSerializer
from django.http import StreamingHttpResponse
import json
from . import ollama
from .ai_providers import ai_service

# Create your views here.

class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.all().order_by('-created_at')
    serializer_class = TaskSerializer

class ConfigSnippetViewSet(viewsets.ModelViewSet):
    queryset = ConfigSnippet.objects.all().order_by('-created_at')
    serializer_class = ConfigSnippetSerializer

@api_view(['GET'])
def api_overview(request):
    api_urls = {
        'List': '/tasks/',
        'Detail View': '/tasks/<int:id>/',
        'Create': '/tasks/',
        'Update': '/tasks/<int:id>/',
        'Delete': '/tasks/<int:id>/',
        'Ollama Models': '/ollama/models/',
        'Ollama Generate': '/ollama/generate/',
        'Ollama Stream': '/ollama/stream/',
        'Generate Config': '/config/generate/',
        'Config Snippets': '/config-snippets/',
        'Save Config': '/config/save/',
        'AI Providers': '/ai/providers/',
        'AI Team Generate': '/ai/team/generate/',
    }
    return Response(api_urls)

# Ollama API endpoints

@api_view(['GET'])
def ollama_models(request):
    """Endpoint для получения списка моделей"""
    provider = request.query_params.get('provider', 'ollama')
    models = ai_service.list_models(provider=provider)
    return Response(models)

@api_view(['POST'])
def ollama_generate(request):
    """Endpoint для генерации текста"""
    data = request.data
    model = data.get('model', 'llama3')
    prompt = data.get('prompt', '')
    temperature = data.get('temperature', 0.7)
    provider = data.get('provider', 'ollama')
    
    if not prompt:
        return Response({'error': 'Prompt is required'}, status=400)
    
    response = ai_service.generate_completion(
        model=model,
        prompt=prompt,
        provider=provider,
        temperature=temperature,
        stream=False
    )
    
    return Response({'response': response})

def ollama_stream(request):
    """Endpoint для потоковой генерации текста"""
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            model = data.get('model', 'llama3')
            prompt = data.get('prompt', '')
            temperature = data.get('temperature', 0.7)
            provider = data.get('provider', 'ollama')
            
            if not prompt:
                return StreamingHttpResponse(
                    json.dumps({'error': 'Prompt is required'}),
                    content_type='application/json',
                    status=400
                )
            
            def event_stream():
                stream = ai_service.generate_completion(
                    model=model,
                    prompt=prompt,
                    provider=provider,
                    temperature=temperature,
                    stream=True
                )
                
                for chunk in stream:
                    yield f"{chunk}\n"
            
            return StreamingHttpResponse(
                event_stream(),
                content_type='application/json'
            )
        except Exception as e:
            return StreamingHttpResponse(
                json.dumps({'error': str(e)}),
                content_type='application/json',
                status=500
            )
    else:
        return StreamingHttpResponse(
            json.dumps({'error': 'Method not allowed'}),
            content_type='application/json',
            status=405
        )

@api_view(['POST'])
def generate_config(request):
    """Генерация конфигурационных файлов с помощью ИИ"""
    model = request.data.get('model', '')
    config_type = request.data.get('config_type', '')
    parameters = request.data.get('parameters', {})
    language = request.data.get('language', 'english')
    
    if not model or not config_type:
        return Response({'error': 'Необходимо указать model и config_type'}, status=400)
    
    # Формируем запрос для LLM
    prompt = f"""Создай конфигурационный файл для {config_type} со следующими параметрами:
{json.dumps(parameters, indent=2)}

Язык комментариев и документации: {language}

Пожалуйста, предоставь только код конфигурации без дополнительных объяснений."""
    
    response = ollama.generate_completion(model, prompt, temperature=0.3)
    
    # Попытка извлечь только код конфигурации (если модель вернула лишний текст)
    config_content = response.strip()
    
    return Response({
        'config': config_content,
        'config_type': config_type,
        'language': language
    })

@api_view(['POST'])
def save_config_to_cheatsheet(request):
    """Сохранение конфигурации в шпаргалку с автоматическим созданием описания через ИИ"""
    model = request.data.get('model', '')
    config_type = request.data.get('config_type', '')
    content = request.data.get('content', '')
    parameters = request.data.get('parameters', {})
    language = request.data.get('language', 'english')
    category = request.data.get('category', 'other')
    
    if not model or not content or not config_type:
        return Response({'error': 'Необходимо указать model, content и config_type'}, status=400)
    
    # Генерируем название и описание через ИИ
    description_prompt = f"""Проанализируй следующий конфигурационный файл {config_type} и предоставь:
1. Краткое название (не более 5-7 слов)
2. Детальное описание (3-5 предложений), объясняющее что делает этот конфиг, какие проблемы решает и почему он полезен

Конфигурация:
```
{content}
```

Пожалуйста, верни ответ в формате JSON:
{{
  "title": "Краткое название",
  "description": "Подробное описание..."
}}

Язык для названия и описания: {language}"""
    
    description_response = ollama.generate_completion(model, description_prompt, temperature=0.3)
    
    try:
        # Пытаемся извлечь JSON из ответа модели
        description_data = json.loads(description_response)
        title = description_data.get('title', f"{config_type.capitalize()} Configuration")
        description = description_data.get('description', f"Configuration for {config_type}")
    except:
        # Если не удалось распарсить JSON, используем стандартные значения
        title = f"{config_type.capitalize()} Configuration"
        description = f"Configuration for {config_type}"
    
    # Создаем новую запись в базе данных
    snippet = ConfigSnippet(
        title=title,
        description=description,
        config_type=config_type,
        content=content,
        category=category,
        language=language,
        parameters=parameters
    )
    snippet.save()
    
    # Возвращаем созданную запись
    serializer = ConfigSnippetSerializer(snippet)
    return Response(serializer.data)

@api_view(['GET'])
def ai_providers(request):
    """Endpoint для получения списка доступных провайдеров ИИ"""
    available_providers = []
    
    for provider_name, provider in ai_service.providers.items():
        if provider.check_connection():
            # Получаем первую доступную модель для каждого провайдера
            models = provider.list_models()
            default_model = models[0]["name"] if models else ""
            
            available_providers.append({
                "name": provider_name,
                "display_name": get_provider_display_name(provider_name),
                "available": True,
                "default_model": default_model,
                "models_count": len(models)
            })
        else:
            available_providers.append({
                "name": provider_name,
                "display_name": get_provider_display_name(provider_name),
                "available": False
            })
    
    return Response(available_providers)

@api_view(['POST'])
def ai_team_generate(request):
    """Endpoint для коллаборативной генерации текста несколькими моделями ИИ"""
    data = request.data
    prompt = data.get('prompt', '')
    providers = data.get('providers', None)  # Список провайдеров или None для автоматического выбора
    models = data.get('models', None)        # Список моделей или None для автоматического выбора
    temperature = data.get('temperature', 0.7)
    
    if not prompt:
        return Response({'error': 'Prompt is required'}, status=400)
    
    try:
        response = ai_service.collaborate(
            prompt=prompt,
            providers=providers,
            models=models,
            temperature=temperature
        )
        
        return Response({'response': response})
    except Exception as e:
        return Response({'error': str(e)}, status=500)

def get_provider_display_name(provider: str) -> str:
    """Получить отображаемое имя провайдера"""
    display_names = {
        'ollama': 'Ollama',
        'openai': 'OpenAI',
        'anthropic': 'Anthropic Claude',
        'gemini': 'Google Gemini',
        'azure_openai': 'Azure OpenAI',
        'huggingface': 'Hugging Face',
        'fallback': 'Локальный ИИ'
    }
    return display_names.get(provider, provider.capitalize())
