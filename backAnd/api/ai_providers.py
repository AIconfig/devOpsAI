"""
Модуль для работы с различными провайдерами ИИ (Ollama, OpenAI, и др.)
"""
import os
import json
import logging
import requests
import base64
import time
from abc import ABC, abstractmethod
from typing import Dict, List, Generator, Optional, Union, Any
from django.conf import settings

# Импортируем модуль анализатора конфигураций
from . import config_analyzer
from . import devops_prompt

# Настройка логирования
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class AIProvider(ABC):
    """
    Абстрактный класс для провайдера ИИ (Ollama, OpenAI, и т.д.)
    """
    @abstractmethod
    def list_models(self) -> List[Dict[str, Any]]:
        """Получить список доступных моделей"""
        pass
    
    @abstractmethod
    def generate_completion(self, model: str, prompt: str, temperature: float = 0.7, stream: bool = False) -> Union[str, Generator]:
        """Генерировать текстовый ответ"""
        pass
    
    @abstractmethod
    def check_connection(self) -> bool:
        """Проверить доступность API"""
        pass

class OllamaProvider(AIProvider):
    """
    Провайдер для работы с Ollama API
    """
    def __init__(self, api_url: str = None):
        """
        Инициализация провайдера Ollama
        
        :param api_url: URL для Ollama API, по умолчанию берется из настроек
        """
        self.api_url = api_url or getattr(settings, 'OLLAMA_API_URL', os.environ.get('OLLAMA_API_URL', 'http://localhost:11434'))
        
    def check_connection(self) -> bool:
        """Проверить доступность Ollama API"""
        try:
            response = requests.get(f"{self.api_url}/api/tags", timeout=2)
            return response.status_code == 200
        except Exception as e:
            logger.error(f"Error connecting to Ollama API: {str(e)}")
            return False
    
    def list_models(self) -> List[Dict[str, Any]]:
        """Получить список доступных моделей Ollama"""
        try:
            response = requests.get(f"{self.api_url}/api/tags", timeout=5)
            if response.status_code == 200:
                return response.json().get('models', [])
            logger.warning(f"Error fetching models from Ollama: status {response.status_code}")
            return []
        except Exception as e:
            logger.error(f"Error listing Ollama models: {str(e)}")
            return []
    
    def generate_completion(self, model: str, prompt: str, temperature: float = 0.7, stream: bool = False) -> Union[str, Generator]:
        """
        Генерация текста с помощью Ollama
        
        :param model: название модели
        :param prompt: запрос для модели
        :param temperature: температура (0.0-1.0)
        :param stream: возвращать поток данных или полный ответ
        :return: ответ модели или генератор потока
        """
        # Выбор специализированного промпта в зависимости от запроса
        system_prompt = devops_prompt.get_specialized_prompt(prompt)
        
        data = {
            "model": model,
            "prompt": prompt,
            "stream": stream,
            "options": {
                "temperature": temperature,
                "system": system_prompt  # Добавляем системный промпт
            }
        }
        
        try:
            if not stream:
                # Для обычного запроса возвращаем весь ответ сразу
                response = requests.post(f"{self.api_url}/api/generate", json=data, timeout=30)
                if response.status_code == 200:
                    return response.json().get('response', '')
                logger.warning(f"Error generating completion from Ollama: status {response.status_code}")
                return ''
            else:
                # Для потокового запроса возвращаем генератор
                response = requests.post(f"{self.api_url}/api/generate", 
                                        json=data, 
                                        stream=True,
                                        timeout=30)
                
                if response.status_code != 200:
                    logger.warning(f"Error streaming completion from Ollama: status {response.status_code}")
                    yield json.dumps({"error": "Failed to connect to Ollama API"})
                    return
                
                for line in response.iter_lines():
                    if line:
                        try:
                            chunk = json.loads(line)
                            yield json.dumps(chunk)
                            if chunk.get("done", False):
                                break
                        except json.JSONDecodeError:
                            yield json.dumps({"error": "Invalid JSON in response"})
        except Exception as e:
            logger.error(f"Error generating completion from Ollama: {str(e)}")
            if stream:
                yield json.dumps({"error": str(e)})
            else:
                return f"Error: {str(e)}"

