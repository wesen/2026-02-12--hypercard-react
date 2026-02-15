import { defineCardStack, type CardDefinition, type CardStackDefinition } from '@hypercard/engine';
import { INVENTORY_PLUGIN_BUNDLE } from './pluginBundle';

interface PluginCardMeta {
  id: string;
  title: string;
  icon: string;
}

const INVENTORY_CARD_META: PluginCardMeta[] = [
  { id: 'home', title: 'Home', icon: '🏠' },
  { id: 'browse', title: 'Browse Inventory', icon: '📋' },
  { id: 'lowStock', title: 'Low Stock', icon: '⚠️' },
  { id: 'salesToday', title: 'Sales Log', icon: '💰' },
  { id: 'itemDetail', title: 'Item Detail', icon: '📦' },
  { id: 'newItem', title: 'New Item', icon: '➕' },
  { id: 'receive', title: 'Receive Shipment', icon: '📦' },
  { id: 'priceCheck', title: 'Price Checker', icon: '🏷' },
  { id: 'report', title: 'Inventory Report', icon: '📊' },
  { id: 'assistant', title: 'AI Assistant', icon: '💬' },
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

export const STACK: CardStackDefinition = defineCardStack({
  id: 'inventory',
  name: 'Shop Inventory',
  icon: '📇',
  homeCard: 'home',
  plugin: {
    bundleCode: INVENTORY_PLUGIN_BUNDLE,
    capabilities: {
      domain: ['inventory', 'sales'],
      system: ['nav.go', 'nav.back', 'notify'],
    },
  },
  cards: Object.fromEntries(INVENTORY_CARD_META.map((card) => [card.id, toPluginCard(card)])),
});
