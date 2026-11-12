import express from 'express';
import { createPaymentIntent, handleStripeWebhook } from '../controllers/payment.controller.js';
import Auth from '../middlewares/auth.middleware.js';

const router = express.Router();

// Stripe Webhook - Public route
router.post( '/webhook', handleStripeWebhook );

// Create PaymentIntent - Protected route
router.post( '/create-payment-intent', express.json(), Auth, createPaymentIntent );

export default router;
