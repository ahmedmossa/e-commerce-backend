# Koda Store E-Commerce Backend - System Architecture & Master Roadmap
**المرجع الهندسي الرسمي لفريق (SEF Academy - Core Team 6)**  
*Team Leader:* م. أحمد إبراهيم موسى[cite: 10]

---

## 1. شجرة الهيكل البرمجي للمشروع (Project Architecture Tree)
```text
ecommerce-api/
├── config/
│   ├── db.js                # اتصال قاعدة بيانات MongoDB Atlas
│   ├── cloudinary.js        # إعدادات رفع الصور السحابية
│   └── stripe.js            # تهيئة عميل المدفوعات Stripe (يعتمد على متغيرات البيئة)
├── models/
│   ├── User.model.js        # بيانات المستخدمين والصلاحيات والعناوين
│   ├── Product.model.js     # المنتجات والأسعار والمراجعات والمخزون
│   ├── category.model.js    # الأقسام الرئيسية للمتجر
│   ├── subCategory.model.js # التصنيفات الفرعية
│   ├── brand.model.js       # العلامات التجارية
│   ├── Cart.model.js        # سلة المشتريات والكوبونات والـ Virtuals
│   ├── Order.model.js       # دورة حياة الطلبات وعناوين الشحن والضرائب
│   ├── Wishlist.model.js    # قائمة المنتجات المفضلة
│   ├── paymentLog.model.js  # سجلات المعاملات المالية والـ Webhooks
│   └── OTP.model.js         # وثائق التحقق المؤقتة عبر البريد
├── controllers/
│   ├── auth.controller.js   # التسجيل، التحقق OTP، ودخول وخروج المستخدمين
│   ├── user.controller.js   # إدارة الملف الشخصي ودفتر العناوين للمستخدم
│   ├── product.controller.js# الكتالوج، البحث المتقدم، ومراجعات المنتجات (Reviews)
│   ├── category.controller.js# إدارة الأقسام الرئيسية والفرعية
│   ├── brand.controller.js  # إدارة العلامات التجارية
│   ├── cart.controller.js   # إدارة السلة، المخزون اللحظي، وتطبيق الكوبونات
│   ├── order.controller.js  # إنشاء الطلبات عبر Transactions وتتبع الحالات
│   ├── payment.controller.js# جلسات Stripe PaymentIntent وتأكيد Webhooks بأمان
│   ├── wishlist.controller.js# إدارة المنتجات المفضلة
│   └── admin.controller.js  # صلاحيات الأدمن واستعلامات الإحصائيات (Aggregation Pipelines)
├── routes/
│   ├── auth.routes.js       # مسارات المصادقة
│   ├── user.routes.js       # مسارات إدارة الملف الشخصي والعناوين
│   ├── product.routes.js    # مسارات الكتالوج وتقييمات المنتجات (Reviews)
│   ├── cart.routes.js       # مسارات السلة وإدارة الكوبونات
│   ├── order.routes.js      # مسارات الطلبات وتتبعها
│   ├── wishlist.routes.js   # مسارات المفضلات
│   ├── admin.routes.js      # مسارات لوحة التحكم والإدارة الاستعلامية
│   ├── category.routes.js   # مسارات الأقسام
│   ├── brand.routes.js      # مسارات العلامات التجارية
│   └── payment.routes.js    # مسارات الدفع والـ Webhooks
├── middlewares/
│   ├── auth.middleware.js   # التحقق من توكن JWT والجلسة
│   ├── role.middleware.js   # حوكمة الصلاحيات (Admin vs User)
│   ├── validator.middleware.js# التحقق من المدخلات عبر Joi
│   ├── upload.middleware.js # وسيط رفع الصور عبر Multer
│   └── errorMiddleware.js   # صائد الأخطاء المركزي الموحد
├── validations/
│   ├── auth.validation.js   # فحص بيانات المصادقة
│   ├── user.validation.js   # فحص بيانات البروفايل والعناوين
│   ├── product.validation.js# فحص بيانات المنتجات والأسعار
│   ├── cart.validation.js   # فحص كميات عناصر السلة
│   ├── order.validation.js  # فحص عناوين الشحن والطلبات
│   └── coupon.validation.js # فحص أكواد الخصم
└── utils/
    ├── apiError.js          # كلاس الأخطاء المخصص للـ HTTP
    ├── asyncHandler.js      # معالج الأخطاء التلقائي للـ Controllers
    ├── generateTokens.js    # توليد توكنات المصادقة
    ├── sendEmail.js         # خدمة البريد المركزي للإشعارات و OTP
    └── apiFeatures.js       # خوارزمية البحث والفلترة والترقيم












    

## جدول توزيع التراكات، المسؤولين، وشجرة الملفات الخاصة بكل تراك


<div align="center">

# 🚀 Koda Store E-Commerce Backend
### **System Architecture & Master Roadmap**
**المرجع الهندسي الرسمي لفريق (SEF Academy - Core Team 6)**  
*Team Leader:* **م. أحمد إبراهيم موسى**

---
✨ *هذا المستند يمثل الهيكل الهندسي المتكامل وخارطة طريق العمل لجميع تراكات المشروع* ✨
</div>

---

## 🛠️ جدول توزيع التراكات، أرقامها، وأصحابها وشجرة الملفات الخاصة بكل تراك

---

### 🔹 Track 01 (Infrastructure) — المسؤول: م. أحمد إبراهيم (Team Leader)🔹
* **📁 الشجرة والملفات الخاصة بالتراك:**
```text
config/
└── db.js                # 🔌 اتصال قاعدة بيانات MongoDB Atlas
server.js                # 🌐 خادم الاستماع
index.js                 # 🚀 نقطة انطلاق وتصدير تطبيق Express
.env.example             # 🔒 قالب المتغيرات البيئية السرية
utils/
├── asyncHandler.js      # ⚙️ معالج الأخطاء التلقائي للـ Controllers
└── apiError.js          # ⚠️ كلاس الأخطاء المخصص للـ HTTP
middlewares/
└── errorMiddleware.js   # 🛡️ صائد الأخطاء المركزي الموحد


