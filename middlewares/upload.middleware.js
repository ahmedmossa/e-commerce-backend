import multer from "multer";
import { fileTypeFromBuffer } from "file-type";

const storage = multer.memoryStorage();

const allowedMimeTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

const fileFilter = (req, file, cb) => {
  if (!allowedMimeTypes.includes(file.mimetype)) {
    return cb(new Error("Only JPEG, PNG, and WebP images are allowed"));
  }

  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

const validateImageContent = async (req, res, next) => {
  try {
    if (!req.file) {
      return next();
    }

    const detectedType = await fileTypeFromBuffer(req.file.buffer);

    if (
      !detectedType ||
      !allowedMimeTypes.includes(detectedType.mime)
    ) {
      return next(new Error("Invalid image content"));
    }

    req.file.detectedMimeType = detectedType.mime;

    next();
  } catch (error) {
    next(error);
  }
};

export { validateImageContent };
export default upload;