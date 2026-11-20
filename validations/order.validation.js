import Joi from "joi";
import {OrderStatuses,PaymentMethods} from "../models/Order.model.js";
const objectId = Joi.string().hex().length(24);

const shippingAddressSchema = Joi.object({
    fullName: Joi.string().trim().min(3).max(100).required(),
    phone: Joi.string().trim().min(7).max(20).required(),
    country: Joi.string().trim().min(2).max(60).required(),
    city: Joi.string().trim().min(2).max(60).required(),
    address: Joi.string().trim().min(5).max(250).required(),
    postalCode: Joi.string().trim().min(2).max(20).required()
});

export const createOrderSchema = Joi.object({
    shippingAddress: shippingAddressSchema.required(),
    paymentMethod: Joi.string().valid(...PaymentMethods).default("cash"),
    customerNote: Joi.string().trim().max(1000).allow("").default("")
});

export const orderIdParamSchema = Joi.object({
    id: objectId.required()
});

export const myOrdersQuerySchema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    status: Joi.string().valid(...OrderStatuses)
});

export const adminOrdersQuerySchema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    status: Joi.string().valid(...OrderStatuses),
    user: objectId
});

export const updateOrderStatusSchema = Joi.object({
    status: Joi.string().valid(...OrderStatuses).required(),
    adminNote: Joi.string().trim().max(1000).allow("")
});
