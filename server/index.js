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

app.use(cors());
app.use(express.json());

const upload = multer({ dest: 'temp/' }); // temporary local folder

// In-memory store: videoId -> { url, createdAt }
const videoStore = {};

// Upload route
app.post('/upload', upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const videoId = nanoid();
    const result = await cloudinary.uploader.upload(req.file.path, {
      resource_type: 'video',
      public_id: videoId,
      folder: 'clipbin'
    });

    fs.unlinkSync(req.file.path); // clean up temp file

    const createdAt = new Date();
    videoStore[videoId] = {
      url: result.secure_url,
      createdAt
    };

    const shareUrl = `https://clip-bin.vercel.app/watch/${videoId}`;
    res.json({ success: true, videoId, shareUrl });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Upload failed' });
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

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
