import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const targets = [
      "http://localhost:3005/api/checkin/tickets",
      "http://127.0.0.1:3005/api/checkin/tickets",
      "http://backend-main-checkin-service-1:3005/api/checkin/tickets",
      "http://checkin-service:3005/api/checkin/tickets",
    ];

    let lastError: unknown = null;
    for (const url of targets) {
      try {
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        return NextResponse.json(data, { status: res.status });
      } catch (err) {
        lastError = err;
      }
    }

    return NextResponse.json(
      {
        error: {
          code: "SERVICE_UNREACHABLE",
          message: "No se pudo conectar con el microservicio de Check-in en el puerto 3005.",
        },
      },
      { status: 503 }
    );
  } catch {
    return NextResponse.json(
      { error: { code: "BAD_REQUEST", message: "Petición JSON inválida." } },
      { status: 400 }
    );
  }
}

