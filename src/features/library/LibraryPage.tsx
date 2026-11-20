// U1 Kitaplık (docs/ekranlar.md, U1): the series to go on with, the child's books and the ways to
// make one (docs/planlar/faz-5.md, kararlar 10–13).
import { useId, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { BookCover, CoverBand } from '../../components/BookCover/BookCover';
import { Button } from '../../components/Button/Button';
import { Icon } from '../../components/Icon/Icon';
import { ProgressBar } from '../../components/ProgressBar/ProgressBar';
import type { Id } from '../../domain/types';
import { tr } from '../../i18n/tr';
import { parentPaths } from '../parent/paths';
import { useMicrophone } from '../reading/useMicrophone';
import { childPaths, sessionPaths } from '../session/paths';
import {
  useLoadSession,
  useSession,
  useSessionDevices,
  useSessionStore,
} from '../session/sessionContext';
import { StatusScreen } from '../session/StatusScreen';
import { useDayRefresh } from '../session/useDayRefresh';
import { sessionListens } from '../session/views';
import styles from './LibraryPage.module.css';
import { libraryPaths } from './paths';
import { type LibraryBook, libraryView } from './views';

interface BookCardProps {
  book: LibraryBook;
  disabled: boolean;
  /** Today has its session: the book waits for tomorrow (karar 12). */
  tomorrow: boolean;
  onRead: (bookId: Id) => void;
}

function BookCard({ book, disabled, tomorrow, onRead }: BookCardProps) {
  const id = useId();
  return (
    <button
      type="button"
      className={styles.book}
      disabled={disabled}
      aria-labelledby={`${id}-title`}
      aria-describedby={tomorrow ? `${id}-source ${id}-tomorrow` : `${id}-source`}
      onClick={() => {
        onRead(book.id);
      }}
    >
      <CoverBand patterns={book.patterns} />
      <span className={styles.bookBody}>
        <span className={styles.bookTitle} id={`${id}-title`}>
          {book.title}
        </span>
        <span className={styles.bookSource} id={`${id}-source`}>
          {book.source}
        </span>
        {tomorrow && (
          // TODO(design): docs/ekranlar.md's default for a book while today has its session.
          <span className={styles.bookSource} id={`${id}-tomorrow`}>
            {tr.library.tomorrow}
          </span>
        )}
      </span>
    </button>
  );
}

export function LibraryPage() {
  useLoadSession();
  useDayRefresh();
  const status = useSession((state) => state.status);
  const data = useSession((state) => state.data);
  const store = useSessionStore();
  const { audio } = useSessionDevices();
  const microphone = useMicrophone(audio, data === null ? false : sessionListens(data));
  const navigate = useNavigate();
  const [starting, setStarting] = useState(false);
  const seriesTitleId = useId();
  const booksTitleId = useId();

  if (status === 'idle' || status === 'loading') {
    return <StatusScreen kind="loading" />;
  }
  if (status === 'error') {
    return <StatusScreen kind="error" />;
  }
  if (data === null) {
    // The setup guard opens the setup before a profile exists.
    return null;
  }

  const view = libraryView(data);
  // A book's tap starts the day with it and opens the microphone, as G1's "Başla" does (T22).
  const read = (bookId: Id) => {
    microphone.start();
    setStarting(true);
    store
      .getState()
      .startWithBook(bookId)
      .then(() => {
        const session = store.getState().data?.session;
        if (session !== undefined && session !== null) {
          void navigate(sessionPaths[session.step]);
        }
      })
      .catch(() => undefined)
      .finally(() => {
        setStarting(false);
      });
  };

  return (
    <div className={styles.library}>
      <div className={styles.header}>
        <h1 className={styles.title}>{tr.library.title}</h1>
        <Button variant="saffron" icon="plus" to={libraryPaths.fromCards}>
          {tr.library.newBook}
        </Button>
      </div>
      <section className={styles.series} aria-labelledby={seriesTitleId}>
        <BookCover className={styles.phoneCover} patterns={[1]} size={64} />
        <BookCover className={styles.wideCover} patterns={[1]} size={88} />
        <div className={styles.seriesText}>
          <h2 className={styles.seriesTitle} id={seriesTitleId}>
            {view.series.title}
          </h2>
          <ProgressBar
            label={tr.library.progressLabel}
            value={view.series.completed}
            max={view.series.total}
          />
          <p className={styles.progress}>{view.series.progress}</p>
        </div>
        <Button className={styles.resume} icon="play" to={childPaths.road}>
          {tr.library.resume}
        </Button>
      </section>
      <section className={styles.books} aria-labelledby={booksTitleId}>
        <h2 className={styles.sectionTitle} id={booksTitleId}>
          {tr.library.yourBooks}
        </h2>
        {view.books.length === 0 && (
          // TODO(design): the phone's empty library (D18); wider screens keep the dashed card.
          <div className={styles.empty}>
            <p className={styles.emptyText}>{tr.library.empty}</p>
            <Button variant="saffron" icon="plus" to={libraryPaths.fromCards}>
              {tr.library.makeFromCards}
            </Button>
          </div>
        )}
        <div className={styles.grid}>
          {view.books.map((book) => (
            <BookCard
              key={book.id}
              book={book}
              disabled={!view.canStart || starting}
              tomorrow={!view.canStart}
              onRead={read}
            />
          ))}
          <Link className={styles.make} to={libraryPaths.fromCards}>
            <Icon name="plus" size={30} />
            <span>{tr.library.makeFromCards}</span>
          </Link>
        </div>
      </section>
      <Link className={styles.parentLink} to={parentPaths.books}>
        <Icon name="lock" size={20} />
        <span>{tr.library.parentText}</span>
        <Icon className={styles.chevron} name="right" size={18} />
      </Link>
    </div>
  );
}
