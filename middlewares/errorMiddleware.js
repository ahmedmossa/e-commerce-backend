/**
 * ============================================================================
 * File: middlewares/errorMiddleware.js
 * Track: Track 01 - Infrastructure & Core Setup
 * Owner: Ahmed Ibrahim Mossa (Team Leader)
 * Description: Centralized Express error-handling middleware for ESM
 *              architecture with environment-aware sanitization, non-mutating
 *              error normalization, JSON parse error handling, and MongoDB /
 *              Mongoose / Multer error handling.
 * ============================================================================
 */

import ApiError from '../utils/apiError.js';

/**
 * Normalizes malformed JSON payload errors thrown by Express body parsers.
 * @returns {ApiError}
 */
const handleJsonParseError = () => new ApiError('Invalid JSON format', 400);

/**
 * Normalizes Mongoose CastError (invalid ObjectId or type casting failure)
 * without exposing raw user input values.
 * @param {object} err
 * @returns {ApiError}
 */
const handleCastErrorDB = (err) => {
  const field = typeof err?.path === 'string' && err.path ? err.path : 'parameter';
  return new ApiError(`Invalid ${field} value`, 400);
};

/**
 * Normalizes MongoDB duplicate key errors (code 11000) into HTTP 409 conflicts.
 * @param {object} err
 * @returns {ApiError}
 */
const handleDuplicateFieldsDB = (err) => {
  const keyValue =
    err?.keyValue && typeof err.keyValue === 'object' ? err.keyValue : null;
  const duplicateField = keyValue ? Object.keys(keyValue)[0] || 'field' : 'field';
  return new ApiError(`Duplicate value for ${duplicateField}`, 409);
};

/**
 * Normalizes Mongoose schema validation errors into HTTP 400 responses.
 * @param {object} err
 * @returns {ApiError}
 */
const handleValidationErrorDB = (err) => {
  const messages = Object.values(err?.errors || {})
    .map((fieldErr) => fieldErr?.message)
    .filter((msg) => typeof msg === 'string' && msg.trim().length > 0);

  const message = messages.length
    ? `Validation failed: ${messages.join(', ')}`
    : 'Invalid input data';

  return new ApiError(message, 400);
};

/**
 * Normalizes Multer file upload errors into HTTP 400 client errors.
 * @param {object} err
 * @returns {ApiError}
 */
const handleMulterError = (err) => {
  if (err?.code === 'LIMIT_FILE_SIZE') {
    return new ApiError('Uploaded file exceeds maximum allowed size', 400);
  }
  const message =
    typeof err?.message === 'string' && err.message.trim()
      ? err.message
      : 'File upload error';
  return new ApiError(message, 400);
};

/**
 * Normalizes known external/driver errors into operational ApiError instances
 * without mutating the original error object.
 * @param {unknown} err
 * @returns {object}
 */
const normalizeError = (err) => {
  if (!err || typeof err !== 'object') {
    const fallbackMessage =
      typeof err === 'string' && err.trim() ? err : 'Internal Server Error';
    return new ApiError(fallbackMessage, 500);
  }

  // 1. Invalid JSON body sent with Content-Type: application/json
  if (err.type === 'entity.parse.failed') {
    return handleJsonParseError();
  }

  // 2. Mongoose invalid ObjectId / type casting error
  if (err.name === 'CastError') {
    return handleCastErrorDB(err);
  }

  // 3. MongoDB duplicate key error (unique index violation)
  if (err.code === 11000) {
    return handleDuplicateFieldsDB(err);
  }

  // 4. Mongoose schema validation error
  if (err.name === 'ValidationError') {
    return handleValidationErrorDB(err);
  }

  // 5. Multer file upload error (size limit, unexpected field, etc.)
  if (err.name === 'MulterError') {
    return handleMulterError(err);
  }

  return err;
};

/**
 * Resolves valid HTTP status code and JSend-compatible status label safely.
 * @param {object} err
 * @returns {{ statusCode: number, status: 'fail' | 'error' | string }}
 */
const resolveHttpMeta = (err) => {
  const candidateCode =
    err?.statusCode ?? (typeof err?.status === 'number' ? err.status : undefined);
  const numericCode = Number(candidateCode);

  const statusCode =
    Number.isInteger(numericCode) && numericCode >= 100 && numericCode <= 599
      ? numericCode
      : 500;

  const hasValidStatusString =
    typeof err?.status === 'string' &&
    err.status.trim().length > 0 &&
    !/^\d+$/.test(err.status.trim());

  const status = hasValidStatusString
    ? err.status.trim()
    : `${statusCode}`.startsWith('4')
      ? 'fail'
      : 'error';

  return { statusCode, status };
};

/**
 * Sends detailed debugging output in development while preserving the original
 * error stack trace from the point of origin.
 * @param {unknown} originalErr
 * @param {object} handledError
 * @param {{ statusCode: number, status: string }} meta
 * @param {import('express').Response} res
 */
const sendErrorDev = (originalErr, handledError, meta, res) => {
  const { statusCode, status } = meta;

  return res.status(statusCode).json({
    success: false,
    status,
    message: handledError?.message || 'Internal Server Error',
    error: {
      name: handledError?.name || originalErr?.name,
      code: handledError?.code ?? originalErr?.code,
      statusCode,
      isOperational: Boolean(handledError?.isOperational),
    },
    stack: originalErr?.stack || handledError?.stack,
  });
};

/**
 * Sends sanitized error responses in production: exposes only operational
 * errors and masks unexpected internal faults after server-side logging.
 * @param {unknown} originalErr
 * @param {object} handledError
 * @param {{ statusCode: number, status: string }} meta
 * @param {import('express').Response} res
 */
const sendErrorProd = (originalErr, handledError, meta, res) => {
  const { statusCode, status } = meta;

  if (handledError?.isOperational) {
    return res.status(statusCode).json({
      success: false,
      status,
      message: handledError.message,
    });
  }

  console.error('UNEXPECTED ERROR 💥:', originalErr);

  return res.status(500).json({
    success: false,
    status: 'error',
    message: 'Internal Server Error',
  });
};

/**
 * Centralized Express error middleware (must be registered last in index.js).
 * @param {unknown} err
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const errorMiddleware = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  const handledError = normalizeError(err);
  const meta = resolveHttpMeta(handledError);

  if (process.env.NODE_ENV === 'development') {
    return sendErrorDev(err, handledError, meta, res);
  }

  return sendErrorProd(err, handledError, meta, res);
};

export default errorMiddleware;
