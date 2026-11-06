import express from "express";

import { createOrder, getMyOrders, getMyOrderById, cancelOrder } from "../controllers/order.controller.js";

import { createOrderSchema, orderIdParamSchema, myOrdersQuerySchema } from "../validations/order.validation.js";

import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

const validate = (schema, property) => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req[property], {
            abortEarly: false,
            convert: true,
        });

        if (error) {
            return res.status(400).json({
                message: "Validation error",
                errors: error.details.map((detail) => detail.message),
            });
        }

        req[property] = value;
        next();
    };
};

router.post("/", protect, validate(createOrderSchema, "body"), createOrder);

router.get("/my", protect, validate(myOrdersQuerySchema, "query"), getMyOrders);

router.get("/my/:id", protect, validate(orderIdParamSchema, "params"), getMyOrderById);

router.patch("/my/:id/cancel", protect, validate(orderIdParamSchema, "params"), cancelOrder);

export default router;

