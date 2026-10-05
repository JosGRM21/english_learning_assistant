import { useState } from 'react';
import { Cpu, Key, Plus } from 'lucide-react';
import { PageHeader } from '@/shared/ui/PageHeader';
import { useQuotaMatrix } from '../hooks/useQuotaMatrix';
import { ResetCountdownPill } from './ResetCountdownPill';
import { ModelSelectorCard } from './ModelSelectorCard';
import { ApiKeyCard } from './ApiKeyCard';
import { ApiKeyEmptyState } from './ApiKeyEmptyState';
import { AddApiKeyModal } from './AddApiKeyModal';

export function AiModelsView() {
  const {
    keySummaries,
    defaultModel,
    setDefaultModel,
    addApiKey,
    removeApiKey,
    toggleApiKey,
    setPrimaryApiKey,
    testApiKey,
    timeUntilReset,
    models,
    formatCountdown,
  } = useQuotaMatrix();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [testingKeyId, setTestingKeyId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<Record<string, { success: boolean; message: string }>>({});

  const handleTestKey = async (keyId: string, secretKey: string) => {
    setTestingKeyId(keyId);
    try {
      const res = await testApiKey(secretKey);
      setTestResult((prev) => ({ ...prev, [keyId]: res }));
    } catch (err: unknown) {
      setTestResult((prev) => ({
        ...prev,
        [keyId]: {
          success: false,
          message: err instanceof Error ? err.message : 'Error al conectar con la API de Google Gemini',
        },
      }));
    } finally {
      setTestingKeyId(null);
    }
  };

  const handleDismissTestResult = (keyId: string) => {
    setTestResult((prev) => {
      const next = { ...prev };
      delete next[keyId];
      return next;
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Modelos de IA"
        description="Selecciona tu modelo y gestiona las claves de acceso a Google Gemini."
        icon={Cpu}
        actions={
          <>
            <ResetCountdownPill countdownText={formatCountdown(timeUntilReset.ms)} />
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="h-10 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Agregar clave de API</span>
            </button>
          </>
        }
      />

      {/* Model Selector Hero Card */}
      <ModelSelectorCard
        models={models}
        defaultModel={defaultModel}
        onSelectModel={setDefaultModel}
      />

      {/* API Keys Section */}
      <div className="space-y-4">
        <div>
          <h3 className="font-bold text-base text-gray-900 dark:text-white flex items-center gap-2">
            <Key className="w-4 h-4 text-indigo-500" />
            <span>Claves de API</span>
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Administra tus claves de Google AI Studio y supervisa el consumo diario de peticiones.
          </p>
        </div>

        {keySummaries.length === 0 ? (
          <ApiKeyEmptyState onOpenAddModal={() => setIsAddModalOpen(true)} />
        ) : (
          <div className="space-y-3.5 w-full">
            {keySummaries.map((summary) => (
              <ApiKeyCard
                key={summary.apiKey.id}
                summary={summary}
                models={models}
                canToggle={keySummaries.length > 1}
                canDelete={keySummaries.length > 1}
                onToggle={() => toggleApiKey(summary.apiKey.id)}
                onDelete={() => removeApiKey(summary.apiKey.id)}
                onSetPrimary={() => setPrimaryApiKey(summary.apiKey.id)}
                onTest={(secretKey) => handleTestKey(summary.apiKey.id, secretKey)}
                isTesting={testingKeyId === summary.apiKey.id}
                testResult={testResult[summary.apiKey.id]}
                onDismissTestResult={() => handleDismissTestResult(summary.apiKey.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Add API Key Modal */}
      <AddApiKeyModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddKey={addApiKey}
      />
    </div>
  );
}
