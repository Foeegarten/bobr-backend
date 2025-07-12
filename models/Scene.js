
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
    youtubeTitle: { type: String, default: '' },
    startTimecode: { 
        type: Number,
        default: 0
    },
    endTimecode: {   
        type: Number,
        default: 0
    },
    transcript: {   
        type: String,
        default: ''
    },
    audioData: {    
        type: Buffer,
        required: false 
    },
    audioMimeType: {
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