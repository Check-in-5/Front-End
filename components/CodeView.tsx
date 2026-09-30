import { useState } from 'react';

export default function CodeView({ onBack }: {
  onBack: () => void;
  onSimulateScan?: (status: string) => void;
}) {
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');
  return (
    <main className="code-view">
      <h1>Ingreso por código secreto</h1>
      <p>La validación de entradas todavía no está conectada.</p>
      <form onSubmit={(event) => {
        event.preventDefault();
        setMessage(code.trim() ? 'No se puede validar este código todavía. Solicita ayuda al encargado del evento.' : 'Ingresa un código.');
      }}>
        <label htmlFor="entry-code">Código de entrada</label>
        <input id="entry-code" value={code} onChange={(event) => setCode(event.target.value)}
          autoComplete="off" autoCapitalize="none" spellCheck={false} maxLength={128} required />
        <button type="submit">Consultar código</button>
        <p role="status">{message}</p>
      </form>
      <button onClick={onBack}>Volver</button>
    </main>
  );
}
