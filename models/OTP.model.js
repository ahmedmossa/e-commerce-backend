import mongoose from "mongoose";
const otpSchema = mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
    },
    otp: {
        type: String,
        required: true
    },
    expiresAt: {
        type: Date,
        required: true,
        expires: 0
    },
    purpose: {
        type: String,
        enum: ["register", "forgotPassword" , "changePassword"],
        required: true
    },
    userData: {
        type: mongoose.Schema.Types.Mixed,
        required: true,
    },
    attempts: {
        type: Number,
        default: 0,
        min: 0,
        max: 3
    }
})

const OTP = mongoose.model("OTP", otpSchema);
export default OTP;