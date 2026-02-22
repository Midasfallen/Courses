# План: Подготовка к релизу Logic Architecture

## Контекст

Сайт Logic Architecture — single-file SPA (`docs/index.html`, ~1200 строк). UI полностью готов (7 табов, B2B-страница, маркетинговая стратегия v2.1). Но сайт **функционально мёртв**: ни одна форма не отправляет данные, контакты — заглушки, Lottie-инфраструктура добавлена но все 15 иконок пустые (null).

**Блокеры релиза:**
1. Кнопка «Отправить заявку» (строка 1027) — **нет обработчика**, клик ничего не делает
2. Кнопка «Присоединиться» (строка 990) — только `alert()`, данные не уходят
3. Footer Telegram — `href="#"` (заглушка)
4. 15 Lottie-контейнеров с `null` данными = пустые иконки на всех табах
5. Нет бэкенда для приёма заявок

**Решения пользователя:**
- Хостинг: **Cloudflare Pages** + **Cloudflare Workers**
- Telegram: `@LogicArchitecture` → `t.me/LogicArchitecture`
- Lottie-файлы (loadingV2.json, Server.json) **не используем** — ищем альтернативы в JS-библиотеках
- Все CTA-кнопки должны быть подключены к отправке

---

## Часть 1: Откат Lottie → emoji + JS-библиотеки анимаций

### 1.1 Откат пустых Lottie-иконок

Все 15 иконок с `data-lottie` и `LOTTIE_DATA[key] = null` отображаются как пустые контейнеры. Нужно:

1. **Вернуть emoji** в 15 HTML-элементах — убрать класс `lottie-icon` и `data-lottie`, вернуть текст emoji
2. **Удалить** из JS: весь объект `LOTTIE_DATA`, функцию `initLottieIcons()`, вызов в `switchTab()`
3. **Удалить** CSS-блок `/* ===== LOTTIE ===== */`
4. **Удалить** CDN-тег `<script src="...bodymovin/5.12.2/lottie.min.js" defer></script>`

Полный список для отката (15 элементов):

| Строка | Контейнер | Сейчас | Вернуть |
|--------|-----------|--------|---------|
| ~457 | `.feat-icon` | `data-lottie="block"` | `🚫` |
| ~462 | `.feat-icon` | `data-lottie="refresh"` | `🔄` |
| ~467 | `.feat-icon` | `data-lottie="clock"` | `⏰` |
| ~472 | `.feat-icon` | `data-lottie="worry"` | `😰` |
| ~477 | `.feat-icon` | `data-lottie="checklist"` | `📋` |
| ~482 | `.feat-icon` | `data-lottie="lock"` | `🔒` |
| ~580 | `.tcard-icon` | `data-lottie="brain"` | `🧠` |
| ~586 | `.tcard-icon` | `data-lottie="book"` | `📚` |
| ~592 | `.tcard-icon` | `data-lottie="search"` | `🔍` |
| ~598 | `.tcard-icon` | `data-lottie="lightning"` | `⚡` |
| ~604 | `.tcard-icon` | `data-lottie="server"` | `🔎` |
| ~610 | `.tcard-icon` | `data-lottie="chat"` | `💬` |
| ~635 | `.tech-visual-icon` | `data-lottie="architecture"` | `🏗️` |
| ~826 | `.about-photo` | `data-lottie="globe"` | `🌏` |
| ~757 | `.biz-why-icon` | `data-lottie="ruler"` | `📐` |

### 1.2 Подключение JS-библиотек анимаций

Рекомендуемый стек (~ 30 КБ gzip суммарно):

**a) AOS (Animate On Scroll)** — 8.5 КБ gzip, MIT
- Заменяет кастомный `.reveal` + IntersectionObserver
- CDN: CSS + JS (2 тега)
- 20+ эффектов: `fade-up`, `fade-left`, `zoom-in`, `flip-up`
- Stagger через `data-aos-delay`

```html
<link rel="stylesheet" href="https://unpkg.com/aos@2.3.4/dist/aos.css">
<script src="https://unpkg.com/aos@2.3.4/dist/aos.js"></script>
<script>AOS.init({ duration: 600, once: true });</script>
```

Замена: все `.reveal` → `data-aos="fade-up"` с разными `data-aos-delay`. Удалить кастомный `revealElements()` и CSS `.reveal`.

**b) Typed.js** — 11 КБ gzip, MIT
- Эффект печатной машинки в hero-заголовке
- Динамический перебор: «курсовую», «диплом», «реферат», «научную статью»

