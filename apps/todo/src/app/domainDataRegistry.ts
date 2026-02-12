import {
  defineSelectorRegistry,
  selectDomainData,
} from '@hypercard/engine';
import { selectTasks, type TasksStateSlice } from '../features/tasks/selectors';

export type TodoDomainDataState = TasksStateSlice;

export const todoDomainDataRegistry = defineSelectorRegistry<TodoDomainDataState>({
  tasks: selectTasks,
});

export const selectTodoDomainData = (state: TodoDomainDataState) =>
  selectDomainData(state, todoDomainDataRegistry);
