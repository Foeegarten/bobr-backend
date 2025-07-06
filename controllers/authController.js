// authController.js

const User = require('../models/User'); 
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs'); 

// Генерация JWT токена
const generateToken = (userId) => {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
        expiresIn: '24h' 
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

        const user = new User({ username, email, password }); 
        await user.save();

        const token = generateToken(user._id);

 
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', 
            maxAge: 24 * 60 * 60 * 1000, 
            sameSite: 'strict' 
        });

  
        return res.status(201).json({
            user: {
                id: user._id,
                username: user.username,
                email: user.email
            },
        });

    } catch (err) {
        console.error('Ошибка регистрации:', err);


        if (err.name === 'ValidationError') {
            const errors = Object.values(err.errors).map(e => e.message);
            return res.status(400).json({ error: errors.join(', ') });
        }

        return res.status(500).json({ error: 'Ошибка сервера при регистрации' });
    }
};


exports.login = async (req, res) => {
    const { email, password } = req.body;

 
    if (!email || !password) {
        return res.status(400).json({
            error: 'Email и пароль обязательны'
        });
    }

    try {

        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(401).json({
                error: 'Неверные учетные данные'
            });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({
                error: 'Неверные учетные данные'
            });
        }

  
        const token = generateToken(user._id);

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 24 * 60 * 60 * 1000,
            sameSite: 'strict'
        });


        return res.json({
            user: {
                id: user._id,
                username: user.username,
                email: user.email
            },
            token: token 
        });

    } catch (err) {
        console.error('Ошибка входа:', err);
        return res.status(500).json({ error: 'Ошибка сервера при входе' });
    }
};


exports.logout = (req, res) => {

    res.clearCookie('token');
    return res.json({ message: 'Выход выполнен успешно' });
};


exports.getMe = async (req, res) => {
    try {

        const user = await User.findById(req.userId || req.user.id).select('-password'); 
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
