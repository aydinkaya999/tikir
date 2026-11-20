// U4 Kitap hazır (docs/ekranlar.md, U4; docs/planlar/faz-5.md, kararlar 21–30): the book's cover
// and real numbers, its level check, the child's stuck words in it, and the way to read it today.
import { useId } from 'react';
import { Navigate, useParams } from 'react-router';
import { BookCover } from '../../components/BookCover/BookCover';
import { Button } from '../../components/Button/Button';
import { Chip } from '../../components/Chip/Chip';
import { Icon } from '../../components/Icon/Icon';
import { IconButton } from '../../components/IconButton/IconButton';
import { tr } from '../../i18n/tr';
import { useLoadSession, useSession, useSessionDevices } from '../session/sessionContext';
import { StatusScreen } from '../session/StatusScreen';
import { useDayRefresh } from '../session/useDayRefresh';
import { BookGenerating } from './BookGenerating';
import styles from './BookReadyPage.module.css';
import { FocusCompanion } from './FocusCompanion';
import { FocusLayout } from './FocusLayout';
import { libraryPaths } from './paths';
import { useBookMaking } from './useBookMaking';
import { useReadBook } from './useReadBook';
import { readyView } from './views';

const copy = tr.focus.bookReady;

export function BookReadyPage() {
  useLoadSession();
  useDayRefresh();
  const { bookId } = useParams();
  const status = useSession((state) => state.status);
  const data = useSession((state) => state.data);
  const { books } = useSessionDevices();
  const { making, make, cancel } = useBookMaking();
  const { read, starting } = useReadBook();
  const levelId = useId();
  const insertedId = useId();

  const layout = { title: copy.title, backTo: libraryPaths.library };
  if (status === 'idle' || status === 'loading') {
    return (
      <FocusLayout {...layout}>
        <StatusScreen kind="loading" />
      </FocusLayout>
    );
  }
  if (status === 'error') {
    return (
      <FocusLayout {...layout}>
        <StatusScreen kind="error" />
      </FocusLayout>
    );
  }
  if (data === null) {
    // The setup guard opens the setup before a profile exists.
    return null;
  }
  const book = data.books.find((each) => each.id === bookId);
  if (book === undefined) {
    // A book the library does not have: the library itself.
    return <Navigate to={libraryPaths.library} replace />;
  }

  const view = readyView(data, book);
  const subtitle = view.passed ? copy.subtitle : copy.subtitleFailed;
  if (making) {
    return (
      <FocusLayout {...layout} subtitle={subtitle}>
        <BookGenerating onCancel={cancel} />
      </FocusLayout>
    );
  }

  // The same request again, under the book's own id: it stays in its place (karar 29).
  const remake = () => {
    const request = book.request;
    if (request === undefined) {
      return;
    }
    make(
      (signal) =>
        (request.kind === 'cards'
          ? books.fromCards(
              {
                choice: { hero: request.hero, place: request.place, event: request.event },
                childName: data.child.name,
                grade: book.grade,
              },
              signal,
            )
          : books.fromText(request, signal)
        ).then((made) => ({ ...made, id: book.id })),
      { open: false },
    );
  };

  return (
    <FocusLayout
      {...layout}
      subtitle={subtitle}
      aside={<FocusCompanion className={styles.companion}>{copy.bubble}</FocusCompanion>}
      action={
        <div className={styles.actions}>
          {view.canRemake && (
            <IconButton
              className={styles.phoneRemake}
              icon="repeat"
              label={copy.remake}
              size={52}
              raised
              onClick={remake}
            />
          )}
          <Button
            className={styles.start}
            size="large"
            icon="play"
            fullWidth
            disabled={!view.canStart || starting}
            onClick={() => {
              read(book.id);
            }}
          >
            {copy.start}
          </Button>
          {!view.canStart && (
            // TODO(design): docs/ekranlar.md's default while today has its session (D18).
            <p className={styles.tomorrow}>{tr.library.tomorrow}</p>
          )}
          {view.canRemake && (
            <Button
              className={styles.wideRemake}
              variant="secondary"
              icon="repeat"
              fullWidth
              onClick={remake}
            >
              {copy.remake}
            </Button>
          )}
        </div>
      }
    >
      <div className={styles.ready}>
        <div className={styles.book}>
          <BookCover
            className={styles.cover}
            variant="card"
            patterns={view.patterns}
            title={view.title}
          />
          <div className={styles.facts}>
            <h2 className={styles.bookTitle}>{view.title}</h2>
            <p className={styles.meta}>{view.meta}</p>
            {view.questions !== null && (
              <div className={styles.chips}>
                <Chip>{view.questions}</Chip>
              </div>
            )}
          </div>
        </div>
        <section
          className={[styles.level, view.passed ? '' : styles.levelFailed]
            .filter(Boolean)
            .join(' ')}
          aria-labelledby={levelId}
        >
          <h2 id={levelId} className={styles.sectionTitle}>
            {copy.level.title}
          </h2>
          <ul className={styles.levelLines}>
            {view.level.map((line, index) => (
              <li key={line.text} className={index === 0 ? styles.verdict : styles.levelLine}>
                <Icon name={line.ok ? 'check' : 'x'} size={20} />
                <span>{line.text}</span>
              </li>
            ))}
          </ul>
        </section>
        {view.inserted !== null && (
          <section className={styles.inserted} aria-labelledby={insertedId}>
            <h2 id={insertedId} className={styles.sectionTitle}>
              {copy.inserted.title}
            </h2>
            <ul className={styles.words}>
              {view.inserted.words.map((word) => (
                <li key={word} className={styles.word}>
                  {word}
                </li>
              ))}
            </ul>
            {view.inserted.note !== null && <p className={styles.note}>{view.inserted.note}</p>}
          </section>
        )}
        {view.backendNote && (
          // TODO(design): the note for what the backend brings (D18).
          <p className={styles.note}>{copy.backendNote}</p>
        )}
      </div>
    </FocusLayout>
  );
}
