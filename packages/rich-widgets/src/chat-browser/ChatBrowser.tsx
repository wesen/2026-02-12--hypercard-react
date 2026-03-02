import { useState, useMemo } from 'react';
import { Btn, Checkbox } from '@hypercard/engine';
import { RICH_PARTS } from '../parts';
import { WidgetStatusBar } from '../primitives/WidgetStatusBar';
import { WidgetToolbar } from '../primitives/WidgetToolbar';
import type { Conversation, SearchParams } from './types';
import { EMPTY_SEARCH } from './types';
import { CONVERSATIONS, getAllTags, getAllModels } from './sampleData';

// ── Props ────────────────────────────────────────────────────────────
export interface ChatBrowserProps {
  /** Conversations to browse */
  conversations?: Conversation[];
}

// ── Sub-components ───────────────────────────────────────────────────

function ConvoRow({
  convo,
  selected,
  even,
  onSelect,
}: {
  convo: Conversation;
  selected: boolean;
  even: boolean;
  onSelect: () => void;
}) {
  return (
    <div
      data-part={RICH_PARTS.cbConvoRow}
      data-selected={selected || undefined}
      data-even={even || undefined}
      onClick={onSelect}
    >
      <div data-part={RICH_PARTS.cbConvoRowTop}>
        <span data-part={RICH_PARTS.cbConvoTitle}>
          {'\uD83D\uDCAC'} {convo.title}
        </span>
        <span data-part={RICH_PARTS.cbConvoMsgCount}>{convo.messages.length} msgs</span>
      </div>
      <div data-part={RICH_PARTS.cbConvoRowMeta}>
        <span>{'\uD83E\uDD16'} {convo.model}</span>
        <span>{'\uD83D\uDCC5'} {convo.date}</span>
      </div>
      <div data-part={RICH_PARTS.cbConvoTags}>
        {convo.tags.map((t) => (
          <span key={t} data-part={RICH_PARTS.cbTag}>{t}</span>
        ))}
      </div>
    </div>
  );
}

function MessageBubble({
  message,
  model,
}: {
  message: { role: 'user' | 'assistant'; text: string };
  model: string;
}) {
  return (
    <div
      data-part={RICH_PARTS.cbMessage}
      data-role={message.role}
    >
      <div data-part={RICH_PARTS.cbMessageHeader}>
        <span data-part={RICH_PARTS.cbMessageIcon}>
          {message.role === 'user' ? '\uD83D\uDC64' : '\uD83E\uDD16'}
        </span>
        {message.role === 'user' ? 'You' : model}
      </div>
      <div data-part={RICH_PARTS.cbMessageText}>{message.text}</div>
    </div>
  );
}

