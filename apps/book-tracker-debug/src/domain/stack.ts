import type { CardDefinition, CardStackDefinition } from '@hypercard/engine';
import { BOOK_TRACKER_PLUGIN_BUNDLE } from './pluginBundle';

interface PluginCardMeta {
  id: string;
  title: string;
  icon: string;
}

const BOOK_CARD_META: PluginCardMeta[] = [
  { id: 'home', title: 'Home', icon: '🏠' },
  { id: 'browse', title: 'Browse Books', icon: '📋' },
  { id: 'readingNow', title: 'Reading Now', icon: '🔥' },
  { id: 'bookDetail', title: 'Book Detail', icon: '📖' },
  { id: 'addBook', title: 'Add Book', icon: '➕' },
  { id: 'readingReport', title: 'Reading Report', icon: '📊' },
];

function toPluginCard(card: PluginCardMeta): CardDefinition {
  return {
    id: card.id,
    type: 'plugin',
    title: card.title,
    icon: card.icon,
    ui: {
      t: 'text',
      value: `Plugin card placeholder: ${card.id}`,
    },
  };
}

export const STACK: CardStackDefinition = {
  id: 'bookTrackerDebug',
  name: 'Book Tracker',
  icon: '📚',
  homeCard: 'home',
  plugin: {
    bundleCode: BOOK_TRACKER_PLUGIN_BUNDLE,
    capabilities: {
      domain: ['books'],
      system: ['nav.go', 'nav.back', 'notify'],
    },
  },
  cards: Object.fromEntries(BOOK_CARD_META.map((card) => [card.id, toPluginCard(card)])),
};