class OpenAIProvider(AIProvider):
    """
    Провайдер для работы с OpenAI API
    """
    def __init__(self, api_key: str = None):
        """
        Инициализация провайдера OpenAI
        
        :param api_key: API ключ для OpenAI, по умолчанию берется из настроек
        """
        self.api_key = api_key or getattr(settings, 'OPENAI_API_KEY', os.environ.get('OPENAI_API_KEY'))
        self.api_url = "https://api.openai.com/v1"
        
        if not self.api_key:
            logger.warning("OpenAI API key not provided. Provider will not function correctly.")
            
    def check_connection(self) -> bool:
        """Проверить доступность OpenAI API"""
        if not self.api_key:
            return False
            
        try:
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }
            response = requests.get(f"{self.api_url}/models", headers=headers, timeout=2)
            return response.status_code == 200
        except Exception as e:
            logger.error(f"Error connecting to OpenAI API: {str(e)}")
            return False
    
    def list_models(self) -> List[Dict[str, Any]]:
        """Получить список доступных моделей OpenAI"""
        if not self.api_key:
            logger.warning("OpenAI API key not provided. Cannot list models.")
            return []
            
        try:
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }
            response = requests.get(f"{self.api_url}/models", headers=headers, timeout=5)
            
            if response.status_code == 200:
                models_data = response.json().get('data', [])
                # Фильтруем только модели GPT
                gpt_models = [
                    {"name": model["id"], "modified_at": model.get("created", "")}
                    for model in models_data 
                    if "gpt" in model["id"].lower()
                ]
                return gpt_models
            
            logger.warning(f"Error fetching models from OpenAI: status {response.status_code}")
            return []
        except Exception as e:
            logger.error(f"Error listing OpenAI models: {str(e)}")
            return []
    
    def generate_completion(self, model: str, prompt: str, temperature: float = 0.7, stream: bool = False) -> Union[str, Generator]:
        """
        Генерация текста с помощью OpenAI
        
        :param model: название модели
        :param prompt: запрос для модели
        :param temperature: температура (0.0-1.0)
        :param stream: возвращать поток данных или полный ответ
        :return: ответ модели или генератор потока
        """
        if not self.api_key:
            error_msg = "OpenAI API key not provided. Cannot generate completion."
            logger.warning(error_msg)
            if stream:
                yield json.dumps({"error": error_msg})
                return
            return error_msg
            
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        data = {
            "model": model,
            "messages": [
                {"role": "user", "content": prompt}
            ],
            "temperature": temperature,
            "stream": stream
        }
        
        try:
            if not stream:
                # Для обычного запроса возвращаем весь ответ сразу
                response = requests.post(
                    f"{self.api_url}/chat/completions", 
                    headers=headers,
                    json=data, 
                    timeout=30
                )
                
                if response.status_code == 200:
                    return response.json()["choices"][0]["message"]["content"]
                
                logger.warning(f"Error generating completion from OpenAI: status {response.status_code}")
                return ''
            else:
                # Для потокового запроса возвращаем генератор
                response = requests.post(
                    f"{self.api_url}/chat/completions", 
                    headers=headers,
                    json=data, 
                    stream=True,
                    timeout=30
                )
                
                if response.status_code != 200:
                    logger.warning(f"Error streaming completion from OpenAI: status {response.status_code}")
                    yield json.dumps({"error": "Failed to connect to OpenAI API"})
                    return
                
                content = ""
                
                for line in response.iter_lines():
                    if line:
                        try:
                            line = line.decode('utf-8')
                            
                            # OpenAI отправляет "data: " перед каждым JSON объектом
                            if line.startswith("data: "):
                                line = line[6:]  # Remove "data: " prefix
                                
                                # "[DONE]" означает конец потока
                                if line == "[DONE]":
                                    yield json.dumps({"done": True, "response": "", "model": model})
                                    break
                                
                                data = json.loads(line)
                                delta = data["choices"][0]["delta"]
                                
                                if "content" in delta:
                                    content_chunk = delta["content"]
                                    content += content_chunk
                                    yield json.dumps({
                                        "response": content_chunk,
                                        "done": False,
                                        "model": model
                                    })
                        except Exception as e:
                            logger.error(f"Error parsing stream from OpenAI: {str(e)}")
                            yield json.dumps({"error": f"Error parsing stream: {str(e)}"})
        except Exception as e:
            logger.error(f"Error generating completion from OpenAI: {str(e)}")
            if stream:
                yield json.dumps({"error": str(e)})
            else:
                return f"Error: {str(e)}"

