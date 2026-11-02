import express from 'express';
// بنستورد من الموك عشان الزميل لسه مخلصش
import { protect, restrictTo } from '../middlewares/mock.auth.js'; 
import { 
  getDashboardStats, 
  getAllUsers, 
  getAllOrders, 
  updateOrderStatus 
} from '../controllers/admin.controller.js';

const router = express.Router();

// تأمين كل المسارات (باستخدام الموك)
router.use(protect);
router.use(restrictTo('admin'));

// مسار تجريبي
router.get('/test', (req, res) => {
  res.status(200).json({ message: 'Admin route is protected and working with Mock!' });
});

// مسارات لوحة التحكم
router.get('/dashboard', getDashboardStats);
router.get('/users', getAllUsers);
router.get('/orders', getAllOrders);
router.patch('/orders/:id/status', updateOrderStatus);

export default router;