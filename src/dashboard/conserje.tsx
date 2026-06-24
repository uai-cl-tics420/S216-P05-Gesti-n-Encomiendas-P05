import { useState, useEffect } from "react";
import { useI18nContext } from "../i18n/i18n-react.js";

interface User { id: number; name: string; email: string; role: string; }
interface Package {
  id: number; tracking_code: string; description: string;
  status: string; created_at: string;
  user: { name: string };
  transfers: { verification_code: string; receiver_name?: string; receiver_rut?: string; delivered_at?: string; }[];
}
interface Complaint {
  id: number; title: string; description: string; status: string; created_at: string;
  user?: { name: string };
  package?: { id: number; tracking_code: string; description: string; };
}
interface Visit {
  id: number; visitor_name: string; visitor_rut: string;
  department: string; has_car: boolean; car_plate?: string;
  qr_code: string; used: boolean; created_at: string; expires_at: string;
  user?: { name: string };
}

const statusInfo = {
  pendiente: { label: "Pendiente", bg: "#FFF3E0", color: "#E65100" },
  en_revision: { label: "En revisión", bg: "#E3F2FD", color: "#1565C0" },
  resuelto: { label: "Resuelto", bg: "#E8F5E9", color: "#2E7D32" },
  rechazado: { label: "Rechazado", bg: "#FAFAFA", color: "#616161" },
};

type ActiveView = "paquetes" | "nuevo_paquete" | "visitas" | "reclamos";