function SearchPanel({
  params,
  allTags,
  allModels,
  onChange,
  onSearch,
  onClear,
  onClose,
}: {
  params: SearchParams;
  allTags: string[];
  allModels: string[];
  onChange: (p: SearchParams) => void;
  onSearch: () => void;
  onClear: () => void;
  onClose: () => void;
}) {
  const toggleTag = (tag: string) => {
    onChange({
      ...params,
      tags: params.tags.includes(tag)
        ? params.tags.filter((t) => t !== tag)
        : [...params.tags, tag],
    });
  };

  return (
    <div data-part={RICH_PARTS.cbSearchPanel}>
      <div data-part={RICH_PARTS.cbSearchSection}>
        <div data-part={RICH_PARTS.cbSearchLabel}>Search Text:</div>
        <input
          data-part="field-input"
          value={params.text}
          onChange={(e) => onChange({ ...params, text: e.target.value })}
          placeholder="Enter search terms..."
          onKeyDown={(e) => e.key === 'Enter' && onSearch()}
        />
      </div>

      <div data-part={RICH_PARTS.cbSearchScope}>
        <Checkbox
          label="In titles"
          checked={params.inTitles}
          onChange={() => onChange({ ...params, inTitles: !params.inTitles })}
        />
        <Checkbox
          label="In messages"
          checked={params.inMessages}
          onChange={() => onChange({ ...params, inMessages: !params.inMessages })}
        />
      </div>

      <div data-part={RICH_PARTS.cbSearchSection}>
        <div data-part={RICH_PARTS.cbSearchLabel}>Model:</div>
        <div data-part={RICH_PARTS.cbModelFilter}>
          <Btn
            active={!params.model}
            onClick={() => onChange({ ...params, model: '' })}
          >All</Btn>
          {allModels.map((m) => (
            <Btn
              key={m}
              active={params.model === m}
              onClick={() => onChange({ ...params, model: m })}
            >{m}</Btn>
          ))}
        </div>
      </div>

      <div data-part={RICH_PARTS.cbSearchSection}>
        <div data-part={RICH_PARTS.cbSearchLabel}>Tags:</div>
        <div data-part={RICH_PARTS.cbTagFilter}>
          {allTags.map((t) => (
            <span
              key={t}
              data-part={RICH_PARTS.cbFilterTag}
              data-active={params.tags.includes(t) || undefined}
              onClick={() => toggleTag(t)}
            >
              {t}
            </span>
          ))}
        </div>
      </div>

      <div data-part={RICH_PARTS.cbSearchSection}>
        <div data-part={RICH_PARTS.cbSearchLabel}>Date Range:</div>
        <div data-part={RICH_PARTS.cbDateRange}>
          <input
            data-part="field-input"
            type="date"
            value={params.dateFrom}
            onChange={(e) => onChange({ ...params, dateFrom: e.target.value })}
          />
          <span>to</span>
          <input
            data-part="field-input"
            type="date"
            value={params.dateTo}
            onChange={(e) => onChange({ ...params, dateTo: e.target.value })}
          />
        </div>
      </div>

      <div data-part={RICH_PARTS.cbSearchActions}>
        <Btn onClick={() => { onClear(); onClose(); }}>Clear</Btn>
        <Btn onClick={onClose}>Cancel</Btn>
        <Btn onClick={onSearch}>{'\uD83D\uDD0D'} Search</Btn>
      </div>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────
export function ChatBrowser({
  conversations: initialConversations = CONVERSATIONS,
}: ChatBrowserProps = {}) {
  const [selectedConvo, setSelectedConvo] = useState<Conversation | null>(null);
  const [quickFilter, setQuickFilter] = useState('');
  const [searchParams, setSearchParams] = useState<SearchParams>({ ...EMPTY_SEARCH });
  const [searchResults, setSearchResults] = useState<Conversation[] | null>(null);
  const [showSearch, setShowSearch] = useState(false);

  const allTags = useMemo(() => getAllTags(initialConversations), [initialConversations]);
  const allModels = useMemo(() => getAllModels(initialConversations), [initialConversations]);

  const displayedConvos = useMemo(() => {
    let list = searchResults ?? initialConversations;
    if (quickFilter) {
      const q = quickFilter.toLowerCase();
      list = list.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.tags.some((t) => t.toLowerCase().includes(q)) ||
          c.model.toLowerCase().includes(q),
      );
    }
    return list;
  }, [searchResults, quickFilter, initialConversations]);

  const runSearch = () => {
    const { text, model, tags, dateFrom, dateTo, inMessages, inTitles } = searchParams;
    let results = [...initialConversations];
    if (text) {
      const q = text.toLowerCase();
      results = results.filter((c) => {
        const titleMatch = inTitles && c.title.toLowerCase().includes(q);
        const msgMatch = inMessages && c.messages.some((m) => m.text.toLowerCase().includes(q));
        return titleMatch || msgMatch;
      });
    }
    if (model) results = results.filter((c) => c.model === model);
    if (tags.length) results = results.filter((c) => tags.some((t) => c.tags.includes(t)));
    if (dateFrom) results = results.filter((c) => c.date >= dateFrom);
    if (dateTo) results = results.filter((c) => c.date <= dateTo);
    setSearchResults(results);
    setShowSearch(false);
  };

  const clearSearch = () => {
    setSearchResults(null);
    setSearchParams({ ...EMPTY_SEARCH });
  };

  return (
    <div data-part={RICH_PARTS.chatBrowser}>
      {/* Sidebar: conversation list */}
      <div data-part={RICH_PARTS.cbSidebar}>
        {/* Toolbar */}
        <WidgetToolbar>
          <input
            data-part="field-input"
            placeholder="Quick filter..."
            value={quickFilter}
            onChange={(e) => setQuickFilter(e.target.value)}
            style={{ flex: 1 }}
          />
          <Btn onClick={() => setShowSearch(!showSearch)}>{'\uD83D\uDD0D'}</Btn>
          {searchResults && (
            <Btn onClick={clearSearch}>{'\u2715'}</Btn>
          )}
        </WidgetToolbar>

        {/* List */}
        <div data-part={RICH_PARTS.cbConvoList}>
          {displayedConvos.length === 0 && (
            <div data-part={RICH_PARTS.cbEmptyState}>No conversations found.</div>
          )}
          {displayedConvos.map((c, i) => (
            <ConvoRow
              key={c.id}
              convo={c}
              selected={selectedConvo?.id === c.id}
              even={i % 2 === 0}
              onSelect={() => setSelectedConvo(c)}
            />
          ))}
        </div>

        {/* Status */}
        <WidgetStatusBar>
          <span>{displayedConvos.length} conversations</span>
          <span>{searchResults ? '\uD83D\uDD0D Filtered' : '\uD83D\uDCC2 All'}</span>
        </WidgetStatusBar>
      </div>

      {/* Main: viewer or search */}
      <div data-part={RICH_PARTS.cbMain}>
        {showSearch ? (
          <SearchPanel
            params={searchParams}
            allTags={allTags}
            allModels={allModels}
            onChange={setSearchParams}
            onSearch={runSearch}
            onClear={clearSearch}
            onClose={() => setShowSearch(false)}
          />
        ) : !selectedConvo ? (
          <div data-part={RICH_PARTS.cbEmptyState}>
            <div style={{ fontSize: 32 }}>{'\uD83D\uDDC4\uFE0F'}</div>
            <div style={{ fontWeight: 'bold', marginBottom: 8 }}>No Conversation Selected</div>
            <div>Select a conversation from the list to view it here.</div>
          </div>
        ) : (
          <>
            {/* Conversation header */}
            <div data-part={RICH_PARTS.cbViewerHeader}>
              <div data-part={RICH_PARTS.cbViewerTitle}>{selectedConvo.title}</div>
              <div data-part={RICH_PARTS.cbViewerMeta}>
                <span>{'\uD83E\uDD16'} Model: {selectedConvo.model}</span>
                <span>{'\uD83D\uDCC5'} {selectedConvo.date}</span>
                <span>{'\uD83D\uDCAC'} {selectedConvo.messages.length} messages</span>
              </div>
              <div data-part={RICH_PARTS.cbViewerTags}>
                {selectedConvo.tags.map((t) => (
                  <span key={t} data-part={RICH_PARTS.cbTag}>{t}</span>
                ))}
              </div>
            </div>

            {/* Messages */}
            <div data-part={RICH_PARTS.cbMessages}>
              {selectedConvo.messages.map((m, i) => (
                <MessageBubble key={i} message={m} model={selectedConvo.model} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
