
import Wishlist from '../models/Wishlist.model.js';
import Product from '../models/Product.model.js';
import ApiError from '../utils/apiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import mongoose from 'mongoose';

// Get current user's wishlist
export const getMyWishlist = asyncHandler(async (req, res) => {

    const wishlist = await Wishlist.findOne({
        user: req.user._id
    });

    if (!wishlist) {
        return res.status(200).json({
            success: true,
            message: 'Your wishlist is empty',
            data: {
                products: []
            }
        });
    }

    res.status(200).json({
        success: true,
        message: 'Wishlist retrieved successfully',
        data: wishlist
    });

});


// Add product to wishlist
export const addProductToWishlist = asyncHandler(async (req, res) => {

    const { productId } = req.params;

    // Check if product ID is valid
    if (!mongoose.isValidObjectId(productId)) {
        throw new ApiError('Invalid product ID', 400);
    }

    // Check if product exists
    const product = await Product.findById(productId);

    if (!product) {
        throw new ApiError('Product not found', 404);
    }

    // Find user's wishlist
    let wishlist = await Wishlist.findOne({
        user: req.user._id
    });

    // Create wishlist if it does not exist
    if (!wishlist) {
        wishlist = await Wishlist.create({
            user: req.user._id,
            products: [productId]
        });
    } else {

        // Check if product already exists
        const isProductExists = wishlist.products.some(
            (item) => item._id.toString() === productId
        );

        if (isProductExists) {
            throw new ApiError('Product already exists in wishlist', 400);
        }

        // Add product to wishlist
        wishlist.products.push(productId);

        await wishlist.save();
    }

    // Populate products before sending response
    await wishlist.populate('products');

    res.status(200).json({
        success: true,
        message: 'Product added to wishlist successfully',
        data: wishlist
    });

});


// Remove product from wishlist
export const removeProductFromWishlist = asyncHandler(async (req, res) => {

    const { productId } = req.params;

    // Check if product ID is valid
    if (!mongoose.isValidObjectId(productId)) {
        throw new ApiError('Invalid product ID', 400);
    }

    // Find user's wishlist
    const wishlist = await Wishlist.findOne({
        user: req.user._id
    });

    if (!wishlist) {
        throw new ApiError('Wishlist not found', 404);
    }

    // Check if product exists in wishlist
    const productExists = wishlist.products.some(
        (item) => item._id.toString() === productId
    );

    if (!productExists) {
        throw new ApiError('Product not found in wishlist', 404);
    }

    // Remove product from wishlist
    wishlist.products = wishlist.products.filter(
        (item) => item._id.toString() !== productId
    );

    await wishlist.save();

    res.status(200).json({
        success: true,
        message: 'Product removed from wishlist successfully',
        data: wishlist
    });

});


// Clear user's wishlist
export const clearWishlist = asyncHandler(async (req, res) => {

    // Find user's wishlist
    const wishlist = await Wishlist.findOne({
        user: req.user._id
    });

    if (!wishlist) {
        throw new ApiError('Wishlist not found', 404);
    }

    // Remove all products
    wishlist.products = [];

    await wishlist.save();

    res.status(200).json({
        success: true,
        message: 'Wishlist cleared successfully',
        data: wishlist
    });

});
