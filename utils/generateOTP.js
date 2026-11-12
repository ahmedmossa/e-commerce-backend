import crypto from "node:crypto";

export const generateOTP = () => {
    return crypto
        .randomInt(0, 1_000_000)
        .toString()
        .padStart(6, "0");
};

export const hashOTP = (otp) => {
    const secret = process.env.OTP_SECRET;

    if (!secret) {
        throw new Error("OTP_SECRET is not configured");
    }
    
    return crypto
        .createHmac("sha256",secret)
        .update(otp).digest("hex");
};