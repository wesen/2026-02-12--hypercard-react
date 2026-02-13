import { Btn } from '../widgets/Btn';

export interface NavBarProps {
  currentCard: string;
  cardTitle?: string;
  cardIcon?: string;
  navDepth: number;
  onBack: () => void;
  onGo: (card: string) => void;
  shortcuts?: Array<{ card: string; icon: string }>;
}

export function NavBar({ currentCard, cardTitle, cardIcon, navDepth, onBack, onGo, shortcuts }: NavBarProps) {
  return (
    <div data-part="nav-bar">
      {navDepth > 1 && <Btn onClick={onBack}>⬅</Btn>}
      {shortcuts?.map((s) => (
        <Btn key={s.card} active={currentCard === s.card} onClick={() => onGo(s.card)}>
          {s.icon}
        </Btn>
      ))}
      {(cardTitle || cardIcon) && (
        <span style={{ marginLeft: 'auto', fontSize: 10, opacity: 0.6 }}>
          {cardIcon ? `${cardIcon} ` : ''}
          {cardTitle}
        </span>
      )}
    </div>
  );
}