export default function ConserjedDashboard({ user, onLogout }: { user: User; onLogout: () => void }) {
  const { LL, locale, setLocale } = useI18nContext();
  const lang = locale;
  const toggleLang = () => setLocale(locale === 'es' ? 'en' : 'es');
  const token = localStorage.getItem("incharge_token");

  const [packages, setPackages] = useState<Package[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"todos" | "pendiente" | "entregado">("todos");
  const [activeView, setActiveView] = useState<ActiveView>("paquetes");
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [viewPackage, setViewPackage] = useState<Package | null>(null);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [scannedVisit, setScannedVisit] = useState<Visit | null>(null);
  const [visitCode, setVisitCode] = useState("");
  const [visitError, setVisitError] = useState("");
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [form, setForm] = useState({ tracking_code: "", description: "", user_id: "", is_perishable: false });
  const [deliveryForm, setDeliveryForm] = useState({ receiver_name: "", receiver_rut: "", verification_code: "" });

  const showToast = (msg: string, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 3000); };
  const inputStyle = { width: "100%", padding: "10px 14px", border: "1.5px solid #e8e8e8", borderRadius: "8px", fontSize: "14px", outline: "none", boxSizing: "border-box" as const };

  const loadPackages = () => fetch("/api/packages", { headers: { Authorization: `Bearer ${token}` } })
    .then(r => r.json()).then(d => { setPackages(Array.isArray(d) ? d : []); setLoading(false); });

  const loadVisits = async () => {
    const res = await fetch("/api/visits", { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) setVisits(await res.json());
  };

  const loadComplaints = async () => {
    const res = await fetch("/api/complaints?role=conserje", { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) setComplaints(await res.json());
  };

  useEffect(() => {
    loadPackages();
    fetch("/api/users", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => setUsers(d.filter((u: any) => u.role === "residente")));
  }, []);

  const handleAdd = async () => {
    if (!form.tracking_code || !form.user_id) { showToast("Completa los campos requeridos", false); return; }
    const res = await fetch("/api/packages", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ tracking_code: form.tracking_code, description: form.description, user_id: form.user_id, is_perishable: form.is_perishable }),
    });
    const data = await res.json();
    if (!res.ok) { showToast(data.error || "Error", false); return; }
    showToast("Paquete registrado");
    setForm({ tracking_code: "", description: "", user_id: "", is_perishable: false });
    loadPackages();
    setActiveView("paquetes");
  };

  const handleDeliver = async () => {
    if (!selectedPackage) return;
    if (!deliveryForm.receiver_name || !deliveryForm.receiver_rut || !deliveryForm.verification_code) {
      showToast("Completa todos los campos", false); return;
    }
    const res = await fetch("/api/packages", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ package_id: selectedPackage.id, ...deliveryForm }),
    });
    const data = await res.json();
    if (!res.ok) { showToast(data.error || "Código incorrecto", false); return; }
    showToast("Paquete entregado correctamente");
    setPackages(packages.map(p => p.id === selectedPackage.id ? { ...p, status: "entregado" } : p));
    setSelectedPackage(null);
    setDeliveryForm({ receiver_name: "", receiver_rut: "", verification_code: "" });
  };

  const updateComplaintStatus = async (id: number, status: string) => {
    const res = await fetch("/api/complaints", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ complaint_id: id, status }),
    });
    if (!res.ok) { showToast("Error al actualizar", false); return; }
    setComplaints(prev => prev.map(c => c.id === id ? { ...c, status } : c));
    showToast("Estado actualizado");
  };

  const handleScanVisit = async () => {
    if (!visitCode.trim()) { setVisitError("Ingresa un código"); return; }
    setVisitError("");
    const res = await fetch(`/api/visits?qr=${visitCode}`, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    if (!res.ok) { setVisitError(data.error || "Código inválido"); return; }
    setScannedVisit(data);
  };

  const handleConfirmVisit = async () => {
    if (!scannedVisit) return;
    const res = await fetch("/api/visits", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ qr_code: scannedVisit.qr_code }),
    });
    const data = await res.json();
    if (!res.ok) { showToast(data.error || "Error", false); return; }
    showToast("Visita registrada correctamente");
    setScannedVisit(null);
    setVisitCode("");
    loadVisits();
  };

  const filteredPackages = packages.filter(p => filter === "todos" || p.status === filter);

  const navItems = [
    { key: "paquetes", label: LL.packageList(), color: "#1565C0" },
    { key: "nuevo_paquete", label: LL.newPackage(), color: "#022042" },
    { key: "visitas", label: LL.verifyVisit(), color: "#1D9E75", onClick: () => { loadVisits(); setActiveView("visitas"); } },
    { key: "reclamos", label: LL.manageComplaints(), color: "#EF5350", onClick: () => { loadComplaints(); setActiveView("reclamos"); } },
  ];

  return (
    <main style={{ minHeight: "100vh", background: "#f5f5f5", fontFamily: "sans-serif" }}>
      {toast && (
        <div style={{ position: "fixed", top: "1rem", left: "50%", transform: "translateX(-50%)", background: toast.ok ? "#1D9E75" : "#EF5350", color: "white", padding: "12px 24px", borderRadius: "10px", fontSize: "14px", fontWeight: "500", zIndex: 1000, boxShadow: "0 4px 12px rgba(0,0,0,0.2)" }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #1a2a6c, #1565C0)", padding: "1rem 2rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: "22px", fontWeight: "500", color: "white" }}>in<span style={{ color: "#EF5350" }}>Charge.</span></span>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <button onClick={toggleLang} style={{ padding: "6px 14px", background: "rgba(255,255,255,0.2)", color: "white", border: "1px solid rgba(255,255,255,0.4)", borderRadius: "20px", cursor: "pointer", fontSize: "13px" }}>
            {lang === "es" ? "EN" : "ES"}
          </button>
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
        <div style={{ flex: 1, padding: "2rem" }}>

          {/* Paquetes */}
          {activeView === "paquetes" && (
            <>
              <div style={{ marginBottom: "2rem" }}>
                <h1 style={{ fontSize: "22px", fontWeight: "500", color: "#1a1a1a", margin: 0 }}>{LL.conciergePanel()}</h1>
                <p style={{ fontSize: "14px", color: "#999", margin: "4px 0 0" }}>{LL.conciergeSubtitle()}</p>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", marginBottom: "2rem" }}>
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
                  <p style={{ fontWeight: "500", margin: 0, color: "#1a1a1a" }}>{LL.packageList()}</p>
                </div>
                {loading ? (
                  <p style={{ padding: "2rem", textAlign: "center", color: "#999" }}>{LL.loadingUsers()}</p>
                ) : filteredPackages.length === 0 ? (
                  <p style={{ padding: "2rem", textAlign: "center", color: "#999" }}>{LL.noPackages()}</p>
                ) : filteredPackages.map(pkg => (
                  <div key={pkg.id} onClick={() => pkg.status === "pendiente" ? setSelectedPackage(pkg) : setViewPackage(pkg)}
                    style={{ margin: "12px", padding: "18px", borderRadius: "14px", border: pkg.status === "pendiente" ? "1px solid #ffe0e0" : "1px solid #d7f5e5", background: pkg.status === "pendiente" ? "#fffdfd" : "#f8fffb", cursor: "pointer", transition: "all 0.25s ease", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}
                    onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 20px rgba(0,0,0,0.12)"; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.05)"; }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ display: "flex", gap: "14px" }}>
                        <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: pkg.status === "pendiente" ? "#FFF1F1" : "#EAF9F0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px" }}>
                          {pkg.status === "pendiente" ? "📦" : "✅"}
                        </div>
                        <div>
                          <p style={{ fontWeight: 600, margin: 0, fontSize: "15px", color: "#1a1a1a" }}>{pkg.tracking_code}</p>
                          <p style={{ margin: "4px 0", color: "#666", fontSize: "13px" }}>{pkg.description || "Sin descripción"}</p>
                          <p style={{ color: "#999", margin: 0, fontSize: "12px" }}>{pkg.user?.name}</p>
                          <p style={{ color: "#1565C0", marginTop: "8px", marginBottom: 0, fontSize: "12px", fontWeight: 500 }}>
                            {pkg.status === "pendiente" ? LL.registerDelivery() : LL.viewDetail()}
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

          {/* Nuevo Paquete */}
          {activeView === "nuevo_paquete" && (
            <>
              <div style={{ marginBottom: "2rem" }}>
                <h1 style={{ fontSize: "22px", fontWeight: "500", color: "#1a1a1a", margin: 0 }}>{LL.registerPackage()}</h1>
                <p style={{ fontSize: "14px", color: "#999", margin: "4px 0 0" }}>{LL.conciergeSubtitle()}</p>
              </div>
              <div style={{ background: "white", borderRadius: "14px", padding: "24px", border: "0.5px solid #e0e0e0", maxWidth: "600px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div>
                    <label style={{ fontSize: "12px", color: "#777", marginBottom: "5px", display: "block" }}>{LL.trackingCode()} *</label>
                    <input type="text" placeholder="PKG-004" value={form.tracking_code} onChange={e => setForm({ ...form, tracking_code: e.target.value })} style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ fontSize: "12px", color: "#777", marginBottom: "5px", display: "block" }}>{LL.residentName()} *</label>
                    <select value={form.user_id} onChange={e => setForm({ ...form, user_id: e.target.value })} style={inputStyle}>
                      <option value="">{LL.selectResident()}</option>
                      {users.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: "12px", color: "#777", marginBottom: "5px", display: "block" }}>{LL.description()}</label>
                    <input type="text" placeholder="Ej. Caja mediana" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} style={inputStyle} />
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", paddingTop: "20px" }}>
                    <input type="checkbox" id="perishable" checked={form.is_perishable} onChange={e => setForm({ ...form, is_perishable: e.target.checked })} />
                    <label htmlFor="perishable" style={{ fontSize: "14px", color: "#777" }}>{LL.perishable()}</label>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "1rem", marginTop: "1.5rem" }}>
                  <button onClick={handleAdd} style={{ padding: "10px 24px", background: "#1565C0", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: 600 }}>{LL.save()}</button>
                  <button onClick={() => setActiveView("paquetes")} style={{ padding: "10px 24px", background: "white", color: "#999", border: "1.5px solid #e0e0e0", borderRadius: "8px", cursor: "pointer" }}>{LL.cancel()}</button>
                </div>
              </div>
            </>
          )}

          {/* Verificar Visita */}
          {activeView === "visitas" && (
            <>
              <div style={{ marginBottom: "2rem" }}>
                <h1 style={{ fontSize: "22px", fontWeight: "500", color: "#1a1a1a", margin: 0 }}>{LL.verifyVisit()}</h1>
                <p style={{ fontSize: "14px", color: "#999", margin: "4px 0 0" }}>{LL.visitCode()}</p>
              </div>
              <div style={{ background: "white", borderRadius: "14px", padding: "24px", border: "0.5px solid #e0e0e0", maxWidth: "500px", marginBottom: "2rem" }}>
                <div style={{ marginBottom: "12px" }}>
                  <label style={{ fontSize: "12px", color: "#777", marginBottom: "5px", display: "block" }}>{LL.visitCode()}</label>
                  <input type="text" placeholder="Pega el código aquí" value={visitCode} onChange={e => setVisitCode(e.target.value)} style={{ ...inputStyle, fontFamily: "monospace", fontSize: "13px" }} />
                </div>
                {visitError && <p style={{ color: "#EF5350", fontSize: "13px", marginBottom: "12px" }}>{visitError}</p>}
                <button onClick={handleScanVisit} style={{ width: "100%", padding: "12px", background: "#1D9E75", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: 600 }}>
                  {LL.verifyVisit()}
                </button>
              </div>
              {visits.length > 0 && (
                <div>
                  <p style={{ fontWeight: 600, fontSize: "14px", color: "#374151", marginBottom: "12px" }}>{LL.recentVisits()}</p>
                  {visits.map(v => (
                    <div key={v.id} style={{ padding: "16px", borderRadius: "12px", border: "1px solid #e5e7eb", marginBottom: "10px", background: v.used ? "#f8fffb" : "white", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <div>
                          <p style={{ fontWeight: 600, margin: 0, fontSize: "14px" }}>{v.visitor_name}</p>
                          <p style={{ color: "#666", fontSize: "12px", margin: "4px 0" }}>{v.visitor_rut} — {LL.department()} {v.department}</p>
                          {v.has_car && <p style={{ color: "#666", fontSize: "12px", margin: 0 }}>{LL.carPlate()}: {v.car_plate}</p>}
                          <p style={{ color: "#999", fontSize: "11px", marginTop: "4px" }}>{new Date(v.created_at).toLocaleString()}</p>
                        </div>
                        <span style={{ padding: "4px 10px", borderRadius: "999px", fontSize: "11px", fontWeight: 600, background: v.used ? "#E8F5E9" : "#E3F2FD", color: v.used ? "#2E7D32" : "#1565C0", alignSelf: "flex-start" }}>
                          {v.used ? LL.visitUsed() : LL.visitActive()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Reclamos */}
          {activeView === "reclamos" && (
            <>
              <div style={{ marginBottom: "2rem" }}>
                <h1 style={{ fontSize: "22px", fontWeight: "500", color: "#1a1a1a", margin: 0 }}>{LL.manageComplaints()}</h1>
                <p style={{ fontSize: "14px", color: "#999", margin: "4px 0 0" }}>{LL.conciergeSubtitle()}</p>
              </div>
              {complaints.length === 0 ? (
                <div style={{ background: "white", borderRadius: "12px", padding: "3rem", textAlign: "center", border: "0.5px solid #e0e0e0" }}>
                  <p style={{ color: "#999" }}>{LL.noComplaints()}</p>
                </div>
              ) : complaints.map(c => {
                const state = statusInfo[c.status as keyof typeof statusInfo] ?? statusInfo.pendiente;
                return (
                  <div key={c.id} onClick={() => setSelectedComplaint(c)} style={{ cursor: "pointer", marginBottom: "16px", padding: "18px", borderRadius: "14px", border: "1px solid #e5e7eb", background: "white", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <h3 style={{ margin: 0, fontSize: "16px" }}>{c.title}</h3>
                        <p style={{ color: "#999", fontSize: "12px", marginTop: "4px" }}>{new Date(c.created_at).toLocaleString()}</p>
                        <p style={{ fontSize: "13px", color: "#777" }}>{LL.residentName()}: {c.user?.name}</p>
                        {c.package && <p style={{ fontSize: "13px", color: "#1565C0" }}>{c.package.tracking_code}</p>}
                      </div>
                      <span style={{ padding: "6px 12px", borderRadius: "999px", fontSize: "12px", fontWeight: 600, background: state.bg, color: state.color }}>{state.label}</span>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>

      {/* Modal entregar paquete */}
      {selectedPackage && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999 }}>
          <div style={{ background: "white", width: "450px", borderRadius: "12px", padding: "24px" }}>
            <h2 style={{ margin: "0 0 16px" }}>{LL.registerDelivery()}</h2>
            <p style={{ color: "#666", marginBottom: "16px" }}>{LL.trackingCode()}: <strong>{selectedPackage.tracking_code}</strong></p>
            {[
              { label: LL.receiverName() + " *", key: "receiver_name", placeholder: "Juan Pérez" },
              { label: LL.receiverRut() + " *", key: "receiver_rut", placeholder: "12.345.678-9" },
              { label: LL.otpCode() + " *", key: "verification_code", placeholder: "000000" },
            ].map(({ label, key, placeholder }) => (
              <div key={key} style={{ marginBottom: "12px" }}>
                <label style={{ fontSize: "12px", color: "#777", marginBottom: "5px", display: "block" }}>{label}</label>
                <input type="text" placeholder={placeholder} value={(deliveryForm as any)[key]}
                  onChange={e => setDeliveryForm({ ...deliveryForm, [key]: e.target.value })} style={inputStyle} />
              </div>
            ))}
            <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
              <button onClick={handleDeliver} style={{ flex: 1, padding: "12px", background: "#1D9E75", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: 600 }}>{LL.confirmDelivery()}</button>
              <button onClick={() => setSelectedPackage(null)} style={{ flex: 1, padding: "12px", background: "white", color: "#999", border: "1.5px solid #e0e0e0", borderRadius: "8px", cursor: "pointer" }}>{LL.cancel()}</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal ver paquete entregado */}
      {viewPackage && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999 }}>
          <div style={{ background: "white", width: "500px", borderRadius: "12px", padding: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
              <div style={{ width: "50px", height: "50px", borderRadius: "12px", background: "#EAF9F0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px" }}>✅</div>
              <div>
                <h2 style={{ margin: 0 }}>{LL.registerDelivery()}</h2>
                <p style={{ margin: "4px 0 0", color: "#777", fontSize: "13px" }}>{LL.viewDetail()}</p>
              </div>
            </div>
            <div style={{ background: "#f8fafc", borderRadius: "12px", padding: "16px", marginBottom: "16px" }}>
              <p><strong>{LL.trackingCode()}:</strong> {viewPackage.tracking_code}</p>
              <p><strong>{LL.description()}:</strong> {viewPackage.description}</p>
              <p><strong>{LL.residentName()}:</strong> {viewPackage.user?.name}</p>
            </div>
            <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "12px", padding: "16px" }}>
              <p><strong>{LL.receiverName()}:</strong> {viewPackage.transfers?.[0]?.receiver_name || "Sin registro"}</p>
              <p><strong>{LL.receiverRut()}:</strong> {viewPackage.transfers?.[0]?.receiver_rut || "Sin registro"}</p>
              <p><strong>Fecha:</strong> {viewPackage.transfers?.[0]?.delivered_at ? new Date(viewPackage.transfers[0].delivered_at).toLocaleString() : "Sin registro"}</p>
            </div>
            <div style={{ marginTop: "20px", textAlign: "right" }}>
              <button onClick={() => setViewPackage(null)} style={{ background: "#1565C0", color: "white", border: "none", padding: "10px 18px", borderRadius: "8px", cursor: "pointer" }}>{LL.cancel()}</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal detalle visita escaneada */}
      {scannedVisit && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 10000 }}>
          <div style={{ background: "white", width: "90%", maxWidth: "450px", borderRadius: "14px", padding: "24px" }}>
            <h2 style={{ margin: "0 0 20px" }}>{LL.verifyVisit()}</h2>
            <div style={{ background: "#f8fafc", borderRadius: "12px", padding: "18px", marginBottom: "16px" }}>
              <p style={{ margin: "0 0 10px" }}><strong>{LL.visitorName()}:</strong> {scannedVisit.visitor_name}</p>
              <p style={{ margin: "0 0 10px" }}><strong>{LL.visitorRut()}:</strong> {scannedVisit.visitor_rut}</p>
              <p style={{ margin: "0 0 10px" }}><strong>{LL.department()}:</strong> {scannedVisit.department}</p>
              <p style={{ margin: "0 0 10px" }}><strong>{LL.hasCar()}:</strong> {scannedVisit.has_car ? `Sí — ${scannedVisit.car_plate}` : "No"}</p>
              <p style={{ margin: 0 }}><strong>Expira:</strong> {new Date(scannedVisit.expires_at).toLocaleString()}</p>
            </div>
            {scannedVisit.used ? (
              <div style={{ background: "#FFF3E0", border: "1px solid #FFB74D", borderRadius: "10px", padding: "14px", marginBottom: "16px" }}>
                <p style={{ margin: 0, color: "#E65100", fontWeight: 600, fontSize: "14px" }}>{LL.visitAlreadyUsed()}</p>
              </div>
            ) : (
              <div style={{ background: "#E8F5E9", border: "1px solid #A5D6A7", borderRadius: "10px", padding: "14px", marginBottom: "16px" }}>
                <p style={{ margin: 0, color: "#2E7D32", fontWeight: 600, fontSize: "14px" }}>{LL.visitValid()}</p>
              </div>
            )}
            <div style={{ display: "flex", gap: "10px" }}>
              {!scannedVisit.used && (
                <button onClick={handleConfirmVisit} style={{ flex: 1, padding: "12px", background: "#1D9E75", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: 600 }}>
                  {LL.confirmEntry()}
                </button>
              )}
              <button onClick={() => { setScannedVisit(null); setVisitCode(""); }} style={{ flex: 1, padding: "12px", background: "white", color: "#6B7280", border: "1px solid #d1d5db", borderRadius: "8px", cursor: "pointer" }}>
                {LL.cancel()}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal detalle reclamo */}
      {selectedComplaint && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 10000 }}>
          <div style={{ background: "white", width: "600px", borderRadius: "14px", padding: "24px", boxShadow: "0 8px 30px rgba(0,0,0,0.2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
              <div>
                <h2 style={{ margin: 0 }}>{selectedComplaint.title}</h2>
                <p style={{ margin: "4px 0 0", color: "#777", fontSize: "13px" }}>{LL.residentName()}: {selectedComplaint.user?.name}</p>
              </div>
              <button onClick={() => setSelectedComplaint(null)} style={{ background: "#EF5350", color: "white", border: "none", padding: "10px 20px", borderRadius: "10px", cursor: "pointer" }}>{LL.cancel()}</button>
            </div>
            <div style={{ background: "#f9fafb", borderRadius: "12px", padding: "18px", marginBottom: "20px" }}>
              <p style={{ margin: "0 0 8px", fontWeight: 600 }}>{LL.complaintDescription()}</p>
              <p style={{ margin: 0, whiteSpace: "pre-wrap", color: "#555" }}>{selectedComplaint.description}</p>
            </div>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: 600 }}>Estado del reclamo</label>
            <select value={selectedComplaint.status} onChange={e => { updateComplaintStatus(selectedComplaint.id, e.target.value); setSelectedComplaint({ ...selectedComplaint, status: e.target.value }); }}
              style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid #d1d5db", fontSize: "14px", cursor: "pointer" }}>
              <option value="pendiente">Pendiente</option>
              <option value="en_revision">En revisión</option>
              <option value="resuelto">Resuelto</option>
              <option value="rechazado">Rechazado</option>
            </select>
          </div>
        </div>
      )}
    </main>
  );
}