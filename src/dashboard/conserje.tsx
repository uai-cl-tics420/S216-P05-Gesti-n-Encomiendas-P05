import { useState, useEffect } from "react";
import { useI18nContext } from "../i18n/i18n-react.js";

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface Resident {
  id: number;
  full_name: string;
}

interface Package {
  id: number;
  tracking_code: string;
  description: string;
  status: string;
  created_at: string;
  residents: { full_name: string };
  transfers: { verification_code: string }[];
}

export default function ConserjedDashboard({ user, onLogout }: { user: User; onLogout: () => void }) {
  const { LL, locale, setLocale } = useI18nContext();
  const lang = locale;
  const toggleLang = () => setLocale(locale === 'es' ? 'en' : 'es');
  const [packages, setPackages] = useState<Package[]>([]);
  const [residents, setResidents] = useState<Resident[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [otpInputs, setOtpInputs] = useState<{ [key: number]: string }>({});
  const [otpError, setOtpError] = useState<{ [key: number]: string }>({});
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [form, setForm] = useState({
    tracking_code: "",
    description: "",
    resident_id: "",
    is_perishable: false,
  });

  const token = localStorage.getItem("incharge_token");

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    fetch("/api/packages", { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => { setPackages(data); setLoading(false); });

    fetch("/api/users", { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => setResidents(data.filter((u: any) => u.role === "residente")));
  }, []);

  const handleAdd = async () => {
    if (!form.tracking_code || !form.resident_id) {
      showToast("Completa los campos requeridos", false);
      return;
    }
    const res = await fetch("/api/packages", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        tracking_code: form.tracking_code,
        description: form.description,
        resident_id: form.resident_id,
        is_perishable: form.is_perishable,
      }),
    });
    const data = await res.json();
    if (!res.ok) { showToast(data.error || "Error", false); return; }
    showToast(`Paquete registrado. OTP: ${data.otp}`);
    setForm({ tracking_code: "", description: "", resident_id: "", is_perishable: false });
    setShowForm(false);
    fetch("/api/packages", { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => setPackages(data));
  };

  const handleDeliver = async (packageId: number) => {
    const otp = otpInputs[packageId];
    if (!otp) { setOtpError({ ...otpError, [packageId]: "Ingresa el código" }); return; }
    const res = await fetch("/api/packages", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ package_id: packageId, otp }),
    });
    const data = await res.json();
    if (!res.ok) {
      setOtpError({ ...otpError, [packageId]: "Código incorrecto" });
      showToast("Código incorrecto", false);
      return;
    }
    showToast("Paquete entregado correctamente");
    setOtpError({ ...otpError, [packageId]: "" });
    setPackages(packages.map(p => p.id === packageId ? { ...p, status: "entregado" } : p));
  };

  const pendientes = packages.filter(p => p.status === "pendiente").length;
  const entregados = packages.filter(p => p.status === "entregado").length;

  return (
    <main style={{ minHeight: "100vh", background: "#f5f5f5", fontFamily: "sans-serif" }}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", top: "1rem", left: "50%", transform: "translateX(-50%)",
          background: toast.ok ? "#1D9E75" : "#EF5350", color: "white",
          padding: "12px 24px", borderRadius: "10px", fontSize: "14px",
          fontWeight: "500", zIndex: 1000, boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
        }}>
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
          <button onClick={onLogout} style={{ padding: "8px 16px", background: "#EF5350", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "13px" }}>
            {LL.logout()}
          </button>
        </div>
      </div>

      <div style={{ padding: "2rem", maxWidth: "900px", margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
          <div>
            <h1 style={{ fontSize: "22px", fontWeight: "500", color: "#1a1a1a", margin: 0 }}>{LL.conciergePanel()}</h1>
            <p style={{ fontSize: "14px", color: "#999", margin: "4px 0 0" }}>{LL.conciergeSubtitle()}</p>
          </div>
          <button onClick={() => setShowForm(!showForm)} style={{ padding: "10px 20px", background: "#1565C0", color: "white", border: "none", borderRadius: "10px", cursor: "pointer", fontSize: "14px", fontWeight: "500" }}>
            {LL.newPackage()}
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", marginBottom: "2rem" }}>
          {[
            { label: LL.pending(), value: pendientes, color: "#EF5350" },
            { label: LL.delivered(), value: entregados, color: "#1D9E75" },
            { label: LL.total(), value: packages.length, color: "#022042" },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ background: "white", borderRadius: "12px", padding: "1.5rem", textAlign: "center", border: "0.5px solid #e0e0e0" }}>
              <p style={{ fontSize: "32px", fontWeight: "500", color, margin: 0 }}>{value}</p>
              <p style={{ fontSize: "13px", color: "#999", margin: "4px 0 0" }}>{label}</p>
            </div>
          ))}
        </div>

        {/* Formulario nuevo paquete */}
        {showForm && (
          <div style={{ background: "white", borderRadius: "12px", border: "1.5px solid #1565C0", padding: "1.5rem", marginBottom: "1.5rem" }}>
            <p style={{ fontWeight: "500", margin: "0 0 1rem", color: "#1565C0" }}>{LL.registerPackage()}</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div>
                <label style={{ fontSize: "12px", color: "#777", marginBottom: "5px", display: "block" }}>{LL.trackingCode()} *</label>
                <input type="text" placeholder="PKG-004" value={form.tracking_code}
                  onChange={e => setForm({ ...form, tracking_code: e.target.value })}
                  style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #e8e8e8", borderRadius: "8px", fontSize: "14px", outline: "none", boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ fontSize: "12px", color: "#777", marginBottom: "5px", display: "block" }}>{LL.residentName()} *</label>
                <select value={form.resident_id} onChange={e => setForm({ ...form, resident_id: e.target.value })}
                  style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #e8e8e8", borderRadius: "8px", fontSize: "14px", outline: "none", boxSizing: "border-box" }}>
                  <option value="">Seleccionar residente</option>
                  {residents.map(r => (
                    <option key={r.id} value={r.id}>{r.full_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize: "12px", color: "#777", marginBottom: "5px", display: "block" }}>{LL.description()}</label>
                <input type="text" placeholder="Ej. Caja mediana" value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #e8e8e8", borderRadius: "8px", fontSize: "14px", outline: "none", boxSizing: "border-box" }} />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", paddingTop: "20px" }}>
                <input type="checkbox" id="perishable" checked={form.is_perishable}
                  onChange={e => setForm({ ...form, is_perishable: e.target.checked })} />
                <label htmlFor="perishable" style={{ fontSize: "14px", color: "#777" }}>¿Perecedero?</label>
              </div>
            </div>
            <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
              <button onClick={handleAdd} style={{ padding: "10px 24px", background: "#1565C0", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "14px" }}>{LL.save()}</button>
              <button onClick={() => setShowForm(false)} style={{ padding: "10px 24px", background: "white", color: "#999", border: "1.5px solid #e0e0e0", borderRadius: "8px", cursor: "pointer", fontSize: "14px" }}>{LL.cancel()}</button>
            </div>
          </div>
        )}

        {/* Lista paquetes */}
        <div style={{ background: "white", borderRadius: "12px", border: "0.5px solid #e0e0e0", overflow: "hidden" }}>
          <div style={{ padding: "1rem 1.5rem", borderBottom: "0.5px solid #e0e0e0" }}>
            <p style={{ fontWeight: "500", margin: 0, color: "#1a1a1a" }}>{LL.packageList()}</p>
          </div>
          {loading ? (
            <p style={{ padding: "2rem", textAlign: "center", color: "#999" }}>{LL.loadingUsers()}</p>
          ) : packages.length === 0 ? (
            <p style={{ padding: "2rem", textAlign: "center", color: "#999" }}>No hay paquetes</p>
          ) : packages.map(pkg => (
            <div key={pkg.id} style={{ padding: "1rem 1.5rem", borderBottom: "0.5px solid #f0f0f0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <p style={{ fontWeight: "500", margin: 0, fontSize: "14px", color: "#1a1a1a" }}>{pkg.tracking_code} – {pkg.description}</p>
                  <p style={{ color: "#999", margin: "2px 0 0", fontSize: "12px" }}>
                    {pkg.residents?.full_name} · {new Date(pkg.created_at).toLocaleDateString()}
                  </p>
                </div>
                <span style={{
                  background: pkg.status === "pendiente" ? "#EF535020" : "#1D9E7520",
                  color: pkg.status === "pendiente" ? "#EF5350" : "#1D9E75",
                  padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "500"
                }}>{pkg.status}</span>
              </div>

              {/* Input OTP para entregar */}
              {pkg.status === "pendiente" && (
                <div style={{ display: "flex", gap: "8px", marginTop: "10px", alignItems: "center" }}>
                  <input
                    type="text"
                    placeholder="Código del residente"
                    maxLength={4}
                    value={otpInputs[pkg.id] || ""}
                    onChange={e => setOtpInputs({ ...otpInputs, [pkg.id]: e.target.value })}
                    style={{
                      padding: "8px 12px", border: `1.5px solid ${otpError[pkg.id] ? "#EF5350" : "#e8e8e8"}`,
                      borderRadius: "8px", fontSize: "14px", outline: "none", width: "200px"
                    }}
                  />
                  <button onClick={() => handleDeliver(pkg.id)} style={{ padding: "8px 16px", background: "#1D9E75", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "13px" }}>
                    {LL.markDelivered()}
                  </button>
                  {otpError[pkg.id] && <span style={{ color: "#EF5350", fontSize: "12px" }}>{otpError[pkg.id]}</span>}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}