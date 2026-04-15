CREATE TABLE IF NOT EXISTS departments (
  id SERIAL PRIMARY KEY,
  unit_number VARCHAR(10) NOT NULL,
  floor_number INTEGER NOT NULL,
  tower VARCHAR(10) DEFAULT 'A',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS residents (
  id SERIAL PRIMARY KEY,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  department_id INTEGER REFERENCES departments(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS concierges (
  id SERIAL PRIMARY KEY,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL,
  shift VARCHAR(20) DEFAULT 'dia',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS packages (
  id SERIAL PRIMARY KEY,
  tracking_code VARCHAR(50) NOT NULL,
  description TEXT,
  sender_name VARCHAR(100),
  department_id INTEGER REFERENCES departments(id),
  resident_id INTEGER REFERENCES residents(id),
  concierge_id INTEGER REFERENCES concierges(id),
  is_perishable BOOLEAN DEFAULT false,
  status VARCHAR(20) DEFAULT 'pendiente',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS transfers (
  id SERIAL PRIMARY KEY,
  package_id INTEGER REFERENCES packages(id),
  verification_code VARCHAR(100) NOT NULL,
  transferred_by INTEGER REFERENCES concierges(id),
  received_by INTEGER REFERENCES residents(id),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  package_id INTEGER REFERENCES packages(id),
  resident_id INTEGER REFERENCES residents(id),
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  is_urgent BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO departments (unit_number, floor_number, tower) VALUES
  ('101', 1, 'A'), ('102', 1, 'A'), ('201', 2, 'A'),
  ('202', 2, 'A'), ('301', 3, 'A');

INSERT INTO residents (full_name, email, phone, department_id) VALUES
  ('Maria Gonzalez', 'maria@mail.com', '+56912345678', 1),
  ('Pedro Soto', 'pedro@mail.com', '+56987654321', 2);

INSERT INTO concierges (full_name, email, shift) VALUES
  ('Roberto Silva', 'roberto@edificio.cl', 'dia');

INSERT INTO packages (tracking_code, description, sender_name, department_id, resident_id, concierge_id, is_perishable, status) VALUES
  ('PKG-001', 'Caja Amazon', 'Amazon', 1, 1, 1, false, 'pendiente'),
  ('PKG-002', 'Pedido Cornershop', 'Cornershop', 2, 2, 1, true, 'pendiente');