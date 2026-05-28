import { prisma } from "../lib/prisma.ts";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "incharge-secret-2026"
);

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    const user = await prisma.residents.findFirst({ where: { email } });

    if (!user || !user.password) {
      return Response.json({ error: "Credenciales inválidas" }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return Response.json({ error: "Credenciales inválidas" }, { status: 401 });
    }

    const token = await new SignJWT({
      id: user.id,
      email: user.email,
      name: user.full_name,
      role: user.role,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("24h")
      .sign(JWT_SECRET);

    return Response.json({
      token,
      user: { id: user.id, name: user.full_name, email: user.email, role: user.role },
    });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Error al iniciar sesión" }, { status: 500 });
  }
}