import { useSelector } from 'react-redux';
import { HyperCardShell } from '@hypercard/engine';
import { STACK } from './domain/stack';
import { todoActionHandler } from './app/domainActionHandler';
import { todoRenderers } from './overrides/cardRenderers';
import { selectTasks, type TasksStateSlice } from './features/tasks/selectors';

export function App() {
  const tasks = useSelector((s: TasksStateSlice) => selectTasks(s));

  return (
    <HyperCardShell
      stack={STACK as any}
      domainActionHandler={todoActionHandler}
      customRenderers={todoRenderers}
      domainData={{ tasks }}
      navShortcuts={[
        { card: 'home', icon: '🏠' },
        { card: 'browse', icon: '📋' },
        { card: 'inProgress', icon: '🔥' },
      ]}
    />
  );
}
