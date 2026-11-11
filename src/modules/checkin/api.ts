// ============================================================================
// modules/checkin/api.ts
// ----------------------------------------------------------------------------
// Capa de API conectada en TIEMPO REAL al microservicio Check-in (MySQL)
// y al microservicio de Entradas (MongoDB).
// ============================================================================

import { ScanResultInfo } from "./types";

export interface ValidacionCheckinResponse {
  valido: boolean;
  motivo: string;
  ticket?: {
    id_entrada: string;
    id_evento: string;
    nombre_usuario: string;
  };
}

export interface ConsultaEntradaCheckinResponse {
  id_ticket: string;
  nombre_usuario: string;
  usuario?: {
    id_usuario: string;
    rol_usuario: string;
  };
}

/**
 * Valida un ticket en puerta contra la base de datos MySQL de Check-in (backend-main)
 * (POST /api/checkin/validaciones)
 */
export async function validarTicketEnPuerta(params: {
  idEntrada: string;
  idEvento: string;
}): Promise<ValidacionCheckinResponse> {
  const idEntrada = params.idEntrada.trim();
  const idEvento = params.idEvento.trim();
  const body = JSON.stringify({ id_entrada: idEntrada, id_evento: idEvento });

  const urls = [
    "/api/checkin/validaciones",
    "http://localhost:3005/api/checkin/validaciones",
    "http://127.0.0.1:3005/api/checkin/validaciones",
  ];

  let lastError: unknown = null;
  for (const url of urls) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData?.error?.message || `Error HTTP ${res.status}`);
      }

      return await res.json();
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError instanceof Error ? lastError : new Error("No fue posible comunicarse con el servicio de Check-in.");
}

/**
 * Registra un ticket en la base de datos MySQL de Check-in (backend-main)
 * (POST /api/checkin/tickets)
 */
export async function registrarTicketEnCheckin(params: {
  idEntrada: string;
  idEvento: string;
  idUsuario: string;
  nombreUsuario: string;
}): Promise<{ mensaje: string }> {
  const idLimpio = params.idEntrada.trim();
  const body = JSON.stringify({
    id_entrada: idLimpio,
    id_evento: params.idEvento.trim(),
    id_usuario: params.idUsuario.trim(),
    nombre_usuario: params.nombreUsuario.trim(),
    qr_data: idLimpio,
  });

  const urls = [
    "/api/checkin/tickets",
    "http://localhost:3005/api/checkin/tickets",
    "http://127.0.0.1:3005/api/checkin/tickets",
  ];

  let lastError: unknown = null;
  for (const url of urls) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData?.error?.message || `Error HTTP ${res.status}`);
      }

      return await res.json();
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError instanceof Error ? lastError : new Error("No fue posible registrar el ticket.");
}

/**
 * Consulta la validez y titularidad de un ticket en el microservicio de Entradas (MongoDB)
 * (GET /api/entradas/{id_ticket})
 */
