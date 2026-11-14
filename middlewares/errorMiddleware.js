const errorMiddleware = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Handle invalid JSON payload from express.json()
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      success: false,
      message: 'Invalid JSON format',
    });
  }

  if (process.env.NODE_ENV === 'development') {
    return res.status(err.statusCode).json({
      success: false,
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  }

  // في بيئة الإنتاج: التمييز بين الأخطاء التشغيلية والداخلية
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      status: err.status,
      message: err.message,
    });
  } else {
    console.error('ERROR 💥:', err);
    return res.status(500).json({
      success: false,
      status: 'error',
      message: 'Internal Server Error',
    });
  }
};

export default errorMiddleware;