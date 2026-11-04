import mongoose from "mongoose";
import validator from "validator"
const otpSchema = mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,

        validate(val) {
            if (!validator.isEmail(val)) {
                throw new Error('Invalid email address. Please enter a valid email address.');
            }
        }
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
    userData: {
        type: mongoose.Schema.Types.Mixed,
        required: true,
    },
    attempts: {
        type: Number,
        default: 0,
        min: 0
    }
})

const OTP = mongoose.model("OTP", otpSchema);
export default OTP;