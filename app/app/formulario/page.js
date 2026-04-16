"use client";
import { useState } from "react";

export default function FormularioEncomienda() {
  const [formData, setFormData] = useState({
    departamento: "",
    destinatario: "",
    descripcion: ""
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Datos registrados:", formData);
    alert(`✅ Encomienda registrada para el Depto ${formData.departamento}\nSe ha enviado una notificación a ${formData.destinatario}`);
    setFormData({ departamento: "", destinatario: "", descripcion: "", empresa: "Chilepost" });
  };

  return (
    <main style={{minHeight: '100vh', background: 'linear-gradient(135deg, #1a2a6c 0%, #1565C0 60%, #1E88E5 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', gap: '3rem', fontFamily: 'sans-serif'}}>
      
      {/* Lado Izquierdo - Branding (Consistente con Login) */}
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
        <p style={{fontSize: '15px', color: 'rgba(255,255,255,0.8)', lineHeight: 1.6}}>Módulo de Registro de Encomiendas.</p>
        <div style={{display: 'flex', gap: '1.5rem'}}>
          <div style={{display: 'flex', flexDirection: 'column'}}>
            <span style={{fontSize: '22px', fontWeight: '500', color: 'white'}}>Conserje</span>
            <span style={{fontSize: '11px', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '1px'}}>Perfil Activo</span>
          </div>
        </div>
      </div>

      {/* Card Principal - Formulario */}
      <div style={{background: 'white', borderRadius: '20px', padding: '2.5rem 2rem', width: '100%', maxWidth: '400px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem'}}>
            <div style={{background: '#F0F7FF', padding: '10px', borderRadius: '12px'}}>
                <span style={{fontSize: '20px'}}>📦</span>
            </div>
            <div>
                <p style={{fontSize: '18px', fontWeight: '600', color: '#1a1a1a', margin: 0}}>Nueva Recepción</p>
                <p style={{fontSize: '12px', color: '#999', margin: 0}}>Ingresa los datos del paquete</p>
            </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* N° Departamento */}
          <div style={{marginBottom: '1.1rem'}}>
            <label style={{fontSize: '12px', color: '#777', marginBottom: '5px', display: 'block', fontWeight: '500'}}>Número de Departamento</label>
            <input 
              required
              type="text" 
              placeholder="Ej. 1204-B" 
              value={formData.departamento}
              onChange={(e) => setFormData({...formData, departamento: e.target.value})}
              style={{width: '100%', padding: '11px 14px', border: '1.5px solid #e8e8e8', borderRadius: '10px', fontSize: '14px', outline: 'none', background: '#fafafa', boxSizing: 'border-box'}}
            />
          </div>

          {/* Nombre Destinatario */}
          <div style={{marginBottom: '1.1rem'}}>
            <label style={{fontSize: '12px', color: '#777', marginBottom: '5px', display: 'block', fontWeight: '500'}}>Nombre del Residente</label>
            <input 
              required
              type="text" 
              placeholder="¿Quién recibe?" 
              value={formData.destinatario}
              onChange={(e) => setFormData({...formData, destinatario: e.target.value})}
              style={{width: '100%', padding: '11px 14px', border: '1.5px solid #e8e8e8', borderRadius: '10px', fontSize: '14px', outline: 'none', background: '#fafafa', boxSizing: 'border-box'}}
            />
          </div>

          {/* Descripción */}
          <div style={{marginBottom: '1.8rem'}}>
            <label style={{fontSize: '12px', color: '#777', marginBottom: '5px', display: 'block', fontWeight: '500'}}>Descripción del Paquete</label>
            <textarea 
              required
              placeholder="Ej. Sobre pequeño, caja azul de Amazon..." 
              value={formData.descripcion}
              onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
              style={{width: '100%', padding: '11px 14px', border: '1.5px solid #e8e8e8', borderRadius: '10px', fontSize: '14px', outline: 'none', background: '#fafafa', minHeight: '80px', resize: 'none', boxSizing: 'border-box', fontFamily: 'sans-serif'}}
            />
          </div>

          <button 
            type="submit"
            style={{width: '100%', padding: '13px', background: '#EF5350', color: 'white', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', transition: 'background 0.2s'}}
            onMouseOver={(e) => e.target.style.background = '#d32f2f'}
            onMouseOut={(e) => e.target.style.background = '#EF5350'}
          >
            <span>Registrar y Notificar</span>
            <span style={{fontSize: '14px'}}>🔔</span>
          </button>
        </form>

        <p style={{textAlign: 'center', fontSize: '11px', color: '#aaa', marginTop: '1.5rem', lineHeight: '1.4'}}>
          Al registrar, el residente recibirá una notificación <br/> automática en su panel de usuario.
        </p>
      </div>
    </main>
  );
}