class FallbackProvider(AIProvider):
    """
    Провайдер заготовленных ответов для случаев, когда основные провайдеры недоступны
    """
    def __init__(self, config_analyzer_module = None):
        """
        Инициализация провайдера заготовленных ответов
        
        :param config_analyzer_module: модуль для анализа конфигурационных файлов (если нужна такая функциональность)
        """
        # Если не передан модуль анализатора, используем импортированный по умолчанию
        self.config_analyzer = config_analyzer_module or config_analyzer
    
    def check_connection(self) -> bool:
        """Провайдер заготовленных ответов всегда доступен"""
        return True
    
    def list_models(self) -> List[Dict[str, Any]]:
        """Получить список фиктивных моделей"""
        return [
            {"name": "fallback-unix", "description": "Модель для ответов на вопросы о UNIX-системах"},
            {"name": "fallback-network", "description": "Модель для ответов на вопросы о сетях и VPN"},
            {"name": "fallback-kubernetes", "description": "Модель для ответов на вопросы о Kubernetes"},
            {"name": "fallback-analyzer", "description": "Модель для анализа конфигурационных файлов"}
        ]
    
    def generate_completion(self, model: str, prompt: str, temperature: float = 0.7, stream: bool = False) -> Union[str, Generator]:
        """
        Генерация заготовленного ответа
        
        :param model: название модели (не используется)
        :param prompt: запрос для модели
        :param temperature: температура (не используется)
        :param stream: возвращать поток данных или полный ответ
        :return: заготовленный ответ или генератор потока
        """
        # Получаем заготовленный ответ
        response = self._get_fallback_response(prompt)
        
        if stream:
            # Имитируем потоковый ответ
            return self._stream_fallback(response)
        else:
            # Возвращаем весь ответ сразу
            return response
    
    def _get_fallback_response(self, prompt: str) -> str:
        """
        Выбирает подходящий заготовленный ответ в зависимости от запроса
        
        :param prompt: текст запроса
        :return: заготовленный ответ
        """
        # Здесь можно использовать функции из существующего модуля ollama.py
        # Пока просто заглушка
        prompt_lower = prompt.lower()
        
        # Проверяем запрос на анализ конфигурации
        if self.config_analyzer and ("проверь" in prompt_lower or "проанализируй" in prompt_lower) and \
           ("конфиг" in prompt_lower or "конфигурацию" in prompt_lower):
            import re
            
            # Определяем тип конфигурации
            config_type = None
            if "nginx" in prompt_lower:
                config_type = "nginx"
            elif "apache" in prompt_lower:
                config_type = "apache"
            
            # Извлекаем конфигурацию из запроса
            config_match = re.search(r'```(?:nginx|apache|conf|config)?\s*([\s\S]*?)```', prompt)
            if not config_match:
                config_match = re.search(r"'''([\s\S]*?)'''", prompt)
            
            if config_match:
                config_text = config_match.group(1).strip()
                return self.config_analyzer.analyze_config_file(config_text, config_type)
        
        # Заглушки для других типов запросов
        if "unix" in prompt_lower or "linux" in prompt_lower:
            return self._generate_unix_response(prompt)
        elif "vpn" in prompt_lower or "tor" in prompt_lower or "лукови" in prompt_lower:
            return self._generate_network_response(prompt)
        elif "kubernetes" in prompt_lower or "k8s" in prompt_lower:
            return self._generate_kubernetes_response(prompt)
        else:
            return self._generate_general_response(prompt)
    
    def _stream_fallback(self, response: str) -> Generator:
        """
        Имитирует потоковую передачу заготовленного ответа
        
        :param response: полный ответ
        :return: генератор, имитирующий потоковую передачу
        """
        chunk_size = max(5, len(response) // 10)
        chunks = [response[i:i + chunk_size] for i in range(0, len(response), chunk_size)]
        
        for i, chunk in enumerate(chunks):
            yield json.dumps({
                "model": "fallback",
                "response": chunk,
                "done": i == len(chunks) - 1
            })
    
    def _generate_unix_response(self, prompt: str) -> str:
        """Генерирует ответ на вопросы о UNIX-системах"""
        # Можно использовать функцию generate_unix_response из ollama.py
        # Пока просто базовая заглушка
        return """# UNIX/Linux системы - основные команды

- `ls` - просмотр содержимого директории
- `cd` - смена директории
- `pwd` - показать текущую директорию
- `mkdir` - создание директории
- `rm` - удаление файлов
- `cp` - копирование файлов
- `mv` - перемещение/переименование файлов
- `cat` - вывод содержимого файла
- `grep` - поиск текста в файлах
- `find` - поиск файлов
- `chmod` - изменение прав доступа
- `chown` - изменение владельца файла
- `sudo` - выполнение команд с привилегиями администратора
- `apt/yum/dnf` - управление пакетами

Для получения справки по команде используйте: `man имя_команды`"""
    
    def _generate_network_response(self, prompt: str) -> str:
        """Генерирует ответ на вопросы о сетях и VPN"""
        # Можно использовать функцию generate_network_response из ollama.py
        # Пока просто базовая заглушка
        if "tor" in prompt.lower() or "луковичный" in prompt.lower():
            return """# Настройка Tor (луковичный протокол) VPN

Tor (The Onion Router) - это программное обеспечение для анонимной коммуникации. Вот как настроить "луковичный" VPN:

## 1. Установка Tor
```bash
# Debian/Ubuntu
sudo apt update
sudo apt install tor

# Fedora
sudo dnf install tor

# Arch Linux
sudo pacman -S tor
```

## 2. Настройка Tor как SOCKS-прокси
Отредактируйте файл `/etc/tor/torrc`:
```bash
sudo nano /etc/tor/torrc
```

Добавьте или раскомментируйте строки:
```
SOCKSPort 9050
ControlPort 9051
```

## 3. Запуск сервиса Tor
```bash
sudo systemctl start tor
sudo systemctl enable tor
```

## 4. Настройка системы для использования Tor
### Проверка:
```bash
curl --socks5 127.0.0.1:9050 https://check.torproject.org/api/ip
```

### Для прозрачного перенаправления всего трафика:
Установите пакет `torsocks`:
```bash
sudo apt install torsocks  # Debian/Ubuntu
```

Использование:
```bash
torsocks имя_программы
# или
torify имя_программы
```

## 5. Дополнительно (луковые сервисы)
Для создания скрытого сервиса, добавьте в `/etc/tor/torrc`:
```
HiddenServiceDir /var/lib/tor/hidden_service/
HiddenServicePort 80 127.0.0.1:8080
```

Перезапустите Tor, и адрес .onion будет доступен в файле:
```bash
sudo cat /var/lib/tor/hidden_service/hostname
```"""
        else:
            return """# Основные сетевые команды в UNIX/Linux

- `ip a` или `ifconfig` - показать сетевые интерфейсы
- `ip r` или `route` - показать таблицу маршрутизации
- `ping адрес` - проверка доступности хоста
- `traceroute адрес` - трассировка маршрута
- `netstat -tuln` - открытые порты/соединения
- `ss -tuln` - открытые порты (современный аналог netstat)
- `nmap` - сканирование портов и сервисов
- `dig` или `nslookup` - запросы DNS
- `curl` или `wget` - запросы HTTP
- `iptables` - настройка файрвола (legacy)
- `nftables` или `firewalld` - современные файрволы
- `tcpdump` - перехват и анализ сетевого трафика
- `ssh пользователь@хост` - безопасное подключение к удаленному хосту"""
    
    def _generate_kubernetes_response(self, prompt: str) -> str:
        """Генерирует ответ на вопросы о Kubernetes"""
        # Базовый ответ о Kubernetes
        return """# Установка и запуск Kubernetes

## Первичная настройка на Ubuntu/Debian
```bash
# Обновление системы
sudo apt update && sudo apt upgrade -y

# Установка Docker
sudo apt install -y docker.io
sudo systemctl enable docker
sudo systemctl start docker

# Установка kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl

# Установка minikube для тестового кластера
curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64
sudo install minikube-linux-amd64 /usr/local/bin/minikube

# Запуск кластера
minikube start
```

## Настройка полноценного кластера с kubeadm
```bash
# Отключение swap
sudo swapoff -a
sudo sed -i '/ swap / s/^\(.*\)$/#\1/g' /etc/fstab

# Установка kubeadm, kubelet и kubectl
sudo apt-get update && sudo apt-get install -y apt-transport-https curl
curl -s https://packages.cloud.google.com/apt/doc/apt-key.gpg | sudo apt-key add -
cat <<EOF | sudo tee /etc/apt/sources.list.d/kubernetes.list
deb https://apt.kubernetes.io/ kubernetes-xenial main
EOF
sudo apt-get update
sudo apt-get install -y kubelet kubeadm kubectl
sudo apt-mark hold kubelet kubeadm kubectl

# Инициализация мастер-узла
sudo kubeadm init --pod-network-cidr=10.244.0.0/16

# Настройка kubectl для текущего пользователя
mkdir -p $HOME/.kube
sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
sudo chown $(id -u):$(id -g) $HOME/.kube/config

# Установка сетевого плагина (Flannel)
kubectl apply -f https://raw.githubusercontent.com/coreos/flannel/master/Documentation/kube-flannel.yml
```

## Проверка работы кластера
```bash
kubectl get nodes
kubectl get pods --all-namespaces
```"""
    
    def _generate_general_response(self, prompt: str) -> str:
        """Генерирует общий ответ на запросы, не подпадающие под конкретные категории"""
        return """# DevOps Справочник

Здравствуйте! Я могу предоставить информацию по следующим темам:

## Linux/Unix системы
- Установка и настройка пакетов
- Управление пользователями и правами доступа
- Управление процессами и сервисами
- Файловые системы и диски

## Сети и VPN
- Настройка сетевых интерфейсов
- Маршрутизация и файрволы
- VPN (OpenVPN, WireGuard)
- Tor ("луковичный" протокол)

## Контейнеризация
- Docker
- Docker Compose
- Основы управления контейнерами

## Оркестрация
- Kubernetes (установка, настройка, управление)
- Helm
- Базовые манифесты и деплои

## CI/CD
- Настройка пайплайнов
- Github Actions
- Jenkins
- GitLab CI

Задайте конкретный вопрос по одной из этих тем, и я предоставлю более детальную информацию."""

class AnthropicProvider(AIProvider):
    """
    Провайдер для работы с Anthropic API (Claude)
    """
    def __init__(self, api_key: str = None):
        """
        Инициализация провайдера Anthropic
        
        :param api_key: API ключ для Anthropic, по умолчанию берется из настроек
        """
        self.api_key = api_key or getattr(settings, 'ANTHROPIC_API_KEY', os.environ.get('ANTHROPIC_API_KEY'))
        self.api_url = "https://api.anthropic.com/v1"
        self.version = "2023-06-01"  # Версия API Anthropic
        
        if not self.api_key:
            logger.warning("Anthropic API key not provided. Provider will not function correctly.")
    
    def check_connection(self) -> bool:
        """Проверить доступность Anthropic API"""
        if not self.api_key:
            return False
        
        try:
            # Anthropic не имеет отдельного эндпоинта для проверки соединения,
            # поэтому делаем простой запрос с минимальным содержанием
            headers = {
                "x-api-key": self.api_key,
                "anthropic-version": self.version,
                "Content-Type": "application/json"
            }
            
            data = {
                "model": "claude-3-sonnet-20240229",
                "max_tokens": 10,
                "messages": [{"role": "user", "content": "hello"}]
            }
            
            response = requests.post(
                f"{self.api_url}/messages",
                headers=headers,
                json=data,
                timeout=2
            )
            
            return response.status_code == 200
        except Exception as e:
            logger.error(f"Error connecting to Anthropic API: {str(e)}")
            return False
    
    def list_models(self) -> List[Dict[str, Any]]:
        """Получить список доступных моделей Anthropic"""
        if not self.api_key:
            logger.warning("Anthropic API key not provided. Cannot list models.")
            return []
        
        # Anthropic не имеет публичного API для получения списка моделей,
        # поэтому возвращаем жестко закодированный список доступных моделей
        models = [
            {"name": "claude-3-opus-20240229", "description": "Claude 3 Opus - Most powerful Claude model"},
            {"name": "claude-3-sonnet-20240229", "description": "Claude 3 Sonnet - Balanced performance and cost"},
            {"name": "claude-3-haiku-20240307", "description": "Claude 3 Haiku - Fastest Claude model"},
            {"name": "claude-2.1", "description": "Claude 2.1 - Legacy model"}
        ]
        
        return models
    
    def generate_completion(self, model: str, prompt: str, temperature: float = 0.7, stream: bool = False) -> Union[str, Generator]:
        """
        Генерация текста с помощью Anthropic API
        
        :param model: название модели
        :param prompt: запрос для модели
        :param temperature: температура (0.0-1.0)
        :param stream: возвращать поток данных или полный ответ
        :return: ответ модели или генератор потока
        """
        if not self.api_key:
            error_msg = "Anthropic API key not provided. Cannot generate completion."
            logger.warning(error_msg)
            if stream:
                yield json.dumps({"error": error_msg})
                return
            return error_msg
        
        headers = {
            "x-api-key": self.api_key,
            "anthropic-version": self.version,
            "Content-Type": "application/json"
        }
        
        data = {
            "model": model,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": temperature,
            "stream": stream,
            "max_tokens": 4000
        }
        
        try:
            if not stream:
                # Для обычного запроса возвращаем весь ответ сразу
                response = requests.post(
                    f"{self.api_url}/messages",
                    headers=headers,
                    json=data,
                    timeout=30
                )
                
                if response.status_code == 200:
                    return response.json()["content"][0]["text"]
                
                logger.warning(f"Error generating completion from Anthropic: status {response.status_code}")
                return ''
            else:
                # Для потокового запроса возвращаем генератор
                response = requests.post(
                    f"{self.api_url}/messages",
                    headers=headers,
                    json=data,
                    stream=True,
                    timeout=30
                )
                
                if response.status_code != 200:
                    logger.warning(f"Error streaming completion from Anthropic: status {response.status_code}")
                    yield json.dumps({"error": "Failed to connect to Anthropic API"})
                    return
                
                content = ""
                
                for line in response.iter_lines():
                    if line:
                        try:
                            line_text = line.decode('utf-8')
                            
                            # Пропускаем event: и пустые строки
                            if line_text.startswith('data:'):
                                data_str = line_text[5:].strip()
                                
                                # [DONE] означает конец потока
                                if data_str == "[DONE]":
                                    yield json.dumps({"done": True, "response": "", "model": model})
                                    break
                                
                                data_json = json.loads(data_str)
                                
                                if "content" in data_json and len(data_json["content"]) > 0:
                                    content_chunk = data_json["content"][0]["text"]
                                    content += content_chunk
                                    yield json.dumps({
                                        "response": content_chunk,
                                        "done": False,
                                        "model": model
                                    })
                                
                                if data_json.get("type") == "message_stop":
                                    yield json.dumps({"done": True, "response": "", "model": model})
                                    break
                                
                        except Exception as e:
                            logger.error(f"Error parsing stream from Anthropic: {str(e)}")
                            yield json.dumps({"error": f"Error parsing stream: {str(e)}"})
        except Exception as e:
            logger.error(f"Error generating completion from Anthropic: {str(e)}")
            if stream:
                yield json.dumps({"error": str(e)})
            else:
                return f"Error: {str(e)}"

class GeminiProvider(AIProvider):
    """
    Провайдер для работы с Google Gemini API
    """
    def __init__(self, api_key: str = None):
        """
        Инициализация провайдера Google Gemini
        
        :param api_key: API ключ для Google Gemini, по умолчанию берется из настроек
        """
        self.api_key = api_key or getattr(settings, 'GEMINI_API_KEY', os.environ.get('GEMINI_API_KEY'))
        self.api_url = "https://generativelanguage.googleapis.com/v1"
        
        if not self.api_key:
            logger.warning("Google Gemini API key not provided. Provider will not function correctly.")
    
    def check_connection(self) -> bool:
        """Проверить доступность Google Gemini API"""
        if not self.api_key:
            return False
        
        try:
            response = requests.get(
                f"{self.api_url}/models?key={self.api_key}",
                timeout=2
            )
            return response.status_code == 200
        except Exception as e:
            logger.error(f"Error connecting to Google Gemini API: {str(e)}")
            return False
    
    def list_models(self) -> List[Dict[str, Any]]:
        """Получить список доступных моделей Google Gemini"""
        if not self.api_key:
            logger.warning("Google Gemini API key not provided. Cannot list models.")
            return []
        
        try:
            response = requests.get(
                f"{self.api_url}/models?key={self.api_key}",
                timeout=5
            )
            
            if response.status_code == 200:
                models_data = response.json().get('models', [])
                # Фильтруем только модели Gemini
                gemini_models = [
                    {"name": model["name"].split('/')[-1], "description": model.get("displayName", model["name"])}
                    for model in models_data 
                    if "gemini" in model["name"].lower()
                ]
                return gemini_models
            
            logger.warning(f"Error fetching models from Google Gemini: status {response.status_code}")
            return []
        except Exception as e:
            logger.error(f"Error listing Google Gemini models: {str(e)}")
            return []
    
    def generate_completion(self, model: str, prompt: str, temperature: float = 0.7, stream: bool = False) -> Union[str, Generator]:
        """
        Генерация текста с помощью Google Gemini API
        
        :param model: название модели
        :param prompt: запрос для модели
        :param temperature: температура (0.0-1.0)
        :param stream: возвращать поток данных или полный ответ
        :return: ответ модели или генератор потока
        """
        if not self.api_key:
            error_msg = "Google Gemini API key not provided. Cannot generate completion."
            logger.warning(error_msg)
            if stream:
                yield json.dumps({"error": error_msg})
                return
            return error_msg
        
        # Полное имя модели, если передана только короткая форма
        if '/' not in model:
            model = f"gemini-pro" if model == "gemini-pro" else model
        
        data = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "temperature": temperature
            }
        }
        
        try:
            if not stream:
                # Для обычного запроса возвращаем весь ответ сразу
                response = requests.post(
                    f"{self.api_url}/models/{model}:generateContent?key={self.api_key}",
                    json=data,
                    timeout=30
                )
                
                if response.status_code == 200:
                    response_json = response.json()
                    return response_json["candidates"][0]["content"]["parts"][0]["text"]
                
                logger.warning(f"Error generating completion from Google Gemini: status {response.status_code}")
                return ''
            else:
                # Для потокового запроса возвращаем генератор
                response = requests.post(
                    f"{self.api_url}/models/{model}:streamGenerateContent?key={self.api_key}",
                    json=data,
                    stream=True,
                    timeout=30
                )
                
                if response.status_code != 200:
                    logger.warning(f"Error streaming completion from Google Gemini: status {response.status_code}")
                    yield json.dumps({"error": "Failed to connect to Google Gemini API"})
                    return
                
                content = ""
                
                for chunk in response.iter_lines():
                    if chunk:
                        try:
                            chunk_text = chunk.decode('utf-8')
                            
                            # Пропускаем пустые строки и вступительные дата: блоки
                            if chunk_text.startswith('data: '):
                                data_str = chunk_text[6:]
                                
                                if data_str == "[DONE]":
                                    yield json.dumps({"done": True, "response": "", "model": model})
                                    break
                                
                                data_json = json.loads(data_str)
                                if "candidates" in data_json and len(data_json["candidates"]) > 0:
                                    candidate = data_json["candidates"][0]
                                    if "content" in candidate and "parts" in candidate["content"]:
                                        content_part = candidate["content"]["parts"][0]["text"]
                                        content += content_part
                                        yield json.dumps({
                                            "response": content_part,
                                            "done": False,
                                            "model": model
                                        })
                        except Exception as e:
                            logger.error(f"Error parsing stream from Google Gemini: {str(e)}")
                            yield json.dumps({"error": f"Error parsing stream: {str(e)}"})
        except Exception as e:
            logger.error(f"Error generating completion from Google Gemini: {str(e)}")
            if stream:
                yield json.dumps({"error": str(e)})
            else:
                return f"Error: {str(e)}"

