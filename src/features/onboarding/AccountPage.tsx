// K1 Veli hesabı (docs/ekranlar.md, K1; docs/planlar/faz-3.md, kararlar 9–11): the parent's e-mail,
// a password that is only checked, never kept, the voice consent (unticked by default) and the
// weekly e-mail. The account stays on the device until the back end comes.
import { type SyntheticEvent, useId, useRef, useState } from 'react';
import { Button } from '../../components/Button/Button';
import { Checkbox } from '../../components/Checkbox/Checkbox';
import { Dialog } from '../../components/Dialog/Dialog';
import { Icon } from '../../components/Icon/Icon';
import { TextField } from '../../components/TextField/TextField';
import { tr } from '../../i18n/tr';
import { useSessionStore } from '../session/sessionContext';
import styles from './AccountPage.module.css';
import { OnboardingLayout } from './OnboardingLayout';

const copy = tr.onboarding.account;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const passwordMinLength = 8;

export function AccountPage() {
  const store = useSessionStore();
  const formId = useId();
  const [email, setEmail] = useState('');
  // Only checked for its length: never stored, never sent (docs/ekranlar.md, K1).
  const [password, setPassword] = useState('');
  const [consent, setConsent] = useState(false);
  const [weeklyEmail, setWeeklyEmail] = useState(false);
  const [tried, setTried] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const emailField = useRef<HTMLInputElement>(null);
  const passwordField = useRef<HTMLInputElement>(null);

  const emailValid = emailPattern.test(email.trim());
  const passwordValid = password.length >= passwordMinLength;

  const submit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    setTried(true);
    if (!emailValid) {
      emailField.current?.focus();
      return;
    }
    if (!passwordValid) {
      passwordField.current?.focus();
      return;
    }
    store
      .getState()
      .createAccount({ email, voiceProcessing: consent, weeklyEmail })
      .catch(() => undefined);
  };

  return (
    <OnboardingLayout
      step={1}
      title={copy.title}
      lead={copy.lead}
      companion={{ bubble: copy.bubble }}
      action={
        <Button type="submit" form={formId} size="large" icon="right">
          {copy.submit}
        </Button>
      }
    >
      <form id={formId} className={styles.form} noValidate onSubmit={submit}>
        <div className={styles.fields}>
          <TextField
            ref={emailField}
            label={copy.email}
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder={copy.emailPlaceholder}
            value={email}
            onChange={setEmail}
            error={tried && !emailValid ? copy.emailError : undefined}
          />
          <TextField
            ref={passwordField}
            label={copy.password}
            type="password"
            autoComplete="new-password"
            placeholder={copy.passwordPlaceholder}
            value={password}
            onChange={setPassword}
            error={tried && !passwordValid ? copy.passwordError : undefined}
          />
        </div>
        <div className={styles.consent}>
          <Checkbox label={copy.consent} checked={consent} onChange={setConsent} />
          <p className={styles.note}>{copy.consentNote}</p>
          {!consent && (
            // TODO(design): the note on the unconsented account is not drawn.
            <p className={styles.noConsent}>{copy.noConsentNote}</p>
          )}
          <button
            type="button"
            className={styles.infoLink}
            onClick={() => {
              setInfoOpen(true);
            }}
          >
            <Icon name="shield" size={20} />
            <span>{copy.voiceInfo}</span>
          </button>
        </div>
        <Checkbox label={copy.weeklyEmail} checked={weeklyEmail} onChange={setWeeklyEmail} />
      </form>
      <Dialog
        open={infoOpen}
        title={copy.voiceInfo}
        onClose={() => {
          setInfoOpen(false);
        }}
        actions={
          <Button
            onClick={() => {
              setInfoOpen(false);
            }}
          >
            {copy.close}
          </Button>
        }
      >
        <p className={styles.infoBody}>{copy.voiceInfoBody}</p>
      </Dialog>
    </OnboardingLayout>
  );
}
