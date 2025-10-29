const express = require('express');
const cors = require('cors');
const connectDB = require('../config/database');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

connectDB();

app.use('/api/auth', require('../routes/auth'));
app.use('/api/docs', require('../routes/upload'));
app.use('/api/docs', require('../routes/sign'));
app.use('/api/sign', require('../routes/publicSign'));
app.use('/api/docs', require('../routes/download'));
app.use('/api/docs', require('../routes/link'));
app.use('/api/verify', require('../routes/verify'));

app.get('/', (req, res) => {
    res.json({ message: 'E-Signature API is running' });
});

module.exports = app;
