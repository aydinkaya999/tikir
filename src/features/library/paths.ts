// Addresses of the library's screens (docs/ekranlar.md, "Rotalar"). The screens navigate with
// these; src/app/routes.ts builds its route table from them, so features never import src/app.
import type { Id } from '../../domain/types';
import { childPaths } from '../session/paths';

export const libraryPaths = {
  library: childPaths.library,
  fromCards: '/kitaplik/kur',
  ready: '/kitaplik/:bookId/hazir',
} as const;

/** U4 of one book. */
export function bookReadyPath(bookId: Id): string {
  return libraryPaths.ready.replace(':bookId', encodeURIComponent(bookId));
}
