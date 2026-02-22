# Logic Architecture

Консалтинговая и девелоперская компания. Помощь студентам с подготовкой учебных работ (B2C) и техническая документация для бизнеса (B2B).

**Продакшен:** [logic-architecture.com](https://logic-architecture.com)

---

## Технический стек

- **Фронтенд:** Single-file SPA (`docs/index.html`) — HTML/CSS/JS, Canvas-анимация, i18n (RU/EN/VI/ZH)
- **API:** Express.js (порт 3000) — формы → Telegram Bot API
- **Деплой:** Docker (Nginx + Node.js) на VPS, SSL через Let's Encrypt
- **Тестовый стенд:** Cloudflare Pages + Worker (`logic-architecture.pages.dev`)

## Быстрый старт

### Продакшен (VPS)

```bash
ssh root@62.84.98.109
cd /opt/logic-architecture
git pull && docker-compose up -d --build
```

### Локальная разработка

```bash
# Статика
cd docs && npx serve .

# API
cd server && cp .env.example .env  # заполнить TG_TOKEN, TG_CHAT_ID
npm install && npm start
```

## Структура проекта

```
Logic-Architecture/
├── docs/                  # Сайт (Cloudflare Pages publish dir)
│   ├── index.html         # Single-file SPA
│   ├── i18n/              # Переводы (en.json, vi.json, zh.json)
│   ├── strategy/          # Маркетинговая стратегия
│   ├── knowledge-base/    # Внутренние методики
│   └── plans/             # Планы реализации
├── server/                # Express API
│   ├── server.js
│   ├── package.json
│   └── .env.example
├── worker/                # Cloudflare Worker (тестовый API)
├── docker/                # Dockerfiles (nginx, api)
├── docker-compose.yml
├── examples/              # Примеры выполненных работ
└── CLAUDE.md              # Инструкции для AI-ассистента
```

## Окружения

| Окружение | URL | API |
|-----------|-----|-----|
| Продакшен | `logic-architecture.com` | Express `/api` |
| Тестовый | `logic-architecture.pages.dev` | Cloudflare Worker |
