#!/usr/bin/env python
"""
Скрипт для автоматической настройки бесплатной модели AI (Llama3) через Ollama.
"""
import os
import sys
import subprocess
import platform
import requests
import time
import logging
from pathlib import Path

# Настройка логирования
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Константы
OLLAMA_VERSION = "0.1.30"
MODELS = [
    {"name": "llama3", "description": "Meta's Llama 3 model - best balance of quality and size"},
    {"name": "orca-mini", "description": "Orca Mini - very fast model with good quality"},
    {"name": "phi3", "description": "Microsoft's Phi-3 - compact and powerful model"}
]
DEFAULT_MODEL = "llama3"

def check_ollama_installed():
    """Проверка установлен ли Ollama"""
    try:
        if platform.system() == "Windows":
            result = subprocess.run(['where', 'ollama'], capture_output=True, text=True)
        else:  # Unix-like systems
            result = subprocess.run(['which', 'ollama'], capture_output=True, text=True)
        
        return result.returncode == 0
    except Exception as e:
        logger.error(f"Ошибка при проверке Ollama: {e}")
        return False

def install_ollama():
    """Установка Ollama"""
    system = platform.system().lower()
    
    instructions = {
        "windows": f"""
Для установки Ollama на Windows:

1. Скачайте установщик с официального сайта:
   https://ollama.com/download/windows

2. Запустите скачанный .msi файл и следуйте инструкциям установщика

3. После установки перезапустите компьютер или этот скрипт
""",
        "linux": f"""
Для установки Ollama на Linux выполните команду:

curl -fsSL https://ollama.com/install.sh | sh

После установки перезапустите этот скрипт
""",
        "darwin": f"""
Для установки Ollama на macOS выполните команду:

curl -fsSL https://ollama.com/install.sh | sh

Или скачайте приложение с официального сайта:
https://ollama.com/download/mac

После установки перезапустите этот скрипт
"""
    }
    
    if system in instructions:
        print(instructions[system])
    else:
        print("Посетите https://ollama.com/download для получения инструкций по установке для вашей системы.")
    
    sys.exit(1)

def start_ollama_server():
    """Запуск Ollama сервера"""
    try:
        # Проверяем, запущен ли уже сервер
        try:
            response = requests.get("http://localhost:11434/api/version", timeout=2)
            if response.status_code == 200:
                logger.info("Сервер Ollama уже запущен")
                return True
        except requests.exceptions.RequestException:
            pass  # Сервер не запущен, будем запускать
        
        logger.info("Запуск сервера Ollama...")
        
        if platform.system() == "Windows":
            # На Windows запускаем в отдельном процессе
            subprocess.Popen(["ollama", "serve"], 
                            creationflags=subprocess.CREATE_NEW_CONSOLE,
                            stdout=subprocess.PIPE,
                            stderr=subprocess.PIPE)
        else:
            # На Unix-системах запускаем в фоне
            subprocess.Popen(["ollama", "serve"], 
                           stdout=subprocess.PIPE,
                           stderr=subprocess.PIPE)
        
        # Ждем запуска сервера
        for _ in range(10):
            try:
                response = requests.get("http://localhost:11434/api/version", timeout=2)
                if response.status_code == 200:
                    logger.info("Сервер Ollama успешно запущен")
                    return True
            except requests.exceptions.RequestException:
                time.sleep(1)
        
        logger.error("Не удалось запустить сервер Ollama")
        return False
        
    except Exception as e:
        logger.error(f"Ошибка при запуске Ollama: {e}")
        return False

def list_available_models():
    """Получение списка доступных моделей"""
    try:
        response = requests.get("http://localhost:11434/api/tags", timeout=5)
        if response.status_code != 200:
            logger.error(f"Ошибка при получении списка моделей: {response.status_code}")
            return []
            
        models_data = response.json().get("models", [])
        return [model["name"] for model in models_data]
    except Exception as e:
        logger.error(f"Ошибка при получении списка моделей: {e}")
        return []

def pull_model(model_name):
    """Загрузка модели"""
    try:
        logger.info(f"Загрузка модели {model_name}...")
        
        # Запускаем процесс загрузки
        process = subprocess.Popen(
            ["ollama", "pull", model_name],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            bufsize=1,
            universal_newlines=True
        )
        
        # Выводим прогресс загрузки
        while True:
            line = process.stdout.readline()
            if not line and process.poll() is not None:
                break
            print(line.strip())
        
        # Проверяем результат
        exit_code = process.wait()
        if exit_code != 0:
            stderr = process.stderr.read()
            logger.error(f"Ошибка при загрузке модели: {stderr}")
            return False
            
        logger.info(f"Модель {model_name} успешно загружена")
        return True
    except Exception as e:
        logger.error(f"Ошибка при загрузке модели: {e}")
        return False

