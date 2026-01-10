import "dotenv/config";
import nodemailer from "nodemailer";

export async function sendEmailReply({
    to,
    subject,
    body,
}: {
    to: string;
    subject: string;
    body: string;
}) {
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_APP_PASSWORD,
        },
    });

    const mailOptions = {
        from: `"Inbox AI" <${process.env.EMAIL_USER}>`,
        to,
        subject: `Re: ${subject}`,
        text: body,
    };

    await transporter.sendMail(mailOptions);

    console.log("✅ Auto-reply email sent to:", to);
}
