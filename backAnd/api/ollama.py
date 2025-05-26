import requests
import json
import logging
import os
import re
from django.conf import settings

# Настройка логирования
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# URL Ollama API - по умолчанию работает на порту 11434
OLLAMA_API_URL = getattr(settings, 'OLLAMA_API_URL', os.environ.get('OLLAMA_API_URL', 'http://localhost:11434'))

# Флаг для использования имитации, если Ollama недоступна
USE_FALLBACK = getattr(settings, 'OLLAMA_USE_FALLBACK', True)

def check_ollama_connection():
    """Проверяет доступность Ollama API"""
    try:
        response = requests.get(f"{OLLAMA_API_URL}/api/tags", timeout=2)
        return response.status_code == 200
    except Exception:
        return False

def list_models():
    """Получить список доступных моделей Ollama"""
    try:
        response = requests.get(f"{OLLAMA_API_URL}/api/tags", timeout=5)
        if response.status_code == 200:
            return response.json().get('models', [])
        else:
            logger.warning(f"Ошибка при запросе моделей Ollama: статус {response.status_code}")
            if USE_FALLBACK:
                return [
                    {"name": "llama3", "modified_at": "2024-05-23T00:00:00Z", "size": 4200000000},
                    {"name": "mistral", "modified_at": "2024-05-23T00:00:00Z", "size": 3800000000},
                    {"name": "codellama", "modified_at": "2024-05-23T00:00:00Z", "size": 3900000000},
                ]
            return []
    except Exception as e:
        logger.error(f"Error listing Ollama models: {str(e)}")
        if USE_FALLBACK:
            return [
                {"name": "llama3", "modified_at": "2024-05-23T00:00:00Z", "size": 4200000000},
                {"name": "mistral", "modified_at": "2024-05-23T00:00:00Z", "size": 3800000000},
                {"name": "codellama", "modified_at": "2024-05-23T00:00:00Z", "size": 3900000000},
            ]
        return []

def analyze_nginx_config(config_text):
    """
    Анализирует конфигурацию NGINX и выявляет потенциальные проблемы
    
    :param config_text: Текст конфигурации NGINX
    :return: Строка с анализом и перечислением найденных проблем
    """
    problems = []
    suggestions = []
    
    # Проверка открытых/закрытых скобок
    open_braces = config_text.count('{')
    close_braces = config_text.count('}')
    if open_braces != close_braces:
        problems.append(f"Несоответствие количества открывающих ({open_braces}) и закрывающих ({close_braces}) скобок")
    
    # Проверка завершающих точек с запятой
    lines = config_text.split('\n')
    for i, line in enumerate(lines):
        line = line.strip()
        # Пропускаем пустые строки, комментарии и строки с закрывающими скобками
        if not line or line.startswith('#') or line == '}' or line.startswith('}'):
            continue
        # Пропускаем строки с открывающими скобками
        if '{' in line:
            continue
        # Проверяем наличие точки с запятой в конце строки
        if not line.endswith(';'):
            problems.append(f"Строка {i+1}: Отсутствует точка с запятой в конце: '{line}'")
    
    # Проверка listen директив
    listen_ports = []
    for line in lines:
        line = line.strip()
        if line.startswith('listen'):
            parts = line.split()
            if len(parts) > 1:
                port_part = parts[1].replace(';', '')
                try:
                    # Извлекаем порт из строки вида "80" или "80 default_server" или "0.0.0.0:80"
                    if ':' in port_part:
                        port = port_part.split(':')[1].split()[0]
                    else:
                        port = port_part.split()[0]
                    if port in listen_ports:
                        problems.append(f"Дублирование порта в директиве listen: {port}")
                    else:
                        listen_ports.append(port)
                except Exception:
                    pass
    
    # Проверка server_name директив
    server_names = {}
    in_server_block = False
    current_server_names = []
    for line in lines:
        line = line.strip()
        if line.startswith('server {'):
            in_server_block = True
            current_server_names = []
        elif in_server_block and line.startswith('server_name'):
            # Извлекаем все имена серверов из директивы
            parts = line.replace('server_name', '').replace(';', '').strip().split()
            current_server_names.extend(parts)
        elif in_server_block and line == '}':
            in_server_block = False
            # Проверяем на дублирование имен серверов
            for name in current_server_names:
                if name in server_names:
                    problems.append(f"Дублирование server_name: {name}")
                else:
                    server_names[name] = True
    
    # Проверка пути к файлам
    for line in lines:
        line = line.strip()
        for directive in ['root', 'access_log', 'error_log', 'include']:
            if line.startswith(f"{directive} "):
                path = line.replace(f"{directive} ", '').replace(';', '').strip().split()[0]
                if path == '/path/to/':
                    problems.append(f"Обнаружен путь-заполнитель: {path} в директиве {directive}")
    
    # Проверка типичных проблем безопасности
    if 'server_tokens on' in config_text:
        problems.append("server_tokens on: рекомендуется отключить для улучшения безопасности")
        suggestions.append("Добавьте 'server_tokens off;' для скрытия версии NGINX в заголовках ответа")
    
    if 'add_header X-Frame-Options' not in config_text:
        suggestions.append("Рекомендуется добавить 'add_header X-Frame-Options \"SAMEORIGIN\";' для защиты от кликджекинга")
    
    if 'add_header X-Content-Type-Options' not in config_text:
        suggestions.append("Рекомендуется добавить 'add_header X-Content-Type-Options \"nosniff\";' для предотвращения MIME-сниффинга")
    
    # Формирование ответа
    if not problems and not suggestions:
        return "Анализ конфигурации NGINX не выявил явных проблем. Конфигурация выглядит правильной."
    
    result = "# Анализ конфигурации NGINX\n\n"
    
    if problems:
        result += "## Обнаруженные проблемы\n\n"
        for problem in problems:
            result += f"- {problem}\n"
        result += "\n"
    
    if suggestions:
        result += "## Рекомендации по улучшению\n\n"
        for suggestion in suggestions:
            result += f"- {suggestion}\n"
    
    return result

