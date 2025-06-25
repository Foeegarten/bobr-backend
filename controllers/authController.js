const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Регистрация
exports.register = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    // Проверка на существующего пользователя
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ 
        error: existingUser.email === email 
          ? 'Email already in use' 
          : 'Username already taken' 
      });
    }

    // Создание пользователя
    const user = new User({ username, email, password });
    await user.save();

    // Генерация токена
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { 
      expiresIn: '24h' 
    });

    // Установка куки
    res.cookie('token', token, {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 // 1 день
    });

    res.status(201).json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: `Registration failed ${error.message}` });
  }
};

// Логин
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Находим пользователя с паролем
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    // Используем метод comparePassword из модели User
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    // Генерация токена
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { 
      expiresIn: '24h' 
    });

    // Установка куки
    res.cookie('token', token, {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000
    });

    res.json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed' });
  }
};

// Выход
exports.logout = (req, res) => {
  res.clearCookie('token');
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
  }
};