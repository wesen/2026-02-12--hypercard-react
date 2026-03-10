import type { Task } from './types';
import { RICH_PARTS as P } from '../parts';
import { TAG_LABELS } from './types';

export interface KanbanTaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDragStart?: (id: string) => void;
}

export function KanbanTaskCard({ task, onEdit, onDragStart }: KanbanTaskCardProps) {
  return (
    <div
      data-part={P.kbCard}
      data-priority={task.priority}
      draggable
      onDragStart={(event) => {
        event.dataTransfer.setData('text/plain', task.id);
        onDragStart?.(task.id);
      }}
      onClick={() => onEdit(task)}
    >
      <div data-part={P.kbCardTitle}>{task.title}</div>
      {task.desc && <div data-part={P.kbCardDesc}>{task.desc}</div>}
      {task.tags.length > 0 && (
        <div data-part={P.kbCardTags}>
          {task.tags.map((tag) => (
            <span key={tag} data-part={P.kbTag} data-tag={tag}>
              {TAG_LABELS[tag]}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
