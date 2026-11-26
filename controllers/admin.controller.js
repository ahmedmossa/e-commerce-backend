import User from '../models/User.model.js';
import Order from '../models/Order.model.js';

// ==================== Dashboard ====================

// @desc    Get Dashboard Stats
// @route   GET /admin/dashboard
// @access  Admin
export const getDashboardStats = async (req, res, next) => {
  try {
    // 1. إجمالي الإيرادات (الأوردرات delivered بس)
    const revenueResult = await Order.aggregate([
      { $match: { status: 'delivered' } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } }
    ]);
    const totalRevenue = revenueResult[0]?.total || 0;

    // 2. حساب معدل النمو (Growth Rate) - مقارنة الشهر الحالي باللي فات
    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const thisMonthRevenueResult = await Order.aggregate([
      { $match: { status: 'delivered', createdAt: { $gte: startOfThisMonth } } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } }
    ]);
    const thisMonthRevenue = thisMonthRevenueResult[0]?.total || 0;

    const lastMonthRevenueResult = await Order.aggregate([
      { $match: { status: 'delivered', createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } }
    ]);
    const lastMonthRevenue = lastMonthRevenueResult[0]?.total || 0;

    let growthRate = 0;
    if (lastMonthRevenue > 0) {
      growthRate = ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100;
    } else if (thisMonthRevenue > 0) {
      growthRate = 100; // لو مفيش إيرادات الشهر اللي فات، النمو 100% مبدئياً
    }

    // 3. عدد الطلبات الكلي + إحصائيات الحالات (Order Status Counts)
    const totalOrders = await Order.countDocuments();
    
    const orderCountsResult = await Order.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    
    // تحويل النتيجة لشكل يسهل على الـ Frontend استخدامه
    const orderStatusCounts = {};
    orderCountsResult.forEach(item => {
      orderStatusCounts[item._id] = item.count;
    });

    // 4. أفضل 5 منتجات مبيعاً (sold + revenue)
    const topProducts = await Order.aggregate([
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          name: { $first: '$items.name' },
          sold: { $sum: '$items.quantity' },
          revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
        }
      },
      { $sort: { sold: -1 } },
      { $limit: 5 },
      { $project: { _id: 1, name: 1, sold: 1, revenue: 1 } }
    ]);

    // 5. إيرادات آخر 7 أيام
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const dailyRevenue = await Order.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo }, status: 'delivered' } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$totalPrice' }
        }
      },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, date: '$_id', revenue: 1 } }
    ]);

    // 6. آخر 5 طلبات
    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate({ path: 'user', select: 'username email', strictPopulate: false });

    // 7. عدد العملاء (role = customer)
    const totalCustomers = await User.countDocuments({ role: 'customer' });

    // الرد النهائي
    res.status(200).json({
      success: true,
      data: {
        totalRevenue,
        growthRate,
        totalOrders,
        orderStatusCounts,
        topProducts,
        dailyRevenue,
        recentOrders,
        totalCustomers
      }
    });
  } catch (error) {
    next(error);
  }
};

// ==================== Users Management ====================

// @desc    Get all users (with Pagination)
// @route   GET /admin/users
// @access  Admin
export const getAllUsers = async (req, res, next) => {
  try {
    const query = req.validatedQuery || req.query;
    const page = Math.max(parseInt(query.page) || 1, 1);
    const limit = Math.min(parseInt(query.limit) || 10, 100);
    const skip = (page - 1) * limit;

    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalUsers = await User.countDocuments();

    res.status(200).json({
      success: true,
      count: users.length,
      total: totalUsers,
      page,
      pages: Math.ceil(totalUsers / limit),
      data: users
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single user
// @route   GET /admin/users/:id
// @access  Admin
export const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user role
// @route   PATCH /admin/users/:id
// @access  Admin
export const updateUser = async (req, res, next) => {
  try {
    const { role } = req.body;
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot change your own role' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user
// @route   DELETE /admin/users/:id
// @access  Admin
export const deleteUser = async (req, res, next) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot delete yourself' });
    }
    
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.status(200).json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// ==================== Orders Management ====================

// @desc    Get all orders (with Pagination)
// @route   GET /admin/orders
// @access  Admin
export const getAllOrders = async (req, res, next) => {
  try {
    const query = req.validatedQuery || req.query;
    const page = Math.max(parseInt(query.page) || 1, 1);
    const limit = Math.min(parseInt(query.limit) || 10, 100);
    const skip = (page - 1) * limit;
    const statusFilter = query.status ? { status: query.status } : {};

    const orders = await Order.find(statusFilter)
      .populate({ path: 'user', select: 'username email', strictPopulate: false })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalOrders = await Order.countDocuments(statusFilter);

    res.status(200).json({
      success: true,
      count: orders.length,
      total: totalOrders,
      page,
      pages: Math.ceil(totalOrders / limit),
      data: orders
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single order
// @route   GET /admin/orders/:id
// @access  Admin
export const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate({ path: 'user', select: 'username email', strictPopulate: false });
    
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    res.status(200).json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

// @desc    Update order status
// @route   PATCH /admin/orders/:id/status
// @access  Admin
export const updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );
    
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    
    res.status(200).json({
      success: true,
      message: `Status updated to ${status}`,
      data: order
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete order
// @route   DELETE /admin/orders/:id
// @access  Admin
export const deleteOrder = async (req, res, next) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    res.status(200).json({ success: true, message: 'Order deleted successfully' });
  } catch (error) {
    next(error);
  }
};