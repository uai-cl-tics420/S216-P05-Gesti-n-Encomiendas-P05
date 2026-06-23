import { prisma } from "../lib/prisma.ts";
import { verifyAuth } from "../lib/auth.js";

export async function GET(req) {
  try {
    const auth = await verifyAuth(req);
    if (!auth || (auth.role !== "conserje" && auth.role !== "admin")) {
      return Response.json({ error: "No autorizado" }, { status: 401 });
    }
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, phone: true, created_at: true },
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
    const auth = await verifyAuth(request);
    if (!auth || auth.role !== "admin") {
      return Response.json({ error: "No autorizado" }, { status: 401 });
    }
    const { id, role } = await request.json();
    const user = await prisma.user.update({ where: { id }, data: { role } });
    return Response.json({ message: "Rol actualizado", user });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Error al actualizar rol" }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const auth = await verifyAuth(request);
    if (!auth || auth.role !== "admin") {
      return Response.json({ error: "No autorizado" }, { status: 401 });
    }
    const url = new URL(request.url);
    const id = parseInt(url.searchParams.get("id") || "");
    if (!id) {
      return Response.json({ error: "ID requerido" }, { status: 400 });
    }
    await prisma.user.delete({ where: { id } });
    return Response.json({ message: "Usuario eliminado" });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Error al eliminar usuario" }, { status: 500 });
  }
}