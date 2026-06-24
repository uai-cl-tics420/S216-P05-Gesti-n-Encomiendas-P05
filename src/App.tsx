import "./index.css";
import { useState, useEffect } from "react";
import { useI18nContext } from "./i18n/i18n-react.js";
import AdminDashboard from "./dashboard/admin";
import ConserjedDashboard from "./dashboard/conserje";
import ResidenteDashboard from "./dashboard/residente";

// asd
export interface SessionUser {
  id: number;
  name: string;
  email: string;
  role: string;
}

export function App() {
  const { LL, locale, setLocale } = useI18nContext();
  const lang = locale;
  const toggleLang = () => setLocale(locale === 'es' ? 'en' : 'es');
  const [isLogin, setIsLogin] = useState(true);
  const [selectedRole, setSelectedRole] = useState("Residente");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [user, setUser] = useState<SessionUser | null>(null);

  const [otpStep, setOtpStep] = useState(false);
  const [pendingUserId, setPendingUserId] = useState<number | null>(null);
  const [pendingEmail, setPendingEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  const roles = ["Residente", "Conserje", "Admin"];

  useEffect(() => {
    const stored = localStorage.getItem("incharge_user");
    const token = localStorage.getItem("incharge_token");
    if (stored && token) setUser(JSON.parse(stored));
  }, []);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const handleLogin = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) { showToast(data.error || "Error", false); return; }

      if (data.otpRequired) {
        setPendingUserId(data.userId);
        setPendingEmail(data.email);
        setOtpCode("");
        setOtpStep(true);
        setResendCooldown(30);
        showToast(data.message || "Código OTP enviado");
        return;
      }

      localStorage.setItem("incharge_token", data.token);
      localStorage.setItem("incharge_user", JSON.stringify(data.user));
      setUser(data.user);
      showToast("Sesión iniciada");
    } catch {
      showToast("Error de conexión", false);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!pendingUserId) return;
    setLoading(true);
    try {
      const res = await fetch("/api/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: pendingUserId, code: otpCode }),
      });
      const data = await res.json();
      if (!res.ok) { showToast(data.error || "Error", false); return; }

      localStorage.setItem("incharge_token", data.token);
      localStorage.setItem("incharge_user", JSON.stringify(data.user));
      setUser(data.user);
      setOtpStep(false);
      setOtpCode("");
      setPendingUserId(null);
      setPendingEmail("");
      showToast("Sesión iniciada");
    } catch {
      showToast("Error de conexión", false);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setLoading(true);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) { showToast(data.error || "Error", false); return; }

      if (data.otpRequired) {
        setPendingUserId(data.userId);
        setPendingEmail(data.email);
        setOtpCode("");
        setResendCooldown(30);
        showToast("Nuevo código enviado");
      }
    } catch {
      showToast("Error de conexión", false);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    setOtpStep(false);
    setOtpCode("");
    setPendingUserId(null);
    setPendingEmail("");
    setResendCooldown(0);
  };

  const handleRegister = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fullName,
          email,
          password,
          role: selectedRole.toLowerCase(),
        }),
      });
      const data = await res.json();
      if (!res.ok) { showToast(data.error || "Error", false); return; }
      showToast("Cuenta creada, inicia sesión");
      setIsLogin(true);
    } catch {
      showToast("Error de conexión", false);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("incharge_token");
    localStorage.removeItem("incharge_user");
    setUser(null);
    showToast("Sesión cerrada");
  };

  if (user) {
    if (user.role === "admin") return <AdminDashboard user={user} onLogout={handleLogout} />;
    if (user.role === "conserje") return <ConserjedDashboard user={user} onLogout={handleLogout} />;
    return <ResidenteDashboard user={user} onLogout={handleLogout} />;
  }

  return (
    <main style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #1a2a6c 0%, #1565C0 60%, #1E88E5 100%)",
      display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "center",
      padding: "2rem", gap: "4rem", fontFamily: "sans-serif",
    }}>
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-4px); }
        }
      `}</style>

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

      <button onClick={toggleLang} style={{
        position: "fixed", top: "1rem", right: "1rem",
        padding: "6px 14px", background: "rgba(255,255,255,0.2)", color: "white",
        border: "1px solid rgba(255,255,255,0.4)", borderRadius: "20px",
        cursor: "pointer", fontSize: "13px", fontWeight: "500",
      }}>
        {lang === "es" ? "EN" : "ES"}
      </button>

      {/* Branding */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", maxWidth: "280px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div style={{
            width: "56px", height: "56px", borderRadius: "14px",
            background: "rgba(255,255,255,0.15)",
            display: "flex", alignItems: "center", justifyContent: "center",
            animation: "float 2s ease-in-out infinite",
          }}>
            <svg width="38" height="38" viewBox="0 0 38 38" fill="none">
              <rect x="4" y="18" width="30" height="18" rx="3" fill="white"/>
              <line x1="19" y1="18" x2="19" y2="36" stroke="#1565C0" strokeWidth="1.5"/>
              <line x1="4" y1="24" x2="34" y2="24" stroke="#1565C0" strokeWidth="1"/>
              <path d="M2 17 L19 10 L36 17 L19 24 Z" fill="#EF5350"/>
              <path d="M19 2 L15 8 H17.5 V11 H20.5 V8 H23 Z" fill="white"/>
            </svg>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: "14px", color: "rgba(255,255,255,0.7)", letterSpacing: "4px", textTransform: "uppercase" }}>in</span>
            <span style={{ fontSize: "30px", fontWeight: "500", color: "white", letterSpacing: "-1px", lineHeight: 1 }}>
              Charge<span style={{ color: "#EF5350" }}>.</span>
            </span>
          </div>
        </div>
        <p style={{ fontSize: "15px", color: "rgba(255,255,255,0.8)", lineHeight: 1.6 }}>
          {LL.loginSubtitle()}
        </p>
        <div style={{ display: "flex", gap: "1.5rem" }}>
          {[["100%", "Digital"], ["24/7", lang === "es" ? "Disponible" : "Available"]].map(([num, label]) => (
            <div key={label} style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "22px", fontWeight: "500", color: "white" }}>{num}</span>
              <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: "1px" }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Card */}
      <div style={{
        background: "white", borderRadius: "20px", padding: "2.5rem 2rem",
        width: "100%", maxWidth: "380px", boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
      }}>
        {otpStep ? (
          <>
            <header style={{ marginBottom: "1.8rem" }}>
              <p style={{ fontSize: "20px", fontWeight: "600", color: "#1a1a1a", marginBottom: "4px" }}>
                Verifica tu identidad
              </p>
              <p style={{ fontSize: "13px", color: "#999" }}>
                Ingresa el código de 6 dígitos enviado a {pendingEmail}
              </p>
            </header>

            <div>
              <label style={{ fontSize: "12px", color: "#777", marginBottom: "5px", display: "block" }}>Código OTP</label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="000000"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                style={{ ...inputStyle, textAlign: "center", letterSpacing: "8px", fontSize: "20px", fontWeight: "600" }}
              />
            </div>

            <button onClick={handleVerifyOtp} disabled={loading || otpCode.length !== 6} style={{
              width: "100%", padding: "13px",
              background: (loading || otpCode.length !== 6) ? "#ccc" : "#EF5350",
              color: "white", border: "none", borderRadius: "10px", fontSize: "15px",
              fontWeight: "600", cursor: (loading || otpCode.length !== 6) ? "not-allowed" : "pointer", marginTop: "1.5rem",
            }}>
              {loading ? "..." : "Verificar código"}
            </button>

            <button onClick={handleResendOtp} disabled={resendCooldown > 0 || loading} style={{
              width: "100%", padding: "11px", background: "white",
              color: resendCooldown > 0 ? "#bbb" : "#1565C0",
              border: "1.5px solid #e0e0e0", borderRadius: "10px", fontSize: "13px",
              cursor: (resendCooldown > 0 || loading) ? "not-allowed" : "pointer", marginTop: "0.8rem",
            }}>
              {resendCooldown > 0 ? `Reenviar código (${resendCooldown}s)` : "Reenviar código"}
            </button>

            <p style={{ textAlign: "center", fontSize: "13px", color: "#666", marginTop: "1.5rem" }}>
              <span onClick={handleBackToLogin} style={{ color: "#1565C0", cursor: "pointer", fontWeight: "600", textDecoration: "underline" }}>
                Volver al inicio de sesión
              </span>
            </p>
          </>
        ) : (
          <>
            <header style={{ marginBottom: "1.8rem" }}>
              <p style={{ fontSize: "20px", fontWeight: "600", color: "#1a1a1a", marginBottom: "4px" }}>
                {isLogin ? LL.welcome() : LL.createAccount()}
              </p>
              <p style={{ fontSize: "13px", color: "#999" }}>
                {isLogin ? LL.loginSubtitle() : LL.registerSubtitle()}
              </p>
            </header>

            

            <div style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
              {!isLogin && (
                <div>
                  <label style={{ fontSize: "12px", color: "#777", marginBottom: "5px", display: "block" }}>{LL.fullName()}</label>
                  <input type="text" placeholder="Ej. Juan Pérez" value={fullName}
                    onChange={(e) => setFullName(e.target.value)} style={inputStyle} />
                </div>
              )}
              <div>
                <label style={{ fontSize: "12px", color: "#777", marginBottom: "5px", display: "block" }}>{LL.email()}</label>
                <input type="email" placeholder="tu@correo.com" value={email}
                  onChange={(e) => setEmail(e.target.value)} style={inputStyle} />
              </div>
              <div style={{ marginBottom: "0.4rem" }}>
                <label style={{ fontSize: "12px", color: "#777", marginBottom: "5px", display: "block" }}>{LL.password()}</label>
                <input type="password" placeholder="••••••••" value={password}
                  onChange={(e) => setPassword(e.target.value)} style={inputStyle} />
              </div>
            </div>

            <button onClick={isLogin ? handleLogin : handleRegister} disabled={loading} style={{
              width: "100%", padding: "13px", background: loading ? "#ccc" : "#EF5350",
              color: "white", border: "none", borderRadius: "10px", fontSize: "15px",
              fontWeight: "600", cursor: loading ? "not-allowed" : "pointer", marginTop: "1.5rem",
            }}>
              {loading ? "..." : (isLogin ? LL.login() : LL.register())}
            </button>

            <div style={{
              textAlign: "center", color: "#ccc", fontSize: "11px",
              margin: "1.2rem 0", textTransform: "uppercase", letterSpacing: "1px",
            }}>
              {LL.or()}
            </div>

            <button onClick={() => window.location.href = "/api/auth/google"} style={{
              width: "100%", padding: "11px", background: "white", color: "#444",
              border: "1.5px solid #e0e0e0", borderRadius: "10px", fontSize: "13px",
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
            }}>
              <img src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png" width="16" alt="google" />
              {LL.continueGoogle()}
            </button>

            <p style={{ textAlign: "center", fontSize: "13px", color: "#666", marginTop: "1.5rem" }}>
              {isLogin ? LL.noAccount() : LL.alreadyAccount()}{" "}
              <span onClick={() => setIsLogin(!isLogin)}
                style={{ color: "#1565C0", cursor: "pointer", fontWeight: "600", textDecoration: "underline" }}>
                {isLogin ? LL.register() : LL.signIn()}
              </span>
            </p>
          </>
        )}
      </div>
    </main>
  );
}

const inputStyle = {
  width: "100%", padding: "11px 14px", border: "1.5px solid #e8e8e8",
  borderRadius: "10px", fontSize: "14px", outline: "none",
  background: "#fafafa", color: "#1a1a1a", boxSizing: "border-box" as const,
};

export default App;