def test_model(model_name):
    """Тестирование модели"""
    try:
        logger.info(f"Тестирование модели {model_name}...")
        
        # Простой запрос к модели
        response = requests.post(
            "http://localhost:11434/api/generate",
            json={
                "model": model_name,
                "prompt": "Поздоровайся и напиши короткое сообщение о том, что ты готов помочь с вопросами DevOps.",
                "stream": False
            },
            timeout=30
        )
        
        if response.status_code != 200:
            logger.error(f"Ошибка при тестировании модели: {response.status_code}")
            return False
            
        result = response.json().get("response", "")
        logger.info(f"Ответ модели: {result}")
        
        logger.info(f"Модель {model_name} успешно протестирована")
        return True
    except Exception as e:
        logger.error(f"Ошибка при тестировании модели: {e}")
        return False

def update_env_file():
    """Обновляем .env файл для использования локальной модели по умолчанию"""
    try:
        env_path = Path(__file__).parent / ".env"
        
        # Проверяем существует ли файл
        if env_path.exists():
            with open(env_path, "r") as file:
                content = file.read()
        else:
            content = ""
        
        # Обновляем/добавляем настройки
        env_vars = {
            "DEFAULT_AI_PROVIDER": "ollama",
            "OLLAMA_API_URL": "http://localhost:11434",
            "OLLAMA_USE_FALLBACK": "True"
        }
        
        # Обновляем существующие переменные или добавляем новые
        lines = content.splitlines()
        new_lines = []
        
        # Отслеживаем, какие переменные мы уже обновили
        updated_vars = set()
        
        for line in lines:
            if line.strip() and not line.startswith("#"):
                key = line.split("=")[0].strip()
                if key in env_vars:
                    new_lines.append(f"{key}={env_vars[key]}")
                    updated_vars.add(key)
                else:
                    new_lines.append(line)
            else:
                new_lines.append(line)
        
        # Добавляем отсутствующие переменные
        for key, value in env_vars.items():
            if key not in updated_vars:
                new_lines.append(f"{key}={value}")
        
        # Сохраняем обновленный файл
        with open(env_path, "w") as file:
            file.write("\n".join(new_lines))
        
        logger.info(f"Файл .env успешно обновлен")
        return True
    except Exception as e:
        logger.error(f"Ошибка при обновлении файла .env: {e}")
        return False

def display_model_options():
    """Отображаем доступные модели для установки"""
    print("\nДоступные бесплатные модели:")
    for i, model in enumerate(MODELS, 1):
        print(f"{i}. {model['name']} - {model['description']}")
    
    choice = input("\nВыберите номер модели для установки (или нажмите Enter для установки llama3): ")
    try:
        if choice.strip():
            index = int(choice) - 1
            if 0 <= index < len(MODELS):
                return MODELS[index]["name"]
        return DEFAULT_MODEL
    except ValueError:
        return DEFAULT_MODEL

def main():
    """Основная функция настройки"""
    print("\n===== Настройка бесплатной модели ИИ =====\n")
    
    # Шаг 1: Проверка установки Ollama
    logger.info("Проверка установки Ollama...")
    if not check_ollama_installed():
        logger.info("Ollama не установлена. Необходимо установить Ollama.")
        install_ollama()
    
    # Шаг 2: Запуск Ollama сервера
    if not start_ollama_server():
        logger.error("Не удалось запустить Ollama сервер. Проверьте установку.")
        return
    
    # Шаг 3: Проверка доступных моделей
    available_models = list_available_models()
    logger.info(f"Доступные модели: {available_models}")
    
    # Шаг 4: Выбор модели для установки
    model_to_install = display_model_options()
    
    # Шаг 5: Загрузка модели, если она еще не установлена
    if model_to_install not in available_models:
        logger.info(f"Модель {model_to_install} не установлена. Начинаем загрузку...")
        if not pull_model(model_to_install):
            logger.error(f"Не удалось загрузить модель {model_to_install}")
            return
    else:
        logger.info(f"Модель {model_to_install} уже установлена")
    
    # Шаг 6: Тестирование модели
    if not test_model(model_to_install):
        logger.error(f"Тест модели {model_to_install} не пройден")
        return
    
    # Шаг 7: Обновление настроек
    update_env_file()
    
    # Результат
    print("\n===== Настройка завершена =====")
    print(f"""
Бесплатная модель {model_to_install} успешно настроена!

Теперь вы можете:
1. Запустить Django сервер: python manage.py runserver
2. Открыть веб-интерфейс по адресу http://localhost:8000
3. Использовать модель {model_to_install} для ответов на ваши вопросы

Модель работает полностью локально и бесплатно!
""")

if __name__ == "__main__":
    main() 