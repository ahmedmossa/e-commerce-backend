import express from 'express'
import { Login, LogOut, Register, Verify_OTP } from '../controllers/auth.controller.js';
import Auth from '../middlewares/auth.middleware.js';

const userRouters = express.Router();


// REGISTER
userRouters.post('/auth/register/send-otp', Register)

// OTP 
userRouters.post('/auth/verify-otp', Verify_OTP);

// login
userRouters.post('/auth/login', Login)

// logOut
userRouters.delete("/auth/logout", Auth, LogOut)

export default userRouters;