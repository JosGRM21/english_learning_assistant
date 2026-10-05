import { AppTab } from '@/shared/constants/app-tabs';
import { VocabCatalogView } from '@/features/vocab/components/VocabCatalogView';
import { SrsReviewSession } from '@/features/srs/components/SrsReviewSession';
import { SocraticWritingStudio } from '@/features/writing/components/SocraticWritingStudio';
import { QuotaMatrixMonitor } from '@/features/ai-monitor/components/QuotaMatrixMonitor';
import { BackupSettingsModal } from '@/features/settings/components/BackupSettingsModal';

export interface AppRouterProps {
  activeTab: AppTab;
  onNavigateTab: (tab: AppTab) => void;
}

export function AppRouter({ activeTab, onNavigateTab }: AppRouterProps) {
  switch (activeTab) {
    case 'vocab':
      return <VocabCatalogView />;
    case 'srs':
      return <SrsReviewSession onNavigateTab={(tab) => onNavigateTab(tab as AppTab)} />;
    case 'writing':
      return <SocraticWritingStudio />;
    case 'quota_matrix':
      return <QuotaMatrixMonitor />;
    case 'settings':
      return <BackupSettingsModal />;
    default:
      return <VocabCatalogView />;
  }
}
