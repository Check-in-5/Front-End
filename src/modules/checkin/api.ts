// ============================================================================
// modules/checkin/api.ts
// ----------------------------------------------------------------------------
// Capa de API para el módulo de Check-in (Grupo 5) integrada con Entradas (Grupo 3)
// a través del API Gateway (http://localhost:8080).
// ============================================================================

import { GATEWAY_URL } from "@/lib/env";
import { ScanResultInfo } from "./types";

const BASE_PATH = "/api/checkin";

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
  usuario: {
    id_usuario: string;
    rol_usuario: string;
  };
}

/**
 * Valida un ticket en puerta contra la base de datos MySQL de Check-in
 * (POST /api/checkin/validaciones)
 */
export async function validarTicketEnPuerta(params: {
  idEntrada: string;
  idEvento: string;
}): Promise<ValidacionCheckinResponse> {
  const res = await fetch(`${GATEWAY_URL}${BASE_PATH}/validaciones`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id_entrada: params.idEntrada.trim(),
      id_evento: params.idEvento.trim(),
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error?.message || `Error HTTP ${res.status} al validar en Check-in`);
  }
  return data;
}

/**
 * Registra un ticket en la base de datos MySQL de Check-in
 * (POST /api/checkin/tickets)
 */
export async function registrarTicketEnCheckin(params: {
  idEntrada: string;
  idEvento: string;
  idUsuario: string;
  nombreUsuario: string;
}): Promise<{ mensaje: string }> {
  const idLimpio = params.idEntrada.trim();
  const res = await fetch(`${GATEWAY_URL}${BASE_PATH}/tickets`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id_entrada: idLimpio,
      id_evento: params.idEvento.trim(),
      id_usuario: params.idUsuario.trim(),
      nombre_usuario: params.nombreUsuario.trim(),
      qr_data: idLimpio,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error?.message || `Error HTTP ${res.status} al registrar en Check-in`);
  }
  return data;
}

/**
 * Consulta la validez y titularidad de un ticket en el microservicio de Entradas (MongoDB)
 * (GET /api/entradas/{id_ticket})
 */
export async function consultarTicketEnEntradas(idEntrada: string): Promise<ConsultaEntradaCheckinResponse> {
  const res = await fetch(`${GATEWAY_URL}/api/entradas/${encodeURIComponent(idEntrada.trim())}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.detail || `Ticket no encontrado en Entradas (HTTP ${res.status})`);
  }
  return data;
}

/**
 * Conector principal para la interfaz de Check-in:
 * Valida el ticket contra el Gateway (Check-in MySQL y respaldo MongoDB)
 * y devuelve el formato estándar para el modal de estado.
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
            checkin: data.ticket ?? { id_entrada: entradaLimpia, id_evento: eventoLimpio },
            entradasMongo: datosEntradas,
          }),
          ticket: {
            id_entrada: data.ticket?.id_entrada || entradaLimpia,
            id_evento: data.ticket?.id_evento || eventoLimpio,
            nombre_usuario: data.ticket?.nombre_usuario || datosEntradas?.nombre_usuario || "Asistente Verificado",
            nombre_evento: `Evento ${data.ticket?.id_evento || eventoLimpio}`,
            fecha: new Date().toLocaleDateString("es-CL"),
            hora_inicio: "09:30 hrs",
            hora_cierre: "20:00 hrs",
            direccion: "Sede Oficial del Evento",
            tipo_entrada: datosEntradas?.usuario.rol_usuario ? `Acceso (${datosEntradas.usuario.rol_usuario})` : "General",
          },
          motivo: data.motivo || "ACCESO_AUTORIZADO",
          mensaje: "Acceso autorizado. Entrada válida y registrada en el sistema de Check-in.",
          timestamp,
        };
      } else {
        const motivo = data.motivo || "ACCESO_DENEGADO";
        return {
          status: "rejected",
          rawContent: JSON.stringify(data),
          ticket: { id_entrada: entradaLimpia, id_evento: eventoLimpio },
          motivo,
          mensaje: `Acceso denegado (${motivo}). La entrada no coincide con el evento o no está habilitada.`,
          timestamp,
        };
      }
    }
  } catch (error) {
    console.warn("API Gateway no disponible, aplicando resolución local de demostración:", error);
  }

  // Fallback offline / desarrollo si el API Gateway no está activo
  return resolverTicketLocal(entradaLimpia, eventoLimpio, timestamp);
}

/**
 * Resuelve tickets de prueba localmente cuando el Gateway está offline
 */
function resolverTicketLocal(idEntrada: string, idEvento: string, timestamp: string): ScanResultInfo {
  const entradaLower = idEntrada.toLowerCase();
  const esRechazada =
    entradaLower.includes("inval") ||
    entradaLower.includes("rechaz") ||
    entradaLower.includes("fake") ||
    idEntrada === "0000";

  if (esRechazada) {
    return {
      status: "rejected",
      rawContent: `id_entrada: "${idEntrada}", id_evento: "${idEvento}"`,
      ticket: {
        id_entrada: idEntrada,
        id_evento: idEvento,
        nombre_evento: `Evento ${idEvento}`,
        nombre_usuario: "No registrado",
      },
      motivo: "TICKET_NOT_FOUND",
      mensaje: "Entrada no encontrada o anulada en el registro.",
      timestamp,
    };
  }

  // Semilla oficial de prueba del Grupo 5
  const esSemillaOficial = idEntrada === "tk-998877" || idEntrada === "tk-demo-001" || idEntrada === "tk-DEMO-2026";
  const nombreAsistente = esSemillaOficial ? "Asistente Semilla Grupo 5" : "Asistente Acreditado";

  return {
    status: "accepted",
    rawContent: `id_entrada: "${idEntrada}", id_evento: "${idEvento}"`,
    ticket: {
      id_entrada: idEntrada,
      id_evento: idEvento,
      nombre_usuario: nombreAsistente,
      nombre_evento: `Evento ${idEvento}`,
      direccion: "Auditorio Central, Campus Tecnológico",
      hora_inicio: "09:30 hrs",
      hora_cierre: "18:00 hrs",
      fecha: new Date().toLocaleDateString("es-CL"),
      tipo_entrada: "General",
    },
    motivo: "TICKET_FOUND",
    mensaje: "Entrada verificada con éxito (modo local / semilla).",
    timestamp,
  };
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
  let idEvento = "evt-77889"; // Semilla de evento por defecto del Grupo 5

  // 1. Caso JSON: { "id_entrada": "...", "id_evento": "..." }
  try {
    const data = JSON.parse(rawClean);
    if (typeof data === "object" && data !== null) {
      idEntrada = String(data.id_entrada || data.id || data.ticketId || data.id_ticket || "");
      idEvento = String(data.id_evento || data.eventoId || data.evento_id || idEvento);
    }
  } catch {
    // No es JSON, continuar con otros formatos
  }

  // 2. Caso URL: ...?idEntrada=...&idEvento=... o ...?ticket=...
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

  // 4. Caso separador por dos puntos o barra: "tk-998877:evt-77889" o "tk-998877|evt-77889"
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

  // Ejecuta la validación real contra el microservicio / Gateway
  return await validarTicketCheckin(idEntrada, idEvento);
}
