import type { DomainActionHandler } from '@hypercard/engine';
import { goBack, showToast } from '@hypercard/engine';
import { setStatus, saveTask, deleteTask, createTask } from '../features/tasks/tasksSlice';

export const todoActionHandler: DomainActionHandler = (action, dispatch) => {
  const a = action as Record<string, unknown>;
  switch (action.type) {
    case 'setStatus':
      dispatch(setStatus({ id: a.id as string, status: a.status as any }));
      dispatch(showToast(`Task → ${a.status}`));
      return true;
    case 'saveTask':
      dispatch(saveTask({ id: a.id as string, edits: (a.edits ?? {}) as any }));
      dispatch(showToast('Task saved'));
      return true;
    case 'deleteTask':
      dispatch(deleteTask({ id: a.id as string }));
      dispatch(goBack());
      dispatch(showToast('Task deleted'));
      return true;
    case 'createTask':
      dispatch(createTask((a.values ?? {}) as any));
      dispatch(showToast('Task created! ✅'));
      return true;
    default:
      return false;
  }
};
