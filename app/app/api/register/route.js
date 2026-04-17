import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export async function POST(request) {
  try {
    const body = await request.json();
    const { full_name, email, password, phone, department_id } = body;

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.residents.create({
      data: {
        full_name,
        email,
        password: hashedPassword,
        phone,
        department_id,
      },
    });

    return Response.json({ message: "User created", user }, { status: 201 });
  } catch (error) {
    return Response.json({ error: "Error creating user" }, { status: 500 });
  }
}