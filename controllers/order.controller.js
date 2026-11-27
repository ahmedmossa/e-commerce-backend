import mongoose from "mongoose";
import Order from "../models/Order.model.js";
import Cart from "../models/Cart.model.js";
import Product from "../models/Product.model.js";
const round2 = value => Number(Number(value).toFixed(2));

class AppError extends Error {
    constructor(message,statusCode = 400) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
    }
}

const getQuerySource = req => req.validatedQuery || req.query || {};

const getPagination = querySource => ({
    page: Math.max(1,Number(querySource.page) || 1),
    limit: Math.min(100,Math.max(1,Number(querySource.limit) || 10))
});

const getStringFilter = value => typeof value === "string" && value ? value : undefined;

const calculateOrderPrices = (subtotal,discount = 0) => {
    const cleanSubtotal = Number(subtotal);
    const cleanDiscount = Number(discount);
    if (!Number.isFinite(cleanSubtotal) || cleanSubtotal < 0) {
        throw new AppError("Invalid subtotal amount",400);
    }
    if (!Number.isFinite(cleanDiscount) || cleanDiscount < 0 || cleanDiscount > cleanSubtotal) {
        throw new AppError("Invalid discount amount",400);
    }
    const shippingFee = cleanSubtotal >= 1000 ? 0 : 50;
    const tax = round2(cleanSubtotal * 0.14);
    const totalPrice = round2(cleanSubtotal + shippingFee + tax - cleanDiscount);
    return {subtotal: round2(cleanSubtotal),shippingFee,tax,discount: round2(cleanDiscount),totalPrice};
};

const buildOrderItems = cartItems => cartItems.map(item => {
    if (!item.product) {
        throw new AppError("One or more cart items reference a missing product",400);
    }
    const price = Number(item.price);
    const quantity = Number(item.quantity);
    if (!Number.isFinite(price) || price < 0 || !Number.isInteger(quantity) || quantity < 1) {
        throw new AppError("Invalid item price or quantity",400);
    }
    return {
        product: item.product._id,
        name: item.name || item.product.name,
        image: item.image || item.product.images?.[0]?.url || "",
        price,
        quantity
    };
});

const validateReservedProducts = async (items,session) => {
    const productIds = [...new Set(items.map(item => String(item.product)))];
    const products = await Product.find({_id: {$in: productIds},isActive: true}).session(session);
    if (products.length !== productIds.length) {
        throw new AppError("One or more products are unavailable",400);
    }
    for (const item of items) {
        const product = products.find(p => String(p._id) === String(item.product));
        if (!product) {
            throw new AppError("Product not found",404);
        }
        if (typeof product.stock !== "number" || product.stock < 0) {
            throw new AppError(`Invalid stock for product ${product.name}`,400);
        }
    }
};

const restoreOrderStock = async (order,session) => {
    for (const item of order.items) {
        const result = await Product.updateOne({_id: item.product},{$inc: {stock: item.quantity}},{session});
        if (result.matchedCount !== 1) {
            throw new AppError(`Could not restore stock for product ${item.name}`,400);
        }
    }
};

const handleErrorResponse = (res,error) => {
    if (error instanceof AppError) {
        return res.status(error.statusCode).json({success: false,message: error.message});
    }
    if (error?.name === "ValidationError" || error?.message?.includes("Cannot change order status") || error?.message?.includes("Total price") || error?.message?.includes("Discount")) {
        return res.status(400).json({success: false,message: error.message});
    }
    return res.status(500).json({success: false,message: error?.message || "Internal server error"});
};

export const createOrder = async (req,res) => {
    const session = await mongoose.startSession();
    try {
        let createdOrder;
        await session.withTransaction(async () => {
            const cart = await Cart.findOne({user: req.user._id}).populate("items.product").session(session);
            if (!cart || !Array.isArray(cart.items) || !cart.items.length) {
                throw new AppError("Your cart is empty",400);
            }
            const items = buildOrderItems(cart.items);
            await validateReservedProducts(items,session);
            const subtotal = items.reduce((sum,item) => sum + item.price * item.quantity,0);
            const rawDiscount = cart.discountAmount !== undefined ? Number(cart.discountAmount) : 0;
            const prices = calculateOrderPrices(subtotal,rawDiscount);
            const [order] = await Order.create([{user: req.user._id,items,shippingAddress: req.body.shippingAddress,paymentMethod: req.body.paymentMethod || "cash",paymentStatus: "pending",...prices,customerNote: req.body.customerNote || ""}],{session});
            cart.items = [];
            cart.coupon = undefined;
            await cart.save({session});
            createdOrder = order;
        });
        return res.status(201).json({success: true,message: "Order created successfully",data: createdOrder});
    } catch (error) {
        return handleErrorResponse(res,error);
    } finally {
        await session.endSession();
    }
};

