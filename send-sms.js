// api/send-sms.js
// Работает на Vercel, Railway, и других серверах с Node.js

// Глобальное хранилище кодов (в продакшене используйте Redis!)
global.smsCodes = global.smsCodes || {};

export default async function handler(req, res) {
    // Разрешаем CORS (если фронтенд на другом домене)
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

    // Получаем номер из тела запроса
    const { phone } = req.body;

    // Валидация номера (поддержка +7, 7, 8)
    const phoneRegex = /^(\+7|7|8)\d{10}$/;
    if (!phone || !phoneRegex.test(phone)) {
        return res.status(400).json({ error: 'Неверный формат номера. Пример: +79046660999' });
    }

    // Приводим номер к формату SMS.ru: 79046660999
    const formattedPhone = phone.replace(/^(\+?7|8)/, '7');

    // Генерируем 4-значный код
    const code = Math.floor(1000 + Math.random() * 9000).toString();

    // Сохраняем код и время истечения (5 минут)
    global.smsCodes[formattedPhone] = {
        code: code,
        expires: Date.now() + 5 * 60 * 1000, // 5 минут
    };

    // ВАШ API-КЛЮЧ от SMS.ru (НИКОГДА не храните в коде в продакшене!)
    // Лучше используйте переменные окружения: process.env.SMS_RU_API_KEY
    const apiKey = process.env.SMS_RU_API_KEY || 'ВАШ_API_КЛЮЧ_ЗДЕСЬ';

    if (!apiKey || apiKey === 'ВАШ_API_КЛЮЧ_ЗДЕСЬ') {
        console.error('❌ API-ключ SMS.ru не задан!');
        return res.status(500).json({ error: 'Сервис временно недоступен (ошибка конфигурации).' });
    }

    // Текст сообщения
    const message = `Ваш код подтверждения в "СТРОЙ по КАрману": ${code}. Действует 5 минут.`;

    // URL для отправки SMS через SMS.ru
    const url = `https://sms.ru/sms/send?api_id=${apiKey}&to=${formattedPhone}&msg=${encodeURIComponent(message)}&json=1`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.status === 'OK') {
            console.log(`✅ Код отправлен на ${formattedPhone}`);
            return res.status(200).json({
                success: true,
                message: 'Код отправлен',
                phone: formattedPhone,
            });
        } else {
            console.error('❌ Ошибка SMS.ru:', data);
            return res.status(500).json({
                error: 'Не удалось отправить SMS',
                details: data.status_text,
            });
        }
    } catch (err) {
        console.error('❌ Ошибка при отправке SMS:', err);
        return res.status(500).json({
            error: 'Ошибка сети или сервера',
            details: err.message,
        });
    }
}

// Экспорт конфига (для Vercel)
export const config = {
    api: {
        bodyParser: true,
    },
};