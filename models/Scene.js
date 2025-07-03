
const mongoose = require('mongoose');

const SceneSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', 
        required: true
    },
    youtubeLink: {
        type: String,
        required: true
    },
    startTimecode: { // Начальный таймкод видео для сцены в секундах
        type: Number,
        default: 0
    },
    endTimecode: {   // Конечный таймкод видео (или просто текущий при записи)
        type: Number,
        default: 0
    },
    transcript: {    // Текст транскрипта
        type: String,
        default: ''
    },
    audioData: {     // Бинарные данные аудио (BLOB)
        type: Buffer,
        required: false 
    },
    audioMimeType: { // MIME-тип аудио (например, 'audio/webm')
        type: String,
        required: false
    },
    isPublic: {      
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

SceneSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Scene', SceneSchema);