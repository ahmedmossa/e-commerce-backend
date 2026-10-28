const errorMiddleware = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    res.status(err.statusCode).json({
      success: false,
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  } 
  
  // في بيئة الإنتاج: التمييز بين الأخطاء التشغيلية المعروفة والداخلية غير المتوقعة
  if (err.isOperational) {
    res.status(err.statusCode).json({
      success: false,
      status: err.status,
      message: err.message,
    });
  } else {
    // الخطأ غير متوقع: تسجيل التفاصيل على السيرفر وإرجاع رسالة عامة لمنع تسريب الأسرار
    console.error('ERROR 💥:', err);
    res.status(500).json({
      success: false,
      status: 'error',
      message: 'Internal Server Error',
    });
  }
};
export default errorMiddleware;
