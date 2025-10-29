const express = require('express');
const router = express.Router();
const Document = require('../models/Document');
const auth = require('../middleware/auth');

router.get('/:id/link', auth, async (req, res) => {
  try {
    const document = await Document.findOne({ 
      _id: req.params.id, 
      userId: req.userId 
    });

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    res.json({
      signLink: document.signLink,
      fullUrl: `${req.protocol}://${req.get('host')}/sign/${document.signLink}`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
