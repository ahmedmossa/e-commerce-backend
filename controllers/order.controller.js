import Order from "../models/Order.model.js";

export const createOrder = async (req, res, next) => {
    try {
      return res.status(501).json({
        message: "Create order will be implemented in Week 3/4" 
      });
    } catch (error) {
        next(error);
    }
};

export const getMyOrders = async (req, res, next) => {
    try {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;

        const filter = { user: req.user._id };

        if (req.query.status) {
            filter.status = req.query.status;
        }

        const skip = (page - 1) * limit;

        const orders = await Order.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const totalOrders = await Order.countDocuments(filter);

        return res.status(200).json({
            message: "Orders retrieved successfully",
            results: orders.length,
            pagination: {
                totalOrders,
                currentPage: page,
                totalPages: Math.ceil(totalOrders / limit),
                limit,
            },
            data: orders,
        });
    } catch (error) {
        next(error);
    }
};

export const getMyOrderById = async (req, res, next) => {
    try {
        const order = await Order.findOne({ _id: req.params.id, user: req.user._id });

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        return res.status(200).json({
            message: "Order retrieved successfully",
            data: order,
        });
    } catch (error) {
        next(error);
    }
};

export const cancelOrder = async (req, res, next) => {
    try {
      return res.status(501).json({
        message: "Cancel order will be implemented in Week 4" 
      });
    } catch (error) {
        next(error);
    }
};

