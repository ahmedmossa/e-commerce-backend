import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import ApiError from './utils/apiError.js';
import errorMiddleware from './middlewares/errorMiddleware.js';

// 1. تفعيل الـ Middlewares الأساسية
app.use(cors());         // لفتح السماحيات للربط مع الـ Frontend
app.use(express.json()); // لتمكين السيرفر من قراءة بيانات JSON المرسلة في الـ Requests

//2. تفعيل morgan لمراقبة الـ Requests (باستخدام صيغة dev للتطوير)
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));  // لمراقبة وطباعة طلبات HTTP في الـ Terminal أثناء التطوير
}

//3. مسار تجريبي (Test Route) للتأكد من عمل السيرفر
app.get('/', (req, res) => {
    res.status(200).json({ success: true, message: 'E-Commerce API is running successfully! 🚀' });
});


//4. معالجة المسارات غير الموجودة (404) وتمريرها لصائد الأخطاء المركزي
app.use((req, res, next) => {
  next(new ApiError(`Can't find this route: ${req.originalUrl}`, 404));
});

//5. صائد الأخطاء المركزي (يجب أن يكون في النهاية)
app.use(errorMiddleware);

export default app;