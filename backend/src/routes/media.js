const express = require('express');
const router = express.Router();
const multer = require('multer');

// Use Cloudinary v2
const cloudinary = require('cloudinary').v2;
const dotenv = require('dotenv');
dotenv.config({ path: require('path').join(__dirname, '..', '..', '.env') });

try {
  if (process.env.CLOUDINARY_URL) {
    cloudinary.config({ cloudinary_url: process.env.CLOUDINARY_URL });
  }
} catch (e) {
  console.warn('Cloudinary config failed to load from CLOUDINARY_URL');
}

const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// POST /api/media/upload - multipart/form-data file field 'file'
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

    if (!process.env.CLOUDINARY_URL) {
      // Fallback: save to local uploads folder
      const fs = require('fs');
      const path = require('path');
      const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
      if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
      const filename = `upload_${Date.now()}_${req.file.originalname}`.replace(/\s+/g, '_');
      const outPath = path.join(uploadsDir, filename);
      fs.writeFileSync(outPath, req.file.buffer);
      const url = `${req.protocol}://${req.get('host')}/api/uploads/${filename}`;
      return res.json({ success: true, url, provider: 'local' });
    }

    const uploadStream = cloudinary.uploader.upload_stream({ folder: 'ctas/uploads' }, (error, result) => {
      if (error) {
        console.error('Cloudinary upload error:', error);
        return res.status(500).json({ success: false, message: 'Cloudinary upload failed', error });
      }
      res.json({ success: true, url: result.secure_url, provider: 'cloudinary', raw: result });
    });

    uploadStream.end(req.file.buffer);
  } catch (error) {
    console.error('Upload endpoint error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
