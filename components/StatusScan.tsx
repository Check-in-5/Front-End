interface StatusProps {
  status: string;
  onClose: () => void;
}

export default function StatusScan({ status, onClose }: StatusProps) {
  const isAccepted = status === 'accepted';
  
  const overlayStyle = {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)', // Overlay negro al 40%[cite: 21]
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingBottom: 'max(16px, env(safe-area-inset-bottom))',
    paddingLeft: '16px',
    paddingRight: '16px',
    zIndex: 50
  };

  const modalStyle = {
    backgroundColor: '#FFFFFF', // Fondo de tarjeta[cite: 21]
    width: '100%',
    maxWidth: '500px',
    height: 'auto',
    maxHeight: '85dvh',
    overflowY: 'auto' as const,
    borderRadius: '12px',  // Radio de tarjetas/modales[cite: 21]
    padding: '24px', // Escala base 8px[cite: 21]
    display: 'flex',
    flexDirection: 'column' as const,
    color: '#2F4374', // Texto primario[cite: 21]
    boxShadow: '0px 8px 24px rgba(0,0,0,0.15)', // Sombra marcada de modal 15%[cite: 21]
    fontFamily: 'Inter, sans-serif'
  };

  const iconStyle = {
    width: '48px',
    height: '48px',
    borderRadius: '999px', // Forma de pill/círculo[cite: 21]
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 16px auto',
    fontSize: '24px',
    fontWeight: 700,
    color: isAccepted ? '#1A6640' : '#B3261E', // Colores de estado éxito/peligro[cite: 21]
    backgroundColor: isAccepted ? '#E2F4EA' : '#FDF0F2' // Fondos de estado éxito/peligro[cite: 21]
  };

  const titleStyle = {
    textAlign: 'center' as const,
    marginBottom: '24px',
    fontSize: '20px', // H2[cite: 21]
    fontFamily: 'Poppins, sans-serif', // Fuente de títulos[cite: 21]
    fontWeight: 700,
    color: '#2F4374'
  };

  const rowStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '12px 0',
    borderBottom: '1px solid #D8DFF0', // Borde sólido estándar[cite: 21]
    fontSize: '14px' // Párrafo[cite: 21]
  };

  const labelStyle = { color: '#6B7A9A', fontWeight: 400 }; // Texto secundario[cite: 21]
  const valueStyle = { color: '#2F4374', fontWeight: 600 }; // Texto primario destacado

  const closeBtnStyle = {
    backgroundColor: '#2F4374', //[cite: 21]
    color: '#FFFFFF',
    border: 'none',
    height: '40px', //[cite: 21]
    borderRadius: '8px', //[cite: 21]
    marginTop: '24px',
    fontWeight: 600, //[cite: 21]
    fontSize: '14px', //[cite: 21]
    fontFamily: 'Inter, sans-serif',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  };

  return (
    <div style={overlayStyle} role="dialog" aria-modal="true" aria-label="Resultado de demostración" onKeyDown={(event) => { if (event.key === 'Escape') onClose(); }}>
      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
      
      <div style={modalStyle} className="hide-scrollbar">
        <p style={{ textAlign: 'center', marginBottom: 16 }}>Demostración: no valida una entrada real.</p>
        <div style={iconStyle}>
          {isAccepted ? '✓' : '✗'}
        </div>
        
        <h2 style={titleStyle}>
          {isAccepted ? 'Acceso Permitido' : 'Acceso Denegado'}
        </h2>

        <div style={rowStyle}>
          <span style={labelStyle}>Estado</span>
          <span style={{ color: isAccepted ? '#1A6640' : '#B3261E', fontWeight: 600 }}>
            {isAccepted ? 'Aceptado' : 'Rechazado / Duplicado'}
          </span>
        </div>
        
        <div style={rowStyle}><span style={labelStyle}>Id del evento</span> <span style={valueStyle}>...</span></div>
        <div style={rowStyle}><span style={labelStyle}>Nombre del evento</span> <span style={valueStyle}>...</span></div>
        <div style={rowStyle}><span style={labelStyle}>Dirección</span> <span style={valueStyle}>...</span></div>
        <div style={rowStyle}><span style={labelStyle}>Hora Inicio</span> <span style={valueStyle}>...</span></div>
        <div style={rowStyle}><span style={labelStyle}>Hora cierre</span> <span style={valueStyle}>...</span></div>
        <div style={rowStyle}><span style={labelStyle}>Fecha</span> <span style={valueStyle}>...</span></div>

        <button autoFocus style={closeBtnStyle} onClick={onClose}>
          Cerrar
        </button>
      </div>
    </div>
  );
}
