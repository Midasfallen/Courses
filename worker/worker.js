export default {
    async fetch(request, env) {
        if (request.method === 'OPTIONS') return corsResponse();
        if (request.method !== 'POST') return new Response('', { status: 405 });

        const url = new URL(request.url);
        let data;
        try { data = await request.json(); } catch { return new Response('Bad Request', { status: 400 }); }

        // Honeypot check
        if (data.website) return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } });

        let text;
        if (url.pathname === '/order') {
            text = formatOrder(data);
        } else if (url.pathname === '/join') {
            text = formatJoin(data);
        } else {
            return new Response('Not Found', { status: 404 });
        }

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

        const origin = request.headers.get('Origin') || '';
        const allowed = env.ALLOWED_ORIGIN || '*';
        const corsOrigin = (allowed === '*' || origin === allowed) ? origin : allowed;
        return new Response(JSON.stringify({ ok: tgRes.ok }), {
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': corsOrigin,
                'Access-Control-Allow-Methods': 'POST',
                'Access-Control-Allow-Headers': 'Content-Type'
            }
        });
    }
};

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
        `👤 <b>О себе:</b>\n<i>${esc(d.about || '—')}</i>\n\n💻 <b>Опыт:</b>\n<i>${esc(d.experience || '—')}</i>\n\n` +
        `🎯 <b>Хобби:</b>\n<i>${esc(d.hobbies || '—')}</i>\n\n📱 <b>Контакт:</b> ${esc(d.contact)}\n\n⏰ <code>${time} МСК</code>`;
}

function esc(s) { return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

function corsResponse() {
    return new Response(null, {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST',
            'Access-Control-Allow-Headers': 'Content-Type'
        }
    });
}
