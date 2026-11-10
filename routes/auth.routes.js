import express from 'express'
import { changePassword_sendOTP, changePassword_verifyOTP, ForgetPassword_sendOTP, forgetPassword_verifyOTP, GET_me, Login, LogOut, Register, Verify_OTP } from '../controllers/auth.controller.js';
import Auth from '../middlewares/auth.middleware.js';

const userRouters = express.Router();


// REGISTER
userRouters.post('/auth/register/send-otp', Register)

// OTP 
userRouters.post('/auth/verify-otp', Verify_OTP);

// login
userRouters.post('/auth/login', Login)

// Me
userRouters.get("/auth/me", Auth, GET_me)

// logOut
userRouters.delete("/auth/logout", Auth, LogOut)

// forgetPassword
userRouters.post("/auth/forgotpassword/send-otp", ForgetPassword_sendOTP)

// set a new password
userRouters.post("/auth/forgotpassword/verify-otp", forgetPassword_verifyOTP)

// changePassword - sendOTP
userRouters.post("/auth/change-password/send-otp", Auth, changePassword_sendOTP)

// changePassword - verifyOTP
userRouters.patch("/auth/change-password/verify-otp", Auth, changePassword_verifyOTP)


export default userRouters;