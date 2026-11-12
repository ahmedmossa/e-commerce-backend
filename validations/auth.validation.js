import Joi from "joi";

// Strong Password Validation
const strongPasswordValidation = Joi.string()
    .min(8)
    .max(30)
    .pattern(/[A-Z]/)
    .pattern(/[a-z]/)
    .pattern(/[0-9]/)
    .pattern(/[^A-Za-z0-9]/)
    .required();

// Email Validation
const emailValidation = Joi.string()
    .email()
    .trim()
    .lowercase()
    .required();

const OTP_validation = Joi.string().length(6).required()

// Register Validation
export const registerValidation = Joi.object({
    email: emailValidation,
    password: strongPasswordValidation,
    username: Joi.string().required(),
    phone: Joi.string().optional()
});

// Login Validation
export const loginValidation = Joi.object({
    email: emailValidation,
    password: Joi.string().required()
});

// Forget Password Validation
export const forgetPasswordValidation = Joi.object({
    email: emailValidation
});

export const forgetPasswordValidation_verifyOTP = Joi.object({
    email: emailValidation,
    newPassword: strongPasswordValidation,
    otp: OTP_validation
});

// Change Password Validation
export const changePasswordValidation = Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: strongPasswordValidation
});

export const changePassword_OTP_Validation = Joi.object({
    otp: OTP_validation
});


export const verifyOTP_register_Validation = Joi.object({
    email: emailValidation,
    otp: OTP_validation
});


export const validate = (schema) => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.body);

        if (error) {
            return res.status(400).json({
                success: false,
                message: error.details[0].message
            });
        }

        req.body = value;

        next();
    };
};