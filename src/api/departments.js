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

    const departments = await prisma.departments.findMany({
      orderBy: [
        { tower: "asc" },
        { unit_number: "asc" },
      ],
    });

    return Response.json(departments);

  } catch (error) {
    console.error(error);

    return Response.json(
      { error: "Error al obtener departamentos" },
      { status: 500 }
    );
  }
}