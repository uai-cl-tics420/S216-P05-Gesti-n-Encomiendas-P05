import { prisma } from "../lib/prisma.ts";

export async function GET() {
  try {
    const departments = await prisma.departments.findMany();

    return Response.json(departments);
  } catch (error) {
    console.error(error);

    return Response.json(
      { error: "Error obteniendo departamentos" },
      { status: 500 }
    );
  }
}