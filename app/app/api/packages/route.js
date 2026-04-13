import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// GET - obtener todos los paquetes
export async function GET() {
  try {
    const result = await pool.query(
      "SELECT * FROM packages ORDER BY received_at DESC"
    );
    return Response.json(result.rows);
  } catch (error) {
    console.error("Error al obtener paquetes:", error);
    return Response.json({ error: "Error al obtener datos" }, { status: 500 });
  }
}

// POST - registrar un paquete nuevo
export async function POST(request) {
  try {
    const body = await request.json();
    const {
      trackingCode,
      description,
      senderName,
      destinationUnit,
      residentName,
      isPerishable,
      notes,
    } = body;

    const deptResult = await pool.query(
      "SELECT id FROM departments WHERE unit_number = $1",
      [destinationUnit]
    );

    const residentResult = await pool.query(
      "SELECT id FROM residents WHERE full_name ILIKE $1",
      [`%${residentName}%`]
    );

    const departmentId = deptResult.rows[0]?.id || null;
    const residentId = residentResult.rows[0]?.id || null;

    const result = await pool.query(
      `INSERT INTO packages 
        (tracking_code, description, sender_name, department_id, resident_id, is_perishable, status, notes)
       VALUES ($1, $2, $3, $4, $5, $6, 'pendiente', $7)
       RETURNING *`,
      [trackingCode, description, senderName, departmentId, residentId, isPerishable, notes]
    );

    if (isPerishable && residentId) {
      await pool.query(
        `INSERT INTO notifications (package_id, resident_id, message, type)
         VALUES ($1, $2, $3, 'urgente')`,
        [result.rows[0].id, residentId, "Tienes un paquete PERECIBLE esperando en conserjeria. Retiralo lo antes posible."]
      );
    } else if (residentId) {
      await pool.query(
        `INSERT INTO notifications (package_id, resident_id, message, type)
         VALUES ($1, $2, $3, 'normal')`,
        [result.rows[0].id, residentId, "Tienes un paquete nuevo esperando en conserjeria."]
      );
    }

    return Response.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error("Error al registrar paquete:", error);
    return Response.json({ error: "Error al guardar datos" }, { status: 500 });
  }
}
