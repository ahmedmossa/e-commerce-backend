import mongoose from "mongoose";
import Order, { OrderStatuses, PaymentMethods, AllowedStatusTransitions } from "../models/Order.model.js";
import Cart from "../models/Cart.model.js";
import Product from "../models/Product.model.js";

const round2 = value => Number(Number(value).toFixed(2));

class AppError extends Error {
    constructor(message, statusCode = 400) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
    }
}

const getQuerySource = req => req.validatedQuery || req.query || {};

const getPagination = querySource => {
    const page = Number(querySource.page ?? 1);
    const limit = Number(querySource.limit ?? 10);
    return {
        page: Number.isInteger(page) && page > 0 ? page : 1,
        limit: Number.isInteger(limit) && limit > 0 ? Math.min(limit, 100) : 10
    };
};

const getStringFilter = value => {
    if (typeof value !== "string") return undefined;
    const cleanValue = value.trim();
    return cleanValue || undefined;
};

const handleErrorResponse = (res, error) => {
    if (error instanceof AppError) {
        return res.status(error.statusCode).json({
            success: false,
            message: error.message
        });
    }
    if (
        error?.name === "ValidationError" ||
        error?.name === "CastError" ||
        error?.code === 11000
    ) {
        return res.status(400).json({
            success: false,
            message: error?.name === "CastError" ? "Invalid identifier format" : error.message
        });
    }
    console.error("Order Controller Error:", error);
    return res.status(500).json({
        success: false,
        message: "Internal server error"
    });
};

const calculateOrderPrices = (subtotal, discount = 0) => {
    const cleanSubtotal = Number(subtotal);
    const cleanDiscount = Number(discount);
    if (!Number.isFinite(cleanSubtotal) || cleanSubtotal < 0) {
        throw new AppError("Invalid subtotal amount");
    }
    if (!Number.isFinite(cleanDiscount) || cleanDiscount < 0 || cleanDiscount > cleanSubtotal) {
        throw new AppError("Invalid discount amount");
    }
    const roundedSubtotal = round2(cleanSubtotal);
    const roundedDiscount = round2(cleanDiscount);
    const shippingFee = roundedSubtotal >= 1000 ? 0 : 50;
    const tax = round2(roundedSubtotal * 0.14);
    const totalPrice = round2(roundedSubtotal + shippingFee + tax - roundedDiscount);
    if (!Number.isFinite(totalPrice) || totalPrice < 0) {
        throw new AppError("Invalid total price");
    }
    return {
        subtotal: roundedSubtotal,
        shippingFee,
        tax,
        discount: roundedDiscount,
        totalPrice
    };
};

const buildOrderItems = cartItems => {
    if (!Array.isArray(cartItems) || cartItems.length === 0) {
        throw new AppError("Your cart is empty");
    }
    return cartItems.map(item => {
        if (!item.product || !item.product._id || !mongoose.isValidObjectId(item.product._id)) {
            throw new AppError("One or more cart items reference a missing product");
        }
        const rawPrice = item.price ?? item.product.price;
        if (rawPrice === null || rawPrice === undefined || rawPrice === "") {
            throw new AppError("Invalid product price");
        }
        const price = Number(rawPrice);
        const quantity = Number(item.quantity);
        if (!Number.isFinite(price) || price < 0 || !Number.isInteger(quantity) || quantity < 1) {
            throw new AppError("Invalid item price or quantity");
        }
        const productName = item.product.name || item.name;
        if (typeof productName !== "string" || !productName.trim()) {
            throw new AppError("Invalid product name");
        }
        const firstImage = item.product.images?.[0];
        return {
            product: item.product._id,
            name: productName,
            image: firstImage?.url || item.image || "",
            price: round2(price),
            quantity
        };
    });
};

const groupQuantitiesByProduct = items => {
    const grouped = new Map();
    for (const item of items) {
        const key = String(item.product);
        if (grouped.has(key)) {
            grouped.get(key).quantity += item.quantity;
        } else {
            grouped.set(key, {
                product: item.product,
                name: item.name || key,
                quantity: item.quantity
            });
        }
    }
    return Array.from(grouped.values());
};

const reserveAndDeductStock = async (items, session) => {
    const groupedItems = groupQuantitiesByProduct(items);
    for (const item of groupedItems) {
        const updatedProduct = await Product.findOneAndUpdate(
            {
                _id: item.product,
                isActive: true,
                stock: { $gte: item.quantity }
            },
            {
                $inc: { stock: -item.quantity }
            },
            { new: true, session }
        );
        if (!updatedProduct) {
            throw new AppError(`Insufficient stock or inactive product: ${item.name}`);
        }
    }
};

const restoreOrderStock = async (order, session) => {
    const groupedItems = groupQuantitiesByProduct(order.items || []);
    for (const item of groupedItems) {
        const result = await Product.updateOne(
            { _id: item.product },
            { $inc: { stock: item.quantity } },
            { session }
        );
        if (result.matchedCount !== 1) {
            throw new AppError(`Cannot restore stock for product: ${item.name}`, 409);
        }
    }
};

