import { RICH_PARTS } from '../parts';

export interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  count?: number;
  className?: string;
}

export function SearchBar({
  value,
  onChange,
  placeholder = 'Search…',
  count,
  className,
}: SearchBarProps) {
  return (
    <div data-part={RICH_PARTS.widgetSearchBar} className={className}>
      <span data-part={RICH_PARTS.widgetSearchIcon}>🔍</span>
      <input
        data-part={RICH_PARTS.widgetSearchInput}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
      {count !== undefined && (
        <span data-part={RICH_PARTS.widgetSearchCount}>{count} results</span>
      )}
    </div>
  );
}
