import express from 'express';
import { protect } from '../middlewares/mock.auth.js'; 
import { restrictTo } from '../middlewares/mock.auth.js';
import { 
  getDashboardStats, 
  getAllUsers, 
  getAllOrders, 
  updateOrderStatus,
  deleteUser,
  deleteOrder
} from '../controllers/admin.controller.js';

const router = express.Router();

// تأمين المسارات
router.use(protect);
router.use(restrictTo('admin'));

// المسارات
router.get('/test', (req, res) => {
  res.status(200).json({ message: 'Admin route is working!' });
});

router.get('/dashboard', getDashboardStats);
router.get('/users', getAllUsers);
router.get('/orders', getAllOrders);
router.patch('/orders/:id/status', updateOrderStatus);
router.delete('/users/:id', deleteUser);
router.delete('/orders/:id', deleteOrder);

export default router;