const express = require('express');
const router = express.Router();
const Document = require('../models/Document');
const { verifySignature } = require('../utils/signature');

router.post('/:documentId', async (req, res) => {
  try {
    const { signatureHash, publicKey } = req.body;

    if (!signatureHash) {
      return res.status(400).json({ error: 'Signature hash required' });
    }

    const document = await Document.findById(req.params.documentId);
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Find signature by hash
    const signature = document.signatures.find(
      sig => sig.signatureHash === signatureHash
    );

    if (!signature) {
      return res.status(404).json({ error: 'Signature not found' });
    }
    res.json({
      verified: true,
      signature: {
        signerEmail: signature.signerEmail,
        timestamp: signature.timestamp,
        hash: signature.signatureHash
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