class AzureOpenAIProvider(AIProvider):
    """
    Провайдер для работы с Microsoft Azure OpenAI Service
    """
    def __init__(self, api_key: str = None, endpoint: str = None, api_version: str = None):
        """
        Инициализация провайдера Azure OpenAI
        
        :param api_key: API ключ для Azure OpenAI
        :param endpoint: URL эндпоинта Azure OpenAI
        :param api_version: Версия API Azure OpenAI
        """
        self.api_key = api_key or getattr(settings, 'AZURE_OPENAI_API_KEY', os.environ.get('AZURE_OPENAI_API_KEY'))
        self.endpoint = endpoint or getattr(settings, 'AZURE_OPENAI_ENDPOINT', os.environ.get('AZURE_OPENAI_ENDPOINT'))
        self.api_version = api_version or getattr(settings, 'AZURE_OPENAI_API_VERSION', os.environ.get('AZURE_OPENAI_API_VERSION', '2023-07-01-preview'))
        
        if not self.api_key or not self.endpoint:
            logger.warning("Azure OpenAI credentials not provided. Provider will not function correctly.")
    
    def check_connection(self) -> bool:
        """Проверить доступность Azure OpenAI API"""
        if not self.api_key or not self.endpoint:
            return False
        
        try:
            headers = {
                "api-key": self.api_key,
                "Content-Type": "application/json"
            }
            
            response = requests.get(
                f"{self.endpoint}/openai/deployments?api-version={self.api_version}",
                headers=headers,
                timeout=2
            )
            
            return response.status_code == 200
        except Exception as e:
            logger.error(f"Error connecting to Azure OpenAI API: {str(e)}")
            return False
    
    def list_models(self) -> List[Dict[str, Any]]:
        """Получить список доступных моделей Azure OpenAI"""
        if not self.api_key or not self.endpoint:
            logger.warning("Azure OpenAI credentials not provided. Cannot list models.")
            return []
        
        try:
            headers = {
                "api-key": self.api_key,
                "Content-Type": "application/json"
            }
            
            response = requests.get(
                f"{self.endpoint}/openai/deployments?api-version={self.api_version}",
                headers=headers,
                timeout=5
            )
            
            if response.status_code == 200:
                deployments = response.json().get('data', [])
                return [
                    {"name": deployment["id"], "description": f"Model: {deployment.get('model', 'Unknown')}"}
                    for deployment in deployments
                ]
            
            logger.warning(f"Error fetching models from Azure OpenAI: status {response.status_code}")
            return []
        except Exception as e:
            logger.error(f"Error listing Azure OpenAI models: {str(e)}")
            return []
    
    def generate_completion(self, model: str, prompt: str, temperature: float = 0.7, stream: bool = False) -> Union[str, Generator]:
        """
        Генерация текста с помощью Azure OpenAI API
        
        :param model: название deployment'а в Azure
        :param prompt: запрос для модели
        :param temperature: температура (0.0-1.0)
        :param stream: возвращать поток данных или полный ответ
        :return: ответ модели или генератор потока
        """
        if not self.api_key or not self.endpoint:
            error_msg = "Azure OpenAI credentials not provided. Cannot generate completion."
            logger.warning(error_msg)
            if stream:
                yield json.dumps({"error": error_msg})
                return
            return error_msg
        
        headers = {
            "api-key": self.api_key,
            "Content-Type": "application/json"
        }
        
        data = {
            "messages": [
                {"role": "user", "content": prompt}
            ],
            "temperature": temperature,
            "stream": stream
        }
        
        try:
            if not stream:
                # Для обычного запроса возвращаем весь ответ сразу
                response = requests.post(
                    f"{self.endpoint}/openai/deployments/{model}/chat/completions?api-version={self.api_version}",
                    headers=headers,
                    json=data,
                    timeout=30
                )
                
                if response.status_code == 200:
                    response_json = response.json()
                    return response_json["choices"][0]["message"]["content"]
                
                logger.warning(f"Error generating completion from Azure OpenAI: status {response.status_code}")
                return ''
            else:
                # Для потокового запроса возвращаем генератор
                response = requests.post(
                    f"{self.endpoint}/openai/deployments/{model}/chat/completions?api-version={self.api_version}",
                    headers=headers,
                    json=data,
                    stream=True,
                    timeout=30
                )
                
                if response.status_code != 200:
                    logger.warning(f"Error streaming completion from Azure OpenAI: status {response.status_code}")
                    yield json.dumps({"error": "Failed to connect to Azure OpenAI API"})
                    return
                
                content = ""
                
                for line in response.iter_lines():
                    if line:
                        try:
                            line_text = line.decode('utf-8')
                            
                            # Пропускаем event: и пустые строки
                            if line_text.startswith('data:'):
                                line_text = line_text[5:].strip()
                                
                                if line_text == "[DONE]":
                                    yield json.dumps({"done": True, "response": "", "model": model})
                                    break
                                
                                data = json.loads(line_text)
                                
                                if "choices" in data and len(data["choices"]) > 0:
                                    delta = data["choices"][0].get("delta", {})
                                    
                                    if "content" in delta:
                                        content_chunk = delta["content"]
                                        content += content_chunk
                                        yield json.dumps({
                                            "response": content_chunk,
                                            "done": False,
                                            "model": model
                                        })
                        except Exception as e:
                            logger.error(f"Error parsing stream from Azure OpenAI: {str(e)}")
                            yield json.dumps({"error": f"Error parsing stream: {str(e)}"})
        except Exception as e:
            logger.error(f"Error generating completion from Azure OpenAI: {str(e)}")
            if stream:
                yield json.dumps({"error": str(e)})
            else:
                return f"Error: {str(e)}"