def analyze_apache_config(config_text):
    """
    Анализирует конфигурацию Apache и выявляет потенциальные проблемы
    
    :param config_text: Текст конфигурации Apache
    :return: Строка с анализом и перечислением найденных проблем
    """
    problems = []
    suggestions = []
    
    # Проверка директив VirtualHost
    vhost_pattern = re.compile(r'<VirtualHost\s+([^>]+)>')
    vhosts = vhost_pattern.findall(config_text)
    vhost_addresses = {}
    for vhost in vhosts:
        for addr in vhost.split():
            if addr in vhost_addresses:
                problems.append(f"Дублирование адреса VirtualHost: {addr}")
            else:
                vhost_addresses[addr] = True
    
    # Проверка синтаксиса директив
    lines = config_text.split('\n')
    for i, line in enumerate(lines):
        line = line.strip()
        if not line or line.startswith('#'):
            continue
        
        # Проверка на незакрытые теги
        if line.startswith('<') and not line.startswith('</') and '>' not in line:
            problems.append(f"Строка {i+1}: Незакрытый тег: '{line}'")
        
        # Проверка на директивы ServerName
        if line.startswith('ServerName'):
            parts = line.split()
            if len(parts) < 2:
                problems.append(f"Строка {i+1}: Некорректная директива ServerName: '{line}'")
    
    # Проверка на закрытие всех тегов
    open_tags = []
    for line in lines:
        line = line.strip()
        if not line or line.startswith('#'):
            continue
        
        # Найдем открывающие теги
        if line.startswith('<') and not line.startswith('</') and '>' in line:
            tag_name = line[1:].split()[0]
            open_tags.append(tag_name)
        
        # Найдем закрывающие теги
        if line.startswith('</') and '>' in line:
            tag_name = line[2:].split()[0].rstrip('>')
            if open_tags and open_tags[-1] == tag_name:
                open_tags.pop()
            else:
                problems.append(f"Некорректное закрытие тега: {tag_name}")
    
    if open_tags:
        problems.append(f"Незакрытые теги: {', '.join(open_tags)}")
    
    # Рекомендации по безопасности
    if 'ServerTokens Full' in config_text or 'ServerTokens Prod' not in config_text:
        suggestions.append("Рекомендуется использовать 'ServerTokens Prod' для скрытия информации о версии сервера")
    
    if 'ServerSignature On' in config_text:
        suggestions.append("Рекомендуется использовать 'ServerSignature Off' для отключения подписи сервера")
    
    if 'TraceEnable On' in config_text or 'TraceEnable' not in config_text:
        suggestions.append("Рекомендуется использовать 'TraceEnable Off' для защиты от атак через метод TRACE")
    
    # Формирование ответа
    if not problems and not suggestions:
        return "Анализ конфигурации Apache не выявил явных проблем. Конфигурация выглядит правильной."
    
    result = "# Анализ конфигурации Apache\n\n"
    
    if problems:
        result += "## Обнаруженные проблемы\n\n"
        for problem in problems:
            result += f"- {problem}\n"
        result += "\n"
    
    if suggestions:
        result += "## Рекомендации по улучшению\n\n"
        for suggestion in suggestions:
            result += f"- {suggestion}\n"
    
    return result

