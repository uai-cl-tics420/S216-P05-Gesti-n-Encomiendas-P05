"use client";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ResidenteDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") router.push("/");
  }, [status]);

  if (status === "loading") return <p>Cargando...</p>;

  return (
    <main style={{minHeight: '100vh', background: '#f5f5f5', fontFamily: 'sans-serif'}}>
      
      {/* Header */}
      <div style={{background: 'linear-gradient(135deg, #1a2a6c, #1565C0)', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
          <span style={{fontSize: '14px', color: 'rgba(255,255,255,0.7)', letterSpacing: '3px', textTransform: 'uppercase'}}>in</span>
          <span style={{fontSize: '22px', fontWeight: '500', color: 'white'}}>Charge<span style={{color: '#EF5350'}}>.</span></span>
        </div>
        <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
          <span style={{color: 'white', fontSize: '14px'}}>👤 {session?.user?.name}</span>
          <button onClick={() => signOut({ callbackUrl: '/' })} style={{padding: '8px 16px', background: '#EF5350', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px'}}>
            Cerrar sesión
          </button>
        </div>
      </div>

      {/* Contenido */}
      <div style={{padding: '2rem', maxWidth: '900px', margin: '0 auto'}}>
        <h1 style={{fontSize: '22px', fontWeight: '500', color: '#1a1a1a', marginBottom: '4px'}}>Mis encomiendas</h1>
        <p style={{fontSize: '14px', color: '#999', marginBottom: '2rem'}}>Bienvenido, {session?.user?.name}</p>

        {/* Stats */}
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem'}}>
          {[
            {label: 'Pendientes', value: '2', color: '#EF5350'},
            {label: 'Retiradas', value: '5', color: '#1565C0'},
            {label: 'Total', value: '7', color: '#1D9E75'},
          ].map(({label, value, color}) => (
            <div key={label} style={{background: 'white', borderRadius: '12px', padding: '1.5rem', textAlign: 'center', border: '0.5px solid #e0e0e0'}}>
              <p style={{fontSize: '32px', fontWeight: '500', color, margin: 0}}>{value}</p>
              <p style={{fontSize: '13px', color: '#999', margin: '4px 0 0'}}>{label}</p>
            </div>
          ))}
        </div>

        {/* Lista de paquetes */}
        <div style={{background: 'white', borderRadius: '12px', border: '0.5px solid #e0e0e0', overflow: 'hidden'}}>
          <div style={{padding: '1rem 1.5rem', borderBottom: '0.5px solid #e0e0e0'}}>
            <p style={{fontWeight: '500', margin: 0}}>Paquetes recientes</p>
          </div>
          {[
            {code: 'PKG-001', desc: 'Caja Amazon', date: '15 Abr', status: 'Pendiente', color: '#EF5350'},
            {code: 'PKG-002', desc: 'Pedido Cornershop', date: '15 Abr', status: 'Pendiente', color: '#EF5350'},
          ].map(({code, desc, date, status, color}) => (
            <div key={code} style={{padding: '1rem 1.5rem', borderBottom: '0.5px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <div>
                <p style={{fontWeight: '500', margin: 0, fontSize: '14px'}}>{code} — {desc}</p>
                <p style={{color: '#999', margin: '2px 0 0', fontSize: '12px'}}>{date}</p>
              </div>
              <span style={{background: color + '20', color, padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '500'}}>{status}</span>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}