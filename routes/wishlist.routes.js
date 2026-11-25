
import express from 'express';

import {
    getMyWishlist,
    addProductToWishlist,
    removeProductFromWishlist,
    clearWishlist
} from '../controllers/wishlist.controller.js';

import Auth from '../middlewares/auth.middleware.js';

const router = express.Router();

// Get current user's wishlist
router.get('/my', Auth, getMyWishlist);

// Add product to wishlist
router.post('/add/:productId', Auth, addProductToWishlist);

// Remove product from wishlist
router.delete('/remove/:productId', Auth, removeProductFromWishlist);

// Clear user's wishlist
router.delete('/clear', Auth, clearWishlist);

export default router;
