import Joi from "joi";
import { OrderStatuses, PaymentMethods, PaymentStatuses } from "../models/Order.model.js";

const objectId = Joi.string().hex().length(24);

const shippingAddressSchema = Joi.object({
    fullName: Joi.string().trim().min(3).max(100).required(),
    phone: Joi.string().trim().min(7).max(20).required(),
    country: Joi.string().trim().min(2).max(100).required(),
    city: Joi.string().trim().min(2).max(100).required(),
    address: Joi.string().trim().min(5).max(250).required(),
    postalCode: Joi.string().trim().min(2).max(20).required(),
}).required();

export const createOrderSchema = Joi.object({
    shippingAddress: shippingAddressSchema,
    paymentMethod: Joi.string().valid(...PaymentMethods),
    customerNote: Joi.string().trim().max(1000).allow(""),
});

export const orderIdParamSchema = Joi.object({
    id: objectId.required(),
});

export const myOrdersQuerySchema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    status: Joi.string().valid(...OrderStatuses),
});

export const adminOrdersQuerySchema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    status: Joi.string().valid(...OrderStatuses),
    paymentStatus: Joi.string().valid(...PaymentStatuses),
    from: Joi.date(),
    to: Joi.date().min(Joi.ref("from")),
    sort: Joi.string().valid("newest", "oldest", "price-high", "price-low"),
});

export const updateOrderStatusSchema = Joi.object({
    status: Joi.string().valid(...OrderStatuses).required(),
    adminNote: Joi.string().trim().max(1000).allow(""),
});

