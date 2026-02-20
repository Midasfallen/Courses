# План: Мультиязычность (i18n) — 4 языка (v2)

## Контекст

Сайт Logic Architecture — single-file SPA (`index.html`, 120KB, 1558 строк). Нужно добавить переключение между 4 языками: **русский** (по умолчанию), **английский**, **вьетнамский**, **китайский**.

**Проблема предыдущего подхода:** inline-словарь 260 ключей × 4 языка = ~75-100KB текста. Это удваивает размер файла и невозможно сгенерировать за один проход (превышает лимит токенов). Нужна другая архитектура.

### Уже реализовано (шаги 1-2)
- CSS переключателя языков (13 правил, `.lang-sw`, `.lang-btn`, `.lang-menu` и т.д.)
- HTML переключатель в хедере (4 языка: RU, EN, VI, ZH)
- Responsive правила (900px, 480px)
- **260 атрибутов `data-i18n`/`data-i18n-html`/`data-i18n-ph`** на всех переводимых элементах

### Осталось реализовать
- JS-логика i18n (~80 строк в index.html)
- 3 внешних JSON-файла с переводами (en, vi, zh)

---

## Архитектура: Внешние JSON-файлы (Вариант B)

### Почему не inline-словарь?
- 260 × 4 языка = ~100KB текста → файл разбухает до 220KB
- Генерация всего словаря за один проход невозможна (лимит 32K токенов)
- Нечитаемый код

### Почему внешние JSON?
- **Нулевая цена для RU-пользователей** (95%+ аудитории): русский текст в DOM, ничего не грузится
- **Lazy loading**: JSON загружается только при переключении (25KB на язык)
- **Кэширование**: Cloudflare CDN, после первой загрузки — из кэша мгновенно
- **Генерация по частям**: каждый JSON — отдельная задача, не превышает лимит токенов
- **Чистый index.html**: +3KB за JS-логику вместо +100KB за словарь

### Структура файлов
```
docs/
  index.html           # +~3KB (JS-логика i18n)
  i18n/
    en.json             # ~25KB — английский
    vi.json             # ~25KB — вьетнамский
    zh.json             # ~25KB — китайский (упрощённый)
```
`ru.json` не нужен — русский текст уже в DOM.

### Формат JSON
Плоский объект с dot-notation ключами, совпадающими с `data-i18n` атрибутами:
```json
{
  "nav.home": "Home",
  "nav.services": "Services",
  "hero.title": "We design and build<br><span class=\"grad\"><span id=\"typed-target\"></span></span>",
  "typed.strings": ["digital products", "marketing strategies", "web services", "mobile apps", "technical documentation"],
  "toast.success": "Application sent! We will contact you through a secure channel"
}
```

---

## Шаг 3: JS-логика i18n (добавить в index.html)

**Файл:** `C:\Courses\docs\index.html` — перед `// ===== FORM HELPERS =====` (строка 1521)

### 3.1 Переменные состояния
```javascript
let currentLang = 'ru';
let i18nCache = {};
let typedInstance = null;
```

### 3.2 toggleLangMenu()
```javascript
function toggleLangMenu() {
    document.getElementById('langSw').classList.toggle('open');
}
document.addEventListener('click', function(e) {
    var sw = document.getElementById('langSw');
    if (!sw.contains(e.target)) sw.classList.remove('open');
});
```

### 3.3 Утилита getI18n()
```javascript
function getI18n(key, fallback) {
    if (currentLang === 'ru') return fallback;
    var d = i18nCache[currentLang];
    return (d && d[key]) || fallback;
}
```

### 3.4 setLang() — загрузка JSON и применение
```javascript
async function setLang(lang) {
    if (lang === currentLang) {
        document.getElementById('langSw').classList.remove('open');
        return;
    }
    // Загрузить JSON если не RU и не в кэше
    if (lang !== 'ru' && !i18nCache[lang]) {
        try {
            var res = await fetch('i18n/' + lang + '.json');
            if (!res.ok) throw new Error();
            i18nCache[lang] = await res.json();
        } catch(e) {
            showToast('Language loading error', 'error');
            return;
        }
    }
    applyLang(lang);
}
```

### 3.5 applyLang() — обновление DOM
Ключевой паттерн: при первом переключении с RU сохраняем оригинальный текст в `el._i18nOrig`. При возврате на RU — восстанавливаем из `_i18nOrig`.

