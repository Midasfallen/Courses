# План: Задеплоить сайт Logic Architecture на Cloudflare Pages

## Контекст

Сайт Logic Architecture (`docs/index.html`) полностью готов: 7 табов, формы → Cloudflare Worker → Telegram, анимации, адаптивность. Worker задеплоен на `la-api.ravinski-genlawyer.workers.dev`. **Сайт нигде не опубликован.** Нужно разместить на Cloudflare Pages. Пока без кастомного домена — используем бесплатный `*.pages.dev`.

---

## Шаг 1: Обновить CLAUDE.md (Claude, код)

Добавить в `C:\Courses\CLAUDE.md` раздел о деплое и инфраструктуре:
- Хостинг: Cloudflare Pages, publish directory `docs/`
- Автодеплой при `git push origin main`
- Worker: `la-api.ravinski-genlawyer.workers.dev` (эндпоинты `/order`, `/join`)
- Домен: пока `*.pages.dev`, кастомный домен позже
- Telegram-бот: заявки приходят в чат через Worker
- Добавить что Claude может управлять Cloudflare через браузер (Chrome MCP + Windows MCP)

---

## Шаг 2: Подготовить файлы для деплоя (Claude, код)

### 2.1 Создать `docs/_headers`
```
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
```

### 2.2 Обновить ALLOWED_ORIGIN в Worker
**Файл:** `worker/wrangler.toml` (строка 6)

Сейчас `ALLOWED_ORIGIN = "https://logicarchitecture.ru"` — домена ещё нет. После деплоя Pages обновить на реальный `*.pages.dev` URL. Также исправить CORS в `worker/worker.js` (строки 35, 66-73) — проверять origin.

### 2.3 Закоммитить и запушить

---

## Шаг 3: Создать проект Cloudflare Pages (Claude, через браузер)

1. Открыть `dash.cloudflare.com` в Chrome
2. Войти в аккаунт (если нужна авторизация — попросить пользователя)
3. **Workers & Pages** → **Create**
4. Вкладка **Pages** → **Connect to Git**
5. Выбрать репозиторий `Midasfallen/Courses`
6. Настройки:
   - **Production branch:** `main`
   - **Build command:** (пусто)
   - **Build output directory:** `docs`
7. **Save and Deploy**
8. Дождаться деплоя, получить URL `*.pages.dev`

---

## Шаг 4: Обновить Worker ALLOWED_ORIGIN (Claude, код)

После получения реального `*.pages.dev` URL:
1. Обновить `wrangler.toml` → `ALLOWED_ORIGIN = "https://xxx.pages.dev"`
2. Задеплоить Worker: `wrangler deploy` (или попросить пользователя)

---

## Шаг 5: Проверить работу (Claude, через браузер)

1. Открыть полученный `*.pages.dev` URL
2. Проверить: все табы, формы, анимации
3. Отправить тестовую заявку → убедиться что приходит в Telegram

---

## Файлы

| Файл | Действие |
|------|----------|
| `CLAUDE.md` | Добавить раздел о деплое/инфраструктуре |
| `docs/_headers` | Создать |
| `worker/wrangler.toml` | Обновить ALLOWED_ORIGIN после деплоя |
| `worker/worker.js` | Исправить CORS |

## Верификация

1. `*.pages.dev` загружается с HTTPS
2. Все 7 табов отображаются корректно
3. Форма заявки → сообщение приходит в Telegram
4. Security headers присутствуют (`curl -I`)
