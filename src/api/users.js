import { prisma } from "../lib/prisma.ts";

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        created_at: true,
      },
      orderBy: { created_at: "desc" },
    });
    return Response.json(users);
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Error al obtener usuarios" }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const { id, role } = await request.json();
    const user = await prisma.user.update({
      where: { id },
      data: { role },
    });
    return Response.json({ message: "Rol actualizado", user });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Error al actualizar rol" }, { status: 500 });
  }
}