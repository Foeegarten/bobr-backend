// authController.js

const User = require('../models/User'); // Предполагается, что у тебя есть модель User
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs'); // Для хеширования паролей

// Генерация JWT токена
const generateToken = (userId) => {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
        expiresIn: '24h' // Токен действует 24 часа
    });
};

// Регистрация пользователя
exports.register = async (req, res) => {
    const { username, email, password } = req.body;

    // Валидация обязательных полей
    if (!username || !email || !password) {
        return res.status(400).json({
            error: 'Все поля обязательны для заполнения: username, email, password'
        });
    }

    try {
        // Проверка существующего пользователя по email или username
        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            const errorField = existingUser.email === email ? 'email' : 'username';
            return res.status(409).json({
                error: `${errorField === 'email' ? 'Email' : 'Имя пользователя'} уже используется`
            });
        }

        // Создание нового пользователя
        const user = new User({ username, email, password }); // Предполагается, что в User Model есть pre-save hook для хеширования пароля
        await user.save();

        // Генерация токена
        const token = generateToken(user._id);

        // Установка httpOnly куки
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // true в продакшене (требует HTTPS)
            maxAge: 24 * 60 * 60 * 1000, // 1 день
            sameSite: 'strict' // Защита от CSRF
        });

        // Ответ с данными пользователя и токеном в теле ответа
        return res.status(201).json({
            user: {
                id: user._id,
                username: user.username,
                email: user.email
            },
            token: token // <--- Токен теперь возвращается в теле ответа
        });

    } catch (err) {
        console.error('Ошибка регистрации:', err);

        // Обработка ошибок валидации Mongoose (если есть)
        if (err.name === 'ValidationError') {
            const errors = Object.values(err.errors).map(e => e.message);
            return res.status(400).json({ error: errors.join(', ') });
        }

        return res.status(500).json({ error: 'Ошибка сервера при регистрации' });
    }
};

// Логин пользователя
exports.login = async (req, res) => {
    const { email, password } = req.body;

    // Базовая валидация
    if (!email || !password) {
        return res.status(400).json({
            error: 'Email и пароль обязательны'
        });
    }

    try {
        // Поиск пользователя по email
        // .select('+password') нужен, если ты скрываешь пароль по умолчанию в схеме модели
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(401).json({
                error: 'Неверные учетные данные'
            });
        }

        // Проверка пароля
        // Предполагается, что у User Model есть метод comparePassword
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({
                error: 'Неверные учетные данные'
            });
        }

        // Генерация токена
        const token = generateToken(user._id);

        // Установка httpOnly куки
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 24 * 60 * 60 * 1000,
            sameSite: 'strict'
        });

        // Ответ с данными пользователя и токеном в теле ответа
        return res.json({
            user: {
                id: user._id,
                username: user.username,
                email: user.email
            },
            token: token // <--- Токен теперь возвращается в теле ответа
        });

    } catch (err) {
        console.error('Ошибка входа:', err);
        return res.status(500).json({ error: 'Ошибка сервера при входе' });
    }
};

// Выход пользователя
exports.logout = (req, res) => {
    // Очистка куки с токеном
    res.clearCookie('token');
    return res.json({ message: 'Выход выполнен успешно' });
};

// Получение текущего пользователя (защищенный маршрут)
exports.getMe = async (req, res) => {
    try {
        // Предполагается, что authMiddleware установил req.userId или req.user.id
        // Проверь, что именно устанавливает твой authMiddleware
        const user = await User.findById(req.userId || req.user.id).select('-password'); // Исключаем пароль из ответа
        if (!user) {
            return res.status(404).json({
                error: 'Пользователь не найден'
            });
        }

        return res.json({
            user: {
                id: user._id,
                username: user.username,
                email: user.email
            }
        });

    } catch (err) {
        console.error('Ошибка получения профиля:', err);
        return res.status(500).json({ error: 'Ошибка сервера' });
    }
};