class HuggingFaceProvider(AIProvider):
    """
    Провайдер для работы с Hugging Face Inference API
    """
    def __init__(self, api_key: str = None):
        """
        Инициализация провайдера Hugging Face
        
        :param api_key: API ключ для Hugging Face Inference API
        """
        self.api_key = api_key or getattr(settings, 'HUGGINGFACE_API_KEY', os.environ.get('HUGGINGFACE_API_KEY'))
        self.api_url = "https://api-inference.huggingface.co/models"
        
        if not self.api_key:
            logger.warning("Hugging Face API key not provided. Provider will not function correctly.")
    
    def check_connection(self) -> bool:
        """Проверить доступность Hugging Face API"""
        if not self.api_key:
            return False
        
        try:
            headers = {
                "Authorization": f"Bearer {self.api_key}"
            }
            
            # Проверяем доступность API на модели по умолчанию
            response = requests.get(
                f"{self.api_url}/mistralai/Mistral-7B-Instruct-v0.2",
                headers=headers,
                timeout=2
            )
            
            return response.status_code == 200
        except Exception as e:
            logger.error(f"Error connecting to Hugging Face API: {str(e)}")
            return False
    
    def list_models(self) -> List[Dict[str, Any]]:
        """Получить список избранных моделей Hugging Face"""
        # Hugging Face имеет слишком много моделей, поэтому возвращаем только некоторые популярные
        models = [
            {"name": "mistralai/Mistral-7B-Instruct-v0.2", "description": "Mistral 7B Instruct"},
            {"name": "meta-llama/Llama-2-7b-chat-hf", "description": "Meta Llama 2 7B Chat"},
            {"name": "tiiuae/falcon-7b-instruct", "description": "Falcon 7B Instruct"},
            {"name": "codellama/CodeLlama-7b-instruct-hf", "description": "CodeLlama 7B Instruct"},
            {"name": "google/gemma-7b-it", "description": "Google Gemma 7B Instruct"}
        ]
        
        return models
    
    def generate_completion(self, model: str, prompt: str, temperature: float = 0.7, stream: bool = False) -> Union[str, Generator]:
        """
        Генерация текста с помощью Hugging Face Inference API
        
        :param model: путь к модели (организация/имя_модели)
        :param prompt: запрос для модели
        :param temperature: температура (0.0-1.0), не все модели поддерживают
        :param stream: потоковый режим не поддерживается Hugging Face Inference API напрямую
        :return: ответ модели или сообщение об ошибке
        """
        if not self.api_key:
            error_msg = "Hugging Face API key not provided. Cannot generate completion."
            logger.warning(error_msg)
            if stream:
                yield json.dumps({"error": error_msg})
                return
            return error_msg
        
        headers = {
            "Authorization": f"Bearer {self.api_key}"
        }
        
        # Формируем запрос в зависимости от типа модели
        # Большинство инструктивных моделей поддерживают формат с инструкцией
        payload = {
            "inputs": f"<s>[INST] {prompt} [/INST]",
            "parameters": {
                "temperature": temperature,
                "max_new_tokens": 1024,
                "return_full_text": False
            }
        }
        
        try:
            if stream:
                # HuggingFace не поддерживает стриминг напрямую, поэтому эмулируем его
                # Сначала отправляем запрос
                logger.info(f"Sending request to Hugging Face model: {model}")
                response = requests.post(
                    f"{self.api_url}/{model}",
                    headers=headers,
                    json=payload,
                    timeout=60
                )
                
                if response.status_code != 200:
                    logger.warning(f"Error generating completion from Hugging Face: status {response.status_code}")
                    yield json.dumps({"error": f"Failed to connect to Hugging Face API: {response.status_code}"})
                    return
                
                # Получаем полный ответ
                try:
                    response_json = response.json()
                    full_response = response_json[0].get("generated_text", "")
                    
                    # Разбиваем ответ на части для эмуляции потока
                    chunk_size = max(5, len(full_response) // 10)
                    chunks = [full_response[i:i + chunk_size] for i in range(0, len(full_response), chunk_size)]
                    
                    # Отправляем частями с небольшой задержкой для эмуляции стриминга
                    for i, chunk in enumerate(chunks):
                        yield json.dumps({
                            "response": chunk,
                            "done": i == len(chunks) - 1,
                            "model": model
                        })
                        # Небольшая задержка для более реалистичного стриминга
                        time.sleep(0.05)
                        
                except Exception as e:
                    logger.error(f"Error parsing response from Hugging Face: {str(e)}")
                    yield json.dumps({"error": f"Error parsing response: {str(e)}"})
            else:
                # Для обычного запроса возвращаем весь ответ сразу
                response = requests.post(
                    f"{self.api_url}/{model}",
                    headers=headers,
                    json=payload,
                    timeout=60
                )
                
                if response.status_code != 200:
                    logger.warning(f"Error generating completion from Hugging Face: status {response.status_code}")
                    return ''
                
                response_json = response.json()
                return response_json[0].get("generated_text", "")
                
        except Exception as e:
            logger.error(f"Error generating completion from Hugging Face: {str(e)}")
            if stream:
                yield json.dumps({"error": str(e)})
            else:
                return f"Error: {str(e)}"

class AITeam:
    """
    Класс для совместной работы нескольких моделей ИИ над сложными задачами
    """
    def __init__(self, service):
        """
        Инициализация команды ИИ
        
        :param service: экземпляр AIService для доступа к провайдерам
        """
        self.service = service
    
    def collaborate(self, prompt: str, providers: List[str] = None, models: List[str] = None, temperature: float = 0.7) -> str:
        """
        Получает ответы от нескольких моделей и объединяет их в итоговый ответ
        
        :param prompt: запрос для моделей
        :param providers: список используемых провайдеров (если None, используются все доступные)
        :param models: список конкретных моделей (если None, для каждого провайдера выбирается первая доступная)
        :param temperature: температура генерации
        :return: объединенный результат от всех моделей
        """
        if not providers:
            # По умолчанию используем всех доступных провайдеров
            providers = [p for p in self.service.providers.keys() if self.service.providers[p].check_connection()]
        
        if not models:
            # По умолчанию для каждого провайдера берем первую модель из списка
            models = []
            for provider in providers:
                provider_models = self.service.list_models(provider=provider)
                if provider_models:
                    models.append(provider_models[0]["name"])
                else:
                    # Если нет доступных моделей, пропускаем этого провайдера
                    providers.remove(provider)
        
        # Проверяем, что количество провайдеров и моделей совпадает
        if len(providers) != len(models):
            raise ValueError("Number of providers must match number of models")
        
        # Собираем ответы от всех моделей
        responses = []
        for i, provider in enumerate(providers):
            model = models[i]
            response = self.service.generate_completion(
                model=model,
                prompt=prompt,
                provider=provider,
                temperature=temperature,
                stream=False
            )
            responses.append({
                "provider": provider,
                "model": model,
                "response": response
            })
        
        # Формируем мета-запрос для объединения результатов
        meta_prompt = f"""Ты - метаанализатор, который объединяет и улучшает ответы от разных моделей ИИ.
Исходный запрос: {prompt}

Ответы от разных моделей:
"""
        
        for i, resp in enumerate(responses):
            meta_prompt += f"\n### Модель {i+1} ({resp['provider']}/{resp['model']}):\n{resp['response']}\n"
        
        meta_prompt += "\nСоздай единый, согласованный и улучшенный ответ, который использует лучшие части из каждого ответа."
        
        # Выбираем наиболее мощного доступного провайдера для мета-анализа
        meta_providers = ["openai", "anthropic", "azure_openai", "gemini", "ollama", "huggingface"]
        for provider in meta_providers:
            if provider in self.service.providers and self.service.providers[provider].check_connection():
                meta_provider = provider
                provider_models = self.service.list_models(provider=meta_provider)
                if provider_models:
                    meta_model = provider_models[0]["name"]
                    # Получаем мета-ответ
                    meta_response = self.service.generate_completion(
                        model=meta_model,
                        prompt=meta_prompt,
                        provider=meta_provider,
                        temperature=temperature,
                        stream=False
                    )
                    return meta_response
        
        # Если не нашли работающего провайдера для мета-анализа, просто возвращаем лучший ответ
        # (для простоты считаем лучшим самый длинный)
        best_response = max(responses, key=lambda x: len(x["response"]))
        return best_response["response"]

# Обновляем AIService, чтобы инициализировать новые провайдеры
class AIService:
    """
    Сервис для работы с различными провайдерами ИИ
    """
    def __init__(self):
        """Инициализация сервиса"""
        # Загружаем настройки
        self.use_fallback = getattr(settings, 'OLLAMA_USE_FALLBACK', True)
        self.default_provider = getattr(settings, 'DEFAULT_AI_PROVIDER', 'ollama')
        
        # Инициализируем провайдеров
        self.providers = {}
        self._initialize_providers()
        
        # Создаем экземпляр команды ИИ
        self.team = AITeam(self)
    
    def _initialize_providers(self):
        """Инициализация доступных провайдеров ИИ"""
        # Ollama
        self.providers['ollama'] = OllamaProvider()
        
        # OpenAI
        openai_api_key = getattr(settings, 'OPENAI_API_KEY', os.environ.get('OPENAI_API_KEY'))
        if openai_api_key:
            self.providers['openai'] = OpenAIProvider(api_key=openai_api_key)
        
        # Anthropic
        anthropic_api_key = getattr(settings, 'ANTHROPIC_API_KEY', os.environ.get('ANTHROPIC_API_KEY'))
        if anthropic_api_key:
            self.providers['anthropic'] = AnthropicProvider(api_key=anthropic_api_key)
        
        # Google Gemini
        gemini_api_key = getattr(settings, 'GEMINI_API_KEY', os.environ.get('GEMINI_API_KEY'))
        if gemini_api_key:
            self.providers['gemini'] = GeminiProvider(api_key=gemini_api_key)
        
        # Azure OpenAI
        azure_openai_api_key = getattr(settings, 'AZURE_OPENAI_API_KEY', os.environ.get('AZURE_OPENAI_API_KEY'))
        azure_openai_endpoint = getattr(settings, 'AZURE_OPENAI_ENDPOINT', os.environ.get('AZURE_OPENAI_ENDPOINT'))
        if azure_openai_api_key and azure_openai_endpoint:
            self.providers['azure_openai'] = AzureOpenAIProvider(
                api_key=azure_openai_api_key,
                endpoint=azure_openai_endpoint
            )
        
        # Hugging Face
        huggingface_api_key = getattr(settings, 'HUGGINGFACE_API_KEY', os.environ.get('HUGGINGFACE_API_KEY'))
        if huggingface_api_key:
            self.providers['huggingface'] = HuggingFaceProvider(api_key=huggingface_api_key)
        
        # Провайдер заготовленных ответов всегда доступен
        self.providers['fallback'] = FallbackProvider()
    
    def collaborate(self, prompt: str, providers: List[str] = None, models: List[str] = None) -> str:
        """
        Получить ответ от команды моделей ИИ
        
        :param prompt: запрос для команды моделей
        :param providers: список провайдеров для использования
        :param models: список моделей для использования
        :return: объединенный ответ от команды моделей
        """
        return self.team.collaborate(prompt, providers, models)
    
    def list_models(self, provider: str = None) -> List[Dict[str, Any]]:
        """
        Получить список доступных моделей от провайдера
        
        :param provider: имя провайдера (ollama, openai, fallback)
        :return: список моделей
        """
        # Если провайдер не указан, используем провайдер по умолчанию
        if not provider:
            provider = self.default_provider
        
        # Если указанный провайдер не существует, используем провайдер по умолчанию
        if provider not in self.providers:
            logger.warning(f"Provider '{provider}' not found. Using default provider '{self.default_provider}'.")
            provider = self.default_provider
        
        # Получаем провайдер
        ai_provider = self.providers[provider]
        
        # Проверяем доступность провайдера
        if not ai_provider.check_connection():
            logger.warning(f"Provider '{provider}' is not available. Using fallback provider.")
            if self.use_fallback:
                return self.providers['fallback'].list_models()
            return []
        
        # Получаем список моделей
        models = ai_provider.list_models()
        
        # Если список моделей пуст и включен режим отказоустойчивости, используем заготовленные модели
        if not models and self.use_fallback:
            logger.warning(f"No models found for provider '{provider}'. Using fallback provider.")
            return self.providers['fallback'].list_models()
        
        return models
    
    def generate_completion(self, model: str, prompt: str, provider: str = None, temperature: float = 0.7, stream: bool = False) -> Union[str, Generator]:
        """
        Генерация текста с помощью указанного провайдера
        
        :param model: название модели
        :param prompt: запрос для модели
        :param provider: имя провайдера (ollama, openai, fallback)
        :param temperature: температура (0.0-1.0)
        :param stream: возвращать поток данных или полный ответ
        :return: ответ модели или генератор потока
        """
        # Если провайдер не указан, используем провайдер по умолчанию
        if not provider:
            provider = self.default_provider
        
        # Если указанный провайдер не существует, используем провайдер по умолчанию
        if provider not in self.providers:
            logger.warning(f"Provider '{provider}' not found. Using default provider '{self.default_provider}'.")
            provider = self.default_provider
        
        # Получаем провайдер
        ai_provider = self.providers[provider]
        
        # Проверяем доступность провайдера
        if not ai_provider.check_connection():
            logger.warning(f"Provider '{provider}' is not available. Using fallback provider.")
            if self.use_fallback:
                return self.providers['fallback'].generate_completion(model, prompt, temperature, stream)
            if stream:
                yield json.dumps({"error": f"Provider '{provider}' is not available and fallback is disabled."})
            else:
                return f"Error: Provider '{provider}' is not available and fallback is disabled."
        
        # Генерируем ответ
        return ai_provider.generate_completion(model, prompt, temperature, stream)

# Создаем экземпляр сервиса для использования в API
ai_service = AIService() 