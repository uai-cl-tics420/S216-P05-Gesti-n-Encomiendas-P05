import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});


export async function GET() {
  try {
    const result = await pool.query(
      "SELECT * FROM transfers ORDER BY created_at DESC"
    );
    return Response.json(result.rows);
  } catch (error) {
    console.error("Error al obtener traslados:", error);
    return Response.json({ error: "Error al obtener datos" }, { status: 500 });
  }
}


export async function POST(request) {
  try {
    const body = await request.json();
    const {
      packageCode,
      destinationUnit,
      residentName,
      verificationCode,
      isPerishable,
      notes,
    } = body;

    const result = await pool.query(
      `INSERT INTO transfers 
        (package_code, destination_unit, resident_name, verification_code, is_perishable, notes)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [packageCode, destinationUnit, residentName, verificationCode, isPerishable, notes]
    );

    return Response.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error("Error al registrar traslado:", error);
    return Response.json({ error: "Error al guardar datos" }, { status: 500 });
  }
}
