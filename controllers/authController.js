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
    // Проверка существующего пользователя
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      const errorField = existingUser.email === email ? 'email' : 'username';
      return res.status(409).json({ 
        error: `${errorField === 'email' ? 'Email' : 'Имя пользователя'} уже используется` 
      });
    }

    // Создание нового пользователя
    const user = new User({ username, email, password });
    await user.save();

    // Генерация токена
    const token = generateToken(user._id);

    // Установка httpOnly куки
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // HTTPS в продакшене
      maxAge: 24 * 60 * 60 * 1000, // 1 день
      sameSite: 'strict'
    });

    // Ответ без пароля
    return res.status(201).json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });
<<<<<<< HEAD

  } catch (err) {
    console.error('Ошибка регистрации:', err);
    
    // Обработка ошибок валидации Mongoose
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ error: errors.join(', ') });
    }
    
    return res.status(500).json({ error: 'Ошибка сервера при регистрации' });
=======
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: `Registration failed ${error.message}` });
>>>>>>> 1a7bb4403e3e5144472a28aa045f037e7f4e36a5
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
    // Поиск пользователя с паролем
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
<<<<<<< HEAD
      return res.status(401).json({ 
        error: 'Неверные учетные данные' 
      });
=======
      return res.status(401).json({ message: 'User not found' });
>>>>>>> 1a7bb4403e3e5144472a28aa045f037e7f4e36a5
    }

    // Проверка пароля
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
<<<<<<< HEAD
      return res.status(401).json({ 
        error: 'Неверные учетные данные' 
      });
=======
      return res.status(401).json({ message: 'Invalid password' });
>>>>>>> 1a7bb4403e3e5144472a28aa045f037e7f4e36a5
    }

    // Генерация токена
    const token = generateToken(user._id);

    // Установка куки
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: 'strict'
    });

    // Ответ
    return res.json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });
<<<<<<< HEAD

  } catch (err) {
    console.error('Ошибка входа:', err);
    return res.status(500).json({ error: 'Ошибка сервера при входе' });
=======
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed' });
>>>>>>> 1a7bb4403e3e5144472a28aa045f037e7f4e36a5
  }
};

// Выход пользователя
exports.logout = (req, res) => {
  res.clearCookie('token');
<<<<<<< HEAD
  return res.json({ message: 'Выход выполнен успешно' });
};

// Получение текущего пользователя
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
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
=======
  res.json({ message: 'Logged out successfully' });
};


exports.currentUser = async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: 'Unauthorized' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) return res.status(401).json({ message: 'User not found' });

    res.json({ user });
  } catch (err) {
    return res.status(401).json({ message: 'Unauthorized' });
>>>>>>> 1a7bb4403e3e5144472a28aa045f037e7f4e36a5
  }
};