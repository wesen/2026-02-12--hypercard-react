import type { CardTypeRenderer } from '@hypercard/engine';
import { renderMenuCard } from './MenuCardOverride';
import { renderListCard } from './ListCardOverride';
import { renderDetailCard } from './DetailCardOverride';
import { renderFormCard } from './FormCardOverride';

export const todoRenderers: Record<string, CardTypeRenderer> = {
  menu: renderMenuCard,
  list: renderListCard,
  detail: renderDetailCard,
  form: renderFormCard,
};
