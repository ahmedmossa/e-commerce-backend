import express from 'express';
import { Auth } from '../middlewares/auth.middleware.js';
import { adminOnly } from '../middlewares/role.middleware.js';
import { 
  getDashboardStats, 
  getAllUsers, 
  getUserById,
  updateUser,
  deleteUser,
  getAllOrders, 
  getOrderById,
  updateOrderStatus,
  deleteOrder
} from '../controllers/admin.controller.js';

const router = express.Router();

// تأمين المسارات
router.use(Auth);
router.use(adminOnly);

router.get('/dashboard', getDashboardStats);
router.get('/users', getAllUsers);
router.get('/users/:id', getUserById);
router.patch('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);
router.get('/orders', getAllOrders);
router.get('/orders/:id', getOrderById);
router.patch('/orders/:id/status', updateOrderStatus);
router.delete('/orders/:id', deleteOrder);

export default router;