// routes/sceneRoutes.js

const express = require('express');
const router = express.Router();
const multer = require('multer');
const Scene = require('../models/Scene');
const authMiddleware = require('../middleware/auth.js');
const {extractVideoId, fetchYouTubeTitle} = require("../utils/youte.utils");

const upload = multer({ storage: multer.memoryStorage() });

// --- POST /api/scenes ---

router.post('/', authMiddleware, upload.single('audioFile'), async (req, res) => {
    try {
        console.log('Received POST /api/scenes request.');
        console.log('Request body:', req.body);
        console.log('Request file (audioFile):', req.file);

        const userId = req.user && req.user.id ? req.user.id : null;
        console.log('User ID from token:', userId);

        if (!userId) {
            console.error('Error: User ID not found in token after authMiddleware.');
            return res.status(401).json({ message: 'Unauthorized: User ID missing.' });
        }

        const { youtubeLink, startTimecode, endTimecode, transcript } = req.body;

        if (!youtubeLink) {
            console.error('Validation Error: YouTube link is required.');
            return res.status(400).json({ message: 'YouTube link is required' });
        }


        const videoId = extractVideoId(youtubeLink);
        const youtubeTitle = await fetchYouTubeTitle(videoId);

        const audioData = req.file ? req.file.buffer : null;
        const audioMimeType = req.file ? req.file.mimetype : null;

        console.log('Parsed audioData length:', audioData ? audioData.length : 'null');
        console.log('Parsed audioMimeType:', audioMimeType);

        const newScene = new Scene({
            userId, 
            youtubeLink,
            youtubeTitle,
            startTimecode: parseFloat(startTimecode || 0),
            endTimecode: parseFloat(endTimecode || 0),
            transcript: transcript || '',
            audioData,
            audioMimeType
        });

        console.log('New Scene object before saving:', newScene);

        await newScene.save(); 
        console.log('Scene saved successfully to DB. Scene ID:', newScene._id);

        res.status(201).json({ message: 'Scene created successfully', sceneId: newScene._id });

    } catch (error) {
        console.error('--- Error creating scene (500 Server Error) ---');
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);

        if (error.name === 'ValidationError') {
            console.error('Mongoose Validation Error details:', error.errors);
            return res.status(400).json({ message: 'Validation failed', errors: error.errors });
        }
        if (error.name === 'MongoNetworkError') {
            console.error('MongoDB Network Error: Check if MongoDB is running and accessible.');
            return res.status(500).json({ message: 'Database connection error.' });
        }
        res.status(500).json({ message: 'Server error during scene creation.' });
    }
});

// --- GET /api/scenes/:id ---

router.get('/:id', authMiddleware, async (req, res) => {
    try {
        console.log('Received GET /api/scenes/:id request for ID:', req.params.id);
        const { id } = req.params;
        const userId = req.user && req.user.id ? req.user.id : null;
        console.log('User ID from token for GET:', userId);

        const scene = await Scene.findById(id);

        if (!scene) {
            console.log('Scene not found for ID:', id);
            return res.status(404).json({ message: 'Scene not found' });
        }

        console.log('Found scene. isPublic:', scene.isPublic, 'Scene userId:', scene.userId);


        if (scene.isPublic) {
            console.log('Scene is public, allowing access.');
            return res.status(200).json(scene);
        }

        if (!userId || scene.userId.toString() !== userId.toString()) {
            console.warn('Access denied: User ID mismatch or not authenticated.');
            return res.status(403).json({ message: 'Forbidden: You do not have access to this scene' });
        }

        console.log('Access granted for owner.');
        res.status(200).json(scene);

    } catch (error) {
        console.error('--- Error fetching scene (500 Server Error) ---');
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        if (error.name === 'CastError') {
            console.error('CastError: Invalid scene ID format.');
            return res.status(400).json({ message: 'Invalid scene ID' });
        }
        res.status(500).json({ message: 'Server error during scene fetch.' });
    }
});

// --- PUT /api/scenes/:id ---

