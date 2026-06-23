import { useEffect, useState } from "react";
import { useI18nContext } from "../i18n/i18n-react.js";

interface User {
  id: number;
  name?: string;
  email: string;
  role: string;
}

interface AdminDashboardProps {
  user: { id: number; name: string; email: string; role: string; };
  onLogout: () => void;
}

export default function AdminDashboard({ user, onLogout }: AdminDashboardProps) {
  const { LL, locale, setLocale } = useI18nContext();
  const lang = locale;
  const toggleLang = () => setLocale(locale === 'es' ? 'en' : 'es');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [newUser, setNewUser] = useState({ name: "", email: "", password: "", role: "residente" });
  const token = localStorage.getItem("incharge_token");

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

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

  const deleteUser = async (id: number) => {
    if (!confirm(LL.confirmDelete())) return;
    try {
      const res = await fetch(`/api/users?id=${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setUsers((prev) => prev.filter((u) => u.id !== id));
        showToast(LL.deleteUser());
      } else {
        showToast("Error al eliminar", false);
      }
    } catch {
      showToast("Error al eliminar", false);
    }
  };

  const addUser = async () => {
    if (!newUser.name || !newUser.email || !newUser.password) {
      showToast("Completa todos los campos", false);
      return;
    }
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(newUser),
      });
      const data = await res.json();
      if (!res.ok) { showToast(data.error || "Error", false); return; }
      showToast(LL.addUser());
      setNewUser({ name: "", email: "", password: "", role: "residente" });
      setShowAddForm(false);
      fetch("/api/users", { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json())
        .then(d => setUsers(d || []));
    } catch {
      showToast("Error al crear usuario", false);
    }
  };

  const roleColor = (role: string) => {
    if (role === "admin") return { bg: "#EF535020", color: "#EF5350" };
    if (role === "conserje") return { bg: "#1565C020", color: "#1565C0" };
    return { bg: "#1D9E7520", color: "#1D9E75" };
  };

  const inputStyle = {
    width: "100%", padding: "10px 14px", border: "1.5px solid #e8e8e8",
    borderRadius: "8px", fontSize: "14px", outline: "none", boxSizing: "border-box" as const,
  };

  return (
    <main style={{ minHeight: "100vh", background: "#f4f4f4", fontFamily: "sans-serif" }}>
      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", top: "1rem", left: "50%", transform: "translateX(-50%)", background: toast.ok ? "#1D9E75" : "#EF5350", color: "white", padding: "12px 24px", borderRadius: "10px", fontSize: "14px", fontWeight: "500", zIndex: 1000, boxShadow: "0 4px 12px rgba(0,0,0,0.2)" }}>
          {toast.msg}
        </div>
      )}

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

        {/* Formulario agregar usuario */}
        {showAddForm && (
          <div style={{ background: "white", borderRadius: "12px", border: "1.5px solid #1565C0", padding: "1.5rem", marginBottom: "1.5rem" }}>
            <p style={{ fontWeight: "500", margin: "0 0 1rem", color: "#1565C0" }}>{LL.addUser()}</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div>
                <label style={{ fontSize: "12px", color: "#777", marginBottom: "5px", display: "block" }}>{LL.fullName()} *</label>
                <input type="text" placeholder="Juan Pérez" value={newUser.name}
                  onChange={e => setNewUser({ ...newUser, name: e.target.value })} style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: "12px", color: "#777", marginBottom: "5px", display: "block" }}>{LL.email()} *</label>
                <input type="email" placeholder="juan@correo.com" value={newUser.email}
                  onChange={e => setNewUser({ ...newUser, email: e.target.value })} style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: "12px", color: "#777", marginBottom: "5px", display: "block" }}>{LL.password()} *</label>
                <input type="password" placeholder="••••••••" value={newUser.password}
                  onChange={e => setNewUser({ ...newUser, password: e.target.value })} style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: "12px", color: "#777", marginBottom: "5px", display: "block" }}>{LL.userType()}</label>
                <select value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })} style={inputStyle}>
                  <option value="residente">{LL.residents()}</option>
                  <option value="conserje">{LL.concierges()}</option>
                  <option value="admin">{LL.admins()}</option>
                </select>
              </div>
            </div>
            <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
              <button onClick={addUser} style={{ padding: "10px 24px", background: "#1565C0", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "14px" }}>
                {LL.addUser()}
              </button>
              <button onClick={() => setShowAddForm(false)} style={{ padding: "10px 24px", background: "white", color: "#999", border: "1.5px solid #e0e0e0", borderRadius: "8px", cursor: "pointer", fontSize: "14px" }}>
                {LL.cancel()}
              </button>
            </div>
          </div>
        )}

        {/* Usuarios */}
        <div style={{ background: "white", borderRadius: "12px", border: "0.5px solid #e0e0e0", overflow: "hidden" }}>
          <div style={{ padding: "1rem 1.5rem", borderBottom: "0.5px solid #e0e0e0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <p style={{ fontWeight: "500", margin: 0, color: "#1a1a1a" }}>{LL.registeredUsers()}</p>
            <button onClick={() => setShowAddForm(!showAddForm)} style={{ padding: "8px 16px", background: "#1565C0", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "13px" }}>
              + {LL.addUser()}
            </button>
          </div>
          {loading ? (
            <p style={{ padding: "2rem", textAlign: "center", color: "#999" }}>{LL.loadingUsers()}</p>
          ) : users.length === 0 ? (
            <p style={{ padding: "2rem", textAlign: "center", color: "#999" }}>{LL.noUsers()}</p>
          ) : (
            users.map((u) => {
              const { bg, color } = roleColor(u.role);
              return (
                <div key={u.id} style={{ padding: "1rem 1.5rem", borderBottom: "0.5px solid #f0f0f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <p style={{ fontWeight: "500", margin: 0, fontSize: "14px", color: "#1a1a1a" }}>{u.name}</p>
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
                    <button onClick={() => deleteUser(u.id)} style={{ padding: "6px 12px", background: "#EF535015", color: "#EF5350", border: "1px solid #EF535040", borderRadius: "8px", cursor: "pointer", fontSize: "12px" }}>
                      {LL.deleteUser()}
                    </button>
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