# TicketU — Front-End (Módulo de Check-in y Control de Acceso)

Interfaz web moderna y reactiva desarrollada con **Next.js 14 (App Router)**, **TypeScript** y **React 18**. Forma parte del ecosistema distribuido **TicketU**, operando dentro de la red Docker compartida `plataforma-eventos-net` en el puerto `3000`.

Este repositorio aloja la aplicación cliente especializada para el **Módulo de Check-in (Grupo 5)**, diseñada para el control y acreditación de asistentes en puerta mediante escaneo de códigos QR en tiempo real y búsqueda manual por código.

---

## 📑 Contenidos
1. [Cumplimiento de Rúbrica — Evaluación 2 (Interoperabilidad)](#-cumplimiento-de-rúbrica--evaluación-2-interoperabilidad)
2. [Declaración Oficial de Integraciones](#-declaración-oficial-de-integraciones)
3. [Auditoría del Rol UI/UX Front-End (Ítem UI1)](#-auditoría-del-rol-uiux-front-end-ítem-ui1)
4. [Vistas y Funcionalidades del Front-End](#-vistas-y-funcionalidades-del-front-end)
5. [Arquitectura de Proxy y Resiliencia (`src/app/api`)](#-arquitectura-de-proxy-y-resiliencia-srcappapi)
6. [Asignación de Responsables por Rol](#-asignación-de-responsables-por-rol)
7. [Despliegue y Ejecución](#-despliegue-y-ejecución)
8. [Variables de Entorno](#-variables-de-entorno)

---

## 🎯 Cumplimiento de Rúbrica — Evaluación 2 (Interoperabilidad)

El Front-End fue diseñado y desacoplado para satisfacer con rigor técnico cada criterio de la rúbrica oficial **TITEC 2026-2**:

| Rol / Ítem | Requisitos Evaluados | Estado en Front-End | Evidencia en el Código / Repositorio |
| :--- | :--- | :---: | :--- |
| **UI/UX (UI1)** | **(a)** Flujo visible desde interfaz.<br>**(b)** Transparente para el usuario.<br>**(c)** Sin volcado de JSON o datos técnicos al usuario común.<br>**(d)** Manejo amigable ante caída de contrapartes. | **Logrado (4)** | • Flujo fluido en `/checkin` con cámara en vivo y entrada por código.<br>• Transición instantánea a modal de validación sin recargar la página.<br>• Badges amigables ("Acceso Permitido", "Acceso Denegado").<br>• Detección y notificación controlada ante fallas de conexión sin crasheo de React. |
| **Back End (BE1)** | **(a)** Ejecución real contra contrapartes.<br>**(b)** Manejo de errores sin caídas.<br>**(c)** Sin datos fijos manuales.<br>**(d)** Contratos coincidentes. | **Soportado** | Conectores Next.js API Routes (`/api/checkin/*` y `/api/entradas/*`) con reintentos multipuerto y fallback resiliente. |
| **Base de Datos (BD1)** | **(a)** Consistencia con la persistencia.<br>**(b)** Trazabilidad.<br>**(d)** No replicación indebida. | **Soportado** | Muestra en pantalla los datos reales sincronizados desde MySQL (Check-in) y MongoDB (Entradas) en tiempo real. |

---

## 🔌 Declaración Oficial de Integraciones

Cumpliendo con la regla de **dos integraciones efectivas de tipos distintos**:

| Integración | Tipo Rúbrica | Contraparte | Endpoint / Servicio | Propósito y Comportamiento Funcional |
| :--- | :---: | :--- | :--- | :--- |
| **I1** | **Tipo A**<br>*(Servicio Consumido)* | **Entradas / Inventario**<br>*(Grupo 3 — MongoDB)* | `GET /api/v1/entradas/{id_ticket}/detalle` | Consulta en caliente la información de titularidad del ticket y usuario comprador. Los datos obtenidos (`nombre_usuario`, `rol_usuario`, etc.) se inyectan en la ficha de acreditación. |
| **I2** | **Tipo B / A**<br>*(Servicio Ofrecido y Consumido)* | **Check-in Backend (MySQL) & Panel Organizador** | `POST /api/checkin/validaciones`<br>`POST /api/checkin/tickets` | Valida el ticket contra el registro de accesos en puerta y evalúa reglas de negocio del evento (estados `CANCELADO` o `FINALIZADO` definidos en Panel). Si el evento fue cancelado, la UI bloquea el paso de inmediato. |

---

## 🎨 Auditoría del Rol UI/UX Front-End (Ítem UI1)

El ítem **UI1 (Integración en el comportamiento funcional)** se encuentra implementado bajo los cuatro elementos exigidos:

1. **(a) Base — Integración visible en el flujo:**
   - Al escanear un QR o escribir un código en `/checkin`, la UI contacta a los servicios contraparte en tiempo real.
   - La pantalla de resultado renderiza los datos combinados de la entrada (nombre del asistente, tipo de acreditación y evento), demostrando la interoperabilidad de forma transparente.
2. **(b) Transparencia para el usuario final:**
   - La cámara web/móvil lee el QR de forma autónoma con haptic feedback (`vibrate`).
   - El resultado se despliega en un modal inmediato sin exigir recargas de página (`F5`), logins redundantes ni copiado manual de identificadores.
   - Botón directo *"Escanear otro QR"* para retomar el flujo de control de acceso de forma continua.
3. **(c) No expone datos técnicos sin procesar:**
   - Se utilizan tarjetas con semáforo de colores claro:
     - 🟢 **Acceso Permitido:** Ticket válido y vigente.
     - 🔴 **Acceso Denegado:** Ticket inexistente o perteneciente a otro evento.
     - 🟡 **QR No Reconocido:** Formato inválido o error de comunicación.
   - El volcado JSON crudo del QR permanece **oculto por defecto** (`showRaw: false`) dentro de una sección desplegable pensada exclusivamente para inspección técnica.
4. **(d) Resiliencia y manejo comprensible ante fallos:**
   - Si los microservicios están detenidos o hay pérdida de conectividad de red, la aplicación no produce pantalla blanca ni fallos de renderizado.
   - `api.ts` captura las excepciones mediante `Promise.allSettled` y presenta un aviso comprensible que informa al operador la indisponibilidad del servicio.

---

## 🖥️ Vistas y Funcionalidades del Front-End

```text
src/
├── app/
│   ├── page.tsx                     ← Inicio: Panel principal y accesos rápidos
│   ├── checkin/page.tsx             ← Módulo Check-in: Punto de entrada
│   └── api/                         ← Proxy interno de Next.js
│       ├── checkin/validaciones/    ← Reenvío a Check-in (MySQL :3005)
│       ├── checkin/tickets/         ← Reenvío a Check-in (MySQL :3005)
│       └── entradas/[id]/           ← Consulta a Entradas (MongoDB :3003)
├── modules/
│   └── checkin/
│       ├── api.ts                   ← Capa cliente de comunicación HTTP
│       ├── types.ts                 ← Modelos de datos TypeScript
│       └── components/
│           ├── CheckinPlaceholder   ← Orquestador de estados de navegación
│           ├── SelectionView        ← Menú de selección de método
│           ├── ScannerView          ← Escáner de cámara en vivo
│           ├── CodeView             ← Formulario de búsqueda por código
│           ├── StatusScan           ← Modal de acreditación y feedback
│           └── icons.tsx            ← Iconografía SVG optimizada
└── components/layout/
    ├── Header.tsx                   ← Barra superior institucional
    └── logo.tsx                     ← Logotipo corporativo TicketU
```

### 1. Pantalla de Selección (`SelectionView.tsx`)
Presenta las vías de acreditación disponibles:
- **Botón 1 — Ingreso por QR:** Inicia el visor de cámara para lectura automática.
- **Botón 2 — Ingreso por código secreto:** Despliega el formulario de validación por teclado.
- **Botón 3 — Tres puntos (`...`):** Acceso reservado para opciones y configuraciones de puerta.

### 2. Escáner QR en Tiempo Real (`ScannerView.tsx`)
- Detección acelerada por hardware mediante la API nativa `BarcodeDetector` (formatos `qr_code`), con fallback integrado.
- Visor con retícula interactiva y esquinas animadas estilo visor óptico.
- Soporte para contextos seguros (`localhost` o HTTPS) con mensajes descriptivos ante bloqueo de permisos de cámara por parte del navegador.
- Retroalimentación háptica con vibración al confirmar la captura del código.

### 3. Ingreso por Código Manual (`CodeView.tsx`)
- Formulario de contingencia para tickets deteriorados o pantallas ilegibles.
- Campos validados para `id_entrada` e `id_evento`.
- Manejo de estados de carga (`isLoading`) y deshabilitación preventiva del botón para evitar envíos duplicados.

### 4. Modal de Resultado y Acreditación (`StatusScan.tsx`)
- Accesibilidad mejorada: compatible con cierre mediante tecla `Escape` o clic en botón cerrar (`X`).
- Resumen visual con detalles del asistente:
  - Identificador de ticket y evento.
  - Nombre del asistente acreditado.
  - Sede, hora de apertura, hora de cierre y fecha de ingreso.
  - Hora exacta del escaneo para auditoría de asistencia.

---

## 🛡️ Arquitectura de Proxy y Resiliencia (`src/app/api`)

Para evitar problemas de CORS y garantizar funcionamiento tanto en red Docker interna como en desarrollo local, el front incorpora rutas de proxy en Next.js:

1. **Proxy a Check-in (`/api/checkin/validaciones`):**
   - Evalúa sucesivamente los destinos:
     1. `http://checkin-service:3005/api/checkin/validaciones` (Docker interno).
     2. `http://backend-main-checkin-service-1:3005/api/checkin/validaciones`.
     3. `http://localhost:3005/api/checkin/validaciones` (Host local).
2. **Proxy a Entradas (`/api/entradas/[id]`):**
   - Evalúa sucesivamente los destinos:
     1. `http://entradas-service:3000/api/v1/entradas/{id}/detalle` (Docker interno).
     2. `http://localhost:3003/api/v1/entradas/{id}/detalle` (Host local).

---

## 👥 Asignación de Responsables por Rol

Conforme a la **Sección 3 de la especificación de Evaluación 2 (TITEC 2026-2)**:

| Rol | Ítems de la Rúbrica | Responsabilidades Asignadas |
| :--- | :---: | :--- |
| **UI/UX (Front End)** | **UI1** | Diseño de componentes en Next.js, flujo de usuario en `/checkin`, cámara web en vivo, resiliencia visual y prevención de exposición de errores técnicos. |
| **Back End** | **BE1** | Microservicio Check-in en Express, endpoints REST, integración contra Entradas y Panel Organizador, contratos OpenAPI. |
| **Base de Datos** | **BD1** | Persistencia relacional MySQL (`ticket`, `registro_asistencia`), integridad referencial y no replicación de atributos ajenos. |
| **Gestión** | **GE1** | Historias de usuario, criterios de aceptación, vinculación con commits/PR y trazabilidad de contratos. |
| **Calidad** | **CA1** | Casos de prueba automatizados, colección de pruebas y evidencias de ejecución contra contrapartes reales. |

---

## 🚀 Despliegue y Ejecución

### Opción 1: Ejecución con Docker (Recomendada para evaluación)

El front se ejecuta dentro de la red Docker compartida `plataforma-eventos-net`:

1. Asegúrate de que la red externa exista:
   ```bash
   docker network create plataforma-eventos-net
   ```
2. Construir la imagen y levantar el servicio:
   ```bash
   docker compose up -d --build
   ```
3. Verificar que el contenedor esté activo:
   ```bash
   docker compose ps
   ```
4. Abrir en el navegador:
   - **Inicio:** [http://localhost:3000](http://localhost:3000)
   - **Módulo de Check-in:** [http://localhost:3000/checkin](http://localhost:3000/checkin)

Para detener el servicio:
```bash
docker compose down
```

---

### Opción 2: Ejecución Local (Node.js)

1. Instalar dependencias:
   ```bash
   npm install
   ```
2. Generar el archivo de variables locales:
   ```bash
   cp .env.example .env.local
   ```
3. Iniciar el servidor de desarrollo:
   ```bash
   npm run dev
   ```
4. O compilar para producción:
   ```bash
   npm run build
   npm run start
   ```

---

## ⚙️ Variables de Entorno

Definidas en `.env.local` y suministradas en `docker-compose.yml`:

```env
# URL pública del API Gateway para consumo desde el navegador
NEXT_PUBLIC_GATEWAY_URL=http://localhost:8080
```