```html
<script src="https://unpkg.com/typed.js@2.1.0/dist/typed.umd.js"></script>
```

Hero-заголовок сейчас: `Поможем подготовить<br><span class="grad">диплом, курсовую</span><br>или реферат`

После: `Поможем подготовить<br><span class="grad"><span id="typed-target"></span></span>`

```javascript
new Typed('#typed-target', {
    strings: ['диплом', 'курсовую', 'реферат', 'научную статью', 'магистерскую'],
    typeSpeed: 70,
    backSpeed: 40,
    backDelay: 2000,
    loop: true
});
```

**c) Anime.js v4** — 10 КБ gzip, MIT (опционально)
- Улучшенная анимация счётчиков (metrics)
- Hover-эффекты на карточках
- Stagger-анимации для `.pkg-grid`, `.biz-grid`, `.tech-grid`
- CDN: `https://cdn.jsdelivr.net/npm/animejs@4/dist/anime.iife.min.js`

---

## Часть 2: Все кнопки → отправка данных

### 2.1 Полный реестр CTA-кнопок (12 штук)

**Кнопки, открывающие модалку (10 шт., все работают корректно):**

| # | Текст | Таб | Строка |
|---|---|---|---|
| 1 | «Оставить заявку» | Хедер | ~416 |
| 2 | «Узнать стоимость бесплатно» | Hero | ~425 |
| 3 | «Узнать стоимость» | Services — Рефераты | ~508 |
| 4 | «Рассчитать стоимость» | Services — Курсовые | ~517 |
| 5 | «Обсудить проект» | Services — Дипломные | ~526 |
| 6 | «Получить консультацию» | Services — Магистерские | ~535 |
| 7 | «Запросить оценку» | Services — Статьи | ~544 |
| 8 | «Отправить работу на оценку» | Services — Оригинальность | ~553 |
| 9 | «Обсудить проект» | Business — CTA | ~762 |
| 10 | «Обсудить партнёрство» | Investors — CTA | ~811 |

Все вызывают `openModal()` — это корректно. Но **контекст теряется**: когда пользователь нажимает «Рассчитать стоимость» на карточке «Курсовые», в модалке нет предвыбора.

**Улучшение:** передавать тип работы в `openModal(preselect)`:
```javascript
// На карточке Курсовые:
onclick="openModal('Курсовая работа')"

// В openModal:
function openModal(preselect) {
    // ... открытие модалки
    if (preselect) {
        document.querySelector('#modal-work-type').value = preselect;
    }
}
```

**Кнопки отправки форм (2 шт., СЛОМАНЫ):**

| # | Текст | Строка | Проблема |
|---|---|---|---|
| 11 | «Отправить заявку» | ~1027 | Нет обработчика — клик ничего не делает |
| 12 | «Присоединиться» | ~990 | Только `alert()` — данные не уходят |

### 2.2 Исправление модальной формы

Добавить `name` и `id` атрибуты всем полям:
```html
<input name="name" id="modal-name" ...>
<input name="contact" id="modal-contact" ...>
<select name="work_type" id="modal-work-type" ...>
<textarea name="comment" id="modal-comment" ...>
```

Добавить honeypot:
```html
<div style="position:absolute;left:-9999px;opacity:0;height:0;overflow:hidden" aria-hidden="true">
    <input type="text" name="website" id="modal-hp" tabindex="-1" autocomplete="off">
</div>
```

Кнопка: `onclick="submitOrder()"` (вместо пустого клика)

### 2.3 Исправление формы Join

Добавить `name` и `id` атрибуты всем полям. Заменить `alert()` на `onclick="submitJoin()"`.

### 2.4 JavaScript — обработчики форм

```javascript
const API_URL = 'https://la-api.YOUR_SUBDOMAIN.workers.dev';
const pageLoadTime = Date.now();

// Модальная форма — заявка
async function submitOrder() {
    const name = document.getElementById('modal-name').value.trim();
    const contact = document.getElementById('modal-contact').value.trim();
    const workType = document.getElementById('modal-work-type').value;
    const comment = document.getElementById('modal-comment').value.trim();
    const hp = document.getElementById('modal-hp').value;

    // Honeypot
    if (hp) return;
    // Time check
    if (Date.now() - pageLoadTime < 3000) return;
    // Rate limit
    if (isRateLimited()) { showToast('Подождите минуту', 'warning'); return; }
    // Валидация
    if (!name) { showToast('Укажите имя', 'warning'); return; }
    if (!contact) { showToast('Укажите контакт', 'warning'); return; }

    const btn = document.querySelector('#modalOverlay .btn--gold');
    btn.disabled = true;
    btn.textContent = 'Отправляем...';

    try {
        const res = await fetch(API_URL + '/order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, contact, workType, comment, source: 'modal' })
        });
        if (!res.ok) throw new Error();
        closeModal();
        showToast('Заявка отправлена! Свяжемся в течение часа', 'success');
        setRateLimit();
        // Очистить форму
    } catch {
        showToast('Ошибка. Напишите нам напрямую в Telegram', 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Отправить заявку';
    }
}

// Форма Join — присоединение
async function submitJoin() { /* аналогичная логика, endpoint /join */ }

// Вспомогательные
function isRateLimited() { ... }  // localStorage, 60 сек
function setRateLimit() { ... }
function showToast(msg, type) { ... }  // CSS-анимированное уведомление
```

