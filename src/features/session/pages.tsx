// The session steps not built yet (docs/planlar/faz-2b.md, Tasks 9–16): each draws its body with
// the design's title and Tıkır, so the shell is whole while the screens arrive one by one.
import { tr } from '../../i18n/tr';
import { SessionLayout } from './SessionLayout';

/** G4 Oku. */
export function ReadPage() {
  return <SessionLayout title={tr.session.steps.read} companion={{ expression: 'listen' }} />;
}

/** G5 Kayıt. */
export function RecordPage() {
  return <SessionLayout title={tr.session.steps.record} companion={{ expression: 'happy' }} />;
}

/** G6 Kapanış sorusu. */
export function WrapUpPage() {
  return <SessionLayout title={tr.session.steps.wrapUp} companion={{ expression: 'think' }} />;
}

/** G7 Bugünlük bitti. */
export function DonePage() {
  return <SessionLayout title={tr.session.doneTitle} companion={{ expression: 'sleep' }} />;
}

/** Albüm tab: tamed words (no design yet; minimal screen in phase 2). */
export function AlbumPage() {
  return null;
}

/** Stüdyo tab: recorded chapters (no design yet; minimal screen in phase 2). */
export function StudioPage() {
  return null;
}
