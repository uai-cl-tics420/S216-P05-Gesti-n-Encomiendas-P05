import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendOTPEmail(email, code) {
  try {
    await transporter.sendMail({
      from: `"InCharge" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Tu código OTP",
      html: `
        <h2>Código de verificación</h2>

        <p>Tu código es:</p>

        <h1>${code}</h1>

        <p>Este código expira en 5 minutos.</p>
      `,
    });
  } catch (error) {
    console.log(`[MAIL] Error al enviar email. OTP para ${email}: ${code}`);
  }
}