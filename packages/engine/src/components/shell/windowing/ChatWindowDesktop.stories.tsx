/**
 * Story: a DesktopShell with a ChatWindow rendered inside a desktop window.
 * Chat actions open other card windows and inject new cards via the runtime.
 */
import type { Meta, StoryObj } from '@storybook/react';
import { type ReactNode, useCallback, useRef, useState } from 'react';
import { Provider, useDispatch } from 'react-redux';
import { createAppStore } from '../../../app/createAppStore';
import type { CardDefinition, CardStackDefinition } from '../../../cards/types';
import type { ColumnConfig } from '../../../types';
import {
  ChatWindow,
  type ChatWindowMessage,
  type InlineWidget,
} from '../../widgets/ChatWindow';
import { DataTable } from '../../widgets/DataTable';
import { ReportView } from '../../widgets/ReportView';
import { DesktopShell } from './DesktopShell';
import { openWindow } from '../../../features/windowing/windowingSlice';
import type { DesktopIconDef } from './types';
import DEMO_PLUGIN_BUNDLE from './DesktopShell.demo.vm.js?raw';

/* ═══════════════════════════════════════════════════════════════════════
   Stack definition
   ═══════════════════════════════════════════════════════════════════════ */

interface PluginCardMeta { id: string; title: string; icon: string }

const CARD_META: PluginCardMeta[] = [
  { id: 'home', title: 'Home', icon: '🏠' },
  { id: 'browse', title: 'Browse Items', icon: '📋' },
  { id: 'report', title: 'Reports', icon: '📊' },
  { id: 'chat', title: 'Chat', icon: '💬' },
  { id: 'settings', title: 'Settings', icon: '⚙️' },
];

function toPluginCard(card: PluginCardMeta): CardDefinition {
  return {
    id: card.id,
    type: 'plugin',
    title: card.title,
    icon: card.icon,
    ui: { t: 'text', value: `Plugin card: ${card.id}` },
  };
}

const STACK: CardStackDefinition = {
  id: 'chat-desktop-demo',
  name: 'Chat Desktop',
  icon: '💬',
  homeCard: 'home',
  plugin: {
    bundleCode: DEMO_PLUGIN_BUNDLE,
    capabilities: { system: ['nav.go', 'nav.back', 'notify'] },
  },
  cards: Object.fromEntries(CARD_META.map((c) => [c.id, toPluginCard(c)])),
};

