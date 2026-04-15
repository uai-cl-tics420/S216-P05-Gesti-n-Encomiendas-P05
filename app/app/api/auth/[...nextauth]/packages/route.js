import { Pool } from "pg";

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "encomiendas_db",
  password: "clave123",
  port: 5432,
});

export async function GET() {
  try {
    const result = await pool.query(
      `SELECT p.*, d.unit_number 
       FROM packages p 
       LEFT JOIN departments d ON p.department_id = d.id 
       ORDER BY p.created_at DESC`
    );
    return Response.json({ packages: result.rows });
  } catch (error) {
    return Response.json({ packages: [], error: error.message }, { status: 500 });
  }
}