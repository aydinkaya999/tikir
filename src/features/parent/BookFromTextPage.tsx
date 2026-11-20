// U2 Metinden kitap (docs/ekranlar.md, U2; docs/planlar/faz-5.md, kararlar 18–20): the parent's
// text becomes a book at the child's level. Only the text source in the first version.
import { useId, useState } from 'react';
import { Button } from '../../components/Button/Button';
import { Checkbox } from '../../components/Checkbox/Checkbox';
import { ChoicePills } from '../../components/ChoicePills/ChoicePills';
import { SegmentedControl } from '../../components/SegmentedControl/SegmentedControl';
import { TextArea } from '../../components/TextArea/TextArea';
import { tokenize, withGenitiveSuffix, withNameDativeSuffix } from '../../domain/text';
import type { BookLength, Grade } from '../../domain/types';
import { tr } from '../../i18n/tr';
import { BookGenerating } from '../library/BookGenerating';
import { useBookMaking } from '../library/useBookMaking';
import { useSession, useSessionDevices } from '../session/sessionContext';
import styles from './BookFromTextPage.module.css';

const copy = tr.bookFromText;
const lengths: readonly BookLength[] = ['short', 'medium', 'long'];
const gradeOf = { '1': 1, '2': 2, '3': 3, '4': 4 } as const satisfies Record<string, Grade>;
type GradeValue = keyof typeof gradeOf;

/** 2, 3 and 4; a first grader's 1 comes first (docs/ekranlar.md, "Tasarımı olmayan durumlar"). */
function gradeValues(childGrade: Grade): GradeValue[] {
  return childGrade === 1 ? ['1', '2', '3', '4'] : ['2', '3', '4'];
}

export function BookFromTextPage() {
  const data = useSession((state) => state.data);
  const { books } = useSessionDevices();
  const { making, make, cancel } = useBookMaking();
  const nameId = useId();
  const howToId = useId();
  const [text, setText] = useState('');
  const [grade, setGrade] = useState<Grade | null>(null);
  const [length, setLength] = useState<BookLength>('medium');
  const [insertStuckWords, setInsertStuckWords] = useState(true);
  const [addQuestions, setAddQuestions] = useState(true);

  if (data === null) {
    // The setup guard loads the store before the parent area opens.
    return null;
  }
  const { child } = data;
  const chosenGrade = grade ?? child.grade;
  // The reading text's word rule: a written number is one word (karar 19).
  const words = tokenize(text).length;

  const head = (
    <div className={styles.head}>
      <h1 className={styles.title}>{copy.title}</h1>
      <p className={`${styles.lead} ${styles.wideLead}`}>
        {copy.lead(withGenitiveSuffix(child.name))}
      </p>
      <p className={`${styles.lead} ${styles.phoneLead}`}>
        {copy.leadShort(withNameDativeSuffix(child.name))}
      </p>
    </div>
  );

  if (making) {
    return (
      <div className={styles.page}>
        {head}
        <div className={styles.wait}>
          <BookGenerating onCancel={cancel} />
        </div>
      </div>
    );
  }

  const makeBook = () => {
    if (words === 0) {
      return;
    }
    make((signal) =>
      books.fromText(
        { kind: 'text', text, grade: chosenGrade, length, insertStuckWords, addQuestions },
        signal,
      ),
    );
  };

  return (
    <div className={styles.page}>
      {head}
      <div className={styles.form}>
        <SegmentedControl
          label={copy.source}
          labelHidden
          name={`${nameId}-source`}
          options={[{ value: 'text', label: copy.pasteText, icon: 'paste' }]}
          value="text"
          onChange={() => undefined}
        />
        <TextArea label={copy.text} hint={copy.words(words)} value={text} onChange={setText} />
        <div className={styles.choices}>
          <ChoicePills
            className={styles.choice}
            label={copy.grade}
            mode="single"
            options={gradeValues(child.grade).map((value) => ({ value, label: value }))}
            value={[String(chosenGrade) as GradeValue]}
            onChange={([value]) => {
              if (value !== undefined) {
                setGrade(gradeOf[value]);
              }
            }}
          />
          <ChoicePills
            className={styles.choice}
            label={copy.length}
            mode="single"
            options={lengths.map((value) => ({ value, label: copy.lengths[value] }))}
            value={[length]}
            onChange={([value]) => {
              if (value !== undefined) {
                setLength(value);
              }
            }}
          />
        </div>
        <div className={styles.checks}>
          <Checkbox
            label={copy.insertStuckWords}
            checked={insertStuckWords}
            onChange={setInsertStuckWords}
          />
          <Checkbox label={copy.addQuestions} checked={addQuestions} onChange={setAddQuestions} />
        </div>
      </div>
      <section className={styles.howTo} aria-labelledby={howToId}>
        <h2 id={howToId} className={styles.howToTitle}>
          {copy.howTo.title}
        </h2>
        <ol className={styles.steps}>
          {copy.howTo.steps(withGenitiveSuffix(child.name)).map((step, index) => (
            <li key={step} className={styles.step}>
              <span className={styles.stepNumber} aria-hidden="true">
                {index + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </section>
      <div className={styles.action}>
        <Button size="large" icon="right" disabled={words === 0} onClick={makeBook}>
          {copy.make}
        </Button>
      </div>
    </div>
  );
}
