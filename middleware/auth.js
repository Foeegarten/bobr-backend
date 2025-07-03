// middleware/authMiddleware.js

const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();

module.exports = (req, res, next) => {
    // Получаем токен из заголовка 'x-auth-token'
    // Или из заголовка 'Authorization', если используется 'Bearer <token>'
    const token = req.header('x-auth-token');

    // Если токена нет, отклоняем авторизацию
    if (!token) {
        return res.status(401).json({ message: 'No token, authorization denied' });
    }

    try {
        // Верифицируем токен
        // Предполагается, что JWT payload содержит { id: userId }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Добавляем ID пользователя в объект запроса
        // Это делает ID пользователя доступным в последующих маршрутах как req.user.id
        // Если ваш JWT payload имеет { user: { id: '...' } }, используйте req.user = decoded.user;
        // Но из ваших authController.js видно, что payload содержит { id: userId },
        // поэтому мы напрямую устанавливаем req.user = { id: decoded.id };
        req.user = { id: decoded.id }; // <--- ИЗМЕНЕНО ЗДЕСЬ

        next(); // Передаем управление следующему middleware или обработчику маршрута
    } catch (err) {
        // Если токен недействителен (истек, изменен и т.д.)
        console.error('Token verification failed:', err.message);
        res.status(401).json({ message: 'Token is not valid' });
    }
};
