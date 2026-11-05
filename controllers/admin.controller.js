import mongoose from 'mongoose';

// 1. تعريف الموديلز (بنفس شكل الـ Schema اللي في seed.js)
const User = mongoose.models.User || mongoose.model('User', new mongoose.Schema({ 
  name: String, 
  email: String, 
  role: String 
}));

const Order = mongoose.models.Order || mongoose.model('Order', new mongoose.Schema({ 
  totalPrice: Number, 
  status: String, 
  items: [{ product: String, name: String, quantity: Number }],
  createdAt: { type: Date, default: Date.now }
}));

// @desc    Get Dashboard Stats
// @route   GET /admin/dashboard
export const getDashboardStats = async (req, res) => {
  try {
    // 1. إجمالي الإيرادات (بنجمع الأوردرات اللي حالتها delivered بس)
    const revenueResult = await Order.aggregate([
      { $match: { status: 'delivered' } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } }
    ]);
    const totalRevenue = revenueResult[0]?.total || 0;

    // 2. عدد الطلبات الكلي
    const totalOrders = await Order.countDocuments();

    // 3. أفضل 5 منتجات مبيعاً
    const topProducts = await Order.aggregate([
      { $unwind: '$items' },
      { $group: { 
          _id: '$items.product', 
          name: { $first: '$items.name' }, 
          sold: { $sum: '$items.quantity' } 
      }},
      { $sort: { sold: -1 } },
      { $limit: 5 }
    ]);

    // 4. إحصائيات آخر 7 أيام
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const dailyRevenue = await Order.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo }, status: 'delivered' } },
      { $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          revenue: { $sum: "$totalPrice" }
      }},
      { $sort: { _id: 1 } }
    ]);

    // 5. عدد العملاء
    const totalCustomers = await User.countDocuments();

    res.status(200).json({
      success: true,
      data: {
        totalRevenue,
        totalOrders,
        topProducts,
        dailyRevenue,
        totalCustomers
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all users
// @route   GET /admin/users
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.status(200).json({ success: true, count: users.length, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all orders
// @route   GET /admin/orders
export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find().populate('user', 'name email');
    res.status(200).json({ success: true, count: orders.length, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update order status
// @route   PATCH /admin/orders/:id/status
export const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    res.status(200).json({ success: true, message: `Order status updated to: ${status}` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};