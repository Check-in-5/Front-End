interface SelectionProps {
  onSelectQR: () => void;
  onSelectCode?: () => void;
}

export default function SelectionView({ onSelectQR, onSelectCode }: SelectionProps) {
  
  const containerStyle = {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    backgroundColor: '#F8F9FA', // Fondo interno[cite: 21]
    flexGrow: 1, 
    color: '#2F4374', // Texto primario[cite: 21]
    padding: 'max(48px, env(safe-area-inset-top)) 20px 24px'
  };

  const wrapperStyle = {
    width: '100%',
    maxWidth: '350px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px' // Escala base 8px[cite: 21]
  };

  const titleStyle = {
    textAlign: 'center' as const,
    marginBottom: '24px',
    fontSize: '28px', // H1[cite: 21]
    fontFamily: 'Poppins, sans-serif', // Fuente principal[cite: 21]
    fontWeight: 700, // Bold[cite: 21]
    color: '#2F4374'
  };

  const buttonStyle = {
    backgroundColor: '#2F4374', // Azul de marca[cite: 21]
    color: '#FFFFFF',
    minHeight: '48px',
    borderRadius: '8px', // Radio estándar de botones[cite: 21]
    border: 'none',
    fontSize: '14px', // Tamaño de botones[cite: 21]
    fontFamily: 'Inter, sans-serif',
    fontWeight: 600, // Semibold[cite: 21]
    cursor: 'pointer',
    textAlign: 'center' as const,
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background-color 0.2s ease'
  };

  const disabledButtonStyle = {
    ...buttonStyle,
    opacity: 0.4, // Opacidad para deshabilitados[cite: 21]
    cursor: 'not-allowed'
  };

  return (
    <div style={containerStyle}>
      <div style={wrapperStyle}>
        <h1 style={titleStyle}>Método de Identificación</h1>
        
        <button style={buttonStyle} onClick={onSelectQR}>
          Ingreso por QR
        </button>
        
        <button style={buttonStyle} onClick={onSelectCode} disabled={!onSelectCode}>
          Ingreso por código secreto
        </button>
        
        <button style={disabledButtonStyle} disabled>
          ...
        </button>
      </div>
    </div>
  );
}
