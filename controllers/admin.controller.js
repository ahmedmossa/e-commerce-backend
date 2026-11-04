// استدعاء الموديلز الوهمية (هتتغيرmongo للموديلز الحقيقية لما الداتابيز تتوفر)
import { User } from '../mock-models/User.js';
import { Order } from '../mock-models/Order.js';
import { Product } from '../mock-models/Product.js';

// @desc    Get Dashboard Stats (Revenue, Top Products, etc.)
// @route   GET /admin/dashboard
export const getDashboardStats = async (req, res) => {
  try {
    /*
    // 🚧 كود الـ Aggregation الحقيقي (هيتفعل لما نغير الموديلز للموديلز الحقيقية)
    
    // 1. إجمالي الإيرادات
    const revenueResult = await Order.aggregate([
      { $match: { status: 'delivered' } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } }
    ]);
    const totalRevenue = revenueResult[0]?.total || 0;

    // 2. أفضل 5 منتجات مبيعاً
    const topProducts = await Order.aggregate([
      { $unwind: '$items' },
      { $group: { _id: '$items.product', name: { $first: '$items.name' }, sold: { $sum: '$items.quantity' } } },
      { $sort: { sold: -1 } },
      { $limit: 5 }
    ]);

    // 3. إحصائيات آخر 7 أيام
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const dailyRevenue = await Order.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo }, status: 'delivered' } },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, revenue: { $sum: "$totalPrice" } } },
      { $sort: { _id: 1 } }
    ]);
    */

    // بيانات وهمية للرد (لحد ما نربط بالداتابيز الحقيقية)
    res.status(200).json({
      success: true,
      message: 'Dashboard stats structure is ready.',
      data: { 
        totalRevenue: 15000, // قيمة وهمية للمراجعة
        totalOrders: 45,     // قيمة وهمية للمراجعة
        topProducts: [
          { name: 'Mock Product 1', sold: 20 },
          { name: 'Mock Product 2', sold: 15 }
        ],
        dailyRevenue: [
          { date: '2026-11-01', revenue: 2000 },
          { date: '2026-11-02', revenue: 3500 }
        ]
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
    res.status(200).json({ success: true, message: `Order status updated to: ${status} (Mock)` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};