def analyze_config_file(config_text, config_type):
    """
    Определяет тип конфигурационного файла и вызывает соответствующую функцию анализа
    
    :param config_text: Текст конфигурации
    :param config_type: Тип конфигурации (может быть определен из контекста или указан явно)
    :return: Строка с анализом и перечислением найденных проблем
    """
    # Если тип конфигурации не указан явно, пытаемся определить его
    if not config_type:
        if 'server {' in config_text or 'http {' in config_text:
            config_type = 'nginx'
        elif '<VirtualHost' in config_text or 'ServerName' in config_text:
            config_type = 'apache'
        else:
            # Если не удалось определить тип, возвращаем общее сообщение
            return "Не удалось определить тип конфигурационного файла. Пожалуйста, укажите его явно."
    
    # Вызываем соответствующую функцию анализа в зависимости от типа
    if config_type.lower() == 'nginx':
        return analyze_nginx_config(config_text)
    elif config_type.lower() in ['apache', 'httpd']:
        return analyze_apache_config(config_text)
    else:
        return f"Анализ для конфигурационных файлов типа '{config_type}' пока не поддерживается."

def generate_completion(model, prompt, temperature=0.7, stream=False):
    """
    Генерация текста с помощью Ollama
    
    :param model: название модели
    :param prompt: запрос для модели
    :param temperature: температура (0.0-1.0)
    :param stream: возвращать поток данных или полный ответ
    :return: ответ модели или генератор потока
    """
    data = {
        "model": model,
        "prompt": prompt,
        "stream": stream,
        "options": {
            "temperature": temperature
        }
    }
    
    # Проверка доступности Ollama
    is_ollama_available = check_ollama_connection()
    
    # Если Ollama недоступна и используем запасной вариант
    if not is_ollama_available and USE_FALLBACK:
        # Проверяем наличие конфигурационного файла для анализа
        prompt_lower = prompt.lower()
        
        # Анализ конфигурационных файлов
        if ("проверь" in prompt_lower or "проанализируй" in prompt_lower or "анализ" in prompt_lower) and \
           ("конфиг" in prompt_lower or "конфигурацию" in prompt_lower or "config" in prompt_lower):
            
            config_type = None
            if "nginx" in prompt_lower:
                config_type = "nginx"
            elif "apache" in prompt_lower or "httpd" in prompt_lower:
                config_type = "apache"
            
            # Извлекаем конфигурационный файл из промпта
            # Ищем код, ограниченный тройными обратными кавычками или тройными апострофами
            config_match = re.search(r'```(?:nginx|apache|conf|config)?\s*([\s\S]*?)```', prompt)
            if not config_match:
                config_match = re.search(r"'''([\s\S]*?)'''", prompt)
            
            if config_match:
                config_text = config_match.group(1).strip()
                return analyze_config_file(config_text, config_type)
            else:
                return "Не удалось найти конфигурационный файл в вашем сообщении. Пожалуйста, заключите конфигурацию в тройные обратные кавычки (```конфигурация```)."
        
        # Стандартные ответы для разных тем
        if "unix" in prompt_lower or "linux" in prompt_lower:
            return generate_unix_response(prompt, stream)
        elif "vpn" in prompt_lower or "tor" in prompt_lower or "лукови" in prompt_lower:
            return generate_network_response(prompt, stream)
        elif "kubernetes" in prompt_lower or "k8s" in prompt_lower or "кубернетес" in prompt_lower:
            # Базовый ответ о Kubernetes (такой же как выше)
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
```

## Советы по практической работе
- Используйте Helm для установки приложений
- Настройте мониторинг с Prometheus и Grafana
- Для продакшена рассмотрите managed Kubernetes (EKS, GKE, AKS)
- Не забудьте о резервном копировании etcd"""
        else:
            # Для других запросов используем общие фоллбэк-ответы
            return generate_fallback_response(prompt, stream)
    
    try:
        if not stream:
            # Для обычного запроса возвращаем весь ответ сразу
            response = requests.post(f"{OLLAMA_API_URL}/api/generate", json=data, timeout=30)
            if response.status_code == 200:
                return response.json().get('response', '')
            logger.warning(f"Ошибка при запросе Ollama: статус {response.status_code}")
            if USE_FALLBACK:
                # Проверяем наличие конфигурационного файла для анализа
                prompt_lower = prompt.lower()
                
                # Анализ конфигурационных файлов
                if ("проверь" in prompt_lower or "проанализируй" in prompt_lower or "анализ" in prompt_lower) and \
                   ("конфиг" in prompt_lower or "конфигурацию" in prompt_lower or "config" in prompt_lower):
                    
                    config_type = None
                    if "nginx" in prompt_lower:
                        config_type = "nginx"
                    elif "apache" in prompt_lower or "httpd" in prompt_lower:
                        config_type = "apache"
                    
                    # Извлекаем конфигурационный файл из промпта
                    config_match = re.search(r'```(?:nginx|apache|conf|config)?\s*([\s\S]*?)```', prompt)
                    if not config_match:
                        config_match = re.search(r"'''([\s\S]*?)'''", prompt)
                    
                    if config_match:
                        config_text = config_match.group(1).strip()
                        return analyze_config_file(config_text, config_type)
                    else:
                        return "Не удалось найти конфигурационный файл в вашем сообщении. Пожалуйста, заключите конфигурацию в тройные обратные кавычки (```конфигурация```)."
                
                # Используем соответствующие запасные ответы в зависимости от типа запроса
                if "unix" in prompt_lower or "linux" in prompt_lower:
                    return generate_unix_response(prompt, stream)
                elif "vpn" in prompt_lower or "tor" in prompt_lower or "лукови" in prompt_lower:
                    return generate_network_response(prompt, stream)
                elif "kubernetes" in prompt_lower or "k8s" in prompt_lower:
                    # Добавляем базовый ответ о Kubernetes (такой же как выше)
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
```

