/**
 * ============================================================================
 * File: utils/asyncHandler.js
 * Track: Track 01 - Infrastructure & Core Setup
 * Owner: Ahmed Ibrahim Mossa (Team Leader)
 * Description: Higher-order wrapper for asynchronous Express route handlers and
 *              middlewares that forwards rejected promises and thrown errors
 *              to the centralized Express error middleware via next(err).
 * ============================================================================
 */

/**
 * Wraps an async request handler/middleware so any thrown error or rejected
 * promise is forwarded to Express error handling without repetitive try/catch.
 * @param {(req: import('express').Request, res: import('express').Response, next: import('express').NextFunction) => unknown | Promise<unknown>} fn
 * @returns {(req: import('express').Request, res: import('express').Response, next: import('express').NextFunction) => void}
 */
const asyncHandler = (fn) => (req, res, next) => {
  if (typeof fn !== 'function') {
    return next(new TypeError('asyncHandler expected a function handler'));
  }

  Promise.resolve()
    .then(() => fn(req, res, next))
    .catch((err) => next(err));
};

export default asyncHandler;