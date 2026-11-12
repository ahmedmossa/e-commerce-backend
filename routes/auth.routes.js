import express from 'express'
import { changePassword_sendOTP, changePassword_verifyOTP, ForgetPassword_sendOTP, forgetPassword_verifyOTP, GET_me, Login, LogOut, Register, Verify_OTP } from '../controllers/auth.controller.js';
import Auth from '../middlewares/auth.middleware.js';
import { changePassword_OTP_Validation, changePasswordValidation, forgetPasswordValidation, forgetPasswordValidation_verifyOTP, loginValidation, registerValidation, validate, verifyOTP_register_Validation } from '../validations/auth.validation.js';

const userRouters = express.Router();


// REGISTER
userRouters.post('/auth/register/send-otp', validate(registerValidation), Register)

// OTP 
userRouters.post('/auth/verify-otp', validate(verifyOTP_register_Validation), Verify_OTP);

// login
userRouters.post('/auth/login',validate(loginValidation), Login)

// Me
userRouters.get("/auth/me", Auth, GET_me)

// logOut
userRouters.delete("/auth/logout", Auth, LogOut)

// forgetPassword
userRouters.post("/auth/forgotpassword/send-otp",validate(forgetPasswordValidation), ForgetPassword_sendOTP)

// set a new password
userRouters.post("/auth/forgotpassword/verify-otp",validate(forgetPasswordValidation_verifyOTP), forgetPassword_verifyOTP)

// changePassword - sendOTP
userRouters.post("/auth/change-password/send-otp",validate(changePasswordValidation), Auth, changePassword_sendOTP)

// changePassword - verifyOTP
userRouters.patch("/auth/change-password/verify-otp",validate(changePassword_OTP_Validation), Auth, changePassword_verifyOTP)


export default userRouters;