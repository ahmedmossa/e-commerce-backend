// 1. تحميل متغيرات البيئة من ملف .env
import 'dotenv/config';

import connectDB from './config/db.js';
import app from './index.js';

// 2. تحديد الـ Port وتشغيل السيرفر
const PORT = process.env.PORT || 5000;

// 3. إقلاع السيرفر فقط بعد نجاح الاتصال بقاعدة البيانات
connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Failed to connect to the database:', error.message);
    process.exit(1);
  });