####Track 02 (Auth & User Management) - المسؤول: م. أحمد سمير مصطفي مخيمر🔹

models/
├── User.model.js        # 👤 بيانات المستخدمين والصلاحيات
└── OTP.model.js         # 🔑 وثائق التحقق المؤقتة عبر البريد
controllers/
└── auth.controller.js   # ⚙️ التسجيل، التحقق OTP، ودخول وخروج المستخدمين
routes/
└── auth.routes.js       # 🛣️ مسارات المصادقة
middlewares/
├── auth.middleware.js   # 🔐 التحقق من توكن JWT والجلسة
└── role.middleware.js   # 👑 حوكمة الصلاحيات (Admin vs User)
validations/
└── auth.validation.js   # ✅ فحص بيانات المصادقة
utils/
├── generateTokens.js    # 🎟️ توليد توكنات المصادقة
└── sendEmail.js         # 📧 خدمة البريد المركزي للإشعارات و OTP





###Track 03 (User Profiles & Addresses) - المسؤول: م. زياد أحمد سمير عبده🔹

routes/
└── user.routes.js       # 🛣️ مسارات إدارة الملف الشخصي والعناوين
controllers/
└── user.controller.js   # ⚙️ إدارة الملف الشخصي ودفتر العناوين للمستخدم
validations/
└── user.validation.js   # ✅ فحص بيانات البروفايل والعناوين



###Track 04 (Cloudinary Service & Categories, Brands) - المسؤول: م. محمد أبو سمرة محي الدين🔹