```javascript
function applyLang(lang) {
    var dict = lang === 'ru' ? null : i18nCache[lang];
    currentLang = lang;
    localStorage.setItem('la_lang', lang);
    document.documentElement.lang = lang;

    // data-i18n → textContent
    document.querySelectorAll('[data-i18n]').forEach(function(el) {
        var k = el.getAttribute('data-i18n');
        if (lang === 'ru') {
            if (el._i18nOrig !== undefined) el.textContent = el._i18nOrig;
        } else {
            if (el._i18nOrig === undefined) el._i18nOrig = el.textContent;
            if (dict[k] !== undefined) el.textContent = dict[k];
        }
    });

    // data-i18n-html → innerHTML
    document.querySelectorAll('[data-i18n-html]').forEach(function(el) {
        var k = el.getAttribute('data-i18n-html');
        if (lang === 'ru') {
            if (el._i18nOrigH !== undefined) el.innerHTML = el._i18nOrigH;
        } else {
            if (el._i18nOrigH === undefined) el._i18nOrigH = el.innerHTML;
            if (dict[k] !== undefined) el.innerHTML = dict[k];
        }
    });

    // data-i18n-ph → placeholder
    document.querySelectorAll('[data-i18n-ph]').forEach(function(el) {
        var k = el.getAttribute('data-i18n-ph');
        if (lang === 'ru') {
            if (el._i18nOrigP !== undefined) el.placeholder = el._i18nOrigP;
        } else {
            if (el._i18nOrigP === undefined) el._i18nOrigP = el.placeholder;
            if (dict[k] !== undefined) el.placeholder = dict[k];
        }
    });

    // Typed.js — ПОСЛЕ innerHTML (hero.title пересоздаёт #typed-target)
    reinitTyped(lang, dict);

    // UI переключателя
    document.getElementById('langCurrent').textContent = lang.toUpperCase();
    document.querySelectorAll('.lang-opt').forEach(function(o) {
        o.classList.toggle('active', o.dataset.lang === lang);
    });
    document.getElementById('langSw').classList.remove('open');

    // Открытые аккордеоны — пересчитать высоту
    document.querySelectorAll('.svc-item.open .svc-body').forEach(function(b) {
        b.style.maxHeight = b.scrollHeight + 'px';
    });

    AOS.refresh();
}
```

### 3.6 reinitTyped()
```javascript
function reinitTyped(lang, dict) {
    if (typedInstance) { typedInstance.destroy(); typedInstance = null; }
    var el = document.getElementById('typed-target');
    if (!el) return;
    var strings = (lang === 'ru')
        ? ['цифровые продукты','маркетинговые стратегии','веб-сервисы','мобильные приложения','техническую документацию']
        : (dict && dict['typed.strings']) || ['digital products','marketing strategies','web services','mobile apps','technical documentation'];
    typedInstance = new Typed('#typed-target', {
        strings: strings, typeSpeed: 70, backSpeed: 40, backDelay: 2000,
        loop: true, showCursor: true, cursorChar: '|'
    });
}
```

### 3.7 Инициализация (заменяет текущий `new Typed(...)` на строке 1554)
```javascript
(function() {
    var s = localStorage.getItem('la_lang');
    if (s && s !== 'ru' && ['en','vi','zh'].indexOf(s) !== -1) {
        setLang(s);
    } else {
        typedInstance = new Typed('#typed-target', {
            strings: ['цифровые продукты','маркетинговые стратегии','веб-сервисы','мобильные приложения','техническую документацию'],
            typeSpeed: 70, backSpeed: 40, backDelay: 2000,
            loop: true, showCursor: true, cursorChar: '|'
        });
    }
})();
```

---

## Шаг 4: Обновить submitJoin()

**Файл:** `C:\Courses\docs\index.html`, строки 1528-1548

Заменить хардкод-строки на `getI18n()`:
- `'Подождите минуту...'` → `getI18n('toast.ratelimit','Подождите минуту перед повторной отправкой')`
- `'Укажите контакт...'` → `getI18n('toast.nocontact','Укажите контакт для связи')`
- `'Отправляем...'` → `getI18n('toast.sending','Отправляем...')`
- `'Заявка отправлена!'` → `getI18n('toast.success','Заявка отправлена! Мы свяжемся через защищённый канал')`
- `'Ошибка отправки.'` → `getI18n('toast.error','Ошибка отправки. Напишите нам напрямую в Telegram')`
- `'Присоединиться'` → `getI18n('join.form.btn','Присоединиться')`

