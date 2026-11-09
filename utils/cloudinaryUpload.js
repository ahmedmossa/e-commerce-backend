//وده هيكون مسؤول عن 3 حاجات:
// يستقبل الصورة من Multer على هيئة buffer.
// يرفع الصورة من الـ buffer إلى Cloudinary باستخدام upload_stream.
// يرجّع لنا بيانات الصورة، وأهمها:
// secure_url: رابط الصورة اللي هنستخدمه في عرضها.
// public_id: المعرّف اللي هنحتاجه لو
////////////////////////////////////////////
import cloudinary from "../config/cloudinary.js";

const uploadToCloudinary = (buffer, folder = "ecommerce") => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }

        if (!result?.secure_url || !result?.public_id) {
          return reject(
            new Error("Cloudinary upload returned an invalid result")
          );
        }

        resolve({
          url: result.secure_url,
          public_id: result.public_id,
        });
      }
    );

    uploadStream.end(buffer);
  });
};

export default uploadToCloudinary;