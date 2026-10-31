import "dotenv/config";
import nodemailer from "nodemailer";

const port = Number(process.env.EMAIL_PORT);

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