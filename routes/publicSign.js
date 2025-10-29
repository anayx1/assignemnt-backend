const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Document = require('../models/Document');

// Get document by sign link (existing route)
router.get('/:signLink', async (req, res) => {
  try {
    const document = await Document.findOne({ 
      signLink: req.params.signLink 
    }).select('-userId -__v');

    if (!document) {
      return res.status(404).json({ error: 'Document not found or link expired' });
    }

    res.json({ 
      document: {
        id: document._id,
        filename: document.filename,
        signatureMarkers: document.signatureMarkers,
        status: document.status
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ADD THIS NEW ROUTE - Download PDF for public signing (no auth required)
router.get('/:signLink/download', async (req, res) => {
  try {
    const document = await Document.findOne({ 
      signLink: req.params.signLink 
    });

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
      bucketName: 'uploads'
    });

    const downloadStream = bucket.openDownloadStream(document.fileId);
    
    res.set('Content-Type', 'application/pdf');
    res.set('Content-Disposition', `inline; filename="${document.filename}"`);
    
    downloadStream.pipe(res);
    
    downloadStream.on('error', (error) => {
      console.error('Download stream error:', error);
      res.status(404).json({ error: 'File not found' });
    });
  } catch (error) {
    console.error('Error downloading document:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
