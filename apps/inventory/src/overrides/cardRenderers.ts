import type { CardTypeRenderer } from '@hypercard/engine';
import { renderMenuCard } from './MenuCardOverride';
import { renderListCard } from './ListCardOverride';
import { renderDetailCard } from './DetailCardOverride';
import { renderFormCard } from './FormCardOverride';
import { renderReportCard } from './ReportCardOverride';
import { renderChatCard } from './ChatCardOverride';

export const inventoryRenderers: Record<string, CardTypeRenderer> = {
  menu: renderMenuCard,
  list: renderListCard,
  detail: renderDetailCard,
  form: renderFormCard,
  report: renderReportCard,
  chat: renderChatCard,
};