export async function consultarTicketEnEntradas(idEntrada: string): Promise<ConsultaEntradaCheckinResponse> {
  const idLimpio = encodeURIComponent(idEntrada.trim());
  const urls = [
    `/api/entradas/${idLimpio}`,
    `http://localhost:3003/api/entradas/${idLimpio}`,
    `http://127.0.0.1:3003/api/entradas/${idLimpio}`,
  ];

  let lastError: unknown = null;
  for (const url of urls) {
    try {
      const res = await fetch(url, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData?.detail || `Error HTTP ${res.status}`);
      }

      return await res.json();
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError instanceof Error ? lastError : new Error("No fue posible comunicarse con el servicio de Entradas.");
}

/**
 * Conector principal para la interfaz de Check-in:
 * Valida el ticket contra el Back-end real de Check-in (MySQL) y Entradas (MongoDB).
 * Si el ticket no existe en el backend, falla y se rechaza el acceso en tiempo real.
 */
export async function validarTicketCheckin(idEntrada: string, idEvento: string): Promise<ScanResultInfo> {
  const timestamp = new Date().toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const entradaLimpia = idEntrada.trim();
  const eventoLimpio = idEvento.trim() || "evt-77889";

  try {
    const [validacionCheckin, consultaEntradas] = await Promise.allSettled([
      validarTicketEnPuerta({ idEntrada: entradaLimpia, idEvento: eventoLimpio }),
      consultarTicketEnEntradas(entradaLimpia),
    ]);

    if (validacionCheckin.status === "fulfilled") {
      const data = validacionCheckin.value;
      const datosEntradas = consultaEntradas.status === "fulfilled" ? consultaEntradas.value : null;

      if (data.valido) {
        return {
          status: "accepted",
          rawContent: JSON.stringify({
            checkinMySQL: data.ticket ?? { id_entrada: entradaLimpia, id_evento: eventoLimpio },
            entradasMongoDB: datosEntradas,
          }, null, 2),
          ticket: {
            id_entrada: data.ticket?.id_entrada || entradaLimpia,
            id_evento: data.ticket?.id_evento || eventoLimpio,
            nombre_usuario: data.ticket?.nombre_usuario || datosEntradas?.nombre_usuario || "Asistente Verificado",
            nombre_evento: `Evento ${data.ticket?.id_evento || eventoLimpio}`,
            fecha: new Date().toLocaleDateString("es-CL"),
            hora_inicio: "09:30 hrs",
            hora_cierre: "20:00 hrs",
            direccion: "Sede Oficial del Evento",
            tipo_entrada: datosEntradas?.usuario?.rol_usuario ? `Acceso (${datosEntradas.usuario.rol_usuario})` : "General",
          },
          motivo: data.motivo || "ACCESO_AUTORIZADO",
          mensaje: "Acceso autorizado. Entrada verificada en la base de datos de Check-in.",
          timestamp,
        };
      } else {
        const motivo = data.motivo || "ACCESO_DENEGADO";
        const mensajeRechazo =
          motivo === "TICKET_NOT_FOUND"
            ? "Acceso rechazado. El ticket no existe en el sistema o no está registrado."
            : motivo === "EVENT_MISMATCH"
            ? "Acceso rechazado. El ticket no coincide con este evento."
            : `Acceso denegado (${motivo}). Entrada no autorizada.`;

        return {
          status: "rejected",
          rawContent: JSON.stringify(data, null, 2),
          ticket: { id_entrada: entradaLimpia, id_evento: eventoLimpio },
          motivo,
          mensaje: mensajeRechazo,
          timestamp,
        };
      }
    } else {
      // Fallo de red con el backend
      const errorDetalle =
        validacionCheckin.reason instanceof Error
          ? validacionCheckin.reason.message
          : String(validacionCheckin.reason);

      return {
        status: "invalid",
        rawContent: errorDetalle,
        ticket: { id_entrada: entradaLimpia, id_evento: eventoLimpio },
        motivo: "ERROR_CONEXION_BACKEND",
        mensaje: `No se pudo conectar con el microservicio de Check-in: ${errorDetalle}`,
        timestamp,
      };
    }
  } catch (error) {
    return {
      status: "invalid",
      rawContent: String(error),
      ticket: { id_entrada: entradaLimpia, id_evento: eventoLimpio },
      motivo: "ERROR_DESCONOCIDO",
      mensaje: "Ocurrió un error inesperado al procesar la validación con el servidor.",
      timestamp,
    };
  }
}

/**
 * Extrae los parámetros (id_entrada, id_evento) de cualquier formato de código QR real
 * (JSON, URL, formato TICKETU-*, separadores ':' o '|') y valida en el backend.
 */
export async function procesarLecturaQR(raw: string): Promise<ScanResultInfo> {
  const timestamp = new Date().toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  if (!raw || !raw.trim()) {
    return {
      status: "invalid",
      rawContent: raw,
      motivo: "QR_EMPTY",
      mensaje: "El código QR leído está vacío.",
      timestamp,
    };
  }

  const rawClean = raw.trim();
  let idEntrada = "";
  let idEvento = "evt-77889";

  // 1. Caso JSON: { "id_entrada": "...", "id_evento": "..." }
  try {
    const data = JSON.parse(rawClean);
    if (typeof data === "object" && data !== null) {
      idEntrada = String(data.id_entrada || data.id || data.ticketId || data.id_ticket || "");
      idEvento = String(data.id_evento || data.eventoId || data.evento_id || idEvento);
    }
  } catch {
    // Continuar
  }

  // 2. Caso URL
  if (!idEntrada && (rawClean.startsWith("http://") || rawClean.startsWith("https://"))) {
    try {
      const url = new URL(rawClean);
      idEntrada =
        url.searchParams.get("idEntrada") ||
        url.searchParams.get("ticket") ||
        url.searchParams.get("id") ||
        url.pathname.split("/").pop() ||
        "";
      idEvento = url.searchParams.get("idEvento") || url.searchParams.get("evento") || idEvento;
    } catch {
      // Ignorar error de URL
    }
  }

  // 3. Caso formato Entradas Grupo 3: TICKETU-{ticketId}-{eventoId}
  if (!idEntrada && rawClean.startsWith("TICKETU-")) {
    const partes = rawClean.split("-");
    if (partes.length >= 3) {
      idEntrada = partes[1];
      idEvento = partes.slice(2).join("-");
    } else if (partes.length === 2) {
      idEntrada = partes[1];
    }
  }

  // 4. Caso separador por dos puntos o barra: "tk-998877:evt-77889"
  if (!idEntrada && (rawClean.includes(":") || rawClean.includes("|"))) {
    const sep = rawClean.includes(":") ? ":" : "|";
    const [entradaPart, eventoPart] = rawClean.split(sep);
    if (entradaPart) idEntrada = entradaPart.trim();
    if (eventoPart) idEvento = eventoPart.trim();
  }

  // 5. Caso texto plano: el contenido completo es el ID de entrada
  if (!idEntrada) {
    idEntrada = rawClean;
  }

  // Ejecuta la validación real contra el microservicio
  return await validarTicketCheckin(idEntrada, idEvento);
}
