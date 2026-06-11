import { prisma } from "../lib/prisma.ts";
import { SignJWT } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "incharge-secret-2026"
);

export async function POST(request) {
  try {
    const { userId, code } = await request.json();

    const otp = await prisma.otpCode.findFirst({
      where: {
        userId: parseInt(userId),
        used: false,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!otp) {
      return Response.json(
        { error: "No existe un código OTP válido" },
        { status: 400 }
      );
    }

    // Verificar expiración
    if (new Date() > otp.expiresAt) {
      await prisma.otpCode.update({
        where: { id: otp.id },
        data: { used: true },
      });

      return Response.json(
        { error: "Código expirado" },
        { status: 400 }
      );
    }

    // Verificar límite de intentos
    if (otp.attempts >= 3) {
      await prisma.otpCode.update({
        where: { id: otp.id },
        data: { used: true },
      });

      return Response.json(
        { error: "Máximo de intentos alcanzado" },
        { status: 400 }
      );
    }

    // Código incorrecto
    if (otp.code !== code) {
      await prisma.otpCode.update({
        where: { id: otp.id },
        data: {
          attempts: otp.attempts + 1,
        },
      });

      return Response.json(
        {
          error: `Código incorrecto. Intentos restantes: ${
            2 - otp.attempts
          }`,
        },
        { status: 400 }
      );
    }

    // Buscar usuario
    const user = await prisma.user.findUnique({
      where: {
        id: otp.userId,
      },
    });

    if (!user) {
      return Response.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    // Marcar OTP como utilizado
    await prisma.otpCode.update({
      where: {
        id: otp.id,
      },
      data: {
        used: true,
      },
    });

    // Generar JWT
    const token = await new SignJWT({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("24h")
      .sign(JWT_SECRET);

    return Response.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });

  } catch (error) {
    console.error(error);

    return Response.json(
      { error: "Error al verificar OTP" },
      { status: 500 }
    );
  }
}