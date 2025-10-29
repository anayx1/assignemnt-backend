const mongoose = require('mongoose');

const SignatureSchema = new mongoose.Schema({
  signerEmail: String,
  signatureHash: String,
  timestamp: { type: Date, default: Date.now },
  signatureData: String, // Base64 signature image or text
  x: Number,
  y: Number
});

const DocumentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  filename: {
    type: String,
    required: true
  },
  fileId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  originalSize: Number,
  signatureMarkers: [{
    x: Number,
    y: Number,
    page: Number
  }],
  signatures: [SignatureSchema],
  signLink: {
    type: String,
    unique: true
  },
  status: {
    type: String,
    enum: ['pending', 'signed'],
    default: 'pending'
  },
  signedFileId: mongoose.Schema.Types.ObjectId,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Document', DocumentSchema);

