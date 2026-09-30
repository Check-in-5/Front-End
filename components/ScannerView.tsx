'use client';

import { useEffect, useRef, useState } from 'react';
import type QrScanner from 'qr-scanner';
import { validateTicketQr, type TicketQrValidation } from '../lib/validate-ticket-qr';
import { parseCheckinResponse, type CheckinResult } from '../lib/checkin-response';

interface ScannerProps {
  onBack: () => void;
}

export default function ScannerView({ onBack }: ScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<TicketQrValidation | null>(null);
  const [validation, setValidation] = useState<CheckinResult | null>(null);
  const [validationError, setValidationError] = useState('');
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    if (!result?.ok) return;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    let cancelled = false;
    async function validate() {
      try {
        const response = await fetch('/api/checkin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(result?.ok ? result.data : null),
          signal: controller.signal,
        });
        const body = await response.json();
        if (!response.ok) {
          throw new Error(typeof body?.error?.message === 'string' ? body.error.message : 'No se pudo validar la entrada. Intenta nuevamente.');
        }
        const checked = parseCheckinResponse(body);
        if (checked.valido && result?.ok && (checked.ticket.id_entrada !== result.data.id_entrada || checked.ticket.id_evento !== result.data.id_evento)) {
          throw new Error('La respuesta del backend no corresponde al QR leído.');
        }
        if (!cancelled) setValidation(checked);
      } catch (err) {
        if (!cancelled) setValidationError(controller.signal.aborted
          ? 'El backend tardó demasiado en responder. Intenta nuevamente.'
          : err instanceof Error ? err.message : 'No se pudo conectar con el backend.');
      } finally {
        clearTimeout(timeout);
      }
    }
    void validate();
    return () => { cancelled = true; clearTimeout(timeout); controller.abort(); };
  }, [result, retry]);

  useEffect(() => {
    let scanner: QrScanner | null = null;
    let cancelled = false;
    let detected = false;
    const startCamera = async () => {
      if (!window.isSecureContext) {
        setError('Para usar la cámara, abre esta página mediante un enlace HTTPS. El enlace HTTP de la red local no permite acceder a la cámara.');
        return;
      }
      if (!navigator.mediaDevices?.getUserMedia) {
        setError('Este navegador no permite acceder a la cámara. Prueba en Safari o Chrome.');
        return;
      }
      try {
        const { default: Scanner } = await import('qr-scanner');
        if (cancelled || !videoRef.current) return;
        scanner = new Scanner(videoRef.current, (decoded) => {
          if (cancelled || detected) return;
          detected = true;
          scanner?.stop();
          setResult(validateTicketQr(decoded.data));
        }, {
          preferredCamera: 'environment',
          maxScansPerSecond: 10,
          returnDetailedScanResult: true,
          calculateScanRegion: (video) => ({
            x: 0, y: 0, width: video.videoWidth, height: video.videoHeight,
            downScaledWidth: Math.min(960, video.videoWidth),
            downScaledHeight: Math.round(video.videoHeight * Math.min(1, 960 / video.videoWidth)),
          }),
        });
        await scanner.start();
        if (cancelled) { scanner.destroy(); return; }
        setReady(true);
      } catch (err) {
        scanner?.destroy();
        if (cancelled) return;
        const detail = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
        setError(/NotAllowedError|Permission denied|not allowed/i.test(detail)
          ? 'Permite el acceso a la cámara en los ajustes de este sitio y vuelve a intentar.'
          : /NotFoundError|not found/i.test(detail)
          ? 'No se encontró una cámara en este dispositivo.'
          : 'No se pudo iniciar el lector QR. Revisa la conexión, cierra otras aplicaciones que usen la cámara y vuelve a intentar.');
      }
    };
    void startCamera();
    return () => {
      cancelled = true;
      scanner?.destroy();
    };
  }, [attempt]);

  const restart = () => {
    setError('');
    setReady(false);
    setResult(null);
    setValidation(null);
    setValidationError('');
    setAttempt(value => value + 1);
  };

  return (
    <main className="scanner-view">
      <div className="camera-preview">
        <video ref={videoRef} autoPlay muted playsInline aria-label="Vista de la cámara" />
        {result !== null ? <section className="camera-message" aria-live="polite">
          {result.ok ? <>
            <h1>{validationError ? 'No se pudo validar' : validation ? validation.valido ? 'Entrada encontrada' : 'Entrada no válida' : 'Validando entrada…'}</h1>
            <pre className="qr-content">{JSON.stringify(result.data, null, 2)}</pre>
            {validationError ? <>
              <p role="alert">{validationError}</p>
              <button onClick={() => { setValidationError(''); setValidation(null); setRetry(value => value + 1); }}>Reintentar validación</button>
            </> : validation ? validation.valido ? <>
              <p>{validation.ticket.nombre_usuario}</p>
              <p>La entrada existe y coincide con el evento. Esta consulta no registra asistencia ni comprueba usos previos.</p>
            </> : <p role="alert">{validation.motivo === 'TICKET_NOT_FOUND' ? 'La entrada no está registrada.' : 'La entrada pertenece a otro evento.'}</p>
              : <p role="status">Consultando el backend…</p>}
          </> : <div role="alert">
            <h1>QR inválido</h1>
            <p>{result.error}</p>
          </div>}
          <button onClick={restart}>Escanear otro QR</button>
        </section> : !ready && <div className="camera-message" role="status">
          <p>{error || 'Abriendo cámara…'}</p>
          {error && <button onClick={restart}>Reintentar</button>}
        </div>}
      </div>
      <div className="scanner-controls">
        <p>{result !== null ? 'Lectura terminada. Puedes escanear otro código.' : 'Apunta la cámara al QR y mantenlo completo y enfocado.'}</p>
        <div className="scanner-buttons">
          <button onClick={onBack}>Volver</button>
        </div>
      </div>
    </main>
  );
}
