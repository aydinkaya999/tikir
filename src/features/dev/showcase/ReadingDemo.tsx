import { useState } from 'react';
import { PageCard } from '../../../components/PageCard/PageCard';
import { tokenizePage } from '../../../domain/text';
import { tr } from '../../../i18n/tr';
import { PhraseText } from '../../reading/PhraseText';
import { RaceBar } from '../../reading/RaceBar';
import { ReadingText } from '../../reading/ReadingText';
import { Row, Section } from './Section';
import { samplePage, samplePageCount } from './seedSamples';
import styles from './Showcase.module.css';

const pageTitle = 'Kayıp Fenerin İzinde, 4. bölüm';
const pageCounter = `1 / ${String(samplePageCount)}`;
const wordCount = tokenizePage(samplePage).length;
// The G4 moment: hesitation on "kulaklarını", error on "rüzgârı".
const g4Marks = { 6: 'hesitation', 9: 'error' } as const;

interface WalkthroughProps {
  /** Test hook for e2e/reading-text.spec.ts. */
  variant: 'default' | 'school-largest';
  className?: string;
}

/** Moves the highlight word by word; the e2e test checks that no word box moves meanwhile. */
function Walkthrough({ variant, className }: WalkthroughProps) {
  const [current, setCurrent] = useState(0);
  return (
    <div
      className={[styles.wide, className ?? ''].filter(Boolean).join(' ')}
      data-reading-demo={variant}
    >
      <label className={styles.slider}>
        <code>currentIndex = {current}</code>
        <input
          type="range"
          min={0}
          max={wordCount - 1}
          value={current}
          onChange={(event) => {
            setCurrent(Number(event.target.value));
          }}
        />
      </label>
      <PageCard title={pageTitle} counter={pageCounter}>
        <ReadingText
          page={samplePage}
          readCount={current}
          currentIndex={current}
          ghostIndex={current >= 2 ? current - 2 : null}
          marks={g4Marks}
        />
      </PageCard>
    </div>
  );
}

export function ReadingTextDemo() {
  return (
    <Section name="ReadingText">
      <Row label="G4 moment: read 0–13, current 14, ghost 12, hesitation 6, error 9 (text: seed)">
        <div className={styles.wide}>
          <PageCard title={pageTitle} counter={pageCounter}>
            <ReadingText
              page={samplePage}
              readCount={14}
              currentIndex={14}
              ghostIndex={12}
              marks={g4Marks}
            />
          </PageCard>
        </div>
      </Row>
      <Row label="walkthrough: default reading style">
        <Walkthrough variant="default" />
      </Row>
      <Row label="walkthrough: school letters, largest size, widest spacing">
        <Walkthrough variant="school-largest" className={styles.schoolLargest} />
      </Row>
    </Section>
  );
}

export function PhraseTextDemo() {
  return (
    <Section name="PhraseText">
      <Row label="G3 moment: units 0–5 read, current 6">
        <div className={styles.wide}>
          <PageCard title={pageTitle} counter={pageCounter}>
            <PhraseText page={samplePage} currentUnit={6} readUnits={6} />
          </PageCard>
        </div>
      </Row>
    </Section>
  );
}

export function RaceBarDemo() {
  return (
    <Section name="RaceBar">
      <Row label="ghost behind (G4: you 40%, ghost 33%)">
        <RaceBar
          className={styles.wide}
          progress={0.4}
          ghost={0.33}
          youLabel={tr.race.you}
          ghostLabel={tr.race.ghost}
        />
      </Row>
      <Row label="ghost ahead">
        <RaceBar
          className={styles.wide}
          progress={0.3}
          ghost={0.45}
          youLabel={tr.race.you}
          ghostLabel={tr.race.ghost}
        />
      </Row>
      <Row label="ghost = null (first day)">
        <RaceBar
          className={styles.wide}
          progress={0.15}
          ghost={null}
          youLabel={tr.race.you}
          ghostLabel={tr.race.ghost}
        />
      </Row>
    </Section>
  );
}
