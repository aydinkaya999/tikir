// U3 Kartlarla kitap (docs/ekranlar.md, U3; docs/planlar/faz-5.md, kararlar 14–17): a card of each
// group, Tıkır's sentence of the choice, then the book is made and opens ready (U4).
import { useId, useState } from 'react';
import { Button } from '../../components/Button/Button';
import { Companion } from '../../components/Companion/Companion';
import type { IconName } from '../../components/Icon/Icon';
import { OptionCard } from '../../components/OptionCard/OptionCard';
import { type CardChoice, cardLabel, cardsSummary } from '../../domain/books';
import type { Id } from '../../domain/types';
import { tr } from '../../i18n/tr';
import { useLoadSession, useSession, useSessionDevices } from '../session/sessionContext';
import { StatusScreen } from '../session/StatusScreen';
import styles from './BookFromCardsPage.module.css';
import { BookGenerating } from './BookGenerating';
import { FocusCompanion } from './FocusCompanion';
import { FocusLayout } from './FocusLayout';
import { libraryPaths } from './paths';
import { useBookMaking } from './useBookMaking';

type Group = keyof CardChoice;

const groups: readonly Group[] = ['hero', 'place', 'event'];

/** The cards' pictures (design/ekranlar/U3-*.html); the first hero shows Tıkır's face. */
const cardIcons: Readonly<Record<Id, IconName>> = {
  'kasif-kedi': 'cat',
  'robot-bip': 'robot',
  orman: 'tree',
  'deniz-alti': 'wave',
  'uzay-istasyonu': 'planet',
  'kayip-harita': 'map',
  'gizemli-ses': 'ear',
  'buyuk-yaris': 'flag',
};

const childHero = 'cocuk-ve-tikir';

function completeChoice(choice: Partial<CardChoice>): CardChoice | null {
  const { hero, place, event } = choice;
  return hero !== undefined && place !== undefined && event !== undefined
    ? { hero, place, event }
    : null;
}

export function BookFromCardsPage() {
  useLoadSession();
  const status = useSession((state) => state.status);
  const data = useSession((state) => state.data);
  const { books } = useSessionDevices();
  const [choice, setChoice] = useState<Partial<CardChoice>>({});
  const { making, make, cancel } = useBookMaking();
  const titleIds = { hero: useId(), place: useId(), event: useId() };

  const layout = {
    title: tr.focus.bookFromCards.title,
    subtitle: tr.focus.bookFromCards.subtitle,
    backTo: libraryPaths.library,
  };
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

  const cards = books.cards();
  const complete = completeChoice(choice);
  const childName = data.child.name;

  const makeBook = () => {
    if (complete !== null) {
      make((signal) =>
        books.fromCards({ choice: complete, childName, grade: data.child.grade }, signal),
      );
    }
  };

  if (making) {
    return (
      <FocusLayout {...layout}>
        <BookGenerating onCancel={cancel} />
      </FocusLayout>
    );
  }

  return (
    <FocusLayout
      {...layout}
      aside={
        <FocusCompanion>
          {complete === null
            ? tr.focus.bookFromCards.subtitle
            : cardsSummary(cards, complete, childName)}
        </FocusCompanion>
      }
      action={
        <Button size="large" icon="right" fullWidth disabled={complete === null} onClick={makeBook}>
          {tr.focus.bookFromCards.make}
        </Button>
      }
    >
      <div className={styles.groups}>
        {groups.map((group) => (
          <div key={group} className={styles.group}>
            <h2 className={styles.groupTitle} id={titleIds[group]}>
              {tr.focus.bookFromCards.groups[group]}
            </h2>
            <div className={styles.cards} role="group" aria-labelledby={titleIds[group]}>
              {cards[group].map((card) => (
                <OptionCard
                  key={card.id}
                  label={cardLabel(card.label, childName)}
                  selected={choice[group] === card.id}
                  onSelect={() => {
                    setChoice((current) => ({ ...current, [group]: card.id }));
                  }}
                  icon={cardIcons[card.id]}
                  media={
                    card.id === childHero ? (
                      <Companion className={styles.heroFace} expression="normal" size={60} />
                    ) : undefined
                  }
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </FocusLayout>
  );
}
