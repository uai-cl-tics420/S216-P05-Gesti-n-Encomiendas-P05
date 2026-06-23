import { prisma } from "../lib/prisma.ts";
import bcrypt from "bcryptjs";
import { sendOTPEmail } from "../lib/mail.js";
export async function POST(request) {
  try {
    const { email, password } = await request.json();

    const user = await prisma.user.findFirst({
      where: { email }
    });
    if (!user || !user.password) {
      return Response.json(
        { error: "Credenciales inválidas" },
        { status: 401 }
      );
    }
    const valid = await bcrypt.compare(
      password,
      user.password
    );

    if (!valid) {
      return Response.json(
        { error: "Credenciales inválidas" },
        { status: 401 }
      );
    }
    // Generar OTP de 6 dígitos
    const code = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    // Eliminar OTPs anteriores
    await prisma.otpCode.deleteMany({
      where: {
        userId: user.id,
        used: false,
      },
    });
    // Guardar OTP
    await prisma.otpCode.create({
      data: {
        userId: user.id,
        code,
        expiresAt: new Date(
          Date.now() + 2 * 60 * 1000
        ),
      },
    });
    // Para pruebas
    console.log(
      `\n========================`
    );
    console.log(
      `OTP para ${user.email}`
    );
    console.log(
      `Código: ${code}`
    );
    console.log(
      `Expira en 2 minutos`
    );
    console.log(
      `=\n`
    );
    // Enviar OTP por correo
    await sendOTPEmail(
      user.email,
      code
    );

    return Response.json({
      otpRequired: true,
      userId: user.id,
      email: user.email,
      message: "Código OTP enviado",
    });

  } catch (error) {
    console.error(error);

    return Response.json(
      { error: "Error al iniciar sesión" },
      { status: 500 }
    );
  }
}