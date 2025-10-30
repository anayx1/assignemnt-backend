const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Document = require('../models/Document');

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
        signatures: document.signatures,
        status: document.status
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

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

router.post('/:signLink/sign', async (req, res) => {
  try {
    const { signerEmail, signatureData, x, y, page } = req.body;

    console.log('Sign request received:', { signerEmail, x, y, page });

    if (!signerEmail || !signatureData) {
      return res.status(400).json({ error: 'Signer email and signature data are required' });
    }

    const document = await Document.findOne({ 
      signLink: req.params.signLink 
    });

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const signature = {
      signerEmail,
      signatureData,
      x: x || 10,
      y: y || 10,
      page: page || 1,
      timestamp: new Date(),
    };

    document.signatures.push(signature);

    const requiredSignatures = document.signatureMarkers?.length || 1;
    if (document.signatures.length >= requiredSignatures) {
      document.status = 'signed';
    }

    await document.save();

    console.log('Signature saved successfully');

    res.json({ 
      message: 'Document signed successfully',
      document: {
        id: document._id,
        status: document.status,
        signatures: document.signatures
      }
    });
  } catch (error) {
    console.error('Error signing document:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
