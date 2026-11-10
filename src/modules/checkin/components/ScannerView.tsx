"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { ArrowLeft, Camera, RefreshCw, AlertCircle, CheckCircle2, XCircle } from "./icons";
import { ScanResultInfo } from "../types";
import { procesarLecturaQR } from "../api";

interface ScannerProps {
  onBack: () => void;
  onScan: (result: ScanResultInfo) => void;
  onSimulateScan?: (status: string) => void;
}

export default function ScannerView({ onBack, onScan, onSimulateScan }: ScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<number | null>(null);

  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [scannerSupported, setScannerSupported] = useState(true);
  const [attempt, setAttempt] = useState(0);

  // Detener la cámara y el intervalo
  const stopCamera = useCallback(() => {
    if (scanIntervalRef.current) {
      window.clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsScanning(false);
  }, []);

  // Procesar código leído
  const handleDecodedQR = useCallback(
    async (qrContent: string) => {
      // Detener cámara al leer exitosamente
      stopCamera();
      setIsValidating(true);

      // Haptic feedback si está disponible
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        try {
          navigator.vibrate(100);
        } catch {
          // Ignorar si el navegador bloquea la vibración
        }
      }

      try {
        const result = await procesarLecturaQR(qrContent);
        onScan(result);
      } finally {
        setIsValidating(false);
      }
    },
    [stopCamera, onScan]
  );

  // Inicializar cámara y lector
  useEffect(() => {
    let cancelled = false;

    async function initCamera() {
      setCameraError(null);
      setHasCameraPermission(null);

      // Verificación de contexto seguro (HTTPS o localhost)
      if (typeof window !== "undefined" && !window.isSecureContext && window.location.hostname !== "localhost") {
        setCameraError("Para utilizar la cámara se requiere una conexión segura (HTTPS).");
        setHasCameraPermission(false);
        return;
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError("Tu navegador o dispositivo no admite acceso a la cámara.");
        setHasCameraPermission(false);
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }

        setHasCameraPermission(true);
        setIsScanning(true);

        // Iniciar detector de código de barras / QR si existe BarcodeDetector nativo
        if (typeof window !== "undefined" && "BarcodeDetector" in window) {
          try {
            // @ts-expect-error - BarcodeDetector es un API web moderno
            const barcodeDetector = new window.BarcodeDetector({ formats: ["qr_code"] });

            scanIntervalRef.current = window.setInterval(async () => {
              if (!videoRef.current || videoRef.current.readyState < 2) return;
              try {
                const barcodes = await barcodeDetector.detect(videoRef.current);
                if (barcodes.length > 0 && barcodes[0].rawValue) {
                  handleDecodedQR(barcodes[0].rawValue);
                }
              } catch {
                // Error de lectura en frame actual, continúa escaneando
              }
            }, 250);
          } catch (e) {
            console.warn("BarcodeDetector no soportado, usando modo fallback:", e);
            setScannerSupported(false);
          }
        } else {
          setScannerSupported(false);
        }
      } catch (err: unknown) {
        if (cancelled) return;
        setHasCameraPermission(false);
        const errorText = err instanceof Error ? err.message : String(err);
        if (/NotAllowedError|permission|denied/i.test(errorText)) {
          setCameraError("Permiso de cámara denegado. Permite el acceso a la cámara en el navegador y reintenta.");
        } else if (/NotFoundError|device|not found/i.test(errorText)) {
          setCameraError("No se encontró ninguna cámara disponible en este dispositivo.");
        } else {
          setCameraError("No se pudo iniciar la cámara: " + errorText);
        }
      }
    }

    initCamera();

    return () => {
      cancelled = true;
      stopCamera();
    };
  }, [attempt, handleDecodedQR, stopCamera]);

  // Simulación de prueba rápida con semillas oficiales Grupo 5
  const handleSimular = (tipo: "valido" | "invalido" | "demo2") => {
    if (tipo === "valido") {
      if (onSimulateScan) onSimulateScan("accepted");
      handleDecodedQR(
        JSON.stringify({
          id_entrada: "tk-998877",
          id_evento: "evt-77889",
        })
      );
    } else if (tipo === "demo2") {
      if (onSimulateScan) onSimulateScan("accepted");
      handleDecodedQR(
        JSON.stringify({
          id_entrada: "tk-demo-001",
          id_evento: "evt-002",
        })
      );
    } else {
      if (onSimulateScan) onSimulateScan("rejected");
      handleDecodedQR(
        JSON.stringify({
          id_entrada: "tk-RECHAZADO-99",
          id_evento: "evt-77889",
        })
      );
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        backgroundColor: "#111827",
        minHeight: "75vh",
        padding: "20px 16px",
        fontFamily: "'Inter', sans-serif",
        color: "#FFFFFF",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "480px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        {/* Barra superior con volver */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <button
            type="button"
            onClick={() => {
              stopCamera();
              onBack();
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              backgroundColor: "rgba(255, 255, 255, 0.12)",
              color: "#FFFFFF",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              borderRadius: "8px",
              padding: "8px 16px",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <ArrowLeft size={16} />
            <span>Volver</span>
          </button>

          <span
            style={{
              fontSize: "12px",
              fontWeight: 600,
              backgroundColor: "#2F4374",
              padding: "4px 10px",
              borderRadius: "999px",
            }}
          >
            Lector QR en vivo
          </span>
        </div>

        {/* Contenedor del video / visor de cámara */}
        <div
          style={{
            position: "relative",
            width: "100%",
            height: "380px",
            backgroundColor: "#000000",
            borderRadius: "12px",
            overflow: "hidden",
            boxShadow: "0 8px 24px rgba(0, 0, 0, 0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* Elemento de video */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />

          {/* Cuadro de enfoque / retícula animada cuando la cámara funciona */}
          {hasCameraPermission && isScanning && (
            <div
              style={{
                position: "absolute",
                width: "220px",
                height: "220px",
                border: "2px solid rgba(255, 255, 255, 0.4)",
                borderRadius: "16px",
                boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.45)",
                pointerEvents: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {/* Esquinas decorativas estilo escáner */}
              <div
                style={{
                  position: "absolute",
                  top: -2,
                  left: -2,
                  width: 24,
                  height: 24,
                  borderTop: "4px solid #FFFFFF",
                  borderLeft: "4px solid #FFFFFF",
                  borderTopLeftRadius: "12px",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  top: -2,
                  right: -2,
                  width: 24,
                  height: 24,
                  borderTop: "4px solid #FFFFFF",
                  borderRight: "4px solid #FFFFFF",
                  borderTopRightRadius: "12px",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  bottom: -2,
                  left: -2,
                  width: 24,
                  height: 24,
                  borderBottom: "4px solid #FFFFFF",
                  borderLeft: "4px solid #FFFFFF",
                  borderBottomLeftRadius: "12px",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  bottom: -2,
                  right: -2,
                  width: 24,
                  height: 24,
                  borderBottom: "4px solid #FFFFFF",
                  borderRight: "4px solid #FFFFFF",
                  borderBottomRightRadius: "12px",
                }}
              />

              {/* Línea animada de escaneo */}
              <div
                style={{
                  position: "absolute",
                  width: "100%",
                  height: "2px",
                  backgroundColor: "#60A5FA",
                  boxShadow: "0 0 8px #60A5FA",
                  animation: "scanPulse 2s ease-in-out infinite",
                }}
              />
            </div>
          )}

          {/* Estado de error o carga de cámara */}
          {hasCameraPermission === false && (
            <div
              style={{
                position: "absolute",
                padding: "24px",
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "12px",
                maxWidth: "340px",
              }}
            >
              <AlertCircle size={40} color="#F87171" />
              <div style={{ fontSize: "14px", color: "#FCA5A5", lineHeight: 1.5 }}>
                {cameraError || "No se pudo acceder a la cámara."}
              </div>
              <button
                type="button"
                onClick={() => setAttempt((v) => v + 1)}
                style={{
                  backgroundColor: "#2F4374",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: "8px",
                  padding: "8px 16px",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <RefreshCw size={14} />
                <span>Reintentar cámara</span>
              </button>
            </div>
          )}

          {hasCameraPermission === null && (
            <div
              style={{
                position: "absolute",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <Camera size={36} color="#9CA3AF" />
              <span style={{ fontSize: "13px", color: "#D1D5DB" }}>Iniciando cámara...</span>
            </div>
          )}
        </div>

        {/* Guía informativa */}
        <p
          style={{
            textAlign: "center",
            fontSize: "13px",
            color: "#9CA3AF",
            margin: "0 0 8px 0",
          }}
        >
          Apunta la cámara al código QR de la entrada para leerlo automáticamente.
        </p>

        {/* Opciones de prueba y alternativas */}
        <div
          style={{
            backgroundColor: "#1F2937",
            borderRadius: "10px",
            padding: "16px",
            border: "1px solid #374151",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          <div style={{ fontSize: "12px", fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase" }}>
            Pruebas de escaneo rápido:
          </div>

          {/* Botones de prueba con QR real / semillas oficiales Grupo 5 */}
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button
              type="button"
              disabled={isValidating}
              onClick={() => handleSimular("valido")}
              style={{
                flex: 1,
                minWidth: "130px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                backgroundColor: "#065F46",
                color: "#E2F4EA",
                border: "none",
                borderRadius: "8px",
                padding: "8px 12px",
                fontSize: "12px",
                fontWeight: 600,
                cursor: isValidating ? "wait" : "pointer",
                opacity: isValidating ? 0.7 : 1,
              }}
            >
              <CheckCircle2 size={14} />
              <span>{isValidating ? "Validando..." : "QR tk-998877"}</span>
            </button>

            <button
              type="button"
              disabled={isValidating}
              onClick={() => handleSimular("demo2")}
              style={{
                flex: 1,
                minWidth: "130px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                backgroundColor: "#1E429F",
                color: "#E1EFFE",
                border: "none",
                borderRadius: "8px",
                padding: "8px 12px",
                fontSize: "12px",
                fontWeight: 600,
                cursor: isValidating ? "wait" : "pointer",
                opacity: isValidating ? 0.7 : 1,
              }}
            >
              <CheckCircle2 size={14} />
              <span>QR tk-demo-001</span>
            </button>

            <button
              type="button"
              disabled={isValidating}
              onClick={() => handleSimular("invalido")}
              style={{
                flex: 1,
                minWidth: "120px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                backgroundColor: "#7F1D1D",
                color: "#FDF0F2",
                border: "none",
                borderRadius: "8px",
                padding: "8px 12px",
                fontSize: "12px",
                fontWeight: 600,
                cursor: isValidating ? "wait" : "pointer",
                opacity: isValidating ? 0.7 : 1,
              }}
            >
              <XCircle size={14} />
              <span>QR Rechazado</span>
            </button>
          </div>
        </div>
      </div>

      {/* Estilo para animación de línea de escáner */}
      <style>{`
        @keyframes scanPulse {
          0% { top: 0%; opacity: 0.3; }
          50% { top: 50%; opacity: 1; }
          100% { top: 100%; opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}
