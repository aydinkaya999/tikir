// K2 Okuyucu profili (docs/ekranlar.md, K2; docs/planlar/faz-3.md, kararlar 12–13): the reader's
// name, grade and up to three interests. "Devam et" writes the reader with the grade's reading
// style; with the parent's consent its tap opens the microphone for the level check (T22).
import { type SyntheticEvent, useId, useRef, useState } from 'react';
import { Button } from '../../components/Button/Button';
import { ChoicePills } from '../../components/ChoicePills/ChoicePills';
import { TextField } from '../../components/TextField/TextField';
import { readerInterestLimit, readerNameMaxLength } from '../../domain/config';
import type { Grade } from '../../domain/types';
import { tr } from '../../i18n/tr';
import { useMicrophone } from '../reading/useMicrophone';
import { useSession, useSessionDevices, useSessionStore } from '../session/sessionContext';
import { OnboardingLayout } from './OnboardingLayout';
import styles from './ReaderPage.module.css';

const copy = tr.onboarding.reader;
const grades: readonly Grade[] = [1, 2, 3, 4];
const gradeOptions = grades.map((grade) => ({
  value: String(grade),
  label: copy.gradeOption(grade),
}));
const interestOptions = copy.interestOptions.map((interest) => ({
  value: interest,
  label: interest,
}));

export function ReaderPage() {
  const store = useSessionStore();
  const consent = useSession((state) => state.setup?.parent?.consent.voiceProcessing ?? false);
  const { audio } = useSessionDevices();
  const microphone = useMicrophone(audio, consent);
  const formId = useId();
  const [name, setName] = useState('');
  const [grade, setGrade] = useState<Grade | null>(null);
  const [interests, setInterests] = useState<string[]>([]);
  const [tried, setTried] = useState(false);
  const nameField = useRef<HTMLInputElement>(null);
  const gradeField = useRef<HTMLDivElement>(null);

  const nameValid = name.trim() !== '';

  const submit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    setTried(true);
    if (!nameValid) {
      nameField.current?.focus();
      return;
    }
    if (grade === null) {
      gradeField.current?.querySelector('input')?.focus();
      return;
    }
    // The tap that leads into a listening step opens the microphone (docs/kararlar.md T22);
    // without the consent it stays closed and the level check is skipped.
    microphone.start();
    store
      .getState()
      .saveReader({ name, grade, interests })
      .catch(() => undefined);
  };

  return (
    <OnboardingLayout
      step={2}
      title={copy.title}
      lead={copy.lead}
      companion={{ expression: 'happy', bubble: copy.bubble }}
      action={
        <Button type="submit" form={formId} size="large" icon="right">
          {copy.submit}
        </Button>
      }
    >
      <form id={formId} className={styles.form} noValidate onSubmit={submit}>
        <TextField
          ref={nameField}
          label={copy.name}
          placeholder={copy.namePlaceholder}
          maxLength={readerNameMaxLength}
          autoComplete="off"
          value={name}
          onChange={setName}
          error={tried && !nameValid ? copy.nameError : undefined}
        />
        <div ref={gradeField}>
          <ChoicePills
            label={copy.grade}
            options={gradeOptions}
            mode="single"
            value={grade === null ? [] : [String(grade)]}
            onChange={([chosen]) => {
              setGrade(grades.find((each) => String(each) === chosen) ?? null);
            }}
            error={tried && grade === null ? copy.gradeError : undefined}
          />
        </div>
        <ChoicePills
          label={copy.interests}
          options={interestOptions}
          mode="multiple"
          max={readerInterestLimit}
          counter={copy.interestCounter(interests.length, readerInterestLimit)}
          value={interests}
          onChange={setInterests}
        />
      </form>
    </OnboardingLayout>
  );
}
