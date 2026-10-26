const express = require('express');
const dotenv = require('dotenv');

// تحميل متغيرات البيئة من ملف .env
dotenv.config();

const cors = require('cors');
const connectDB = require('./config/db');

// الاتصال بقاعدة البيانات
connectDB();

const app = express();

// Middlewares الأساسية
app.use(express.json());
app.use(cors());

// مسار تجريبي (Test Route) للتأكد من عمل السيرفر
app.get('/', (req, res) => {
    res.json({ message: 'E-Commerce API is running successfully! 🚀' });
});

// تحديد الـ Port وتشغيل السيرفر
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server is running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
