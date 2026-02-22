# Переименование репозитория Courses → Logic-Architecture

## Контекст

Репозиторий на GitHub называется `Courses` (исторически — система для курсовых работ СПбГУ). Проект давно вырос в полноценный продукт Logic Architecture с доменом, VPS и Docker-деплоем. Имя `Courses` не отражает текущую суть и путает при работе с проектом. Нужно привести в соответствие.

---

## Что делаем

### 1. Переименовать репо на GitHub
- GitHub → Settings → Repository name: `Courses` → `Logic-Architecture`
- Делается через браузер (Chrome MCP)
- GitHub автоматически создаст редирект со старого URL

### 2. Обновить remote URL — локально
```bash
cd C:\Courses
git remote set-url origin https://github.com/Midasfallen/Logic-Architecture.git
```

### 3. Обновить remote URL — VPS
```bash
ssh root@62.84.98.109 "cd /opt/logic-architecture && git remote set-url origin https://github.com/Midasfallen/Logic-Architecture.git"
```

### 4. Переименовать локальную папку
`C:\Courses` → `C:\Logic-Architecture`

### 5. Обновить CLAUDE.md
Два упоминания старого пути:
- **Строка 10:** `C:\Courses\` → `C:\Logic-Architecture\`
- **Строка 218:** `C:/Courses/docs/` → `C:/Logic-Architecture/docs/`

### 6. Переписать README.md
Текущий README — описание «системы автоматизации курсовых работ СПбГУ» из 177 строк. Полностью не соответствует проекту. Заменить на краткий README для Logic Architecture:
- Что это (консалтинг, разработка, документация)
- Технический стек (Single-file SPA, Docker, Express API)
- Быстрый старт (dev / production)
- Структура проекта (из CLAUDE.md)
- Ссылка на продакшен `https://logic-architecture.com`

### 7. Обновить пути в docs/plans/*.md (опционально)
Файлы `graceful-inventing-sparrow.md`, `steady-beaming-cake.md`, `wiggly-greeting-sparkle.md` содержат `C:\Courses\...` — это исторические планы, не боевой код. Обновить для чистоты.

---

## Файлы для изменения

| Файл | Действие |
|------|----------|
| `CLAUDE.md` | Заменить `C:\Courses` → `C:\Logic-Architecture` (2 места) |
| `README.md` | Полная перезапись |
| `docs/plans/graceful-inventing-sparrow.md` | Заменить пути (опционально) |
| `docs/plans/steady-beaming-cake.md` | Заменить пути (опционально) |
| `docs/plans/wiggly-greeting-sparkle.md` | Заменить пути (опционально) |

**Не затрагиваются:** `index.html`, `server.js`, `docker-compose.yml`, `wrangler.toml`, `package.json` — в них нет упоминаний `Courses`.

---

## Порядок выполнения

1. Переименовать репо на GitHub (через Chrome MCP)
2. Обновить remote URL локально (`git remote set-url`)
3. Обновить remote URL на VPS (SSH)
4. Отредактировать `CLAUDE.md` (2 замены)
5. Переписать `README.md`
6. Обновить пути в планах (опционально)
7. Коммит и пуш
8. Переименовать локальную папку `C:\Courses` → `C:\Logic-Architecture`
   - ⚠️ Делается последним, после пуша, т.к. смена пути влияет на все открытые терминалы

---

## Верификация

- `git remote -v` показывает `Logic-Architecture.git` (локально + VPS)
- `git push origin main` работает
- `https://logic-architecture.com` — продакшен без изменений
- `https://logic-architecture.pages.dev` — тестовый стенд работает (Cloudflare Pages подхватит новое имя репо)
- Cloudflare Pages: возможно потребуется переподключить репо в Cloudflare Dashboard (если авто-деплой сломается)
