const mongoose = require('mongoose');

// Cache the connection to avoid creating multiple connections
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

const connectDB = async () => {
  // Return cached connection if it exists
  if (cached.conn) {
    console.log('Using cached MongoDB connection');
    return cached.conn;
  }

  // If no cached promise, create a new connection
  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 10,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    };

    cached.promise = mongoose
      .connect(process.env.MONGO_URI, opts)
      .then((mongoose) => {
        console.log('MongoDB connected successfully');
        return mongoose;
      })
      .catch((error) => {
        cached.promise = null; // Reset promise on error
        console.error('MongoDB connection error:', error.message);
        throw error; // Throw error instead of process.exit()
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    throw error; // Don't use process.exit() in serverless!
  }

  return cached.conn;
};

module.exports = connectDB;