## Советы по практической работе
- Используйте Helm для установки приложений
- Настройте мониторинг с Prometheus и Grafana
- Для продакшена рассмотрите managed Kubernetes (EKS, GKE, AKS)
- Не забудьте о резервном копировании etcd"""
                else:
                    return generate_fallback_response(prompt, stream)
            return ''
        else:
            # Для потокового запроса возвращаем генератор
            response = requests.post(f"{OLLAMA_API_URL}/api/generate", 
                                    json=data, 
                                    stream=True,
                                    timeout=5)
            
            if response.status_code != 200:
                logger.warning(f"Ошибка при потоковом запросе Ollama: статус {response.status_code}")
                if USE_FALLBACK:
                    return stream_fallback_response(prompt)
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
        logger.error(f"Error generating completion: {str(e)}")
        if USE_FALLBACK:
            if stream:
                return stream_fallback_response(prompt)
            else:
                prompt_lower = prompt.lower()
                
                # Анализ конфигурационных файлов в случае ошибки
                if ("проверь" in prompt_lower or "проанализируй" in prompt_lower or "анализ" in prompt_lower) and \
                   ("конфиг" in prompt_lower or "конфигурацию" in prompt_lower or "config" in prompt_lower):
                    
                    config_type = None
                    if "nginx" in prompt_lower:
                        config_type = "nginx"
                    elif "apache" in prompt_lower or "httpd" in prompt_lower:
                        config_type = "apache"
                    
                    # Извлекаем конфигурационный файл из промпта
                    config_match = re.search(r'```(?:nginx|apache|conf|config)?\s*([\s\S]*?)```', prompt)
                    if not config_match:
                        config_match = re.search(r"'''([\s\S]*?)'''", prompt)
                    
                    if config_match:
                        config_text = config_match.group(1).strip()
                        return analyze_config_file(config_text, config_type)
                    else:
                        return "Не удалось найти конфигурационный файл в вашем сообщении. Пожалуйста, заключите конфигурацию в тройные обратные кавычки (```конфигурация```)."
                
                # Используем подходящие запасные ответы в зависимости от типа запроса
                if "unix" in prompt_lower or "linux" in prompt_lower:
                    return generate_unix_response(prompt, stream)
                elif "vpn" in prompt_lower or "tor" in prompt_lower or "лукови" in prompt_lower:
                    return generate_network_response(prompt, stream)
                elif "kubernetes" in prompt_lower or "k8s" in prompt_lower:
                    # Базовый ответ о Kubernetes (такой же как выше)
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
```

## Советы по практической работе
- Используйте Helm для установки приложений
- Настройте мониторинг с Prometheus и Grafana
- Для продакшена рассмотрите managed Kubernetes (EKS, GKE, AKS)
- Не забудьте о резервном копировании etcd"""
                else:
                    return generate_fallback_response(prompt, stream)
        if stream:
            yield json.dumps({"error": str(e)})
        else:
            return f"Error: {str(e)}"

