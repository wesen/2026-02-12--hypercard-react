export interface PluginRuntimeStackConfig {
  bundleCode: string;
  capabilities?: {
    domain?: 'all' | string[];
    system?: 'all' | string[];
  };
}

export interface CardDefinition {
  id: string;
  type: string;
  title?: string;
  icon?: string;
  ui: Record<string, unknown>;
  meta?: Record<string, unknown>;
}

export interface CardStackDefinition {
  id: string;
  name: string;
  icon: string;
  homeCard: string;
  plugin: PluginRuntimeStackConfig;
  cards: Record<string, CardDefinition>;
}
