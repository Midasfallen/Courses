# Деплой Logic Architecture на VPS (Docker)

## Контекст

Домен `logic-architecture.com` куплен на Porkbun. Миграция на собственный VPS для стабильности в РФ (РКН блокирует Cloudflare).

**VPS:** `62.84.98.109` (Амстердам), SSH: `root@62.84.98.109`
**Требование:** Docker-деплой (на VPS уже есть WireGuard, не трогать)

### Стратегия окружений
| Окружение | URL | Роль | API |
|-----------|-----|------|-----|
| **VPS** | `https://logic-architecture.com` | **Продакшен** | Express `/api` → Telegram |
| **Cloudflare** | `https://logic-architecture.pages.dev` | Тестовый / fallback | Worker → Telegram |

`API_URL` в `index.html` определяется динамически:
```js
const API_URL = location.hostname.includes('pages.dev')
  ? 'https://la-api.ravinski-genlawyer.workers.dev'  // тестовый
  : '/api';                                            // продакшен VPS
```

---

## Текущий статус

### DNS (Porkbun) — ✅ ГОТОВО
- ✅ A: `logic-architecture.com` → `62.84.98.109`
- ✅ A: `www.logic-architecture.com` → `62.84.98.109`
- ✅ MX: `fwd1.porkbun.com` (10)
- ✅ TXT: SPF, ACME challenge × 2

### VPS — ✅ SSH работает
- Ubuntu 22.04.5, 40GB диск (29% занято, 27GB свободно)
- **Docker 26.1.3** + **docker-compose 1.29.2** (v1, не плагин)
- Существующий контейнер: `wg-easy` (WireGuard VPN) — **НЕ ТРОГАТЬ**
- Порты 80, 443 — **свободны**
- Порт 51821 — WireGuard UI (wg-easy)
- Nginx, Node.js, certbot — **не установлены** на хосте (будут в Docker)

---

## План реализации

### Шаг 1: Подготовить файлы проекта (локально) — ✅ ГОТОВО

**Созданы:**
- `server/server.js` — Express API (порт 3000), портирован из `worker/worker.js`
- `server/package.json` — express, cors, dotenv
- `server/.env.example` — шаблон секретов
- `docker-compose.yml` — version "2.4", nginx + api
- `docker/nginx/Dockerfile`, `docker/nginx/nginx.conf`, `docker/nginx/default.conf`
- `docker/api/Dockerfile` — Node.js 20 Alpine

**Изменены:**
- `docs/index.html` — `API_URL` динамический, canonical URL, og:url
- `.gitignore` — `server/.env`, `server/node_modules/`, `certbot/`

### Шаг 2: Коммит и пуш
1. Коммит новых файлов и изменений
2. `git push origin main` (Cloudflare Pages fallback обновится автоматически)

### Шаг 3: Развернуть на VPS (через SSH)
1. `git clone` в `/opt/logic-architecture/`
2. Создать `server/.env` с секретами (TG_TOKEN, TG_CHAT_ID из wrangler)
3. Запустить без SSL для получения сертификата:
   ```
   docker-compose up -d
   ```
4. Проверить: `curl http://localhost` и `curl -X POST http://localhost/api/join`

### Шаг 4: SSL (certbot через Docker)
1. Certbot как Docker-контейнер (не устанавливаем на хост):
   ```
   docker run --rm -v /opt/logic-architecture/certbot/conf:/etc/letsencrypt \
     -v /opt/logic-architecture/certbot/www:/var/www/certbot \
     certbot/certbot certonly --webroot -w /var/www/certbot \
     -d logic-architecture.com -d www.logic-architecture.com --agree-tos --email ravinski.genlawyer@gmail.com
   ```
2. Переключить nginx.conf на SSL
3. `docker-compose up -d --build` для перезапуска с SSL

### Шаг 5: Финальная проверка
1. `https://logic-architecture.com` — SSL, все вкладки, формы
2. `https://www.logic-architecture.com` → редирект на без-www
3. Форма «Присоединиться» → Telegram

---

## Ключевые файлы для работы

- `worker/worker.js` — исходный код API (форматирование, валидация, Telegram) → портируем в `server/server.js`
- `docs/index.html` — SPA, нужно изменить `API_URL` и мета-теги
- `worker/wrangler.toml` — ALLOWED_ORIGIN (текущая конфигурация CORS)

---

## Docker-архитектура

```
docker-compose.yml (version "2.4", совместимо с docker-compose 1.29.2)
│
├── nginx (порты 80:80, 443:443)
│   ├── volumes: ./docs/ → /usr/share/nginx/html (статика)
│   ├── volumes: ./certbot/conf → /etc/letsencrypt (SSL)
│   ├── volumes: ./certbot/www → /var/www/certbot (ACME challenge)
│   ├── / → статика из docs/
│   ├── /api/ → proxy_pass http://api:3000/
│   └── /.well-known/acme-challenge/ → certbot webroot
│
└── api (порт 3000, internal, не экспонируется наружу)
    ├── volumes: ./server/ → /app
    ├── env_file: ./server/.env
    └── Express.js: POST /join, POST /order → Telegram Bot API
```

Существующий `wg-easy` контейнер не затрагивается — он на порту 51821.

---

## Верификация

- [ ] `https://logic-architecture.com` — открывается с SSL
- [ ] `https://www.logic-architecture.com` → редирект на `logic-architecture.com`
- [ ] Все 7 вкладок работают
- [ ] Переключение языков RU/EN/VI/ZH
- [ ] Форма «Присоединиться» → Telegram бот
- [ ] Canvas-анимация
- [ ] Мобильная версия (responsive)
- [ ] `logic-architecture.pages.dev` продолжает работать (fallback)

---

## Примечания

- **Cloudflare Pages** = тестовый стенд. `git push` → автодеплой → проверка перед обновлением VPS
- **Worker** остаётся для тестового окружения (API для pages.dev)
- CORS в `server/server.js` — `ALLOWED_ORIGIN=https://logic-architecture.com`
- В будущем: CI/CD через GitHub Actions → SSH deploy на VPS
- Обновление продакшена: `ssh root@... "cd /opt/logic-architecture && git pull && docker-compose up -d --build"`
