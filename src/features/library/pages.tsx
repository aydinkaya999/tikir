// Library and book making (docs/ekranlar.md). Phase 0 only lays out the routes: each page is
// empty inside its shell; the screens are built in phase 5.
import { tr } from '../../i18n/tr';
import { FocusLayout } from './FocusLayout';
import { libraryPaths } from './paths';

/** U3 Kartlarla kitap. */
export function BookFromCardsPage() {
  return (
    <FocusLayout
      title={tr.focus.bookFromCards.title}
      subtitle={tr.focus.bookFromCards.subtitle}
      backTo={libraryPaths.library}
    />
  );
}

/** U4 Kitap hazır: its way back is the library (docs/planlar/faz-5.md, karar 30). */
export function BookReadyPage() {
  return (
    <FocusLayout
      title={tr.focus.bookReady.title}
      subtitle={tr.focus.bookReady.subtitle}
      backTo={libraryPaths.library}
    />
  );
}

/** U2 Metinden kitap (parent area). */
export function BookFromTextPage() {
  return null;
}