const ICONS: DesktopIconDef[] = [
  { id: 'home', label: 'Home', icon: '🏠' },
  { id: 'browse', label: 'Browse', icon: '📋' },
  { id: 'report', label: 'Reports', icon: '📊' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
];

/* ═══════════════════════════════════════════════════════════════════════
   Fake data for inline widgets
   ═══════════════════════════════════════════════════════════════════════ */

const ITEMS_DATA = [
  { id: '1', name: 'Widget A', sku: 'W-1001', qty: 45, price: 12.0, category: 'Widgets' },
  { id: '2', name: 'Gadget B', sku: 'G-2001', qty: 38, price: 25.5, category: 'Gadgets' },
  { id: '3', name: 'Doohickey C', sku: 'P-3001', qty: 73, price: 8.75, category: 'Parts' },
  { id: '4', name: 'Widget D', sku: 'W-1002', qty: 12, price: 15.0, category: 'Widgets' },
  { id: '5', name: 'Gizmo E', sku: 'G-2002', qty: 5, price: 42.0, category: 'Gadgets' },
  { id: '6', name: 'Thingamajig F', sku: 'P-3002', qty: 120, price: 3.25, category: 'Parts' },
];

const ITEMS_COLUMNS: ColumnConfig[] = [
  { key: 'name', label: 'Name', width: '1.5fr' },
  { key: 'sku', label: 'SKU', width: '1fr' },
  { key: 'qty', label: 'Qty', width: 60, align: 'right' },
  { key: 'price', label: 'Price', width: 70, align: 'right', format: (v) => `$${Number(v).toFixed(2)}` },
  { key: 'category', label: 'Category', width: '1fr' },
];

const REPORT_SECTIONS = [
  { label: 'Total Items', value: '293' },
  { label: 'Total Value', value: '$4,230' },
  { label: 'Low Stock Items', value: '3' },
  { label: 'Top Category', value: 'Parts (73)' },
  { label: 'Avg Price', value: '$17.75' },
];

function renderWidget(widget: InlineWidget): ReactNode {
  switch (widget.type) {
    case 'data-table': {
      const p = widget.props as { items: Record<string, unknown>[]; columns: ColumnConfig[] };
      return <DataTable items={p.items} columns={p.columns} />;
    }
    case 'report-view': {
      const p = widget.props as { sections: Array<{ label: string; value: string }> };
      return <ReportView sections={p.sections} />;
    }
    default:
      return <div style={{ padding: 8, fontSize: 11 }}>Unknown widget: {widget.type}</div>;
  }
}

/* ═══════════════════════════════════════════════════════════════════════
   Card templates for "Create a card…"
   ═══════════════════════════════════════════════════════════════════════ */

const NOTES_CARD_CODE = `({ ui }) => ({
  render({ cardState }) {
    var notes = Array.isArray(cardState && cardState.items) ? cardState.items : [];
    var lines = notes.map(function(n) { return ui.text('\\u{1F4DD} ' + String(n)); });
    return ui.panel([
      ui.text('Notes (' + notes.length + ')'),
      ui.column(lines.length ? lines : [ui.text('No notes yet.')]),
      ui.button('\\u{1F3E0} Home', { onClick: { handler: 'goHome' } }),
    ]);
  },
  handlers: {
    goHome: function(ctx) { ctx.dispatchSystemCommand('nav.go', { cardId: 'home' }); },
  },
})`;

const CALC_CARD_CODE = `({ ui }) => ({
  render({ cardState }) {
    var val = Number(cardState && cardState.value) || 0;
    return ui.panel([
      ui.text('Calculator'),
      ui.text('Value: ' + val),
      ui.row([
        ui.button('+1', { onClick: { handler: 'inc' } }),
        ui.button('-1', { onClick: { handler: 'dec' } }),
        ui.button('Reset', { onClick: { handler: 'reset' } }),
      ]),
      ui.button('\\u{1F3E0} Home', { onClick: { handler: 'goHome' } }),
    ]);
  },
  handlers: {
    inc: function(ctx) { ctx.dispatchCardAction('patch', { value: (Number(ctx.cardState && ctx.cardState.value) || 0) + 1 }); },
    dec: function(ctx) { ctx.dispatchCardAction('patch', { value: (Number(ctx.cardState && ctx.cardState.value) || 0) - 1 }); },
    reset: function(ctx) { ctx.dispatchCardAction('patch', { value: 0 }); },
    goHome: function(ctx) { ctx.dispatchSystemCommand('nav.go', { cardId: 'home' }); },
  },
})`;

const TODO_CARD_CODE = `({ ui }) => ({
  render({ cardState }) {
    var items = Array.isArray(cardState && cardState.todos) ? cardState.todos : ['Buy groceries', 'Fix bug #42'];
    var lines = items.map(function(t, i) {
      return ui.row([
        ui.text('\\u{2610} ' + String(t)),
        ui.button('\\u{2715}', { onClick: { handler: 'remove', args: { index: i } } }),
      ]);
    });
    return ui.panel([
      ui.text('Todo List (' + items.length + ')'),
      ui.column(lines.length ? lines : [ui.text('All done! \\u{1F389}')]),
      ui.button('\\u{1F3E0} Home', { onClick: { handler: 'goHome' } }),
    ]);
  },
  handlers: {
    remove: function(ctx, args) {
      var todos = Array.isArray(ctx.cardState && ctx.cardState.todos) ? ctx.cardState.todos.slice() : [];
      var idx = Number(args && args.index);
      if (idx >= 0 && idx < todos.length) todos.splice(idx, 1);
      ctx.dispatchCardAction('patch', { todos: todos });
    },
    goHome: function(ctx) { ctx.dispatchSystemCommand('nav.go', { cardId: 'home' }); },
  },
})`;

interface CardTemplate {
  id: string;
  title: string;
  icon: string;
  code: string;
  description: string;
}

const CARD_TEMPLATES: CardTemplate[] = [
  { id: 'notes', title: 'Notes', icon: '📝', code: NOTES_CARD_CODE, description: 'A simple notes card' },
  { id: 'calculator', title: 'Calculator', icon: '🧮', code: CALC_CARD_CODE, description: 'A counter/calculator' },
  { id: 'todo', title: 'Todo List', icon: '✅', code: TODO_CARD_CODE, description: 'A todo list with remove' },
];

/* ═══════════════════════════════════════════════════════════════════════
   ChatWindow wired to the desktop
   ═══════════════════════════════════════════════════════════════════════ */

let windowCounter = 100;
function nextWindowId(prefix: string) {
  windowCounter += 1;
  return `window:${prefix}:${windowCounter}`;
}

function DesktopChatWindow({ stack }: { stack: CardStackDefinition }) {
  const dispatch = useDispatch();
  const [messages, setMessages] = useState<ChatWindowMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [createdCards, setCreatedCards] = useState<string[]>([]);

  const sessionCounterRef = useRef(200);
  function nextSessionId() {
    sessionCounterRef.current += 1;
    return `chat-session-${sessionCounterRef.current}`;
  }

  const openCardWindow = useCallback(
    (cardId: string) => {
      const cardDef = stack.cards[cardId];
      if (!cardDef) {
        setMessages((prev) => [
          ...prev,
          { id: `sys-${Date.now()}`, role: 'system', text: `Card "${cardId}" not found.`, status: 'complete' },
        ]);
        return;
      }
      const sid = nextSessionId();
      dispatch(
        openWindow({
          id: nextWindowId(cardId),
          title: cardDef.title ?? cardId,
          icon: cardDef.icon,
          bounds: {
            x: 200 + (sessionCounterRef.current % 5) * 30,
            y: 30 + (sessionCounterRef.current % 4) * 25,
            w: 400,
            h: 320,
          },
          content: {
            kind: 'card',
            card: { stackId: stack.id, cardId, cardSessionId: sid },
          },
        }),
      );
    },
    [dispatch, stack],
  );

  const handleAction = useCallback(
    (action: unknown) => {
      if (typeof action !== 'string') return;

      const cardActions: Record<string, string> = {
        'open-browse': 'browse',
        'open-report': 'report',
        'open-settings': 'settings',
        'open-home': 'home',
      };

      if (action in cardActions) {
        openCardWindow(cardActions[action]);
        return;
      }

      if (action.startsWith('open-created:')) {
        openCardWindow(action.replace('open-created:', ''));
        return;
      }

      if (action.startsWith('create-card:')) {
        const templateId = action.replace('create-card:', '');
        const template = CARD_TEMPLATES.find((t) => t.id === templateId);
        if (!template) return;

        // 1) Register the card in the stack definition
        stack.cards[template.id] = {
          id: template.id,
          type: 'plugin',
          title: template.title,
          icon: template.icon,
          ui: { t: 'text', value: `Plugin card: ${template.id}` },
        };

        // 2) Append defineCard() call to the bundle so new VM sessions include it
        const defineCall = `\nglobalThis.__stackHost.defineCard(${JSON.stringify(template.id)}, (${template.code}));\n`;
        stack.plugin.bundleCode += defineCall;

        setCreatedCards((prev) => [...prev, template.id]);
        setMessages((prev) => [
          ...prev,
          { id: `sys-${Date.now()}`, role: 'system', text: `✅ Card "${template.title}" created.`, status: 'complete' },
          {
            id: `ai-${Date.now()}`,
            role: 'ai',
            text: `I've created the ${template.icon} ${template.title} card. Open it below or find it on the desktop.`,
            status: 'complete',
            actions: [{ label: `${template.icon} Open ${template.title}`, action: `open-created:${template.id}` }],
          },
        ]);
        return;
      }

      if (action === 'prompt-create') {
        handleSend('create a card');
        return;
      }

      setMessages((prev) => [
        ...prev,
        { id: `sys-${Date.now()}`, role: 'system', text: `Action: ${action}`, status: 'complete' },
      ]);
    },
    [openCardWindow, stack],
  );

  const handleSend = useCallback(
    (text: string) => {
      if (isStreaming) return;

      const userMsg: ChatWindowMessage = {
        id: `u-${Date.now()}`, role: 'user', text, status: 'complete',
      };
      setMessages((prev) => [...prev, userMsg]);
      setIsStreaming(true);

      setTimeout(() => {
        const lower = text.toLowerCase();
        let aiMsg: ChatWindowMessage;

        if (lower.includes('browse') || lower.includes('items') || lower.includes('inventory')) {
          aiMsg = {
            id: `ai-${Date.now()}`, role: 'ai', text: '', status: 'complete',
            content: [
              { kind: 'text', text: 'Here are the current inventory items:' },
              {
                kind: 'widget',
                widget: {
                  id: `items-${Date.now()}`, type: 'data-table', label: 'Inventory',
                  props: { items: ITEMS_DATA, columns: ITEMS_COLUMNS },
                },
              },
              { kind: 'text', text: 'Click below to open the full Browse window.' },
            ],
            actions: [
              { label: '📋 Open Browse', action: 'open-browse' },
              { label: '📊 Open Reports', action: 'open-report' },
            ],
          };
        } else if (lower.includes('report') || lower.includes('summary') || lower.includes('stats')) {
          aiMsg = {
            id: `ai-${Date.now()}`, role: 'ai', text: '', status: 'complete',
            content: [
              { kind: 'text', text: "Here's the inventory summary:" },
              {
                kind: 'widget',
                widget: {
                  id: `report-${Date.now()}`, type: 'report-view', label: 'Inventory Summary',
                  props: { sections: REPORT_SECTIONS },
                },
              },
            ],
            actions: [{ label: '📊 Open Full Report', action: 'open-report' }],
          };
        } else if (lower.includes('create') || lower.includes('new card') || lower.includes('add card')) {
          const available = CARD_TEMPLATES.filter((t) => !createdCards.includes(t.id));
          if (available.length > 0) {
            aiMsg = {
              id: `ai-${Date.now()}`, role: 'ai',
              text: "Pick a template and I'll create it on the desktop:",
              status: 'complete',
              actions: available.map((t) => ({
                label: `${t.icon} Create ${t.title}`, action: `create-card:${t.id}`,
              })),
            };
          } else {
            aiMsg = {
              id: `ai-${Date.now()}`, role: 'ai',
              text: "All templates created! Open them below:",
              status: 'complete',
              actions: createdCards.map((id) => {
                const t = CARD_TEMPLATES.find((t) => t.id === id);
                return { label: `${t?.icon} Open ${t?.title}`, action: `open-created:${id}` };
              }),
            };
          }
        } else if (lower.includes('settings')) {
          aiMsg = {
            id: `ai-${Date.now()}`, role: 'ai',
            text: 'Opening the Settings card for you.',
            status: 'complete',
            actions: [{ label: '⚙️ Open Settings', action: 'open-settings' }],
          };
        } else if (lower.includes('help')) {
          aiMsg = {
            id: `ai-${Date.now()}`, role: 'ai',
            text: "I can:\n\n• Show items — inline table\n• Show reports — inline report\n• Open windows on the desktop\n• Create new cards on the fly\n\nTry the suggestions or type a question!",
            status: 'complete',
            actions: [
              { label: '📋 Browse', action: 'open-browse' },
              { label: '📊 Reports', action: 'open-report' },
              { label: '✨ Create a card…', action: 'prompt-create' },
            ],
          };
        } else if (lower.includes('hello') || lower.includes('hi')) {
          aiMsg = {
            id: `ai-${Date.now()}`, role: 'ai',
            text: "Hello! I'm your desktop assistant. I can show data, open windows, and create new cards. Try \"help\"!",
            status: 'complete',
          };
        } else {
          aiMsg = {
            id: `ai-${Date.now()}`, role: 'ai',
            text: `Try: "show items", "show report", "create a card", or "help"`,
            status: 'complete',
            actions: [
              { label: '📋 Browse', action: 'open-browse' },
              { label: '✨ Create a card…', action: 'prompt-create' },
            ],
          };
        }

        setMessages((prev) => [...prev, aiMsg]);
        setIsStreaming(false);
      }, 500);
    },
    [isStreaming, createdCards],
  );

  return (
    <ChatWindow
      messages={messages}
      isStreaming={isStreaming}
      onSend={handleSend}
      onCancel={() => setIsStreaming(false)}
      onAction={handleAction}
      suggestions={['Show me the inventory', 'Give me a report', 'Create a card…', 'Help']}
      title="Assistant"
      placeholder="Ask about items, reports, or create new cards…"
      renderWidget={renderWidget}
      footer={<span>Actions open desktop windows · "Create a card" injects plugin code</span>}
    />
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   Full demo: DesktopShell with ChatWindow inside a desktop window
   ═══════════════════════════════════════════════════════════════════════ */

function ChatDesktopDemo() {
  const stackRef = useRef<CardStackDefinition>({ ...STACK, cards: { ...STACK.cards } });
  const { createStore } = createAppStore({});
  const storeRef = useRef<ReturnType<typeof createStore> | null>(null);
  if (!storeRef.current) {
    storeRef.current = createStore();

    // Pre-open the chat window on the desktop
    storeRef.current.dispatch(
      openWindow({
        id: 'window:chat-assistant',
        title: '💬 Assistant',
        icon: '💬',
        bounds: { x: 360, y: 20, w: 460, h: 420 },
        content: { kind: 'app', appKey: 'chat-window' },
        dedupeKey: 'chat-window',
      }),
    );
  }

  const renderAppWindow = useCallback(
    (appKey: string, _windowId: string): ReactNode => {
      if (appKey === 'chat-window') {
        return <DesktopChatWindow stack={stackRef.current} />;
      }
      return null;
    },
    [],
  );

  return (
    <Provider store={storeRef.current}>
      <DesktopShell
        stack={stackRef.current}
        icons={ICONS}
        renderAppWindow={renderAppWindow}
      />
    </Provider>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   Meta + Stories
   ═══════════════════════════════════════════════════════════════════════ */

const meta = {
  title: 'Shell/Windowing/Chat Desktop',
  parameters: { layout: 'fullscreen' },
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => <ChatDesktopDemo />,
};
