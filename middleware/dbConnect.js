const connectDB = require('../config/database');

// Middleware to ensure DB connection before each request
const ensureDBConnection = async (req, res, next) => {
    try {
        await connectDB();
        next();
    } catch (error) {
        console.error('Database connection failed:', error);
        res.status(500).json({
            error: 'Database connection failed',
            details: error.message
        });
    }
};

module.exports = ensureDBConnection;
