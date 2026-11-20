import express from "express";
import {protect} from "../middleware/auth.middleware.js";
import {createOrder,getMyOrders,getMyOrderById,cancelOrder,adminGetOrders,adminGetOrderById,adminUpdateOrderStatus} from "../controllers/order.controller.js";
import {createOrderSchema,orderIdParamSchema,myOrdersQuerySchema,adminOrdersQuerySchema,updateOrderStatusSchema} from "../validations/order.validation.js";
const router = express.Router();

const validate = schema => (req,res,next) => {
    const {error,value} = schema.validate(req.body,{abortEarly: false,stripUnknown: true});
    if (error) {
        return res.status(400).json({success: false,message: error.details.map(detail => detail.message)});
    }
    req.body = value;
    next();
};

const validateParams = schema => (req,res,next) => {
    const {error,value} = schema.validate(req.params,{abortEarly: false,stripUnknown: true});
    if (error) {
        return res.status(400).json({success: false,message: error.details.map(detail => detail.message)});
    }
    req.params = value;
    next();
};

const validateQuery = schema => (req,res,next) => {
    const {error,value} = schema.validate(req.query,{abortEarly: false,stripUnknown: true});
    if (error) {
        return res.status(400).json({success: false,message: error.details.map(detail => detail.message)});
    }
    req.validatedQuery = value;
    next();
};

const adminOnly = (req,res,next) => {
    if (!req.user || req.user.role !== "admin") {
        return res.status(403).json({success: false,message: "Access denied"});
    }
    next();
};

router.post("/",protect,validate(createOrderSchema),createOrder);
router.get("/my",protect,validateQuery(myOrdersQuerySchema),getMyOrders);
router.get("/my/:id",protect,validateParams(orderIdParamSchema),getMyOrderById);
router.patch("/my/:id/cancel",protect,validateParams(orderIdParamSchema),cancelOrder);
router.get("/admin",protect,adminOnly,validateQuery(adminOrdersQuerySchema),adminGetOrders);
router.get("/admin/:id",protect,adminOnly,validateParams(orderIdParamSchema),adminGetOrderById);
router.patch("/admin/:id/status",protect,adminOnly,validateParams(orderIdParamSchema),validate(updateOrderStatusSchema),adminUpdateOrderStatus);
export default router;
