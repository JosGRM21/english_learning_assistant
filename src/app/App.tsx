import { useState } from 'react';
import { AppProviders } from './providers/AppProviders';
import { AppLayout } from './AppLayout';
import { AppRouter } from './AppRouter';
import { AppTab } from '@/shared/constants/app-tabs';

export function App() {
  // Inicializado en 'vocab' temporalmente mientras 'dashboard' y otras secciones se encuentran en desarrollo
  const [activeTab, setActiveTab] = useState<AppTab>('vocab');

  return (
    <AppProviders>
      <AppLayout activeTab={activeTab} onNavigateTab={setActiveTab}>
        <AppRouter activeTab={activeTab} onNavigateTab={setActiveTab} />
      </AppLayout>
    </AppProviders>
  );
}

export default App;