def generate_fallback_response(prompt, stream=False):
    """Генерирует запасной ответ, когда Ollama недоступна"""
    # Проверяем ключевые слова в запросе
    prompt_lower = prompt.lower()
    
    if "vpn" in prompt_lower or "tor" in prompt_lower or "луковичный" in prompt_lower or "лукови" in prompt_lower:
        return generate_network_response(prompt, stream)
    elif "unix" in prompt_lower or "linux" in prompt_lower or "debian" in prompt_lower or "ubuntu" in prompt_lower:
        return generate_unix_response(prompt, stream)
    elif "kubernetes" in prompt_lower or "k8s" in prompt_lower or "кубернетес" in prompt_lower:
        # Базовый ответ о Kubernetes (такой же как в generate_completion)
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
```

## Советы по практической работе
- Используйте Helm для установки приложений
- Настройте мониторинг с Prometheus и Grafana
- Для продакшена рассмотрите managed Kubernetes (EKS, GKE, AKS)
- Не забудьте о резервном копировании etcd"""
    elif "docker" in prompt_lower or "контейнер" in prompt_lower:
        return """# Docker - основы работы

## Установка Docker на Ubuntu/Debian
```bash
# Обновление индекса пакетов
sudo apt update

# Установка зависимостей
sudo apt install -y apt-transport-https ca-certificates curl software-properties-common

# Добавление официального GPG-ключа Docker
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -

# Добавление репозитория Docker
sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"

# Установка Docker
sudo apt update
sudo apt install -y docker-ce

# Запуск и включение службы Docker
sudo systemctl start docker
sudo systemctl enable docker

# Добавление текущего пользователя в группу docker
sudo usermod -aG docker ${USER}
```

## Основные команды Docker
- `docker ps` - список запущенных контейнеров
- `docker ps -a` - список всех контейнеров
- `docker images` - список образов
- `docker pull имя_образа` - загрузка образа из реестра
- `docker run имя_образа` - запуск контейнера из образа
- `docker build -t имя_образа .` - сборка образа из Dockerfile
- `docker stop контейнер_id` - остановка контейнера
- `docker rm контейнер_id` - удаление контейнера
- `docker rmi образ_id` - удаление образа

## Пример простого Dockerfile
```dockerfile
FROM ubuntu:20.04
MAINTAINER username@example.com

RUN apt-get update && apt-get install -y nginx
COPY ./app /var/www/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## Docker Compose (для многоконтейнерных приложений)
Установка Docker Compose:
```bash
sudo curl -L "https://github.com/docker/compose/releases/download/v2.5.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

Пример docker-compose.yml:
```yaml
version: '3'
services:
  web:
    build: ./web
    ports:
      - "80:80"
    depends_on:
      - db
  db:
    image: postgres:13
    environment:
      POSTGRES_PASSWORD: example
    volumes:
      - db-data:/var/lib/postgresql/data
volumes:
  db-data:
