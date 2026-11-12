import bcryptjs from "bcryptjs"
import User from "../models/User.model.js"
import generateToken from "../utils/generateTokens.js"
import { generateOTP, hashOTP } from "../utils/generateOTP.js"
import sendEmail from "../utils/sendEmail.js";
import OTP from "../models/OTP.model.js";

const OTP_EXPIRE_MS = 5 * 60 * 1000;
const MAX_ATTEMPTS = 3;

// Register
export const Register = async (req, res) => {
    try {
        const { username, email, password, phone } = req.body;

        const normalizedEmail = email.toLowerCase().trim()
        const tempUser = new User({
            username,
            email: normalizedEmail,
            password,
            phone,
        });

        const userIsExisted = await User.findOne({ email: normalizedEmail })
        if (userIsExisted) {
            return res.status(409).json({
                success: false,
                message: "Email already exists"
            });
        }

        await tempUser.validate();
        const passwordHash = await bcryptjs.hash(password, 10);

        const otp = generateOTP();
        const otpHash = hashOTP(otp);

        await OTP.findOneAndReplace(
            { email: normalizedEmail },
            {
                purpose: "register",
                email: normalizedEmail,
                otp: otpHash,
                expiresAt: new Date(Date.now() + OTP_EXPIRE_MS),
                attempts: 0,
                userData: { ...tempUser.toObject(), password: passwordHash }
            },
            { upsert: true, returnDocument: true }
        );

        await sendEmail({
            to: normalizedEmail,
            subject: "Verify your email",
            text: `Your verification code is ${otp}. It expires in 5 minutes.`
        });

        return res.status(201).json({
            success: true,
            message: "OTP sent successfully. Please check your email."
        });
    } catch (error) {
        res.status(500).send({
            message: error.message
        })
    }
}

