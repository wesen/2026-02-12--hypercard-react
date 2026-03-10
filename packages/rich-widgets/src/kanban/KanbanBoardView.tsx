import { useCallback, useMemo, useState, type DragEvent } from 'react';
import { Btn } from '@hypercard/engine';
import { WidgetToolbar } from '../primitives/WidgetToolbar';
import { Separator } from '../primitives/Separator';
import { WidgetStatusBar } from '../primitives/WidgetStatusBar';
import { RICH_PARTS as P } from '../parts';
import { ALL_PRIORITIES, ALL_TAGS, PRIORITY_LABELS, TAG_LABELS, type Priority, type TagId, type Task } from './types';
import { KanbanTaskCard } from './KanbanTaskCard';
import { KanbanTaskModal } from './KanbanTaskModal';
import type { KanbanState } from './kanbanState';

function filterTasks(tasks: Task[], filterTag: TagId | null, filterPriority: Priority | null, searchQuery: string) {
  const normalizedQuery = searchQuery.toLowerCase();
  return tasks.filter((task) => {
    if (filterTag && !task.tags.includes(filterTag)) {
      return false;
    }
    if (filterPriority && task.priority !== filterPriority) {
      return false;
    }
    if (
      normalizedQuery &&
      !task.title.toLowerCase().includes(normalizedQuery) &&
      !task.desc.toLowerCase().includes(normalizedQuery)
    ) {
      return false;
    }
    return true;
  });
}

export interface KanbanBoardViewProps {
  state: KanbanState;
  onOpenTaskEditor: (task: Partial<Task>) => void;
  onCloseTaskEditor: () => void;
  onSaveTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
  onMoveTask: (payload: { id: string; col: string }) => void;
  onSearchChange: (value: string) => void;
  onSetFilterTag: (tag: TagId | null) => void;
  onSetFilterPriority: (priority: Priority | null) => void;
  onClearFilters: () => void;
  onToggleCollapsed: (columnId: string) => void;
  defaultNewColumnId?: string;
  emptyColumnMessage?: string;
  dropHintMessage?: string;
}