router.put('/:id', authMiddleware, upload.single('audioFile'), async (req, res) => {
    try {
        console.log('Received PUT /api/scenes/:id request for ID:', req.params.id);
        console.log('Request body:', req.body);
        console.log('Request file (audioFile):', req.file);

        const { id } = req.params;
        const userId = req.user && req.user.id ? req.user.id : null;
        console.log('User ID from token for PUT:', userId);

        if (!userId) {
            console.error('Error: User ID not found in token for PUT request.');
            return res.status(401).json({ message: 'Unauthorized: User ID missing.' });
        }

        const { youtubeLink, startTimecode, endTimecode, transcript, isPublic, clearAudio } = req.body;

        const scene = await Scene.findById(id);

        if (!scene) {
            console.log('Scene not found for ID:', id);
            return res.status(404).json({ message: 'Scene not found' });
        }

        console.log('Found scene. Owner ID:', scene.userId);

        if (scene.userId.toString() !== userId.toString()) {
            console.warn('Access denied: User ID mismatch for PUT request.');
            return res.status(403).json({ message: 'Forbidden: You are not the owner of this scene' });
        }

        if (youtubeLink !== undefined) scene.youtubeLink = youtubeLink;
        if (startTimecode !== undefined) scene.startTimecode = parseFloat(startTimecode);
        if (endTimecode !== undefined) scene.endTimecode = parseFloat(endTimecode);
        if (transcript !== undefined) scene.transcript = transcript;


        if (isPublic !== undefined) scene.isPublic = isPublic === 'true';


        if (req.file) {
            scene.audioData = req.file.buffer;
            scene.audioMimeType = req.file.mimetype;
            console.log('New audio file received and set.');
        } else if (clearAudio === 'true') { 
            scene.audioData = undefined;
            scene.audioMimeType = undefined; 
            console.log('Audio data cleared.');
        }

        console.log('Scene object before updating:', scene);
        await scene.save(); 
        console.log('Scene updated successfully to DB.');

        res.status(200).json({ message: 'Scene updated successfully', scene });

    } catch (error) {
        console.error('--- Error updating scene (500 Server Error) ---');
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        if (error.name === 'CastError') {
            console.error('CastError: Invalid scene ID format for PUT request.');
            return res.status(400).json({ message: 'Invalid scene ID' });
        }
        res.status(500).json({ message: 'Server error during scene update.' });
    }
});

// --- GET /api/scenes ---

router.get('/', authMiddleware, async (req, res) => {
    try {
        console.log('Received GET /api/scenes request.');
        const userId = req.user && req.user.id ? req.user.id : null;
        console.log('User ID from token for GET ALL:', userId);

        const scenes = await Scene.find({
            $or: [
                { isPublic: true },
                { userId }
            ]
        }).sort({ createdAt: -1 });

        console.log(`Found ${scenes.length} scenes matching criteria.`);
        res.status(200).json(scenes);

    } catch (error) {
        console.error('--- Error fetching all scenes (500 Server Error) ---');
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        res.status(500).json({ message: 'Server error during scene list fetch.' });
    }
});

// --- DELETE /api/scenes/:id ---

router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        console.log('Received DELETE /api/scenes/:id request for ID:', req.params.id);
        const { id } = req.params;
        const userId = req.user && req.user.id ? req.user.id : null;

        if (!userId) {
            console.error('Error: User ID not found in token for DELETE request.');
            return res.status(401).json({ message: 'Unauthorized: User ID missing.' });
        }

        const scene = await Scene.findById(id);

        if (!scene) {
            console.log('Scene not found for ID:', id);
            return res.status(404).json({ message: 'Scene not found' });
        }

        if (scene.userId.toString() !== userId.toString()) {
            console.warn('Access denied: User ID mismatch for DELETE request.');
            return res.status(403).json({ message: 'Forbidden: You are not the owner of this scene' });
        }

        await Scene.findByIdAndDelete(id);
        console.log('Scene deleted successfully with ID:', id);

        res.status(200).json({ message: 'Scene deleted successfully' });

    } catch (error) {
        console.error('--- Error deleting scene (500 Server Error) ---');
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);

        if (error.name === 'CastError') {
            console.error('CastError: Invalid scene ID format for DELETE request.');
            return res.status(400).json({ message: 'Invalid scene ID' });
        }

        res.status(500).json({ message: 'Server error during scene deletion.' });
    }
});


module.exports = router;
