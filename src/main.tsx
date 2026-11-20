// First, before the router reads the address (see the module).
import './appShellStart';
import './styles/tokens.css';
import './styles/tokens-extra.css';
import './styles/fonts.css';
import './styles/global.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('index.html must contain an element with id "root".');
}

async function start(root: HTMLElement): Promise<void> {
  // Developer and e2e builds apply the address parameters before anything reads the address or
  // the store (docs/planlar/faz-2b.md, karar 21); the check stays inline so production drops it.
  if (import.meta.env.MODE !== 'production') {
    const [{ prepareDevelopment }, services] = await Promise.all([
      import('./features/dev/params/prepareDevelopment'),
      import('./app/services'),
    ]);
    await prepareDevelopment({
      repository: services.appRepository,
      recordings: services.appRecordingStore(),
      storeServices: services.sessionStoreServices(),
    });
  }
  // App builds the router when it is imported: only now, with the address cleaned.
  const { App } = await import('./app/App');
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

void start(rootElement);
