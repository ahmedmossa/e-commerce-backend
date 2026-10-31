import crypto from "node:crypto";

export const generateOTP = () => {
    return crypto
        .randomInt(0, 1_000_000)
        .toString()
        .padStart(6, "0");
};

export const hashOTP = (otp) => {
    return crypto
        .createHash("sha256")
        .update(otp)
        .digest("hex");
};