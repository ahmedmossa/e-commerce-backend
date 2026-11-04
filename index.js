import express from 'express';
import morgan from 'morgan';
import cors from 'cors';

// 1. استيراد مسارات الروتس (Routes) الخاصة بالفريق
// import authRoutes from './routes/auth.routes.js';
// import userRoutes from './routes/user.routes.js';
// import productRoutes from './routes/product.routes.js';
// import categoryRoutes from './routes/category.routes.js';
// import brandRoutes from './routes/brand.routes.js';
// import cartRoutes from './routes/cart.routes.js';
// import wishlistRoutes from './routes/wishlist.routes.js';
// import orderRoutes from './routes/order.routes.js';
// import paymentRoutes from './routes/payment.routes.js';
// import adminRoutes from './routes/admin.routes.js';

// استيراد معالج الأخطاء
import ApiError from './utils/apiError.js';
import errorMiddleware from './middlewares/errorMiddleware.js';

// إنشاء تطبيق Express
const app = express();

// ==========================================
// 1. Middlewares (الإعدادات الوسيطة الأساسية)
// ==========================================
app.use(cors());
app.use(express.json({ limit: '10kb' })); // تحديد حجم البيانات المرسلة للـ Body

// تفعيل Morgan لمراقبة الطلبات أثناء التطوير فقط
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// ==========================================
// 2. Test Route (مسار تجريبي للتأكد من السيرفر)
// ==========================================
app.get('/', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'E-Commerce API is running successfully for Core Team 6! 🚀',
    });
});

// ==========================================
// 3. API Routes (ربط مسارات النظام بالكامل)
// ==========================================
// const API_VERSION = '/api/v1';

// app.use(`${API_VERSION}/auth`, authRoutes);
// app.use(`${API_VERSION}/users`, userRoutes);
// app.use(`${API_VERSION}/products`, productRoutes);
// app.use(`${API_VERSION}/categories`, categoryRoutes);
// app.use(`${API_VERSION}/brands`, brandRoutes);
// app.use(`${API_VERSION}/cart`, cartRoutes);
// app.use(`${API_VERSION}/wishlist`, wishlistRoutes);
// app.use(`${API_VERSION}/orders`, orderRoutes);
// app.use(`${API_VERSION}/payment`, paymentRoutes);
// app.use(`${API_VERSION}/admin`, adminRoutes);

// ==========================================
// 4. Handle Unhandled Routes (التعامل مع المسارات غير الموجودة)
// ==========================================
app.all('*', (req, res, next) => {
    next(new ApiError(`Can't find this route: ${req.originalUrl}`, 404));
});

// ==========================================
// 5. Global Error Handling Middleware (معالج الأخطاء العام)
// ==========================================
app.use(errorMiddleware);

// تصدير التطبيق ليتم استخدامه في ملف التشغيل (server.js)
export default app;