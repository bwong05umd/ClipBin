const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const { nanoid } = require('nanoid');
const fs = require('fs');
const cloudinary = require('./cloudinary');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: ['https://clip-bin.vercel.app', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json());

// Ensure temp directory exists
const tempDir = path.join(__dirname, 'temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir);
}

// Configure multer for temporary file storage
const upload = multer({ dest: tempDir });

// In-memory store: videoId -> { url, createdAt }
const videoStore = {};

// Health check route for Render
app.get('/', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Upload route
app.post('/upload', upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Validate Cloudinary configuration
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      throw new Error('Cloudinary configuration missing');
    }

    const videoId = nanoid();
    const result = await cloudinary.uploader.upload(req.file.path, {
      resource_type: 'video',
      public_id: videoId,
      folder: 'clipbin'
    });

    // Clean up temp file
    fs.unlink(req.file.path, (err) => {
      if (err) console.error('Error deleting temp file:', err);
    });

    const createdAt = new Date();
    videoStore[videoId] = {
      url: result.secure_url,
      createdAt
    };

    const shareUrl = `${process.env.FRONTEND_URL || 'https://clip-bin.vercel.app'}/watch/${videoId}`;
    res.json({ success: true, videoId, shareUrl });
  } catch (error) {
    console.error('Upload error:', error);
    
    // Clean up temp file if it exists
    if (req.file && req.file.path) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Error deleting temp file:', err);
      });
    }

    if (error.message === 'Cloudinary configuration missing') {
      return res.status(500).json({ error: 'Server configuration error' });
    }
    
    res.status(500).json({ error: 'Upload failed. Please try again.' });
  }
});

// Watch route
app.get('/watch/:id', (req, res) => {
  const { id } = req.params;
  const video = videoStore[id];

  if (!video) {
    return res.status(404).json({ error: 'Video not found' });
  }

  const now = Date.now();
  const ageMs = now - new Date(video.createdAt).getTime();
  const expired = ageMs > 24 * 60 * 60 * 1000;

  if (expired) {
    return res.status(403).json({ error: 'This video link has expired' });
  }

  // Redirect to Cloudinary-hosted video
  res.redirect(video.url);
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something broke!' });
});

// Start server
app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${port}/`);
  
  // Validate environment variables
  const requiredEnvVars = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.warn(`⚠️  Missing environment variables: ${missingVars.join(', ')}`);
  } else {
    console.log('✅ All required environment variables are set');
  }
});
