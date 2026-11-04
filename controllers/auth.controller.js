import bcryptjs from "bcryptjs"
import User from "../models/User.model.js"
import generateToken from "../utils/generateTokens.js"
import { generateOTP, hashOTP } from "../utils/generateOTP.js"
import sendEmail from "../utils/sendEmail.js";
import OTP from "../models/OTP.model.js";

const OTP_EXPIRE_MS = 5 * 60 * 1000;
const MAX_ATTEMPTS = 2;


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
        const passwordHash = await bcryptjs.hash(password, 8);

        const otp = generateOTP();
        const otpHash = hashOTP(otp);


        await OTP.findOneAndReplace(
            { email: normalizedEmail },
            {
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
        const userData = req.body
        if (!userData.email || !userData.password) {
            return res.status(400).json({
                success: false,
                message: 'Email and Password is required'
            })
        }
        const user = await User.findOne({ email: userData.email })
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

        const isPasswordMatch = await bcryptjs.compare(userData.password, user.password)
        if (!isPasswordMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        const token = generateToken(user._id)
        user.tokens = user.tokens.concat(token)
        //console.log(user)
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