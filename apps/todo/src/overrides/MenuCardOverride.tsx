import type { CardDefinition, DSLAction, MenuCardDef } from '@hypercard/engine';
import { MenuGrid } from '@hypercard/engine';
import type { CardRendererContext } from '@hypercard/engine';

export function renderMenuCard(cardDef: CardDefinition, ctx: CardRendererContext) {
  const def = cardDef as MenuCardDef;
  return (
    <MenuGrid
      icon={def.icon}
      labels={def.fields?.map((f) => ({ value: f.value ?? '', style: f.style }))}
      buttons={(def.buttons ?? []).map((b) => ({
        label: b.label,
        action: b.action as unknown,
        variant: b.style === 'primary' ? 'primary' as const : b.style === 'danger' ? 'danger' as const : 'default' as const,
      }))}
      onAction={(action) => ctx.dispatch(action as DSLAction)}
    />
  );
}
