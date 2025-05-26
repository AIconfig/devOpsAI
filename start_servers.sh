#!/bin/bash

echo "==================================================="
echo "= DevOps Portal - Запуск серверов                 ="
echo "==================================================="

# Проверка Ollama
echo "Проверка доступности Ollama API..."
OLLAMA_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:11434/api/tags || echo "000")

if [ "$OLLAMA_STATUS" = "200" ]; then
  echo "[OK] Сервер Ollama API запущен и доступен!"
  export OLLAMA_API_URL=http://localhost:11434
  export OLLAMA_USE_FALLBACK=False
else
  echo "[ПРЕДУПРЕЖДЕНИЕ] Сервер Ollama не найден или не доступен! (код $OLLAMA_STATUS)"
  echo "Будет использован режим имитации для API. Для полноценной работы установите и запустите Ollama."
  export OLLAMA_API_URL=http://localhost:11434
  export OLLAMA_USE_FALLBACK=True
fi

# Запуск Django бэкенда в фоновом режиме
echo ""
echo "Запуск Django бэкенда..."
cd backAnd && python manage.py runserver &
BACKEND_PID=$!
cd ..

# Запуск фронтенда в фоновом режиме
echo ""
echo "Запуск фронтенда..."
cd fronAnd && npm run dev &
FRONTEND_PID=$!

echo ""
echo "==================================================="
echo "Серверы запущены! Откройте http://localhost:8080 в браузере"
echo "Для остановки серверов нажмите Ctrl+C"
echo "==================================================="

# Ловим сигнал для корректного завершения всех процессов
trap 'kill $BACKEND_PID $FRONTEND_PID; echo "Серверы остановлены"; exit 0' INT TERM

# Держим скрипт запущенным
wait 