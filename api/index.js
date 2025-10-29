const express = require('express');
const cors = require('cors');
const ensureDBConnection = require('../middleware/dbConnect');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Apply DB connection middleware to all routes
app.use(ensureDBConnection);

// Routes (will only run AFTER DB connection is established)
app.use('/api/auth', require('../routes/auth'));
app.use('/api/docs', require('../routes/upload'));
app.use('/api/docs', require('../routes/sign'));
app.use('/api/sign', require('../routes/publicSign'));
app.use('/api/docs', require('../routes/download'));
app.use('/api/docs', require('../routes/link'));
app.use('/api/verify', require('../routes/verify'));

// Health check
app.get('/api', (req, res) => {
    res.json({
        message: 'E-Signature API is running',
        status: 'ok',
        db: 'connected'
    });
});

module.exports = app;
