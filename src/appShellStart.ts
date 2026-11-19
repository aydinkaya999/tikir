// The app shell of the phase 1 audio trial opens on the audio lab (docs/kararlar.md T19).
// src/main.tsx imports this module first: src/app/App.tsx creates the router, which reads the
// address, when it loads, so the address has to change before then. Only the `cap` build does
// this; Vite folds the check, so other builds carry none of it. iOS serves the app from
// capacitor://localhost, whose root path may read as '' rather than '/'.
import { devPaths } from './app/routes';

if (import.meta.env.MODE === 'cap' && (location.pathname === '' || location.pathname === '/')) {
  history.replaceState(null, '', devPaths.audio);
}
