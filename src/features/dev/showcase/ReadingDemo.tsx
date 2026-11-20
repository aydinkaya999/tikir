import { useState } from 'react';
import { PageCard } from '../../../components/PageCard/PageCard';
import { tokenizePage } from '../../../domain/text';
import { tr } from '../../../i18n/tr';
import { PhraseText } from '../../reading/PhraseText';
import { ReadingStyleScope } from '../../reading/ReadingStyleScope';
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

/** The school letters at the four sizes, with the widest spacing (e2e/reading-text.spec.ts). */
const schoolWalkthroughs = [
  { variant: 'school-0', sizeStep: 0 },
  { variant: 'school-1', sizeStep: 1 },
  { variant: 'school-2', sizeStep: 2 },
  { variant: 'school-3', sizeStep: 3 },
] as const;

interface WalkthroughProps {
  /** Test hook for e2e/reading-text.spec.ts. */
  variant: 'default' | (typeof schoolWalkthroughs)[number]['variant'];
}

/** Moves the highlight word by word; the e2e test checks that no word box moves meanwhile. */
function Walkthrough({ variant }: WalkthroughProps) {
  const [current, setCurrent] = useState(0);
  return (
    <div className={styles.wide} data-reading-demo={variant}>
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
      {schoolWalkthroughs.map(({ variant, sizeStep }) => (
        <Row
          key={variant}
          label={`walkthrough: school letters, size step ${String(sizeStep)}, widest spacing`}
        >
          <ReadingStyleScope
            style={{ font: 'school', sizeStep, spacingStep: 2, trialEnabled: false }}
          >
            <Walkthrough variant={variant} />
          </ReadingStyleScope>
        </Row>
      ))}
    </Section>
  );
}

const unitCount = samplePage.reduce((count, sentence) => count + sentence.length, 0);

/** Moves the narration highlight unit by unit; e2e/reading-text.spec.ts checks nothing moves. */
function PhraseWalkthrough() {
  const [current, setCurrent] = useState(0);
  return (
    <div className={styles.wide} data-phrase-demo="default">
      <label className={styles.slider}>
        <code>currentUnit = {current}</code>
        <input
          type="range"
          min={0}
          max={unitCount - 1}
          value={current}
          onChange={(event) => {
            setCurrent(Number(event.target.value));
          }}
        />
      </label>
      <PageCard title={pageTitle} counter={pageCounter}>
        <PhraseText page={samplePage} currentUnit={current} readUnits={current} />
      </PageCard>
    </div>
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
      <Row label="walkthrough: the narration highlight moves unit by unit">
        <PhraseWalkthrough />
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
