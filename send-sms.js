// /api/send-sms.js
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Метод не поддерживается' });
    }

    const { phone } = req.body;

    const phoneRegex = /^(\+7|7|8)\d{10}$/;
    if (!phone || !phoneRegex.test(phone)) {
        return res.status(400).json({ error: 'Неверный формат номера' });
    }

    const formattedPhone = phone.replace(/^(\+?7|8)/, '7');

    const code = Math.floor(1000 + Math.random() * 9000).toString();

    global.smsCodes = global.smsCodes || {};
    global.smsCodes[formattedPhone] = {
        code: code,
        expires: Date.now() + 5 * 60 * 1000
    };

    const apiKey = process.env.SMS_RU_API_KEY;
    if (!apiKey) {
        console.error('❌ SMS_RU_API_KEY не установлен');
        return res.status(500).json({ error: 'Ошибка конфигурации' });
    }

    const message = `Ваш код: ${code}. Не передавайте его.`;
    const url = `https://sms.ru/sms/send?api_id=${apiKey}&to=${formattedPhone}&msg=${encodeURIComponent(message)}&json=1`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        if (data.status === 'OK') {
            return res.status(200).json({ success: true });
        } else {
            return res.status(500).json({ error: 'SMS не отправлено', details: data.status_text });
        }
    } catch (err) {
        return res.status(500).json({ error: 'Ошибка сети', details: err.message });
    }
}