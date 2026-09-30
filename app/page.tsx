'use client';
import { useState } from 'react';
import SelectionView from '../components/SelectionView';
import ScannerView from '../components/ScannerView';
import CodeView from '../components/CodeView';

// Punto de entrada aislado
export default function CheckinApp() {
  const [currentView, setCurrentView] = useState<string>('selection');

  // Navegacion a camara
  const handleOpenScanner = () => {
    setCurrentView('scanner');
  };

  // Navegacion a ingreso manual
  const handleOpenCode = () => {
    setCurrentView('code');
  };

  // Retorno al inicio
  const handleBackToSelection = () => {
    setCurrentView('selection');
  };

  const mainContainerStyle = {
    backgroundColor: '#E8DFD8',
    minHeight: '100dvh',
    display: 'flex',
    flexDirection: 'column' as const,
    position: 'relative' as const
  };

  return (
    <div style={mainContainerStyle}>
      {currentView === 'selection' && (
        <SelectionView
          onSelectQR={handleOpenScanner}
          onSelectCode={handleOpenCode}
        />
      )}

      {currentView === 'scanner' && (
        <ScannerView
          onBack={handleBackToSelection}
        />
      )}

      {currentView === 'code' && (
        <CodeView
          onBack={handleBackToSelection}
        />
      )}

    </div>
  );
}
