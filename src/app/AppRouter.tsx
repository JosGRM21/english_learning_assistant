import { AppTab } from '@/shared/constants/app-tabs';
import { OverviewDashboard } from '@/features/dashboard/components/OverviewDashboard';
import { VocabCatalogView } from '@/features/vocab/components/VocabCatalogView';
import { SrsReviewSession } from '@/features/srs/components/SrsReviewSession';
import { MinimalPairsGym } from '@/features/phonology/components/MinimalPairsGym';
import { SemanticsStudio } from '@/features/semantics/components/SemanticsStudio';
import { SpeedDrillArena } from '@/features/drills/components/SpeedDrillArena';
import { SocraticWritingStudio } from '@/features/writing/components/SocraticWritingStudio';
import { GradedReaderView } from '@/features/reader/components/GradedReaderView';
import { WeaknessHeatmap } from '@/features/diagnostics/components/WeaknessHeatmap';
import { QuotaMatrixMonitor } from '@/features/ai-monitor/components/QuotaMatrixMonitor';
import { BackupSettingsModal } from '@/features/settings/components/BackupSettingsModal';

export interface AppRouterProps {
  activeTab: AppTab;
  onNavigateTab: (tab: AppTab) => void;
}

export function AppRouter({ activeTab, onNavigateTab }: AppRouterProps) {
  switch (activeTab) {
    case 'dashboard':
      return (
        <OverviewDashboard
          onNavigateTab={(tab) => onNavigateTab(tab as AppTab)}
          onStartMicroWorkout={() => onNavigateTab('weaknesses')}
        />
      );
    case 'vocab':
      return <VocabCatalogView />;
    case 'srs':
      return <SrsReviewSession onNavigateTab={(tab) => onNavigateTab(tab as AppTab)} />;
    case 'semantics':
      return <SemanticsStudio />;
    case 'minimal_pairs':
      return <MinimalPairsGym />;
    case 'drills':
      return <SpeedDrillArena />;
    case 'writing':
      return <SocraticWritingStudio />;
    case 'reader':
      return <GradedReaderView />;
    case 'weaknesses':
      return <WeaknessHeatmap />;
    case 'quota_matrix':
      return <QuotaMatrixMonitor />;
    case 'settings':
      return <BackupSettingsModal />;
    default:
      return (
        <OverviewDashboard
          onNavigateTab={(tab) => onNavigateTab(tab as AppTab)}
          onStartMicroWorkout={() => onNavigateTab('weaknesses')}
        />
      );
  }
}