export function KanbanBoardView({
  state,
  onOpenTaskEditor,
  onCloseTaskEditor,
  onSaveTask,
  onDeleteTask,
  onMoveTask,
  onSearchChange,
  onSetFilterTag,
  onSetFilterPriority,
  onClearFilters,
  onToggleCollapsed,
  defaultNewColumnId,
  emptyColumnMessage = 'No tasks',
  dropHintMessage = 'Drop here',
}: KanbanBoardViewProps) {
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);
  const {
    tasks,
    columns,
    editingTask,
    filterTag,
    filterPriority,
    searchQuery,
    collapsedCols,
  } = state;

  const createTaskSeed = useCallback(
    (columnId?: string) => ({ col: columnId ?? defaultNewColumnId ?? columns[0]?.id ?? 'todo' }),
    [columns, defaultNewColumnId],
  );

  const filteredTasks = useMemo(
    () => filterTasks(tasks, filterTag, filterPriority, searchQuery),
    [tasks, filterTag, filterPriority, searchQuery],
  );

  const tasksByCol = useMemo(() => {
    const grouped: Record<string, Task[]> = {};
    for (const column of columns) {
      grouped[column.id] = [];
    }
    for (const task of filteredTasks) {
      if (grouped[task.col]) {
        grouped[task.col].push(task);
      }
    }
    return grouped;
  }, [columns, filteredTasks]);

  const totalByCol = useMemo(() => {
    const grouped: Record<string, number> = {};
    for (const column of columns) {
      grouped[column.id] = tasks.filter((task) => task.col === column.id).length;
    }
    return grouped;
  }, [columns, tasks]);

  const handleDrop = useCallback((columnId: string, event: DragEvent) => {
    event.preventDefault();
    const taskId = event.dataTransfer.getData('text/plain');
    if (taskId) {
      onMoveTask({ id: taskId, col: columnId });
    }
    setDragOverCol(null);
  }, [onMoveTask]);

  const hasFilters = Boolean(filterTag || filterPriority || searchQuery);

  return (
    <div data-part={P.kb}>
      <WidgetToolbar>
        <Btn
          onClick={() => onOpenTaskEditor(createTaskSeed())}
          style={{ fontSize: 10, fontWeight: 'bold' }}
        >
          + New
        </Btn>

        <Separator />

        <input
          data-part="field-input"
          value={searchQuery}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search..."
          style={{ width: 120 }}
        />

        <Separator />

        {ALL_TAGS.map((tag) => (
          <Btn
            key={tag}
            onClick={() => onSetFilterTag(filterTag === tag ? null : tag)}
            data-state={filterTag === tag ? 'active' : undefined}
            style={{ fontSize: 9, padding: '1px 5px' }}
          >
            {TAG_LABELS[tag]}
          </Btn>
        ))}

        <Separator />

        {ALL_PRIORITIES.map((priority) => (
          <Btn
            key={priority}
            onClick={() => onSetFilterPriority(filterPriority === priority ? null : priority)}
            data-state={filterPriority === priority ? 'active' : undefined}
            style={{ fontSize: 9, padding: '1px 5px' }}
          >
            {PRIORITY_LABELS[priority]}
          </Btn>
        ))}

        {hasFilters && (
          <Btn onClick={onClearFilters} style={{ fontSize: 9 }}>
            ✕ Clear
          </Btn>
        )}
      </WidgetToolbar>

      <div data-part={P.kbBoard}>
        {columns.map((column) => {
          const colTasks = tasksByCol[column.id] || [];
          const total = totalByCol[column.id];
          const isOver = dragOverCol === column.id;
          const collapsed = collapsedCols[column.id];

          return (
            <div
              key={column.id}
              data-part={P.kbColumn}
              data-state={collapsed ? 'collapsed' : isOver ? 'drag-over' : undefined}
              onDragOver={(event) => {
                event.preventDefault();
                setDragOverCol(column.id);
              }}
              onDragLeave={() => setDragOverCol(null)}
              onDrop={(event) => handleDrop(column.id, event)}
            >
              <div
                data-part={P.kbColumnHeader}
                onClick={() => onToggleCollapsed(column.id)}
              >
                <span>
                  {column.icon} {column.title}
                </span>
                {!collapsed && (
                  <span data-part={P.kbColumnCount}>
                    {colTasks.length}
                    {colTasks.length !== total ? `/${total}` : ''}
                    <span
                      onClick={(event) => {
                        event.stopPropagation();
                        onOpenTaskEditor(createTaskSeed(column.id));
                      }}
                      style={{ cursor: 'pointer', marginLeft: 6 }}
                    >
                      +
                    </span>
                  </span>
                )}
              </div>
              {!collapsed && (
                <div data-part={P.kbColumnCards}>
                  {colTasks.length === 0 && (
                    <div
                      style={{
                        padding: '20px 8px',
                        textAlign: 'center',
                        opacity: 0.4,
                        fontSize: 10,
                      }}
                    >
                      {isOver ? dropHintMessage : emptyColumnMessage}
                    </div>
                  )}
                  {colTasks.map((task) => (
                    <KanbanTaskCard
                      key={task.id}
                      task={task}
                      onEdit={onOpenTaskEditor}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <WidgetStatusBar>
        <span>{tasks.length} total</span>
        <span>{tasks.filter((task) => task.priority === 'high').length} high</span>
        <span>{tasks.filter((task) => task.col === 'done').length} done</span>
        {hasFilters && <span>filtered</span>}
      </WidgetStatusBar>

      {editingTask && (
        <KanbanTaskModal
          task={editingTask}
          columns={columns}
          onSave={onSaveTask}
          onDelete={onDeleteTask}
          onClose={onCloseTaskEditor}
        />
      )}
    </div>
  );
}