export const createOrder = async (req, res) => {
    let session;
    try {
        session = await mongoose.startSession();
        let createdOrder;
        await session.withTransaction(async () => {
            const cart = await Cart.findOne({ user: req.user._id })
                .populate("items.product")
                .session(session);
            if (!cart || !cart.items?.length) {
                throw new AppError("Your cart is empty");
            }
            const items = buildOrderItems(cart.items);
            const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
            const discount = Number(cart.discountAmount ?? 0);
            const prices = calculateOrderPrices(subtotal, discount);
            const paymentMethod = req.body.paymentMethod || "cash";
            if (!PaymentMethods.includes(paymentMethod)) {
                throw new AppError("Invalid payment method");
            }
            if (!req.body.shippingAddress) {
                throw new AppError("Shipping address is required");
            }
            await reserveAndDeductStock(items, session);
            const [order] = await Order.create(
                [{
                    user: req.user._id,
                    items,
                    shippingAddress: req.body.shippingAddress,
                    paymentMethod,
                    paymentStatus: "pending",
                    ...prices,
                    customerNote: req.body.customerNote || ""
                }],
                { session }
            );
            cart.items = [];
            cart.coupon = undefined;
            await cart.save({ session });
            createdOrder = order;
        });
        return res.status(201).json({
            success: true,
            message: "Order created successfully",
            data: createdOrder
        });
    } catch (error) {
        return handleErrorResponse(res, error);
    } finally {
        if (session) await session.endSession();
    }
};

export const getMyOrders = async (req, res) => {
    try {
        const querySource = getQuerySource(req);
        const { page, limit } = getPagination(querySource);
        const filter = { user: req.user._id };
        const status = getStringFilter(querySource.status);
        if (status) {
            if (!OrderStatuses.includes(status)) {
                throw new AppError("Invalid order status");
            }
            filter.status = status;
        }
        const [orders, total] = await Promise.all([
            Order.find(filter)
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit),
            Order.countDocuments(filter)
        ]);
        return res.status(200).json({
            success: true,
            data: orders,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        return handleErrorResponse(res, error);
    }
};

export const getMyOrderById = async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            throw new AppError("Invalid order ID");
        }
        const order = await Order.findOne({
            _id: req.params.id,
            user: req.user._id
        });
        if (!order) {
            throw new AppError("Order not found", 404);
        }
        return res.status(200).json({
            success: true,
            data: order
        });
    } catch (error) {
        return handleErrorResponse(res, error);
    }
};

export const cancelOrder = async (req, res) => {
    let session;
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            throw new AppError("Invalid order ID");
        }
        session = await mongoose.startSession();
        let cancelledOrder;
        await session.withTransaction(async () => {
            const order = await Order.findOne({
                _id: req.params.id,
                user: req.user._id
            }).session(session);
            if (!order) {
                throw new AppError("Order not found", 404);
            }
            if (!["pending", "confirmed"].includes(order.status)) {
                throw new AppError("Only pending or confirmed orders can be cancelled");
            }
            order.status = "cancelled";
            order.cancelledAt = new Date();
            await order.save({ session });
            await restoreOrderStock(order, session);
            cancelledOrder = order;
        });
        return res.status(200).json({
            success: true,
            message: "Order cancelled successfully",
            data: cancelledOrder
        });
    } catch (error) {
        return handleErrorResponse(res, error);
    } finally {
        if (session) await session.endSession();
    }
};

export const adminGetOrders = async (req, res) => {
    try {
        const querySource = getQuerySource(req);
        const { page, limit } = getPagination(querySource);
        const filter = {};
        const status = getStringFilter(querySource.status);
        const user = getStringFilter(querySource.user);
        if (status) {
            if (!OrderStatuses.includes(status)) {
                throw new AppError("Invalid order status");
            }
            filter.status = status;
        }
        if (user) {
            if (!mongoose.isValidObjectId(user)) {
                throw new AppError("Invalid user ID");
            }
            filter.user = user;
        }
        const [orders, total] = await Promise.all([
            Order.find(filter)
                .populate("user", "name email")
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit),
            Order.countDocuments(filter)
        ]);
        return res.status(200).json({
            success: true,
            data: orders,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        return handleErrorResponse(res, error);
    }
};

export const adminGetOrderById = async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            throw new AppError("Invalid order ID");
        }
        const order = await Order.findById(req.params.id)
            .populate("user", "name email");
        if (!order) {
            throw new AppError("Order not found", 404);
        }
        return res.status(200).json({
            success: true,
            data: order
        });
    } catch (error) {
        return handleErrorResponse(res, error);
    }
};

export const adminUpdateOrderStatus = async (req, res) => {
    let session;
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            throw new AppError("Invalid order ID");
        }
        session = await mongoose.startSession();
        let updatedOrder;
        await session.withTransaction(async () => {
            const order = await Order.findById(req.params.id).session(session);
            if (!order) {
                throw new AppError("Order not found", 404);
            }
            const oldStatus = order.status;
            const newStatus = req.body.status;
            if (newStatus !== undefined) {
                if (!OrderStatuses.includes(newStatus)) {
                    throw new AppError("Invalid order status");
                }
                if (
                    newStatus !== oldStatus &&
                    !AllowedStatusTransitions[oldStatus]?.includes(newStatus)
                ) {
                    throw new AppError(`Cannot change order status from ${oldStatus} to ${newStatus}`);
                }
                if (newStatus !== oldStatus) {
                    order.status = newStatus;
                    if (newStatus === "cancelled") {
                        order.cancelledAt = new Date();
                        await restoreOrderStock(order, session);
                    }
                    if (newStatus === "delivered") {
                        order.deliveredAt = new Date();
                        if (order.paymentMethod === "cash" && order.paymentStatus === "pending") {
                            order.paymentStatus = "paid";
                            order.paidAt = new Date();
                        }
                    }
                }
            }
            if (req.body.adminNote !== undefined) {
                order.adminNote = req.body.adminNote;
            }
            await order.save({ session });
            updatedOrder = order;
        });
        return res.status(200).json({
            success: true,
            message: "Order updated successfully",
            data: updatedOrder
        });
    } catch (error) {
        return handleErrorResponse(res, error);
    } finally {
        if (session) await session.endSession();
    }
};
