import { BookCover } from '../../../components/BookCover/BookCover';
import { Companion, type CompanionExpression } from '../../../components/Companion/Companion';
import { Monster } from '../../../components/Monster/Monster';
import { Tile, type TilePattern } from '../../../components/Tile/Tile';
import { tr } from '../../../i18n/tr';
import sampleBooks from '../../../../seed/ornek-kitaplar.json';
import { Row, Section } from './Section';
import styles from './Showcase.module.css';

const expressions: CompanionExpression[] = ['normal', 'listen', 'talk', 'happy', 'sleep', 'think'];
const patterns: TilePattern[] = [1, 2, 3, 4, 5, 6];
const cardBookTitle = sampleBooks.books[0]?.title ?? '';

export function CompanionDemo() {
  return (
    <Section name="Companion">
      <Row label="expression (size 96, label = tr.appName)">
        {expressions.map((expression) => (
          <figure className={styles.figure} key={expression}>
            <Companion expression={expression} size={96} label={tr.appName} />
            <figcaption>
              <code>{expression}</code>
            </figcaption>
          </figure>
        ))}
      </Row>
      <Row label="size: 64 U3 · 72 G4 telefon · 80 G1 telefon · 150 G1 · 190 G4 · 220 K1">
        {[64, 72, 80, 150, 190, 220].map((size) => (
          <Companion key={size} size={size} label={tr.appName} />
        ))}
      </Row>
    </Section>
  );
}

export function MonsterDemo() {
  return (
    <Section name="Monster">
      <Row label="kind × state (size 92 G2, 64 G7)">
        <Monster kind={1} state="wild" size={92} />
        <Monster kind={2} state="wild" size={92} />
        <Monster kind={1} state="tamed" size={64} />
        <Monster kind={2} state="tamed" size={64} />
      </Row>
    </Section>
  );
}

export function TileDemo() {
  return (
    <Section name="Tile">
      <Row label="done pattern 1–6 · today · locked (size 84, G1 tablet/web)">
        {patterns.map((pattern) => (
          <Tile key={pattern} state="done" pattern={pattern} />
        ))}
        <Tile state="today" />
        <Tile state="locked" />
      </Row>
      <Row label="size 62 (G1 telefon)">
        <Tile state="done" pattern={1} size={62} />
        <Tile state="today" size={62} />
        <Tile state="locked" size={62} />
      </Row>
    </Section>
  );
}

export function BookCoverDemo() {
  return (
    <Section name="BookCover">
      <Row label="variant=tile: 88 U1 web · 64 U1 telefon">
        <BookCover patterns={[1]} />
        <BookCover patterns={[2]} size={64} />
      </Row>
      <Row label="variant=card: U4 (title: seed/ornek-kitaplar.json)">
        <BookCover variant="card" patterns={[2, 3]} title={cardBookTitle} />
      </Row>
    </Section>
  );
}
