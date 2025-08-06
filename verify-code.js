// api/verify-code.js
// Работает на Vercel, Railway, и других серверах с Node.js

// Глобальное хранилище кодов (в продакшене используйте Redis!)
global.smsCodes = global.smsCodes || {};

export default async function handler(req, res) {
    // Разрешаем CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Обработка preflight-запроса (OPTIONS)
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Должен быть POST-запрос
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Метод не поддерживается. Используйте POST.' });
    }

    // Получаем данные из тела запроса
    const { phone, code } = req.body;

    // Валидация входных данных
    if (!phone || !code) {
        return res.status(400).json({ error: 'Требуются phone и code.' });
    }

    // Приводим номер к формату 79046660999
    const formattedPhone = phone.replace(/\D/g, '');
    if (!/^7\d{10}$/.test(formattedPhone)) {
        return res.status(400).json({ error: 'Неверный формат номера.' });
    }

    // Проверяем, есть ли сохранённый код
    if (!global.smsCodes[formattedPhone]) {
        return res.status(400).json({ valid: false, error: 'Код не найден или уже использован.' });
    }

    const stored = global.smsCodes[formattedPhone];

    // Проверка срока действия
    if (Date.now() > stored.expires) {
        delete global.smsCodes[formattedPhone]; // Удаляем просроченный код
        return res.status(400).json({ valid: false, error: 'Код устарел. Запросите новый.' });
    }

    // Проверка кода
    if (stored.code === code) {
        // Успешно! Удаляем код (одноразовый)
        delete global.smsCodes[formattedPhone];

        return res.status(200).json({
            valid: true,
            message: 'Код подтверждён. Вход разрешён.',
        });
    } else {
        return res.status(400).json({
            valid: false,
            error: 'Неверный код.',
        });
    }
}

// Экспорт конфига (для Vercel)
export const config = {
    api: {
        bodyParser: true,
    },
};