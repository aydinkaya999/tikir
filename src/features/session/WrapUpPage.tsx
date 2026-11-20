// G6 Kapanış (docs/ekranlar.md, G6; docs/planlar/faz-2b.md, karar 16): the chapter's questions,
// three options each in a shuffled order. A wrong answer only marks the right option; nothing on
// the screen says "wrong" (docs/urun.md, bölüm 4).
import { useEffect, useEffectEvent, useId, useState } from 'react';
import { Button } from '../../components/Button/Button';
import { Chip } from '../../components/Chip/Chip';
import { Icon } from '../../components/Icon/Icon';
import type { Chapter, Question } from '../../domain/types';
import { tr } from '../../i18n/tr';
import { useSession, useSessionDevices, useSessionStore } from './sessionContext';
import { SessionLayout } from './SessionLayout';
import { placeOf } from './sessionMachine';
import { TextLayer } from './TextLayer';
import styles from './WrapUpPage.module.css';

/** The answered question stays on the screen until its answer is written, or the child goes on. */
interface HeldAnswer {
  question: number;
  correct: boolean;
}

/** The option indexes in a new order (Fisher–Yates) from the services' random source. */
function shuffledOrder(count: number, random: () => number): number[] {
  const order = Array.from({ length: count }, (_, index) => index);
  for (let index = count - 1; index > 0; index -= 1) {
    const other = Math.floor(random() * (index + 1));
    const picked = order[other];
    const current = order[index];
    if (picked !== undefined && current !== undefined) {
      order[index] = picked;
      order[other] = current;
    }
  }
  return order;
}

export function WrapUpPage() {
  const data = useSession((state) => state.data);
  const store = useSessionStore();
  const [held, setHeld] = useState<HeldAnswer | null>(null);

  const session = data?.session ?? null;
  const chapter = data?.chapter ?? null;
  const place = session === null ? null : placeOf(session);
  const questionCount = chapter?.questions.length ?? 0;

  const finish = () => {
    store
      .getState()
      .finishSession()
      .catch(() => undefined);
  };

  // The last answer is written but the session is not done (a reload): it ends as G6 opens.
  const finishWritten = useEffectEvent(() => {
    if (place?.step === 'wrapUp' && place.question >= questionCount) {
      finish();
    }
  });
  useEffect(() => {
    finishWritten();
  }, []);

  if (data === null || chapter === null || place?.step !== 'wrapUp') {
    return null;
  }
  const index = held?.question ?? place.question;
  const question = chapter.questions[index];
  if (question === undefined) {
    return <SessionLayout title={tr.session.steps.wrapUp} companion={{ expression: 'think' }} />;
  }
  const last = index === questionCount - 1;

  const answer = (option: number) => {
    const correct = option === question.correctIndex;
    setHeld({ question: index, correct });
    store
      .getState()
      .answerQuestion(option)
      .then(
        (result) => {
          if (result === null) {
            setHeld(null);
          } else if (correct) {
            if (last) {
              finish();
            } else {
              setHeld(null);
            }
          }
        },
        () => {
          setHeld(null);
        },
      );
  };

  const goOn = () => {
    if (last) {
      finish();
    } else {
      setHeld(null);
    }
  };

  return (
    <QuestionStep
      key={index}
      question={question}
      number={index + 1}
      total={questionCount}
      chapter={chapter}
      pageTitle={tr.page.title(data.series.title, chapter.number)}
      held={held}
      onAnswer={answer}
      onGoOn={goOn}
    />
  );
}

interface QuestionStepProps {
  question: Question;
  number: number;
  total: number;
  chapter: Chapter;
  pageTitle: string;
  held: HeldAnswer | null;
  /** The chosen option's index in the content's order. */
  onAnswer: (option: number) => void;
  onGoOn: () => void;
}

/** One question; a new question is a new shuffle, so the page keys this by the question. */
function QuestionStep({
  question,
  number,
  total,
  chapter,
  pageTitle,
  held,
  onAnswer,
  onGoOn,
}: QuestionStepProps) {
  const devices = useSessionDevices();
  const name = useId();
  const [order] = useState(() => shuffledOrder(question.options.length, devices.random));
  const [chosen, setChosen] = useState<number | null>(null);
  const [textOpen, setTextOpen] = useState(false);
  // After a wrong answer Tıkır marks the right option (D14).
  const marking = held !== null && !held.correct;

  const submit = () => {
    if (chosen !== null && held === null) {
      onAnswer(chosen);
    }
  };

  return (
    <SessionLayout
      title={tr.session.steps.wrapUp}
      chip={<Chip tone="saffronLight">{tr.wrapUp.questionCount(total)}</Chip>}
      companion={{
        expression: 'think',
        bubble: marking ? tr.wrapUp.correctBubble : tr.wrapUp.bubble,
      }}
      controls={
        <div className={styles.action}>
          {marking ? (
            <Button size="large" icon="right" fullWidth onClick={onGoOn}>
              {tr.wrapUp.next}
            </Button>
          ) : (
            <Button
              size="large"
              icon="check"
              fullWidth
              disabled={chosen === null || held !== null}
              onClick={submit}
            >
              {tr.wrapUp.submit}
            </Button>
          )}
        </div>
      }
    >
      <section className={styles.card}>
        <p className={styles.counter}>{tr.wrapUp.counter(number, total)}</p>
        <fieldset className={styles.question} disabled={held !== null}>
          <legend className={styles.prompt}>{question.prompt}</legend>
          {order.map((option) => {
            const right = marking && option === question.correctIndex;
            const checked = marking ? right : chosen === option;
            return (
              <label key={option} className={styles.option} data-checked={checked ? '' : undefined}>
                <input
                  type="radio"
                  className={styles.radio}
                  name={name}
                  checked={checked}
                  onChange={() => {
                    setChosen(option);
                  }}
                />
                <span className={styles.optionText}>{question.options[option]}</span>
                {right && (
                  // TODO(design): the marked right option is not drawn.
                  <span className={styles.rightMark}>
                    <Icon name="check" size={20} strokeWidth={3} />
                    {tr.wrapUp.correctLabel}
                  </span>
                )}
              </label>
            );
          })}
        </fieldset>
        <button
          type="button"
          className={styles.back}
          onClick={() => {
            setTextOpen(true);
          }}
        >
          <Icon name="text" size={20} />
          <span>{tr.wrapUp.backToText}</span>
        </button>
      </section>
      <TextLayer
        open={textOpen}
        title={pageTitle}
        chapter={chapter}
        onClose={() => {
          setTextOpen(false);
        }}
      />
    </SessionLayout>
  );
}