### 2.5 Toast-уведомления (замена alert)

CSS:
```css
.toast{position:fixed;top:80px;right:20px;z-index:100000;padding:16px 24px;border-radius:12px;
font-size:14px;font-weight:500;transform:translateX(120%);transition:transform .4s;max-width:360px}
.toast.show{transform:translateX(0)}
.toast.success{background:rgba(74,222,128,.15);border:1px solid rgba(74,222,128,.3);color:var(--green)}
.toast.error{background:rgba(248,113,113,.15);border:1px solid rgba(248,113,113,.3);color:var(--red)}
.toast.warning{background:rgba(212,168,83,.15);border:1px solid rgba(212,168,83,.3);color:var(--gold)}
```

JS:
```javascript
function showToast(msg, type='success') {
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.textContent = msg;
    document.body.appendChild(el);
    requestAnimationFrame(() => el.classList.add('show'));
    setTimeout(() => { el.classList.remove('show'); setTimeout(() => el.remove(), 400); }, 4000);
}
```

---

## Часть 3: Cloudflare Worker — прокси для Telegram

### 3.1 Файл `worker/worker.js`

```javascript
export default {
    async fetch(request, env) {
        // CORS preflight
        if (request.method === 'OPTIONS') { return corsResponse(); }
        if (request.method !== 'POST') { return new Response('', { status: 405 }); }

        const url = new URL(request.url);
        const data = await request.json();

        // Honeypot
        if (data.website) return new Response('OK');

        let text;
        if (url.pathname === '/order') {
            text = formatOrder(data);
        } else if (url.pathname === '/join') {
            text = formatJoin(data);
        } else {
            return new Response('Not Found', { status: 404 });
        }

        // Отправка в Telegram
        const tgRes = await fetch(
            `https://api.telegram.org/bot${env.TG_TOKEN}/sendMessage`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: env.TG_CHAT_ID,
                    text: text,
                    parse_mode: 'HTML'
                })
            }
        );

        return new Response(JSON.stringify({ ok: tgRes.ok }), {
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN || '*'
            }
        });
    }
};

function formatOrder(d) {
    const isBiz = ['Проектная', 'Техническая', 'Тестовая', 'Юридическая', 'Pitch Deck']
        .some(t => (d.workType || '').includes(t));
    const badge = isBiz ? '🏢 B2B' : '🎓 B2C';
    const time = new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' });
    return `🔔 <b>Новая заявка — Logic Architecture</b>\n━━━━━━━━━━━━━━━━━\n${badge}\n\n` +
        `👤 <b>Имя:</b> ${esc(d.name)}\n📱 <b>Контакт:</b> ${esc(d.contact)}\n` +
        `📋 <b>Тип:</b> ${esc(d.workType)}\n💬 <b>Комментарий:</b>\n<i>${esc(d.comment || '—')}</i>\n\n⏰ <code>${time} МСК</code>`;
}

function formatJoin(d) {
    const time = new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' });
    return `🌐 <b>Заявка на присоединение</b>\n━━━━━━━━━━━━━━━━━\n\n` +
        `👤 <b>О себе:</b>\n<i>${esc(d.about)}</i>\n\n💻 <b>Опыт:</b>\n<i>${esc(d.experience)}</i>\n\n` +
        `🎯 <b>Хобби:</b>\n<i>${esc(d.hobbies)}</i>\n\n📱 <b>Контакт:</b> ${esc(d.contact)}\n\n⏰ <code>${time} МСК</code>`;
}

function esc(s) { return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function corsResponse() {
    return new Response(null, { headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type'
    }});
}
```

### 3.2 Файл `worker/wrangler.toml`

```toml
name = "la-api"
main = "worker.js"
compatibility_date = "2026-02-17"

