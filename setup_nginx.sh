#!/bin/bash

# Скрипт для настройки Nginx для DevOpsAI

# Проверяем права администратора
if [ "$EUID" -ne 0 ]; then
  echo "Пожалуйста, запустите скрипт с правами root"
  exit 1
fi

# Проверяем, установлен ли Nginx
if ! command -v nginx &> /dev/null; then
  echo "Установка Nginx..."
  apt update
  apt install -y nginx
fi

# Устанавливаем конфигурацию
echo "Настройка Nginx для DevOpsAI..."
cp /home/server/Bogdan/devOpsAI/nginx-config.conf /etc/nginx/sites-available/devopsai

# Создаем символьную ссылку
ln -sf /etc/nginx/sites-available/devopsai /etc/nginx/sites-enabled/

# Удаляем стандартную конфигурацию
rm -f /etc/nginx/sites-enabled/default

# Проверяем конфигурацию
echo "Проверка конфигурации Nginx..."
nginx -t

if [ $? -eq 0 ]; then
  # Перезапускаем Nginx
  echo "Перезапуск Nginx..."
  systemctl restart nginx
  echo "Nginx настроен успешно!"
  echo "Теперь вы можете открыть DevOpsAI по адресу: http://IP-адрес-сервера/"
else
  echo "Ошибка в конфигурации Nginx. Пожалуйста, проверьте файл конфигурации."
fi 