import { useState, useEffect } from "react";
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
  user: { name: string };
  transfers: {
    verification_code: string;
    receiver_name?: string;
    receiver_rut?: string;
    delivered_at?: string;
  }[];
}

interface Complaint {
  id: number;
  title: string;
  description: string;
  status: string;
  created_at: string;
  user?: {
    name: string;
  };
  package?: {
    id: number;
    tracking_code: string;
    description: string;
  };
}

export default function ConserjedDashboard({ user, onLogout }: { user: User; onLogout: () => void }) {
  const { LL, locale, setLocale } = useI18nContext();
  const lang = locale;
  const toggleLang = () => setLocale(locale === 'es' ? 'en' : 'es');
  const [packages, setPackages] = useState<Package[]>([]);
  const [users, setusers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [showComplaints, setShowComplaints] = useState(false);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [deliveryForm, setDeliveryForm] = useState({
    receiver_name: "",
    receiver_rut: "",
    verification_code: "",
  });
  const [viewPackage, setViewPackage] = useState<Package | null>(null);
  
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [form, setForm] = useState({
    tracking_code: "",
    description: "",
    user_id: "",
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
    .then(data => setusers(data.filter((u: any) => u.role === "residente")));
  }, []);
  
  const handleAdd = async () => {
    if (!form.tracking_code || !form.user_id) {
      showToast("Completa los campos requeridos", false);
      return;
    }
    const res = await fetch("/api/packages", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        tracking_code: form.tracking_code,
        description: form.description,
        user_id: form.user_id,
        is_perishable: form.is_perishable,
      }),
    });
    const data = await res.json();
    if (!res.ok) { showToast(data.error || "Error", false); return; }
    setForm({ tracking_code: "", description: "", user_id: "", is_perishable: false });
    setShowForm(false);
    fetch("/api/packages", { headers: { Authorization: `Bearer ${token}` } })
    .then(res => res.json())
    .then(data => setPackages(data));
  };
  
  const loadComplaints = async () => {
  const res = await fetch(
    "/api/complaints?role=conserje",
    {
      headers:{
        Authorization:`Bearer ${token}`
      }
    }
  );
  const data = await res.json();
    if(res.ok){
      setComplaints(data);
    }
  };
  const updateComplaintStatus = async (
  complaintId: number,
  status: string
) => {
  const res = await fetch("/api/complaints", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      complaint_id: complaintId,
      status,
    }),
  });

  const data = await res.json();
    if (!res.ok) {
      showToast(
        data.error || "Error al actualizar reclamo",
        false
      );
      return;
    }

    setComplaints((prev) =>
      prev.map((c) =>
        c.id === complaintId
          ? { ...c, status }
          : c
      )
    );

    showToast("Estado actualizado");
  };
    
  const [selectedComplaint, setSelectedComplaint] =
  useState<Complaint | null>(null);

  const handleDeliver = async () => {
    if (!selectedPackage) return
    if (
      !deliveryForm.receiver_name ||
      !deliveryForm.receiver_rut ||
      !deliveryForm.verification_code
    ) {
      showToast("Completa todos los campos", false);
      return;
    }
    
    const res = await fetch("/api/packages", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        package_id: selectedPackage.id,
        verification_code: deliveryForm.verification_code,
        receiver_name: deliveryForm.receiver_name,
        receiver_rut: deliveryForm.receiver_rut
      }),
    });
    
    const data = await res.json();
    
    if (!res.ok) {
      showToast(data.error || "Código incorrecto", false);
      return;
    }
    
    showToast("Paquete entregado correctamente");
    
    setPackages(
      packages.map(p =>
        p.id === selectedPackage.id
        ? { ...p, status: "entregado" }
        : p
      )
    );
    
    setSelectedPackage(null);
    
    setDeliveryForm({
      receiver_name: "",
      receiver_rut: "",
      verification_code: "",
    });
  };
  
  const pendientes = packages.filter(p => p.status === "pendiente").length;
  const entregados = packages.filter(p => p.status === "entregado").length;
  const [filter, setFilter] = useState<
  "todos" | "pendiente" | "entregado">("todos");
  const filteredPackages = packages.filter(pkg => {
    if (filter === "todos") return true;
    return pkg.status === filter;});
  
  const statusInfo = {
  pendiente: {
    label: "Pendiente",
    bg: "#FFF1F1",
    color: "#D32F2F",
    icon: "⏳",
  },
  en_revision: {
    label: "En revisión",
    bg: "#FFF8E1",
    color: "#F57C00",
    icon: "🔍",
  },
  resuelto: {
    label: "Resuelto",
    bg: "#EAF9F0",
    color: "#1D9E75",
    icon: "✅",
  },
  rechazado: {
    label: "Rechazado",
    bg: "#F3F4F6",
    color: "#6B7280",
    icon: "❌",
  },
};
    
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
      <div style={{display:"flex", gap:"10px"}}>
        <button onClick={() => setShowForm(!showForm)} style={{ padding: "10px 20px", background: "#1565C0", color: "white", border: "none", borderRadius: "10px", cursor: "pointer", fontSize: "14px", fontWeight: "500" }}>
        {LL.newPackage()}
        </button>
        <button
        onClick={()=>{
          setShowComplaints(true);
          loadComplaints();
        }}
        style={{
        padding:"10px 20px",
        background:"#EF5350",
        color:"white",
        border:"none",
        borderRadius:"10px",
        cursor:"pointer",
        fontSize:"14px"
        }}
        >
        Gestionar Reclamos
        </button>
      </div>
      </div>
      
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
        <select value={form.user_id} onChange={e => setForm({ ...form, user_id: e.target.value })}
        style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #e8e8e8", borderRadius: "8px", fontSize: "14px", outline: "none", boxSizing: "border-box" }}>
        <option value="">Seleccionar residente</option>
        {users.map(r => (
          <option key={r.id} value={r.id}>{r.name}</option>
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
      )};
      {/* Lista paquetes */}
      
      <div style={{ background: "white", borderRadius: "12px", border: "0.5px solid #e0e0e0", overflow: "hidden" }}>
      <div style={{ padding: "1rem 1.5rem", borderBottom: "0.5px solid #e0e0e0" }}>
      <p style={{ fontWeight: "500", margin: 0, color: "#1a1a1a" }}>{LL.packageList()}</p>
      </div>
      {loading ? (
        <p style={{ padding: "2rem", textAlign: "center", color: "#999" }}>{LL.loadingUsers()}</p>
      ) : packages.length === 0 ? (
        <p style={{ padding: "2rem", textAlign: "center", color: "#999" }}>No hay paquetes</p>
      ) : filteredPackages.map(pkg => (
        <div
        key={pkg.id}
        onClick={() => {
          if (pkg.status === "pendiente") {
            setSelectedPackage(pkg);
          } else {
            setViewPackage(pkg);
          }
        }}
        style={{
          margin: "12px",
          padding: "18px",
          borderRadius: "14px",
          border: pkg.status === "pendiente"
          ? "1px solid #ffe0e0"
          : "1px solid #d7f5e5",
          background: pkg.status === "pendiente"
          ? "#fffdfd"
          : "#f8fffb",
          cursor: "pointer",
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
        {pkg.user?.name}
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
          ? "Registrar entrega"
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
        ))}
        </div>
        </div>
        {selectedComplaint && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.5)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              zIndex: 10000,
            }}
          >
            <div
              style={{
                background: "white",
                width: "600px",
                borderRadius: "14px",
                padding: "24px",
                boxShadow: "0 8px 30px rgba(0,0,0,0.2)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: "20px",
                }}
              >
                <div style={{ display: "flex", gap: "12px" }}>
                  <div
                    style={{
                      width: "50px",
                      height: "50px",
                      borderRadius: "12px",
                      background: "#FFF3E0",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "24px",
                    }}
                  >
                    📋
                  </div>

                  <div>
                    <h2
                      style={{
                        margin: 0,
                        fontSize: "22px",
                      }}
                    >
                      {selectedComplaint.title}
                    </h2>

                    <p
                      style={{
                        margin: "4px 0 0",
                        color: "#777",
                        fontSize: "13px",
                      }}
                    >
                      Detalle del reclamo
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={() =>
                    setSelectedComplaint(null)
                  }
                  style={{
                    background: "#EF5350",
                    color: "white",
                    border: "none",
                    padding: "10px 20px",
                    borderRadius: "10px",
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                >
                  Cerrar
                </button>
              </div>
              <div
                style={{
                  background: "#f8fafc",
                  border: "1px solid #e5e7eb",
                  borderRadius: "12px",
                  padding: "16px",
                  marginBottom: "16px",
                }}
              >
                <p style={{ margin: "0 0 8px 0" }}>
                  <strong>📅 Fecha:</strong>{" "}
                  {new Date(
                    selectedComplaint.created_at
                  ).toLocaleString()}
                </p>

                <p style={{ margin: 0 }}>
                  <strong>👤 Residente:</strong>{" "}
                  {selectedComplaint.user?.name}
                </p>
                {selectedComplaint.package && (
                  <div
                    style={{
                      background: "#EFF6FF",
                      border: "1px solid #BFDBFE",
                      borderRadius: "10px",
                      padding: "14px",
                      marginTop: "16px",
                      marginBottom: "16px",
                    }}
                  >
                    <p
                      style={{
                        margin: "0 0 8px",
                        fontWeight: 600,
                        color: "#1565C0",
                      }}
                    >
                      📦 Paquete
                    </p>

                    <p style={{ margin: "4px 0" }}>
                      <strong>Código:</strong>{" "}
                      {selectedComplaint.package.tracking_code}
                    </p>

                    <p style={{ margin: "4px 0" }}>
                      <strong>Descripción:</strong>{" "}
                      {selectedComplaint.package.description ||
                        "Sin descripción"}
                    </p>
                  </div>
                )}
              </div>

              <div
                style={{
                  background: "#f9fafb",
                  border: "1px solid #e5e7eb",
                  borderRadius: "12px",
                  padding: "18px",
                  marginBottom: "20px",
                }}
              >
                <p
                  style={{
                    margin: "0 0 12px 0",
                    fontWeight: 600,
                    color: "#374151",
                  }}
                >
                  📝 Descripción
                </p>

                <p
                  style={{
                    margin: 0,
                    whiteSpace: "pre-wrap",
                    lineHeight: "1.6",
                    color: "#555",
                  }}
                >
                  {selectedComplaint.description}
                </p>
              </div>

              <div
                style={{
                  marginBottom: "24px",
                }}
              >
                <div
                  style={{
                    marginBottom: "24px",
                  }}
                >
                  <label
                    style={{
                      display: "block",
                      marginBottom: "8px",
                      fontWeight: 600,
                      color: "#374151",
                    }}
                  >
                    🔄 Estado del reclamo
                  </label>

                  <select
                    value={selectedComplaint.status}
                    onChange={(e) => {
                      updateComplaintStatus(
                        selectedComplaint.id,
                        e.target.value
                      );

                      setSelectedComplaint({
                        ...selectedComplaint,
                        status: e.target.value,
                      });
                    }}
                    style={{
                      width: "100%",
                      padding: "12px",
                      borderRadius: "10px",
                      border: "1px solid #d1d5db",
                      fontSize: "14px",
                      background:
                        statusInfo[
                          selectedComplaint.status as keyof typeof statusInfo
                        ]?.bg,
                      color:
                        statusInfo[
                          selectedComplaint.status as keyof typeof statusInfo
                        ]?.color,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    <option value="pendiente">
                      ⏳ Pendiente
                    </option>
                    <option value="en_revision">
                      🔍 En revisión
                    </option>
                    <option value="resuelto">
                      ✅ Resuelto
                    </option>
                    <option value="rechazado">
                      ❌ Rechazado
                    </option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}
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
          <>
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
            background: "#EAF9F0",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "24px"
          }}
          >
          ✅
          </div>
          
          <div>
          <h2
          style={{
            margin: 0
          }}
          >
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
          <p><strong>Código:</strong> {viewPackage.tracking_code}</p>
          <p><strong>Descripción:</strong> {viewPackage.description}</p>
          <p><strong>Residente:</strong> {viewPackage.user?.name}</p>
          </div>
          
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
          {viewPackage.transfers?.[0]?.receiver_name || "Sin registro"}
          </p>
          
          <p>
          <strong>RUT:</strong>
          <br />
          {viewPackage.transfers?.[0]?.receiver_rut || "Sin registro"}
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
            </>
            
            </div>
            </div>
          )}
          {showComplaints && !selectedComplaint && (
            <div
            style={{
            position:"fixed",
            inset:0,
            background:"rgba(0,0,0,0.5)",
            display:"flex",
            justifyContent:"center",
            alignItems:"center",
            zIndex:9999
            }}
            >
            <div
            style={{
            background:"white",
            width:"600px",
            maxHeight:"80vh",
            overflowY:"auto",
            borderRadius:"14px",
            padding:"24px"
            }}
            >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "20px",
              }}
            >
              <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                <div
                  style={{
                    width: "50px",
                    height: "50px",
                    borderRadius: "12px",
                    background: "#FFF3E0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "24px",
                  }}
                >
                  📋
                </div>

                <div>
                  <h2 style={{ margin: 0 }}>
                    Gestión de Reclamos
                  </h2>

                  <p
                    style={{
                      margin: "4px 0 0",
                      color: "#777",
                      fontSize: "13px",
                    }}
                  >
                    Administra y responde reclamos de residentes
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowComplaints(false)}
                style={{
                  background: "#EF5350",
                  color: "white",
                  border: "none",
                  padding: "10px 16px",
                  borderRadius: "8px",
                  cursor: "pointer",
                }}
              >
                Cerrar
              </button>
            </div>
            {complaints.length === 0 ? (
            <p style={{color:"#999"}}>
            No hay reclamos registrados
            </p>
            ) : (
            complaints.map((c) => {
              const state =
                statusInfo[
                  c.status as keyof typeof statusInfo
                ] ?? statusInfo.pendiente;

              return (
            <div
              key={c.id}
              onClick={() => setSelectedComplaint(c)}
              style={{
                cursor: "pointer",
                marginBottom: "16px",
                padding: "18px",
                borderRadius: "14px",
                border:
                  c.status === "pendiente"
                    ? "1px solid #ffe0e0"
                    : c.status === "en_revision"
                    ? "1px solid #ffe7b3"
                    : "1px solid #d7f5e5",
                background:
                  c.status === "pendiente"
                    ? "#fffdfd"
                    : c.status === "en_revision"
                    ? "#fffdf5"
                    : "#f8fffb",
                boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
              }}
            >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: "12px",
              }}
            >
              <div>
                <h3
                  style={{
                    margin: 0,
                    fontSize: "16px",
                    fontWeight: 600,
                    color: "#1a1a1a",
                  }}
                >
                  {c.title}
                </h3>

                <p
                  style={{
                    color: "#999",
                    fontSize: "12px",
                    marginTop: "4px",
                  }}
                >
                  {new Date(c.created_at).toLocaleString()}
                </p>

                <p
                  style={{
                    fontSize: "13px",
                    color: "#777",
                    marginBottom: 0,
                  }}
                >
                  Residente: {c.user?.name}
                </p>
                {c.package && (
                  <p
                    style={{
                      fontSize: "13px",
                      color: "#1565C0",
                      marginTop: "4px",
                    }}
                  >
                    📦 Paquete: {c.package.tracking_code}
                  </p>
                )}
              </div>
              <span
                style={{
                  padding: "6px 12px",
                  borderRadius: "999px",
                  fontSize: "12px",
                  fontWeight: 600,
                  background: state.bg,
                  color: state.color,
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  whiteSpace: "nowrap",
                }}
              >
                {state.icon} {state.label}
              </span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: "12px",
              }}
            >
            
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginTop: "12px",
                }}
              >
                <span
                  style={{
                    color: "#1565C0",
                    fontSize: "13px",
                    fontWeight: 500,
                  }}
                >
                  Ver detalle →
                </span>
              </div>
            </div>
          </div>
        );
      })
    )}
    </div>
    </div>
  )}
</main>
);
}