[vars]
ALLOWED_ORIGIN = "https://logicarchitecture.ru"
```

Secrets (через CLI): `wrangler secret put TG_TOKEN`, `wrangler secret put TG_CHAT_ID`

### 3.3 Настройка Telegram-бота (пользователь)

1. Написать `@BotFather` → `/newbot` → получить TOKEN
2. Написать боту любое сообщение
3. Открыть `https://api.telegram.org/bot<TOKEN>/getUpdates` → скопировать `chat_id`
4. `wrangler secret put TG_TOKEN` → вставить токен
5. `wrangler secret put TG_CHAT_ID` → вставить chat_id

---

## Часть 4: Контакты на сайте

### Footer (строка ~999)
```html
<!-- Было: -->
<a href="#">Telegram</a>
<!-- Стало: -->
<a href="https://t.me/LogicArchitecture" target="_blank" rel="noopener">Telegram</a>
```

### Под кнопкой «Отправить заявку» в модалке
```html
<p class="modal-alt">или напишите напрямую:
<a href="https://t.me/LogicArchitecture" target="_blank" rel="noopener">@LogicArchitecture</a></p>
```

### Под кнопкой «Присоединиться» на вкладке Join
Аналогичная альтернативная ссылка.

CSS для `.modal-alt`:
```css
.modal-alt{text-align:center;font-size:13px;color:var(--t3);margin-top:12px}
.modal-alt a{color:var(--blue);text-decoration:none}
.modal-alt a:hover{text-decoration:underline}
```

---

## Часть 5: Мелкие фиксы

1. **Предвыбор типа работы**: `openModal('Курсовая работа')` на каждой карточке услуг
2. **Дисклеймер ФЗ-383** в footer: `Материалы носят вспомогательный характер...`
3. **Open Graph meta-теги**: `og:title`, `og:description`, `og:image` для шеринга
4. **favicon**: добавить простой SVG favicon (логотип LA)

---

## Порядок реализации

| Шаг | Задача | Файл |
|-----|--------|------|
| 1 | Откат 15 Lottie → emoji, удалить Lottie CSS/JS/CDN | `docs/index.html` |
| 2 | Подключить AOS + Typed.js (CDN), заменить `.reveal` на `data-aos` | `docs/index.html` |
| 3 | Добавить toast-уведомления (CSS + JS) | `docs/index.html` |
| 4 | Исправить контакты: footer + добавить под формами | `docs/index.html` |
| 5 | Добавить `name`/`id` полям форм, honeypot, обработчики `submitOrder()`/`submitJoin()` | `docs/index.html` |
| 6 | Обновить `openModal(preselect)` для предвыбора типа работы | `docs/index.html` |
| 7 | Создать Cloudflare Worker (`worker.js` + `wrangler.toml`) | `worker/` (новые файлы) |
| 8 | Фиксы: дисклеймер, meta-теги, favicon | `docs/index.html` |
| 9 | Удалить неиспользуемые `docs/assets/lottie/*.json` | `docs/assets/` |
| 10 | Git commit + push | — |

---

## Файлы для изменения

- `C:\Logic-Architecture\docs\index.html` — откат Lottie, библиотеки, формы, контакты, meta
- `C:\Logic-Architecture\worker\worker.js` — **НОВЫЙ** — Cloudflare Worker прокси
- `C:\Logic-Architecture\worker\wrangler.toml` — **НОВЫЙ** — конфигурация Worker
- Удалить: `C:\Logic-Architecture\docs\assets\lottie\loadingV2.json`, `Server.json`

---

## Верификация

1. Открыть `index.html` → emoji отображаются (не пустые контейнеры)
2. Hero: Typed.js печатает «диплом» → стирает → «курсовую» → ...
3. Скролл вниз → карточки появляются с AOS-анимациями (fade-up)
4. Нажать «Рассчитать стоимость» на карточке Курсовые → модалка с предвыбором «Курсовая работа»
5. Заполнить модалку → «Отправить заявку» → toast «Заявка отправлена!»
6. Повторная отправка < 60 сек → toast «Подождите минуту»
7. Footer: «Telegram» → открывает `t.me/LogicArchitecture`
8. Под формами: видна прямая ссылка `@LogicArchitecture`
9. Вкладка Join: заполнить → отправить → toast + данные в Telegram
10. `wrangler dev` → POST /order с JSON → сообщение приходит в Telegram-бот
11. Console: нет ошибок
12. DevTools Mobile (375px): формы, toast, контакты корректны
