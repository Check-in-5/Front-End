import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const idLimpio = encodeURIComponent(params.id.trim());
  const targets = [
    `http://entradas-service:3000/api/v1/entradas/${idLimpio}/detalle`,
    `http://localhost:3003/api/v1/entradas/${idLimpio}/detalle`,
    `http://127.0.0.1:3003/api/v1/entradas/${idLimpio}/detalle`,
    `http://localhost:3003/api/entradas/${idLimpio}`,
    `http://127.0.0.1:3003/api/entradas/${idLimpio}`,
    `http://entradas-service:3000/api/entradas/${idLimpio}`,
  ];

  for (const url of targets) {
    try {
      const res = await fetch(url, {
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      });
      const data = await res.json();
      return NextResponse.json(data, { status: res.status });
    } catch {
      // Intentar siguiente URL
    }
  }

  return NextResponse.json(
    { detail: "No se pudo conectar con el microservicio de Entradas en el puerto 3003." },
    { status: 503 }
  );
}

