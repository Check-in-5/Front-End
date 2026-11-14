import Link from "next/link";

export default function HomePage() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 16px",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: "680px",
          width: "100%",
          textAlign: "center",
          backgroundColor: "#FFFFFF",
          borderRadius: "16px",
          padding: "40px 32px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
        }}
      >
        <span
          style={{
            display: "inline-block",
            backgroundColor: "#E8EEFB",
            color: "#2F4374",
            padding: "6px 14px",
            borderRadius: "999px",
            fontSize: "13px",
            fontWeight: 600,
            marginBottom: "16px",
          }}
        >
          TicketU — Sistema de Control de Acceso
        </span>
        <h1
          style={{
            fontSize: "32px",
            fontWeight: 700,
            color: "#2F4374",
            margin: "0 0 12px 0",
            fontFamily: "'Poppins', sans-serif",
          }}
        >
          Módulo de Check-in
        </h1>
        <p
          style={{
            fontSize: "15px",
            color: "#556581",
            margin: "0 0 32px 0",
            lineHeight: 1.6,
          }}
        >
          Valida entradas en puerta mediante escaneo de código QR en tiempo real
          o búsqueda por código secreto. Integrado con los microservicios de
          Entradas y Check-in vía API Gateway.
        </p>

        <div
          style={{
            display: "flex",
            gap: "16px",
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <Link
            href="/checkin"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              backgroundColor: "#2F4374",
              color: "#FFFFFF",
              padding: "14px 28px",
              borderRadius: "10px",
              fontWeight: 600,
              fontSize: "15px",
              textDecoration: "none",
              boxShadow: "0 4px 12px rgba(47, 67, 116, 0.25)",
              transition: "transform 0.15s ease",
            }}
          >
            Abrir Escáner de Check-in →
          </Link>

          <Link
            href="/catalogo"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              backgroundColor: "#F1F4F9",
              color: "#2F4374",
              padding: "14px 24px",
              borderRadius: "10px",
              fontWeight: 600,
              fontSize: "15px",
              textDecoration: "none",
            }}
          >
            Ver Catálogo
          </Link>
        </div>
      </div>
    </div>
  );
}
