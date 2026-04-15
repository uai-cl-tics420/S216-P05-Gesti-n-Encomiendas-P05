"use client";

import { useState, useEffect } from "react";

export default function DashboardPage() {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("todos");

  useEffect(() => {
    fetch("/api/packages")
      .then((res) => res.json())
      .then((data) => {
        setPackages(data.packages || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleDeliver = async (id) => {
    const res = await fetch(`/api/packages/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "entregado" }),
    });
    if (res.ok) {
      setPackages((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status: "entregado" } : p))
      );
    }
  };

  const filtered =
    filter === "todos" ? packages : packages.filter((p) => p.status === filter);

  const pending = packages.filter((p) => p.status === "pendiente").length;
  const delivered = packages.filter((p) => p.status === "entregado").length;

  if (loading) return <p style={{ padding: "2rem" }}>Cargando...</p>;

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "1.5rem" }}>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "1rem" }}>
        Panel de Conserjeria
      </h1>

      <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem" }}>
        <div style={cardStyle("#dbeafe")}>
          <span style={{ fontSize: "2rem", fontWeight: 700 }}>{packages.length}</span>
          <span>Total</span>
        </div>
        <div style={cardStyle("#fef9c3")}>
          <span style={{ fontSize: "2rem", fontWeight: 700 }}>{pending}</span>
          <span>Pendientes</span>
        </div>
        <div style={cardStyle("#dcfce7")}>
          <span style={{ fontSize: "2rem", fontWeight: 700 }}>{delivered}</span>
          <span>Entregados</span>
        </div>
      </div>

      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
        {["todos", "pendiente", "entregado"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: "0.4rem 1rem",
              borderRadius: 6,
              border: filter === f ? "2px solid #2563eb" : "1px solid #d1d5db",
              background: filter === f ? "#2563eb" : "#fff",
              color: filter === f ? "#fff" : "#374151",
              cursor: "pointer",
              fontWeight: 500,
            }}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: "2px solid #e5e7eb", textAlign: "left" }}>
            <th style={thStyle}>Codigo</th>
            <th style={thStyle}>Descripcion</th>
            <th style={thStyle}>Depto</th>
            <th style={thStyle}>Estado</th>
            <th style={thStyle}>Perecible</th>
            <th style={thStyle}>Accion</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((pkg) => (
            <tr key={pkg.id} style={{ borderBottom: "1px solid #e5e7eb" }}>
              <td style={tdStyle}>{pkg.tracking_code}</td>
              <td style={tdStyle}>{pkg.description}</td>
              <td style={tdStyle}>{pkg.unit_number || pkg.department_id}</td>
              <td style={tdStyle}>
                <span
                  style={{
                    padding: "0.2rem 0.6rem",
                    borderRadius: 12,
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    background: pkg.status === "pendiente" ? "#fef9c3" : "#dcfce7",
                    color: pkg.status === "pendiente" ? "#854d0e" : "#166534",
                  }}
                >
                  {pkg.status}
                </span>
              </td>
              <td style={tdStyle}>{pkg.is_perishable ? "Si" : "No"}</td>
              <td style={tdStyle}>
                {pkg.status === "pendiente" && (
                  <button
                    onClick={() => handleDeliver(pkg.id)}
                    style={{
                      padding: "0.3rem 0.8rem",
                      background: "#16a34a",
                      color: "#fff",
                      border: "none",
                      borderRadius: 6,
                      cursor: "pointer",
                      fontWeight: 500,
                    }}
                  >
                    Entregar
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {filtered.length === 0 && (
        <p style={{ textAlign: "center", color: "#9ca3af", marginTop: "2rem" }}>
          No hay paquetes en esta categoria
        </p>
      )}
    </div>
  );
}

const cardStyle = (bg) => ({
  flex: 1,
  padding: "1rem",
  borderRadius: 10,
  background: bg,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
});

const thStyle = { padding: "0.6rem", fontSize: "0.85rem", color: "#6b7280" };
const tdStyle = { padding: "0.6rem", fontSize: "0.9rem" };
