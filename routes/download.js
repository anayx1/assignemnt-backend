const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Document = require('../models/Document');
const auth = require('../middleware/auth');

router.get('/:id/download', auth, async (req, res) => {
  try {
    const document = await Document.findOne({ 
      _id: req.params.id, 
      userId: req.userId 
    });

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
      bucketName: 'uploads'
    });

    const downloadStream = bucket.openDownloadStream(document.fileId);
    
    res.set('Content-Type', 'application/pdf');
    res.set('Content-Disposition', `attachment; filename="${document.filename}"`);
    
    downloadStream.pipe(res);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id/download-signed', auth, async (req, res) => {
  try {
    const document = await Document.findOne({ 
      _id: req.params.id, 
      userId: req.userId 
    });

    if (!document || !document.signedFileId) {
      return res.status(404).json({ error: 'Signed document not found' });
    }

    const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
      bucketName: 'uploads'
    });

    const downloadStream = bucket.openDownloadStream(document.signedFileId);
    
    res.set('Content-Type', 'application/pdf');
    res.set('Content-Disposition', `attachment; filename="signed-${document.filename}"`);
    
    downloadStream.pipe(res);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

