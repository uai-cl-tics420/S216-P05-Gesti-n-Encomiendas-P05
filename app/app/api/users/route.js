import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const users = await prisma.residents.findMany({
      select: {
        id: true,
        full_name: true,
        email: true,
        role: true,
        phone: true,
        created_at: true,
      },
      orderBy: { created_at: "desc" },
    });
    return Response.json(users);
  } catch (error) {
    return Response.json({ error: "Error al obtener usuarios" }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const body = await request.json();
    const { id, role } = body;

    const user = await prisma.residents.update({
      where: { id },
      data: { role },
    });

    return Response.json({ message: "Rol actualizado", user });
  } catch (error) {
    return Response.json({ error: "Error al actualizar rol" }, { status: 500 });
  }
}