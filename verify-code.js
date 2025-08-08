// /api/verify-code.js
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Метод не поддерживается' });
    }

    const { phone, code } = req.body;
    const formattedPhone = phone.replace(/\D/g, '');

    global.smsCodes = global.smsCodes || {};

    const stored = global.smsCodes[formattedPhone];
    if (!stored) {
        return res.status(400).json({ valid: false, error: 'Код не найден' });
    }

    if (Date.now() > stored.expires) {
        delete global.smsCodes[formattedPhone];
        return res.status(400).json({ valid: false, error: 'Код устарел' });
    }

    if (stored.code === code) {
        delete global.smsCodes[formattedPhone];
        return res.status(200).json({ valid: true });
    } else {
        return res.status(400).json({ valid: false, error: 'Неверный код' });
    }
}