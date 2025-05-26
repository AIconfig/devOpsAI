from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    TaskViewSet, 
    ConfigSnippetViewSet,
    api_overview, 
    ollama_models, 
    ollama_generate, 
    ollama_stream, 
    generate_config,
    save_config_to_cheatsheet,
    ai_providers,
    ai_team_generate
)

router = DefaultRouter()
router.register(r'tasks', TaskViewSet)
router.register(r'config-snippets', ConfigSnippetViewSet)

urlpatterns = [
    path('', api_overview, name='api-overview'),
    path('', include(router.urls)),
    path('ollama/models/', ollama_models, name='ollama-models'),
    path('ollama/generate/', ollama_generate, name='ollama-generate'),
    path('ollama/stream/', ollama_stream, name='ollama-stream'),
    path('config/generate/', generate_config, name='generate-config'),
    path('config/save/', save_config_to_cheatsheet, name='save-config'),
    path('ai/providers/', ai_providers, name='ai-providers'),
    path('ai/team/generate/', ai_team_generate, name='ai-team-generate'),
] 