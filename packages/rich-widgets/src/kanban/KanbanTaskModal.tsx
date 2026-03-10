import { useEffect, useState } from 'react';
import { Btn } from '@hypercard/engine';
import { ModalOverlay } from '../primitives/ModalOverlay';
import { RICH_PARTS as P } from '../parts';
import type { Column, Priority, TagId, Task } from './types';
import { ALL_PRIORITIES, ALL_TAGS, PRIORITY_LABELS, TAG_LABELS } from './types';

let idSeq = 0;
const mkId = () => `task-${Date.now()}-${++idSeq}`;

export interface KanbanTaskModalProps {
  task: Partial<Task>;
  columns: Column[];
  onSave: (task: Task) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

export function KanbanTaskModal({ task, columns, onSave, onDelete, onClose }: KanbanTaskModalProps) {
  const [title, setTitle] = useState(task.title ?? '');
  const [desc, setDesc] = useState(task.desc ?? '');
  const [tags, setTags] = useState<TagId[]>(task.tags ?? []);
  const [priority, setPriority] = useState<Priority>(task.priority ?? 'medium');
  const [col, setCol] = useState(task.col ?? columns[0]?.id ?? 'todo');
  const isNew = !task.id;

  useEffect(() => {
    setTitle(task.title ?? '');
    setDesc(task.desc ?? '');
    setTags(task.tags ?? []);
    setPriority(task.priority ?? 'medium');
    setCol(task.col ?? columns[0]?.id ?? 'todo');
  }, [columns, task]);

  const toggleTag = (tag: TagId) => {
    setTags((previous) => (
      previous.includes(tag)
        ? previous.filter((entry) => entry !== tag)
        : [...previous, tag]
    ));
  };

  return (
    <ModalOverlay onClose={onClose}>
      <div data-part={P.kbModal}>
        <div data-part={P.kbModalHeader}>
          <span>{isNew ? 'New Task' : 'Edit Task'}</span>
          <Btn onClick={onClose} style={{ fontSize: 9 }}>
            ✕
          </Btn>
        </div>
        <div data-part={P.kbModalBody}>
          <div>
            <label>Title</label>
            <input
              data-part="field-input"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              autoFocus
            />
          </div>
          <div>
            <label>Description</label>
            <textarea
              data-part="field-input"
              value={desc}
              onChange={(event) => setDesc(event.target.value)}
              rows={3}
            />
          </div>
          <div>
            <label>Column</label>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {columns.map((column) => (
                <Btn
                  key={column.id}
                  onClick={() => setCol(column.id)}
                  data-state={col === column.id ? 'active' : undefined}
                  style={{ fontSize: 10 }}
                >
                  {column.icon} {column.title}
                </Btn>
              ))}
            </div>
          </div>
          <div>
            <label>Tags</label>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {ALL_TAGS.map((tag) => (
                <Btn
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  data-state={tags.includes(tag) ? 'active' : undefined}
                  style={{ fontSize: 10 }}
                >
                  {TAG_LABELS[tag]}
                </Btn>
              ))}
            </div>
          </div>
          <div>
            <label>Priority</label>
            <div style={{ display: 'flex', gap: 4 }}>
              {ALL_PRIORITIES.map((entry) => (
                <Btn
                  key={entry}
                  onClick={() => setPriority(entry)}
                  data-state={priority === entry ? 'active' : undefined}
                  style={{ fontSize: 10 }}
                >
                  {PRIORITY_LABELS[entry]}
                </Btn>
              ))}
            </div>
          </div>
        </div>
        <div data-part={P.kbModalFooter}>
          {!isNew && (
            <Btn
              onClick={() => {
                onDelete(task.id!);
                onClose();
              }}
              style={{ fontSize: 10 }}
            >
              Delete
            </Btn>
          )}
          <div style={{ flex: 1 }} />
          <Btn onClick={onClose} style={{ fontSize: 10 }}>
            Cancel
          </Btn>
          <Btn
            onClick={() => {
              if (!title.trim()) {
                return;
              }

              onSave({
                id: task.id ?? mkId(),
                title,
                desc,
                tags,
                priority,
                col,
              });
              onClose();
            }}
            style={{ fontSize: 10, fontWeight: 'bold' }}
          >
            {isNew ? 'Create' : 'Save'}
          </Btn>
        </div>
      </div>
    </ModalOverlay>
  );
}
