import { useEffect, useState } from "react";
import { useI18nContext } from "../i18n/i18n-react.js";

interface User {
  id: number;
  name?: string;
  email: string;
  role: string;
}

interface AdminDashboardProps {
  user: {
    id: number;
    name: string;
    email: string;
    role: string;
  };
  onLogout: () => void;
}

export default function AdminDashboard({ user, onLogout }: AdminDashboardProps) {
  const { LL, locale, setLocale } = useI18nContext();
  const lang = locale;
  const toggleLang = () => setLocale(locale === 'es' ? 'en' : 'es');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("incharge_token");

  useEffect(() => {
    fetch("/api/users", { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.json())
      .then((data) => { setUsers(data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const changeRole = async (id: number, newRole: string) => {
    try {
      await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id, role: newRole }),
      });
      setUsers((prev) => prev.map((u) => u.id === id ? { ...u, role: newRole } : u));
    } catch (err) {
      console.error(err);
    }
  };

  const roleColor = (role: string) => {
    if (role === "admin") return { bg: "#EF535020", color: "#EF5350" };
    if (role === "conserje") return { bg: "#1565C020", color: "#1565C0" };
    return { bg: "#1D9E7520", color: "#1D9E75" };
  };

  return (
    <main style={{ minHeight: "100vh", background: "#f4f4f4", fontFamily: "sans-serif" }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #1a2a6c, #1565C0)", padding: "1rem 2rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "14px", color: "rgba(255,255,255,0.7)", letterSpacing: "3px", textTransform: "uppercase" }}>in</span>
          <span style={{ fontSize: "22px", fontWeight: "500", color: "white" }}>Charge<span style={{ color: "#EF5350" }}>.</span></span>
        </div>
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
        <h1 style={{ fontSize: "22px", fontWeight: "500", color: "#1a1a1a", margin: "0 0 4px" }}>{LL.adminPanel()}</h1>
        <p style={{ fontSize: "14px", color: "#999", marginBottom: "2rem" }}>{LL.adminSubtitle()}</p>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", marginBottom: "2rem" }}>
          {[
            { label: LL.residents(), value: users.filter((u) => u.role === "residente").length, color: "#1D9E75" },
            { label: LL.concierges(), value: users.filter((u) => u.role === "conserje").length, color: "#62a9fa" },
            { label: LL.admins(), value: users.filter((u) => u.role === "admin").length, color: "#EF5350" },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ background: "white", borderRadius: "12px", padding: "1.5rem", textAlign: "center", border: "0.5px solid #e0e0e0" }}>
              <p style={{ fontSize: "32px", fontWeight: "500", color, margin: 0 }}>{value}</p>
              <p style={{ fontSize: "13px", color: "#999", margin: "4px 0 0" }}>{label}</p>
            </div>
          ))}
        </div>

        {/* Usuarios */}
        <div style={{ background: "white", borderRadius: "12px", border: "0.5px solid #e0e0e0", overflow: "hidden" }}>
          <div style={{ padding: "1rem 1.5rem", borderBottom: "0.5px solid #e0e0e0" }}>
            <p style={{ fontWeight: "500", margin: 0, color: "#1a1a1a" }}>{LL.registeredUsers()}</p>
          </div>
          {loading ? (
            <p style={{ padding: "2rem", textAlign: "center", color: "#999" }}>{LL.loadingUsers()}</p>
          ) : (
            users.map((u) => {
              const { bg, color } = roleColor(u.role);
              return (
                <div key={u.id} style={{ padding: "1rem 1.5rem", borderBottom: "0.5px solid #f0f0f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <p style={{ fontWeight: "500", margin: 0, fontSize: "14px", color: "#1a1a1a" }}>{u.name || u.name}</p>
                    <p style={{ color: "#999", margin: "2px 0 0", fontSize: "12px" }}>{u.email}</p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                    <span style={{ background: bg, color, padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "500" }}>{u.role}</span>
                    <select value={u.role} onChange={(e) => changeRole(u.id, e.target.value)}
                      style={{ padding: "6px 10px", border: "1.5px solid #e0e0e0", borderRadius: "8px", fontSize: "13px", cursor: "pointer", outline: "none", color: "#1a1a1a" }}>
                      <option value="residente">{LL.residents()}</option>
                      <option value="conserje">{LL.concierges()}</option>
                      <option value="admin">{LL.admins()}</option>
                    </select>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </main>
  );
}