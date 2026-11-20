// The parent gate (docs/ekranlar.md, "Tasarımı olmayan durumlar"; docs/kararlar.md P11;
// docs/planlar/faz-3.md, kararlar 25–26): a full-screen question in front of the parent area,
// which is not drawn until the question is answered. It stays open while the parent moves inside
// the area. TODO(design)
import { type SyntheticEvent, useEffect, useRef, useState } from 'react';
import { Link, Outlet } from 'react-router';
import { Button } from '../../components/Button/Button';
import { Icon } from '../../components/Icon/Icon';
import { TextField } from '../../components/TextField/TextField';
import { gateQuestion, isGateAnswer } from '../../domain/parentGate';
import { tr } from '../../i18n/tr';
import { childPaths } from '../session/paths';
import { useSessionDevices } from '../session/sessionContext';
import styles from './ParentGate.module.css';
import {
  endGateWait,
  gateOpenedForDevelopment,
  gateWaitLeft,
  missGate,
  passGate,
} from './parentGateState';

const copy = tr.parentGate;

/** The parent routes' layout: the gate until it is opened, then the area. */
export function ParentGate() {
  const [open, setOpen] = useState(gateOpenedForDevelopment);
  if (open) {
    return <Outlet />;
  }
  return (
    <GateScreen
      onOpen={() => {
        setOpen(true);
      }}
    />
  );
}

function GateScreen({ onOpen }: { onOpen: () => void }) {
  const { random } = useSessionDevices();
  const [question, setQuestion] = useState(() => gateQuestion(random));
  const [answer, setAnswer] = useState('');
  const [missed, setMissed] = useState(false);
  const [waitLeft, setWaitLeft] = useState(() => gateWaitLeft(Date.now()));
  const field = useRef<HTMLInputElement>(null);
  const waiting = waitLeft > 0;

  // The wait counts down by the second; at its end a new question comes.
  useEffect(() => {
    if (!waiting) {
      return undefined;
    }
    const timer = setInterval(() => {
      const left = gateWaitLeft(Date.now());
      setWaitLeft(left);
      if (left === 0) {
        endGateWait();
        setQuestion(gateQuestion(random));
      }
    }, 1000);
    return () => {
      clearInterval(timer);
    };
  }, [waiting, random]);

  const submit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (waiting) {
      return;
    }
    if (isGateAnswer(question, answer)) {
      passGate();
      onOpen();
      return;
    }
    setAnswer('');
    // The count lives in the tab: leaving the gate or reloading does not start it again.
    const now = Date.now();
    if (missGate(now)) {
      setWaitLeft(gateWaitLeft(now));
      setMissed(false);
      return;
    }
    setMissed(true);
    field.current?.focus();
  };

  return (
    <main className={styles.gate}>
      <div className={styles.panel}>
        <div className={styles.head}>
          <h1 className={styles.title}>{copy.title}</h1>
          <p className={styles.lead}>{copy.lead}</p>
        </div>
        <form className={styles.form} noValidate onSubmit={submit}>
          <p className={styles.question}>{copy.question(question.a, question.b)}</p>
          <TextField
            ref={field}
            label={copy.answer}
            inputMode="numeric"
            autoComplete="off"
            value={answer}
            onChange={setAnswer}
            disabled={waiting}
            error={missed ? copy.wrong : undefined}
          />
          <Button type="submit" size="large" disabled={waiting}>
            {copy.enter}
          </Button>
          {waiting && (
            <p className={styles.wait} role="status">
              {copy.wait(Math.ceil(waitLeft / 1000))}
            </p>
          )}
        </form>
        <Link to={childPaths.road} className={styles.back}>
          <Icon name="left" size={20} />
          <span>{copy.back}</span>
        </Link>
      </div>
    </main>
  );
}