export const getMyOrders = async (req,res) => {
    try {
        const querySource = getQuerySource(req);
        const {page,limit} = getPagination(querySource);
        const filter = {user: req.user._id};
        const status = getStringFilter(querySource.status);
        if (status) {
            filter.status = status;
        }
        const orders = await Order.find(filter).sort({createdAt: -1}).skip((page - 1) * limit).limit(limit);
        const total = await Order.countDocuments(filter);
        return res.status(200).json({success: true,data: orders,pagination: {total,page,limit,totalPages: Math.ceil(total / limit)}});
    } catch (error) {
        return handleErrorResponse(res,error);
    }
};

export const getMyOrderById = async (req,res) => {
    try {
        const order = await Order.findOne({_id: req.params.id,user: req.user._id});
        if (!order) {
            return res.status(404).json({success: false,message: "Order not found"});
        }
        return res.status(200).json({success: true,data: order});
    } catch (error) {
        return handleErrorResponse(res,error);
    }
};

export const cancelOrder = async (req,res) => {
    const session = await mongoose.startSession();
    try {
        let cancelledOrder;
        await session.withTransaction(async () => {
            const order = await Order.findOneAndUpdate({_id: req.params.id,user: req.user._id,status: {$in: ["pending","confirmed"]}},{$set: {status: "cancelled",cancelledAt: new Date()}},{new: true,session,runValidators: true});
            if (!order) {
                throw new AppError("Order not found or cannot be cancelled",400);
            }
            await restoreOrderStock(order,session);
            cancelledOrder = order;
        });
        return res.status(200).json({success: true,message: "Order cancelled successfully",data: cancelledOrder});
    } catch (error) {
        return handleErrorResponse(res,error);
    } finally {
        await session.endSession();
    }
};

export const adminGetOrders = async (req,res) => {
    try {
        const querySource = getQuerySource(req);
        const {page,limit} = getPagination(querySource);
        const filter = {};
        const status = getStringFilter(querySource.status);
        const user = getStringFilter(querySource.user);
        if (status) {
            filter.status = status;
        }
        if (user) {
            filter.user = user;
        }
        const orders = await Order.find(filter).populate("user","name email").sort({createdAt: -1}).skip((page - 1) * limit).limit(limit);
        const total = await Order.countDocuments(filter);
        return res.status(200).json({success: true,data: orders,pagination: {total,page,limit,totalPages: Math.ceil(total / limit)}});
    } catch (error) {
        return handleErrorResponse(res,error);
    }
};

export const adminGetOrderById = async (req,res) => {
    try {
        const order = await Order.findById(req.params.id).populate("user","name email");
        if (!order) {
            return res.status(404).json({success: false,message: "Order not found"});
        }
        return res.status(200).json({success: true,data: order});
    } catch (error) {
        return handleErrorResponse(res,error);
    }
};

export const adminUpdateOrderStatus = async (req,res) => {
    const session = await mongoose.startSession();
    try {
        let updatedOrder;
        await session.withTransaction(async () => {
            const order = await Order.findById(req.params.id).session(session);
            if (!order) {
                throw new AppError("Order not found",404);
            }
            const oldStatus = order.status;
            const newStatus = req.body.status;
            if (oldStatus !== newStatus) {
                if (order.$locals.originalStatus === undefined) {
                    order.$locals.originalStatus = oldStatus;
                }
                order.status = newStatus;
                if (newStatus === "cancelled") {
                    order.cancelledAt = new Date();
                }
                if (newStatus === "delivered") {
                    order.deliveredAt = new Date();
                    if (order.paymentMethod === "cash" && order.paymentStatus === "pending") {
                        order.paymentStatus = "paid";
                        order.paidAt = new Date();
                    }
                }
                if (newStatus === "cancelled" && oldStatus !== "cancelled") {
                    await restoreOrderStock(order,session);
                }
            }
            if (req.body.adminNote !== undefined) {
                order.adminNote = req.body.adminNote;
            }
            await order.save({session});
            updatedOrder = order;
        });
        return res.status(200).json({success: true,message: "Order updated successfully",data: updatedOrder});
    } catch (error) {
        return handleErrorResponse(res,error);
    } finally {
        await session.endSession();
    }
};
