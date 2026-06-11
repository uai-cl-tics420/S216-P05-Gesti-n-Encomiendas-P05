import { prisma } from "../lib/prisma.ts";
import { verifyAuth } from "../lib/auth.js";


export async function GET(req) {
  try {
    const auth = await verifyAuth(req);

    if (!auth) {
      return Response.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const notifications = await prisma.notifications.findMany({
      where: { user_id: auth.id },
      orderBy: { created_at: "desc" },
    });

    return Response.json(notifications);
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: "Error al obtener notificaciones" },
      { status: 500 }
    );
  }
}


export async function PATCH(req) {
  try {
    const auth = await verifyAuth(req);

    if (!auth) {
      return Response.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const { id } = await req.json();

    
    const notif = await prisma.notifications.findFirst({
      where: {
        id: parseInt(id),
        user_id: auth.id,
      },
    });

    if (!notif) {
      return Response.json(
        { error: "Notificación no encontrada" },
        { status: 404 }
      );
    }

    await prisma.notifications.update({
      where: { id: notif.id },
      data: { is_read: true },
    });

    return Response.json({ message: "Notificación leída" });
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: "Error al actualizar notificación" },
      { status: 500 }
    );
  }
}