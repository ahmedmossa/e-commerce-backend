/**
 * ============================================================================
 * File: config/db.js
 * Track: Track 01 - Infrastructure & Core Setup
 * Owner: Ahmed Ibrahim Mossa (Team Leader)
 * Description: MongoDB Atlas connection module using Mongoose ODM with
 *              connection lifecycle event logging, safe error propagation to
 *              the server entry point, and clean disconnect support.
 * ============================================================================
 */

import mongoose from 'mongoose';

let listenersRegistered = false;

/**
 * Registers Mongoose connection lifecycle event listeners once.
 */
const registerConnectionEvents = () => {
  if (listenersRegistered) return;
  listenersRegistered = true;

  mongoose.connection.on('error', (err) => {
    console.error('MongoDB Connection Event Error:', err);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('MongoDB disconnected.');
  });

  mongoose.connection.on('reconnected', () => {
    console.log('MongoDB reconnected.');
  });

  mongoose.connection.on('close', () => {
    console.log('MongoDB connection closed.');
  });
};

/**
 * Connects to MongoDB using the MONGO_URI environment variable.
 * Throws a descriptive error on failure so the caller (e.g., server.js)
 * can execute graceful shutdown and exit cleanly.
 * @returns {Promise<import('mongoose').Mongoose>}
 */
const connectDB = async () => {
  const uri = process.env.MONGO_URI;

  if (!uri || typeof uri !== 'string' || !uri.trim()) {
    throw new Error('Database Connection Error: MONGO_URI is not defined.');
  }

  registerConnectionEvents();

  try {
    const conn = await mongoose.connect(uri.trim());
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error('Database Connection Error:', error);
    throw error;
  }
};

/**
 * Closes the active Mongoose connection cleanly when needed (e.g., tests/shutdown).
 * @returns {Promise<void>}
 */
export const disconnectDB = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
};

export default connectDB;
