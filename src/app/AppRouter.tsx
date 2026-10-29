import { lazy, Suspense } from 'react';
import { AppTab } from '@/shared/constants/app-tabs';
import { HomeView } from '@/features/home/components/HomeView';
import { LoadingSpinner } from '@/shared/ui/LoadingSpinner';

const VocabCatalogView = lazy(() =>
  import('@/features/vocab/components/VocabCatalogView').then((m) => ({ default: m.VocabCatalogView })),
);
const SrsReviewSession = lazy(() =>
  import('@/features/srs/components/SrsReviewSession').then((m) => ({ default: m.SrsReviewSession })),
);
const PhoneticsLabView = lazy(() =>
  import('@/features/phonetics/components/PhoneticsLabView').then((m) => ({ default: m.PhoneticsLabView })),
);
const SocraticWritingStudio = lazy(() =>
  import('@/features/writing/components/SocraticWritingStudio').then((m) => ({ default: m.SocraticWritingStudio })),
);
const AiModelsView = lazy(() =>
  import('@/features/ai-monitor/components/AiModelsView').then((m) => ({ default: m.AiModelsView })),
);
const SettingsView = lazy(() =>
  import('@/features/settings/components/SettingsView').then((m) => ({ default: m.SettingsView })),
);
const AboutView = lazy(() =>
  import('@/features/about/components/AboutView').then((m) => ({ default: m.AboutView })),
);

function ViewFallback() {
  return (
    <div className="flex items-center justify-center min-h-[50vh] p-8 animate-in fade-in duration-200">
      <LoadingSpinner size="md" />
    </div>
  );
}

export interface AppRouterProps {
  activeTab: AppTab;
  onNavigateTab: (tab: AppTab) => void;
}

export function AppRouter({ activeTab, onNavigateTab }: AppRouterProps) {
  return (
    <Suspense fallback={<ViewFallback />}>
      {(() => {
        switch (activeTab) {
          case 'home':
            return <HomeView onNavigateTab={onNavigateTab} />;
          case 'vocab':
            return <VocabCatalogView />;
          case 'srs':
            return <SrsReviewSession onNavigateTab={(tab) => onNavigateTab(tab as AppTab)} />;
          case 'phonetics_lab':
            return <PhoneticsLabView onNavigateTab={onNavigateTab} />;
          case 'writing':
            return <SocraticWritingStudio onNavigateTab={onNavigateTab} />;
          case 'quota_matrix':
            return <AiModelsView />;
          case 'settings':
            return <SettingsView />;
          case 'about':
            return <AboutView />;
          default:
            return <HomeView onNavigateTab={onNavigateTab} />;
        }
      })()}
    </Suspense>
  );
}
