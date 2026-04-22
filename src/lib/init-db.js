import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function initDatabase() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS transfers (
        id SERIAL PRIMARY KEY,
        package_code VARCHAR(50) NOT NULL,
        destination_unit VARCHAR(20) NOT NULL,
        resident_name VARCHAR(100) NOT NULL,
        verification_code VARCHAR(100) NOT NULL,
        is_perishable BOOLEAN DEFAULT false,
        notes TEXT,
        status VARCHAR(20) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log("Tabla transfers creada correctamente");
  } catch (error) {
    console.error("Error al crear la tabla:", error);
  } finally {
    await pool.end();
  }
}

initDatabase();
