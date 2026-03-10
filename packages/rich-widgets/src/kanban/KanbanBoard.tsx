import {
  useContext,
  useEffect,
  useReducer,
  useCallback,
} from 'react';
import { ReactReduxContext, useDispatch, useSelector } from 'react-redux';
import { INITIAL_COLUMNS, INITIAL_TASKS } from './sampleData';
import {
  createKanbanStateSeed,
  KANBAN_STATE_KEY,
  kanbanActions,
  kanbanReducer,
  selectKanbanState,
  type KanbanAction,
  type KanbanState,
} from './kanbanState';
import type { Column, Priority, TagId, Task } from './types';
import { KanbanBoardView } from './KanbanBoardView';

// ── Props ────────────────────────────────────────────────────────────
export interface KanbanBoardProps {
  initialTasks?: Task[];
  initialColumns?: Column[];
  initialEditingTask?: Partial<Task> | null;
  initialFilterTag?: TagId | null;
  initialFilterPriority?: Priority | null;
  initialSearchQuery?: string;
  initialCollapsedCols?: Record<string, boolean>;
}

function createInitialSeed(props: KanbanBoardProps) {
  return createKanbanStateSeed({
    initialTasks: props.initialTasks ?? INITIAL_TASKS,
    initialColumns: props.initialColumns ?? INITIAL_COLUMNS,
    editingTask: props.initialEditingTask,
    filterTag: props.initialFilterTag,
    filterPriority: props.initialFilterPriority,
    searchQuery: props.initialSearchQuery,
    collapsedCols: props.initialCollapsedCols,
  });
}

export function KanbanBoardFrame({
  state,
  dispatch,
}: {
  state: KanbanState;
  dispatch: (action: KanbanAction) => void;
}) {
  return (
    <KanbanBoardView
      state={state}
      onOpenTaskEditor={(task) => dispatch(kanbanActions.setEditingTask(task))}
      onCloseTaskEditor={() => dispatch(kanbanActions.setEditingTask(null))}
      onSaveTask={(task: Task) => dispatch(kanbanActions.upsertTask(task))}
      onDeleteTask={(id) => dispatch(kanbanActions.deleteTask(id))}
      onMoveTask={(payload) => dispatch(kanbanActions.moveTask(payload))}
      onSearchChange={(value) => dispatch(kanbanActions.setSearchQuery(value))}
      onSetFilterTag={(tag) => dispatch(kanbanActions.setFilterTag(tag))}
      onSetFilterPriority={(priority) => dispatch(kanbanActions.setFilterPriority(priority))}
      onClearFilters={() => dispatch(kanbanActions.clearFilters())}
      onToggleCollapsed={(columnId) => dispatch(kanbanActions.toggleCollapsed(columnId))}
    />
  );
}

function StandaloneKanbanBoard(props: KanbanBoardProps) {
  const [state, dispatch] = useReducer(kanbanReducer, createInitialSeed(props));

  return <KanbanBoardFrame state={state} dispatch={dispatch} />;
}

function ConnectedKanbanBoard(props: KanbanBoardProps) {
  const reduxDispatch = useDispatch();
  const state = useSelector(selectKanbanState);

  useEffect(() => {
    reduxDispatch(kanbanActions.initializeIfNeeded(createInitialSeed(props)));
  }, [
    props.initialCollapsedCols,
    props.initialColumns,
    props.initialEditingTask,
    props.initialFilterPriority,
    props.initialFilterTag,
    props.initialSearchQuery,
    props.initialTasks,
    reduxDispatch,
  ]);

  const effectiveState = state.initialized ? state : createInitialSeed(props);

  const dispatch = useCallback((action: KanbanAction) => {
    reduxDispatch(action);
  }, [reduxDispatch]);

  return <KanbanBoardFrame state={effectiveState} dispatch={dispatch} />;
}

// ── Component ────────────────────────────────────────────────────────
export function KanbanBoard(props: KanbanBoardProps) {
  const reduxContext = useContext(ReactReduxContext);
  const store = reduxContext?.store;
  const rootState = store?.getState();
  const hasRegisteredSlice =
    typeof rootState === 'object' &&
    rootState !== null &&
    KANBAN_STATE_KEY in (rootState as Record<string, unknown>);

  if (hasRegisteredSlice) {
    return <ConnectedKanbanBoard {...props} />;
  }

  return <StandaloneKanbanBoard {...props} />;
}
