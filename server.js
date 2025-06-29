require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');

require('dotenv').config();
const app = express();

<<<<<<< HEAD
// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL,
=======
app.use(cors({
  origin: 'http://localhost:5173',
>>>>>>> 1a7bb4403e3e5144472a28aa045f037e7f4e36a5
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Database
connectDB();

// Routes
app.use('/api/auth', authRoutes);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});