

const express = require('express');

const {
  register,
  login,
  logout,
  getMe, 
} = require('../controllers/authController');


const authMiddleware = require('../middleware/auth.js');

const router = express.Router();

// Маршруты аутентификации
router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);

router.get('/current-user', authMiddleware, getMe); 

module.exports = router;
