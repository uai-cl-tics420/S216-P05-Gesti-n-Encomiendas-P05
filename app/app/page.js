export default function Home() {
  return (
    <main style={{minHeight: '100vh', background: 'linear-gradient(135deg, #1a2a6c 0%, #1565C0 60%, #1E88E5 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', gap: '3rem', fontFamily: 'sans-serif'}}>
      
      {/* Left side */}
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
          {[['100%','Digital'],['24/7','Disponible'],['QR','Retiro seguro']].map(([num, label]) => (
            <div key={label} style={{display: 'flex', flexDirection: 'column'}}>
              <span style={{fontSize: '22px', fontWeight: '500', color: 'white'}}>{num}</span>
              <span style={{fontSize: '11px', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '1px'}}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Card */}
      <div style={{background: 'white', borderRadius: '20px', padding: '2.5rem 2rem', width: '100%', maxWidth: '380px'}}>
        <p style={{fontSize: '20px', fontWeight: '500', color: '#1a1a1a', marginBottom: '4px'}}>Bienvenido</p>
        <p style={{fontSize: '13px', color: '#999', marginBottom: '1.8rem'}}>Ingresa al sistema inCharge</p>

        <div style={{display: 'flex', gap: '8px', marginBottom: '1.5rem'}}>
          {['Residente', 'Conserje', 'Admin'].map((role) => (
            <button key={role} style={{flex: 1, padding: '8px 4px', textAlign: 'center', borderRadius: '8px', fontSize: '12px', border: '1.5px solid #e0e0e0', color: '#999', background: 'white', cursor: 'pointer'}}>
              {role}
            </button>
          ))}
        </div>

        <div style={{marginBottom: '1.1rem'}}>
          <label style={{fontSize: '12px', color: '#777', marginBottom: '5px', display: 'block'}}>Correo electrónico</label>
          <input type="text" placeholder="tu@correo.com" style={{width: '100%', padding: '11px 14px', border: '1.5px solid #e8e8e8', borderRadius: '10px', fontSize: '14px', outline: 'none', background: '#fafafa'}}/>
        </div>
        <div style={{marginBottom: '1.1rem'}}>
          <label style={{fontSize: '12px', color: '#777', marginBottom: '5px', display: 'block'}}>Contraseña</label>
          <input type="password" placeholder="••••••••" style={{width: '100%', padding: '11px 14px', border: '1.5px solid #e8e8e8', borderRadius: '10px', fontSize: '14px', outline: 'none', background: '#fafafa'}}/>
        </div>

        <button style={{width: '100%', padding: '13px', background: '#EF5350', color: 'white', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '500', cursor: 'pointer'}}>
          Ingresar
        </button>

        <div style={{textAlign: 'center', color: '#ccc', fontSize: '12px', margin: '1rem 0'}}>o continúa con</div>

        <button style={{width: '100%', padding: '11px', background: 'white', color: '#444', border: '1.5px solid #e0e0e0', borderRadius: '10px', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'}}>
          Continuar con Google SSO
        </button>

        <p style={{textAlign: 'center', fontSize: '11px', color: '#bbb', marginTop: '1rem'}}>
          ¿Problemas para acceder? <a href="#" style={{color: '#1565C0'}}>Contactar admin</a>
        </p>
      </div>

    </main>
  )
}