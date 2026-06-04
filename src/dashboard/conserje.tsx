import { useState } from "react";
import { useLanguage } from "../context/LanguageContext";

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface ConserjeDashboardProps {
  user: User;
  onLogout: () => void;
}

export default function ConserjedDashboard({
  user,
  onLogout,
}: ConserjeDashboardProps) {
  const { t, lang, toggleLang } = useLanguage();

  const [packages, setPackages] = useState([
    { id: 1, code: "PKG-001", desc: "Caja Amazon", depto: "101", resident: "Maria Gonzalez", status: "Pendiente", date: "Hoy 10:30" },
    { id: 2, code: "PKG-002", desc: "Pedido Cornershop", depto: "102", resident: "Pedro Soto", status: "Pendiente", date: "Hoy 11:15" },
    { id: 3, code: "PKG-003", desc: "Caja Falabella", depto: "201", resident: "Ana Torres", status: "Retirado", date: "Ayer 16:45" },
  ]);

  const [form, setForm] = useState({
    code: "",
    depto: "",
    resident: "",
    desc: "",
  });

  const [showForm, setShowForm] = useState(false);

  const pendientes = packages.filter((p) => p.status === "Pendiente").length;
  const retirados = packages.filter((p) => p.status === "Retirado").length;

  const handleAdd = () => {
    if (!form.code || !form.depto || !form.resident) return;

    const newPkg = {
      id: packages.length + 1,
      code: form.code,
      desc: form.desc || "Sin descripción",
      depto: form.depto,
      resident: form.resident,
      status: "Pendiente",
      date: "Ahora",
    };

    setPackages([newPkg, ...packages]);
    setForm({ code: "", depto: "", resident: "", desc: "" });
    setShowForm(false);
  };

  const handleDeliver = (id: number) => {
    setPackages(
      packages.map((p) =>
        p.id === id
          ? { ...p, status: "Retirado", date: "Hace un momento" }
          : p
      )
    );
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f5f5f5",
        fontFamily: "sans-serif",
      }}
    >
      {/* Header */}
      <div
        style={{
          background: "linear-gradient(135deg, #1a2a6c, #1565C0)",
          padding: "1rem 2rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span
            style={{
              fontSize: "14px",
              color: "rgba(255,255,255,0.7)",
              letterSpacing: "3px",
              textTransform: "uppercase",
            }}
          >
            in
          </span>

          <span
            style={{
              fontSize: "22px",
              fontWeight: "500",
              color: "white",
            }}
          >
            Charge<span style={{ color: "#EF5350" }}>.</span>
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <button
            onClick={toggleLang}
            style={{
              padding: "6px 14px",
              background: "rgba(255,255,255,0.2)",
              color: "white",
              border: "1px solid rgba(255,255,255,0.4)",
              borderRadius: "20px",
              cursor: "pointer",
              fontSize: "13px",
            }}
          >
            {lang === "es" ? "EN" : "ES"}
          </button>

          <span style={{ color: "white", fontSize: "14px" }}>
            👤 {user.name}
          </span>

          <button
            onClick={onLogout}
            style={{
              padding: "8px 16px",
              background: "#EF5350",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "13px",
            }}
          >
            {t.logout}
          </button>
        </div>
      </div>

      <div style={{ padding: "2rem", maxWidth: "900px", margin: "0 auto" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "2rem",
          }}
        >
          <div>
            <h1
              style={{
                fontSize: "22px",
                fontWeight: "500",
                color: "#1a1a1a",
                margin: 0,
              }}
            >
              {t.conciergePanel}
            </h1>

            <p style={{ fontSize: "14px", color: "#999", margin: "4px 0 0" }}>
              {t.conciergeSubtitle}
            </p>
          </div>

          <button
            onClick={() => setShowForm(!showForm)}
            style={{
              padding: "10px 20px",
              background: "#1565C0",
              color: "white",
              border: "none",
              borderRadius: "10px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "500",
            }}
          >
            {t.newPackage}
          </button>
        </div>

        {/* Stats */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "1rem",
            marginBottom: "2rem",
          }}
        >
          {[
            { label: t.pending, value: pendientes, color: "#EF5350" },
            { label: t.delivered, value: retirados, color: "#1D9E75" },
            { label: t.total, value: packages.length, color: "#1565C0" },
          ].map(({ label, value, color }) => (
            <div
              key={label}
              style={{
                background: "white",
                borderRadius: "12px",
                padding: "1.5rem",
                textAlign: "center",
                border: "0.5px solid #e0e0e0",
              }}
            >
              <p style={{ fontSize: "32px", fontWeight: "500", color, margin: 0 }}>
                {value}
              </p>
              <p style={{ fontSize: "13px", color: "#999", margin: "4px 0 0" }}>
                {label}
              </p>
            </div>
          ))}
        </div>

        {/* Form */}
        {showForm && (
          <div
            style={{
              background: "white",
              borderRadius: "12px",
              border: "1.5px solid #1565C0",
              padding: "1.5rem",
              marginBottom: "1.5rem",
            }}
          >
            <p style={{ fontWeight: "500", color: "#1565C0" }}>
              {t.registerPackage}
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "1rem",
              }}
            >
              {[
                { key: "code", label: t.trackingCode },
                { key: "depto", label: t.deptNumber },
                { key: "resident", label: t.residentName },
                { key: "desc", label: t.description },
              ].map((f) => (
                <div key={f.key}>
                  <label
                    style={{
                      fontSize: "12px",
                      color: "#777",
                      display: "block",
                      marginBottom: "5px",
                    }}
                  >
                    {f.label}
                  </label>

                  <input
                    value={form[f.key as keyof typeof form]}
                    onChange={(e) =>
                      setForm({ ...form, [f.key]: e.target.value })
                    }
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      border: "1.5px solid #e8e8e8",
                      borderRadius: "8px",
                      fontSize: "14px",
                    }}
                  />
                </div>
              ))}
            </div>

            <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
              <button
                onClick={handleAdd}
                style={{
                  padding: "10px 20px",
                  background: "#1565C0",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                }}
              >
                {t.save}
              </button>

              <button
                onClick={() => setShowForm(false)}
                style={{
                  padding: "10px 20px",
                  background: "white",
                  border: "1px solid #ddd",
                  borderRadius: "8px",
                }}
              >
                {t.cancel}
              </button>
            </div>
          </div>
        )}

        {/* List */}
        <div
          style={{
            background: "white",
            borderRadius: "12px",
            border: "0.5px solid #e0e0e0",
          }}
        >
          {packages.map((p) => (
            <div
              key={p.id}
              style={{
                padding: "1rem 1.5rem",
                display: "flex",
                justifyContent: "space-between",
                borderBottom: "0.5px solid #eee",
              }}
            >
              <div>
                <p style={{ fontWeight: 500, margin: 0 }}>
                  {p.code} — {p.desc}
                </p>
                <p style={{ fontSize: "12px", color: "#999" }}>
                  Dept {p.depto} · {p.resident} · {p.date}
                </p>
              </div>

              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <span
                  style={{
                    padding: "4px 10px",
                    borderRadius: "20px",
                    fontSize: "12px",
                    background:
                      p.status === "Pendiente"
                        ? "#EF535020"
                        : "#1D9E7520",
                    color:
                      p.status === "Pendiente"
                        ? "#EF5350"
                        : "#1D9E75",
                  }}
                >
                  {p.status}
                </span>

                {p.status === "Pendiente" && (
                  <button
                    onClick={() => handleDeliver(p.id)}
                    style={{
                      background: "#1D9E75",
                      color: "white",
                      border: "none",
                      padding: "6px 12px",
                      borderRadius: "8px",
                    }}
                  >
                    {t.markDelivered}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}