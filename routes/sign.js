const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Document = require('../models/Document');
const { createSignature, generateKeyPair } = require('../utils/signature');
const { PDFDocument } = require('pdf-lib');

// Sign document
router.post('/:id/sign', async (req, res) => {
  try {
    const { signerEmail, signatureData, x, y } = req.body;

    if (!signerEmail || !signatureData) {
      return res.status(400).json({ error: 'Signer email and signature required' });
    }

    const document = await Document.findById(req.params.id);
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Generate keypair for this signature
    const { privateKey, publicKey } = generateKeyPair();

    // Create signature data to sign
    const dataToSign = JSON.stringify({
      documentId: document._id,
      signerEmail: signerEmail,
      timestamp: new Date().toISOString(),
      filename: document.filename
    });

    // Create cryptographic signature
    const { hash, signature } = createSignature(dataToSign, privateKey);

    // Get original PDF from GridFS
    const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
      bucketName: 'uploads'
    });

    const chunks = [];
    const downloadStream = bucket.openDownloadStream(document.fileId);

    downloadStream.on('data', (chunk) => chunks.push(chunk));
    
    await new Promise((resolve, reject) => {
      downloadStream.on('end', resolve);
      downloadStream.on('error', reject);
    });

    const pdfBuffer = Buffer.concat(chunks);
    
    // Load PDF with pdf-lib
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];

    // Add signature text to PDF
    firstPage.drawText(`Signed by: ${signerEmail}`, {
      x: x || 50,
      y: y || 50,
      size: 10
    });

    firstPage.drawText(`Signature Hash: ${hash.substring(0, 20)}...`, {
      x: x || 50,
      y: (y || 50) - 15,
      size: 8
    });

    // Save modified PDF
    const signedPdfBytes = await pdfDoc.save();
    
    // Upload signed PDF to GridFS
    const uploadStream = bucket.openUploadStream(`signed-${document.filename}`);
    uploadStream.end(signedPdfBytes);

    await new Promise((resolve, reject) => {
      uploadStream.on('finish', resolve);
      uploadStream.on('error', reject);
    });

    // Save signature metadata
    document.signatures.push({
      signerEmail: signerEmail,
      signatureHash: hash,
      timestamp: new Date(),
      signatureData: signatureData,
      x: x || 50,
      y: y || 50
    });
    document.status = 'signed';
    document.signedFileId = uploadStream.id;
    await document.save();

    res.json({
      message: 'Document signed successfully',
      signature: {
        hash: hash,
        signerEmail: signerEmail,
        timestamp: new Date(),
        publicKey: publicKey
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
