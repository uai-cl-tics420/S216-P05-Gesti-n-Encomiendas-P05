"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useLanguage } from "./context/LanguageContext";

export default function Home() {
  const { t, lang, toggleLang } = useLanguage();
  const [isLogin, setIsLogin] = useState(true);
  const [selectedRole, setSelectedRole] = useState("Residente");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const roles = ["Residente", "Conserje", "Admin"];

  return (
    <main style={{minHeight: '100vh', background: 'linear-gradient(135deg, #1a2a6c 0%, #1565C0 60%, #1E88E5 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', gap: '3rem', fontFamily: 'sans-serif'}}>
      
      {/* Botón idioma */}
      <button
        onClick={toggleLang}
        style={{position: 'fixed', top: '1rem', right: '1rem', padding: '6px 14px', background: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.4)', borderRadius: '20px', cursor: 'pointer', fontSize: '13px', fontWeight: '500'}}
      >
        {lang === "es" ? "EN" : "ES"}
      </button>

      {/* Lado Izquierdo */}
      <div style={{display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '280px'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: '14px'}}>
          <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
            <rect width="56" height="56" rx="14" fill="white" fillOpacity="0.15"/>
            <rect x="4" y="4" width="48" height="48" rx="11" fill="white" fillOpacity="0.1"/>
            <rect x="12" y="28" width="32" height="20" rx="4" fill="white"/>
            <path d="M10 26 L28 18 L46 26 L28 34 Z" fill="#EF5350"/>
            <path d="M28 10 L22 17 H26 V22 H30 V17 H34 Z" fill="white"/>
            <rect x="23" y="30" width="10" height="3" rx="1.5" fill="#1565C0"/>
          </svg>
          <div style={{display: 'flex', flexDirection: 'column'}}>
            <span style={{fontSize: '14px', color: 'rgba(255,255,255,0.7)', letterSpacing: '4px', textTransform: 'uppercase'}}>in</span>
            <span style={{fontSize: '30px', fontWeight: '500', color: 'white', letterSpacing: '-1px', lineHeight: 1}}>Charge<span style={{color: '#EF5350'}}>.</span></span>
          </div>
        </div>
        <p style={{fontSize: '15px', color: 'rgba(255,255,255,0.8)', lineHeight: 1.6}}>Gestión de encomiendas para edificios.</p>
        <div style={{display: 'flex', gap: '1.5rem'}}>
          {[['100%','Digital'],['24/7', lang === 'es' ? 'Disponible' : 'Available'],['QR', lang === 'es' ? 'Retiro seguro' : 'Safe pickup']].map(([num, label]) => (
            <div key={label} style={{display: 'flex', flexDirection: 'column'}}>
              <span style={{fontSize: '22px', fontWeight: '500', color: 'white'}}>{num}</span>
              <span style={{fontSize: '11px', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '1px'}}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Card */}
      <div style={{background: 'white', borderRadius: '20px', padding: '2.5rem 2rem', width: '100%', maxWidth: '380px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)'}}>
        <p style={{fontSize: '20px', fontWeight: '600', color: '#1a1a1a', marginBottom: '4px'}}>
          {isLogin ? t.welcome : t.createAccount}
        </p>
        <p style={{fontSize: '13px', color: '#999', marginBottom: '1.8rem'}}>
          {isLogin ? t.loginSubtitle : t.registerSubtitle}
        </p>

        {!isLogin && (
          <div style={{marginBottom: '1.5rem'}}>
            <label style={{fontSize: '12px', color: '#777', marginBottom: '8px', display: 'block'}}>{t.userType}</label>
            <div style={{display: 'flex', gap: '8px'}}>
              {roles.map((role) => (
                <button key={role} onClick={() => setSelectedRole(role)}
                  style={{flex: 1, padding: '8px 4px', borderRadius: '8px', fontSize: '11px', fontWeight: '500', border: '1.5px solid',
                    borderColor: selectedRole === role ? '#1565C0' : '#e0e0e0',
                    color: selectedRole === role ? '#1565C0' : '#999',
                    background: selectedRole === role ? '#F0F7FF' : 'white',
                    cursor: 'pointer'}}>
                  {role}
                </button>
              ))}
            </div>
          </div>
        )}

        {!isLogin && (
          <div style={{marginBottom: '1.1rem'}}>
            <label style={{fontSize: '12px', color: '#777', marginBottom: '5px', display: 'block'}}>{t.fullName}</label>
            <input type="text" placeholder="Ej. Juan Pérez" style={{width: '100%', padding: '11px 14px', border: '1.5px solid #e8e8e8', borderRadius: '10px', fontSize: '14px', outline: 'none', background: '#fafafa', color: '#1a1a1a'}}/>
          </div>
        )}

        <div style={{marginBottom: '1.1rem'}}>
          <label style={{fontSize: '12px', color: '#777', marginBottom: '5px', display: 'block'}}>{t.email}</label>
          <input type="email" placeholder="tu@correo.com" value={email} onChange={(e) => setEmail(e.target.value)}
            style={{width: '100%', padding: '11px 14px', border: '1.5px solid #e8e8e8', borderRadius: '10px', fontSize: '14px', outline: 'none', background: '#fafafa', color: '#1a1a1a'}}/>
        </div>

        <div style={{marginBottom: '1.5rem'}}>
          <label style={{fontSize: '12px', color: '#777', marginBottom: '5px', display: 'block'}}>{t.password}</label>
          <input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)}
            style={{width: '100%', padding: '11px 14px', border: '1.5px solid #e8e8e8', borderRadius: '10px', fontSize: '14px', outline: 'none', background: '#fafafa', color: '#1a1a1a'}}/>
        </div>

        <button onClick={() => signIn("credentials", { email, password, callbackUrl: "/redirect" })}
          style={{width: '100%', padding: '13px', background: '#EF5350', color: 'white', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '600', cursor: 'pointer'}}>
          {isLogin ? t.login : t.register}
        </button>

        <div style={{textAlign: 'center', color: '#ccc', fontSize: '11px', margin: '1.2rem 0', textTransform: 'uppercase', letterSpacing: '1px'}}>{t.or}</div>

        <button onClick={() => signIn("google", { callbackUrl: "/redirect" })}
          style={{width: '100%', padding: '11px', background: 'white', color: '#444', border: '1.5px solid #e0e0e0', borderRadius: '10px', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'}}>
          <img src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png" width="16" alt="google" />
          {t.continueGoogle}
        </button>

        <p style={{textAlign: 'center', fontSize: '13px', color: '#666', marginTop: '1.5rem'}}>
          {isLogin ? t.noAccount : t.alreadyAccount}{" "}
          <span onClick={() => setIsLogin(!isLogin)} style={{color: '#1565C0', cursor: 'pointer', fontWeight: '600', textDecoration: 'underline'}}>
            {isLogin ? t.register : t.signIn}
          </span>
        </p>
      </div>
    </main>
  );
}