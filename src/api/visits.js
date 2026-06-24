import { prisma } from "../lib/prisma.ts";
import { verifyAuth } from "../lib/auth.js";
import { randomUUID } from "crypto";

export async function GET(req) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return Response.json({ error: "No autorizado" }, { status: 401 });

    const url = new URL(req.url);
    const qr = url.searchParams.get("qr");

    if (qr) {
      const visit = await prisma.visits.findUnique({
        where: { qr_code: qr },
        include: { user: { select: { name: true, department_id: true } } },
      });
      if (!visit) return Response.json({ error: "Visita no encontrada" }, { status: 404 });
      return Response.json(visit);
    }

    if (auth.role === "residente") {
      const visits = await prisma.visits.findMany({
        where: { user_id: auth.id },
        orderBy: { created_at: "desc" },
      });
      return Response.json(visits);
    }

    const visits = await prisma.visits.findMany({
      include: { user: { select: { name: true } } },
      orderBy: { created_at: "desc" },
    });
    return Response.json(visits);
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Error al obtener visitas" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const auth = await verifyAuth(req);
    if (!auth || auth.role !== "residente") {
      return Response.json({ error: "No autorizado" }, { status: 401 });
    }

    const { visitor_name, visitor_rut, department, has_car, car_plate } = await req.json();

    if (!visitor_name || !visitor_rut || !department) {
      return Response.json({ error: "Completa todos los campos" }, { status: 400 });
    }

    const qr_code = randomUUID();
    const expires_at = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const visit = await prisma.visits.create({
      data: {
        user_id: auth.id,
        visitor_name,
        visitor_rut,
        department,
        has_car: has_car || false,
        car_plate: car_plate || null,
        qr_code,
        expires_at,
      },
    });

    return Response.json({ ...visit, qr_code }, { status: 201 });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Error al crear visita" }, { status: 500 });
  }
}

export async function PATCH(req) {
  try {
    const auth = await verifyAuth(req);
    if (!auth || (auth.role !== "conserje" && auth.role !== "admin")) {
      return Response.json({ error: "No autorizado" }, { status: 401 });
    }

    const { qr_code } = await req.json();

    const visit = await prisma.visits.findUnique({ where: { qr_code } });
    if (!visit) return Response.json({ error: "Visita no encontrada" }, { status: 404 });
    if (visit.used) return Response.json({ error: "QR ya utilizado" }, { status: 400 });
    if (new Date() > visit.expires_at) return Response.json({ error: "QR expirado" }, { status: 400 });

    await prisma.visits.update({ where: { qr_code }, data: { used: true } });

    return Response.json({ message: "Visita registrada", visit });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Error al registrar visita" }, { status: 500 });
  }
}