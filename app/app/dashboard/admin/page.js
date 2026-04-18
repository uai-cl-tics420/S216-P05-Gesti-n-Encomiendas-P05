"use client";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useLanguage } from "../../context/LanguageContext";

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t, lang, toggleLang } = useLanguage();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/");
  }, [status]);

  useEffect(() => {
    fetch("/api/users")
      .then(res => res.json())
      .then(data => { setUsers(data); setLoading(false); });
  }, []);

  const changeRole = async (id, newRole) => {
    await fetch("/api/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, role: newRole }),
    });
    setUsers(users.map(u => u.id === id ? { ...u, role: newRole } : u));
  };

  if (status === "loading") return <p>Cargando...</p>;

  const roleColor = (role) => {
    if (role === "admin") return { bg: "#EF535020", color: "#EF5350" };
    if (role === "conserje") return { bg: "#1565C020", color: "#1565C0" };
    return { bg: "#1D9E7520", color: "#1D9E75" };
  };

  return (
    <main style={{minHeight: '100vh', background: '#f5f5f5', fontFamily: 'sans-serif'}}>

      {/* Header */}
      <div style={{background: 'linear-gradient(135deg, #1a2a6c, #1565C0)', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
          <span style={{fontSize: '14px', color: 'rgba(255,255,255,0.7)', letterSpacing: '3px', textTransform: 'uppercase'}}>in</span>
          <span style={{fontSize: '22px', fontWeight: '500', color: 'white'}}>Charge<span style={{color: '#EF5350'}}>.</span></span>
        </div>
        <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
          <button onClick={toggleLang}
            style={{padding: '6px 14px', background: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.4)', borderRadius: '20px', cursor: 'pointer', fontSize: '13px'}}>
            {lang === "es" ? "EN" : "ES"}
          </button>
          <span style={{color: 'white', fontSize: '14px'}}>👤 {session?.user?.name}</span>
          <button onClick={() => signOut({ callbackUrl: '/' })} style={{padding: '8px 16px', background: '#EF5350', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px'}}>
            {t.logout}
          </button>
        </div>
      </div>

      <div style={{padding: '2rem', maxWidth: '900px', margin: '0 auto'}}>
        <h1 style={{fontSize: '22px', fontWeight: '500', color: '#1a1a1a', margin: '0 0 4px'}}>{t.adminPanel}</h1>
        <p style={{fontSize: '14px', color: '#999', marginBottom: '2rem'}}>{t.adminSubtitle}</p>

        {/* Stats */}
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem'}}>
          {[
            {label: t.residents, value: users.filter(u => u.role === 'residente').length, color: '#1D9E75'},
            {label: t.concierges, value: users.filter(u => u.role === 'conserje').length, color: '#1565C0'},
            {label: t.admins, value: users.filter(u => u.role === 'admin').length, color: '#EF5350'},
          ].map(({label, value, color}) => (
            <div key={label} style={{background: 'white', borderRadius: '12px', padding: '1.5rem', textAlign: 'center', border: '0.5px solid #e0e0e0'}}>
              <p style={{fontSize: '32px', fontWeight: '500', color, margin: 0}}>{value}</p>
              <p style={{fontSize: '13px', color: '#999', margin: '4px 0 0'}}>{label}</p>
            </div>
          ))}
        </div>

        {/* Tabla usuarios */}
        <div style={{background: 'white', borderRadius: '12px', border: '0.5px solid #e0e0e0', overflow: 'hidden'}}>
          <div style={{padding: '1rem 1.5rem', borderBottom: '0.5px solid #e0e0e0'}}>
            <p style={{fontWeight: '500', margin: 0, color: '#1a1a1a'}}>{t.registeredUsers}</p>
          </div>
          {loading ? (
            <p style={{padding: '2rem', textAlign: 'center', color: '#999'}}>{t.loadingUsers}</p>
          ) : (
            users.map((user) => {
              const {bg, color} = roleColor(user.role);
              return (
                <div key={user.id} style={{padding: '1rem 1.5rem', borderBottom: '0.5px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                  <div>
                    <p style={{fontWeight: '500', margin: 0, fontSize: '14px', color: '#1a1a1a'}}>{user.full_name}</p>
                    <p style={{color: '#999', margin: '2px 0 0', fontSize: '12px'}}>{user.email}</p>
                  </div>
                  <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
                    <span style={{background: bg, color, padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '500'}}>
                      {user.role}
                    </span>
                    <select value={user.role} onChange={(e) => changeRole(user.id, e.target.value)}
                      style={{padding: '6px 10px', border: '1.5px solid #e0e0e0', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', outline: 'none', color: '#1a1a1a'}}>
                      <option value="residente">{t.residents}</option>
                      <option value="conserje">{t.concierges}</option>
                      <option value="admin">{t.admins}</option>
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