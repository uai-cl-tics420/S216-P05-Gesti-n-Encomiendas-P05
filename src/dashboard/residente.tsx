import { useEffect, useState } from "react";
import { useI18nContext } from "../i18n/i18n-react.js";

interface User { id: number; name: string; email: string; role: string; }
interface Package {
  id: number; tracking_code: string; description: string;
  status: string; created_at: string;
  transfers: { verification_code: string; receiver_name?: string; receiver_rut?: string; delivered_at?: string; }[];
}
interface Notification { id: number; message: string; is_read: boolean; is_urgent: boolean; created_at: string; }
interface Complaint { id: number; title: string; description: string; status: string; created_at: string; }

const statusInfo = {
  pendiente: { label: "Pendiente", bg: "#FFF3E0", color: "#E65100" },
  en_revision: { label: "En revisión", bg: "#E3F2FD", color: "#1565C0" },
  resuelto: { label: "Resuelto", bg: "#E8F5E9", color: "#2E7D32" },
  rechazado: { label: "Rechazado", bg: "#FAFAFA", color: "#616161" },
};

export default function ResidenteDashboard({ user, onLogout }: { user: User; onLogout: () => void }) {
  const { LL, locale, setLocale } = useI18nContext();
  const lang = locale;
  const toggleLang = () => setLocale(locale === 'es' ? 'en' : 'es');
  const token = localStorage.getItem("incharge_token");

  const [packages, setPackages] = useState<Package[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"todos" | "pendiente" | "entregado">("todos");
  const [showNotifications, setShowNotifications] = useState(false);
  const [showComplaints, setShowComplaints] = useState(false);
  const [showComplaintForm, setShowComplaintForm] = useState(false);
  const [viewPackage, setViewPackage] = useState<Package | null>(null);
  const [complaintForm, setComplaintForm] = useState({ package_id: "", title: "", description: "" });

  const inputStyle = { width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid #d1d5db", fontSize: "14px", boxSizing: "border-box" as const };

  useEffect(() => {
    fetch(`/api/packages?user_id=${user.id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => { setPackages(d); setLoading(false); });
    fetch("/api/notifications", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => setNotifications(d));
  }, []);

  const loadComplaints = async () => {
    const res = await fetch(`/api/complaints?user_id=${user.id}`, { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) setComplaints(await res.json());
  };

  const markAsRead = async (id: number) => {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ id }),
    });
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const handleComplaint = async () => {
    if (!complaintForm.title.trim()) { alert(LL.complaintTitle()); return; }
    const res = await fetch("/api/complaints", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ user_id: user.id, package_id: complaintForm.package_id || null, title: complaintForm.title, description: complaintForm.description }),
    });
    const data = await res.json();
    if (!res.ok) { alert(data.error || "Error"); return; }
    alert(LL.sendComplaint());
    setComplaintForm({ package_id: "", title: "", description: "" });
    setShowComplaintForm(false);
    loadComplaints();
  };

  const unread = notifications.filter(n => !n.is_read).length;
  const filteredPackages = packages.filter(p => filter === "todos" || p.status === filter);

  return (
    <main style={{ minHeight: "100vh", background: "#f5f5f5", fontFamily: "sans-serif" }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #1a2a6c, #1565C0)", padding: "1rem 2rem", display: "flex", flexWrap: "wrap", gap: "0.75rem", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: "22px", fontWeight: "500", color: "white" }}>in<span style={{ color: "#EF5350" }}>Charge.</span></span>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "1rem" }}>
          <div style={{ position: "relative" }}>
            <button onClick={() => setShowNotifications(!showNotifications)} style={{ background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.4)", borderRadius: "50%", width: "38px", height: "38px", cursor: "pointer", fontSize: "16px", position: "relative" }}>
              🔔
              {unread > 0 && (
                <span style={{ position: "absolute", top: "-4px", right: "-4px", background: "#EF5350", color: "white", borderRadius: "50%", minWidth: "18px", height: "18px", fontSize: "11px", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 4px", border: "2px solid #1565C0" }}>
                  {unread}
                </span>
              )}
            </button>
            {showNotifications && (
              <div style={{ position: "absolute", top: "48px", right: 0, width: "min(320px, 85vw)", background: "white", borderRadius: "12px", boxShadow: "0 8px 30px rgba(0,0,0,0.2)", zIndex: 9999, overflow: "hidden" }}>
                <div style={{ padding: "12px 16px", borderBottom: "0.5px solid #e0e0e0", fontWeight: 600, fontSize: "14px" }}>{LL.notifications()}</div>
                {notifications.length === 0 ? (
                  <p style={{ padding: "1.5rem", textAlign: "center", color: "#999", fontSize: "13px" }}>{LL.noNotifications()}</p>
                ) : (
                  <div style={{ maxHeight: "320px", overflowY: "auto" }}>
                    {notifications.map(n => (
                      <div key={n.id} onClick={() => markAsRead(n.id)} style={{ padding: "12px 16px", borderBottom: "0.5px solid #f0f0f0", background: n.is_read ? "white" : "#F0F7FF", cursor: "pointer" }}>
                        <p style={{ margin: 0, fontSize: "13px", color: "#1a1a1a" }}>{n.is_urgent ? "! " : ""}{n.message}</p>
                        <p style={{ margin: "4px 0 0", fontSize: "11px", color: "#999" }}>{new Date(n.created_at).toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          <button onClick={toggleLang} style={{ padding: "6px 14px", background: "rgba(255,255,255,0.2)", color: "white", border: "1px solid rgba(255,255,255,0.4)", borderRadius: "20px", cursor: "pointer", fontSize: "13px" }}>{lang === "es" ? "EN" : "ES"}</button>
          <span style={{ color: "white", fontSize: "14px" }}>👤 {user.name}</span>
          <button onClick={onLogout} style={{ padding: "8px 16px", background: "#EF5350", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "13px" }}>{LL.logout()}</button>
        </div>
      </div>

      <div style={{ padding: "2rem", maxWidth: "900px", margin: "0 auto" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
          <div>
            <h1 style={{ fontSize: "22px", fontWeight: "500", color: "#1a1a1a", marginBottom: "4px" }}>{LL.myPackages()}</h1>
            <p style={{ fontSize: "14px", color: "#999" }}>{LL.welcome()}, {user.name}</p>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <button onClick={() => { loadComplaints(); setShowComplaints(true); }} style={{ padding: "10px 18px", background: "#1565C0", color: "white", border: "none", borderRadius: "10px", cursor: "pointer" }}>{LL.myComplaints()}</button>
            <button onClick={() => setShowComplaintForm(true)} style={{ padding: "10px 18px", background: "#EF5350", color: "white", border: "none", borderRadius: "10px", cursor: "pointer" }}>{LL.createComplaint()}</button>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
          {[
            { key: "pendiente", label: LL.pending(), value: packages.filter(p => p.status === "pendiente").length, color: "#EF5350" },
            { key: "entregado", label: LL.delivered(), value: packages.filter(p => p.status === "entregado").length, color: "#1D9E75" },
            { key: "todos", label: LL.total(), value: packages.length, color: "#022042" },
          ].map(({ key, label, value, color }) => (
            <div key={key} onClick={() => setFilter(key as any)} style={{ background: "white", borderRadius: "12px", padding: "1.5rem", textAlign: "center", border: filter === key ? `2px solid ${color}` : "0.5px solid #e0e0e0", cursor: "pointer", transition: "all 0.2s" }}>
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
          ) : filteredPackages.length === 0 ? (
            <p style={{ padding: "2rem", textAlign: "center", color: "#999" }}>{LL.noPackages()}</p>
          ) : filteredPackages.map(pkg => (
            <div key={pkg.id} onClick={() => setViewPackage(pkg)}
              style={{ margin: "12px", padding: "18px", borderRadius: "14px", border: pkg.status === "pendiente" ? "1px solid #ffe0e0" : "1px solid #d7f5e5", background: pkg.status === "pendiente" ? "#fffdfd" : "#f8fffb", cursor: "pointer", transition: "all 0.25s ease", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 20px rgba(0,0,0,0.12)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.05)"; }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", gap: "14px" }}>
                  <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: pkg.status === "pendiente" ? "#FFF3E0" : "#E8F5E9", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ width: "20px", height: "20px", borderRadius: "50%", background: pkg.status === "pendiente" ? "#E65100" : "#2E7D32" }} />
                  </div>
                  <div>
                    <p style={{ fontWeight: 600, margin: 0, fontSize: "15px", color: "#1a1a1a" }}>{pkg.tracking_code}</p>
                    <p style={{ margin: "4px 0", color: "#666", fontSize: "13px" }}>{pkg.description || "Sin descripción"}</p>
                    <p style={{ color: "#999", margin: 0, fontSize: "12px" }}>{new Date(pkg.created_at).toLocaleDateString()}</p>
                    <p style={{ color: "#1565C0", marginTop: "8px", marginBottom: 0, fontSize: "12px", fontWeight: 500 }}>
                      {pkg.status === "pendiente" ? LL.retrievalCode() : LL.viewDetail()}
                    </p>
                  </div>
                </div>
                <span style={{ background: pkg.status === "pendiente" ? "#FFF3E0" : "#E8F5E9", color: pkg.status === "pendiente" ? "#E65100" : "#2E7D32", padding: "8px 14px", borderRadius: "999px", fontSize: "12px", fontWeight: 600 }}>
                  {pkg.status === "pendiente" ? LL.pending() : LL.delivered()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Ver paquete */}
      {viewPackage && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999 }}>
          <div style={{ background: "white", width: "90%", maxWidth: "500px", borderRadius: "12px", padding: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
              <div style={{ width: "50px", height: "50px", borderRadius: "12px", background: viewPackage.status === "pendiente" ? "#FFF3E0" : "#E8F5E9", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ width: "22px", height: "22px", borderRadius: "50%", background: viewPackage.status === "pendiente" ? "#E65100" : "#2E7D32" }} />
              </div>
              <div>
                <h2 style={{ margin: 0 }}>{viewPackage.status === "pendiente" ? LL.retrievalCode() : LL.registerDelivery()}</h2>
                <p style={{ margin: "4px 0 0", color: "#777", fontSize: "13px" }}>{viewPackage.status === "pendiente" ? LL.otpCode() : LL.viewDetail()}</p>
              </div>
            </div>
            <div style={{ background: "#f8fafc", borderRadius: "12px", padding: "16px", marginBottom: "16px" }}>
              <p><strong>{LL.trackingCode()}:</strong> {viewPackage.tracking_code}</p>
              <p><strong>{LL.description()}:</strong> {viewPackage.description}</p>
            </div>
            {viewPackage.status === "pendiente" ? (
              <div style={{ background: "#FFF8E1", border: "1px solid #FFD54F", borderRadius: "12px", padding: "24px", textAlign: "center" }}>
                <p style={{ margin: 0, color: "#777", fontSize: "13px" }}>{LL.retrievalCode()}</p>
                <p style={{ margin: "12px 0", fontSize: "42px", fontWeight: 700, letterSpacing: "8px", color: "#1565C0" }}>{viewPackage.transfers?.[0]?.verification_code}</p>
                <p style={{ margin: 0, fontSize: "13px", color: "#777" }}>{LL.otpCode()}</p>
              </div>
            ) : (
              <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "12px", padding: "16px" }}>
                <p><strong>{LL.receiverName()}:</strong> {viewPackage.transfers?.[0]?.receiver_name || "Sin registro"}</p>
                <p><strong>{LL.receiverRut()}:</strong> {viewPackage.transfers?.[0]?.receiver_rut || "Sin registro"}</p>
                <p><strong>Fecha:</strong> {viewPackage.transfers?.[0]?.delivered_at ? new Date(viewPackage.transfers[0].delivered_at).toLocaleString() : "Sin registro"}</p>
              </div>
            )}
            <div style={{ marginTop: "20px", textAlign: "right" }}>
              <button onClick={() => setViewPackage(null)} style={{ background: "#1565C0", color: "white", border: "none", padding: "10px 18px", borderRadius: "8px", cursor: "pointer" }}>{LL.cancel()}</button>
            </div>
          </div>
        </div>
      )}

      {/* Mis reclamos */}
      {showComplaints && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999 }}>
          <div style={{ background: "white", width: "90%", maxWidth: "600px", maxHeight: "80vh", overflowY: "auto", borderRadius: "14px", padding: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h2 style={{ margin: 0 }}>{LL.myComplaints()}</h2>
              <button onClick={() => setShowComplaints(false)} style={{ background: "#EF5350", color: "white", border: "none", padding: "10px 16px", borderRadius: "8px", cursor: "pointer" }}>{LL.cancel()}</button>
            </div>
            {complaints.length === 0 ? <p style={{ color: "#999" }}>{LL.noComplaints()}</p> : complaints.map(c => {
              const state = statusInfo[c.status as keyof typeof statusInfo] ?? statusInfo.pendiente;
              return (
                <div key={c.id} style={{ marginBottom: "16px", padding: "18px", borderRadius: "14px", border: "1px solid #e5e7eb", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: "16px" }}>{c.title}</h3>
                      <p style={{ color: "#999", fontSize: "12px", marginTop: "4px" }}>{new Date(c.created_at).toLocaleString()}</p>
                      <p style={{ fontSize: "13px", color: "#555", marginTop: "8px" }}>{c.description}</p>
                    </div>
                    <span style={{ padding: "6px 12px", borderRadius: "999px", fontSize: "12px", fontWeight: 600, background: state.bg, color: state.color, whiteSpace: "nowrap" }}>{state.label}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Crear reclamo */}
      {showComplaintForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999 }}>
          <div style={{ background: "white", width: "90%", maxWidth: "600px", borderRadius: "14px", padding: "24px", boxShadow: "0 8px 30px rgba(0,0,0,0.2)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
              <div style={{ width: "50px", height: "50px", borderRadius: "12px", background: "#FFF3E0", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ width: "22px", height: "22px", borderRadius: "4px", background: "#E65100" }} />
              </div>
              <div>
                <h2 style={{ margin: 0 }}>{LL.createComplaint()}</h2>
                <p style={{ margin: "4px 0 0", color: "#777", fontSize: "13px" }}>{LL.complaintDescription()}</p>
              </div>
            </div>
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: 600, color: "#374151" }}>{LL.relatedPackage()}</label>
              <select value={complaintForm.package_id} onChange={e => setComplaintForm({ ...complaintForm, package_id: e.target.value })} style={inputStyle}>
                <option value="">{LL.noAssociatedPackage()}</option>
                {packages.map(pkg => <option key={pkg.id} value={pkg.id}>{pkg.tracking_code}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: 600, color: "#374151" }}>{LL.complaintTitle()}</label>
              <input type="text" placeholder="Ej: Problema con entrega de paquete" value={complaintForm.title} onChange={e => setComplaintForm({ ...complaintForm, title: e.target.value })} style={inputStyle} />
            </div>
            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: 600, color: "#374151" }}>{LL.complaintDescription()}</label>
              <textarea value={complaintForm.description} onChange={e => setComplaintForm({ ...complaintForm, description: e.target.value })} rows={5} placeholder="Describe detalladamente el problema..." style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }} />
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button onClick={() => setShowComplaintForm(false)} style={{ background: "white", color: "#6B7280", border: "1px solid #d1d5db", padding: "10px 16px", borderRadius: "8px", cursor: "pointer" }}>{LL.cancel()}</button>
              <button onClick={handleComplaint} style={{ background: "#EF5350", color: "white", border: "none", padding: "10px 18px", borderRadius: "8px", cursor: "pointer", fontWeight: 600 }}>{LL.sendComplaint()}</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}