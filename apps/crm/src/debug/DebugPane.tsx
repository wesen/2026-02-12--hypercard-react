import { useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RuntimeDebugPane } from '@hypercard/engine';
import {
  clearEvents,
  selectDebugKinds,
  selectDebugState,
  selectEvent,
  selectFilteredDebugEvents,
  selectSelectedDebugEvent,
  setKindFilter,
  setTextFilter,
  toggleCollapsed,
} from './debugSlice';
import type { RootState } from '../app/store';

export function DebugPane() {
  const dispatch = useDispatch();
  const debug = useSelector(selectDebugState);
  const kinds = useSelector(selectDebugKinds);
  const filteredEvents = useSelector(selectFilteredDebugEvents);
  const selected = useSelector(selectSelectedDebugEvent);

  const snapshot = useSelector((state: RootState) => ({
    navigation: state.navigation,
    contacts: state.contacts,
    companies: state.companies,
    deals: state.deals,
    activities: state.activities,
    runtime: state.hypercardRuntime,
  }));

  const stats = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const event of debug.events) {
      counts[event.kind] = (counts[event.kind] ?? 0) + 1;
    }
    return counts;
  }, [debug.events]);

  return (
    <RuntimeDebugPane
      title="CRM Debug"
      collapsed={debug.collapsed}
      events={debug.events}
      filteredEvents={filteredEvents}
      selectedEvent={selected}
      kinds={kinds}
      kindFilter={debug.filters.kind}
      textFilter={debug.filters.text}
      snapshot={snapshot}
      stats={stats}
      onToggleCollapsed={() => dispatch(toggleCollapsed())}
      onClear={() => dispatch(clearEvents())}
      onSelectEvent={(id) => dispatch(selectEvent(id))}
      onKindFilterChange={(kind) => dispatch(setKindFilter(kind))}
      onTextFilterChange={(text) => dispatch(setTextFilter(text))}
    />
  );
}
