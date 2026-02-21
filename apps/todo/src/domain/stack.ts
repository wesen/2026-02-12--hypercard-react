import type { CardDefinition, CardStackDefinition } from '@hypercard/engine';
import { TODO_PLUGIN_BUNDLE } from './pluginBundle';

interface PluginCardMeta {
  id: string;
  title: string;
  icon: string;
}

const TODO_CARD_META: PluginCardMeta[] = [
  { id: 'home', title: 'Home', icon: '🏠' },
  { id: 'browse', title: 'All Tasks', icon: '📋' },
  { id: 'inProgress', title: 'In Progress', icon: '🔥' },
  { id: 'completed', title: 'Completed', icon: '✅' },
  { id: 'taskDetail', title: 'Task Detail', icon: '📝' },
  { id: 'newTask', title: 'New Task', icon: '➕' },
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
  id: 'todo',
  name: 'My Tasks',
  icon: '✅',
  homeCard: 'home',
  plugin: {
    bundleCode: TODO_PLUGIN_BUNDLE,
    capabilities: {
      domain: ['tasks'],
      system: ['nav.go', 'nav.back', 'notify'],
    },
  },
  cards: Object.fromEntries(TODO_CARD_META.map((card) => [card.id, toPluginCard(card)])),
};
