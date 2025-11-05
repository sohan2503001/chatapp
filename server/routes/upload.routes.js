import express from 'express';
import upload from '../middleware/multer.js'; // Our Multer config
import cloudinary from '../cloudinary.js';    // Our Cloudinary config
import sharp from 'sharp';
import streamifier from 'streamifier';
import { protectRoute } from '../middleware/protectRoute.js';

const router = express.Router();

// A helper function to upload a buffer to Cloudinary
const uploadToCloudinary = (buffer, options) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) {
        return reject(error);
      }
      resolve(result);
    });
    // Use streamifier to read the buffer
    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
};

// Route to handle file uploads
// 'file' must match the name in our frontend form data
router.post('/', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }

  try {
    let fileType = req.file.mimetype.split('/')[0]; // 'image', 'video', 'audio'
    let originalUrl, thumbnailUrl;

    // --- If it's an image ---
    if (fileType === 'image') {
      // 1. Upload the original, full-size image
      const originalResult = await uploadToCloudinary(req.file.buffer, {
        folder: 'chat_app/images', // Folder in Cloudinary
      });
      originalUrl = originalResult.secure_url;

      // 2. Create and upload a thumbnail using Sharp
      const thumbnailBuffer = await sharp(req.file.buffer)
        .resize({ width: 150, height: 150, fit: 'cover' })
        .toBuffer();
      
      const thumbnailResult = await uploadToCloudinary(thumbnailBuffer, {
        folder: 'chat_app/thumbnails',
      });
      thumbnailUrl = thumbnailResult.secure_url;

      return res.status(200).json({
        fileType: 'image',
        url: originalUrl,
        thumbnailUrl: thumbnailUrl,
      });
    }

    // --- If it's video or audio ---
    if (fileType === 'video' || fileType === 'audio') {
      // 1. Upload the original file
      const result = await uploadToCloudinary(req.file.buffer, {
        resource_type: 'video', // 'video' resource type handles both
        folder: 'chat_app/media',
      });
      originalUrl = result.secure_url;
      
      return res.status(200).json({
        fileType: fileType,
        url: originalUrl,
      });
    }
    
    // If it's not an image, video, or audio
    res.status(400).json({ error: 'Unsupported file type.' });

  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ error: 'File upload failed.' });
  }
});

export default router;