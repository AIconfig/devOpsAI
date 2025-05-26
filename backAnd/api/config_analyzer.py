"""
Модуль для анализа конфигурационных файлов (NGINX, Apache и т.д.)
"""
import re
import logging

logger = logging.getLogger(__name__)

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

def analyze_config_file(config_text, config_type=None):
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