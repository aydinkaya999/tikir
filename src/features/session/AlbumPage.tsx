// The album tab (docs/planlar/faz-2b.md, karar 18): the words the child tamed, as on G7, in the
// Turkish alphabet's order. TODO(design): the album is not drawn.
import { tamedWords } from '../../domain/stuckWords';
import { tr } from '../../i18n/tr';
import { EmptyTab } from './EmptyTab';
import { useLoadSession, useSession } from './sessionContext';
import { StatusScreen } from './StatusScreen';
import styles from './TabPage.module.css';
import { TamedWords } from './TamedWords';

export function AlbumPage() {
  useLoadSession();
  const status = useSession((state) => state.status);
  const data = useSession((state) => state.data);

  if (status === 'idle' || status === 'loading') {
    return <StatusScreen kind="loading" />;
  }
  if (status === 'error') {
    return <StatusScreen kind="error" />;
  }
  if (data === null) {
    // TODO(phase 3): with no profile the onboarding opens (/kurulum/hesap).
    return null;
  }
  const words = tamedWords(data.cards);
  return (
    <div className={styles.page}>
      <h1 className={styles.title}>{tr.nav.child.album}</h1>
      {words.length === 0 ? (
        <EmptyTab text={tr.album.empty} back={tr.album.back} />
      ) : (
        <TamedWords words={words} />
      )}
    </div>
  );
}
