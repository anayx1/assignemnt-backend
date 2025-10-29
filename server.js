// // server.js
// const express = require('express');
// const cors = require('cors');
// const connectDB = require('./config/database');
// require('dotenv').config();

// const app = express();

// // Middleware
// app.use(cors());
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// // Connect to database
// connectDB();

// // Routes
// app.use('/api/auth', require('./routes/auth'));
// app.use('/api/docs', require('./routes/upload'));
// app.use('/api/docs', require('./routes/sign'));
// app.use('/api/sign', require('./routes/publicSign'));
// app.use('/api/docs', require('./routes/download'));
// app.use('/api/docs', require('./routes/link'));
// app.use('/api/verify', require('./routes/verify'));

// // Health check
// app.get('/', (req, res) => {
//   res.json({ message: 'E-Signature API is running' });
// });

// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });

// // What this does:
// // - Sets up Express server with CORS and JSON parsing
// // - Connects to MongoDB database
// // - Registers all API routes for auth, document upload, signing, and verification
// // - Starts server on specified port


const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

connectDB();

app.use('/api/auth', require('./routes/auth'));
app.use('/api/docs', require('./routes/upload'));
app.use('/api/docs', require('./routes/sign'));
app.use('/api/sign', require('./routes/publicSign'));
app.use('/api/docs', require('./routes/download'));
app.use('/api/docs', require('./routes/link'));
app.use('/api/verify', require('./routes/verify'));

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'E-Signature API is running' });
});

if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
