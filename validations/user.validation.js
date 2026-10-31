import Joi from 'joi';
import ApiError from '../utils/apiError.js';

// ───────────────────────── Schemas ─────────────────────────

export const updateProfileSchema = Joi.object({
  username: Joi.string().trim().min(2).max(50),
  phone: Joi.string()
    .trim()
    .pattern(/^\+?[0-9]{8,15}$/)
    .message('phone must contain 8 to 15 digits, optionally starting with +'),
  avatar: Joi.string().trim().uri(),
}).min(1);

const addressFields = {
  label: Joi.string().valid('home', 'work', 'other'),
  fullName: Joi.string().trim().min(2).max(100),
  phone: Joi.string()
    .trim()
    .pattern(/^\+?[0-9]{8,15}$/)
    .message('phone must contain 8 to 15 digits, optionally starting with +'),
  country: Joi.string().trim().max(60),
  city: Joi.string().trim().max(60),
  address: Joi.string().trim().min(5).max(200),
  postalCode: Joi.string().trim().max(20).allow(''),
};

export const addAddressSchema = Joi.object({
  ...addressFields,
  fullName: addressFields.fullName.required(),
  phone: addressFields.phone.required(),
  country: addressFields.country.default('Egypt'),
  city: addressFields.city.required(),
  address: addressFields.address.required(),
  isDefault: Joi.boolean(),
});

export const updateAddressSchema = Joi.object({
  ...addressFields,
  isDefault: Joi.boolean().valid(true),
}).min(1);

// الـ :addressId في الرابط لازم يكون ObjectId صالح (24 حرف hex)
export const addressIdParamsSchema = Joi.object({
  addressId: Joi.string().hex().length(24).required(),
});

// ───────────────────────── Middleware ─────────────────────────

export const validate =
  (schema, source = 'body') =>
  (req, res, next) => {
    const { error, value } = schema.validate(req[source], {
      abortEarly: false,
      convert: true,
    });

    if (error) {
      const message = error.details.map((d) => d.message.replace(/"/g, '')).join(', ');
      return next(new ApiError(message, 400));
    }

    if (source === 'body') req.body = value;
    next();
  };