```

Запуск: `docker-compose up -d`"""
    else:
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

def stream_fallback_response(prompt):
    """Имитирует потоковый ответ для запасного режима"""
    # Получаем полный ответ с помощью обновленной функции generate_fallback_response
    fallback_response = generate_fallback_response(prompt, True)
    
    # Разбиваем ответ на небольшие части, чтобы имитировать потоковую передачу
    chunk_size = max(5, len(fallback_response) // 10)
    chunks = [fallback_response[i:i + chunk_size] for i in range(0, len(fallback_response), chunk_size)]
    
    for i, chunk in enumerate(chunks):
        yield json.dumps({
            "model": "fallback",
            "response": chunk,
            "done": i == len(chunks) - 1
        })

def generate_unix_response(prompt, stream=False):
    """Генерирует ответ на вопросы о UNIX-системах"""
    if "установить" in prompt.lower() or "install" in prompt.lower():
        return """На большинстве дистрибутивов Linux для установки пакетов используются следующие менеджеры пакетов:

- apt (Debian, Ubuntu): `sudo apt update && sudo apt install имя_пакета`
- dnf/yum (Fedora, RHEL): `sudo dnf install имя_пакета`
- pacman (Arch Linux): `sudo pacman -S имя_пакета`
- zypper (openSUSE): `sudo zypper install имя_пакета`

Для более конкретной помощи, укажите дистрибутив, с которым вы работаете."""
    
    elif "права доступа" in prompt.lower() or "chmod" in prompt.lower() or "permissions" in prompt.lower():
        return """В UNIX/Linux системах для управления правами доступа используется команда chmod.

Базовый синтаксис: `chmod [опции] режим файл`

Режимы можно указывать в числовом (восьмеричном) формате:
- 4 - чтение (r)
- 2 - запись (w)
- 1 - исполнение (x)

Примеры:
- `chmod 755 file.sh` - устанавливает права rwx для владельца, r-x для группы и других
- `chmod 644 file.txt` - устанавливает права rw- для владельца, r-- для группы и других
- `chmod -R 755 directory/` - рекурсивное применение прав к директории и её содержимому"""
    
    elif "процессы" in prompt.lower() or "ps" in prompt.lower() or "top" in prompt.lower():
        return """Для управления процессами в UNIX/Linux системах используются следующие команды:

- `ps` - показать список процессов
- `ps aux` - подробный список всех процессов
- `top` - интерактивный просмотр процессов в реальном времени
- `htop` - улучшенная версия top (может требовать установки)
- `kill PID` - завершить процесс с указанным ID
- `killall имя_процесса` - завершить все процессы с указанным именем
- `nice` и `renice` - изменение приоритета процесса

Для поиска определенного процесса: `ps aux | grep имя_процесса`"""
    
    else:
        return """Основные команды UNIX/Linux систем:

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
- `systemctl` - управление службами

Для получения справки по команде используйте: `man имя_команды`"""

def generate_network_response(prompt, stream=False):
    """Генерирует ответ на вопросы о сетях и VPN"""
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
```

Это базовая настройка, для продвинутой безопасности рекомендуется ознакомиться с дополнительной документацией Tor Project."""
    
    elif "vpn" in prompt.lower():
        return """# Настройка VPN на UNIX/Linux

Существует несколько популярных решений для VPN:

## 1. OpenVPN
Установка клиента:
```bash
sudo apt install openvpn  # Debian/Ubuntu
sudo dnf install openvpn  # Fedora
```

Подключение с помощью файла конфигурации:
```bash
sudo openvpn --config файл_конфигурации.ovpn
```

## 2. WireGuard (современное решение)
Установка:
```bash
sudo apt install wireguard  # Debian/Ubuntu
sudo dnf install wireguard-tools  # Fedora
```

Создание приватного ключа:
```bash
wg genkey > privatekey
chmod 600 privatekey
```

Пример конфигурации `/etc/wireguard/wg0.conf`:
```
[Interface]
PrivateKey = ваш_приватный_ключ
Address = 10.0.0.2/24

[Peer]
PublicKey = публичный_ключ_сервера
Endpoint = server_ip:51820
AllowedIPs = 0.0.0.0/0
PersistentKeepalive = 25
```

Активация и управление:
```bash
sudo wg-quick up wg0
sudo wg-quick down wg0
sudo systemctl enable wg-quick@wg0  # автозапуск
```

## 3. Настройка сервера (минимальная)
### WireGuard сервер
Редактируйте `/etc/wireguard/wg0.conf` на сервере:
```
[Interface]
PrivateKey = серверный_приватный_ключ
Address = 10.0.0.1/24
ListenPort = 51820
PostUp = iptables -A FORWARD -i wg0 -j ACCEPT; iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
PostDown = iptables -D FORWARD -i wg0 -j ACCEPT; iptables -t nat -D POSTROUTING -o eth0 -j MASQUERADE

[Peer]
PublicKey = клиентский_публичный_ключ
AllowedIPs = 10.0.0.2/32
```

Не забудьте включить IP-форвардинг:
```bash
echo "net.ipv4.ip_forward=1" | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

Для боевого использования рекомендуется дополнительно настроить файрвол и другие меры безопасности."""
    
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
- `ssh пользователь@хост` - безопасное подключение к удаленному хосту

Пример настройки статического IP адреса:
```bash
# Debian/Ubuntu (/etc/network/interfaces)
auto eth0
iface eth0 inet static
  address 192.168.1.100
  netmask 255.255.255.0
  gateway 192.168.1.1
  dns-nameservers 8.8.8.8

# Современный метод (systemd-networkd)
# /etc/systemd/network/20-wired.network
[Match]
Name=enp3s0

[Network]
Address=192.168.1.100/24
Gateway=192.168.1.1
DNS=8.8.8.8
```""" 