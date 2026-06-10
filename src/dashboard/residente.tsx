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
  transfers: { verification_code: string }[];
}

export default function ResidenteDashboard({ user, onLogout }: { user: User; onLogout: () => void }) {
  const { LL, locale, setLocale } = useI18nContext();
  const lang = locale;
  const toggleLang = () => setLocale(locale === 'es' ? 'en' : 'es');
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("incharge_token");
    fetch(`/api/packages?resident_id=${user.id}`, {
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
            { label: LL.pending(), value: pendientes, color: "#EF5350" },
            { label: LL.delivered(), value: entregados, color: "#1565C0" },
            { label: LL.total(), value: packages.length, color: "#1D9E75" },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ background: "white", borderRadius: "12px", padding: "1.5rem", textAlign: "center", border: "0.5px solid #e0e0e0" }}>
              <p style={{ fontSize: "32px", fontWeight: "500", color, margin: 0 }}>{value}</p>
              <p style={{ fontSize: "13px", color: "#999", margin: "4px 0 0" }}>{label}</p>
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
          ) : packages.map(pkg => {
            const otp = pkg.transfers?.[0]?.verification_code;
            return (
              <div key={pkg.id} style={{ padding: "1rem 1.5rem", borderBottom: "0.5px solid #f0f0f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <p style={{ fontWeight: "500", margin: 0, fontSize: "14px", color: "#1a1a1a" }}>{pkg.tracking_code} – {pkg.description}</p>
                  <p style={{ color: "#999", margin: "2px 0 0", fontSize: "12px" }}>{new Date(pkg.created_at).toLocaleDateString()}</p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  {otp && (
                    <span style={{ background: "#1565C020", color: "#1565C0", padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "500" }}>
                      Código de Retiro: {otp}
                    </span>
                  )}
                  <span style={{
                    background: pkg.status === "pendiente" ? "#EF535020" : "#1D9E7520",
                    color: pkg.status === "pendiente" ? "#EF5350" : "#1D9E75",
                    padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "500"
                  }}>
                    {pkg.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}