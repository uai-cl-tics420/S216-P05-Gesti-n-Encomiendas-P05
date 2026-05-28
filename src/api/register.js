import { prisma } from "../lib/prisma.ts";
import bcrypt from "bcryptjs";

export async function POST(request) {
  try {
    const body = await request.json();
    const { full_name, email, password, phone, department_id, role } = body;

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.residents.create({
      data: {
        full_name,
        email,
        password: hashedPassword,
        phone,
        department_id,
        role: role || "residente",
      },
    });

    return Response.json({ message: "User created", user }, { status: 201 });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Error creating user" }, { status: 500 });
  }
}