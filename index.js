/**
 * ============================================================================
 * File: index.js
 * Track: Track 01 - Infrastructure & Core Setup
 * Owner: Ahmed Ibrahim Mossa (Team Leader)
 * Description: Express application configuration, global middlewares, Stripe
 *              webhook raw body handling, health endpoint, feature route
 *              mounting aligned with Academy docs & Swagger, 404 handler, and
 *              centralized error handler.
 * ============================================================================
 */

import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import ApiError from './utils/apiError.js';
import errorMiddleware from './middlewares/errorMiddleware.js';

// Track route modules (enable as each track delivers & coordinates):
// import authRoutes from './routes/auth.routes.js';
// import userRoutes from './routes/user.routes.js';
// import productRoutes from './routes/product.routes.js';
// import categoryRoutes from './routes/category.routes.js';
// import brandRoutes from './routes/brand.routes.js';
// import cartRoutes from './routes/cart.routes.js';
// import wishlistRoutes from './routes/wishlist.routes.js';
// import orderRoutes from './routes/order.routes.js';
// import paymentRoutes from './routes/payment.routes.js';
// import adminRoutes from './routes/admin.routes.js';

const app = express();

// Hide Express framework fingerprint header
app.disable('x-powered-by');

// Parse optional comma-separated allowlist from environment variables
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
      .map((origin) => origin.trim())
      .filter(Boolean)
  : null;

// ============================================================================
// 1. Stripe Webhook Raw Body Middleware (Must precede express.json())
// ============================================================================
// Preserves raw Buffer payload for Stripe signature verification.
// Keep aligned with Track 09 webhook route path and idempotency handling.
app.use(
  '/payment/webhook',
  express.raw({ type: 'application/json' })
);

// ============================================================================
// 2. Global Middlewares
// ============================================================================
app.use(
  cors(
    allowedOrigins?.length
      ? {
          origin(origin, callback) {
            if (!origin || allowedOrigins.includes(origin)) {
              return callback(null, true);
            }
            return callback(new ApiError('Not allowed by CORS policy', 403));
          },
          credentials: true,
        }
      : undefined
  )
);

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ============================================================================
// 3. Health & Root Check Endpoints
// ============================================================================
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'E-Commerce API is running successfully for Core Team 6',
  });
});

app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'ok',
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
  });
});

// ============================================================================
// 4. Feature Routes Mounting (Aligned with Academy & Swagger Contracts)
// ============================================================================
// app.use('/auth', authRoutes);
// app.use('/users', userRoutes);
// app.use('/products', productRoutes);
// app.use('/categories', categoryRoutes);
// app.use('/brands', brandRoutes);
// app.use('/carts', cartRoutes);
// app.use('/wishlists', wishlistRoutes);
// app.use('/orders', orderRoutes);
// app.use('/payment', paymentRoutes);
// app.use('/admin', adminRoutes);

// ============================================================================
// 5. Undefined Routes Handler (404)
// ============================================================================
app.use((req, res, next) => {
  next(new ApiError(`Can't find this route: ${req.originalUrl}`, 404));
});

// ============================================================================
// 6. Centralized Error Handler (Always registered last)
// ============================================================================
app.use(errorMiddleware);

export default app;
