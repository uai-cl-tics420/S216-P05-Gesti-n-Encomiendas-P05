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
interface Visit {
  id: number; visitor_name: string; visitor_rut: string;
  department: string; has_car: boolean; car_plate?: string;
  qr_code: string; used: boolean; created_at: string; expires_at: string;
}

const statusInfo = {
  pendiente: { label: "Pendiente", bg: "#FFF3E0", color: "#E65100" },
  en_revision: { label: "En revisión", bg: "#E3F2FD", color: "#1565C0" },
  resuelto: { label: "Resuelto", bg: "#E8F5E9", color: "#2E7D32" },
  rechazado: { label: "Rechazado", bg: "#FAFAFA", color: "#616161" },
};

type ActiveView = "paquetes" | "visitas" | "nueva_visita" | "reclamos" | "nuevo_reclamo";

export default function ResidenteDashboard({ user, onLogout }: { user: User; onLogout: () => void }) {
  const { LL, locale, setLocale } = useI18nContext();
  const lang = locale;
  const toggleLang = () => setLocale(locale === 'es' ? 'en' : 'es');
  const token = localStorage.getItem("incharge_token");

  const [packages, setPackages] = useState<Package[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"todos" | "pendiente" | "entregado">("todos");
  const [activeView, setActiveView] = useState<ActiveView>("paquetes");
  const [showNotifications, setShowNotifications] = useState(false);
  const [viewPackage, setViewPackage] = useState<Package | null>(null);
  const [viewVisitQR, setViewVisitQR] = useState<Visit | null>(null);
  const [complaintForm, setComplaintForm] = useState({ package_id: "", title: "", description: "" });
  const [visitForm, setVisitForm] = useState({ visitor_name: "", visitor_rut: "", department: "", has_car: false, car_plate: "" });
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const inputStyle = { width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid #d1d5db", fontSize: "14px", boxSizing: "border-box" as const };
  const showToast = (msg: string, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 3000); };

  useEffect(() => {
    fetch(`/api/packages?user_id=${user.id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => { setPackages(Array.isArray(d) ? d : []); setLoading(false); });
    fetch("/api/notifications", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => setNotifications(Array.isArray(d) ? d : []));
  }, []);

  useEffect(() => {
    if (viewVisitQR) {
      import("qrcode").then(QRCode => {
        const canvas = document.getElementById("visit-qr-canvas") as HTMLCanvasElement;
        if (canvas) QRCode.toCanvas(canvas, viewVisitQR.qr_code, { width: 200 });
      });
    }
  }, [viewVisitQR]);

  const loadComplaints = async () => {
    const res = await fetch(`/api/complaints?user_id=${user.id}`, { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) setComplaints(await res.json());
  };

  const loadVisits = async () => {
    const res = await fetch("/api/visits", { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) setVisits(await res.json());
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
    if (!complaintForm.title.trim()) { showToast("Ingresa un título", false); return; }
    const res = await fetch("/api/complaints", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ user_id: user.id, package_id: complaintForm.package_id || null, title: complaintForm.title, description: complaintForm.description }),
    });
    const data = await res.json();
    if (!res.ok) { showToast(data.error || "Error", false); return; }
    showToast(LL.sendComplaint());
    setComplaintForm({ package_id: "", title: "", description: "" });
    loadComplaints();
    setActiveView("reclamos");
  };

  const handleCreateVisit = async () => {
    if (!visitForm.visitor_name || !visitForm.visitor_rut || !visitForm.department) {
      showToast("Completa todos los campos", false); return;
    }
    const res = await fetch("/api/visits", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(visitForm),
    });
    const data = await res.json();
    if (!res.ok) { showToast(data.error || "Error", false); return; }
    showToast(LL.registerVisit());
    setVisitForm({ visitor_name: "", visitor_rut: "", department: "", has_car: false, car_plate: "" });
    setViewVisitQR(data);
    loadVisits();
    setActiveView("visitas");
  };

  const unread = notifications.filter(n => !n.is_read).length;
  const filteredPackages = packages.filter(p => filter === "todos" || p.status === filter);

  const navItems = [
    { key: "paquetes", label: LL.myPackages(), color: "#1565C0" },
    { key: "visitas", label: LL.myVisits(), color: "#1D9E75", onClick: () => { loadVisits(); setActiveView("visitas"); } },
    { key: "nueva_visita", label: LL.registerVisit(), color: "#022042" },
    { key: "reclamos", label: LL.myComplaints(), color: "#7C3AED", onClick: () => { loadComplaints(); setActiveView("reclamos"); } },
    { key: "nuevo_reclamo", label: LL.createComplaint(), color: "#EF5350" },
  ];

  return (
    <main style={{ minHeight: "100vh", background: "#f5f5f5", fontFamily: "sans-serif" }}>
      {toast && (
        <div style={{ position: "fixed", top: "1rem", left: "50%", transform: "translateX(-50%)", background: toast.ok ? "#1D9E75" : "#EF5350", color: "white", padding: "12px 24px", borderRadius: "10px", fontSize: "14px", fontWeight: "500", zIndex: 1000, boxShadow: "0 4px 12px rgba(0,0,0,0.2)" }}>
          {toast.msg}
        </div>
      )}

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

      <div style={{ display: "flex", minHeight: "calc(100vh - 64px)" }}>
        {/* Sidebar */}
        <div style={{ width: "220px", background: "white", borderRight: "0.5px solid #e0e0e0", padding: "1.5rem 1rem", flexShrink: 0 }}>
          <p style={{ fontSize: "11px", color: "#999", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "1rem", fontWeight: 600 }}>Menú</p>
          {navItems.map(item => (
            <button key={item.key} onClick={() => item.onClick ? item.onClick() : setActiveView(item.key as ActiveView)}
              style={{ width: "100%", textAlign: "left", padding: "10px 14px", borderRadius: "10px", border: "none", cursor: "pointer", fontSize: "14px", fontWeight: activeView === item.key ? 600 : 400, background: activeView === item.key ? `${item.color}15` : "transparent", color: activeView === item.key ? item.color : "#555", marginBottom: "4px", transition: "all 0.15s" }}>
              {item.label}
            </button>
          ))}
        </div>

        {/* Contenido */}
        <div style={{ flex: 1, padding: "2rem", maxWidth: "800px" }}>

          {/* Paquetes */}
          {activeView === "paquetes" && (
            <>
              <div style={{ marginBottom: "2rem" }}>
                <h1 style={{ fontSize: "22px", fontWeight: "500", color: "#1a1a1a", marginBottom: "4px" }}>{LL.myPackages()}</h1>
                <p style={{ fontSize: "14px", color: "#999" }}>{LL.welcome()}, {user.name}</p>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
                {[
                  { key: "pendiente", label: LL.pending(), value: packages.filter(p => p.status === "pendiente").length, color: "#EF5350" },
                  { key: "entregado", label: LL.delivered(), value: packages.filter(p => p.status === "entregado").length, color: "#1D9E75" },
                  { key: "todos", label: LL.total(), value: packages.length, color: "#022042" },
                ].map(({ key, label, value, color }) => (
                  <div key={key} onClick={() => setFilter(key as any)} style={{ background: "white", borderRadius: "12px", padding: "1.5rem", textAlign: "center", border: filter === key ? `2px solid ${color}` : "0.5px solid #e0e0e0", cursor: "pointer" }}>
                    <p style={{ fontSize: "32px", fontWeight: "500", color, margin: 0 }}>{value}</p>
                    <p style={{ fontSize: "13px", color: "#999", margin: "4px 0 0" }}>{label}</p>
                  </div>
                ))}
              </div>
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
            </>
          )}

          {/* Mis Visitas */}
          {activeView === "visitas" && (
            <>
              <div style={{ marginBottom: "2rem" }}>
                <h1 style={{ fontSize: "22px", fontWeight: "500", color: "#1a1a1a", marginBottom: "4px" }}>{LL.myVisits()}</h1>
                <p style={{ fontSize: "14px", color: "#999" }}>{LL.recentVisits()}</p>
              </div>
              {visits.length === 0 ? (
                <div style={{ background: "white", borderRadius: "12px", padding: "3rem", textAlign: "center", border: "0.5px solid #e0e0e0" }}>
                  <p style={{ color: "#999" }}>{LL.noVisits()}</p>
                  <button onClick={() => setActiveView("nueva_visita")} style={{ marginTop: "1rem", padding: "10px 20px", background: "#1D9E75", color: "white", border: "none", borderRadius: "8px", cursor: "pointer" }}>{LL.registerVisit()}</button>
                </div>
              ) : visits.map(v => (
                <div key={v.id} onClick={() => setViewVisitQR(v)} style={{ marginBottom: "16px", padding: "18px", borderRadius: "14px", border: v.used ? "1px solid #d7f5e5" : "1px solid #e5e7eb", background: v.used ? "#f8fffb" : "white", cursor: "pointer", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <p style={{ fontWeight: 600, margin: 0, fontSize: "15px" }}>{v.visitor_name}</p>
                      <p style={{ color: "#666", fontSize: "13px", margin: "4px 0" }}>{v.visitor_rut} — {LL.department()} {v.department}</p>
                      {v.has_car && <p style={{ color: "#666", fontSize: "12px", margin: 0 }}>{LL.carPlate()}: {v.car_plate}</p>}
                      <p style={{ color: "#999", fontSize: "11px", marginTop: "6px" }}>{new Date(v.created_at).toLocaleString()}</p>
                    </div>
                    <span style={{ padding: "6px 12px", borderRadius: "999px", fontSize: "12px", fontWeight: 600, background: v.used ? "#E8F5E9" : "#E3F2FD", color: v.used ? "#2E7D32" : "#1565C0" }}>
                      {v.used ? LL.visitUsed() : LL.visitActive()}
                    </span>
                  </div>
                </div>
              ))}
            </>
          )}

          {/* Nueva Visita */}
          {activeView === "nueva_visita" && (
            <>
              <div style={{ marginBottom: "2rem" }}>
                <h1 style={{ fontSize: "22px", fontWeight: "500", color: "#1a1a1a", marginBottom: "4px" }}>{LL.registerVisit()}</h1>
                <p style={{ fontSize: "14px", color: "#999" }}>{LL.generateCode()}</p>
              </div>
              <div style={{ background: "white", borderRadius: "14px", padding: "24px", border: "0.5px solid #e0e0e0" }}>
                <div style={{ marginBottom: "14px" }}>
                  <label style={{ display: "block", marginBottom: "6px", fontWeight: 600, color: "#374151", fontSize: "13px" }}>{LL.visitorName()} *</label>
                  <input type="text" placeholder="Juan Pérez" value={visitForm.visitor_name} onChange={e => setVisitForm({ ...visitForm, visitor_name: e.target.value })} style={inputStyle} />
                </div>
                <div style={{ marginBottom: "14px" }}>
                  <label style={{ display: "block", marginBottom: "6px", fontWeight: 600, color: "#374151", fontSize: "13px" }}>{LL.visitorRut()} *</label>
                  <input type="text" placeholder="12.345.678-9" value={visitForm.visitor_rut} onChange={e => setVisitForm({ ...visitForm, visitor_rut: e.target.value })} style={inputStyle} />
                </div>
                <div style={{ marginBottom: "14px" }}>
                  <label style={{ display: "block", marginBottom: "6px", fontWeight: 600, color: "#374151", fontSize: "13px" }}>{LL.department()} *</label>
                  <input type="text" placeholder="Ej: 504" value={visitForm.department} onChange={e => setVisitForm({ ...visitForm, department: e.target.value })} style={inputStyle} />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
                  <input type="checkbox" id="has_car" checked={visitForm.has_car} onChange={e => setVisitForm({ ...visitForm, has_car: e.target.checked })} />
                  <label htmlFor="has_car" style={{ fontSize: "14px", color: "#374151", fontWeight: 600 }}>{LL.hasCar()}</label>
                </div>
                {visitForm.has_car && (
                  <div style={{ marginBottom: "14px" }}>
                    <label style={{ display: "block", marginBottom: "6px", fontWeight: 600, color: "#374151", fontSize: "13px" }}>{LL.carPlate()}</label>
                    <input type="text" placeholder="ABCD12" value={visitForm.car_plate} onChange={e => setVisitForm({ ...visitForm, car_plate: e.target.value })} style={inputStyle} />
                  </div>
                )}
                <button onClick={handleCreateVisit} style={{ width: "100%", padding: "12px", background: "#1D9E75", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: 600, marginTop: "8px" }}>{LL.generateCode()}</button>
              </div>
            </>
          )}

          {/* Mis Reclamos */}
          {activeView === "reclamos" && (
            <>
              <div style={{ marginBottom: "2rem" }}>
                <h1 style={{ fontSize: "22px", fontWeight: "500", color: "#1a1a1a", marginBottom: "4px" }}>{LL.myComplaints()}</h1>
                <p style={{ fontSize: "14px", color: "#999" }}>{LL.conciergeSubtitle()}</p>
              </div>
              {complaints.length === 0 ? (
                <div style={{ background: "white", borderRadius: "12px", padding: "3rem", textAlign: "center", border: "0.5px solid #e0e0e0" }}>
                  <p style={{ color: "#999" }}>{LL.noComplaints()}</p>
                  <button onClick={() => setActiveView("nuevo_reclamo")} style={{ marginTop: "1rem", padding: "10px 20px", background: "#EF5350", color: "white", border: "none", borderRadius: "8px", cursor: "pointer" }}>{LL.createComplaint()}</button>
                </div>
              ) : complaints.map(c => {
                const state = statusInfo[c.status as keyof typeof statusInfo] ?? statusInfo.pendiente;
                return (
                  <div key={c.id} style={{ marginBottom: "16px", padding: "18px", borderRadius: "14px", border: "1px solid #e5e7eb", background: "white", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
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
            </>
          )}

          {/* Nuevo Reclamo */}
          {activeView === "nuevo_reclamo" && (
            <>
              <div style={{ marginBottom: "2rem" }}>
                <h1 style={{ fontSize: "22px", fontWeight: "500", color: "#1a1a1a", marginBottom: "4px" }}>{LL.createComplaint()}</h1>
                <p style={{ fontSize: "14px", color: "#999" }}>{LL.complaintDescription()}</p>
              </div>
              <div style={{ background: "white", borderRadius: "14px", padding: "24px", border: "0.5px solid #e0e0e0" }}>
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
                  <button onClick={() => setActiveView("reclamos")} style={{ background: "white", color: "#6B7280", border: "1px solid #d1d5db", padding: "10px 16px", borderRadius: "8px", cursor: "pointer" }}>{LL.cancel()}</button>
                  <button onClick={handleComplaint} style={{ background: "#EF5350", color: "white", border: "none", padding: "10px 18px", borderRadius: "8px", cursor: "pointer", fontWeight: 600 }}>{LL.sendComplaint()}</button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modal ver paquete */}
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

      {/* Modal QR visita */}
      {viewVisitQR && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999 }}>
          <div style={{ background: "white", width: "90%", maxWidth: "400px", borderRadius: "14px", padding: "24px", textAlign: "center" }}>
            <h2 style={{ margin: "0 0 8px" }}>{LL.visitCode()}</h2>
            <p style={{ color: "#777", fontSize: "13px", marginBottom: "20px" }}>{LL.generateCode()}</p>
            <div style={{ background: "#f8fafc", borderRadius: "12px", padding: "20px", marginBottom: "16px" }}>
              <p style={{ margin: "0 0 8px", fontWeight: 600 }}>{viewVisitQR.visitor_name}</p>
              <p style={{ margin: "0 0 8px", color: "#666", fontSize: "13px" }}>{viewVisitQR.visitor_rut}</p>
              <p style={{ margin: "0 0 8px", color: "#666", fontSize: "13px" }}>{LL.department()}: {viewVisitQR.department}</p>
              {viewVisitQR.has_car && <p style={{ margin: 0, color: "#666", fontSize: "13px" }}>{LL.carPlate()}: {viewVisitQR.car_plate}</p>}
            </div>
            <div style={{ background: "#E8F5E9", border: "1px solid #A5D6A7", borderRadius: "12px", padding: "20px", marginBottom: "16px", display: "flex", flexDirection: "column", alignItems: "center" }}>
              <p style={{ margin: "0 0 12px", color: "#777", fontSize: "12px" }}>{LL.qrCode()}</p>
              <canvas id="visit-qr-canvas" style={{ borderRadius: "8px" }} />
              <p style={{ margin: "12px 0 0", fontSize: "11px", color: "#999", wordBreak: "break-all", textAlign: "center" }}>{viewVisitQR.qr_code}</p>
            </div>
            <p style={{ color: "#999", fontSize: "12px", marginBottom: "16px" }}>Expira: {new Date(viewVisitQR.expires_at).toLocaleString()}</p>
            <button onClick={() => setViewVisitQR(null)} style={{ width: "100%", padding: "12px", background: "#1565C0", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: 600 }}>{LL.cancel()}</button>
          </div>
        </div>
      )}
    </main>
  );
}