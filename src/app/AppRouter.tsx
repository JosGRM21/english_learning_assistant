import { AppTab } from '@/shared/constants/app-tabs';
import { HomeEmptyView } from '@/features/home/components/HomeView';
import { VocabCatalogView } from '@/features/vocab/components/VocabCatalogView';
import { SrsReviewSession } from '@/features/srs/components/SrsReviewSession';
import { SocraticWritingStudio } from '@/features/writing/components/SocraticWritingStudio';
import { AiModelsView } from '@/features/ai-monitor/components/AiModelsView';
import { SettingsView } from '@/features/settings/components/SettingsView';
import { AboutView } from '@/features/about/components/AboutView';

export interface AppRouterProps {
  activeTab: AppTab;
  onNavigateTab: (tab: AppTab) => void;
}

export function AppRouter({ activeTab, onNavigateTab }: AppRouterProps) {
  switch (activeTab) {
    case 'home':
      return <HomeEmptyView onNavigateTab={onNavigateTab} />;
    case 'vocab':
      return <VocabCatalogView />;
    case 'srs':
      return <SrsReviewSession onNavigateTab={(tab) => onNavigateTab(tab as AppTab)} />;
    case 'writing':
      return <SocraticWritingStudio />;
    case 'quota_matrix':
      return <AiModelsView />;
    case 'settings':
      return <SettingsView />;
    case 'about':
      return <AboutView />;
    default:
      return <HomeEmptyView onNavigateTab={onNavigateTab} />;
  }
}


