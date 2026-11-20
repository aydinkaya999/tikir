// V4 Yazı ayarı (docs/ekranlar.md, V4; docs/urun.md section 7; docs/planlar/faz-3.md, karar 24):
// the reading style of every reading text, shown in a preview and kept as soon as it is chosen,
// and the trial that compares two styles in the weekly measurement.
import { useId, useMemo, useRef, useState } from 'react';
import { OptionCard } from '../../components/OptionCard/OptionCard';
import { SegmentedControl } from '../../components/SegmentedControl/SegmentedControl';
import { Switch } from '../../components/Switch/Switch';
import { trialComparison } from '../../domain/readingStyle';
import { tokenizePage, withGenitiveSuffix } from '../../domain/text';
import type { ReadingStyle } from '../../domain/types';
import { tr } from '../../i18n/tr';
import { ReadingStyleScope } from '../reading/ReadingStyleScope';
import { ReadingText } from '../reading/ReadingText';
import { useSession, useSessionStore } from '../session/sessionContext';
import styles from './ReadingStylePage.module.css';
import { readingPreview, styleName, trialSentence } from './views';

const copy = tr.readingStyle;
const fonts = ['clear', 'school'] as const;
/** The segments' values and the steps they stand for. */
const sizeSteps = { '0': 0, '1': 1, '2': 2, '3': 3 } as const satisfies Record<
  string,
  ReadingStyle['sizeStep']
>;
const spacingSteps = { '0': 0, '1': 1, '2': 2 } as const satisfies Record<
  string,
  ReadingStyle['spacingStep']
>;
const sizeValues = ['0', '1', '2', '3'] as const;
const spacingValues = ['0', '1', '2'] as const;

/** The preview box keeps the height of the largest style, so the controls never move (ölçüt 6). */
const largestStyles: readonly ReadingStyle[] = fonts.map((font) => ({
  font,
  sizeStep: 3,
  spacingStep: 2,
  trialEnabled: false,
}));

export function ReadingStylePage() {
  const store = useSessionStore();
  const data = useSession((state) => state.data);
  const previewId = useId();
  const fontId = useId();
  const nameId = useId();
  const trialId = useId();
  // The choice shows at once; the store keeps it a moment later, the latest choice last.
  const [choice, setChoice] = useState<ReadingStyle | null>(null);
  const latest = useRef<ReadingStyle | null>(null);
  const saving = useRef(false);
  const preview = useMemo(() => (data === null ? null : readingPreview(data)), [data]);

  if (data === null || preview === null) {
    // The setup guard loads the store before the parent area opens.
    return null;
  }
  const { child } = data;
  const style = choice ?? child.readingStyle;
  const wordCount = tokenizePage(preview.page).length;

  const choose = (next: Partial<ReadingStyle>) => {
    const chosen = { ...style, ...next };
    setChoice(chosen);
    latest.current = chosen;
    if (saving.current) {
      return;
    }
    saving.current = true;
    const save = async () => {
      try {
        while (latest.current !== null) {
          const value = latest.current;
          latest.current = null;
          await store.getState().setReadingStyle(value);
        }
      } finally {
        saving.current = false;
      }
    };
    save().catch(() => undefined);
  };

  const comparison = trialComparison(data.assessments, style);
  const rows = [
    { key: 'current', label: copy.trial.current, result: comparison.current },
    { key: 'trial', label: copy.trial.tried, result: comparison.trial },
  ] as const;

  return (
    <div className={styles.page}>
      <div className={styles.head}>
        <h1 className={styles.title}>{copy.title}</h1>
        <p className={styles.lead}>{copy.lead(withGenitiveSuffix(child.name))}</p>
      </div>
      <div className={styles.top}>
        <section className={styles.preview} aria-labelledby={previewId}>
          <div className={styles.previewHead}>
            <p id={previewId}>{copy.preview}</p>
            <p>{preview.title}</p>
          </div>
          <div className={styles.previewText}>
            <ReadingStyleScope style={style}>
              <ReadingText page={preview.page} readCount={wordCount} />
            </ReadingStyleScope>
            {largestStyles.map((largest) => (
              <ReadingStyleScope key={largest.font} className={styles.sizer} style={largest}>
                <div aria-hidden="true">
                  <ReadingText page={preview.page} readCount={wordCount} />
                </div>
              </ReadingStyleScope>
            ))}
          </div>
        </section>
        <div className={styles.controls}>
          <div className={styles.field}>
            <p className={styles.label} id={fontId}>
              {copy.font}
            </p>
            <div role="group" aria-labelledby={fontId} className={styles.fonts}>
              {fonts.map((font) => (
                <OptionCard
                  key={font}
                  layout="detail"
                  label={copy.fonts[font].label}
                  description={copy.fonts[font].description}
                  media={<span className={styles[font]}>{copy.fonts[font].sample}</span>}
                  selected={style.font === font}
                  onSelect={() => {
                    choose({ font });
                  }}
                />
              ))}
            </div>
          </div>
          <SegmentedControl
            label={copy.size}
            name={`${nameId}-size`}
            options={sizeValues.map((value) => ({ value, label: copy.sizes[sizeSteps[value]] }))}
            value={sizeValues[style.sizeStep]}
            onChange={(value) => {
              choose({ sizeStep: sizeSteps[value] });
            }}
          />
          <SegmentedControl
            label={copy.spacing}
            name={`${nameId}-spacing`}
            options={spacingValues.map((value) => ({
              value,
              label: copy.spacings[spacingSteps[value]],
            }))}
            value={spacingValues[style.spacingStep]}
            onChange={(value) => {
              choose({ spacingStep: spacingSteps[value] });
            }}
          />
        </div>
      </div>
      <section className={styles.trial} aria-labelledby={trialId}>
        <div className={styles.trialIntro}>
          <div className={styles.trialHead}>
            <h2 id={trialId} className={styles.trialTitle}>
              {copy.trial.title}
            </h2>
            <p className={styles.trialText}>{copy.trial.text(withGenitiveSuffix(child.name))}</p>
          </div>
          <Switch
            label={copy.trial.toggle}
            checked={style.trialEnabled}
            onChange={(trialEnabled) => {
              choose({ trialEnabled });
            }}
          />
        </div>
        {/* Empty while the trial is off: from 700 px it keeps the intro to its half (V4 @kucuk-kapali). */}
        <div className={styles.results}>
          {style.trialEnabled && (
            <>
              <ul className={styles.rows} aria-label={copy.trial.rows}>
                {rows.map((row) => (
                  <li key={row.key} className={styles.row}>
                    <span className={styles.rowNames}>
                      <span className={styles.rowStyle}>{styleName(row.result.style)}</span>
                      <span className={styles.rowNote}>{row.label}</span>
                    </span>
                    {row.result.average !== null && (
                      <span className={styles.rowValue}>{Math.round(row.result.average)}</span>
                    )}
                  </li>
                ))}
              </ul>
              <p className={styles.sentence}>{trialSentence(comparison)}</p>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
