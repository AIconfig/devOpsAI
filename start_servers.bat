@echo off
echo ===================================================
echo = DevOps Portal - Запуск серверов                 =
echo ===================================================

:: Проверка Ollama
echo Проверка доступности Ollama API...
curl -s -o nul -w "%%{http_code}" http://localhost:11434/api/tags > ollama_status.txt
set /p OLLAMA_STATUS=<ollama_status.txt
del ollama_status.txt

if "%OLLAMA_STATUS%"=="200" (
  echo [OK] Сервер Ollama API запущен и доступен!
  set OLLAMA_API_URL=http://localhost:11434
  set OLLAMA_USE_FALLBACK=False
) else (
  echo [ПРЕДУПРЕЖДЕНИЕ] Сервер Ollama не найден или не доступен!
  echo Будет использован режим имитации для API. Для полноценной работы установите и запустите Ollama.
  set OLLAMA_API_URL=http://localhost:11434
  set OLLAMA_USE_FALLBACK=True
)

:: Запуск Django бэкенда
echo.
echo Запуск Django бэкенда...
start cmd /c "cd backAnd && python manage.py runserver"

:: Запуск фронтенда
echo.
echo Запуск фронтенда...
start cmd /c "cd fronAnd && npm run dev"

echo.
echo ===================================================
echo Серверы запущены! Откройте http://localhost:8080 в браузере
echo =================================================== 