// Verify OTP
export const Verify_OTP = async (req, res) => {
    try {
        const { email, otp } = req.body;

        const pending = await OTP.findOne({ email: email.toLowerCase().trim() });
        if (!pending) {
            return res.status(400).json({
                success: false,
                message: "No pending registration found or it expired. Please register again."
            });
        }

        if (pending.expiresAt < new Date()) {
            await OTP.deleteOne({ _id: pending._id });

            return res.status(400).json({
                success: false,
                message: "OTP expired. Please register again."
            });
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
}

// Login Function
export const Login = async (req, res) => {
    try {
        const { email, password } = req.body

        const normalizedEmail = email.toLowerCase().trim()
        const user = await User.findOne({ email: normalizedEmail })
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Email or password invalid'
            })
        }

        if (!user.isVerified) {
            return res.status(403).json({
                success: false,
                message: 'User is not verified'
            })
        }

        const isPasswordMatch = await bcryptjs.compare(password, user.password)
        if (!isPasswordMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        const token = generateToken(user._id)
        user.tokens = user.tokens.concat(token)
        await user.save()

        return res.status(200).json({
            success: true,
            message: 'Login successful',
            token
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}

// GET / me
export const GET_me = async (req, res) => {
    try {
        const user = req.user
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
        }

        res.status(200).json({
            success: true,
            user: user
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}

// logOut function
export const LogOut = async (req, res) => {
    try {
        const user = req.user
        user.tokens = user.tokens.filter((token) => token !== req.token)
        await user.save()
        return res.status(200).json({
            success: true,
            message: "Success LogOut"
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Require Auth"
        });
    }
}

// forgotpassword - sendOTP
export const ForgetPassword_sendOTP = async (req, res) => {
    try {
        const { email } = req.body

        const normalizedEmail = email.toLowerCase().trim()

        const userIsExisted = await User.findOne({ email: normalizedEmail })
        if (!userIsExisted) {
            return res.status(404).json({
                success: false,
                message: "Email is Not found"
            });
        }

        const otp = generateOTP();
        const otpHash = hashOTP(otp);

        await OTP.findOneAndReplace(
            { email: normalizedEmail },
            {
                email: normalizedEmail,
                otp: otpHash,
                expiresAt: new Date(Date.now() + OTP_EXPIRE_MS),
                attempts: 0,
                purpose: "forgotPassword",
                userData: { email: normalizedEmail }
            },
            { upsert: true, returnDocument: true }
        );

        await sendEmail({
            to: normalizedEmail,
            subject: "Password Reset Verification Code",
            text: `Your password reset verification code is ${otp}. This code will expire in 5 minutes. If you didn't request a password reset, please ignore this email.`
        });

        return res.status(200).json({
            success: true,
            messgae: "OTP sent successfully. Please check your email."
        })

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        })
    }
}
// forgetPassword - verifyOTP
export const forgetPassword_verifyOTP = async (req, res) => {
    try {
        const { email, newPassword, otp } = req.body

        const normalizedEmail = email.toLowerCase().trim()
        const user = await User.findOne({ email: normalizedEmail })
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Email or password invalid'
            })
        }

        const pending = await OTP.findOne({ email: normalizedEmail, purpose: "forgotPassword" })
        if (!pending) {
            return res.status(400).json({
                success: false,
                message: "No pending registration found or it expired. Please try again."
            });
        }

        if (pending.expiresAt < new Date()) {
            await OTP.deleteOne({ _id: pending._id });

            return res.status(400).json({
                success: false,
                message: "OTP expired. Please request a new OTP."
            });
        }

        if (pending.attempts >= MAX_ATTEMPTS) {
            await OTP.deleteOne({ _id: pending._id });
            return res.status(429).json({
                success: false,
                message: "Maximum OTP verification attempts exceeded. Please request a new OTP."
            });
        }

        if (pending.otp !== hashOTP(otp)) {
            pending.attempts += 1;
            await pending.save();
            return res.status(400).json({ success: false, message: "Invalid OTP" });
        }

        user.password = newPassword
        user.tokens = []
        await user.save();

        await OTP.deleteOne({ _id: pending._id });
        return res.status(200).json({
            success: true,
            message: "Password has been reset successfully. You can now log in with your new password."
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

// changePassword - sendOTP
export const changePassword_sendOTP = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body
        const { email } = req.user


        const user = await User.findOne({ email: email })
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Email not found"
            });
        }

        const isPasswordMatch = await bcryptjs.compare(currentPassword, user.password)
        if (!isPasswordMatch) {
            return res.status(401).json({
                success: false,
                message: "Current password is incorrect"
            });
        }

        const newPasswordHash = await bcryptjs.hash(newPassword, 10);
        const otp = generateOTP();
        const otpHash = hashOTP(otp);

        await OTP.findOneAndReplace(
            { email: email },
            {
                email: email,
                otp: otpHash,
                expiresAt: new Date(Date.now() + OTP_EXPIRE_MS),
                attempts: 0,
                purpose: "changePassword",
                userData: { email, newPassword: newPasswordHash }
            },
            { upsert: true, returnDocument: true }
        );

        await sendEmail({
            to: email,
            subject: "Change Password Verification Code",
            text: `Your password change verification code is ${otp}. This code will expire in 5 minutes. If you didn't request this password change, please ignore this email and secure your account immediately.`
        });


        // ============== THE END ===============
        return res.status(200).json({
            success: true,
            messgae: "OTP sent successfully. Please check your email."
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

export const changePassword_verifyOTP = async (req, res) => {
    try {
        const { otp } = req.body
        const { email } = req.user

        const user = await User.findOne({ email: email })
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Email or password invalid'
            })
        }

        const pending = await OTP.findOne({ email: email, purpose: "changePassword" })
        if (!pending) {
            return res.status(400).json({
                success: false,
                message: "No pending password change request found. Please request a new OTP."
            });
        }

        if (pending.expiresAt < new Date()) {
            await OTP.deleteOne({ _id: pending._id });
            return res.status(400).json({
                success: false,
                message: "OTP expired. Please request a new OTP."
            });
        }

        if (pending.attempts >= MAX_ATTEMPTS) {
            await OTP.deleteOne({ _id: pending._id });
            return res.status(429).json({
                success: false,
                message: "Maximum OTP verification attempts exceeded. Please request a new OTP."
            });
        }

        if (pending.otp !== hashOTP(otp)) {
            pending.attempts += 1;
            await pending.save();
            return res.status(400).json({ success: false, message: "Invalid OTP" });
        }

        user.password = pending.userData.newPassword
        user.tokens = []
        user.$locals.passwordAlreadyHashed = true;
        await user.save()

        await OTP.deleteOne({ _id: pending._id });

        return res.status(200).json({
            success: true,
            message: "Password has been changed successfully. Please log in again with your new password."
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        })
    }
}