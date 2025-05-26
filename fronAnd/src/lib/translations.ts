
export type Locale = 'en' | 'uk';

type TranslationKeys = {
  common: {
    search: string;
    darkMode: string;
    lightMode: string;
    login: string;
    logout: string;
    admin: string;
    moderator: string;
    chat: string;
    copyCode: string;
    copied: string;
    menu: string;
    settings: string;
    profile: string;
    welcome: string;
    language: string;
  };
  auth: {
    login: string;
    email: string;
    password: string;
    submit: string;
    loginSuccess: string;
    loginError: string;
  };
  navigation: {
    home: string;
    cheatsheets: string;
    aiAssistant: string;
    contribute: string;
  };
  categories: {
    debian: string;
    nginx: string;
    docker: string;
    kubernetes: string;
    ftp: string;
    networking: string;
    vpn: string;
    databases: string;
    security: string;
    monitoring: string;
    deployment: string;
    basics: string;
    services: string;
    projects: string;
    asterisk: string;
    containers: string;
    cicd: string;
    project_structure: string;
    tools: string;
    checklists: string;
    documentation: string;
    virtualization: string;
  };
  chat: {
    placeholder: string;
    send: string;
    generating: string;
    errorMessage: string;
    aiHelp: string;
  };
  home: {
    title: string;
    subtitle: string;
    popularCheatsheets: string;
    recentlyAdded: string;
    getStarted: string;
  };
};

export const translations: Record<Locale, TranslationKeys> = {
  en: {
    common: {
      search: "Search",
      darkMode: "Dark Mode",
      lightMode: "Light Mode",
      login: "Login",
      logout: "Logout",
      admin: "Admin",
      moderator: "Moderator",
      chat: "AI Chat",
      copyCode: "Copy",
      copied: "Copied!",
      menu: "Menu",
      settings: "Settings",
      profile: "Profile",
      welcome: "Welcome to DevOps CheatSheet",
      language: "Language",
    },
    auth: {
      login: "Login",
      email: "Email",
      password: "Password",
      submit: "Submit",
      loginSuccess: "Login successful!",
      loginError: "Invalid email or password",
    },
    navigation: {
      home: "Home",
      cheatsheets: "Cheatsheets",
      aiAssistant: "AI Assistant",
      contribute: "Contribute",
    },
    categories: {
      basics: "Linux Basics",
      networking: "Networking & VPN",
      services: "Services & Servers",
      projects: "Project Deployment",
      asterisk: "Asterisk PBX",
      containers: "Containers & VMs",
      cicd: "CI/CD",
      databases: "Databases",
      security: "Security",
      project_structure: "Project Structure",
      tools: "Useful Tools",
      checklists: "Checklists",
      documentation: "Documentation",
      debian: "Debian",
      nginx: "Nginx",
      docker: "Docker",
      kubernetes: "Kubernetes",
      ftp: "FTP",
      vpn: "VPN",
      monitoring: "Monitoring",
      deployment: "Deployment",
      virtualization: "Virtualization",
    },
    chat: {
      placeholder: "Ask a question about configurations...",
      send: "Send",
      generating: "Generating response...",
      errorMessage: "Something went wrong. Please try again.",
      aiHelp: "AI can help generate configs for your specific needs",
    },
    home: {
      title: "DevOps CheatSheet",
      subtitle: "Quick reference for system administrators and DevOps engineers",
      popularCheatsheets: "Popular Cheatsheets",
      recentlyAdded: "Recently Added",
      getStarted: "Get Started",
    },
  },
  uk: {
    common: {
      search: "Пошук",
      darkMode: "Темна тема",
      lightMode: "Світла тема",
      login: "Увійти",
      logout: "Вийти",
      admin: "Адміністратор",
      moderator: "Модератор",
      chat: "ШІ Чат",
      copyCode: "Копіювати",
      copied: "Скопійовано!",
      menu: "Меню",
      settings: "Налаштування",
      profile: "Профіль",
      welcome: "Ласкаво просимо до DevOps CheatSheet",
      language: "Мова",
    },
    auth: {
      login: "Увійти",
      email: "Електронна пошта",
      password: "Пароль",
      submit: "Відправити",
      loginSuccess: "Вхід успішний!",
      loginError: "Неправильна електронна пошта або пароль",
    },
    navigation: {
      home: "Головна",
      cheatsheets: "Шпаргалки",
      aiAssistant: "ШІ Помічник",
      contribute: "Зробити внесок",
    },
    categories: {
      basics: "Основи Linux",
      networking: "Мережі та VPN",
      services: "Сервіси та сервери",
      projects: "Розгортання проектів",
      asterisk: "Asterisk АТС",
      containers: "Контейнери та ВМ",
      cicd: "CI/CD",
      databases: "Бази даних",
      security: "Безпека",
      project_structure: "Структура проектів",
      tools: "Корисні інструменти",
      checklists: "Чек-листи",
      documentation: "Документація",
      debian: "Debian",
      nginx: "Nginx",
      docker: "Docker",
      kubernetes: "Kubernetes",
      ftp: "FTP",
      vpn: "VPN",
      monitoring: "Моніторинг",
      deployment: "Розгортання",
      virtualization: "Віртуалізація",
    },
    chat: {
      placeholder: "Задайте питання про конфігурації...",
      send: "Надіслати",
      generating: "Генерація відповіді...",
      errorMessage: "Щось пішло не так. Будь ласка, спробуйте знову.",
      aiHelp: "ШІ може допомогти згенерувати конфігурації для ваших потреб",
    },
    home: {
      title: "DevOps Шпаргалка",
      subtitle: "Швидкий довідник для системних адміністраторів та DevOps інженерів",
      popularCheatsheets: "Популярні шпаргалки",
      recentlyAdded: "Нещодавно додані",
      getStarted: "Почати",
    },
  },
};

export function getTranslation(locale: Locale) {
  return translations[locale];
}
