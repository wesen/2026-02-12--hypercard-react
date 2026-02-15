import type { Activity, Company, Contact, Deal } from './types';

interface PluginUiNode {
  kind: string;
  text?: string;
  props?: Record<string, unknown>;
  children?: PluginUiNode[];
}

interface PluginUiFactory {
  text(content: unknown): PluginUiNode;
  button(label: unknown, props?: Record<string, unknown>): PluginUiNode;
  input(value: unknown, props?: Record<string, unknown>): PluginUiNode;
  row(children?: PluginUiNode[]): PluginUiNode;
  column(children?: PluginUiNode[]): PluginUiNode;
  panel(children?: PluginUiNode[]): PluginUiNode;
  badge(text: unknown): PluginUiNode;
  table(rows?: unknown[], props?: Record<string, unknown>): PluginUiNode;
}

interface CrmPluginGlobalState {
  domains?: {
    contacts?: {
      items?: Contact[];
      [key: string]: unknown;
    };
    companies?: {
      items?: Company[];
      [key: string]: unknown;
    };
    deals?: {
      items?: Deal[];
      [key: string]: unknown;
    };
    activities?: {
      items?: Activity[];
      [key: string]: unknown;
    };
    [key: string]: unknown;
  };
  nav?: {
    cardId?: string;
    param?: unknown;
    [key: string]: unknown;
  };
  self?: Record<string, unknown>;
  system?: Record<string, unknown>;
  [key: string]: unknown;
}

type PluginCardState = Record<string, unknown>;
type PluginSessionState = Record<string, unknown>;

interface PluginRenderContext {
  cardState: PluginCardState;
  sessionState: PluginSessionState;
  globalState: CrmPluginGlobalState;
}

interface PluginHandlerContext extends PluginRenderContext {
  dispatchCardAction(actionType: string, payload?: unknown): void;
  dispatchSessionAction(actionType: string, payload?: unknown): void;
  dispatchDomainAction(domain: string, actionType: string, payload?: unknown): void;
  dispatchSystemCommand(command: string, payload?: unknown): void;
}

interface PluginCardDef {
  render(context: PluginRenderContext): PluginUiNode;
  handlers?: Record<string, (context: PluginHandlerContext, args?: unknown) => void>;
}

interface PluginBundle {
  id: string;
  title: string;
  description?: string;
  initialSessionState?: PluginSessionState;
  initialCardState?: Record<string, PluginCardState>;
  cards: Record<string, PluginCardDef>;
}

declare global {
  function defineStackBundle(factory: (args: { ui: PluginUiFactory }) => PluginBundle): void;
}

export {};
