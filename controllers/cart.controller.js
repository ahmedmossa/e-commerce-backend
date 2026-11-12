import mongoose from "mongoose";
import Cart from "../models/Cart.model.js";
import Product from "../models/Product.model.js";
import ApiError from "../utils/apiError.js";
import asyncHandler from "../utils/asyncHandler.js";

const COUPONS = {
  SAVE10: { discountType: "percentage", discountValue: 10 },
  SAVE20: { discountType: "percentage", discountValue: 20 },
  SAVE50: { discountType: "percentage", discountValue: 50 },
  SAVE80: { discountType: "percentage", discountValue: 80 },
  OFF50: { discountType: "fixed", discountValue: 50 },
};

const getEffectivePrice = (product) =>
  product.discountPrice > 0 ? product.discountPrice : product.price;

const getProductImage = (product) =>
  product.imageCover || (product.images && product.images[0]?.url) || "";

const getOrCreateCart = (userId) =>
  Cart.findOneAndUpdate(
    { user: userId },
    { $setOnInsert: { user: userId } },
    { new: true, upsert: true }
  );

const reserveStock = (productId, qty) =>
  Product.findOneAndUpdate(
    { _id: productId, isActive: true, stock: { $gte: qty } },
    { $inc: { stock: -qty } },
    { new: true }
  );

const changeStock = (productId, amount) =>
  Product.updateOne({ _id: productId }, { $inc: { stock: amount } });

const sendCart = (res, cart, message, statusCode = 200) =>
  res.status(statusCode).json({ success: true, message, cart });

const parseQuantity = (value) => {
  const qty = Number(value);
  if (!Number.isInteger(qty) || qty < 1) {
    throw new ApiError("Quantity must be a whole number of at least 1", 400);
  }
  return qty;
};

const assertValidId = (id) => {
  if (!mongoose.isValidObjectId(id)) {
    throw new ApiError("Invalid product ID", 400);
  }
};

export const getCart = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user._id);
  sendCart(res, cart, "Cart fetched successfully");
});

export const addItem = asyncHandler(async (req, res) => {
  const { productId } = req.body;
  assertValidId(productId);
  const qty = parseQuantity(req.body.quantity ?? 1);

  const exists = await Product.findById(productId);
  if (!exists || !exists.isActive) {
    throw new ApiError("Product not found or unavailable", 404);
  }

  const product = await reserveStock(productId, qty);
  if (!product) {
    throw new ApiError(
      `Not enough stock. Only ${exists.stock} item(s) available`,
      400
    );
  }

  try {
    const cart = await getOrCreateCart(req.user._id);
    const item = cart.items.find((i) => i.product.toString() === productId);

    if (item) {
      item.quantity += qty;
      item.price = getEffectivePrice(product);
    } else {
      cart.items.push({
        product: product._id,
        name: product.name,
        image: getProductImage(product),
        price: getEffectivePrice(product),
        quantity: qty,
      });
    }

    await cart.save();
    sendCart(res, cart, "Item added to cart", 201);
  } catch (error) {
    await changeStock(productId, qty);
    throw error;
  }
});

export const updateItem = asyncHandler(async (req, res) => {
  const { productId } = req.body;
  assertValidId(productId);
  const qty = parseQuantity(req.body.quantity);

  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) throw new ApiError("Cart not found", 404);

  const item = cart.items.find((i) => i.product.toString() === productId);
  if (!item) throw new ApiError("Item not found in cart", 404);

  const diff = qty - item.quantity;
  if (diff === 0) return sendCart(res, cart, "Cart updated successfully");

  if (diff > 0) {
    const reserved = await reserveStock(productId, diff);
    if (!reserved) throw new ApiError("Not enough stock for this quantity", 400);
  } else {
    await changeStock(productId, -diff);
  }

  item.quantity = qty;

  try {
    await cart.save();
  } catch (error) {
    await changeStock(productId, diff);
    throw error;
  }

  sendCart(res, cart, "Cart updated successfully");
});

export const removeItem = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  assertValidId(productId);

  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) throw new ApiError("Cart not found", 404);

  const index = cart.items.findIndex((i) => i.product.toString() === productId);
  if (index === -1) throw new ApiError("Item not found in cart", 404);

  const [removed] = cart.items.splice(index, 1);
  await cart.save();
  await changeStock(productId, removed.quantity);

  sendCart(res, cart, "Item removed from cart");
});

export const applyCoupon = asyncHandler(async (req, res) => {
  const code = String(req.body.code || "").trim().toUpperCase();
  if (!code) throw new ApiError("Coupon code is required", 400);

  if (!Object.hasOwn(COUPONS, code)) {
    throw new ApiError("Invalid coupon code", 400);
  }

  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart || cart.items.length === 0) {
    throw new ApiError("Cart is empty", 400);
  }

  cart.coupon = { code, ...COUPONS[code] };
  await cart.save();

  sendCart(res, cart, "Coupon applied successfully");
});

export const removeCoupon = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) throw new ApiError("Cart not found", 404);

  cart.coupon = undefined;
  await cart.save();

  sendCart(res, cart, "Coupon removed successfully");
});

export const clearCart = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) throw new ApiError("Cart not found", 404);

  const items = cart.items.map((i) => ({
    product: i.product,
    quantity: i.quantity,
  }));

  cart.items = [];
  cart.coupon = undefined;
  await cart.save();

  if (items.length > 0) {
    await Product.bulkWrite(
      items.map((i) => ({
        updateOne: {
          filter: { _id: i.product },
          update: { $inc: { stock: i.quantity } },
        },
      }))
    );
  }

  sendCart(res, cart, "Cart cleared successfully");
});
