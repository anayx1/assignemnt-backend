const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

connectDB();



app.use('/api/sign', require('./routes/publicSign'));

app.use('/api/auth', require('./routes/auth'));

app.use('/api/docs', require('./routes/upload'));
app.use('/api/docs', require('./routes/sign'));
app.use('/api/docs', require('./routes/download'));
app.use('/api/docs', require('./routes/link'));

app.use('/api/verify', require('./routes/verify'));

app.get('/', (req, res) => {
  res.json({ message: 'E-Signature API is running' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
