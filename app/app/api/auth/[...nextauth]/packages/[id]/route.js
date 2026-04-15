import { Pool } from "pg";

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "encomiendas_db",
  password: "clave123",
  port: 5432,
});

export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const result = await pool.query(
      "UPDATE packages SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *",
      [body.status, id]
    );
    return Response.json({ package: result.rows[0] });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}