/**
 * ============================================================================
 * File: server.js
 * Track: Track 01 - Infrastructure & Core Setup
 * Owner: Ahmed Ibrahim Mossa (Team Leader)
 * Description: Application entry point responsible for loading environment
 *              variables, establishing MongoDB Atlas connection via connectDB(),
 *              starting the HTTP server only after connection succeeds, and
 *              handling graceful shutdown and fatal process errors.
 * ============================================================================
 */

import 'dotenv/config';
import connectDB from './config/db.js';
import app from './index.js';

const parsedPort = Number(process.env.PORT);
const PORT =
  Number.isInteger(parsedPort) && parsedPort > 0 ? parsedPort : 5000;
const ENV = process.env.NODE_ENV || 'development';
const SHUTDOWN_TIMEOUT_MS = 10000;

let httpServer = null;
let isShuttingDown = false;

/**
 * Gracefully closes the HTTP server before terminating the Node.js process.
 * @param {number} exitCode
 * @param {string} reason
 * @param {unknown} [err]
 */
const shutdown = (exitCode, reason, err) => {
  if (isShuttingDown) return;
  isShuttingDown = true;

  if (err !== undefined) {
    console.error(`${reason}:`, err);
  } else {
    console.log(`${reason}`);
  }

  if (!httpServer) {
    process.exit(exitCode);
    return;
  }

  const forceExitTimer = setTimeout(() => {
    console.error('Forced shutdown after graceful timeout elapsed.');
    process.exit(exitCode);
  }, SHUTDOWN_TIMEOUT_MS);

  forceExitTimer.unref();

  httpServer.close((closeErr) => {
    clearTimeout(forceExitTimer);
    if (closeErr) {
      console.error('Error while closing HTTP server:', closeErr);
    }
    process.exit(exitCode);
  });
};

process.on('uncaughtException', (err) => {
  shutdown(1, 'UNCAUGHT EXCEPTION - Shutting down', err);
});

process.on('unhandledRejection', (reason) => {
  shutdown(1, 'UNHANDLED REJECTION - Shutting down', reason);
});

process.on('SIGTERM', () => {
  shutdown(0, 'SIGTERM received - Shutting down gracefully');
});

process.on('SIGINT', () => {
  shutdown(0, 'SIGINT received - Shutting down gracefully');
});

/**
 * Connects to the database first, then binds the HTTP server to PORT.
 * @returns {Promise<import('http').Server>}
 */
const startServer = async () => {
  await connectDB();

  const server = app.listen(PORT, () => {
    console.log(`Server running in ${ENV} mode on port ${PORT}`);
  });

  server.on('error', (err) => {
    shutdown(1, `HTTP Server Error: ${err.message}`, err);
  });

  return server;
};

startServer()
  .then((server) => {
    httpServer = server;
  })
  .catch((error) => {
    shutdown(1, 'Failed to start server', error);
  });