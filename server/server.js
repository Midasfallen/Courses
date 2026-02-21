const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || 'https://logic-architecture.com';

// Middleware
app.use(express.json({ limit: '10kb' }));
app.use(cors({
    origin: (origin, cb) => {
        if (!origin || origin === ALLOWED_ORIGIN || ALLOWED_ORIGIN === '*') {
            cb(null, true);
        } else {
            cb(null, false);
        }
    },
    methods: ['POST'],
    allowedHeaders: ['Content-Type']
}));

// Health check
app.get('/health', (req, res) => res.json({ ok: true, uptime: process.uptime() }));

// POST /order
app.post('/order', async (req, res) => {
    try {
        const data = req.body;
        if (data.website) return res.json({ ok: true }); // Honeypot
        const text = formatOrder(data);
        const ok = await sendTelegram(text);
        res.json({ ok });
    } catch (err) {
        console.error('Order error:', err.message);
        res.status(500).json({ ok: false, error: 'Internal error' });
    }
});

// POST /join
app.post('/join', async (req, res) => {
    try {
        const data = req.body;
        if (data.website) return res.json({ ok: true }); // Honeypot
        const text = formatJoin(data);
        const ok = await sendTelegram(text);
        res.json({ ok });
    } catch (err) {
        console.error('Join error:', err.message);
        res.status(500).json({ ok: false, error: 'Internal error' });
    }
});

// Send message to Telegram Bot API
async function sendTelegram(text) {
    const url = `https://api.telegram.org/bot${process.env.TG_TOKEN}/sendMessage`;
    const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: process.env.TG_CHAT_ID,
            text,
            parse_mode: 'HTML'
        })
    });
    return resp.ok;
}

// Format functions (ported from worker/worker.js)
function formatOrder(d) {
    const bizTypes = ['Проектная', 'Техническая', 'Тестовая', 'Документация для пользователей', 'Юридическая', 'Pitch Deck'];
    const isBiz = bizTypes.some(t => (d.workType || '').includes(t));
    const badge = isBiz ? '🏢 B2B' : '🎓 B2C';
    const time = new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' });
    return `🔔 <b>Новая заявка — Logic Architecture</b>\n━━━━━━━━━━━━━━━━━\n${badge}\n\n` +
        `👤 <b>Имя:</b> ${esc(d.name)}\n📱 <b>Контакт:</b> ${esc(d.contact)}\n` +
        `📋 <b>Тип:</b> ${esc(d.workType || '—')}\n💬 <b>Комментарий:</b>\n<i>${esc(d.comment || '—')}</i>\n\n⏰ <code>${time} МСК</code>`;
}

function formatJoin(d) {
    const time = new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' });
    return `🌐 <b>Заявка на присоединение</b>\n━━━━━━━━━━━━━━━━━\n\n` +
        `👤 <b>Имя:</b> ${esc(d.name || '—')}\n\n` +
        `📝 <b>О себе:</b>\n<i>${esc(d.about || '—')}</i>\n\n💻 <b>Опыт:</b>\n<i>${esc(d.experience || '—')}</i>\n\n` +
        `🎯 <b>Хобби:</b>\n<i>${esc(d.hobbies || '—')}</i>\n\n📱 <b>Контакт:</b> ${esc(d.contact)}\n\n⏰ <code>${time} МСК</code>`;
}

function esc(s) { return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Logic Architecture API running on port ${PORT}`);
});
