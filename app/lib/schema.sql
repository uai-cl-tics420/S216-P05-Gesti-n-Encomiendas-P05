
-- Tabla de departamentos del edificio
-- Cada depto tiene un numero unico y un piso
CREATE TABLE IF NOT EXISTS departments (
    id SERIAL PRIMARY KEY,
    unit_number VARCHAR(10) NOT NULL UNIQUE,
    floor_number INTEGER,
    tower VARCHAR(20) DEFAULT 'A',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de residentes
-- Cada residente pertenece a un departamento
CREATE TABLE IF NOT EXISTS residents (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE,
    phone VARCHAR(20),
    department_id INTEGER REFERENCES departments(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de conserjes
-- Los que reciben y entregan los paquetes
CREATE TABLE IF NOT EXISTS concierges (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE,
    shift VARCHAR(20) DEFAULT 'dia',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tabla principal de encomiendas (paquetes)
-- Aca se registra cada paquete que llega al edificio
CREATE TABLE IF NOT EXISTS packages (
    id SERIAL PRIMARY KEY,
    tracking_code VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    sender_name VARCHAR(100),
    department_id INTEGER REFERENCES departments(id),
    resident_id INTEGER REFERENCES residents(id),
    concierge_id INTEGER REFERENCES concierges(id),
    is_perishable BOOLEAN DEFAULT false,
    status VARCHAR(20) DEFAULT 'pendiente',
    received_at TIMESTAMP DEFAULT NOW(),
    picked_up_at TIMESTAMP,
    notes TEXT
);

-- Tabla de traslados
-- Registra cuando un paquete se mueve de conserjeria al departamento
CREATE TABLE IF NOT EXISTS transfers (
    id SERIAL PRIMARY KEY,
    package_id INTEGER REFERENCES packages(id),
    concierge_id INTEGER REFERENCES concierges(id),
    verification_code VARCHAR(100) NOT NULL,
    picked_up_by VARCHAR(100),
    notes TEXT,
    transferred_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de notificaciones
-- Para avisar a los residentes que tienen un paquete
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    package_id INTEGER REFERENCES packages(id),
    resident_id INTEGER REFERENCES residents(id),
    message TEXT NOT NULL,
    type VARCHAR(20) DEFAULT 'normal',
    is_read BOOLEAN DEFAULT false,
    sent_at TIMESTAMP DEFAULT NOW()
);


-- Datos de prueba para poder testear

-- Algunos departamentos de ejemplo
INSERT INTO departments (unit_number, floor_number, tower) VALUES
    ('101', 1, 'A'),
    ('102', 1, 'A'),
    ('201', 2, 'A'),
    ('202', 2, 'A'),
    ('301', 3, 'A'),
    ('1201', 12, 'B'),
    ('1202', 12, 'B');

-- Un par de residentes
INSERT INTO residents (full_name, email, phone, department_id) VALUES
    ('Maria Gonzalez', 'maria.gonzalez@mail.com', '+56912345678', 1),
    ('Pedro Soto', 'pedro.soto@mail.com', '+56987654321', 2),
    ('Carolina Munoz', 'carolina.munoz@mail.com', '+56911223344', 3),
    ('Juan Perez', 'juan.perez@mail.com', '+56955667788', 5);

-- Conserjes
INSERT INTO concierges (full_name, email, shift) VALUES
    ('Roberto Silva', 'roberto.silva@edificio.cl', 'dia'),
    ('Ana Torres', 'ana.torres@edificio.cl', 'noche');

-- Algunos paquetes de ejemplo
INSERT INTO packages (tracking_code, description, sender_name, department_id, resident_id, concierge_id, is_perishable, status) VALUES
    ('PKG-2026-0001', 'Caja mediana Amazon', 'Amazon', 1, 1, 1, false, 'pendiente'),
    ('PKG-2026-0002', 'Pedido Cornershop - perecible', 'Cornershop', 2, 2, 1, true, 'pendiente'),
    ('PKG-2026-0003', 'Sobre documento notarial', 'Notaria Santiago', 3, 3, 2, false, 'entregado');
