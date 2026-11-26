
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

const getEffectivePrice = (product) => {
  const discountPrice = Number(product.discountPrice);

  if (
    product.discountPrice != null &&
    Number.isFinite(discountPrice) &&
    discountPrice >= 0 &&
    discountPrice < product.price
  ) {
    return discountPrice;
  }

  return product.price;
};

const getProductImage = (product) =>
  product.imageCover || product.images?.[0]?.url || "";

const sendCart = (res, cart, message, statusCode = 200) =>
  res.status(statusCode).json({
    success: true,
    message,
    cart,
  });

const parseQuantity = (value) => {
  const qty = Number(value);

  if (
    !Number.isSafeInteger(qty) ||
    qty < 1 ||
    String(value).trim() === ""
  ) {
    throw new ApiError(
      "Quantity must be a whole number of at least 1",
      400
    );
  }

  return qty;
};

const assertValidId = (id) => {
  if (!mongoose.isValidObjectId(id)) {
    throw new ApiError("Invalid product ID", 400);
  }
};

// Run related database operations atomically.
const withTransaction = async (callback) => {
  const session = await mongoose.startSession();

  try {
    let result;

    await session.withTransaction(async () => {
      result = await callback(session);
    });

    return result;
  } finally {
    await session.endSession();
  }
};

const getOrCreateCart = async (userId, session) => {
  return Cart.findOneAndUpdate(
    { user: userId },
    { $setOnInsert: { user: userId } },
    {
      new: true,
      upsert: true,
      session,
    }
  );
};

// Reserve stock using a conditional atomic update.
const reserveStock = async (productId, qty, session) => {
  return Product.findOneAndUpdate(
    {
      _id: productId,
      isActive: true,
      stock: { $gte: qty },
    },
    {
      $inc: { stock: -qty },
    },
    {
      new: true,
      session,
    }
  );
};

// Restore stock within the same transaction.
const changeStock = async (productId, amount, session) => {
  const result = await Product.updateOne(
    { _id: productId },
    { $inc: { stock: amount } },
    { session }
  );

  if (result.matchedCount !== 1) {
    throw new ApiError(
      "Could not update product stock",
      404
    );
  }

  return result;
};

export const getCart = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user._id);

  return sendCart(
    res,
    cart,
    "Cart fetched successfully"
  );
});

export const addItem = asyncHandler(async (req, res) => {
  const { productId } = req.body;

  assertValidId(productId);

  const qty = parseQuantity(req.body.quantity ?? 1);

  const cart = await withTransaction(async (session) => {
    const product = await reserveStock(
      productId,
      qty,
      session
    );

    if (!product) {
      const exists = await Product.findById(productId)
        .session(session);

      if (!exists || !exists.isActive) {
        throw new ApiError(
          "Product not found or unavailable",
          404
        );
      }

      throw new ApiError(
        `Not enough stock. Only ${exists.stock} item(s) available`,
        400
      );
    }

    const userCart = await getOrCreateCart(
      req.user._id,
      session
    );

    const item = userCart.items.find(
      (i) => String(i.product) === String(productId)
    );

    if (item) {
      item.quantity += qty;
      item.price = getEffectivePrice(product);
      item.name = product.name;
      item.image = getProductImage(product);
    } else {
      userCart.items.push({
        product: product._id,
        name: product.name,
        image: getProductImage(product),
        price: getEffectivePrice(product),
        quantity: qty,
      });
    }

    await userCart.save({ session });

    return userCart;
  });

  return sendCart(
    res,
    cart,
    "Item added to cart",
    201
  );
});

export const updateItem = asyncHandler(async (req, res) => {
  const { productId } = req.body;

  assertValidId(productId);

  const qty = parseQuantity(req.body.quantity);

  const cart = await withTransaction(async (session) => {
    const userCart = await Cart.findOne({
      user: req.user._id,
    }).session(session);

    if (!userCart) {
      throw new ApiError("Cart not found", 404);
    }

    const item = userCart.items.find(
      (i) => String(i.product) === String(productId)
    );

    if (!item) {
      throw new ApiError("Item not found in cart", 404);
    }

    const diff = qty - item.quantity;

    if (diff > 0) {
      const reserved = await reserveStock(
        productId,
        diff,
        session
      );

      if (!reserved) {
        throw new ApiError(
          "Not enough stock for this quantity",
          400
        );
      }
    } else if (diff < 0) {
      await changeStock(
        productId,
        -diff,
        session
      );
    }

    item.quantity = qty;

    await userCart.save({ session });

    return userCart;
  });

  return sendCart(
    res,
    cart,
    "Cart updated successfully"
  );
});

export const removeItem = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  assertValidId(productId);

  const cart = await withTransaction(async (session) => {
    const userCart = await Cart.findOne({
      user: req.user._id,
    }).session(session);

    if (!userCart) {
      throw new ApiError("Cart not found", 404);
    }

    const index = userCart.items.findIndex(
      (i) => String(i.product) === String(productId)
    );

    if (index === -1) {
      throw new ApiError("Item not found in cart", 404);
    }

    const [removed] = userCart.items.splice(index, 1);

    await userCart.save({ session });

    await changeStock(
      productId,
      removed.quantity,
      session
    );

    return userCart;
  });

  return sendCart(
    res,
    cart,
    "Item removed from cart"
  );
});

export const applyCoupon = asyncHandler(async (req, res) => {
  const code = String(req.body.code || "")
    .trim()
    .toUpperCase();

  if (!code) {
    throw new ApiError(
      "Coupon code is required",
      400
    );
  }

  if (!Object.hasOwn(COUPONS, code)) {
    throw new ApiError(
      "Invalid coupon code",
      400
    );
  }

  const cart = await Cart.findOne({
    user: req.user._id,
  });

  if (!cart || cart.items.length === 0) {
    throw new ApiError("Cart is empty", 400);
  }

  cart.coupon = {
    code,
    ...COUPONS[code],
  };

  await cart.save();

  return sendCart(
    res,
    cart,
    "Coupon applied successfully"
  );
});

export const removeCoupon = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({
    user: req.user._id,
  });

  if (!cart) {
    throw new ApiError("Cart not found", 404);
  }

  cart.coupon = undefined;

  await cart.save();

  return sendCart(
    res,
    cart,
    "Coupon removed successfully"
  );
});

export const clearCart = asyncHandler(async (req, res) => {
  const cart = await withTransaction(async (session) => {
    const userCart = await Cart.findOne({
      user: req.user._id,
    }).session(session);

    if (!userCart) {
      throw new ApiError("Cart not found", 404);
    }

    const items = userCart.items.map((item) => ({
      product: item.product,
      quantity: item.quantity,
    }));

    userCart.items = [];
    userCart.coupon = undefined;

    await userCart.save({ session });

    for (const item of items) {
      await changeStock(
        item.product,
        item.quantity,
        session
      );
    }

    return userCart;
  });

  return sendCart(
    res,
    cart,
    "Cart cleared successfully"
  );
});
