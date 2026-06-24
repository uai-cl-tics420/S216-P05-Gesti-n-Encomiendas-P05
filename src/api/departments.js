import { prisma } from "../lib/prisma.ts";

export async function GET() {
  try {
    const departments = await prisma.departments.findMany({
      orderBy: {
        id: "asc"
      }
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