---

## Шаг 5: Генерация JSON-файлов переводов

Каждый файл генерируется побатчево (4 батча по ~65 ключей), чтобы не превышать лимит токенов:

| Батч | Ключи | ~Количество |
|------|-------|-------------|
| 1 | `nav.*`, `hero.*`, `home.*`, `svc.*`, `typed.*`, `toast.*`, `modal.*`, `footer.*` | ~100 |
| 2 | `stu.*` (студенческая вкладка — самая большая) | ~65 |
| 3 | `tech.*`, `inv.*`, `abt.*` | ~55 |
| 4 | `join.*` + финальная сборка/валидация | ~40 |

**Порядок генерации:**
1. `docs/i18n/en.json` — английский (проще всего валидировать)
2. `docs/i18n/vi.json` — вьетнамский
3. `docs/i18n/zh.json` — китайский (упрощённый)

**Правила перевода:**
- Цены в ₽ — оставить как есть
- ГОСТ → en: "GOST", vi: "tiêu chuẩn GOST", zh: "GOST标准"
- Технические термины (NestJS, RAG, etc.) — на английском во всех языках
- Антиплагиат → en: "plagiarism checker", vi: "phần mềm kiểm tra đạo văn", zh: "反抄袭检测"
- ВАК/РИНЦ → en: "VAK and RINC", vi/zh: аналогично
- HTML-ключи: переводить текст, сохранять теги (`<br>`, `<span>`, `<a>`)

---

## Edge cases

1. **hero.title**: `data-i18n-html` содержит `<br><span class="grad"><span id="typed-target"></span></span>`. innerHTML обновляется ПЕРЕД `reinitTyped()`, чтобы `#typed-target` был на месте
2. **Typed.js cursor**: `destroy()` удаляет старый, `new Typed()` создаёт новый — дублей нет
3. **Аккордеоны**: после смены языка пересчёт `maxHeight` всех открытых `.svc-item.open`
4. **AOS**: `AOS.refresh()` после смены языка
5. **Сетевая ошибка**: если JSON не загрузился — toast с ошибкой, язык не меняется
6. **FOUC**: при загрузке страницы пользователь с EN кратко видит RU (~50-150ms на CDN), затем JSON подтягивается. Приемлемо для CDN

---

## Порядок реализации

| # | Действие | Файлы | Сложность |
|---|---|---|---|
| 1 | ~~CSS переключателя~~ | ~~index.html~~ | ✅ Сделано |
| 2 | ~~HTML переключателя~~ | ~~index.html~~ | ✅ Сделано |
| 3 | ~~260 data-i18n атрибутов~~ | ~~index.html~~ | ✅ Сделано |
| 4 | JS-логика i18n (~80 строк) | index.html | Средняя |
| 5 | Обновить submitJoin() | index.html | Маленькая |
| 6 | Заменить Typed.js init на initI18n | index.html | Маленькая |
| 7 | Генерация `en.json` (4 батча) | docs/i18n/en.json (новый) | Большая |
| 8 | Генерация `vi.json` (4 батча) | docs/i18n/vi.json (новый) | Большая |
| 9 | Генерация `zh.json` (4 батча) | docs/i18n/zh.json (новый) | Большая |
| 10 | Тестирование через Chrome MCP | — | Средняя |

---

## Проверка (через Chrome MCP)

1. Переключатель языков отображается в хедере (десктоп + мобайл)
2. Клик EN — ВСЕ тексты меняются на английский на всех 7 вкладках
3. Клик RU — возврат к русскому (восстановление из `_i18nOrig`)
4. Typed.js перезапускается с правильными строками
5. Форма «Присоединиться» — placeholders и labels меняются
6. Модальное окно — текст переводится
7. Перезагрузка страницы — язык сохранён (localStorage)
8. Аккордеоны работают после смены языка
9. Ноль ошибок в консоли, JSON загружается из `/i18n/en.json`
10. Мобильная версия (390px) — переключатель виден и работает
11. VI и ZH — аналогичная проверка
