import { prisma } from "../lib/prisma.ts";

function generate_verification_code() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

export async function GET(req) {
  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get("user_id");
    const where = userId
      ? { user_id: parseInt(userId) }
      : {};
    const packages = await prisma.packages.findMany({
      where,
      include: {
        user: true,
        transfers: true,
      },
      orderBy: {
        created_at: "desc",
      },
});

    return Response.json(packages);
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Error al obtener paquetes" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const {
      tracking_code,
      description,
      user_id,
      is_perishable
    } = await req.json();

    const verification_code = generate_verification_code();

    const pkg = await prisma.packages.create({
      data: {
        tracking_code,
        description,
        user_id: parseInt(user_id),
        is_perishable: is_perishable || false,
        status: "pendiente",
      },
    });

    await prisma.transfers.create({
      data: {
        package_id: pkg.id,
        verification_code: verification_code,
      },
    });

    return Response.json({ ...pkg, verification_code }, { status: 201 });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Error al crear paquete" }, { status: 500 });
  }
}

export async function PATCH(req) {
  try {
    const {
      package_id,
      verification_code,
      receiver_name,
      receiver_rut
    } = await req.json();

    const transfer = await prisma.transfers.findFirst({
      where: {
        package_id: parseInt(package_id),
        verification_code: verification_code,
      },
    });

    if (!transfer) {
      return Response.json(
        { error: "Código inválido" },
        { status: 400 }
      );
    }

    await prisma.transfers.update({
      where: {
        id: transfer.id,
      },
      data: {
        receiver_name,
        receiver_rut,
        delivered_at: new Date(),
      },
    });

    const pkg = await prisma.packages.update({
      where: {
        id: parseInt(package_id),
      },
      data: {
        status: "entregado",
      },
    });

    return Response.json({
      message: "Paquete entregado",
      pkg,
    });

  } catch (error) {
    console.error(error);

    return Response.json(
      { error: "Error al entregar paquete" },
      { status: 500 }
    );
  }
}