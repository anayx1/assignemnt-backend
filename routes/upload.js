const express = require('express');
const router = express.Router();
const multer = require('multer');
const mongoose = require('mongoose');
const crypto = require('crypto');
const auth = require('../middleware/auth');
const Document = require('../models/Document');
const { MAX_FILE_SIZE, ALLOWED_FILE_TYPES } = require('../config/constants');
require('dotenv').config();

// Use memory storage instead of GridFsStorage
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_FILE_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  }
});

// Initialize GridFSBucket
let bucket;
mongoose.connection.on('connected', () => {
  bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
    bucketName: 'uploads'
  });
});

// Upload document
router.post('/upload', auth, upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Generate unique filename
    const filename = crypto.randomBytes(16).toString('hex') + '-' + req.file.originalname;
    const signLink = crypto.randomBytes(16).toString('hex');

    // Create upload stream to GridFS
    const uploadStream = bucket.openUploadStream(filename, {
      contentType: req.file.mimetype,
      metadata: {
        originalName: req.file.originalname,
        uploadedBy: req.userId,
        uploadDate: new Date()
      }
    });

    // Write buffer to GridFS
    uploadStream.end(req.file.buffer);

    uploadStream.on('finish', async () => {
      try {
        // Create document record
        const document = new Document({
          userId: req.userId,
          filename: req.file.originalname,
          fileId: uploadStream.id,
          originalSize: req.file.size,
          signLink: signLink,
          signatureMarkers: []
        });

        await document.save();

        res.status(201).json({
          message: 'Document uploaded successfully',
          document: {
            id: document._id,
            filename: document.filename,
            signLink: `/sign/${signLink}`,
            createdAt: document.createdAt
          }
        });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    uploadStream.on('error', (error) => {
      res.status(500).json({ error: error.message });
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/', auth, async (req, res) => {
  try {
    const documents = await Document.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .select('-__v');

    res.json({ documents });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    res.json({ document });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/markers', auth, async (req, res) => {
  try {
    const { markers } = req.body;

    const document = await Document.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    document.signatureMarkers = markers;
    await document.save();

    res.json({ message: 'Markers added successfully', document });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
