import express from 'express';
import { protect } from '../middlewares/mock.auth.js'; 
import { restrictTo } from '../middlewares/mock.auth.js';
import { getAllUsers } from '../controllers/admin.controller.js';

const router = express.Router();

router.use(protect);
router.use(restrictTo('admin'));


router.get('/test', (req, res) => {
  res.status(200).json({ message: 'Admin route is protected and working with ES Modules!' });
});

router.get('/users', getAllUsers);

export default router;