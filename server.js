

const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');


dotenv.config();

const app = express();


app.use(morgan('dev'));
app.use(cookieParser());
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
}));


app.use(express.json({ limit: '100mb' }));

// --- Подключение к MongoDB ---
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected...');
    } catch (err) {
        console.error(err.message);
        
        process.exit(1);
    }
};
connectDB();

// --- Роуты ---

const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

const sceneRoutes = require('./routes/sceneRoutes');
app.use('/api/scenes', sceneRoutes);

app.get('/', (req, res) => {
    res.send('Bobr Backend API is running...');
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
