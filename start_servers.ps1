# DevOps Portal - Запуск серверов
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "= DevOps Portal - Запуск серверов                 =" -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan

# Проверка Ollama
Write-Host "Проверка доступности Ollama API..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:11434/api/tags" -TimeoutSec 2 -ErrorAction Stop
    $ollamaAvailable = $response.StatusCode -eq 200
} catch {
    $ollamaAvailable = $false
}

if ($ollamaAvailable) {
    Write-Host "[OK] Сервер Ollama API запущен и доступен!" -ForegroundColor Green
    $env:OLLAMA_API_URL = "http://localhost:11434"
    $env:OLLAMA_USE_FALLBACK = "False"
} else {
    Write-Host "[ПРЕДУПРЕЖДЕНИЕ] Сервер Ollama не найден или не доступен!" -ForegroundColor Yellow
    Write-Host "Будет использован режим имитации для API. Для полноценной работы установите и запустите Ollama." -ForegroundColor Yellow
    $env:OLLAMA_API_URL = "http://localhost:11434"
    $env:OLLAMA_USE_FALLBACK = "True"
}

# Запуск Django бэкенда
Write-Host "`nЗапуск Django бэкенда..." -ForegroundColor Cyan
Start-Process -FilePath "powershell" -ArgumentList "-Command cd backAnd; python manage.py runserver"

# Запуск фронтенда
Write-Host "`nЗапуск фронтенда..." -ForegroundColor Cyan
Start-Process -FilePath "powershell" -ArgumentList "-Command cd fronAnd; npm run dev"

Write-Host "`n===================================================" -ForegroundColor Green
Write-Host "Серверы запущены! Откройте http://localhost:8080 в браузере" -ForegroundColor Green
Write-Host "===================================================" -ForegroundColor Green 