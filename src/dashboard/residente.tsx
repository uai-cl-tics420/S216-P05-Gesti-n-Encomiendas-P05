import { useEffect, useState } from "react";
import { useI18nContext } from "../i18n/i18n-react.js";

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface Package {
  id: number;
  tracking_code: string;
  description: string;
  status: string;
  created_at: string;

  transfers: {
    verification_code: string;
    receiver_name?: string;
    receiver_rut?: string;
    delivered_at?: string;
  }[];
}

export default function ResidenteDashboard({ user, onLogout }: { user: User; onLogout: () => void }) {
  const { LL, locale, setLocale } = useI18nContext();
  const lang = locale;
  const toggleLang = () => setLocale(locale === 'es' ? 'en' : 'es');
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);

  const [viewPackage, setViewPackage] =
    useState<Package | null>(null);
  const [filter, setFilter] = useState<
  "todos" | "pendiente" | "entregado">("todos");
  const filteredPackages = packages.filter(pkg => {
    if (filter === "todos") return true;
    return pkg.status === filter;
  });

  useEffect(() => {
    const token = localStorage.getItem("incharge_token");
    fetch(`/api/packages?user_id=${user.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => { setPackages(data); setLoading(false); });
  }, []);

  const pendientes = packages.filter(p => p.status === "pendiente").length;
  const entregados = packages.filter(p => p.status === "entregado").length;

  return (
    <main style={{ minHeight: "100vh", background: "#f5f5f5", fontFamily: "sans-serif" }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #1a2a6c, #1565C0)", padding: "1rem 2rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: "22px", fontWeight: "500", color: "white" }}>in<span style={{ color: "#EF5350" }}>Charge.</span></span>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <button onClick={toggleLang} style={{ padding: "6px 14px", background: "rgba(255,255,255,0.2)", color: "white", border: "1px solid rgba(255,255,255,0.4)", borderRadius: "20px", cursor: "pointer", fontSize: "13px" }}>
            {lang === "es" ? "EN" : "ES"}
          </button>
          <span style={{ color: "white", fontSize: "14px" }}>👤 {user.name}</span>
          <button onClick={onLogout} style={{ padding: "8px 16px", background: "#EF5350", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "13px" }}>
            {LL.logout()}
          </button>
        </div>
      </div>

      <div style={{ padding: "2rem", maxWidth: "900px", margin: "0 auto" }}>
        <h1 style={{ fontSize: "22px", fontWeight: "500", color: "#1a1a1a", marginBottom: "4px" }}>{LL.myPackages()}</h1>
        <p style={{ fontSize: "14px", color: "#999", marginBottom: "2rem" }}>{LL.welcome()}, {user.name}</p>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", marginBottom: "2rem" }}>
          {[
            {
              key: "pendiente",
              label: LL.pending(),
              value: pendientes,
              color: "#EF5350"
            },
            {
              key: "entregado",
              label: LL.delivered(),
              value: entregados,
              color: "#1D9E75"
            },
            {
              key: "todos",
              label: LL.total(),
              value: packages.length,
              color: "#022042"
            },
          ].map(({ key, label, value, color }) => (
            <div
              key={label}
              onClick={() => setFilter(key as any)}
              style={{
                background: "white",
                borderRadius: "12px",
                padding: "1.5rem",
                textAlign: "center",
                border:
                  filter === key
                    ? `2px solid ${color}`
                    : "0.5px solid #e0e0e0",
                cursor: "pointer",
                transition: "all 0.2s",
                boxShadow:
                  filter === key
                    ? "0 4px 12px rgba(0,0,0,0.1)"
                    : "none"
              }}
            >
              <p
                style={{
                  fontSize: "32px",
                  fontWeight: "500",
                  color,
                  margin: 0
                }}
              >
                {value}
              </p>

              <p
                style={{
                  fontSize: "13px",
                  color: "#999",
                  margin: "4px 0 0"
                }}
              >
                {label}
              </p>
            </div>
          ))}
        </div>

        {/* Lista paquetes */}
        <div style={{ background: "white", borderRadius: "12px", border: "0.5px solid #e0e0e0", overflow: "hidden" }}>
          <div style={{ padding: "1rem 1.5rem", borderBottom: "0.5px solid #e0e0e0" }}>
            <p style={{ fontWeight: "500", margin: 0, color: "#1a1a1a" }}>{LL.recentPackages()}</p>
          </div>

          {loading ? (
            <p style={{ padding: "2rem", textAlign: "center", color: "#999" }}>{LL.loadingUsers()}</p>
          ) : packages.length === 0 ? (
            <p style={{ padding: "2rem", textAlign: "center", color: "#999" }}>No tienes paquetes</p>
          ) : filteredPackages.map(pkg => {
            const verification_code = pkg.transfers?.[0]?.verification_code;
            return (
              <div
  key={pkg.id}
  onClick={() => {
    setViewPackage(pkg);
  }}
  style={{
    margin: "12px",
    padding: "18px",
    borderRadius: "14px",
    border:
      pkg.status === "pendiente"
        ? "1px solid #ffe0e0"
        : "1px solid #d7f5e5",
    background:
      pkg.status === "pendiente"
        ? "#fffdfd"
        : "#f8fffb",
    transition: "all 0.25s ease",
    boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
  }}
  onMouseEnter={(e) => {
    e.currentTarget.style.transform = "translateY(-2px)";
    e.currentTarget.style.boxShadow =
      "0 8px 20px rgba(0,0,0,0.12)";
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.transform = "translateY(0)";
    e.currentTarget.style.boxShadow =
      "0 2px 8px rgba(0,0,0,0.05)";
  }}
>
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center"
    }}
  >
    <div style={{ display: "flex", gap: "14px" }}>
      
      <div
        style={{
          width: "48px",
          height: "48px",
          borderRadius: "12px",
          background:
            pkg.status === "pendiente"
              ? "#FFF1F1"
              : "#EAF9F0",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "22px"
        }}
      >
        {pkg.status === "pendiente" ? "📦" : "✅"}
      </div>

      <div>
        <p
          style={{
            fontWeight: 600,
            margin: 0,
            fontSize: "15px",
            color: "#1a1a1a"
          }}
        >
          {pkg.tracking_code}
        </p>

        <p
          style={{
            margin: "4px 0",
            color: "#666",
            fontSize: "13px"
          }}
        >
          {pkg.description || "Sin descripción"}
        </p>

        <p
          style={{
            color: "#999",
            margin: 0,
            fontSize: "12px"
          }}
        >
          {new Date(pkg.created_at).toLocaleDateString()}
        </p>
        <p
  style={{
    color: "#1565C0",
    marginTop: "8px",
    marginBottom: 0,
    fontSize: "12px",
    fontWeight: 500
  }}
>
  {pkg.status === "pendiente"
    ? "Ver código de retiro"
    : "Ver detalle"}
</p>
      </div>
    </div>

    <span
      style={{
        background:
          pkg.status === "pendiente"
            ? "#FFF1F1"
            : "#EAF9F0",
        color:
          pkg.status === "pendiente"
            ? "#D32F2F"
            : "#1D9E75",
        padding: "8px 14px",
        borderRadius: "999px",
        fontSize: "12px",
        fontWeight: 600,
        textTransform: "capitalize"
      }}
    >
      {pkg.status}
    </span>
  </div>
</div>
            );
          })}
        </div>
      </div>
      {viewPackage && (
  <div
    style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.5)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 9999
    }}
  >
    <div
      style={{
        background: "white",
        width: "500px",
        borderRadius: "12px",
        padding: "24px"
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          marginBottom: "20px"
        }}
      >
        <div
  style={{
    width: "50px",
    height: "50px",
    borderRadius: "12px",
    background:
      viewPackage.status === "pendiente"
        ? "#FFF1F1"
        : "#EAF9F0",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "24px"
  }}
>
  {viewPackage.status === "pendiente" ? "📦" : "✅"}
</div>

<div>
  <h2 style={{ margin: 0 }}>
    {viewPackage.status === "pendiente"
      ? "Código de Retiro"
      : "Entrega Registrada"}
  </h2>

  <p
    style={{
      margin: "4px 0 0",
      color: "#777",
      fontSize: "13px"
    }}
  >
    {viewPackage.status === "pendiente"
      ? "Presenta este código al conserje"
      : "Información del retiro"}
  </p>
</div>

        <div>
          <h2 style={{ margin: 0 }}>
            Entrega Registrada
          </h2>

          <p
            style={{
              margin: "4px 0 0",
              color: "#777",
              fontSize: "13px"
            }}
          >
            Información del retiro
          </p>
        </div>
      </div>

      <div
        style={{
          background: "#f8fafc",
          borderRadius: "12px",
          padding: "16px",
          marginBottom: "16px"
        }}
      >
        <p>
          <strong>Código:</strong>{" "}
          {viewPackage.tracking_code}
        </p>

        <p>
          <strong>Descripción:</strong>{" "}
          {viewPackage.description}
        </p>
      </div>

      {viewPackage.status === "pendiente" ? (
  <div
    style={{
      background: "#FFF8E1",
      border: "1px solid #FFD54F",
      borderRadius: "12px",
      padding: "24px",
      textAlign: "center"
    }}
  >
    <p
      style={{
        margin: 0,
        color: "#777",
        fontSize: "13px"
      }}
    >
      Código de retiro
    </p>

    <p
      style={{
        margin: "12px 0",
        fontSize: "42px",
        fontWeight: 700,
        letterSpacing: "8px",
        color: "#1565C0"
      }}
    >
      {viewPackage.transfers?.[0]?.verification_code}
    </p>

    <p
      style={{
        margin: 0,
        fontSize: "13px",
        color: "#777"
      }}
    >
      Entrega este código al conserje para retirar tu paquete.
    </p>
  </div>
) : (
  <div
    style={{
      background: "#f0fdf4",
      border: "1px solid #bbf7d0",
      borderRadius: "12px",
      padding: "16px"
    }}
  >
    <p>
      <strong>Retiró:</strong>
      <br />
      {viewPackage.transfers?.[0]?.receiver_name ||
        "Sin registro"}
    </p>

    <p>
      <strong>RUT:</strong>
      <br />
      {viewPackage.transfers?.[0]?.receiver_rut ||
        "Sin registro"}
    </p>

    <p>
      <strong>Fecha:</strong>
      <br />
      {viewPackage.transfers?.[0]?.delivered_at
        ? new Date(
            viewPackage.transfers[0].delivered_at
          ).toLocaleString()
        : "Sin registro"}
    </p>
  </div>
)}

      <div
        style={{
          marginTop: "20px",
          textAlign: "right"
        }}
      >
        <button
          onClick={() => setViewPackage(null)}
          style={{
            background: "#1565C0",
            color: "white",
            border: "none",
            padding: "10px 18px",
            borderRadius: "8px",
            cursor: "pointer"
          }}
        >
          Cerrar
        </button>
      </div>
    </div>
  </div>
)}
    </main>
  );
}