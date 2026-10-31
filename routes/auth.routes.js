import express from 'express'
import User from '../models/User.model.js';
import { generateOTP, hashOTP } from '../utils/generateOTP.js';
import sendEmail from '../utils/sendEmail.js';
import OTP from '../models/OTP.model.js';
import bcryptjs from 'bcryptjs';

const userRouters = express.Router();

const OTP_EXPIRE_MS = 5 * 60 * 1000;
const MAX_ATTEMPTS = 2;

// REGISTER
userRouters.post('/auth/register/send-otp', async (req, res) => {
    try {
        const tempUser = new User(req.body);
        //console.log(tempUser)
        const userIsExisted = await User.findOne({ email: tempUser.email })
        if (userIsExisted) {
            throw Error("Email already exists")
        }

        await tempUser.validate();
        const passwordHash = await bcryptjs.hash(tempUser.password, 8);

        const otp = generateOTP();
        const otpHash = hashOTP(otp);

        await OTP.findOneAndReplace(
            { email: tempUser.email },
            {
                email: tempUser.email,
                otp: otpHash,
                expiresAt: new Date(Date.now() + OTP_EXPIRE_MS),
                attempts: 0,
                userData: { ...tempUser.toObject(), password: passwordHash }
            },
            { upsert: true, returnDocument: true }
        );

        await sendEmail({
            to: tempUser.email,
            subject: "Verify your email",
            text: `Your verification code is ${otp}. It expires in 5 minutes.`
        });

        return res.status(201).json({
            success: true,
            message: "OTP sent successfully. Please check your email."
        });
    } catch (error) {
        res.status(401).send({
            message: error.message
        })
    }
})

// OTP 
userRouters.post('/auth/verify-otp', async (req, res) => {
    try {
        const { email, otp } = new OTP(req.body);

        if (!email || !otp) {
            return res.status(400).json({ success: false, message: "Email and OTP are required" });
        }

        const pending = await OTP.findOne({ email: email.toLowerCase().trim() });
        if (!pending) {
            return res.status(400).json({
                success: false,
                message: "No pending registration found or it expired. Please register again."
            });
        }

        if (pending.expiresAt < new Date()) {
            return res.status(400).json({ success: false, message: "OTP expired. Please request a new one." });
        }

        if (pending.attempts >= MAX_ATTEMPTS) {
            await OTP.deleteOne({ _id: pending._id });
            return res.status(429).json({ success: false, message: "Too many attempts. Please register again." });
        }

        if (pending.otp !== hashOTP(otp)) {
            pending.attempts += 1;
            await pending.save();
            return res.status(400).json({ success: false, message: "Invalid OTP" });
        }

        const user = new User({
            ...pending.userData,
            isVerified: true,
        });

        user.$locals.passwordAlreadyHashed = true;
        await user.save();

        await OTP.deleteOne({ _id: pending._id });

        return res.status(201).json({
            success: true,
            message: "Email verified. Account created successfully."
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
});

export default userRouters;