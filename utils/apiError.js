/**
 * ============================================================================
 * File: utils/apiError.js
 * Track: Track 01 - Infrastructure & Core Setup
 * Owner: Ahmed Ibrahim Mossa (Team Leader)
 * Description: Custom operational HTTP error class extending native Error for
 *              consistent error propagation across controllers, middlewares,
 *              and the centralized error handler.
 * ============================================================================
 */

const MIN_HTTP_STATUS = 100;
const MAX_HTTP_STATUS = 599;

/**
 * Validates and normalizes an HTTP status code to a safe integer in [100..599].
 * @param {unknown} statusCode
 * @returns {number}
 */
const resolveStatusCode = (statusCode) => {
  const parsed = Number(statusCode);
  const isValidHttpStatus =
    Number.isInteger(parsed) &&
    parsed >= MIN_HTTP_STATUS &&
    parsed <= MAX_HTTP_STATUS;

  return isValidHttpStatus ? parsed : 500;
};

/**
 * Represents a known operational error with an HTTP status code and message.
 */
class ApiError extends Error {
  /**
   * @param {string} message - Human-readable error message.
   * @param {number} [statusCode=500] - HTTP status code (e.g., 400, 401, 404, 409, 500).
   * @param {unknown} [errors] - Optional structured error details.
   */
  constructor(message, statusCode = 500, errors) {
    const cleanMessage =
      typeof message === 'string' && message.trim().length > 0
        ? message.trim()
        : 'Internal Server Error';

    super(cleanMessage);

    this.name = 'ApiError';
    this.statusCode = resolveStatusCode(statusCode);
    this.status = String(this.statusCode).startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    if (errors !== undefined) {
      this.errors = errors;
    }

    Error.captureStackTrace?.(this, this.constructor);
  }
}

export default ApiError;