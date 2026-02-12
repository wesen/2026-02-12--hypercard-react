import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

function App() {
  return <div>HyperCard Inventory — scaffold OK</div>;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
