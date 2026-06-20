import { prisma } from "../lib/prisma.ts";

export async function GET(req) {
  try {
    const url = new URL(req.url);

    const userId = url.searchParams.get("user_id");
    const role = url.searchParams.get("role");

    const where =
      role === "conserje"
        ? {}
        : { user_id: parseInt(userId) };

    const complaints = await prisma.claims.findMany({
      where,
      include: {
        user: true,
        package: true,
      },
      orderBy: {
        created_at: "desc",
      },
    });

    return Response.json(complaints);
  } catch (error) {
    console.error(error);

    return Response.json(
      { error: "Error al obtener reclamos" },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const {
      user_id,
      package_id,
      title,
      description,
    } = await req.json();

    const complaint = await prisma.claims.create({
      data: {
        user_id: parseInt(user_id),
        package_id: package_id
          ? parseInt(package_id)
          : null,
        title,
        description,
        status: "pendiente",
      },
    });

    return Response.json(
      complaint,
      { status: 201 }
    );
  } catch (error) {
    console.error(error);

    return Response.json(
      { error: "Error al crear reclamo" },
      { status: 500 }
    );
  }
}

export async function PATCH(req) {
  try {
    const {
      complaint_id,
      status,
    } = await req.json();

    const complaint = await prisma.claims.update({
      where: {
        id: parseInt(complaint_id),
      },
      data: {
        status,
      },
    });

    return Response.json(complaint);
  } catch (error) {
    console.error(error);

    return Response.json(
      { error: "Error al actualizar reclamo" },
      { status: 500 }
    );
  }
}