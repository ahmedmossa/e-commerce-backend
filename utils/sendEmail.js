import "dotenv/config";
import nodemailer from "nodemailer";

const requiredEmailConfig = ['EMAIL_HOST','EMAIL_PORT','EMAIL_USER','EMAIL_PASS'];
for (const key of requiredEmailConfig) {
    if (!process.env[key]) {
        throw new Error(`${key} is not configured`);
    }
}
const port = Number(process.env.EMAIL_PORT);

if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    throw new Error('Invalid EMAIL_PORT configuration');
}

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port,
    secure: port === 465,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

export const verifyEmailConnection = async () => {
    console.log({
        host: process.env.EMAIL_HOST,
        port,
        userConfigured: Boolean(process.env.EMAIL_USER),
        passConfigured: Boolean(process.env.EMAIL_PASS)
    });

    await transporter.verify();
    console.log("Email connection verified successfully");
};

const sendEmail = async ({ to, subject, text }) => {
    return transporter.sendMail({
        from: process.env.EMAIL_USER,
        to,
        subject,
        text
    });
};

export default sendEmail;