config/
└── cloudinary.js        # ☁️ إعدادات رفع الصور السحابية
models/
├── category.model.js    # 📑 الأقسام الرئيسية للمتجر
├── subCategory.model.js # 📂 التصنيفات الفرعية
└── brand.model.js       # 🏷️ العلامات التجارية
routes/
├── category.routes.js   # 🛣️ مسارات الأقسام
└── brand.routes.js      # 🛣️ مسارات العلامات التجارية
controllers/
├── category.controller.js# ⚙️ إدارة الأقسام الرئيسية والفرعية
└── brand.controller.js  # ⚙️ إدارة العلامات التجارية
middlewares/
└── upload.middleware.js # 📤 وسيط رفع الصور عبر Multer






###Track 05 (Reviews & Products CRUD, Search) - المسؤول: م. عبد الرحمن حاتم محمد🔹


models/
└── Product.model.js     # 🛍️ المنتجات والأسعار والمراجعات والمخزون
controllers/
└── product.controller.js# ⚙️ الكتالوج، البحث المتقدم، ومراجعات المنتجات (Reviews)
routes/
└── product.routes.js    # 🛣️ مسارات الكتالوج وتقييمات المنتجات (Reviews)
validations/
└── product.validation.js# ✅ فحص بيانات المنتجات والأسعار
utils/
└── apiFeatures.js       # 🔍 خوارزمية البحث والفلترة والترقيم



###Track 06 (Coupons & Shopping Cart, Inventory) - المسؤول: م. رحمة محمود شعيب🔹


models/
└── Cart.model.js        # 🛒 سلة المشتريات والكوبونات والـ Virtuals
controllers/
└── cart.controller.js   # ⚙️ إدارة السلة، المخزون اللحظي، وتطبيق الكوبونات
routes/
└── cart.routes.js       # 🛣️ مسارات السلة وإدارة الكوبونات
validations/
├── cart.validation.js   # ✅ فحص كميات عناصر السلة
└── coupon.validation.js # ✅ فحص أكواد الخصم




###Track 07 (Wishlist Management) - المسؤول: م. بتول أحمد الخليف🔹

models/
└── Wishlist.model.js    # ❤️ قائمة المنتجات المفضلة
controllers/
└── wishlist.controller.js# ⚙️ إدارة المنتجات المفضلة
routes/
└── wishlist.routes.js   # 🛣️ مسارات المفضلات



###Track 08 (Mongoose Transactions & Orders) - المسؤول: م. عمر أشرف عبد الغني أبو المجد🔹

models/
└── Order.model.js       # 📦 دورة حياة الطلبات وعناوين الشحن والضرائب
controllers/
└── order.controller.js  # ⚙️ إنشاء الطلبات عبر Transactions وتتبع الحالات
routes/
└── order.routes.js      # 🛣️ مسارات الطلبات وتتبعها
validations/
└── order.validation.js  # ✅ فحص عناوين الشحن والطلبات


###Track 09 (Online Payment Gateways - Stripe PaymentIntent) - المسؤول: م. ديما سامح صالح الفقعاوي🔹

config/
└── stripe.js            # 💳 تهيئة عميل المدفوعات Stripe
models/
└── paymentLog.model.js  # 📊 سجلات المعاملات المالية والـ Webhooks
controllers/
└── payment.controller.js# ⚙️ جلسات Stripe PaymentIntent وتأكيد Webhooks بأمان
routes/
└── payment.routes.js    # 🛣️ مسارات الدفع والـ Webhooks






###Track 10 (Analytics & Admin Dashboard) - المسؤول: م. إيثار أحمد عبد التواب علي🔹

controllers/
└── admin.controller.js  # 📈 صلاحيات الأدمن واستعلامات الإحصائيات (Aggregation Pipelines)
routes/
└── admin.routes.js      # 🛣️ مسارات لوحة التحكم والإدارة الاستعلامية





###Track 11 (Integration Testing & System Audit) - المسؤول: م. أماني عرفة🌟

docs/
├── 01-System-Architecture-Roadmap.md
├── 02-Integration-Test-Scenarios.md
├── 03-Bugs-Review-Report.md
└── 04-Security-Payment-Audit.md
tests/
└── integration.test.js  # 🧪 اختبارات التكامل الآلية عبر Jest & Supertest