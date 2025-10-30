// routes/download.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { PDFDocument } = require('pdf-lib'); // Add this
const Document = require('../models/Document');
const auth = require('../middleware/auth');

// Download original PDF
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

// Download signed PDF - GENERATES IT DYNAMICALLY
router.get('/:id/download-signed', auth, async (req, res) => {
  try {
    const document = await Document.findOne({ 
      _id: req.params.id, 
      userId: req.userId 
    });

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Check if document has signatures
    if (!document.signatures || document.signatures.length === 0) {
      return res.status(404).json({ error: 'Document has not been signed yet' });
    }

    const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
      bucketName: 'uploads'
    });

    // Get original PDF from GridFS
    const chunks = [];
    const downloadStream = bucket.openDownloadStream(document.fileId);

    downloadStream.on('data', (chunk) => chunks.push(chunk));

    downloadStream.on('end', async () => {
      try {
        const pdfBuffer = Buffer.concat(chunks);
        
        // Load PDF with pdf-lib
        const pdfDoc = await PDFDocument.load(pdfBuffer);
        const pages = pdfDoc.getPages();

        // Add each signature to the PDF
        for (const signature of document.signatures) {
          const pageIndex = (signature.page || 1) - 1;
          
          if (pageIndex >= 0 && pageIndex < pages.length) {
            const page = pages[pageIndex];
            const { width, height } = page.getSize();

            // Extract base64 image data
            const base64Data = signature.signatureData.split(',')[1];
            const imageBytes = Buffer.from(base64Data, 'base64');

            // Embed image
            let image;
            try {
              if (signature.signatureData.includes('image/png')) {
                image = await pdfDoc.embedPng(imageBytes);
              } else {
                image = await pdfDoc.embedJpg(imageBytes);
              }

              // Calculate position (convert percentage to pixels)
              // PDF coordinates start from bottom-left, so we need to flip Y
              const x = (signature.x / 100) * width;
              const y = height - ((signature.y / 100) * height) - 60; // Subtract signature height

              // Draw signature
              page.drawImage(image, {
                x: x - 75, // Center horizontally (150px width / 2)
                y: y,
                width: 150,
                height: 60,
              });
            } catch (err) {
              console.error('Error embedding signature:', err);
              // Continue with other signatures even if one fails
            }
          }
        }

        // Generate the signed PDF
        const signedPdfBytes = await pdfDoc.save();

        // Send as download
        res.set('Content-Type', 'application/pdf');
        res.set('Content-Disposition', `attachment; filename="signed-${document.filename}"`);
        res.send(Buffer.from(signedPdfBytes));

      } catch (err) {
        console.error('Error processing PDF:', err);
        res.status(500).json({ error: 'Failed to generate signed PDF: ' + err.message });
      }
    });

    downloadStream.on('error', (error) => {
      console.error('Download stream error:', error);
      res.status(404).json({ error: 'Original PDF not found' });
    });

  } catch (error) {
    console.error('Error downloading signed document:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
